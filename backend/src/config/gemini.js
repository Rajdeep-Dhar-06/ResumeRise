import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

/**
 * Shared Gemini AI client instance.
 * All AI service files import this instead of initializing their own.
 */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default ai;
