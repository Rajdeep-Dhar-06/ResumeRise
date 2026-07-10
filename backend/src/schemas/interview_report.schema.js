import { z } from 'zod';
import { SEVERITY_LEVELS } from '../utils/enums.js';

// 1. Schema for Title
export const reportScoreSchema = z.object({
  reportTitle: z.string().describe('The title of the interview report'),
});

// 2. Schema for Technical Questions
export const reportTechQuestionsSchema = z.object({
  technicalQuestions: z
    .array(
      z.object({
        questionText: z
          .string()
          .describe(
            'The technical question which can be asked during the interview'
          ),
        interviewerIntent: z
          .string()
          .describe(
            'The intention behind asking this question by the interviewer'
          ),
        idealAnswer: z
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

// 3. Schema for Non-Technical Questions
export const reportNonTechnicalQuestionsSchema = z.object({
  nonTechnicalQuestions: z
    .array(
      z.object({
        questionText: z
          .string()
          .describe(
            'The non-technical question which can be asked during the interview'
          ),
        interviewerIntent: z
          .string()
          .describe(
            'The intention behind asking this question by the interviewer'
          ),
        idealAnswer: z
          .string()
          .describe(
            'The ideal answer to this question which the candidate should provide, what points to cover, what approach to take. Make it sound genuine and answer from the point of view of the candidate, as to how he would frame it.'
          ),
      })
    )
    .length(3)
    .describe(
      'A list of non-technical questions that can be asked during the interview, along with the intention behind asking each question and the ideal answer.'
    ),
});

// 4. Schema for Skill Gaps & Preparation Plan
export const reportGapsAndPlanSchema = z.object({
  preparationGaps: z
    .array(
      z.object({
        requirementName: z
          .string()
          .describe('The skill/requirement that is identified as a gap for the candidate'),
        gapSeverity: z
          .enum(SEVERITY_LEVELS)
          .describe(
            'The severity of the gap for the candidate, indicating how critical it is for the job'
          ),
      })
    )
    .describe(
      'A list of requirements that are identified as gaps for the candidate, along with their importance for the job.'
    ),
  preparationPlan: z
    .array(
      z.object({
        dayNumber: z
          .number()
          .describe('The day number of the preparation plan, starting from 1'),
        dailyFocus: z
          .string()
          .describe(
            'The main focus of this day in the preparation plan, eg data structures, mock interviews, system design'
          ),
        dailyTasks: z
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
        requirementName: z
          .string()
          .describe('The name of the skill/technology gap'),
        resources: z
          .array(
            z.object({
              resourceTitle: z
                .string()
                .describe('Title of the documentation, course, or tutorial'),
              resourceUrl: z
                .string()
                .describe('The exact URL link found in the search results'),
              resourceSnippet: z
                .string()
                .describe('Brief description of what this resource covers')
            })
          )
          .describe('List of verified tutorials or documentation links')
      })
    )
    .describe('Structured list of web resources grouped by skill gap')
});
