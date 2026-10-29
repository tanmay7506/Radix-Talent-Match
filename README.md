# 🎯 RADIX Talent Match
**Intelligent, Explainable Career Readiness & Talent Alignment Platform**  
*Transforming the journey from raw resume to verified role readiness.*  
Built by **Team Questionable Commit** for the **Agentic AI Coding Challenges Bootcamp 2026** at JSS University, Noida.

---

## 📌 Table of Contents
1. [Overview](#-overview)
2. [The Problem We Solve](#-the-problem-we-solve)
3. [The 6 Core Differentiators (USPs)](#-the-6-core-differentiators-usps)
4. [The 12 RADIX Skill Categories](#-the-12-radix-skill-categories)
5. [System Architecture & Data Flow](#-system-architecture--data-flow)
6. [Tech Stack](#-tech-stack)
7. [Repository Structure](#-repository-structure)
8. [Installation & Local Setup](#-installation--local-setup)
9. [API Reference & Contracts](#-api-reference--contracts)
10. [Dependability & Validation Matrix](#-dependability--validation-matrix)
11. [Team Credits](#-team-credits)

---

## 🌟 Overview

**RADIX Talent Match** is an end-to-end talent intelligence platform designed to replace opaque, keyword-based resume screening with transparent, evidence-backed evaluation. 

Instead of outputting an arbitrary match percentage, RADIX Talent Match:
* **Extracts** structured candidate data directly from PDF and Word (`.docx`) resumes.
* **Grounds** every credited skill in verbatim quotes from the resume.
* **Normalizes** diverse job descriptions and candidate skills into the standardized **12 RADIX Skill Taxonomy**.
* **Benchmarks** candidate readiness against verified **Company Hiring Bars** (Google, Microsoft, Oracle, etc.).
* **Generates** personalized skill-gap roadmaps complete with prerequisites, milestone tasks, and recommended projects.

---

## 🔍 The Problem We Solve

Traditional Applicant Tracking Systems (ATS) suffer from critical limitations:
* **Same Skill, Different Words:** `"JS"` vs. `"JavaScript"` or `"ML"` vs. `"Machine Learning"` fail naive string matches.
* **Evidence is Never Located:** A score like `67%` gives no audit trail—recruiters cannot see which line justified it, and candidates do not know why they fell short.
* **A Score with No Reason:** Rejections are delivered without explainable breakdowns.
* **No Actionable Next Step:** `"Not a fit"` leaves candidates stranded without learning direction.

### How RADIX Fixes the Disconnect

| What the JD Asks For | What the Resume Shows | What the Profile Records | What to Improve Next |
| :--- | :--- | :--- | :--- |
| Requirements written in conversational prose | Unstructured achievements and inconsistent terminology | Structured skills with **12 canonical category codes**, evidence quotes, and confidence levels | Category-specific gap ranking and ordered learning roadmap |

---

## ⚡ The 6 Core Differentiators (USPs)

1. **🗺️ Personalized Learning Roadmap:** Turns JD and company gaps into an ordered learning path with prerequisite ordering, curated tasks, and progress tracking.
2. **🔎 Evidence-Grounded View:** Every single matched skill is tied directly to **verbatim excerpts** from the candidate's uploaded resume.
3. **🏢 Best-Fit Company Ranking:** Evaluates candidate competency against multiple enterprise benchmark bars simultaneously to rank best-fit companies.
4. **💬 Interactive AI Career Assistant:** An in-app advisor providing guidance on skill gaps, interview prep, and instant page navigation.
5. **⚡ Smart Caching Engine:** Deterministic **SHA-256** payload digest caching (**1-hour TTL**) ensures repeat views load instantly with zero redundant LLM token costs.
6. **🛡️ Privacy-First Mode:** Sanitizes personal identifiable information (**PII**) before model analysis to support unbiased blind candidate screening.

---

## 📊 The 12 RADIX Skill Categories

All skills and requirements are standardized across **12 canonical technical domains**:
| Code | Category Name | Scope & Technologies |
| :--- | :--- | :--- |
| **COD** | Coding & Programming | Python, JavaScript, TypeScript, Java, C++, syntax, clean code practices |
| **DSA** | Data Structures & Algorithms | Arrays, trees, graphs, dynamic programming, complexity analysis ($O(N)$) |
| **OOD** | Object-Oriented Design | SOLID design principles, design patterns, domain modeling |
| **APTI** | Quantitative Aptitude | Logical deduction, quantitative reasoning, analytical problem solving |
| **COMM** | Communication & Collaboration | Technical writing, documentation, cross-functional collaboration |
| **AI** | AI-Native Engineering | LLMs, prompt engineering, generative AI, embeddings, vector stores |
| **CLOUD** | Cloud Computing & DevOps | AWS, GCP, Azure, Docker, Kubernetes, CI/CD pipelines |
| **SQL** | Relational Databases | Schema design, indexing, query optimization, ACID transactions |
| **SWE** | Software Engineering | Testing methodologies, Git version control, Agile/Scrum workflows |
| **SYSD** | System Design & Scalability | Microservices, distributed architecture, caching strategies, load balancing |
| **NETW** | Networking Protocols | TCP/IP, HTTP/HTTPS, RESTful APIs, WebSockets, gRPC |
| **OS** | Operating Systems | Processes, threads, concurrency, memory management, scheduling |

---

## 💻 Tech Stack

### Frontend
* **Framework:** React 19.3 (leveraging the new React Compiler)
* **Build Tool:** Vite 8
* **Routing:** TanStack Router (`@tanstack/react-router` v1.170)
* **Animations:** GSAP 3.15 (GreenSock) for timeline transitions and canvas orb physics
* **Icons & Data Viz:** Lucide React, Recharts 3.10
* **Design System:** Neomorphic Light/Dark theme powered by CSS variables (`tokens.css`)

### Backend
* **Framework:** FastAPI 0.162 (Python 3.12)
* **Server:** Uvicorn ASGI
* **Data Validation:** Pydantic v2 (Schema-constrained structured output)
* **Document Processing:** `pypdf` (v6.21), `python-docx` (v1.2.0)
* **AI / LLM Integration:** LangChain Core, LangChain Google GenAI, LangChain OpenRouter, Groq
* **Database & Storage:** Supabase (PostgreSQL client)
* **Cache Layer:** Redis with SHA-256 payload digest keys and in-memory dictionary fallback

---

## 📁 Repository Structure
```text
Radix-Talent-Match/
├── backend/
│   ├── files/                        # Sample resumes and JDs (.pdf & .docx)
│   ├── functions/
│   │   ├── skills_matching/          # Pydantic schemas for skill comparison
│   │   ├── talent_check/             # Scoring, Supabase client, LLM synthesis
│   │   ├── models.py                 # LLM provider configurations & fallbacks
│   │   ├── prompts.py                # Grounded extraction prompts
│   │   └── skill_categories.py       # Canonical RADIX mappings & aliases
│   ├── routers/
│   │   ├── chat.py                   # Contextual AI assistant router
│   │   ├── jd_analytics.py           # Job description skill extraction
│   │   ├── profile_builder.py        # Resume ingestion and profile builder
│   │   ├── skills_matching.py        # Matching engine & synonym normalizer
│   │   ├── talent_check.py           # Company benchmark analysis
│   │   └── db/company_matching.py    # Best-fit company ranking
│   ├── utils/
│   │   ├── extract_data.py           # LangChain structured output pipeline
│   │   ├── parse_document.py         # In-memory pypdf & docx text extractors
│   │   └── response_cache.py         # Redis & memory caching utility
│   ├── tests/                        # Test suites for routers and matching logic
│   ├── main.py                       # FastAPI application entrypoint & CORS
│   └── pyproject.toml                # Backend dependencies & lockfile
│
└── frontend/
    ├── public/
    │   └── roadmaps/                 # Canonical skill roadmaps (PDF assets)
    ├── src/
    │   ├── components/
    │   ├── services/                 # API client, auth & profile services
    │   ├── styles/                   # Global tokens and layout styling
    │   ├── utils/                    # Skill matching helper & client PDF creator
    │   └── App.jsx                   # TanStack Router shell & root state
    ├── package.json
    └── vite.config.js
```
---

## 🚀 Installation & Local Setup

### Prerequisites
* **Node.js** (v18+ recommended)
* **Python** (v3.12+ recommended)
* **uv** (recommended Python package manager) or standard **pip**

### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
uv venv
# On Windows:
.venv\Scripts\activate
# On Unix/macOS:
source .venv/bin/activate

# Install dependencies
uv sync

# Configure your environment variables in backend/.env:
# OPENROUTER_API_KEY=your_openrouter_api_key
# GEMINI_API_KEY=your_gemini_api_key
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key
# REDIS_HOST=localhost (optional)

# Start the FastAPI development server
uv run fastapi dev main.py
```
The application will launch at http://localhost:5173.

---

## 📡 API Reference & Contracts

### 1. Resume Profile Extraction
* **Endpoint:** `POST /profile/build/from-resume`
* **Input:** Multipart form upload (`.pdf` or `.docx`).
* **Output:** `ProfileResponseModel` containing candidate name, email, education, internships, hackathons, certifications, and skills mapped with levels (1–10), confidence, and quoted evidence.

---

### 2. Job Description Analytics
* **Endpoint:** `POST /jd/extract-skills`
* **Input:** Multipart form upload (`.pdf` or `.docx`).
* **Output:** `SkillExtractionOutput` mapping required competencies to the 12 RADIX categories and explicit technologies.

---

### 3. Skill Matching Engine
* **Endpoint:** `POST /skill-matching`
* **Input:** Candidate profile JSON + JD skills list.
* **Output:** Overall match score (0–100), confidence level, canonical skills breakdown, matched skills with evidence, confirmed gaps, and unassessed skills.

---

### 4. Enterprise Talent Check
* **Endpoint:** `POST /talent-check/analyze?company=Google%20LLC`
* **Input:** Candidate profile and target company ID.
* **Output:** Readiness score, assessment coverage percentage, category-level gap analysis, strengths, and personalized learning milestones.

 ---

| Edge Case / Scenario | Observed System Behavior | Status |
| :--- | :--- | :---: |
| **Missing Input Data** | Validates required name/email; omitted sections result in lower coverage rather than crashes. | ✅ **TESTED** |
| **Duplicate Skills** | Merges repeats across sections, preserves the highest skill level, and joins all evidence citations. | ✅ **TESTED** |
| **Different Terminologies** | Synonym dictionary + normalization maps aliases like JS ↔ JavaScript, ML ↔ Machine Learning. | ✅ **TESTED** |
| **Weak / Ambiguous Evidence** | Low-confidence claims are explicitly surfaced as Uncertain instead of false matches. | ✅ **TESTED** |
| **Invalid Files / Corrupt JSON** | Unsupported files are rejected at upload; malformed LLM outputs trigger automatic schema repair. | ✅ **TESTED** |
| **Same Candidate, Different JDs** | Match results and gap lists dynamically adapt to each distinct job specification. | ✅ **TESTED** |
| **Heavily Paraphrased Requirements** | Highly abstract requirements without vocabulary overlap require vector embeddings. | ⏳ **ROADMAP** |
| **Scanned / Image-Only PDFs** | Ingestion currently requires digital text layers; OCR pipeline is scheduled for future release. | ⏳ **ROADMAP** |

---

## 👥 Team Credits

Developed with ❤️ by **Team Questionable Commit**:

| Member | Role | Key Module Responsibilities |
| :--- | :--- | :--- |
| **Tanmay Mittal** | Scrum Master | Project orchestration, JD Analytics, API design |
| **Mehardeep Singh Arneja** | Core Developer | Document parsing (`pypdf`, `python-docx`), Resume ingestion, design assistance |
| **Sarthak Chowdhry** | Core Developer | Profile Builder, schema design, database management, authentication, frontend design |
| **Prankit Srivastava** | Core Developer | Talent Check engine, company benchmark evaluation, design assistance |
| **Yashika Sharma** | Core Developer | Skill matching engine, synonym mapping, evidence verification, assistance |

*Presented at the Talent Match Hackathon — Agentic AI Coding Challenges Bootcamp 2026, JSS University, Noida.*
