import logger from '../utils/logger.js';
import { techRequirementsMatchSchema, nonTechRequirementsMatchSchema } from '../schemas/matched_term.schema.js';
import { getStructuredModel } from '../config/llm.js';
import { getTechRequirementsPrompt, getNonTechRequirementsPrompt } from '../prompts/prompts.js';
import { parseAndSaveResume } from '../tools/parser.js';
import { scrapeAndSaveJobDescription } from '../tools/scraper.js';

/**
 * Node to concurrently ingest the candidate's resume and scrape the target JD webpage.
 * Performs matching / audit checks concurrently afterwards.
 */
export async function startAgent(state) {
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

    const jobDescriptionTechnicalRequirements = jobDoc.technicalRequirements || [];
    const jobDescriptionNonTechnicalRequirements = jobDoc.nonTechnicalRequirements || [];

    logger.info({ userId, resumeId: resumeDoc._id, jobDescriptionId: jobDoc._id }, '[Agent] Auditing candidate resume against job requirements');

    let evaluatedTechnicalRequirements = [];
    let evaluatedNonTechnicalRequirements = [];

    try {
        const techRequirementsLlm = getStructuredModel(techRequirementsMatchSchema);
        const nonTechRequirementsLlm = getStructuredModel(nonTechRequirementsMatchSchema);

        // Execute the audit prompts concurrently
        const [techRequirementsResult, nonTechRequirementsResult] = await Promise.all([
            techRequirementsLlm.invoke(
                getTechRequirementsPrompt({ resumeText: techResumeText, jobDescriptionTechnicalRequirements })
            ),
            nonTechRequirementsLlm.invoke(
                getNonTechRequirementsPrompt({ resumeText: nonTechResumeText, jobDescriptionNonTechnicalRequirements })
            )
        ]);

        evaluatedTechnicalRequirements = techRequirementsResult.evaluatedTechnicalRequirements || [];
        evaluatedNonTechnicalRequirements = nonTechRequirementsResult.evaluatedNonTechnicalRequirements || [];
    } catch (err) {
        logger.error({ err }, '[Agent] Match check LLM execution failed; defaulting requirements to missing');
        evaluatedTechnicalRequirements = jobDescriptionTechnicalRequirements.map(s => ({ requirementName: s.requirementName, matchStatus: 'MISSING', resumeEvidence: 'Matching failed' }));
        evaluatedNonTechnicalRequirements = jobDescriptionNonTechnicalRequirements.map(r => ({ requirementName: r.requirementName, matchStatus: 'MISSING', resumeEvidence: 'Matching failed' }));
    }

    const techPriorityMap = Object.fromEntries(jobDescriptionTechnicalRequirements.map(s => [s.requirementName, s.priority || 'REQUIRED']));
    const nonTechPriorityMap = Object.fromEntries(jobDescriptionNonTechnicalRequirements.map(r => [r.requirementName, r.priority || 'REQUIRED']));

    evaluatedTechnicalRequirements = evaluatedTechnicalRequirements.map(s => ({
        ...s,
        priority: techPriorityMap[s.requirementName] || 'REQUIRED',
    }));
    evaluatedNonTechnicalRequirements = evaluatedNonTechnicalRequirements.map(r => ({
        ...r,
        priority: nonTechPriorityMap[r.requirementName] || 'REQUIRED',
    }));

    if (evaluatedTechnicalRequirements.length !== jobDescriptionTechnicalRequirements.length) {
        logger.warn({ userId, expected: jobDescriptionTechnicalRequirements.length, evaluated: evaluatedTechnicalRequirements.length }, '[Agent] Technical requirements evaluation count mismatch');
    }
    if (evaluatedNonTechnicalRequirements.length !== jobDescriptionNonTechnicalRequirements.length) {
        logger.warn({ userId, expected: jobDescriptionNonTechnicalRequirements.length, evaluated: evaluatedNonTechnicalRequirements.length }, '[Agent] Non-technical requirements evaluation count mismatch');
    }

    const jobDescriptionText =
        `Role: ${jobDoc.role || 'Job Description'}.
        Technical Requirements:
        ${(jobDoc.technicalRequirements || []).map(s => `- ${s.requirementName} (${s.priority}): ${s.sourceContext}`).join('\n')}
        Non-Technical Requirements:
        ${(jobDoc.nonTechnicalRequirements || []).map(r => `- ${r.requirementName} (${r.priority}): ${r.sourceContext}`).join('\n')}`;

    return {
        resumeId: resumeDoc._id,
        resumeText: nonTechResumeText,
        resumeHash: resumeDoc.contentHash,
        jobDescriptionId: jobDoc._id,
        jobDescriptionText,
        jobDescriptionCompany: jobDoc.companyName || 'Company',
        jobDescriptionRole: jobDoc.role || 'Role',
        jobDescriptionTechnicalRequirements,
        jobDescriptionNonTechnicalRequirements,
        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements,
    };
}
