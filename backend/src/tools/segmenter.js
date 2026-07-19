import { segmentResumePrompt } from '../prompts/prompts.js';
import { getStructuredModel } from '../config/llm.js';
import { resumeSegmentSchema } from '../schemas/resume_segment.schema.js';

/**
 * Segment raw anonymized resume text into 5 structural parts using Gemini with structured output
 * @param {string} rawText - Raw anonymized resume text
 * @returns {Promise<Object>} - Object with segmented sections
 */
export async function segmentResume(rawText) {
  const prompt = segmentResumePrompt({ rawText });
  const model = getStructuredModel(resumeSegmentSchema);
  const result = await model.invoke(prompt);

  return {
    academicInfo: result.academicInfo || '',
    technicalAchievements: result.technicalAchievements || '',
    extracurricularAchievements: result.extracurricularAchievements || '',
    experiences: result.experiences || '',
    technicalProjects: result.technicalProjects || '',
  };
}
