import axios from 'axios';
import JobDescriptionModel from '../models/job_description.model.js';
import logger from '../utils/logger.js';
import { getStructuredModel } from '../config/llm.js';
import { jobDescriptionSchema } from '../schemas/job_description.schema.js';
import { getScrapeJobDescriptionPrompt } from '../prompts/prompts.js';
import { redisClient } from '../config/redis.js';

/**
 * Scrapes and extracts requirements from a job posting.
 * 
 * - Deletes the old expired MongoDB cache document if present.
 * - Scrapes page text via Jina Reader and parses via Gemini.
 * 
 * @param url - The job posting URL
 * @param staleDoc - Stale MongoDB document if invalidating cache
 */
async function scrapeJobDescription(url, staleDoc) {
    if (staleDoc) {
        logger.info({ url }, '[Agent] Cached job description expired; invalidating stale cache');
        await JobDescriptionModel.deleteOne({ _id: staleDoc._id });
    }

    logger.info({ url }, '[Agent] Fetching job webpage contents via Jina Reader');
    const headers = process.env.JINA_API_KEY ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` } : {};
    const { data } = await axios.get(`https://r.jina.ai/${url}`, { headers, timeout: 20000 });
    const rawText = data || '';

    if (rawText.length < 50) {
        throw new Error('No sufficient text content could be extracted from this URL.');
    }

    const prompt = getScrapeJobDescriptionPrompt({ rawText });
    const details = await getStructuredModel(jobDescriptionSchema).invoke(prompt);

    if (!details.technicalRequirements?.length && !details.nonTechnicalRequirements?.length) {
        throw new Error('Could not extract any skills or requirements from this job description URL.');
    }

    return JobDescriptionModel.create({
        url,
        companyName: details.companyName || 'Company',
        role: details.role || 'Job Description',
        technicalRequirements: details.technicalRequirements,
        nonTechnicalRequirements: details.nonTechnicalRequirements
    });
}

/**
 * Manages scraper caching and concurrency safety.
 * 
 * - Retrieves from Redis cache (24h TTL) if available.
 * - Acquires a Redis lock to deduplicate concurrent scrapes.
 * - Polls Redis for results if another instance is running the scrape.
 * 
 * @param jobDescriptionUrl - The job posting URL
 */
export async function scrapeAndSaveJobDescription(jobDescriptionUrl) {
    const url = jobDescriptionUrl.trim();
    const redisKey = `jd:${url}`;
    const lockKey = `lock:jd:${url}`;
    const lockTtl = 60;
    const cacheTtl = 24 * 60 * 60;

    try {
        const cachedJd = await redisClient.get(redisKey);
        if (cachedJd) {
            return JSON.parse(cachedJd);
        }
    } catch (err) {
        logger.warn({ err: err.message }, 'Failed to read job description from Redis cache');
    }

    let lockAcquired = false;
    try {
        lockAcquired = await redisClient.set(lockKey, '1', { NX: true, EX: lockTtl });
    } catch (err) {
        logger.warn({ err: err.message }, 'Failed to acquire scraper lock from Redis');
    }


    if (!lockAcquired) {
        for (let attempt = 1; attempt <= 30; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const cachedJd = await redisClient.get(redisKey);
                if (cachedJd) {
                    return JSON.parse(cachedJd);
                }
            } catch (err) {
                logger.warn({ err: err.message }, 'Failed to read from Redis during polling');
            }
        }
    }

    const doc = await JobDescriptionModel.findOne({ url }).lean();
    if (doc && Date.now() - new Date(doc.createdAt).getTime() < cacheTtl * 1000) {
        await redisClient.set(redisKey, JSON.stringify(doc), { EX: cacheTtl }).catch(() => { });
        return doc;
    }

    try {
        const result = await scrapeJobDescription(url, doc);

        try {
            await redisClient.set(redisKey, JSON.stringify(result), { EX: cacheTtl });
        } catch (err) {
            logger.warn({ err: err.message }, 'Failed to cache job description in Redis');
        }

        return result;
    } catch (err) {
        logger.error({ url, err: err.message }, '[Agent] Job description scrape failed');
        throw err;
    } finally {
        if (lockAcquired) {
            await redisClient.del(lockKey).catch(() => { });
        }
    }
}