import axios from 'axios';
import * as cheerio from 'cheerio';
import ai from '../config/gemini.js';
import { AI_MODEL, TEMPERATURE_LOW } from '../config/constants.js';
import { jobDetailsSchema } from '../schemas/job_description.schema.js';
import JobDescriptionModel from '../models/job_description.model.js';
import { timeAsyncCall } from '../utils/logger.js';
import { generateResponse } from '../utils/model_fallback.js';
import { compactText } from '../utils/text_compact.js';



/**
 * Scrapes the visible text content from a given job posting URL.
 * 
 * @param {string} url - The URL of the job description page
 * @returns {Promise<string>} The raw text content of the page
 */
export async function scrapeJobDescription(url) {
  if (!url) {
    throw new Error('URL is required for scraping.');
  }

  console.log(`[Scraping Service] Initiating lightweight scrape for URL: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 20000 // 20 seconds timeout
    });

    const $ = cheerio.load(data);

    // Remove layout noise and unnecessary scripts
    const selectorsToRemove = [
      'script',
      'style',
      'nav',
      'footer',
      'header',
      'iframe',
      'noscript',
      'svg',
      'meta',
      'link'
    ];
    selectorsToRemove.forEach((sel) => $(sel).remove());

    // Extract text from the body
    const rawText = $('body').text() || '';
    const cleanedText = rawText.replace(/\s+/g, ' ').trim();

    if (!cleanedText || cleanedText.length < 50) {
      console.warn(`[Scraping Service] Warning: Extracted text is extremely short (${cleanedText.length} chars). Site might be client-side rendered (SPA).`);
      if (cleanedText.length === 0) {
         throw new Error('No content could be extracted from this URL (site may require Javascript rendering).');
      }
    }

    console.log(`[Scraping Service] Scraped ${cleanedText.length} characters successfully.`);
    return cleanedText;
  } catch (error) {
    console.error(`[Scraping Service] Error scraping URL: ${url}`, error);
    throw new Error(`Failed to retrieve job description from URL. details: ${error.message}`);
  }
}

/**
 * Parses and structures raw text scraped from a job description page using Gemini.
 * 
 * @param {string} rawText - Raw scraped text content
 * @returns {Promise<object>} Structured job details
 */
export async function parseJobDetailsFromText(rawText) {
  const rawSchema = jobDetailsSchema.toJSONSchema();
  delete rawSchema.$schema;

  const prompt = `Analyze the following raw scraped text from a job posting webpage. 
  Extract the official Job Title, clean and format the Job Description (remove navigation, headers, footers, similar job listings, or boilerplate), and extract the list of required skills and job requirements.
  
  Raw Scraped Text:
  ${rawText}`;

  const response = await timeAsyncCall('AI parseJobDetailsFromText', () =>
    generateResponse(ai, {
      contents: prompt,
      generationConfig: {
        temperature: TEMPERATURE_LOW,
        responseMimeType: 'application/json',
        responseSchema: rawSchema,
      }
    })
  );

  return JSON.parse(response.text);
}

/**
 * Fetches existing JobDescription from DB cache if available, otherwise scrapes, structures, and saves it.
 * 
 * @param {string} url - Target job page URL
 * @returns {Promise<object>} structured job document
 */
export async function fetchOrCreateJobDescription(url) {
  const existingJob = await JobDescriptionModel.findOne({ url });
  if (existingJob) {
    console.log('[Scraping Service] Job description cache HIT for URL:', url);
    return existingJob;
  }

  console.log('[Scraping Service] Job description cache MISS for URL:', url);
  const rawText = await scrapeJobDescription(url);
  const JD_PAGE_NOISE = [/equal opportunity employer/i, /apply (now|today)/i, /similar (jobs|positions|roles)/i, /you may also like/i];
  const cleanedText = compactText(rawText, { extraNoise: JD_PAGE_NOISE });
  const details = await parseJobDetailsFromText(rawText);

  const newJob = await JobDescriptionModel.create({
    url,
    rawText,
    role: details.title || details.role || 'Job Description',
    skills: details.skills || [],
    requirements: details.requirements || [],
  });

  return newJob;
}
