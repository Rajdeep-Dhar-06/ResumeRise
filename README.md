# ResumeRise

> **Production-grade, AI-driven interview strategy engine that analyzes resume PDFs against live job descriptions to generate personalized, priority-weighted preparation roadmaps.**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-v3.12+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Redis](https://img.shields.io/badge/Redis-v5-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v9-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-4285F4?style=flat-square&logo=googlegemini)](https://ai.google.dev/)

---

## Overview

Candidates applying for software engineering roles face a persistent challenge: manually cross-referencing resumes against complex job descriptions is time-consuming and inefficient. Standard tools fail to quantify technical skill gaps or produce actionable, prioritized study strategies.

**ResumeRise** provides an automated interview preparation engine. Given a candidate's resume PDF and a target job posting URL, ResumeRise extracts, anonymizes, parses, and evaluates the candidate's profile against job requirements in seconds.

### Core Engineering Capabilities

- **AI-Powered Career Intelligence Platform**: Built a full-stack intelligence platform enabling candidates to generate hyper-personalized interview roadmaps by parsing PDF resumes, leveraging a decoupled microservice architecture composed of a Node.js orchestrator and a Python FastAPI inference engine backed by MongoDB.
- **Concurrent Batch Inference Pipeline**: Engineered an asynchronous evaluation DAG using `asyncio.gather` and Batch Prompting to evaluate candidate technical requirements in parallel, reducing LLM API roundtrips and dropping total inference latency from 45 seconds to 10 seconds while preventing rate-limit exhaustion.
- **Asynchronous Task Orchestration**: Architected a highly resilient background processing queue using BullMQ and Redis to decouple long-running generative tasks from the main event loop, eliminating HTTP timeouts and guaranteeing job execution without dropping requests under heavy concurrent workloads.
- **Type-Safe Schema Validation & Security**: Enforced end-to-end data integrity by utilizing Zod for API payloads and LangChain (LCEL) with Pydantic to force the LLM into generating strictly-typed JSON, preventing malformed MongoDB writes alongside robust JWT authentication and API rate limiting.
- **Interactive Client & Asynchronous UI**: Developed a modular client using React, Vite, and Tailwind CSS, featuring a robust drag-and-drop PDF uploader and an optimized short-polling mechanism to dynamically render the generated interview roadmap without blocking the main browser thread.

---

## Application Screenshots

<table>
  <tr>
    <td align="center"><b>Register</b></td>
    <td align="center"><b>Create Plan</b></td>
  </tr>
  <tr>
    <td><img src="images/Register.png" alt="Register" width="100%"></td>
    <td><img src="images/Home.png" alt="Create Plan" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Dashboard</b></td>
    <td align="center"><b>Report Overview &amp; Skill Gaps</b></td>
  </tr>
  <tr>
    <td><img src="images/Dashboard.png" alt="Dashboard" width="100%"></td>
    <td><img src="images/Report.png" alt="Report Overview" width="100%"></td>
  </tr>
</table>

---

## System Architecture

The application is structured into three distinct tiers:

1. **Client Tier (React)**: Handles file uploads and asynchronously short-polls the backend for background job completion.
2. **API Gateway (Node.js/Express)**: Handles authentication, middleware validation, PDF parsing, and enqueues heavy workloads into a Redis-backed BullMQ queue.
3. **Inference Engine (Python/FastAPI)**: A stateless, high-performance inference engine that executes the parallel Directed Acyclic Graph (DAG) for scraping, evaluating, and generating LLM content.

```text
Client (React) -> Node.js Gateway (PDF Parse, Auth) -> BullMQ (Redis) -> Python FastAPI (Asyncio DAG, LLM) -> MongoDB
```

---

## Project Structure

```text
ResumeRise/
├── backend/                  # Node.js API Gateway & Background Queues
│   ├── src/
│   │   ├── config/           # Database and Redis connections
│   │   ├── controllers/      # Auth and Interview API route controllers
│   │   ├── middlewares/      # JWT verification, PDF upload (Multer), Zod validation
│   │   ├── models/           # Mongoose schemas (User, Report)
│   │   ├── queues/           # BullMQ worker process targeting the AI Service
│   │   └── routes/           # Express routing endpoints
│
├── ai_service/               # Python FastAPI Inference Engine
│   ├── api/                  # FastAPI routing endpoints
│   ├── prompts/              # LangChain ChatPromptTemplates
│   ├── schemas/              # Pydantic structured output models
│   └── services/             # Core DAG logic (scraper, evaluator, augmentation)
│
└── frontend/                 # React SPA
    ├── src/
        ├── components/       # UI components (Dashboard, CreatePlan)
        ├── context/          # React Context state management
        └── pages/            # Application views
```

---

## API Overview

### Authentication Endpoint Group (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account (Rate limited: 5 req/hr) |
| `POST` | `/api/auth/login` | Public | Authenticate user; returns Access Token & sets Refresh Cookie (Rate limited: 10 req/5min) |
| `POST` | `/api/auth/refresh` | Public | Issue new Access Token using valid HttpOnly Refresh Cookie |
| `POST` | `/api/auth/logout` | Private | Clear HttpOnly Refresh Cookie and invalidate session |
| `GET` | `/api/auth/get-me` | Private | Retrieve authenticated user profile |

### Interview Report Endpoint Group (`/api/interview`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/interview/reports` | Private | Submit candidate profile & Job URL; queues generation job and returns `202 Accepted` + `{ jobId }` |
| `GET` | `/api/interview/reports/job/:jobId` | Private | Poll status of a queued report generation job. Returns `{ status, reportId, error }` |
| `GET` | `/api/interview/reports/:reportId` | Private | Fetch complete structured interview report by ID |
| `GET` | `/api/interview/reports` | Private | List user's reports with pagination (`page`, `limit`), search query, and minimum score filters |
| `GET` | `/api/interview/reports/stats` | Private | Retrieve user dashboard stats |
| `DELETE` | `/api/interview/reports/:reportId` | Private | Delete interview report and invalidate user stats cache |

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.12 or higher (with `uv` or `pip`)
- **MongoDB**: Atlas Cluster or local MongoDB instance (v6.0+)
- **Redis**: Local instance or managed service (e.g., Redis Cloud, Upstash)
- **API Keys**: Google Gemini API Key, Tavily Search API Key

### 1. Python Inference Engine Setup (ai_service)

```bash
cd ai_service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `ai_service/.env`:
```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite
TAVILY_API_KEY=your_tavily_key
REDIS_URL=redis://localhost:6379
JINA_API_KEY=your_jina_key  # Optional
```

Start the FastAPI server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Node.js Backend Setup (backend)

```bash
cd backend
npm install
```

Create a `.env` file in `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/resumerise
REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_SECRET=your_super_secret_access_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
AI_SERVICE_URL=http://localhost:8000/api/analyze
```

Start the Node.js server:
```bash
npm run dev
```

### 3. Frontend Setup (frontend)

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the React development server:
```bash
npm run dev
```

---

## Configuration

| Environment Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` / `8000` | Port number for Express Web API server |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` / `production`) |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed origin for Cross-Origin Resource Sharing |
| `MONGO_URI` | Yes | — | MongoDB connection string URI |
| `REDIS_URL` | Yes | — | Redis connection URL (`redis://:password@host:port`) |
| `ACCESS_TOKEN_SECRET` | Yes | — | Secret key for signing short-lived Access JWTs |
| `REFRESH_TOKEN_SECRET` | Yes | — | Secret key for signing long-lived Refresh JWTs |
| `AI_SERVICE_URL` | Yes | `http://localhost:8000/api/analyze` | Full URL to the Python Inference Engine endpoint |
| `GEMINI_API_KEY` | Yes | — | Google AI Studio key for Gemini model invocations (Python) |
| `GEMINI_MODEL` | No | `gemini-3.5-flash-lite` | Google Gemini model identifier (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`) |
| `TAVILY_API_KEY` | Yes | — | Tavily API key for search resource fetching (Python) |
| `JINA_API_KEY` | No | — | Optional Bearer token for higher Jina Reader rate limits (Python) |

---

## Reliability & Security

- **Strict Schema Validation**: Zod guarantees structured inbound HTTP payloads, while LangChain and Pydantic enforce robust, hallucination-free JSON structures from the LLM.
- **Asynchronous Decoupling**: Offloading generative tasks to BullMQ guarantees the Node.js event loop remains unblocked, preventing request timeouts during LLM spikes.
- **Data Anonymization**: A dedicated Python processing step scrubs PII using regular expressions and Named Entity Recognition prior to passing text vectors into the context window.
- **Dual-Token Authentication**: Secure JWT implementation utilizing short-lived Access Tokens and HttpOnly, Secure, SameSite Refresh Cookies.

