import { z } from 'zod';

export const resumePdfSchema = z.object({
  html: z.string().describe('The HTML content of the resume PDF which can be converted to a PDF document using puppeteer')
});
