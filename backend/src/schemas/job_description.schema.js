import { z } from 'zod';

const priorityEnum = z.enum(["REQUIRED", "PREFERRED", "NICE_TO_HAVE"]);

export const jobDetailsSchema = z.object({
  title: z.string().describe("The official job title/role name"),
  jobDescription: z.string().describe("Cleaned, readable, and structured description summarizing roles and responsibilities without page clutter"),
  skills: z.array(z.object({
    term: z.string().describe("The skill name exactly as it appears or implied in the JD"),
    priority: priorityEnum.describe("REQUIRED = mandatory/must-have, PREFERRED = nice-to-have/bonus, NICE_TO_HAVE = implied or vague mention only")
  })).describe("Required technical skills, languages, tools, frameworks"),
  requirements: z.array(z.object({
    term: z.string().describe("The requirement exactly as stated"),
    priority: priorityEnum.describe("REQUIRED = mandatory/must-have, PREFERRED = nice-to-have/bonus, NICE_TO_HAVE = implied or vague mention only")
  })).describe("Explicit qualifications, years of experience, or responsibilities")
});