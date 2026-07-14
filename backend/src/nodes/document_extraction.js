import logger from '../utils/logger.js';
import { parseAndSaveResume } from '../tools/parser.js';
import { scrapeAndSaveJobDescription } from '../tools/scraper.js';

/**
 * Node to concurrently ingest the candidate's resume and scrape the target JD webpage.
 * Returns raw document fields as flat state keys for downstream nodes.
 */
export async function documentExtraction(state) {
    const {
        userId,
        resumeBuffer,
        jobDescriptionUrl
    } = state;

    logger.info({ userId }, '[Agent] Commencing concurrent resume and job description ingestion');

    // Concurrently execute parsing and scraping helpers from tools
    const [resumeDoc, jobDoc] = await Promise.all([
        parseAndSaveResume(userId, resumeBuffer),
        scrapeAndSaveJobDescription(jobDescriptionUrl)
    ]);

    // Build resume text blocks from raw doc — avoids passing 5 raw fields through state
    const techResumeText = [
        resumeDoc.academicInfo,
        resumeDoc.technicalAchievements,
        resumeDoc.experiences,
        resumeDoc.technicalProjects
    ].filter(Boolean).join('\n\n');

    const nonTechResumeText = [
        resumeDoc.academicInfo,
        resumeDoc.extracurricularAchievements,
        resumeDoc.experiences
    ].filter(Boolean).join('\n\n');

    // Build the JD summary text (a text representation of the raw document)
    const jobDescriptionText =
        `Role: ${jobDoc.role || 'Job Description'}.
        Technical Requirements:
        ${(jobDoc.technicalRequirements || []).map(s => `- ${s.requirementName} (${s.priority}): ${s.sourceContext}`).join('\n')}
        Non-Technical Requirements:
        ${(jobDoc.nonTechnicalRequirements || []).map(r => `- ${r.requirementName} (${r.priority}): ${r.sourceContext}`).join('\n')}`;

    return {
        resumeId: resumeDoc._id,
        resumeHash: resumeDoc.contentHash,
        techResumeText,
        nonTechResumeText,

        jobDescriptionId: jobDoc._id,
        jobDescriptionText,
        jobDescriptionCompany: jobDoc.companyName || 'Company',
        jobDescriptionRole: jobDoc.role || 'Role',
        jobDescriptionTechnicalRequirements: jobDoc.technicalRequirements || [],
        jobDescriptionNonTechnicalRequirements: jobDoc.nonTechnicalRequirements || [],
    };
}
