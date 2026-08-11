import { z } from 'zod';
import { PRIORITY_LEVELS } from '../utils/enums.js';

export const jdTermSchema = z.object({
  requirementName: z.string().trim().default('').describe("The name of the requirement/skill, exactly as it appears or is implied in the JD"),
  canonicalName: z.string().trim().catch('').describe("The standardized, clean technology or topic name used for vector embeddings and search (e.g. React for ReactJS)"),
  priority: z.enum(PRIORITY_LEVELS).catch('REQUIRED').describe("REQUIRED = mandatory/must-have, PREFERRED = optional/nice-to-have"),
  sourceContext: z.string().trim().default('').describe("A short sentence explaining how this requirement/skill is applied in the job description responsibilities or qualifications")
});

export const jobDescriptionSchema = z.object({
  companyName: z.string().trim().default('Target Company').describe("The name of the hiring company or organization, exactly as it appears or is implied in the JD"),
  role: z.string().trim().default('Target Role').describe("The official job title/role name, exactly as it appears or is implied in the JD"),
  technicalRequirements: z.array(jdTermSchema).catch([]).describe("Required technical skills, languages, tools, frameworks"),
  nonTechnicalRequirements: z.array(jdTermSchema).catch([]).describe("Explicit qualifications, years of experience, responsibilities")
});