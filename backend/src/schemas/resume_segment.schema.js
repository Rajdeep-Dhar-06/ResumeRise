import { z } from 'zod';

export const resumeSegmentSchema = z.object({
  academicInfo: z.string().describe('Education details, degrees, academic achievements, certifications, courses, GPA.'),
  technicalAchievements: z.string().describe('Technical accolades, programming contest awards, open-source work, publication/patents, DSA/competitive coding accomplishments, or LeetCode/Codeforces/HackerRank ranks.'),
  extracurricularAchievements: z.string().describe('Non-technical clubs, volunteering, sports, personal hobbies, community service—everything non-technical.'),
  experiences: z.string().describe('Work history, internships, job descriptions, roles, freelance.'),
  technicalProjects: z.string().describe('Side projects, personal builds, hackathons, academic projects.'),
});
