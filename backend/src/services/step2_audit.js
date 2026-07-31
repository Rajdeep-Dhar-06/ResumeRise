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

  const {
    technicalRequirements: jobDescriptionTechnicalRequirements,
    nonTechnicalRequirements: jobDescriptionNonTechnicalRequirements,
  } = jobDoc;

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

  const evaluatedTechnicalRequirements = techRequirementsResult.evaluatedTechnicalRequirements;
  const evaluatedNonTechnicalRequirements = nonTechRequirementsResult.evaluatedNonTechnicalRequirements;

  return {
    ...ingestData,
    evaluatedTechnicalRequirements,
    evaluatedNonTechnicalRequirements,
  };
}
