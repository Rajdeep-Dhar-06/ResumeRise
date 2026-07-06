import { z } from 'zod';
import { SEVERITY_LEVELS } from '../utils/enums.js';

// 1. Schema for Title
export const reportScoreSchema = z.object({
  title: z.string().describe('The title of the interview report'),
});

// 2. Schema for Technical Questions
export const reportTechQuestionsSchema = z.object({
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            'The technical question which can be asked during the interview'
          ),
        intention: z
          .string()
          .describe(
            'The intention behind asking this question by the interviewer'
          ),
        answer: z
          .string()
          .describe(
            'The ideal answer to this question which the candidate should provide, what points to cover, what approach to take. Make it sound genuine and answer from the point of view of the candidate, as to how he would frame it.'
          ),
      })
    )
    .length(5)
    .describe(
      'A list of technical questions that can be asked during the interview, along with the intention behind asking each question and the ideal answer.'
    ),
});

// 3. Schema for Behavioral Questions
export const reportBehavioralQuestionsSchema = z.object({
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            'The behavioral question which can be asked during the interview'
          ),
        intention: z
          .string()
          .describe(
            'The intention behind asking this question by the interviewer'
          ),
        answer: z
          .string()
          .describe(
            'The ideal answer to this question which the candidate should provide, what points to cover, what approach to take. Make it sound genuine and answer from the point of view of the candidate, as to how he would frame it.'
          ),
      })
    )
    .length(3)
    .describe(
      'A list of behavioral questions that can be asked during the interview, along with the intention behind asking each question and the ideal answer.'
    ),
});

// 4. Schema for Skill Gaps & Preparation Plan
export const reportGapsAndPlanSchema = z.object({
  skillGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe('The skill that is identified as a gap for the candidate'),
        severity: z
          .enum(SEVERITY_LEVELS)
          .describe(
            'The severity of the skill gap for the candidate, indicating how critical it is for the job'
          ),
      })
    )
    .describe(
      'A list of skills that are identified as gaps for the candidate, along with their importance for the job.'
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe('The day number of the preparation plan, starting from 1'),
        focus: z
          .string()
          .describe(
            'The main focus of this day in the preparation plan, eg data structures, mock interviews, system design'
          ),
        tasks: z
          .array(z.string())
          .describe(
            'The specific tasks that the candidate will complete on this day'
          ),
      })
    )
    .describe(
      'A list of days in the preparation plan till the interview, along with the focus and tasks for each day.'
    ),
  learningResources: z
    .array(
      z.object({
        skill: z
          .string()
          .describe('The name of the skill/technology gap'),
        resources: z
          .array(
            z.object({
              title: z
                .string()
                .describe('Title of the documentation, course, or tutorial'),
              url: z
                .string()
                .describe('The exact URL link found in the search results'),
              snippet: z
                .string()
                .describe('Brief description of what this resource covers')
            })
          )
          .describe('List of verified tutorials or documentation links')
      })
    )
    .describe('Structured list of web resources grouped by skill gap')
});
