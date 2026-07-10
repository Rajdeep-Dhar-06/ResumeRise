import { z } from 'zod';
import { PRIORITY_LEVELS } from '../utils/enums.js';

export const jdTermSchema = z.object({
  requirementName: z.string().describe("The name of the requirement/skill, exactly as it appears or is implied in the JD"),
  priority: z.enum(PRIORITY_LEVELS).describe("REQUIRED = mandatory/must-have, PREFERRED = nice-to-have/bonus, NICE_TO_HAVE = implied or vague mention only"),
  sourceContext: z.string().describe("A short sentence explaining how this requirement/skill is applied in the job description responsibilities or qualifications")
});

export const jobDescriptionSchema = z.object({
  companyName: z.string().describe("The name of the hiring company or organization, exactly as it appears or is implied in the JD"),
  role: z.string().describe("The official job title/role name, exactly as it appears or is implied in the JD"),
  technicalRequirements: z.array(jdTermSchema).describe("Required technical skills, languages, tools, frameworks"),
  nonTechnicalRequirements: z.array(jdTermSchema).describe("Explicit qualifications, years of experience, responsibilities")
});