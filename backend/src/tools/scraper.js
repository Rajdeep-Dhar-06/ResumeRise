import axios from 'axios';
import crypto from 'crypto';
import JobDescriptionModel from '../models/job_description.model.js';
import logger from '../utils/logger.js';
import { getStructuredModel } from '../config/llm.js';
import { jobDescriptionSchema } from '../schemas/job_description.schema.js';
import { getScrapeJobDescriptionPrompt } from '../prompts/prompts.js';
import { redisClient } from '../config/redis.js';
import { acquireLock, releaseLock, delayWithJitter } from '../utils/lock.js';

/**
 * Scrapes and extracts requirements from a job posting.
 * 
 * - Deletes the old expired MongoDB cache document if present.
 * - Scrapes page text via Jina Reader and parses via Gemini.
 * 
 * @param url - The job posting URL
 * @param staleDoc - Stale MongoDB document if invalidating cache
 */
async function scrapeJobDescription(url) {
    logger.info({ url }, '[Agent] Fetching job webpage contents via Jina Reader');
    const headers = process.env.JINA_API_KEY ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` } : {};
    const { data } = await axios.get(`https://r.jina.ai/${url}`, { headers, timeout: 20000 });
    const rawText = typeof data === 'string' ? data : '';

    if (rawText.length < 50) {
        throw new Error('No sufficient text content could be extracted from this URL.');
    }

    const prompt = getScrapeJobDescriptionPrompt({ rawText });
    const { companyName, role, technicalRequirements, nonTechnicalRequirements } = await getStructuredModel(jobDescriptionSchema).invoke(prompt);

    if (!technicalRequirements?.length && !nonTechnicalRequirements?.length) {
        throw new Error('Could not extract any skills or requirements from this job description URL.');
    }

    return await JobDescriptionModel.findOneAndUpdate(
        { url },
        {
            url,
            companyName,
            role,
            technicalRequirements,
            nonTechnicalRequirements,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
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
    const lockValue = crypto.randomUUID();
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

    const lockAcquired = await acquireLock(lockKey, lockValue, lockTtl);

    if (!lockAcquired) {
        for (let attempt = 1; attempt <= 15; attempt++) {
            await delayWithJitter(attempt);

            try {
                const cachedJd = await redisClient.get(redisKey);
                if (cachedJd) {
                    return JSON.parse(cachedJd);
                }
            } catch (err) {
                logger.warn({ err: err.message }, 'Failed to read from Redis during polling');
                throw err;
            }
        }
    }

    const doc = await JobDescriptionModel.findOne({ url }).lean();
    if (doc && Date.now() - new Date(doc.createdAt).getTime() < cacheTtl * 1000) {
        await redisClient.set(redisKey, JSON.stringify(doc), 'EX', cacheTtl).catch(() => { });
        return doc;
    }


    try {
        const result = await scrapeJobDescription(url);

        try {
            await redisClient.set(redisKey, JSON.stringify(result), 'EX', cacheTtl);
        } catch (err) {
            logger.warn({ err: err.message }, 'Failed to cache job description in Redis');
        }

        return result;
    } catch (err) {
        logger.error({ url, err: err.message }, '[Agent] Job description scrape failed');
        throw err;
    } finally {
        if (lockAcquired) {
            await releaseLock(lockKey, lockValue);
        }
    }
}