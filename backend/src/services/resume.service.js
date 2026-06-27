import puppeteer from 'puppeteer';
import ai from '../config/gemini.js';
import { AI_MODEL, TEMPERATURE_MEDIUM } from '../config/constants.js';
import { resumePdfSchema } from '../schemas/resumePdf.schema.js';
import { timeAsyncCall } from '../utils/logger.js';
import { generateResponse } from '../utils/modelFallback.js';



/**
 * Converts raw HTML string into PDF format buffer using Puppeteer.
 * 
 * @param {string} htmlContent - Clean HTML code
 * @returns {Promise<Buffer>} PDF file buffer
 */
async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}

/**
 * Generates an ATS-optimized HTML resume and compiles it to a PDF buffer.
 * 
 * @param {object} params - Input data
 * @param {string} params.resume - Plain text candidate resume
 * @param {string} params.selfDescription - Candidate's personal bio
 * @param {string} params.jobDescription - Target role requirements
 * @returns {Promise<Buffer>} compiled PDF attachment buffer
 */
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const rawSchema = resumePdfSchema.toJSONSchema();
  delete rawSchema.$schema;

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

  const response = await timeAsyncCall('AI generateResumePdf HTML content', () =>
    generateResponse(ai, {
      contents: prompt,
      generationConfig: {
        temperature: TEMPERATURE_MEDIUM,
        responseMimeType: 'application/json',
        responseSchema: rawSchema,
      }
    })
  );

  const jsonContent = JSON.parse(response.text);
  const pdfBuffer = await timeAsyncCall('Puppeteer PDF print', () => 
    generatePdfFromHtml(jsonContent.html)
  );
  return pdfBuffer;
}

export {
  generateResumePdf,
};
