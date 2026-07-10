import { z } from 'zod';
import { MATCH_STATUS, COMPLEXITY_LEVELS } from '../utils/enums.js';

export const evaluatedRequirementSchema = z.object({
  requirementName: z.string().describe("The skill or requirement being evaluated"),

  matchStatus: z.enum(MATCH_STATUS).describe(
    "MATCHED: skill is directly evidenced in real work/project experience with context. " +
    "WEAK_MATCH: skill appears only in a skills/tools list with zero supporting project or work evidence, " +
    "OR the only evidence is a trivial/tutorial-level project. " +
    "MISSING: not mentioned, or only vaguely implied through synonyms or generic language."
  ),

  resumeEvidence: z.string().describe(
    "The exact resume line or project that supports this status. If MISSING, write 'None found'."
  ),

  depthAssessment: z.string().describe(
    "A blunt 1–2 sentence assessment. Do not soften language. " +
    "Call out if the evidence is a tutorial clone, a toy project, boilerplate, or surface-level usage."
  ),

  complexityLevel: z.enum(COMPLEXITY_LEVELS).describe(
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

  matchStrength: z.number().min(0).max(1).optional()
});

export const techRequirementsMatchSchema = z.object({
  evaluatedTechnicalRequirements: z.array(evaluatedRequirementSchema).describe("Evaluation of each skill from the JD")
});

export const nonTechRequirementsMatchSchema = z.object({
  evaluatedNonTechnicalRequirements: z.array(evaluatedRequirementSchema).describe("Evaluation of each requirement from the JD")
});
