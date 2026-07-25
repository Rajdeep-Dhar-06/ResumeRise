import logger from '../utils/logger.js';
import { getStructuredModel } from '../config/llm.js';
import { techRequirementsMatchSchema, nonTechRequirementsMatchSchema } from '../schemas/matched_term.schema.js';
import { getTechRequirementsPrompt, getNonTechRequirementsPrompt } from '../prompts/prompts.js';
import { withLlmCache } from '../utils/llm_cache.js';

/**
 * Step 2: Audit candidate resume against scraped job technical and non-technical requirements.
 * Uses input-hashed Redis caching to prevent duplicate LLM calls.
 */
export async function auditRequirementsStep(ingestData) {
  const {
    userId,
    resumeDoc,
    jobDoc,
    techResumeText,
    nonTechResumeText
  } = ingestData;

  logger.info({ userId, resumeId: resumeDoc._id, jobDescriptionId: jobDoc._id }, 'Auditing candidate resume against job requirements');

  const jobDescriptionTechnicalRequirements = jobDoc.technicalRequirements || [];
  const jobDescriptionNonTechnicalRequirements = jobDoc.nonTechnicalRequirements || [];

  const techRequirementsLlm = getStructuredModel(techRequirementsMatchSchema);
  const nonTechRequirementsLlm = getStructuredModel(nonTechRequirementsMatchSchema);

  const [techRequirementsResult, nonTechRequirementsResult] = await Promise.all([
    withLlmCache(
      'audit_tech_requirements',
      { techResumeText, jobDescriptionTechnicalRequirements },
      () => techRequirementsLlm.invoke(
        getTechRequirementsPrompt({ resumeText: techResumeText, jobDescriptionTechnicalRequirements })
      )
    ),
    withLlmCache(
      'audit_non_tech_requirements',
      { nonTechResumeText, jobDescriptionNonTechnicalRequirements },
      () => nonTechRequirementsLlm.invoke(
        getNonTechRequirementsPrompt({ resumeText: nonTechResumeText, jobDescriptionNonTechnicalRequirements })
      )
    )
  ]);

  let evaluatedTechnicalRequirements = techRequirementsResult.evaluatedTechnicalRequirements || [];
  let evaluatedNonTechnicalRequirements = nonTechRequirementsResult.evaluatedNonTechnicalRequirements || [];

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

  return {
    ...ingestData,
    jobDescriptionCompany: jobDoc.companyName || 'Company',
    jobDescriptionRole: jobDoc.role || 'Role',
    jobDescriptionTechnicalRequirements,
    jobDescriptionNonTechnicalRequirements,
    evaluatedTechnicalRequirements,
    evaluatedNonTechnicalRequirements
  };
}
