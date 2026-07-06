import { ChatGoogle } from '@langchain/google';

// Utils
import { computeMatchScore } from '../utils/score_calculator.js';

// Models
import JobDescriptionModel from '../models/job_description.model.js';
import InterviewReportModel from '../models/interview_report.model.js';
import LearningResourceModel from '../models/learning_resource.model.js';

// LangChain Community Tools & Loaders
import { TavilySearch } from '@langchain/tavily';

// Zod Schemas
import { skillsMatchSchema, requirementsMatchSchema } from '../schemas/matched_term.schema.js';
import {
    reportGapsAndPlanSchema,
    reportTechQuestionsSchema,
    reportBehavioralQuestionsSchema
} from '../schemas/interview_report.schema.js';

// Prompts
import {
    getSkillsMatchPrompt,
    getRequirementsMatchPrompt,
    getGapsAndPlanPrompt,
    getTechQuestionsPrompt,
    getBehavioralQuestionsPrompt
} from '../prompts/prompts.js';

// Shared helper: formats a list of matched/missing/weak terms into a readable bullet list for prompts.
function formatTerms(terms) {
    if (!terms || terms.length === 0) return '  None.';
    return terms.map(t =>
        `  • "${t.term}" | Priority: ${t.priority || 'REQUIRED'} | Complexity: ${t.complexity || 'N/A'} | Evidence: "${t.evidence || 'None found'}" | Verdict: "${t.verdict || 'None'}"`
    ).join('\n');
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

export async function startAgent(state) {
    console.log(`[Node] Auditing candidate resume against job requirements...`);

    let matchedSkills = [];
    let matchedRequirements = [];

    if (state.resumeText) {
        const skillObjects = state.jobDescriptionSkills || [];
        const reqObjects = state.jobDescriptionRequirements || [];

        if (skillObjects.length > 0 || reqObjects.length > 0) {
            try {
                // Initialize structured LLM runners directly using your LangChain model
                const skillsLlm = getStructuredModel(skillsMatchSchema);
                const reqsLlm = getStructuredModel(requirementsMatchSchema);

                // Execute the audit prompts concurrently
                const [skillsResult, reqsResult] = await Promise.all([
                    skillsLlm.invoke(
                        getSkillsMatchPrompt({ resumeText: state.resumeText, skills: skillObjects })
                    ),
                    reqsLlm.invoke(
                        getRequirementsMatchPrompt({ resumeText: state.resumeText, requirements: reqObjects })
                    )
                ]);

                matchedSkills = skillsResult.scrapedSkills || [];
                matchedRequirements = reqsResult.scrapedRequirements || [];
            } catch (err) {
                console.error('[Node] Match check LLM execution failed, defaulting to missing:', err);
                matchedSkills = skillObjects.map(s => ({ term: s.term, status: 'MISSING', evidence: 'Matching failed' }));
                matchedRequirements = reqObjects.map(r => ({ term: r.term, status: 'MISSING', evidence: 'Matching failed' }));
            }

            // Map priorities from job description terms back onto matching audit results
            const skillPriorityMap = Object.fromEntries(skillObjects.map(s => [s.term, s.priority || 'REQUIRED']));
            const reqPriorityMap = Object.fromEntries(reqObjects.map(r => [r.term, r.priority || 'REQUIRED']));

            matchedSkills = matchedSkills.map(s => ({
                ...s,
                priority: skillPriorityMap[s.term] || 'REQUIRED',
            }));
            matchedRequirements = matchedRequirements.map(r => ({
                ...r,
                priority: reqPriorityMap[r.term] || 'REQUIRED',
            }));

            // Defensive checking to warn if LLM paraphrased key names or skipped evaluations
            if (matchedSkills.length !== skillObjects.length) {
                console.warn(`[Node] Warning: Skill audit count mismatch! Expected ${skillObjects.length}, evaluated ${matchedSkills.length}.`);
            }
            if (matchedRequirements.length !== reqObjects.length) {
                console.warn(`[Node] Warning: Requirement audit count mismatch! Expected ${reqObjects.length}, evaluated ${matchedRequirements.length}.`);
            }
        }
    }

    return {
        matchedSkills,
        matchedRequirements,
    };
}

// Helper for fetching or searching resources for a single term.
// Returns a formatted string for the LLM prompt, or null if no results are available.
async function getResourceForTerm(term, searchTool) {
    const normalized = term.toLowerCase().trim();

    // 1. Try checking MongoDB cache
    try {
        const cached = await LearningResourceModel.findOne({ skill: normalized });
        if (cached?.resources?.length > 0) {
            console.log(`[Node] Found cached learning resources in MongoDB for gap: "${term}"`);
            const formatted = cached.resources.map(r => `• Title: ${r.title}\n  Link: ${r.url}\n  Description: ${r.snippet || ''}`).join('\n');
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
                title: r.title || `${term} Tutorial`,
                url: r.url,
                snippet: r.content || ''
            }));

            // Cache asynchronously (non-blocking) with upsert to prevent E11000 dup key errors
            LearningResourceModel.findOneAndUpdate(
                { skill: normalized },
                { skill: normalized, resources },
                { upsert: true, new: true }
            ).catch(cacheErr => console.warn(`[Node] Caching failed for gap "${term}":`, cacheErr.message));

            const formattedRes = resources.map(r => `• Title: ${r.title}\n  Link: ${r.url}\n  Description: ${r.snippet}`).join('\n\n');
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

    // We only process technical skills for the learning path, skipping abstract requirements
    const missingTerms = (state.matchedSkills || []).filter(s => s.status === "MISSING");
    const weakTerms = (state.matchedSkills || []).filter(s => s.status === "WEAK_MATCH");

    const searchTerms = [...missingTerms, ...weakTerms].map(t => t.term);
    let searchResultsText = "No web search required.";

    if (searchTerms.length > 0) {
        const searchTool = new TavilySearch({ maxResults: 2 });
        const resultsArray = await Promise.all(
            searchTerms.map(term => getResourceForTerm(term, searchTool))
        );
        // Filter out nulls (terms where Tavily returned nothing)
        const validResults = resultsArray.filter(Boolean);
        searchResultsText = validResults.length > 0 ? validResults.join('\n') : "No search results available.";
    }

    const prompt = getGapsAndPlanPrompt({
        missingTermsFormatted: formatTerms(missingTerms),
        weakTermsFormatted: formatTerms(weakTerms),
        searchResultsText
    });

    const structuredLlm = getStructuredModel(reportGapsAndPlanSchema);
    const response = await structuredLlm.invoke(prompt);

    if (process.env.NODE_ENV !== 'production') {
        console.log('[Node] processLearningPath Gemini Response:', JSON.stringify(response, null, 2));
    }

    return {
        skillGaps: response.skillGaps || [],
        preparationPlan: response.preparationPlan || [],
        learningResources: response.learningResources || [],
    };
}


/**
 * 5. Node to generate title
 */
export async function generateScoreAndTitle(state) {
    console.log(`[Node] Generating score and title...`);

    const company = state.jobDescriptionCompany || 'Company';
    const role = state.jobDescriptionRole || 'Role';
    const title = `${company} | ${role}`;

    const matchScore = computeMatchScore(state.matchedSkills || [], state.matchedRequirements || []);

    return {
        roadmapTitle: title,
        matchScore
    };
}

/**
 * 6. Node to generate technical scenario questions
 */
export async function generateTechnicalQuestions(state) {
    console.log(`[Node] Generating technical questions...`);

    const matchedTerms = [
        ...(state.matchedSkills || []).filter(s => s.status === "MATCHED"),
        ...(state.matchedRequirements || []).filter(r => r.status === "MATCHED")
    ];
    const missingTerms = [
        ...(state.matchedSkills || []).filter(s => s.status === "MISSING"),
        ...(state.matchedRequirements || []).filter(r => r.status === "MISSING")
    ];
    const weakTerms = [
        ...(state.matchedSkills || []).filter(s => s.status === "WEAK_MATCH"),
        ...(state.matchedRequirements || []).filter(r => r.status === "WEAK_MATCH")
    ];

    const prompt = getTechQuestionsPrompt({
        missingTermsFormatted: formatTerms(missingTerms),
        weakTermsFormatted: formatTerms(weakTerms),
        matchedTermsFormatted: formatTerms(matchedTerms),
        jobDescription: state.jobDescriptionText || ''
    });

    // Use creativeModelFallback for questions
    const structuredLlm = getCreativeStructuredModel(reportTechQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        technicalQuestions: response.technicalQuestions || []
    };
}

/**
 * 7. Node to generate behavioral probing questions
 */
export async function generateBehavioralQuestions(state) {
    console.log(`[Node] Generating behavioral questions...`);

    const missingTerms = [
        ...(state.matchedSkills || []).filter(s => s.status === "MISSING"),
        ...(state.matchedRequirements || []).filter(r => r.status === "MISSING")
    ];
    const weakTerms = [
        ...(state.matchedSkills || []).filter(s => s.status === "WEAK_MATCH"),
        ...(state.matchedRequirements || []).filter(r => r.status === "WEAK_MATCH")
    ];

    const prompt = getBehavioralQuestionsPrompt({
        resumeText: state.resumeText || '',
        missingTermsFormatted: formatTerms(missingTerms),
        weakTermsFormatted: formatTerms(weakTerms),
        jobDescription: state.jobDescriptionText || ''
    });

    // Use creativeModelFallback for questions
    const structuredLlm = getCreativeStructuredModel(reportBehavioralQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        behavioralQuestions: response.behavioralQuestions || []
    };
}

export async function persistInterviewReport(state) {
    console.log(`[Node] Saving interview report directly from state to MongoDB...`);
    const savedReport = await InterviewReportModel.create({
        user: state.userId,
        jobDescription: state.jobDescriptionId,
        resume: state.resumeId,
        scrapedSkills: state.matchedSkills || [],
        scrapedRequirements: state.matchedRequirements || [],
        title: state.roadmapTitle || 'My Interview Plan',
        matchScore: state.matchScore || 0,
        technicalQuestions: state.technicalQuestions || [],
        behavioralQuestions: state.behavioralQuestions || [],
        skillGaps: state.skillGaps || [],
        preparationPlan: state.preparationPlan || [],
        learningResources: state.learningResources || [],
    });

    return { savedReport };
}

export async function assembleFinalReport(state) {
    console.log(`[Node] Assembling final report (running generation tasks concurrently)...`);

    // Execute all four generation nodes concurrently using standard Node.js Promise.all
    const [scoreRes, pathRes, techRes, behavRes] = await Promise.all([
        generateScoreAndTitle(state),
        processLearningPath(state),
        generateTechnicalQuestions(state),
        generateBehavioralQuestions(state)
    ]);

    // Merge the individual results into a single consolidated state update
    return {
        ...scoreRes,
        ...pathRes,
        ...techRes,
        ...behavRes
    };
}