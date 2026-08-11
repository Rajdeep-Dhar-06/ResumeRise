import { z } from 'zod';
import { MATCH_STATUS, COMPLEXITY_LEVELS, PRIORITY_LEVELS } from '../utils/enums.js';

export const evaluatedRequirementSchema = z.object({
  requirementName: z.string().trim().catch('').describe("The skill or requirement being evaluated"),

  priority: z.enum(PRIORITY_LEVELS).catch('REQUIRED').describe(
    "The exact priority of this requirement as provided in the input job description."
  ),

  matchStatus: z.enum(MATCH_STATUS).catch('MISSING').describe(
    "MATCHED: skill is directly evidenced in real work/project experience with context. " +
    "WEAK_MATCH: skill appears only in a skills/tools list with zero supporting project or work evidence, " +
    "OR the only evidence is a trivial/tutorial-level project. " +
    "MISSING: not mentioned, or only vaguely implied through synonyms or generic language."
  ),

  retrievedEvidence: z.array(z.string().trim()).catch([]).describe(
    "The array of top retrieved resume bullet chunks supporting this status. If MISSING, return an empty array."
  ),

  depthAssessment: z.string().trim().catch('None').describe(
    "A blunt 1 or 2 sentence assessment. Do not soften language."
  ),

  complexityLevel: z.enum(COMPLEXITY_LEVELS).catch('N/A').describe(
    "Rate the complexity of the evidence project/experience: " +
    "BASIC: todo app, tutorial clone, or skills-list mention. " +
    "INTERMEDIATE: real personal/academic project with multi-service or deployed architecture. " +
    "PRODUCTION: professional work experience, high-scale engineering, or major open-source. " +
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
