import LearningResourceModel from '../models/learning_resource.model.js';
import logger from '../utils/logger.js';
import { redisClient } from '../config/redis.js';

/**
 * Formats a resources array into the display string returned to the agent.
 * @param {string} term - Original (unnormalized) term, used in the header
 * @param {Array<{resourceTitle: string, resourceUrl: string, resourceSnippet: string}>} resources
 * @returns {string}
 */
function formatResources(term, resources) {
    const lines = resources
        .map(r => `• Title: ${r.resourceTitle}\n  Link: ${r.resourceUrl}\n  Description: ${r.resourceSnippet || ''}`)
        .join('\n\n');
    return `### Search Results for "${term}":\n${lines}\n`;
}

/**
 * Looks up cached resources for a concept gap.
 * 
 * - Checks Redis first for hot cache.
 * - Queries MongoDB and warms Redis on miss.
 * 
 * @param requirementName - The standardized skill gap name
 */
async function getCachedResources(requirementName) {
    const redisKey = `search:${requirementName}`;

    try {
        const cachedResources = await redisClient.get(redisKey);
        if (cachedResources) {
            logger.info({ term: requirementName }, '[Agent] Retrieved cached learning resources from Redis');
            return JSON.parse(cachedResources);
        }
    } catch (error) {
        logger.warn({ term: requirementName, err: error.message }, '[Agent] Failed to retrieve cached learning resources');
    }

    try {
        const cached = await LearningResourceModel.findOne({ requirementName }).lean();

        if (cached?.resources?.length > 0) {
            logger.info({ term: requirementName }, '[Agent] Retrieved cached learning resources from MongoDB');
            await redisClient.set(redisKey, JSON.stringify(cached.resources), { EX: 48 * 60 * 60 }).catch(() => { });
            return cached.resources;
        } else {
            return null;
        }
    } catch (dbErr) {
        logger.warn({ term: requirementName, err: dbErr.message }, '[Agent] Failed to retrieve cached learning resources');
        return null;
    }
}

/**
 * Runs a Tavily web search and caches the result.
 * 
 * - Fetches free developer documentation and tutorials.
 * - Caches in Redis for 48 hours and MongoDB permanently.
 * 
 * @param term - The raw skill gap name
 * @param requirementName - The standardized cache key
 * @param searchTool - Instantiated search utility
 */
async function searchAndCacheResources(term, requirementName, searchTool) {
    logger.info({ term }, '[Agent] Executing learning-resource search via Tavily');
    const res = await searchTool.invoke({ query: `${term} tutorial free developer documentation` });
    const results = Array.isArray(res?.results) ? res.results : [];

    if (results.length === 0) return [];

    const resources = results.map(r => ({
        resourceTitle: r.title || `${term} Tutorial`,
        resourceUrl: r.url,
        resourceSnippet: r.content || ''
    }));

    try {
        await redisClient.set(`search:${requirementName}`, JSON.stringify(resources), { EX: 48 * 60 * 60 });
    } catch (err) {
        logger.warn({ err: err.message }, 'Failed to save search results to Redis cache');
    }

    await LearningResourceModel.findOneAndUpdate(
        { requirementName },
        { requirementName, resources },
        { upsert: true, returnDocument: 'after' }
    );

    return resources;
}

/**
 * Fetches learning resources for a skill gap.
 * 
 * - Uses a Redis distributed lock to avoid parallel searches.
 * - Polls Redis cache if another instance is already searching.
 * 
 * @param term - The skill gap name
 * @param searchTool - Instantiated search utility
 */
export async function getResourceForTerm(term, searchTool) {
    const requirementName = term.toLowerCase().trim();
    const lockKey = `lock:search:${requirementName}`;
    const lockTtl = 30;

    let cachedResources = await getCachedResources(requirementName);
    if (cachedResources) {
        return formatResources(term, cachedResources);
    }

    let lockAcquired = false;
    try {
        lockAcquired = await redisClient.set(lockKey, '1', { NX: true, EX: lockTtl });
    } catch (err) {
        logger.warn({ err: err.message }, 'Failed to acquire search lock from Redis');
    }
    if (!lockAcquired) {
        const resourceKey = `search:${requirementName}`;

        for (let attempt = 1; attempt <= 10; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const cachedResources = await redisClient.get(resourceKey);
                if (cachedResources) {
                    return formatResources(term, JSON.parse(cachedResources));
                }
            } catch (err) {
                logger.warn({ err: err.message }, 'Failed to read from Redis during polling');
            }
        }
    }

    try {
        const resources = await searchAndCacheResources(term, requirementName, searchTool);
        return resources.length > 0 ? formatResources(term, resources) : null;
    } catch (err) {
        logger.error({ term, err: err.message }, '[Agent] Tavily web search failed');
        return null;
    } finally {
        if (lockAcquired) {
            await redisClient.del(lockKey).catch(() => { });
        }
    }
}