import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { chunkText } from './chunker.js';
import logger from './logger.js';

export const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: 'text-embedding-004',
});

/**
 * Creates an in-memory vector store for candidate resume raw text.
 * @param {string} rawText - Raw text of the resume
 * @returns {Promise<MemoryVectorStore|null>} MemoryVectorStore instance or null if rawText is empty
 */
export async function createResumeVectorStore(rawText) {
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return null;
    }

    const chunks = await chunkText(rawText);
    if (!chunks || chunks.length === 0) {
        return null;
    }

    const metadatas = chunks.map((_, index) => ({ chunkIndex: index }));
    const vectorStore = await MemoryVectorStore.fromTexts(chunks, metadatas, embeddings);
    return vectorStore;
}

/**
 * Retrieves top-k most relevant resume chunks for a given requirement query.
 * @param {MemoryVectorStore|null} vectorStore - Vector store instance
 * @param {string} query - Requirement or skill name
 * @param {number} [k=3] - Number of top chunks to retrieve
 * @returns {Promise<string[]>} Array of retrieved chunk strings
 */
export async function retrieveTopKChunks(vectorStore, query, k = 3) {
    if (!vectorStore || !query) {
        return [];
    }

    try {
        const results = await vectorStore.similaritySearch(query, k);
        return results.map((doc) => doc.pageContent);
    } catch (err) {
        logger.error({ err, query }, 'Failed similarity search in resume vector store');
        return [];
    }
}
