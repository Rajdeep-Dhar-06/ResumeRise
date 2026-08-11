import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Splits candidate resume raw text into semantic chunks for vector embeddings and similarity search.
 * @param {string} text - Raw text to split into chunks
 * @param {Object} [options] - Splitter configuration options
 * @param {number} [options.chunkSize=500] - Target maximum chunk size in characters
 * @param {number} [options.chunkOverlap=100] - Overlap between adjacent chunks in characters
 * @returns {Promise<string[]>} Array of non-empty text chunks
 */
export async function chunkText(text, options = {}) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const { chunkSize = 500, chunkOverlap = 100 } = options;

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const docs = await splitter.createDocuments([text]);
    return docs.map((doc) => doc.pageContent.trim()).filter(Boolean);
}
