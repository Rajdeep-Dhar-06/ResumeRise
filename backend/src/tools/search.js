import LearningResourceModel from '../models/learning_resource.model.js';
import logger from '../utils/logger.js';

// In-memory registry of active Tavily search promises to prevent parallel search race conditions/rate-limiting
const activeSearches = new Map();

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
 * Looks up cached resources for a normalized term.
 * @param {string} normalized
 * @returns {Promise<Array|null>} resources array, or null on cache miss/failure
 */
async function getCachedResources(normalized) {
    try {
        const cached = await LearningResourceModel.findOne({ requirementName: normalized }).lean();
        return cached?.resources?.length > 0 ? cached.resources : null;
    } catch (dbErr) {
        logger.warn({ term: normalized, err: dbErr.message }, '[Agent] Failed to retrieve cached learning resources');
        return null;
    }
}

/**
 * Runs a fresh Tavily search for a term and persists the results to the cache.
 * @param {string} term - Original (unnormalized) term, used in the query and fallback title
 * @param {string} normalized - Lowercased/trimmed cache key
 * @param {Object} searchTool - Instantiated Tavily search tool
 * @returns {Promise<Array>} resources array (empty if nothing found)
 */
async function searchAndCacheResources(term, normalized, searchTool) {
    logger.info({ term }, '[Agent] Executing learning-resource search via Tavily');
    const res = await searchTool.invoke({ query: `${term} tutorial free developer documentation` });
    const results = Array.isArray(res?.results) ? res.results : [];

    if (results.length === 0) return [];

    const resources = results.map(r => ({
        resourceTitle: r.title || `${term} Tutorial`,
        resourceUrl: r.url,
        resourceSnippet: r.content || ''
    }));

    // Await the write so it's fully cached by the time any waiting parallel requests resolve
    await LearningResourceModel.findOneAndUpdate(
        { requirementName: normalized },
        { requirementName: normalized, resources },
        { upsert: true, returnDocument: 'after' }
    );

    return resources;
}

/**
 * Fetches or searches learning resources for a single skill/concept gap.
 * @param {string} term - The skill/concept gap to search for
 * @param {Object} searchTool - Instantiated Tavily search tool
 * @returns {Promise<string|null>} Formatted resources string, or null if none found
 */
export async function getResourceForTerm(term, searchTool) {
    const normalized = term.toLowerCase().trim();

    // 1. If another request is already searching this term, piggyback on its result
    if (activeSearches.has(normalized)) {
        logger.info({ term }, '[Agent] Waiting for parallel web search for this term to finish');
        try {
            const resources = await activeSearches.get(normalized);
            return resources.length > 0 ? formatResources(term, resources) : null;
        } catch (err) {
            logger.error({ term, err: err.message }, '[Agent] Parallel Tavily web search failed');
            return null;
        }
    }

    // 2. Check MongoDB cache
    const cached = await getCachedResources(normalized);
    if (cached) {
        logger.info({ term }, '[Agent] Retrieved cached learning resources from database');
        return formatResources(term, cached);
    }

    // 3. Kick off a fresh search, registering the promise so parallel callers can await it
    const searchPromise = searchAndCacheResources(term, normalized, searchTool);
    activeSearches.set(normalized, searchPromise);

    try {
        const resources = await searchPromise;
        return resources.length > 0 ? formatResources(term, resources) : null;
    } catch (err) {
        logger.error({ term, err: err.message }, '[Agent] Tavily web search failed');
        return null;
    } finally {
        activeSearches.delete(normalized);
    }
}