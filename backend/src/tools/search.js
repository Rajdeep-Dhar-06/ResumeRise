import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { TavilySearch } from '@langchain/tavily';
import logger from '../utils/logger.js';

/**
 * LangChain Tool for searching developer tutorials and documentation via Tavily.
 */
export const searchTool = tool(
    async ({ query }) => {
        logger.info({ query }, 'Performing web search for candidate gap');

        try {
            const tavilyClient = new TavilySearch({ maxResults: 3 });
            const res = await tavilyClient.invoke({ query: `${query} tutorial developer guide documentation` });
            const results = res?.results ?? [];

            if (results.length === 0) {
                return `No search results found for term "${query}".`;
            }

            return results
                .map((r) => `Title: ${r.title || query}\nURL: ${r.url}\nSnippet: ${r.content || ''}`)
                .join('\n\n');
        } catch (err) {
            logger.error({ err: err.message, query }, '[Agentic Tool] Tavily web search error');
            return `Search error for "${query}": ${err.message}`;
        }
    },
    {
        name: 'tavily_web_search',
        description: 'Searches the web for high-quality developer tutorials, guides, and documentation for technical skill gaps.',
        schema: z.object({
            query: z.string().describe('The technical skill or technology term to search for study guides and documentation'),
        }),
    }
);

/**
 * Helper fallback for direct single-term resource queries
 */
export async function getResourceForTerm(term) {
    try {
        const result = await searchTool.invoke({ query: term });
        return result;
    } catch (err) {
        logger.error({ term, err: err.message }, '[Agent] getResourceForTerm failed');
        return null;
    }
}