import logger from '../utils/logger.js';
import { getStructuredModel } from '../config/llm.js';
import { evaluatedRequirementSchema } from '../schemas/matched_term.schema.js';
import { getTechRequirementsPrompt, getNonTechRequirementsPrompt } from '../prompts/prompts.js';
import { withLlmCache } from '../utils/llm_cache.js';
import { createResumeVectorStore, retrieveTopKChunks } from '../utils/embeddings.js';

/**
 * Step 2: Audit candidate resume against job requirements using RAG similarity search & Gemini.
 */
export async function auditRequirementsStep(ingestData) {
  const {
    userId,
    resumeDoc,
    jobDoc,
  } = ingestData;

  logger.info({ userId, resumeId: resumeDoc._id, jobDescriptionId: jobDoc._id }, 'RAG Auditing candidate resume against job requirements');

  const {
    technicalRequirements: techReqs = [],
    nonTechnicalRequirements: nonTechReqs = [],
  } = jobDoc;

  // 1. Build MemoryVectorStore from resume raw text
  const vectorStore = await createResumeVectorStore(resumeDoc.rawText || '');

  const singleAuditLlm = getStructuredModel(evaluatedRequirementSchema);

  // 2. Concurrently audit technical requirements with RAG vector retrieval
  const evaluatedTechnicalRequirements = await Promise.all(
    techReqs.map(async (req) => {
      const query = `${req.canonicalName || req.requirementName} ${req.sourceContext || ''}`.trim();
      const retrievedChunks = await retrieveTopKChunks(vectorStore, query, 3);

      return withLlmCache(
        'audit_tech_requirement',
        { req, retrievedChunks },
        async () => {
          const result = await singleAuditLlm.invoke(
            getTechRequirementsPrompt({ requirement: req, retrievedChunks })
          );
          return {
            ...result,
            requirementName: req.requirementName,
            priority: req.priority,
          };
        }
      );
    })
  );

  // 3. Concurrently audit non-technical requirements with RAG vector retrieval
  const evaluatedNonTechnicalRequirements = await Promise.all(
    nonTechReqs.map(async (req) => {
      const query = `${req.canonicalName || req.requirementName} ${req.sourceContext || ''}`.trim();
      const retrievedChunks = await retrieveTopKChunks(vectorStore, query, 3);

      return withLlmCache(
        'audit_non_tech_requirement',
        { req, retrievedChunks },
        async () => {
          const result = await singleAuditLlm.invoke(
            getNonTechRequirementsPrompt({ requirement: req, retrievedChunks })
          );
          return {
            ...result,
            requirementName: req.requirementName,
            priority: req.priority,
          };
        }
      );
    })
  );

  return {
    ...ingestData,
    evaluatedTechnicalRequirements,
    evaluatedNonTechnicalRequirements,
  };
}
