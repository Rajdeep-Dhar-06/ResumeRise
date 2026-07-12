# ResumeRise

> **AI-powered interview preparation platform** that maps your resume against real job postings and generates a fully personalized interview strategy — including technical questions, behavioral questions, skill gap analysis, a multi-day study roadmap, and curated learning resources.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Application Flows](#application-flows)
- [Project Structure](#project-structure)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)

---

## Overview

ResumeRise solves a real problem: candidates spend hours manually comparing their resume against job descriptions without knowing exactly what to study. ResumeRise automates this end-to-end.

**Upload a resume PDF. Paste a job URL. Get a complete, AI-generated interview roadmap in ~15 seconds.**

The platform:
- Scrapes job postings dynamically (no manual copy-pasting)
- Anonymizes your resume before sending it to any AI model (no private information is stored)
- Caches parsed resumes and job descriptions by content hash to avoid redundant LLM calls
- Runs a multi-step LangGraph pipeline to produce a structured, actionable report

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose v9 |
| AI Orchestration | LangGraph (`@langchain/langgraph`) |
| LLM | Google Gemini via `@langchain/google` |
| Web Search | Tavily via `@langchain/tavily` |
| Job Scraping | Jina Reader API (`r.jina.ai`) |
| PDF Parsing | `pdf-parse` via `@langchain/community` PDFLoader |
| PII Redaction | `compromise` + regex |
| Auth | JWT (httpOnly cookies) + `bcryptjs` |
| Validation | Zod v4 |
| Structured Logging | `pino` + `pino-http` + `pino-pretty` |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v7 |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Notifications | Sonner (toasts) |
| Icons | Lucide React |

---

## Key Features

- **Privacy-first resume processing** — PII (names, emails, phones, addresses, organizations) is stripped using a combination of regex and NLP (`compromise`) before the resume reaches any LLM
- **Content-hash caching** — Identical resumes (SHA-256 hash) and job URLs are cached in MongoDB; re-uploading the same resume or re-entering the same job URL skips redundant AI calls entirely
- **Dynamic job scraping** — Job descriptions are fetched via the Jina Reader API, which handles JavaScript-rendered pages and returns clean markdown — no manual copy-pasting needed
- **Structured LLM output** — All AI responses are validated with Zod schemas via LangChain's `.withStructuredOutput()` to ensure consistent, type-safe data
- **Match scoring** — A priority-weighted algorithm scores resume-to-job fit, with smoothing for sparse job descriptions and hard caps for missing required skills
- **Structured JSON Logging** — Integrated `pino` and `pino-http` for production-ready, structured log tracing. In local development, logs are cleanly colorized and formatted; in production, they stream raw JSON to stdout. Sensitive fields (passwords, tokens, cookies) are automatically redacted.
- **Delete & manage reports** — Users can delete reports with a two-step inline confirmation directly from the report view

---

## Application Flows

### 1. Authentication & Token Refresh Flow
```
User credentials ──► POST /api/auth/login
                           │
             ┌─────────────┴─────────────┐
        Access Token                Refresh Token
    (Returned in body)       (httpOnly secure cookie set)
             │                           │
  Saved in client state          Expires / Page Reload
             │                           │
  GET /api/auth/get-me       POST /api/auth/refresh
  (Authorization: Bearer)    (Generates new access token)
```

### 2. Report Generation Pipeline
```
User inputs PDF & JD URL ──► Compute SHA-256 hash of PDF (Client-side)
                                        │
                            POST /api/interview/checkDuplicate
                                        │
                     ┌──────────────────┴──────────────────┐
                 Cache HIT                             Cache MISS
                     │                                     │
           Load existing report ID              POST /api/interview/generateReport
                     │                                     │
            Navigate to report                 Invoke LangGraph State workflow:
                     │                                     │
                    END                      1. startAgent (Concurrent Ingestion):
                                                • Extract resume PDF & Anonymize PII
                                                • Scrape JD via Jina Reader & Extract
                                                • Audit skills against JD requirements
                                                           │
                                             2. assembleFinalReport:
                                                • Compute Match Score & Report Title
                                                • LLM: Gaps, Roadmap, mock interview Qs
                                                • Tavily: Fetch gap learning resources
                                                           │
                                             3. persistInterviewReport:
                                                • Save final structured report to MongoDB
                                                           │
                                                 Navigate to /interview/:id
```

---

## Project Structure

```
ResumeRise/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, environment
│   │   ├── controllers/     # Route handler logic
│   │   ├── langgraph/       # LangGraph state graph definition
│   │   ├── middlewares/     # JWT auth, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── nodes/           # LangGraph node functions
│   │   ├── prompts/         # LLM prompt templates
│   │   ├── routes/          # Express route definitions
│   │   ├── schemas/         # Zod validation schemas
│   │   └── utils/           # Anonymizer, score calculator, error classes
│   └── package.json
│
└── frontend/
    └── src/
        ├── components/
        │   ├── interview/   # CreatePlan, DashboardStats, RecentPlans, ParsingProgressBar
        │   ├── auth/        # Protected route wrapper
        │   └── ui/          # shadcn/ui component library
        ├── context/         # AuthContext, InterviewContext
        ├── hooks/           # useAuth, useInterview
        ├── lib/             # Axios instance, utility functions
        ├── pages/
        │   ├── auth/        # Login, Register
        │   └── interview/   # Home (dashboard), Interview (report view)
        └── services/        # auth.api.js, interview.api.js
```

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Google AI Studio API key (Gemini)
- Tavily API key

### 1. Clone the repository

```bash
git clone https://github.com/Rajdeep-Dhar-06/ResumeRise.git
cd ResumeRise
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below).

```bash
npm run dev
# Server starts on http://localhost:5000
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
```

```bash
npm run dev
# App starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# JWT
JWT_SECRET=your_jwt_secret_here

# Google Gemini
GOOGLE_API_KEY=your_gemini_api_key_here

# Tavily (for learning resource search)
TAVILY_API_KEY=your_tavily_api_key_here

# Jina Reader (optional — increases rate limits)
JINA_API_KEY=your_jina_api_key_here

# Environment
NODE_ENV=development
PORT=5000
LOG_LEVEL=info
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000
```

> **Note:** In production, set `VITE_API_BASE_URL` to your deployed backend URL and `NODE_ENV=production` on the server.

---

*Built with LangGraph, Google Gemini, and React.*
