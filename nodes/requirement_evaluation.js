import logger from '../utils/logger.js';
import { techRequirementsMatchSchema, nonTechRequirementsMatchSchema } from '../schemas/matched_term.schema.js';
import { getStructuredModel } from '../config/llm.js';
import { getTechRequirementsPrompt, getNonTechRequirementsPrompt } from '../prompts/prompts.js';

/**
 * Node to evaluate candidate resume against job description requirements.
 * Reads pre-built text blocks from state, runs LLM matching, and merges priorities.
 */
export async function requirementEvaluation(state) {
    const {
        userId,
        resumeId,
        jobDescriptionId,
        techResumeText,
        nonTechResumeText,
        jobDescriptionTechnicalRequirements,
        jobDescriptionNonTechnicalRequirements,
    } = state;

    logger.info({ userId, resumeId, jobDescriptionId }, '[Agent] Auditing candidate resume against job requirements');

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

    // Merge priority from original JD requirements into evaluated results
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

    return {
        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements,
    };
}
