import ai from '../config/gemini.js';
import { AI_MODEL, TEMPERATURE_MEDIUM, TEMPERATURE_LOW } from '../config/constants.js';
import {
  reportScoreSchema,
  reportTechQuestionsSchema,
  reportBehavioralQuestionsSchema,
  reportGapsAndPlanSchema
} from '../schemas/interviewReport.schema.js';
import { skillsMatchSchema, requirementsMatchSchema } from '../schemas/matchedTerm.schema.js';
import { timeAsyncCall } from '../utils/logger.js';
import { generateResponse } from '../utils/modelFallback.js';
import { computeMatchScore } from '../utils/scoreCalculator.js';

/**
 * Generates a structured interview report comparing the candidate's details
 * against the target job description requirements.
 * 
 * @param {object} params - Inputs for report generation
 * @param {string} params.resume - Plain text of the candidate resume
 * @param {string} params.selfDescription - Candidate's personal description
 * @param {string} params.jobDescription - Cleaned text of the job description
 * @param {array} params.matchedSkills - Raw matched skills array from audit
 * @param {array} params.matchedRequirements - Raw matched requirements array from audit
 * @returns {Promise<object>} Structured AI interview strategy report
 */
async function generateInterviewReport({
  selfDescription,
  jobDescription,
  matchedSkills = [],
  matchedRequirements = [],
}) {
  // Separate audit results by status
  const missingTerms = [
    ...matchedSkills.filter(s => s.status === "MISSING"),
    ...matchedRequirements.filter(r => r.status === "MISSING")
  ];
  const weakTerms = [
    ...matchedSkills.filter(s => s.status === "WEAK_MATCH"),
    ...matchedRequirements.filter(r => r.status === "WEAK_MATCH")
  ];
  const matchedTerms = [
    ...matchedSkills.filter(s => s.status === "MATCHED"),
    ...matchedRequirements.filter(r => r.status === "MATCHED")
  ];

  const formatTerms = (terms) =>
    terms.length > 0
      ? terms.map(t =>
        `  • "${t.term}" | Evidence: "${t.evidence || 'None'}" | Verdict: "${t.verdict || 'None'}" | Complexity: "${t.complexity || 'N/A'}"`
      ).join('\n')
      : "  None.";

  const termCounts = {
    matched: matchedTerms.length,
    weak: weakTerms.length,
    missing: missingTerms.length,
  };

  const matchScore = computeMatchScore(matchedSkills, matchedRequirements);

    // Score & Title

  const scorePromise = (async () => {
    const rawSchema = reportScoreSchema.toJSONSchema();
    delete rawSchema.$schema;

    const prompt = `
      You are a technical screening lead. Write a 5-8 word preparation roadmap title for the candidate.
      
      Key stats for title context:
      - Calculated Fit Score: ${matchScore}/100
      - MATCHED (${termCounts.matched} terms): ${matchedTerms.slice(0, 3).map(t => t.term).join(', ')}
      - MISSING (${termCounts.missing} terms): ${missingTerms.slice(0, 3).map(t => t.term).join(', ')}
      - Target Role: ${jobDescription.slice(0, 300)}
      `.trim();

    const response = await timeAsyncCall('AI generateInterviewReport - Score & Title', () =>
      generateResponse(ai, {
        contents: prompt,
        generationConfig: {
          temperature: TEMPERATURE_MEDIUM,
          responseMimeType: 'application/json',
          responseSchema: rawSchema,
        }
      })
    );
    return JSON.parse(response.text);
  })();

    // Technical Questions
  const techPromise = (async () => {
    const rawSchema = reportTechQuestionsSchema.toJSONSchema();
    delete rawSchema.$schema;

    const prompt = `
      You are a technical interviewer. Generate exactly 5 interview questions for this specific candidate.

      CANDIDATE:
      ${selfDescription}

      MISSING: ${formatTerms(missingTerms)}
      WEAK_MATCH: ${formatTerms(weakTerms)}
      MATCHED: ${formatTerms(matchedTerms)}

      ROLE: ${jobDescription.slice(0, 600)}

      RULES:
      - Questions 1, 2, and 3 must each reference a named MISSING or WEAK_MATCH term.
      - Every question must be scenario-based or design-based ("How would you design X given Y?", "What breaks when Z?"). No definition or recall questions.
      - If a cited project has complexityFlag TRIVIAL or BASIC: write a question that exposes the gap between that project and a real production system.
      - Do not generate generic DSA questions unless an algorithm or data structure appears in MISSING or WEAK_MATCH.
      - Questions must be grounded in this candidate's specific background — not the JD alone.
      `.trim();

    const response = await timeAsyncCall('AI generateInterviewReport - Tech Questions', () =>
      generateResponse(ai, {
        contents: prompt,
        generationConfig: {
          temperature: TEMPERATURE_MEDIUM,
          responseMimeType: 'application/json',
          responseSchema: rawSchema,
        }
      })
    );
    return JSON.parse(response.text);
  })();

    // Behavioral Questions
  const behavioralPromise = (async () => {
    const rawSchema = reportBehavioralQuestionsSchema.toJSONSchema();
    delete rawSchema.$schema;

    const prompt = `
      You are a behavioral interviewer. Generate exactly 3 behavioral questions.

      CANDIDATE:
      ${selfDescription}

      GAPS TO PROBE:
      MISSING: ${formatTerms(missingTerms)}
      WEAK_MATCH: ${formatTerms(weakTerms)}

      ROLE: ${jobDescription.slice(0, 400)}

      RULES:
      - Each question must probe a specific gap or unsubstantiated claim visible in the candidate's background.
      - Name the behavior you are probing inside the question itself (e.g. "You describe leading a project — what was the team structure and how did you resolve a technical disagreement?").
      - No generic STAR prompts ("Tell me about a time you faced a challenge").
      - If no evidence of team collaboration exists: probe team dynamics. If leadership or impact claims are vague: probe specifics.
      - Three distinct topics — no thematic overlap between questions.
      `.trim();

    const response = await timeAsyncCall('AI generateInterviewReport - Behavioral Questions', () =>
      generateResponse(ai, {
        contents: prompt,
        generationConfig: {
          temperature: TEMPERATURE_MEDIUM,
          responseMimeType: 'application/json',
          responseSchema: rawSchema,
        }
      })
    );
    return JSON.parse(response.text);
  })();

    // Skill Gaps & Prep Plan
  const gapsAndPlanPromise = (async () => {
    const rawSchema = reportGapsAndPlanSchema.toJSONSchema();
    delete rawSchema.$schema;

    const prompt = `
      You are a technical gap analyst. Your output drives a focused study plan.

      RAW AUDIT DATA:
      MISSING: ${formatTerms(missingTerms)}
      WEAK_MATCH: ${formatTerms(weakTerms)}

      STEP 1 — FILTER (execute before any output):
      From the terms above, retain ONLY concrete, learnable technical items.
        ✓ Retain: programming languages, frameworks, libraries, tools, platforms, APIs, protocols, algorithms, data structures, system design patterns, database technologies, architectural concepts.
        ✗ Discard: soft skills, behavioral traits, attitude descriptors, process requirements, organizational phrases, experience-level statements.
        ✗ Discard rule: if a term cannot be learned from documentation, a hands-on project, or a focused course — discard it.
        ✗ Discard examples: "work with stakeholders", "proactively seek knowledge", "apply engineering principles", "time management", "cooperative team environment", "seek feedback", "1+ year experience", "complete projects on schedule".

      STEP 2 — SEVERITY (for retained terms only):
        HIGH = MISSING term that is a primary, non-negotiable requirement.
        MEDIUM = WEAK_MATCH term, or a MISSING secondary/preferred requirement.
        LOW = nice-to-have.

      STEP 3 — PREP PLAN (HIGH and MEDIUM only):
        Per gap: one 2–4 day study block with a concrete resource type (official docs, hands-on project, or course category) and a specific verifiable deliverable.
        Skip LOW severity gaps unless fewer than 2 HIGH/MEDIUM gaps remain after filtering.
      `.trim();

    const response = await timeAsyncCall('AI generateInterviewReport - Gaps & Prep Plan', () =>
      generateResponse(ai, {
        contents: prompt,
        generationConfig: {
          temperature: TEMPERATURE_MEDIUM,
          responseMimeType: 'application/json',
          responseSchema: rawSchema,
        }
      })
    );
    return JSON.parse(response.text);
  })();

  // Resolve concurrently
  const [scoreRes, techRes, behavioralRes, gapsRes] = await Promise.all([
    scorePromise,
    techPromise,
    behavioralPromise,
    gapsAndPlanPromise,
  ]);

  return {
    matchScore: matchScore,
    title: scoreRes.title || 'My Interview Plan',
    technicalQuestions: techRes.technicalQuestions || [],
    behavioralQuestions: behavioralRes.behavioralQuestions || [],
    skillGaps: gapsRes.skillGaps || [],
    preparationPlan: gapsRes.preparationPlan || [],
  };
}

/**
 * Matches extracted requirements and skills against the parsed resume text.
 * 
 * @param {string} resumeText - Plain text parsed from the resume
 * @param {string[]} skills - Extracted skills from the job description
 * @param {string[]} requirements - Extracted requirements from the job description
 * @returns {Promise<object>} Match analysis for each skill and requirement
 */
async function matchTermsAgainstResume(resumeText, skills, requirements) {
    // Skills matching
  const skillsPromise = (async () => {
    if (!skills || skills.length === 0) {
      return { scrapedSkills: [] };
    }

    const rawSchema = skillsMatchSchema.toJSONSchema();
    delete rawSchema.$schema;

    const prompt = `
    You are a brutally honest senior technical interviewer at a top-tier tech firm.
    Your job is to audit a candidate's resume against a job description with ZERO leniency.
    You are not an encouragement bot. You are a gatekeeper.

    HARD RULES — violating any of these is a failure:

    1. SKILLS LIST ≠ EXPERIENCE
      If a skill appears only in a "Skills" or "Technologies" section with no backing project or role,
      it is WEAK_MATCH. A person who has "used React" must have a project that demonstrates it beyond
      a tutorial counter app.

    2. NO INFERENCE
      Resume says "deployed to the cloud" → AWS is MISSING.
      Resume says "worked with databases" → PostgreSQL is MISSING.
      Exact tools must be named. Synonyms only count if they are genuinely equivalent (e.g. "Node" = "Node.js").

    3. CALL OUT TRIVIAL PROJECTS
      Todo apps, weather apps, e-commerce clones from YouTube, portfolio sites, and
      "built a CRUD app with [stack]" are TRIVIAL or BASIC. Do not treat them as meaningful evidence
      for a professional role. Flag them explicitly in complexity.

    4. VAGUE IMPACT IS NO IMPACT
      "Improved performance significantly", "worked on scalable systems", "led development efforts"
      with no specifics (numbers, team size, architecture decisions, scale) = weak evidence.
      Do not credit vague language.

    5. PROJECT DEPTH CHECK
      A project that is a standard tutorial implementation of a known tech (e.g., "a chat app using Socket.io"
      from a Udemy course pattern) does not prove production-level competence.
      If the project description matches a common beginner exercise, say so.

    6. "FAMILIAR WITH" / "EXPOSURE TO" / "LEARNING" = MISSING
      These phrases are explicit disqualifiers for a matched skill. They are admissions of not knowing it.

    7. CONTEXT MATTERS FOR LIBRARIES VS FRAMEWORKS
      Using a library in one tutorial project is not the same as being proficient in it.
      If the only evidence is a single small project, it is WEAK_MATCH at best.

    Candidate Resume:
    ${resumeText}

    Skills to evaluate:
    ${JSON.stringify(skills)}

    Return ONLY the JSON matching the schema. Be direct. Do not hedge. Do not add encouragement.
    If something is missing or weak, say exactly why in one sentence without softening.
    `.trim();

    const response = await timeAsyncCall('AI matchSkillsAgainstResume', () =>
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
  })();

    // Requirements matching
  const requirementsPromise = (async () => {
    if (!requirements || requirements.length === 0) {
      return { scrapedRequirements: [] };
    }

    const rawSchema = requirementsMatchSchema.toJSONSchema();
    delete rawSchema.$schema;

    const prompt = `
    You are a brutally honest senior technical interviewer at a top-tier tech firm.
    Your job is to audit a candidate's resume against a job description with ZERO leniency.
    You are not an encouragement bot. You are a gatekeeper.

    HARD RULES — violating any of these is a failure:

    1. NO INFERENCE
      Resume says "deployed to the cloud" → AWS is MISSING.
      Resume says "worked with databases" → PostgreSQL is MISSING.
      Exact tools must be named. Synonyms only count if they are genuinely equivalent (e.g. "Node" = "Node.js").

    2. VAGUE IMPACT IS NO IMPACT
      "Improved performance significantly", "worked on scalable systems", "led development efforts"
      with no specifics (numbers, team size, architecture decisions, scale) = weak evidence.
      Do not credit vague language.

    3. EXPERIENCE LEVEL HONESTY
      If the JD requires 3+ years and the candidate shows 6 months of a side project and one internship,
      the requirement is MISSING — do not stretch to fill the gap.

    4. "FAMILIAR WITH" / "EXPOSURE TO" / "LEARNING" = MISSING
      These phrases are explicit disqualifiers for a matched requirement. They are admissions of not knowing it.

    Candidate Resume:
    ${resumeText}

    Requirements to evaluate:
    ${JSON.stringify(requirements)}

    Return ONLY the JSON matching the schema. Be direct. Do not hedge. Do not add encouragement.
    If something is missing or weak, say exactly why in one sentence without softening.
    `.trim();

    const response = await timeAsyncCall('AI matchRequirementsAgainstResume', () =>
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
  })();

  // Run both audit calls concurrently
  const [skillsResult, reqsResult] = await Promise.all([skillsPromise, requirementsPromise]);

  return {
    scrapedSkills: skillsResult.scrapedSkills || [],
    scrapedRequirements: reqsResult.scrapedRequirements || [],
  };
}

export {
  generateInterviewReport,
  matchTermsAgainstResume,
};
