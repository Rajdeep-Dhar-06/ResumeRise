import logger from '../utils/logger.js';

function formatResources(term, resources) {
    const lines = resources
        .map(r => `• Title: ${r.resourceTitle}\n  Link: ${r.resourceUrl}\n  Description: ${r.resourceSnippet || ''}`)
        .join('\n\n');
    return `### Search Results for "${term}":\n${lines}\n`;
}

/** Run Tavily search */
async function performSearch(term, searchTool) {
    logger.info({ term }, '[Agent] Executing Tavily web search');
    const res = await searchTool.invoke({ query: `${term} tutorial free developer documentation` });
    const results = Array.isArray(res?.results) ? res.results : [];

    if (results.length === 0) return [];

    const resources = results.map(r => ({
        resourceTitle: r.title || `${term} Tutorial`,
        resourceUrl: r.url,
        resourceSnippet: r.content || ''
    }));

    return resources;
}

export async function getResourceForTerm(term, searchTool) {
    try {
        const resources = await performSearch(term, searchTool);
        return resources.length > 0 ? formatResources(term, resources) : null;
    } catch (err) {
        logger.error({ term, err: err.message }, '[Agent] Tavily web search failed');
        return null;
    }
}