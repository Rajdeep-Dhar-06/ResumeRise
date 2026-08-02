import { z } from 'zod';

export const resumeSegmentSchema = z.object({
  academicInfo: z.string().trim().default('').describe('Education details, degrees, academic achievements, certifications, courses, GPA.'),
  technicalAchievements: z.string().trim().default('').describe('Technical accolades, programming contest awards, open-source work, publication/patents, DSA/competitive coding accomplishments, or LeetCode/Codeforces/HackerRank ranks.'),
  extracurricularAchievements: z.string().trim().default('').describe('Non-technical clubs, volunteering, sports, personal hobbies, community service—everything non-technical.'),
  experiences: z.string().trim().default('').describe('Work history, internships, job descriptions, roles, freelance.'),
  technicalProjects: z.string().trim().default('').describe('Side projects, personal builds, hackathons, academic projects.'),
});
