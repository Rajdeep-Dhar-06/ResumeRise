import 'dotenv/config';
import puppeteer from "puppeteer";
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's resume and self-description match the job description, with 100 being a perfect match."
    ),
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
            'The ideal answer to this question which the candidate should provide, what points to cover, what approach to take'
          ),
      })
    )
    .describe(
      'A list of technical questions that can be asked during the interview, along with the intention behind asking each question and the ideal answer that the candidate should provide.'
    ),
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
            'The ideal answer to this question which the candidate should provide, what points to cover, what approach to take'
          ),
      })
    )
    .describe(
      'A list of behavioral questions that can be asked during the interview, along with the intention behind asking each question and the ideal answer that the candidate should provide.'
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe('The skill that is identified as a gap for the candidate'),
        severity: z
          .enum(['low', 'medium', 'high'])
          .describe(
            'The severity of the skill gap for the candidate, indicating how critical it is for the job'
          ),
      })
    )
    .describe(
      'A list of skills that are identified as gaps for the candidate, along with their importance for the job and a plan for improvement.'
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
  title: z.string().describe('The title of the interview report'),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const rawSchema = interviewReportSchema.toJSONSchema();
  delete rawSchema.$schema;

  const prompt = `Generate an interview report for a candidate with the following details:
  Resume: ${resume}
  Self Description: ${selfDescription}
  Job Description: ${jobDescription}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: rawSchema,
    },
  });

  return JSON.parse(response.text);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription}) {

  const resumePdfSchema = z.object({
    html: z.string().describe('The HTML content of the resume PDF which can be converted to a PDF document using puppeteer')
  })

  const prompt = `Generate an HTML content for a resume for a candidate with the following details which should be ATS friendly and well-structured for the job description:
  Resume: ${resume}
  Self Description: ${selfDescription}
  Job Description: ${jobDescription}
  You are an expert Executive Resume Writer and Career Coach. Your task is to generate an ATS-optimized, highly tailored resume in HTML format based on the provided [Candidate Data] and [Job Description]. The HTML must be designed to be converted into a clean, professional 1 page PDF using tools like Puppeteer.
  Follow these strict guidelines to ensure maximum quality and ATS compatibility:
  1. Content & Tone (Human-Like & Impactful):
    - Avoid generic AI buzzwords (e.g., "spearheaded," "delved," "fostered," "testament"). Write in a direct, professional, and objective human tone.
    - Use the XYZ formula for experience and project bullet points: "Accomplished [X] as measured by [Y], by doing [Z]." Include quantifiable metrics wherever possible.
    - Start every bullet point with a strong, varied action verb. 
    - Extract key technical and soft skills from the [Job Description] and organically weave them into the resume content. Do not keyword stuff.
  2. ATS Optimization (Structure & Parsing):
    - Use standard, universally recognized section headers (e.g., "Professional Experience," "Education," "Projects," "Technical Skills") so ATS algorithms can easily categorize the data.
    - Rely on semantic HTML (<h1>, <h2>, <ul>, <li>, <p>). 
    - STRICTLY AVOID HTML <table> tags, complex CSS Grid/Flexbox layouts, columns, or embedded SVGs, as these break older ATS parsers. Keep the DOM tree linear and straightforward.
  3. Design & Formatting (Visual Hierarchy):
    - Keep the design clean, minimalist, and highly scannable. Focus on typography and spacing over heavy graphics.
    - Use a professional, web-safe font stack (e.g., Arial, Helvetica, Calibri, or Roboto).
    - Use subtle CSS styling (e.g., a dark blue or muted primary color for headers, bolding for job titles/technologies, and clear margins/padding) to create visual hierarchy.
    - Ensure the final rendered PDF length strictly stays within 1 page by prioritizing the most relevant experience and filtering out outdated or irrelevant data.`;

  const rawSchema = resumePdfSchema.toJSONSchema();
  delete rawSchema.$schema;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: rawSchema,
    },
  });

  const jsonContent = JSON.parse(response.text);
  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);
  return pdfBuffer;
}

export { generateInterviewReport, generateResumePdf };
