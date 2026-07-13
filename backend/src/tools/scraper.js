import axios from 'axios';
import JobDescriptionModel from '../models/job_description.model.js';
import logger from '../utils/logger.js';
import { getStructuredModel } from '../config/llm.js';
import { jobDescriptionSchema } from '../schemas/job_description.schema.js';
import { getScrapeJobDescriptionPrompt } from '../prompts/prompts.js';

const activeScrapes = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

/** Scrapes and persists a job description from a URL, deduping parallel requests and caching for 24h. */
export async function scrapeAndSaveJobDescription(jobDescriptionUrl) {
    const url = jobDescriptionUrl.trim();

    if (activeScrapes.has(url)) {
        logger.info({ url }, '[Agent] Waiting for parallel scrape to finish');
        try {
            return await activeScrapes.get(url);
        } catch (err) {
            logger.error({ url, err: err.message }, '[Agent] Parallel job description scrape failed');
            throw err;
        }
    }

    const doc = await JobDescriptionModel.findOne({ url }).lean();
    if (doc && Date.now() - new Date(doc.createdAt).getTime() < CACHE_TTL_MS) {
        return doc;
    }

    const scrapePromise = scrapeJobDescription(url, doc);
    activeScrapes.set(url, scrapePromise);

    try {
        return await scrapePromise;
    } catch (err) {
        logger.error({ url, err: err.message }, '[Agent] Job description scrape failed');
        throw err;
    } finally {
        activeScrapes.delete(url);
    }
}