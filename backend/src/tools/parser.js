import { createHash } from 'crypto';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import resumeModel from '../models/resume.model.js';
import { anonymizeResume } from '../utils/anonymizer.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/error_handler.js';

/**
 * Helper to parse, anonymize and save a candidate's resume PDF
 * @param {string} userId - ID of the candidate
 * @param {Buffer} resumeBuffer - Raw PDF file buffer
 * @returns {Promise<Object>} - Saved Resume Mongoose document
 */
export async function parseAndSaveResume(userId, resumeBuffer) {
    const contentHash = createHash('sha256').update(resumeBuffer).digest('hex');

    let doc = await resumeModel.findOne({ user: userId, contentHash });

    if (!doc) {
        logger.info({ userId }, '[Agent] Parsing candidate resume PDF');
        let parsedText = '';
        const blob = new Blob([resumeBuffer]);
        const loader = new PDFLoader(blob);
        const docs = await loader.load();
        parsedText = docs.map((doc) => doc.pageContent).join('\n');

        if (!parsedText.trim()) {
            throw new BadRequestError('The uploaded resume PDF does not contain any extractable text.');
        }

        const anonymizedText = anonymizeResume(parsedText);

        const newDoc = await resumeModel.create({
            user: userId,
            contentHash,
            rawText: anonymizedText,
        });

        doc = newDoc.toObject(); //convert to plain JS object
    } else {
        doc = doc.toObject ? doc.toObject() : doc;
    }
    return doc;
}

