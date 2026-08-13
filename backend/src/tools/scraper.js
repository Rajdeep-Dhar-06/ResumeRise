import axios from 'axios';

import JobDescriptionModel from '../models/job_description.model.js';
import logger from '../utils/logger.js';
import { getStructuredModel } from '../config/llm.js';
import { jobDescriptionSchema } from '../schemas/job_description.schema.js';
import { getScrapeJobDescriptionPrompt } from '../prompts/prompts.js';
import { BadRequestError } from '../utils/error_handler.js';
import { SCRAPER } from '../config/constants.js';

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
    const { data } = await axios.get(`https://r.jina.ai/${url}`, { headers, timeout: SCRAPER.JINA_TIMEOUT_MS });
    const rawText = typeof data === 'string' ? data : '';

    if (rawText.length < 50) {
        throw new BadRequestError('No sufficient text content could be extracted from this URL.');
    }

    const prompt = getScrapeJobDescriptionPrompt({ rawText });
    const { companyName, role, technicalRequirements, nonTechnicalRequirements } = await getStructuredModel(jobDescriptionSchema).invoke(prompt);

    if (!technicalRequirements?.length && !nonTechnicalRequirements?.length) {
        throw new BadRequestError('Could not extract any skills or requirements from this job description URL.');
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
    );
}

/**
 * Manages scraper caching and concurrency safety.
 * 
 * - Retrieves from MongoDB cache (24h TTL) if available.
 * - Deduplicates concurrent scrapes on the same Node instance via an in-memory promise map.
 * 
 * @param jobDescriptionUrl - The job posting URL
 */
const scrapePromises = new Map();

export async function scrapeAndSaveJobDescription(jobDescriptionUrl) {
    const url = jobDescriptionUrl.trim();
    const cacheTtlMs = SCRAPER.CACHE_TTL_MS;

    const doc = await JobDescriptionModel.findOne({ url });
    if (doc && Date.now() - new Date(doc.createdAt).getTime() < cacheTtlMs) {
        return doc;
    }

    if (scrapePromises.has(url)) {
        return scrapePromises.get(url);
    }

    const scrapePromise = (async () => {
        try {
            return await scrapeJobDescription(url);
        } catch (err) {
            logger.error({ url, err: err.message }, '[Agent] Job description scrape failed');
            throw err;
        } finally {
            scrapePromises.delete(url);
        }
    })();

    scrapePromises.set(url, scrapePromise);
    return scrapePromise;
}