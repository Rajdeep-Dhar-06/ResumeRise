import { z } from 'zod';
import { MATCH_STATUS, COMPLEXITY_LEVELS, PRIORITY_LEVELS } from '../utils/enums.js';

export const evaluatedRequirementSchema = z.object({
  requirementName: z.string().trim().catch('').describe("The skill or requirement being evaluated"),

  priority: z.enum(PRIORITY_LEVELS).catch('REQUIRED').describe(
    "The exact priority of this requirement as provided in the input job description. Do not modify or hallucinate this."
  ),

  matchStatus: z.enum(MATCH_STATUS).catch('MISSING').describe(
    "MATCHED: skill is directly evidenced in real work/project experience with context. " +
    "WEAK_MATCH: skill appears only in a skills/tools list with zero supporting project or work evidence, " +
    "OR the only evidence is a trivial/tutorial-level project. " +
    "MISSING: not mentioned, or only vaguely implied through synonyms or generic language."
  ),

  resumeEvidence: z.string().trim().catch('None found').describe(
    "The exact resume line or project that supports this status. If MISSING, write 'None found'."
  ),

  depthAssessment: z.string().trim().catch('None').describe(
    "A blunt 1 or 2 sentence assessment. Do not soften language. " +
    "Call out if the evidence is a tutorial clone, a toy project, boilerplate, or surface-level usage."
  ),

  complexityLevel: z.enum(COMPLEXITY_LEVELS).catch('N/A').describe(
    "Rate the complexity of the evidence project/experience. " +
    "TRIVIAL: todo app, weather app, portfolio site, YouTube tutorial clone. " +
    "BASIC: standard CRUD app, simple REST API, no meaningful scale or architecture decisions. " +
    "INTERMEDIATE: multi-service architecture, auth flows, real deployment, some design decisions. " +
    "ADVANCED: non-trivial independent or internship project with genuine engineering depth — " +
    "custom concurrency, caching layers, protocol implementations, performance-aware design decisions, " +
    "or competitive programming at a rated/ranked level. Exceeds tutorials but lacks verifiable " +
    "real-world scale or confirmed professional deployment. " +
    "PRODUCTION: open-source contributions with traction, demonstrated scale (users/load), " +
    "complex algorithmic work, or professional work experience. " +
    "N/A: not a project context."
  ),

  matchStrength: z.coerce.number().int().min(0).max(100).optional().describe(
    "A raw integer from 0 to 100 representing confidence in the match. Do NOT include a % sign."
  )
});

export const techRequirementsMatchSchema = z.object({
  evaluatedTechnicalRequirements: z.array(evaluatedRequirementSchema).catch([]).describe("Evaluation of each skill from the JD")
});

export const nonTechRequirementsMatchSchema = z.object({
  evaluatedNonTechnicalRequirements: z.array(evaluatedRequirementSchema).catch([]).describe("Evaluation of each requirement from the JD")
});
