import { ChatGoogle } from '@langchain/google';

// Utils
import { computeMatchScore } from '../utils/score_calculator.js';

// Models
import JobDescriptionModel from '../models/job_description.model.js';
import InterviewReportModel from '../models/interview_report.model.js';
import LearningResourceModel from '../models/learning_resource.model.js';
import resumeModel from '../models/resume.model.js';
import { createHash } from 'crypto';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import axios from 'axios';
import { anonymizeResume } from '../utils/anonymizer.js';
import { compactText } from '../utils/text_compact.js';
import { jobDescriptionSchema } from '../schemas/job_description.schema.js';
import { getScrapeJobDescriptionPrompt } from '../prompts/prompts.js';

// LangChain Community Tools & Loaders
import { TavilySearch } from '@langchain/tavily';

// Zod Schemas
import { techRequirementsMatchSchema, nonTechRequirementsMatchSchema } from '../schemas/matched_term.schema.js';
import {
    reportGapsAndPlanSchema,
    reportTechQuestionsSchema,
    reportNonTechnicalQuestionsSchema
} from '../schemas/interview_report.schema.js';

// Prompts
import {
    getTechRequirementsPrompt,
    getNonTechRequirementsPrompt,
    getGapsAndPlanPrompt,
    getTechQuestionsPrompt,
    getNonTechnicalQuestionsPrompt
} from '../prompts/prompts.js';

function formatTerms(terms) {
    if (!terms || terms.length === 0) return '  None.';
    const formatted = terms.map(t =>
        `  • "${t.requirementName}" | Priority: ${t.priority || 'REQUIRED'} | Complexity: ${t.complexityLevel || 'N/A'} | Evidence: "${t.resumeEvidence || 'None found'}" | Verdict: "${t.depthAssessment || 'None'}"`
    ).join('\n');
    return formatted;
}

const model = new ChatGoogle({
    model: "gemini-3.1-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2
});

const creativeModel = new ChatGoogle({
    model: "gemini-3.1-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.6
});

// Helper for structured output with fallbacks (Low Temp)
export function getStructuredModel(schema) {
    return model.withStructuredOutput(schema).withFallbacks([
        new ChatGoogle({ model: "gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY, temperature: 0.2 }).withStructuredOutput(schema),
        new ChatGoogle({ model: "gemini-2.5-flash-lite", apiKey: process.env.GEMINI_API_KEY, temperature: 0.2 }).withStructuredOutput(schema),
    ]);
}

// Helper for structured output with fallbacks (Creative High Temp)
export function getCreativeStructuredModel(schema) {
    return creativeModel.withStructuredOutput(schema).withFallbacks([
        new ChatGoogle({ model: "gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY, temperature: 0.6 }).withStructuredOutput(schema),
        new ChatGoogle({ model: "gemini-2.5-flash-lite", apiKey: process.env.GEMINI_API_KEY, temperature: 0.6 }).withStructuredOutput(schema),
    ]);
}

// Helper to parse and persist a resume PDF
async function parseAndSaveResume(userId, resumeBuffer) {
    const contentHash = createHash('sha256').update(resumeBuffer).digest('hex');
    let doc = await resumeModel.findOne({ user: userId, contentHash });
    if (!doc) {
        console.log('[Node Ingestion] Parsing PDF and anonymizing resume content...');
        let parsedText = '';
        const blob = new Blob([resumeBuffer]);
        const loader = new PDFLoader(blob);
        const docs = await loader.load();
        parsedText = docs.map((doc) => doc.pageContent).join('\n');

        const RESUME_NOISE = [
            /references available (on|upon) request/i,
            /\b(hobbies|interests|objective)\b.*$/im
        ];
        parsedText = compactText(parsedText, { extraNoise: RESUME_NOISE, maxLines: 120 });

        if (!parsedText) {
            throw new Error('The uploaded resume PDF does not contain any extractable text.');
        }

        const resumeContent = anonymizeResume(parsedText);
        doc = await resumeModel.create({
            user: userId,
            contentHash,
            resumeContent,
        });
    }
    return doc;
}

// Helper to scrape and persist a job description from a URL
async function scrapeAndSaveJobDescription(jobDescriptionUrl) {
    const cleanedUrl = jobDescriptionUrl.trim();
    let doc = await JobDescriptionModel.findOne({ url: cleanedUrl });
    if (!doc) {
        console.log('[Node Ingestion] Scraping job webpage via Jina Reader...');
        let cleanedText = '';
        const jinaUrl = `https://r.jina.ai/${cleanedUrl}`;
        const headers = {};
        if (process.env.JINA_API_KEY) {
            headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
        }
        const response = await axios.get(jinaUrl, { headers, timeout: 20000 });
        cleanedText = response.data || '';

        if (!cleanedText || cleanedText.length < 50) {
            throw new Error('No sufficient text content could be extracted from this URL.');
        }

        const prompt = getScrapeJobDescriptionPrompt({ rawText: cleanedText });
        const structuredLlm = getStructuredModel(jobDescriptionSchema);
        const details = await structuredLlm.invoke(prompt);

        if ((!details.technicalRequirements || details.technicalRequirements.length === 0) && (!details.nonTechnicalRequirements || details.nonTechnicalRequirements.length === 0)) {
            throw new Error('Could not extract any skills or requirements from this job description URL.');
        }

        doc = await JobDescriptionModel.create({
            url: cleanedUrl,
            companyName: details.companyName || 'Company',
            role: details.role || 'Job Description',
            technicalRequirements: details.technicalRequirements || [],
            nonTechnicalRequirements: details.nonTechnicalRequirements || [],
        });
    }
    return doc;
}

export async function startAgent(state) {
    console.log(`[Node] Beginning concurrent ingestion of resume and job description...`);

    const {
        userId,
        resumeBuffer,
        jobDescriptionUrl
    } = state;

    // Concurrently execute parsing and scraping helpers
    const [resumeDoc, jobDoc] = await Promise.all([
        parseAndSaveResume(userId, resumeBuffer),
        scrapeAndSaveJobDescription(jobDescriptionUrl)
    ]);

    const resumeText = resumeDoc.resumeContent;
    const jobDescriptionTechnicalRequirements = jobDoc.technicalRequirements || [];
    const jobDescriptionNonTechnicalRequirements = jobDoc.nonTechnicalRequirements || [];

    console.log(`[Node] Auditing candidate resume against job requirements...`);

    let evaluatedTechnicalRequirements = [];
    let evaluatedNonTechnicalRequirements = [];

    try {
        const techRequirementsLlm = getStructuredModel(techRequirementsMatchSchema);
        const nonTechRequirementsLlm = getStructuredModel(nonTechRequirementsMatchSchema);

        // Execute the audit prompts concurrently
        const [techRequirementsResult, nonTechRequirementsResult] = await Promise.all([
            techRequirementsLlm.invoke(
                getTechRequirementsPrompt({ resumeText, jobDescriptionTechnicalRequirements })
            ),
            nonTechRequirementsLlm.invoke(
                getNonTechRequirementsPrompt({ resumeText, jobDescriptionNonTechnicalRequirements })
            )
        ]);

        evaluatedTechnicalRequirements = techRequirementsResult.evaluatedTechnicalRequirements || [];
        evaluatedNonTechnicalRequirements = nonTechRequirementsResult.evaluatedNonTechnicalRequirements || [];
    } catch (err) {
        console.error('[Node] Match check LLM execution failed, defaulting to missing:', err);
        evaluatedTechnicalRequirements = jobDescriptionTechnicalRequirements.map(s => ({ requirementName: s.requirementName, matchStatus: 'MISSING', resumeEvidence: 'Matching failed' }));
        evaluatedNonTechnicalRequirements = jobDescriptionNonTechnicalRequirements.map(r => ({ requirementName: r.requirementName, matchStatus: 'MISSING', resumeEvidence: 'Matching failed' }));
    }

    const techPriorityMap = Object.fromEntries(jobDescriptionTechnicalRequirements.map(s => [s.requirementName, s.priority || 'REQUIRED']));
    const nonTechPriorityMap = Object.fromEntries(jobDescriptionNonTechnicalRequirements.map(r => [r.requirementName, r.priority || 'REQUIRED']));

    evaluatedTechnicalRequirements = evaluatedTechnicalRequirements.map(s => ({
        ...s,
        priority: techPriorityMap[s.requirementName] || 'REQUIRED',
    }));
    evaluatedNonTechnicalRequirements = evaluatedNonTechnicalRequirements.map(r => ({
        ...r,
        priority: nonTechPriorityMap[r.requirementName] || 'REQUIRED',
    }));

    if (evaluatedTechnicalRequirements.length !== jobDescriptionTechnicalRequirements.length) {
        console.warn(`[Node] Warning: Technical requirements count mismatch! Expected ${jobDescriptionTechnicalRequirements.length}, evaluated ${evaluatedTechnicalRequirements.length}.`);
    }
    if (evaluatedNonTechnicalRequirements.length !== jobDescriptionNonTechnicalRequirements.length) {
        console.warn(`[Node] Warning: Non technical requirements count mismatch! Expected ${jobDescriptionNonTechnicalRequirements.length}, evaluated ${evaluatedNonTechnicalRequirements.length}.`);
    }

    const jobDescriptionText =
      `Role: ${jobDoc.role || 'Job Description'}.
      Technical Requirements:
      ${(jobDoc.technicalRequirements || []).map(s => `- ${s.requirementName} (${s.priority}): ${s.sourceContext}`).join('\n')}
      Non-Technical Requirements:
      ${(jobDoc.nonTechnicalRequirements || []).map(r => `- ${r.requirementName} (${r.priority}): ${r.sourceContext}`).join('\n')}`;

    return {
        resumeId: resumeDoc._id,
        resumeText,
        jobDescriptionId: jobDoc._id,
        jobDescriptionText,
        jobDescriptionCompany: jobDoc.companyName || 'Company',
        jobDescriptionRole: jobDoc.role || 'Role',
        jobDescriptionTechnicalRequirements,
        jobDescriptionNonTechnicalRequirements,
        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements,
    };
}

// Helper for fetching or searching resources for a single term.
// Returns a formatted string for the LLM prompt, or null if no results are available.
async function getResourceForTerm(term, searchTool) {
    const normalized = term.toLowerCase().trim();

    // 1. Try checking MongoDB cache
    try {
        const cached = await LearningResourceModel.findOne({ requirementName: normalized });
        if (cached?.resources?.length > 0) {
            console.log(`[Node] Found cached learning resources in MongoDB for gap: "${term}"`);
            const formatted = cached.resources.map(r => `• Title: ${r.resourceTitle}\n  Link: ${r.resourceUrl}\n  Description: ${r.resourceSnippet || ''}`).join('\n');
            return `### Search Results for "${term}":\n${formatted}\n`;
        }
    } catch (dbErr) {
        console.warn(`[Node] Failed to fetch cache for gap "${term}":`, dbErr.message);
    }

    // 2. Perform web search with Tavily
    console.log(`[Node] Web searching for gap: "${term}" using Tavily...`);
    try {
        const res = await searchTool.invoke({ query: `${term} tutorial free developer documentation` });

        // Extract array of resources from the Tavily response object
        const resultsArray = (res && res.results && Array.isArray(res.results)) ? res.results : [];

        if (resultsArray.length > 0) {
            const resources = resultsArray.map(r => ({
                resourceTitle: r.title || `${term} Tutorial`,
                resourceUrl: r.url,
                resourceSnippet: r.content || ''
            }));

            // Cache asynchronously (non-blocking) with upsert to prevent E11000 dup key errors
            LearningResourceModel.findOneAndUpdate(
                { requirementName: normalized },
                { requirementName: normalized, resources },
                { upsert: true, new: true }
            ).catch(cacheErr => console.warn(`[Node] Caching failed for gap "${term}":`, cacheErr.message));

            const formattedRes = resources.map(r => `• Title: ${r.resourceTitle}\n  Link: ${r.resourceUrl}\n  Description: ${r.resourceSnippet}`).join('\n\n');
            return `### Search Results for "${term}":\n${formattedRes}\n`;
        }
    } catch (tavilyErr) {
        console.error(`[Node] Tavily search failed for gap "${term}":`, tavilyErr.message);
    }

    // No results found from Tavily or cache — skip this term
    console.warn(`[Node] No resources found for gap: "${term}". Skipping.`);
    return null;
}

export async function processLearningPath(state) {
    console.log(`[Node] Finding learning tutorials for gaps...`);

    const { evaluatedTechnicalRequirements = [], daysLimit = 14 } = state;

    // We only process technical skills for the learning path, skipping abstract requirements
    const missingTechnicalRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING");
    const weakTechnicalRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH");

    const searchTechnicalRequirements = [...missingTechnicalRequirements, ...weakTechnicalRequirements].map(t => t.requirementName);
    let searchResultsText = "No web search required.";

    if (searchTechnicalRequirements.length > 0) {
        const searchTool = new TavilySearch({ maxResults: 2 });
        const resultsArray = await Promise.all(
            searchTechnicalRequirements.map(term => getResourceForTerm(term, searchTool))
        );
        // Filter out nulls
        const validResults = resultsArray.filter(Boolean);
        searchResultsText = validResults.length > 0 ? validResults.join('\n') : "No search results available.";
    }

    const prompt = getGapsAndPlanPrompt({
        missingTermsFormatted: formatTerms(missingTechnicalRequirements),
        weakTermsFormatted: formatTerms(weakTechnicalRequirements),
        searchResultsText,
        daysLimit
    });

    const structuredLlm = getStructuredModel(reportGapsAndPlanSchema);
    const response = await structuredLlm.invoke(prompt);

    if (process.env.NODE_ENV !== 'production') {
        console.log('[Node] processLearningPath Gemini Response:', JSON.stringify(response, null, 2));
    }

    return {
        preparationGaps: response.preparationGaps || [],
        preparationPlan: response.preparationPlan || [],
        learningResources: response.learningResources || [],
    };
}

export async function generateScoreAndTitle(state) {
    console.log(`[Node] Generating score and title...`);

    const {
        jobDescriptionCompany = 'Company',
        jobDescriptionRole = 'Role',
        evaluatedTechnicalRequirements = [],
        evaluatedNonTechnicalRequirements = []
    } = state;

    const title = `${jobDescriptionCompany} | ${jobDescriptionRole}`;
    const matchScore = computeMatchScore(evaluatedTechnicalRequirements, evaluatedNonTechnicalRequirements);

    return {
        reportTitle: title,
        matchScore
    };
}

export async function generateTechnicalQuestions(state) {
    console.log(`[Node] Generating technical questions...`);

    const {
        evaluatedTechnicalRequirements = [],
        jobDescriptionText = '',
    } = state;

    // generic technical questions
    const matchedRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MATCHED");
    const missingRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING");
    const weakRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH");

    const prompt = getTechQuestionsPrompt({
        missingTermsFormatted: formatTerms(missingRequirements),
        weakTermsFormatted: formatTerms(weakRequirements),
        matchedTermsFormatted: formatTerms(matchedRequirements),
        jobDescriptionText
    });

    const structuredLlm = getCreativeStructuredModel(reportTechQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        technicalQuestions: response.technicalQuestions || []
    };
}

export async function generateNonTechnicalQuestions(state) {
    console.log(`[Node] Generating non-technical questions...`);

    const {
        evaluatedTechnicalRequirements = [],
        evaluatedNonTechnicalRequirements = [],
        resumeText = '',
        jobDescriptionText = '',
    } = state;
    
    // use the evaluated requirements to generate questions, and the resume text as narrative to make the questions feel personal
    const missingRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "MISSING")
    ];
    const weakRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "WEAK_MATCH")
    ];

    const prompt = getNonTechnicalQuestionsPrompt({
        resumeText,
        missingTermsFormatted: formatTerms(missingRequirements),
        weakTermsFormatted: formatTerms(weakRequirements),
        jobDescriptionText
    });

    const structuredLlm = getCreativeStructuredModel(reportNonTechnicalQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        nonTechnicalQuestions: response.nonTechnicalQuestions || []
    };
}

export async function persistInterviewReport(state) {
    console.log(`[Node] Saving interview report directly from state to MongoDB...`);
    const {
        userId,
        jobDescriptionId,
        resumeId,

        evaluatedTechnicalRequirements = [],
        evaluatedNonTechnicalRequirements = [],

        reportTitle = 'My Interview Plan',
        matchScore = 0,
        technicalQuestions = [],
        nonTechnicalQuestions = [],
        preparationGaps = [],
        preparationPlan = [],
        learningResources = []
    } = state;

    const savedReport = await InterviewReportModel.create({
        userId,
        jobDescriptionId,
        resumeId,

        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements,

        reportTitle,
        matchScore,
        technicalQuestions,
        nonTechnicalQuestions,
        preparationGaps,
        preparationPlan,
        learningResources,
    });

    return { savedReport };
}

export async function assembleFinalReport(state) {
    console.log(`[Node] Assembling final report...`);

    const [scoreRes, pathRes, techRes, nonTechRes] = await Promise.all([
        generateScoreAndTitle(state),
        processLearningPath(state),
        generateTechnicalQuestions(state),
        generateNonTechnicalQuestions(state)
    ]);

    return {
        ...scoreRes,
        ...pathRes,
        ...techRes,
        ...nonTechRes
    };
}