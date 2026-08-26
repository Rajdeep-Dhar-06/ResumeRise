# AGENTS.md — ResumeRise AI Collaboration Log

This file is the **shared working memory** for all AI agents (Antigravity, Gemini, Claude, etc.) collaborating on the ResumeRise codebase. Before making any changes, an agent MUST read this file. After completing work, it MUST update the relevant sections.

---

## Project Overview

ResumeRise is a full-stack job application intelligence platform. It consists of:
- **/frontend** — React + Vite SPA (TypeScript)
- **/backend** — Node.js + Express REST API with MongoDB
- **/ai_service** — Python FastAPI AI microservice (the primary active scope)

> Current AI engineering sprint is scoped to /ai_service ONLY. Do NOT modify /frontend or /backend unless explicitly instructed.

---

## AI Service Architecture (Current Final State — 2026-08-22)

### Core Pipeline

`
POST /api/analyze
    |
[Stage 1 — Parallel Ingest]
  anonymize_text(candidate_text) | get_job_description(jd_url)
    |                                    |
create_vector_store(clean_text)    JobDescription (Pydantic)
    |
[Stage 2 — Parallel RAG Evaluation]
  asyncio.gather(evaluate_requirement(req, vector_store) for ALL requirements)
    |
  List[RequirementEvaluation]
    |
[Stage 3 — Parallel Augmentation]
  calculate_final_score() | get_learning_resources() | generate_tech_questions() | generate_non_tech_questions()
                                    |
                            generate_study_plan()
    |
[Stage 4 — Compile]
  FinalReport -> JSON response
`

---

## 3-Phase Execution Roadmap

| Phase | Scope | Focus | Status | Verification Gate |
|---|---|---|---|---|
| **Phase 1** | Foundation & Prompts | Schemas, config, parser cleanup, vector store tuning, prompts modernization (ChatPromptTemplate + Pydantic outputs) | 🟢 **COMPLETE** | pytest tests/test_step1_ingest.py tests/test_step2_eval.py -v (9/9 Passed) |
| **Phase 2** | Service Layer | Scorer (70/30 math), search wrapper (Tavily priority filter), augmentation chains | 🟢 **COMPLETE** | pytest tests/test_step2_services.py -v (6/6 Passed) |
| **Phase 3** | Orchestrator & API | Async DAG orchestrator, FastAPI routes (/health, /api/analyze), main.py | 🟢 **COMPLETE** | pytest tests/ -v (19/19 Passed) |

---

## Critical Architectural Decisions

Agents must NOT reverse these without explicit user instruction.

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Input Format | Plain text career transcript / profile text | PDF file upload | PDFs add complexity with zero benefit. Text enables voice transcripts, copy-paste, textarea. |
| Vector Store | NONE (Removed) | FAISS (in-memory) | Candidate text is easily within the 1M token context window. RAG adds unnecessary API cost and latency. |
| Embedding Model | NONE (Removed) | gemini-embedding-2 | Embeddings are no longer generated for candidate texts. |
| Chunking | NONE (Removed) | RecursiveCharacterTextSplitter | Full context is provided directly to the LLM. |
| LLM Evaluation | Batch Prompting (2 calls total) | One call per requirement | Evaluating every requirement independently caused severe Rate Limit exhaustion on the Free Tier (15 RPM). Batching solves this and improves semantic reasoning via full context visibility. |
| Scoring Formula | (tech_avg * 0.70) + (non_tech_avg * 0.30) | Equal weighting | Technical requirements are the primary hiring signal for software roles. |
| Match Tiers | 5-tier: EXPERT/STRONG/BASIC/WEAK/NO_MATCH | 3-tier (MATCHED/WEAK/MISSING) | 5-tier allows granular scoring (100/80/50/20/0) and richer LLM reasoning. |
| Interview Questions | 5 Tech + 5 Non-Tech in SEPARATE LLM calls | Combined 10-question single call | Separate prompts prevent cross-contamination of question types. |
| Tavily Capping | Only REQUIRED priority + WEAK/NO_MATCH gaps (top 3) | All gaps | Prevents API credit waste and keeps latency low. |
| PII Anonymization | scrubadub | Presidio / Pure Regex | Simpler, no NLP model downloads, sufficient for email/phone redaction. |
| Resume Segmentation | REMOVED ENTIRELY | Was planned as separate LLM call | Resume is too small. Context window handles full text trivially. |
| camelCase | BaseSchema with alias_generator=to_camel | Manual field aliasing | Auto-serializes all Pydantic models to camelCase for React frontend. |

---

## Prompts Registry (Modernized LCEL + Pydantic)

All prompts live in ai_service/prompts/prompts.py. Do NOT inline prompts in service files.

| Prompt | Type | Bound Schema | Used By |
|---|---|---|---|
| SCRAPE_JD_PROMPT | ChatPromptTemplate | JobDescription | services/scraper.py |
| EVALUATION_PROMPT | ChatPromptTemplate | RequirementEvaluation | services/evaluator.py |
| TECH_QUESTIONS_PROMPT | ChatPromptTemplate | TechQuestionsResult | services/augmentation.py |
| NON_TECH_QUESTIONS_PROMPT | ChatPromptTemplate | NonTechQuestionsResult | services/augmentation.py |
| STUDY_PLAN_PROMPT | ChatPromptTemplate | StudyPlanResult | services/augmentation.py |
| segment_resume_prompt | DELETED | N/A | Removed — obsolete |

---

## File Status Registry

| File | Status | Notes |
|---|---|---|
| config.py | 🟢 COMPLETE | Embeddings singleton (gemini-embedding-2) + Gemini LLMs. |
| main.py | 🟢 COMPLETE | FastAPI entry point with CORS and error handlers. |
| orchestrator.py | 🟢 COMPLETE | Core async DAG pipeline (nalyze_candidate). |
| api/__init__.py | 🟢 COMPLETE | Package export. |
| api/analyze.py | 🟢 COMPLETE | POST /api/analyze accepting AnalyzeRequest. |
| api/health.py | 🟢 COMPLETE | GET /health liveness probe. |
| services/parser.py | 🟢 COMPLETE | Pure text nonymize_text() with scrubadub. |
| services/scraper.py | 🟢 COMPLETE | Jina reader + Gemini structured extraction (xtract_job_description, get_job_description). |
| services/vector_store.py | 🟢 COMPLETE | chunk_size=800, overlap=100. Uses singleton embeddings. |
| services/evaluator.py | 🟢 COMPLETE | Parallel 5-tier requirement evaluation. |
| services/scorer.py | 🟢 COMPLETE | 70/30 weighted math with half-up arithmetic rounding. |
| services/search.py | 🟢 COMPLETE | Tavily wrapper with top-3 critical gap filter. |
| services/augmentation.py | 🟢 COMPLETE | Tech & non-tech question generators + dynamic study plan chain. |
| schemas/base.py | 🟢 COMPLETE | camelCase serialization via BaseSchema. |
| schemas/report.py | 🟢 COMPLETE | MatchTier, PriorityLevel, GapSeverity, JobRequirement, JobDescription. |
| schemas/evaluation.py | 🟢 COMPLETE | RequirementEvaluation. |
| schemas/final_report.py | 🟢 COMPLETE | InterviewQuestion, TechQuestionsResult, NonTechQuestionsResult, LearningResource, DailyPlan, StudyPlanResult, FinalReport. |
| schemas/requests.py | 🟢 COMPLETE | AnalyzeRequest. |
| prompts/prompts.py | 🟢 COMPLETE | All 5 ChatPromptTemplates modernized. |
| tests/test_step1_ingest.py | 🟢 COMPLETE | 7/7 tests passing. |
| tests/test_step2_eval.py | 🟢 COMPLETE | 2/2 tests passing. |
| tests/test_step2_services.py | 🟢 COMPLETE | 6/6 tests passing. |
| tests/test_step3_orchestrator.py | 🟢 COMPLETE | 4/4 tests passing. |

---

## Agent Changelog

| Date | Agent | Change | Files Affected |
|---|---|---|---|
| 2026-08-18 | Antigravity | Initial scaffold, schema definitions, Step 1 boilerplate | schemas/, services/parser.py, config.py |
| 2026-08-19 | Antigravity | Fixed test_step1 custom names. Bumped model to gemini-3.6-flash | tests/test_step1_ingest.py, config.py |
| 2026-08-19 | Antigravity | Created Step 2 tests and scaffolded evaluator/vector_store | tests/test_step2_eval.py, services/evaluator.py, services/vector_store.py |
| 2026-08-20 | Antigravity | Merged evaluation prompts into EVALUATION_PROMPT (ChatPromptTemplate). Removed 3-tier legacy prompts. | prompts/prompts.py |
| 2026-08-22 | Antigravity | Final architecture review. Removed PDF parsing. Finalized pure-text RAG pipeline. Created AGENTS.md and final implementation_plan. | AGENTS.md, implementation_plan.md |
| 2026-08-22 | Antigravity | Structured 3-Phase roadmap and prompt modernization strategy. | AGENTS.md, implementation_plan.md |
| 2026-08-22 | Antigravity | **Completed Phase 1**: Implemented new schemas (inal_report.py, equests.py), modernized all ChatPromptTemplate prompts, updated parser and vector store to pure text with gemini-embedding-2, standardized imports. Verified with 9/9 passing tests. | schemas/, prompts/, services/, config.py, 	ests/ |
| 2026-08-22 | Antigravity | **Completed Phase 2**: Implemented scorer.py (70/30 math with half-up rounding), search.py (Tavily search wrapper), ugmentation.py (tech/non-tech questions and dynamic study plan). Verified with 6/6 passing tests. | services/scorer.py, services/search.py, services/augmentation.py, 	ests/test_step2_services.py |
| 2026-08-22 | Antigravity | **Completed Phase 3**: Implemented async orchestrator.py DAG pipeline, FastAPI main.py entrypoint, and route handlers (pi/health.py, pi/analyze.py). Verified entire test suite with 19/19 passing tests. | orchestrator.py, main.py, pi/, 	ests/test_step3_orchestrator.py |
