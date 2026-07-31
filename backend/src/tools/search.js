import crypto from 'crypto';

import logger from '../utils/logger.js';
import { redisClient } from '../config/redis.js';
import { acquireLock, releaseLock, delayWithJitter } from '../utils/lock.js';

const CACHE_TTL = 48 * 60 * 60; // 48 Hours

function formatResources(term, resources) {
    const lines = resources
        .map(r => `• Title: ${r.resourceTitle}\n  Link: ${r.resourceUrl}\n  Description: ${r.resourceSnippet || ''}`)
        .join('\n\n');
    return `### Search Results for "${term}":\n${lines}\n`;
}

/** Read from Redis cache */
async function getRedisCache(key) {
    try {
        const cached = await redisClient.get(`search:${key}`);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}



/** Run Tavily search and save to Redis + MongoDB */
async function searchAndCache(term, key, searchTool) {
    logger.info({ term }, '[Agent] Executing Tavily web search');
    const res = await searchTool.invoke({ query: `${term} tutorial free developer documentation` });
    const results = Array.isArray(res?.results) ? res.results : [];

    if (results.length === 0) return [];

    const resources = results.map(r => ({
        resourceTitle: r.title || `${term} Tutorial`,
        resourceUrl: r.url,
        resourceSnippet: r.content || ''
    }));

    await redisClient.set(`search:${key}`, JSON.stringify(resources), 'EX', CACHE_TTL).catch(() => { });

    return resources;
}

export async function getResourceForTerm(term, searchTool) {
    const key = term.toLowerCase().trim();
    const lockKey = `lock:search:${key}`;
    const lockValue = crypto.randomUUID();

    // 1. Check Redis first
    let resources = await getRedisCache(key);
    if (resources) return formatResources(term, resources);

    // 2. Attempt lock acquisition
    const lockAcquired = await acquireLock(lockKey, lockValue, 30);

    // 3. If locked, poll REDIS with backoff
    if (!lockAcquired) {
        for (let attempt = 1; attempt <= 15; attempt++) {
            await delayWithJitter(attempt);
            resources = await getRedisCache(key);
            if (resources) return formatResources(term, resources);
        }
    }

    // 5. Execute Tavily search if lock acquired or polling/DB fallback missed
    try {
        resources = await searchAndCache(term, key, searchTool);
        return resources.length > 0 ? formatResources(term, resources) : null;
    } catch (err) {
        logger.error({ term, err: err.message }, '[Agent] Tavily web search failed');
        return null;
    } finally {
        if (lockAcquired) {
            await releaseLock(lockKey, lockValue);
        }
    }
}