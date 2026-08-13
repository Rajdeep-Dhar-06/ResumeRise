import logger from '../utils/logger.js';
import { parseAndSaveResume } from '../tools/parser.js';
import { scrapeAndSaveJobDescription } from '../tools/scraper.js';

/**
 * Step 1: Ingest and extract structured text from candidate resume and job description URL.
 */
export async function ingestDocuments(pipelineState) {
  const {
    userId,
    resumeBuffer,
    jobDescriptionUrl,
    daysLimit = 7
  } = pipelineState;

  logger.info({ userId }, 'Ingesting resume and job description');
  
  const [resumeDoc, jobDoc] = await Promise.all([
    parseAndSaveResume(userId, resumeBuffer),
    scrapeAndSaveJobDescription(jobDescriptionUrl)
  ]);

  const rawText = resumeDoc.rawText || '';

  return {
    userId,
    resumeBuffer,
    jobDescriptionUrl,
    daysLimit,
    resumeDoc,
    jobDoc,
    resumeText: rawText
  };
}

