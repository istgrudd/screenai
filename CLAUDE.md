# CLAUDE.md — MVP Execution Plan
## Sistem Screening Rekrutasi Otomatis Berbasis RAG dan NER dengan Explainable AI

> **Source:** [PRD.md](./PRD.md)
> **Last Updated:** 2026-04-17
> **Scope:** MVP (~14 days) — Core pipeline + basic dashboard
> **Auth:** None (single-user local system)

---

## Table of Contents

1. [MVP Scope](#1-mvp-scope)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Phase Breakdown](#4-phase-breakdown)
5. [Module Specifications](#5-module-specifications)
6. [API Design](#6-api-design)
7. [Frontend Pages](#7-frontend-pages)
8. [Environment & Config](#8-environment--config)
9. [Risk & Mitigation](#9-risk--mitigation)
10. [Post-MVP Backlog](#10-post-mvp-backlog)

---

## 1. MVP Scope

### Included (Must-Ship)

| Feature | PRD ID | Description |
|---------|--------|-------------|
| PDF Upload | F-01 | Upload CV + certificate PDFs via web UI |
| Text Extraction | F-02, F-03 | Extract & normalize text from PDFs (PyMuPDF) |
| NER Anonymization | F-04, F-05 | Blind screening via IndoBERT NER + regex fallback |
| Rubric Configuration | F-07 | Recruiter defines scoring rubric with dimensions & weights |
| RAG Pipeline | F-08, F-09, F-10 | Embed rubric → retrieve context → score via LLM |
| Dimension Scoring | F-11 | Per-dimension weighted scores in structured JSON |
| Evidence Justifications | F-12 | Each score cites specific CV excerpts |
| Profile Summary | F-13 | Narrative candidate summary |
| Candidate Ranking | F-15 | Dashboard sorted by composite score |
| Candidate Detail | F-16 | Score breakdown + justifications per candidate |
| Score Override | F-17 | Recruiter can correct scores (simple, no audit log yet) |
| Batch Processing | F-18 | Process all candidates for a rubric in one action |

### Deferred (Post-MVP)

| Feature | PRD ID | Reason |
|---------|--------|--------|
| Anonymization Validation UI | F-06 | Nice-to-have, manual process |
| Interview Question Generator | F-14 | Non-critical for core screening flow |
| Audit Log | F-17 (partial) | Override works, but logging deferred |
| Evaluation Module | §7 | Ground truth labels not yet prepared |
| User Authentication | — | Single-user local system |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                FRONTEND (React + Vite)                  │
│  Tailwind CSS + shadcn/ui                               │
│  Pages: Upload │ Dashboard │ Candidate Detail │ Rubric  │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼────────────────────────────────┐
│                 BACKEND (FastAPI)                        │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌────────────────────┐  │
│  │ Extractor │→ │Anonymizer │→ │  RAG Pipeline      │  │
│  │ (PyMuPDF) │  │(IndoBERT) │  │  (LangChain)       │  │
│  └───────────┘  └───────────┘  │  Embed → Retrieve  │  │
│                                │  → Augment →        │  │
│                                │  Generate           │  │
│                                │  (DeepSeek V3)      │  │
│                                └────────────────────┘  │
│                                                         │
│  DB: SQLite          Vector Store: ChromaDB (local)     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
Program/
├── CLAUDE.md                    # This execution plan
├── PRD.md                       # Product requirements
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Template
├── .gitignore
│
├── backend/
│   ├── main.py                  # FastAPI entry point + CORS
│   ├── config.py                # Settings (pydantic-settings)
│   ├── database.py              # SQLAlchemy engine & session
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── candidate.py         # Candidate, Document, Score
│   │   └── rubric.py            # Rubric, Dimension
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── upload.py            # POST /api/upload
│   │   ├── candidates.py        # GET /api/candidates, GET/PUT /:id
│   │   ├── rubrics.py           # CRUD /api/rubrics
│   │   └── evaluation.py        # POST /api/evaluate
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── extractor.py         # PDF → raw text
│   │   ├── normalizer.py        # Cleanup & section segmentation
│   │   ├── anonymizer.py        # IndoBERT NER + regex masking
│   │   ├── rag_pipeline.py      # LangChain RAG orchestration
│   │   ├── scoring.py           # Score aggregation
│   │   └── xai.py               # Justification + profile summary
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── pdf_utils.py         # PyMuPDF helpers
│   │   ├── ner_utils.py         # HF model loading & caching
│   │   └── llm_client.py        # DeepSeek V3 client wrapper
│   │
│   └── vectorstore/             # ChromaDB persistence (gitignored)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── UploadPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── CandidateDetailPage.jsx
│       │   └── RubricConfigPage.jsx
│       ├── components/
│       │   ├── ui/              # shadcn/ui
│       │   ├── CandidateTable.jsx
│       │   ├── ScoreChart.jsx
│       │   ├── JustificationCard.jsx
│       │   ├── OverrideDialog.jsx
│       │   └── FileUploader.jsx
│       └── lib/
│           ├── api.js           # Fetch/Axios wrapper
│           └── utils.js
│
├── data/                        # Local data (gitignored)
│   ├── raw_pdfs/
│   ├── extracted/
│   └── anonymized/
│
└── scripts/
    └── seed_rubric.py           # Seed a default rubric for testing
```

---

## 4. Phase Breakdown

### Phase 1 — Setup & Document Extraction (Days 1–3)

| # | Task | Details | PRD |
|---|------|---------|-----|
| 1.1 | Project scaffolding | Create directories, `requirements.txt`, `.env.example`, `.gitignore` | — |
| 1.2 | Python dependencies | Install FastAPI, uvicorn, pymupdf, sqlalchemy, pydantic, python-multipart, python-dotenv | — |
| 1.3 | FastAPI skeleton | `main.py` with health check, CORS for `localhost:5173` | — |
| 1.4 | SQLite + SQLAlchemy models | `Candidate`, `Document`, `Rubric`, `Dimension`, `DimensionScore` tables | — |
| 1.5 | PDF extractor (`extractor.py`) | PyMuPDF text extraction, handle multi-page | F-02 |
| 1.6 | Text normalizer (`normalizer.py`) | Noise removal, whitespace normalization, section segmentation (education, experience, skills, certifications) | F-03 |
| 1.7 | Upload endpoint | `POST /api/upload` — receive PDFs, extract, normalize, save candidate to DB | F-01 |
| 1.8 | Smoke test | Upload a sample PDF, verify extraction and DB storage | — |

**Milestone:** Can upload PDFs and see extracted/segmented text in the database.

---

### Phase 2 — NER Anonymization (Days 4–6)

| # | Task | Details | PRD |
|---|------|---------|-----|
| 2.1 | Load IndoBERT NER | `ner_utils.py` — load `ageng-anugrah/indobert-large-p2-finetuned-ner` with caching | F-04 |
| 2.2 | Entity detection | Detect PERSON, LOC, ORG entities from CV text | F-04 |
| 2.3 | Regex fallback | Catch phone numbers, emails, NIK/NIM, URLs not caught by NER | F-05 |
| 2.4 | Anonymization logic | Replace detected entities with anonymous tokens (`[PERSON_1]`, `[ORG_1]`, etc.) | F-05 |
| 2.5 | Integrate into pipeline | After extraction + normalization, auto-run anonymization; store anonymized text in DB | — |
| 2.6 | Test with sample CVs | Verify anonymization on real Indonesian CVs, check for leaks | — |

**Milestone:** Uploaded PDFs are automatically anonymized. Anonymized text visible via API.

---

### Phase 3 — Rubric Config & RAG Pipeline (Days 7–10)

| # | Task | Details | PRD |
|---|------|---------|-----|
| 3.1 | Rubric CRUD endpoints | `POST/GET/PUT/DELETE /api/rubrics` — create rubric with dimensions, weights, indicators | F-07 |
| 3.2 | Seed script | `scripts/seed_rubric.py` — pre-populate a default rubric for testing | — |
| 3.3 | DeepSeek V3 client | `llm_client.py` — OpenAI-compatible client, retry logic, JSON output parsing | — |
| 3.4 | Vector store setup | ChromaDB local instance, embed rubric dimensions + indicators | F-08 |
| 3.5 | RAG pipeline core | `rag_pipeline.py` — Embed CV chunks → Retrieve rubric context → Augment prompt → Generate via DeepSeek V3 | F-09 |
| 3.6 | Prompt engineering | Design prompts that: (a) map abstract criteria to concrete CV evidence, (b) output structured JSON with scores + justifications + profile summary | F-10, F-11, F-12, F-13 |
| 3.7 | Scoring engine | Parse LLM JSON → compute weighted composite scores → store in DB | F-11 |
| 3.8 | Batch evaluation endpoint | `POST /api/evaluate` — accepts rubric ID, processes all pending candidates | F-18 |
| 3.9 | Integration test | Full pipeline: upload PDF → extract → anonymize → score → verify stored results | — |

**Milestone:** Full backend pipeline works end-to-end. Can score candidates via API.

---

### Phase 4 — Frontend Dashboard (Days 11–14)

| # | Task | Details | PRD |
|---|------|---------|-----|
| 4.1 | Initialize React + Vite | Set up with Tailwind CSS + shadcn/ui | — |
| 4.2 | API client | `lib/api.js` — wrapper for all backend endpoints | — |
| 4.3 | Upload Page | Drag-and-drop multi-PDF uploader with progress, file type validation | F-01 |
| 4.4 | Rubric Config Page | Form to create/edit rubrics: add dimensions, set weights (sum to 100%), define indicators | F-07 |
| 4.5 | Dashboard Page | Sortable candidate ranking table: rank, anonymous ID, composite score, per-dimension mini-bars, "Run Evaluation" button | F-15, F-18 |
| 4.6 | Candidate Detail Page | Score breakdown (radar/bar chart), justification cards per dimension, profile summary | F-16 |
| 4.7 | Score Override | Modal dialog to adjust dimension scores with a reason field (stored in DB, no audit log yet) | F-17 |
| 4.8 | Polish | Loading states, error toasts, responsive layout, empty states | — |

**Milestone:** Working end-to-end MVP — upload CVs, configure rubric, run evaluation, view rankings, inspect details, override scores.

---

## 5. Module Specifications

### 5.1 Extractor

```python
# backend/services/extractor.py
def extract_text_from_pdf(pdf_path: str) -> dict:
    """
    Returns {
        "raw_text": str,
        "pages": list[str],
        "metadata": {"page_count": int, "file_size_kb": float}
    }
    """
```

### 5.2 Normalizer

```python
# backend/services/normalizer.py
def normalize_and_segment(raw_text: str) -> dict:
    """
    Returns {
        "normalized_text": str,
        "sections": {
            "education": str,
            "experience": str,
            "skills": str,
            "certifications": str,
            "other": str
        }
    }
    """
```

### 5.3 Anonymizer

```python
# backend/services/anonymizer.py
def anonymize_text(text: str) -> dict:
    """
    Returns {
        "anonymized_text": str,
        "entities_found": [
            {"text": "...", "label": "PERSON", "replacement": "[PERSON_1]"}
        ],
        "entity_count": int
    }
    """
```

### 5.4 RAG Pipeline

```python
# backend/services/rag_pipeline.py
async def evaluate_candidate(
    anonymized_cv: dict,
    rubric_id: int,
    certificate_data: dict | None = None
) -> dict:
    """
    Returns {
        "composite_score": float,          # 0-100
        "dimension_scores": [
            {
                "dimension": str,
                "score": float,            # 0-100
                "weight": float,           # 0.0-1.0
                "weighted_score": float,
                "justification": str,
                "evidence": [str]
            }
        ],
        "profile_summary": str,
        "raw_llm_response": str
    }
    """
```

---

## 6. API Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload PDF files, triggers extraction + anonymization |
| `GET` | `/api/candidates` | List all candidates (with optional `?rubric_id=` filter) |
| `GET` | `/api/candidates/{id}` | Candidate detail: scores, justifications, profile summary |
| `PUT` | `/api/candidates/{id}/scores/{dim_id}` | Override a dimension score |
| `POST` | `/api/rubrics` | Create rubric |
| `GET` | `/api/rubrics` | List rubrics |
| `GET` | `/api/rubrics/{id}` | Rubric detail |
| `PUT` | `/api/rubrics/{id}` | Update rubric |
| `DELETE` | `/api/rubrics/{id}` | Delete rubric |
| `POST` | `/api/evaluate` | Batch evaluate: `{ "rubric_id": int }` |
| `GET` | `/api/evaluate/{job_id}/status` | Batch job progress |

### Response Envelope

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

---

## 7. Frontend Pages

| Page | Route | Key Elements |
|------|-------|-------------|
| **Upload** | `/upload` | Drag-and-drop zone, file list with status badges, upload button |
| **Rubric Config** | `/rubrics` | Rubric form: name, position, dimensions list (name, weight %, indicators textarea), save/edit/delete |
| **Dashboard** | `/` | Candidate table (rank, anon ID, composite score, dimension mini-bars), rubric filter dropdown, "Run Evaluation" button with progress |
| **Candidate Detail** | `/candidates/:id` | Radar or bar chart of dimension scores, justification cards with evidence highlights, profile summary box, override button per dimension |

---

## 8. Environment & Config

### `.env.example`

```env
# DeepSeek LLM
DEEPSEEK_API_KEY=sk-xxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Database
DATABASE_URL=sqlite:///./data/app.db

# Vector Store
CHROMA_PERSIST_DIR=./backend/vectorstore

# NER Model
NER_MODEL_NAME=ageng-anugrah/indobert-large-p2-finetuned-ner

# Embedding
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2

# App
APP_PORT=8000
FRONTEND_URL=http://localhost:5173
```

### `requirements.txt`

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
pymupdf>=1.24.0
transformers>=4.40.0
torch>=2.2.0
langchain>=0.2.0
langchain-community>=0.2.0
langchain-openai>=0.1.0
chromadb>=0.5.0
openai>=1.0.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-multipart>=0.0.9
python-dotenv>=1.0.0
```

---

## 9. Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| IndoBERT misses identity entities (>5% leak) | Regex fallback for phone, email, NIK/NIM, URL patterns |
| DeepSeek returns malformed JSON | Strict prompt + JSON validation + 3 retries |
| LLM hallucination in justifications | RAG grounding: instruct LLM to cite only from provided CV text |
| Batch processing too slow | Async processing with progress tracking; can parallelize later |
| ChromaDB indexing issues | Keep rubric embeddings small; re-index on rubric update |

---

## 10. Post-MVP Backlog

These items are deferred and will be addressed after the core MVP is validated:

| Item | PRD Ref | Notes |
|------|---------|-------|
| Audit log for overrides | F-17 | Log old/new score, reason, timestamp |
| Anonymization validation UI | F-06 | Side-by-side original vs anonymized view |
| Interview question generator | F-14 | LLM generates personalized questions |
| Evaluation module | §7 | Binary classification metrics against ground truth |
| User authentication / roles | — | Recruiter vs coordinator vs applicant |
| OCR support for scanned PDFs | §3.2 | Currently out of scope |
| Non-EPrT certificate parsing | §3.2 | TOEFL ITP, IELTS, ECCT |
