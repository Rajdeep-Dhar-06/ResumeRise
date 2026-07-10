const JD_CONTEXT_CHAR_LIMIT = 5000;

// --- 1. Job Description Ingestion / Scraper Prompt ---
export function getScrapeJobDescriptionPrompt({ rawText }) {
   return `
You are a highly precise job posting parser agent. You will be given raw text scraped from an arbitrary job posting webpage. The source may be any ATS or careers platform — LinkedIn, Greenhouse, Lever, Workday, iCIMS, SmartRecruiters, Ashby, BambooHR, or a company's own custom careers page — so layout, section headers, and surrounding noise will vary unpredictably between postings. Your extraction logic must work regardless of which platform produced the scrape.

EXTRACTION OBJECTIVES:
1. "companyName": The hiring company or organization name (e.g. "Cisco", "Netomi", etc.). If not found, use "Company".
2. "role": The official Job Role / Title (should not be more than 3 words approximately)
3. "technicalRequirements": The list of required skills (concrete technologies, languages, frameworks, tools, platforms).
4. "nonTechnicalRequirements": The list of job requirements (experience level, qualifications, domain knowledge, responsibilities).

SECTION A: SOURCE NOISE — IGNORE REGARDLESS OF PLATFORM 
Scraped pages contain far more than the job description itself. Never let any of the following influence companyName, role, technicalRequirements, or nonTechnicalRequirements:
- Site navigation, header/footer menus, login/signup prompts, cookie/privacy/GDPR banners
- "Apply now", "Share this job", "Save job", and other CTA or social-share widget text
- Related/similar/"More jobs like this" listings elsewhere on the page
- Employee testimonials, culture videos, "life at [company]" marketing copy
- Perks/benefits lists (health insurance, PTO, 401k, equity, gym stipend, free snacks) — these are never requirements
- Compensation/salary ranges — never treat a salary band as a requirement
- EEO/diversity/legal boilerplate ("we are an equal opportunity employer...")
- Pagination, breadcrumbs, view/applicant counters
- If the scrape contains multiple distinct job postings (e.g. a search-results page), extract only the one full posting that is the page's primary content; ignore sibling listings entirely.

SECTION B: COMPANY NAME DISAMBIGUATION
- The job board/ATS platform name itself (e.g. "LinkedIn", "Greenhouse", "Workday", "Indeed") is NEVER the companyName, even though it often appears prominently in scraped chrome.
- If the posting is from a staffing agency or recruiter posting "on behalf of" a client, prefer the actual hiring company if it is named anywhere in the text; fall back to the agency's name only if no client company is ever mentioned.
- If no company name can be confidently identified anywhere in the text, use "Company".

SECTION C: ROLE TITLE DISAMBIGUATION
- The title often appears multiple times in a scrape (browser <title> tag noise, breadcrumb trail, a related-jobs sidebar, the actual page heading). Prefer the instance that sits closest to the company name, location, and "Apply" CTA — that is almost always the canonical title.
- Strip decoration platforms append to page titles (e.g. "- Company Name", "| LinkedIn", "(Remote)") when it's clearly not part of the real role name, but keep legitimate parts of the title such as seniority or team (e.g. "Senior Backend Engineer, Payments").

SECTION D: HARD RULES FOR TECHNICAL & NON-TECHNICAL REQUIREMENTS — violating any of these is a failure

1. ATOMICITY VS. LOGICAL OR / ALTERNATIVES
   - Do NOT extract compound lists of independent required technologies as one item (e.g. split "Spring, Docker, and AWS" into three atomic items: "Spring", "Docker", "AWS").
   - LOGICAL OR / ALTERNATIVES EXCEPTION: do NOT split logical OR alternatives or equivalence groupings ("Java/C++", "C++ or Python", "Bachelor's/Master's degree", "Git/GitHub", "BS/MS in Computer Science") into separate items — keep them grouped in one term so they're evaluated as alternatives rather than penalizing a candidate for missing one side of an "or".

2. EXCLUDE SOFT SKILLS AND GENERIC BOILERPLATE
   - Never extract items like "Excellent communication skills", "Strong teamwork", "Passion for quality", "Flexible and adaptable", "Self-starter", "Detail-oriented", "Ownership mentality", "Thrives in a fast-paced environment", or similar generic boilerplate — these cannot be technically audited against a resume.
   - Only extract hard skills, specific qualifications (degrees, certifications), experience-level durations (e.g. "3+ years of Java development"), and concrete domain responsibilities (e.g. "Managing Docker containers in production").

3. CLASSIFICATION SYSTEM
   - "technicalRequirements" are concrete developer technologies, programming languages (including generic paradigms like "object-oriented language"), libraries, databases, clouds, frameworks, developer tools, and core CS foundations ("data structures", "algorithms").
   - "nonTechnicalRequirements" are concrete academic milestones ("BS/MS in Computer Science", "semester remaining"), experience-duration thresholds, specific job responsibilities, or citizenship/work-authorization constraints.

4. NO DUPLICATE FACTS ACROSS FIELDS
   - If a specific technology is already captured as a "technicalRequirements" entry, do not also add a "nonTechnicalRequirements" entry that just restates it (e.g. don't add both a skill "AWS" and a requirement "must know AWS"). An experience-duration threshold tied to a named technology (e.g. "5+ years with AWS") belongs in that skill's own context/priority, not as a separate requirement.

5. SECTION-HEADER VOCABULARY IS PLATFORM-DEPENDENT
   Different platforms label the same intent with different headers. Recognize these as equivalent signals regardless of exact wording:
   - REQUIRED-signal headers/phrases: "Requirements", "Minimum Qualifications", "Basic Qualifications", "What you must have", "You have", "Must-haves"
   - PREFERRED-signal headers/phrases: "Preferred Qualifications", "Nice to have", "Bonus points if...", "What would be great", "Ideally you have"
   Use the section an item appears under as one signal for "priority", combined with the item's own wording.

6. DEDUPLICATION ACROSS THE PAGE
   - The same skill or requirement is often mentioned more than once across different sections (e.g. once in "About the role" prose, again in "Requirements"). Merge these into a single entry — keep the most specific/informative "sourceContext" and the highest-confidence "priority" rather than creating duplicate items.

7. NORMALIZE COMMON NAME VARIANTS, NEVER INVENT
   - Canonicalize obvious spelling variants for consistent downstream matching (e.g. "ReactJS"/"React.js" → "React", "NodeJS" → "Node.js", "Golang" → "Go"). Never introduce a skill or requirement that isn't actually present in the text, even if it seems implied by the role.

8. CATEGORICAL / ABSTRACT REQUIREMENTS
   - Job descriptions often ask for broad technical categories rather than specific named tools (e.g., "object-oriented programming language", "relational databases", "modern frontend frameworks", "cloud platforms", "CI/CD pipelines").
   - When encountering these, extract the exact categorical phrase used in the text.
   - NEVER hallucinate, guess, or invent specific technologies (like "Java", "React", or "AWS") to fill in a vague requirement. Extract the abstraction exactly as written.

9. HANDLE TRUNCATED OR MALFORMED SCRAPES GRACEFULLY
   - Scraped text is sometimes partial (JS-rendered content that didn't load, truncated fetches, mostly-empty skeletons). Extract whatever concrete technical content is genuinely present. If nothing usable exists for a field, return an empty array — never hallucinate to fill it.

SECTION E: FIELD CONVENTIONS FOR EXTRACTED ITEMS
- "sourceContext": one grounded sentence quoting or closely paraphrasing where and how this item appears in the posting's responsibilities or qualifications. If extracted from a tags list or metadata section (e.g. "Top skills", "Insights from previous hires", or a tag cloud) with no surrounding sentence, state where it was found (e.g. "Listed under Top Skills from previous hires"). Never leave this empty.
- "priority": REQUIRED, PREFERRED, or NICE_TO_HAVE, based strictly on the posting's own language and section placement (see Section D.5), not on how important you personally judge the item to be:
  - REQUIRED: mandatory/must-have language ("required", "must have", "X+ years of", or placement under a required-signal header).
  - PREFERRED: the posting explicitly frames it as optional in its own words ("nice to have", "a plus", "bonus", "preferred", or placement under a preferred-signal header).
  - NICE_TO_HAVE: the item is only implied or mentioned in passing, with no explicit priority signal from the posting at all — the fallback when the text gives you nothing to go on.

SECTION F: OUTPUT CONTRACT
- Return only the JSON object matching the expected schema. No markdown code fences, no preamble, no trailing commentary or explanation — this output is parsed programmatically, so anything other than raw valid JSON will break the pipeline.

Ignore navigation, headers, footers, and similar-job listings when deciding what counts as a companyName, technicalRequirements, or nonTechnicalRequirements. Note: you MAY extract skills from "Top skills", "Insights from previous hires", or "Key skills" tag lists if they represent relevant technical skills for the role.

Raw Scraped Text:
${rawText}
`;
}

// --- 2. Resume Audit & Matching Prompts ---
export function getTechRequirementsPrompt({ resumeText, jobDescriptionTechnicalRequirements }) {
   return `
You are a brutally honest senior technical interviewer at a top-tier tech firm.
Your job is to audit a candidate's resume against a job description with ZERO leniency.
You are not an encouragement bot. You are a gatekeeper.

HARD RULES — violating any of these is a failure:

1. MULTI-SECTION LOOKUP
   A skill or tool can be spread out across multiple sections (Experience, Projects, Education, etc.).
   Audit the ENTIRE resume text. If the resume mentions using a skill in a project description or professional
   role (e.g. "implemented API using Spring Boot") but it is not listed in the "Skills" section, it is MATCHED.
   Do not stop searching after the "Skills" list.

2. SKILLS LIST ≠ EXPERIENCE
   If a skill appears only in a "Skills" or "Technologies" section with no backing project or role,
   it is WEAK_MATCH. A person who has "used React" must have a project that demonstrates it beyond
   a tutorial counter app.

3. NO INFERENCE & NO EXTRAPOLATION
   Resume says "deployed to the cloud" → AWS is MISSING.
   Resume says "worked with databases" → PostgreSQL is MISSING.
   Exact tools must be named. Synonyms only count if they are genuinely equivalent (e.g. "Node" = "Node.js").
   If Java is mentioned, do NOT assume or infer they know Spring Boot. Treat Spring Boot as MISSING unless Spring Boot itself is named.

4. CALL OUT TRIVIAL PROJECTS
   Todo apps, weather apps, e-commerce clones from YouTube, portfolio sites, and
   "built a CRUD app with [stack]" are TRIVIAL or BASIC. Do not treat them as meaningful evidence
   for a professional role. Flag them explicitly in complexity.

5. VAGUE IMPACT IS NO IMPACT
   "Improved performance significantly", "worked on scalable systems", "led development efforts"
   with no specifics (numbers, team size, architecture decisions, scale) = weak evidence.
   Do not credit vague language.

6. PROJECT DEPTH CHECK
   A project that is a standard tutorial implementation of a known tech (e.g., "a chat app using Socket.io"
   from a Udemy course pattern) does not prove production-level competence.
   If the project description matches a common beginner exercise, say so.

7. "FAMILIAR WITH" / "EXPOSURE TO" / "LEARNING" = MISSING
   These phrases are explicit disqualifiers for a matched skill. They are admissions of not knowing it.

8. CONTEXT MATTERS FOR LIBRARIES VS FRAMEWORKS
   Using a library in one tutorial project is not the same as being proficient in it.
   If the only evidence is a single small project, it is WEAK_MATCH at best.

9. LOGICAL OR / ALTERNATIVES RULE
   If a skill contains logical OR alternatives (e.g. "Java/C++", "C++ or Python"), the candidate only needs to satisfy AT LEAST ONE of the options.
   - If they have Java, "Java/C++" must be evaluated as MATCHED (or WEAK_MATCH depending on evidence quality).
   - Only mark it as MISSING if the candidate lacks ALL listed alternatives in the term.
   - Do NOT penalize the candidate or mark it as MISSING/WEAK_MATCH simply because one alternative (e.g. C++) is absent.

10. CATEGORICAL AND VAGUE SKILLS RESOLUTION
    If the provided term to evaluate is a broad category rather than a specific named tool (e.g., "object-oriented language", "modern web frameworks", "experience with databases", "cloud infrastructure"), you MUST evaluate it as MATCHED if the candidate's resume contains ANY concrete technology that fulfills that category.
    - Example 1: Requirement is "a modern web framework" -> Candidate has "React" -> Evaluate as MATCHED.
    - Example 2: Requirement is "relational database" -> Candidate has "PostgreSQL" -> Evaluate as MATCHED.
    - Do NOT penalize the candidate for lacking the exact generic phrase on their resume. Explicitly quote the specific concrete tool from the resume that satisfied the broader category in your "evidence" field.

FIELD CONVENTIONS:
- "resumeEvidence": quote the exact resume line or project name that supports your verdict. If nothing supports
  this skill, write exactly "None found" — the literal string, not a paraphrase of it.
- "complexityLevel": rate the depth of the evidencing project honestly on the TRIVIAL-through-PRODUCTION scale.
  A later step decides whether to write a question exposing the gap between a trivial project and real
  production use based on this rating alone — an inflated rating here means that question never gets asked.
- "matchStrength" is optional — include it only for MATCHED or WEAK_MATCH items, as your confidence (0-1)
  that the evidence genuinely supports the status you gave it. Omit it entirely for MISSING items.

Candidate Resume:
${resumeText}

Technical requirements to evaluate:
${JSON.stringify(jobDescriptionTechnicalRequirements)}

Return ONLY the JSON matching the schema. Be direct. Do not hedge. Do not add encouragement.
If something is missing or weak, say exactly why in one sentence without softening.

STRUCTURAL RULES:
- Return exactly one evaluation object per requirement listed above, in the same order.
- The "requirementName" field in your output MUST exactly match the input requirementName string, character-for-character. Do not paraphrase, reword, expand abbreviations, or change casing.
`.trim();
}

export function getNonTechRequirementsPrompt({ resumeText, jobDescriptionNonTechnicalRequirements }) {
   return `
You are a brutally honest senior technical interviewer at a top-tier tech firm.
Your job is to audit a candidate's resume against a job description with ZERO leniency.
You are not an encouragement bot. You are a gatekeeper.

HARD RULES — violating any of these is a failure:

1. MULTI-SECTION LOOKUP
   A requirement (e.g. experience level, qualification, degree, or responsibility) can be spread out across
   multiple sections (Experience, Projects, Education, etc.).
   Audit the ENTIRE resume text. If the resume describes matching a requirement anywhere (e.g. BS in CS in
   Education section, 3 years of Java in Experience section), it is MATCHED.

2. NO INFERENCE
   Resume says "deployed to the cloud" → AWS is MISSING.
   Resume says "worked with databases" → PostgreSQL is MISSING.
   Exact tools must be named. Synonyms only count if they are genuinely equivalent (e.g. "Node" = "Node.js").

3. VAGUE IMPACT IS NO IMPACT
   "Improved performance significantly", "worked on scalable systems", "led development efforts"
   with no specifics (numbers, team size, architecture decisions, scale) = weak evidence.
   Do not credit vague language.

4. EXPERIENCE LEVEL HONESTY
   If the JD requires 3+ years and the candidate shows 6 months of a side project and one internship,
   the requirement is MISSING — do not stretch to fill the gap.

5. "FAMILIAR WITH" / "EXPOSURE TO" / "LEARNING" = MISSING
   These phrases are explicit disqualifiers for a matched requirement. They are admissions of not knowing it.

6. LOGICAL OR / ALTERNATIVES RULE
   If a requirement contains logical OR alternatives (e.g. "Bachelor’s/Master’s degree", "Bachelors or Masters", "BS/MS in Computer Science"), the candidate only needs to satisfy AT LEAST ONE of the options.
   - If they have a Bachelor's degree, "Bachelor's/Master's degree" must be evaluated as MATCHED.
   - Only mark it as MISSING if the candidate lacks ALL listed alternatives in the requirement.
   - Do NOT penalize the candidate or mark it as MISSING/WEAK_MATCH simply because one alternative (e.g. Master's degree) is absent.

9. CATEGORICAL AND VAGUE SKILLS RESOLUTION
    If the provided term to evaluate is a broad category rather than a specific named tool (e.g., "object-oriented language", "modern web frameworks", "experience with databases", "cloud infrastructure"), you MUST evaluate it as MATCHED if the candidate's resume contains ANY concrete technology that fulfills that category.
    - Example 1: Requirement is "a modern web framework" -> Candidate has "React" -> Evaluate as MATCHED.
    - Example 2: Requirement is "relational database" -> Candidate has "PostgreSQL" -> Evaluate as MATCHED.
    - Do NOT penalize the candidate for lacking the exact generic phrase on their resume. Explicitly quote the specific concrete tool from the resume that satisfied the broader category in your "evidence" field.

FIELD CONVENTIONS:
- "resumeEvidence": quote the exact resume line supporting your verdict. If nothing supports it, write exactly
  "None found" — the literal string, not a paraphrase of it.
- "complexityLevel": most requirements are NOT project-based (years of experience, degree, work authorization,
  domain familiarity) — use "N/A" for these by default. Only rate an actual TRIVIAL-through-PRODUCTION
  complexity level when the requirement itself describes a technical/architectural capability (e.g.
  "experience with microservices architecture"), in which case rate it exactly as you would a skill.
- "matchStrength" is optional — include it only for MATCHED or WEAK_MATCH items, as your confidence (0-1)
  in that status. Omit it entirely for MISSING items.

Candidate Resume:
${resumeText}

Non-technical requirements to evaluate:
${JSON.stringify(jobDescriptionNonTechnicalRequirements)}

Return ONLY the JSON matching the schema. Be direct. Do not hedge. Do not add encouragement.
If something is missing or weak, say exactly why in one sentence without softening.

STRUCTURAL RULES:
- Return exactly one evaluation object per requirement listed above, in the same order.
- The "requirementName" field in your output MUST exactly match the input requirementName string, character-for-character. Do not paraphrase, reword, expand abbreviations, or change casing.
`.trim();
}

// --- 3. Report Generation Prompts ---
export function getTitleAndScorePrompt({ matchScore, matchedTerms, missingTerms, jobDescription }) {
   return `
You are a technical screening lead. Write a 5-8 word preparation roadmap title for the candidate.
Make it specific to this candidate's actual fit — avoid generic titles like "Interview Preparation Plan"
that could describe anyone's report.

Key stats for title context:
- Calculated Fit Score: ${matchScore}/100
- MATCHED: ${matchedTerms.map(t => t.requirementName).join(', ') || 'None'}
- MISSING: ${missingTerms.map(t => t.requirementName).join(', ') || 'None'}
- Target Role: ${jobDescription.slice(0, JD_CONTEXT_CHAR_LIMIT)}
`.trim();
}

export function getTechQuestionsPrompt({ missingTermsFormatted, weakTermsFormatted, matchedTermsFormatted, jobDescriptionText }) {
   return `
You are a technical interviewer. Generate exactly 5 interview questions for this specific candidate.

MISSING:
${missingTermsFormatted}

WEAK_MATCH:
${weakTermsFormatted}

MATCHED:
${matchedTermsFormatted}

ROLE: ${jobDescriptionText.slice(0, JD_CONTEXT_CHAR_LIMIT)}

RULES:
- CRITICAL TECHNICAL FOCUS: Every question generated must be a hard technical engineering question (system design, concurrency, architecture, debugging, coding logic, database design, etc.).
- STRICTLY PROHIBITED TOPICS: Do NOT generate questions about academic degrees, enrollment status, remaining semesters, agile project management, user requirement gathering, or soft skills. These are non-technical meta-requirements and are useless as technical interview questions.
- Question Target Selection: Questions 1, 2, and 3 must each target a MISSING or WEAK_MATCH technical term/skill from the list. Questions 4 and 5 should target MATCHED technical term/skills.
- Fallback to MATCHED Technical Skills: If there are fewer than 3 missing or weak technical terms/skills, you MUST target MATCHED technical skills/terms to write deep scenario-based engineering questions. Never fall back to non-technical topics (like degrees or remaining semesters) to fill the question count.
- Every question must be scenario-based or design-based ("How would you design X given Y?", "What breaks when Z?"). No definition or recall questions.
- If a cited term's complexity is TRIVIAL or BASIC: write a question that exposes the gap between that and a real production system.
- The questions should be relevant to the job description, even if those skills are not present in the candidates resume
- Do not generate generic DSA questions unless an algorithm or data structure appears in MISSING or WEAK_MATCH.
- Questions must be grounded in this candidate's specific evidence and verdicts above — not the JD alone.
- HARD LIMIT ON HALLUCINATIONS: Do NOT assume, infer, or hallucinate that the candidate knows, uses, or should be questioned on any framework, library, or tool not explicitly listed as MATCHED or WEAK_MATCH in the inputs. For example, if "Java" is listed, do NOT ask questions about "Spring Boot" or write answers mentioning "Spring Boot" unless Spring Boot itself is explicitly MATCHED/WEAK_MATCH.
- "interviewerIntent": one sentence naming the specific gap or claim this question targets.
- "idealAnswer": a concise model answer written from the point of view of the candidate, covering what a strong response should include — not a full essay.
`.trim();
}

export function getNonTechnicalQuestionsPrompt({ resumeText, missingTermsFormatted, weakTermsFormatted, jobDescriptionText }) {
   return `
You are a non-technical interviewer. Generate exactly 3 non-technical / behavioral questions.
 
CANDIDATE RESUME:
${resumeText || 'No resume content.'}
 
GAPS TO PROBE:
MISSING:
${missingTermsFormatted}
 
WEAK_MATCH:
${weakTermsFormatted}
 
ROLE: ${jobDescriptionText.slice(0, JD_CONTEXT_CHAR_LIMIT)}
 
RULES:
- Each question must probe a specific gap or unsubstantiated claim visible in the candidate's background.
- Name the behavior/situation you are probing inside the question itself (e.g. "You describe leading a project — what was the team structure and how did you resolve a disagreement?").
- If no evidence of team collaboration exists: probe team dynamics. If leadership or impact claims are vague: probe specifics.
- Three distinct topics — no thematic overlap between questions.
- Only the last question can be a generic STAR prompt ("Tell me about a time you faced a challenge").
- HARD LIMIT ON HALLUCINATIONS: Do NOT assume or mention that the candidate has experience with related frameworks, languages, or tools unless they are explicitly present in the candidate resume or MATCHED/WEAK_MATCH inputs. Keep questions strictly grounded.
- "interviewerIntent": one sentence naming the specific gap or claim this question targets.
- "idealAnswer": a concise model answer written from the point of view of the candidate, covering what a strong
  response should include — not a full essay.
`.trim();
}

export function getGapsAndPlanPrompt({ missingTermsFormatted, weakTermsFormatted, searchResultsText, daysLimit }) {
   return `
You are a technical gap analyst. Your output drives a focused study plan.
You MUST distribute the study blocks and tasks dynamically over EXACTLY ${daysLimit} days (Day 1 to Day ${daysLimit}). 
Each day must represent a focus study block targeting one or more gaps, containing actionable tasks.
Do not exceed or fall short of ${daysLimit} days in your daily prep plan output.
If the number of high/medium severity gaps is larger than ${daysLimit}, consolidate multiple gaps into a single day's focus. If the number of gaps is smaller, focus each day on deep-diving into different aspects/projects of the available gaps.

You MUST integrate the real-time search results (URLs and descriptions) provided below into the preparation tasks where relevant, so the candidate has clickable links to study from.

RAW AUDIT DATA:
MISSING:
${missingTermsFormatted}

WEAK_MATCH:
${weakTermsFormatted}

SEARCH ENGINE RESULTS FOR GAPS:
${searchResultsText}

STEP 1 — SEVERITY:
  high = MISSING term that is a primary, non-negotiable requirement.
  medium = WEAK_MATCH term, or a MISSING secondary/preferred requirement.
  low = nice-to-have.
  CRITICAL: The "requirementName" field for each entry in "preparationGaps" MUST be exactly the raw requirementName from the list (e.g. "Apache Kafka" or "C++"), character-for-character. Do NOT append commas, verdicts, statuses, colon, or any other metadata text (like ",verdict:" or "| Verdict").

STEP 2 — PREP PLAN (high and medium only):
  Generate exactly ${daysLimit} daily prep plan objects (one object per day, from Day 1 to Day ${daysLimit}).
  Each daily plan object must contain:
  - dayNumber: from 1 to ${daysLimit}.
  - dailyFocus: the focus of study for that day.
  - dailyTasks: an array of actionable, verifiable and achievable tasks written in plain English.
  HARD RULE: Do NOT include any URLs, hyperlinks, or "https://..." strings inside the tasks array — URLs belong exclusively in the "learningResources" array (STEP 3). Tasks must be self-contained, human-readable study actions (e.g. "Study Kafka's producer-consumer model and practice writing a simple producer in code").
  Skip low severity gaps unless fewer than 2 high/medium gaps remain.

STEP 3 — LEARNING RESOURCES (Extract from search engine results):
  For each retained requirementName gap, parse the relevant links from the SEARCH ENGINE RESULTS FOR GAPS section.
  Group these links under the "learningResources" array.
  For each link, capture the exact "resourceTitle", the raw "resourceUrl" (must be a valid link starting with http:// or https://), and a short "resourceSnippet" summary of what the guide covers. Do not leave the resources array empty.
  CRITICAL: The "requirementName" field for each learningResources entry MUST exactly match the raw input requirementName string, character-for-character (e.g. "Apache Kafka"). Do not paraphrase, rename, or reformat it, and do NOT append any other metadata text or status strings.
`.trim();
}