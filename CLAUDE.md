# CLAUDE.md — Execution Plan
## ScreenAI — Sistem Screening Rekrutasi Otomatis

> **Source:** [PRD.md](./PRD.md)
> **Last Updated:** 2026-04-18
> **Repository:** https://github.com/istgrudd/screenai

---

## Phase Status

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Setup + Extraction + NER + RAG + Frontend Dashboard | ✅ Complete |
| Phase 2 | RBAC + Auth + Deployment + Certificate Verification | 🔄 In Progress |

---

## Table of Contents

1. [Phase 1 Summary](#1-phase-1-summary)
2. [Phase 2 Scope](#2-phase-2-scope)
3. [Architecture (Phase 2)](#3-architecture-phase-2)
4. [Project Structure (Phase 2)](#4-project-structure-phase-2)
5. [Phase 2 Breakdown](#5-phase-2-breakdown)
6. [API Design (Phase 2)](#6-api-design-phase-2)
7. [Frontend Pages (Phase 2)](#7-frontend-pages-phase-2)
8. [Environment & Config (Phase 2)](#8-environment--config-phase-2)
9. [Deployment Plan](#9-deployment-plan)
10. [Risk & Mitigation](#10-risk--mitigation)
11. [Post-Phase-2 Backlog](#11-post-phase-2-backlog)

---

## 1. Phase 1 Summary

All Phase 1 tasks are complete. The following is implemented and working:

- ✅ PDF extraction (PyMuPDF) + text normalization + section segmentation
- ✅ IndoBERT NER anonymization + regex fallback
- ✅ EPrT certificate detection + CEFR bonus scoring
- ✅ Certificate ownership name matching (pre-anonymization)
- ✅ RAG pipeline (LangChain + ChromaDB + DeepSeek V3)
- ✅ Rubric CRUD (create/edit/delete positions with dimensions + weights)
- ✅ Batch evaluation endpoint
- ✅ Frontend dashboard: Upload, Rubric Config, Ranking, Candidate Detail
- ✅ Score override (no audit log yet)
- ✅ Reveal Identity feature (post-evaluation)
- ✅ Git repository: https://github.com/istgrudd/screenai

---

## 2. Phase 2 Scope

### Must Ship (for demo/pameran)

| Feature | PRD ID | Description |
|---|---|---|
| User Registration | F-30 | Candidate can register with email + password |
| Login / Logout | F-31 | JWT-based auth for all roles |
| Role-Based Access | F-32, F-33 | Super Admin / Recruiter / Candidate |
| Backend Deployment | F-40 | Accessible via public URL |
| Frontend Deployment | F-41 | Accessible via public URL |
| Production Config | F-42, F-43 | Env vars + CORS for production |

### Should Ship

| Feature | PRD ID | Description |
|---|---|---|
| Candidate Status Page | F-51 | Candidate sees their own application status |
| Audit Log | F-50 | Log override actions |
| Super Admin Dashboard | F-52 | User management + stats |
| PostgreSQL Migration | F-44 | Replace SQLite for production |

---

## 3. Architecture (Phase 2)

```
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)                      │
│  Tailwind CSS + shadcn/ui                                 │
│                                                           │
│  Public:   /login  /register                              │
│  Candidate: /upload  /my-applications                     │
│  Recruiter: /  /candidates/:id  /rubrics                  │
│  Super Admin: /admin/users  /admin/rubrics                │
└───────────────────────────┬──────────────────────────────┘
                             │ REST API (JSON) + JWT Header
┌───────────────────────────▼──────────────────────────────┐
│                  BACKEND (FastAPI)                         │
│                                                           │
│  Auth Middleware (JWT verify + role check)                │
│                                                           │
│  ┌───────────┐  ┌───────────┐  ┌────────────────────┐    │
│  │ Extractor │→ │Anonymizer │→ │  RAG Pipeline      │    │
│  │ (PyMuPDF) │  │(IndoBERT) │  │  (LangChain)       │    │
│  └───────────┘  └───────────┘  └────────────────────┘    │
│                                                           │
│  DB: PostgreSQL (prod) / SQLite (dev)                     │
│  Vector Store: ChromaDB (persistent)                      │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Project Structure (Phase 2)

New files to add (existing structure remains intact):

```
backend/
├── models/
│   ├── user.py              # User, Role models (NEW)
│   └── audit.py             # AuditLog model (NEW)
├── routers/
│   ├── auth.py              # POST /api/auth/register, /login, /logout (NEW)
│   ├── users.py             # GET/PUT /api/users (Super Admin only) (NEW)
│   └── audit.py             # GET /api/audit-logs (NEW)
├── services/
│   └── auth_service.py      # JWT creation, password hashing (NEW)
├── middleware/
│   └── auth_middleware.py   # JWT verify + role guard (NEW)
└── utils/
    └── security.py          # bcrypt helpers (NEW)

frontend/src/
├── pages/
│   ├── LoginPage.jsx        # (NEW)
│   ├── RegisterPage.jsx     # (NEW)
│   ├── MyApplicationsPage.jsx # Candidate view (NEW)
│   └── AdminPage.jsx        # Super Admin user management (NEW)
├── components/
│   └── ProtectedRoute.jsx   # Route guard by role (NEW)
└── lib/
    └── auth.js              # Token storage + auth helpers (NEW)
```

---

## 5. Phase 2 Breakdown

### Phase 5 — RBAC & Authentication (Week 1–2)

| # | Task | Details |
|---|------|---------|
| 5.1 | User model | `User` table: id, email, password_hash, role (enum: super_admin/recruiter/candidate), created_at |
| 5.2 | Auth service | `auth_service.py` — bcrypt password hashing, JWT creation/verification (python-jose) |
| 5.3 | Auth endpoints | `POST /api/auth/register` — candidate only. `POST /api/auth/login` — all roles. `POST /api/auth/logout` |
| 5.4 | Auth middleware | Dependency injection for FastAPI routes: `get_current_user()`, `require_role(role)` |
| 5.5 | Protect existing routes | Apply role guards: upload (candidate), evaluate/override (recruiter+), rubrics CRUD (super_admin+recruiter) |
| 5.6 | Frontend auth | Login/Register pages, JWT storage (httpOnly cookie or localStorage), ProtectedRoute component |
| 5.7 | Role-based UI | Hide/show nav items based on role. Redirect unauthorized access. |
| 5.8 | Candidate status page | `/my-applications` — candidate sees their uploaded CVs and evaluation status |
| 5.9 | Super Admin panel | `/admin/users` — list users, change roles, deactivate accounts |

**Milestone:** Login/register works. Routes are protected by role. Candidate can upload, recruiter can evaluate.

---

### Phase 6 — Deployment (Week 3)

| # | Task | Details |
|---|------|---------|
| 6.1 | Choose hosting | Backend: Railway or Render (free tier). Frontend: Vercel |
| 6.2 | Production env vars | `DATABASE_URL` (PostgreSQL), `SECRET_KEY` (JWT), `DEEPSEEK_API_KEY`, `FRONTEND_URL` |
| 6.3 | Database migration | Switch SQLite → PostgreSQL for production. Keep SQLite for local dev. |
| 6.4 | CORS update | Allow production frontend domain in FastAPI CORS settings |
| 6.5 | Deploy backend | Push to Railway/Render, verify `/api/health` accessible publicly |
| 6.6 | Deploy frontend | Push to Vercel, set `VITE_API_URL` to production backend URL |
| 6.7 | End-to-end test | Full flow on production: register → login → upload → evaluate → view results |
| 6.8 | Seed production data | Seed rubrics for demo positions on production DB |

**Milestone:** System accessible via public URL. Full flow works on production.

---

### Phase 7 — Certificate Verification + Audit Log + Polish (Week 4)

| # | Task | Details |
|---|------|---------|
| 7.1 | Certificate name matching | Extract name from CV + certificate, fuzzy match (difflib ≥ 0.80), warn on mismatch |
| 7.2 | Audit log | Log all override actions: candidate_id, dimension, old_score, new_score, reason, recruiter_id, timestamp |
| 7.3 | Upload page split zones | Separate CV zone and certificate zone with clear labels |
| 7.4 | Demo preparation | Seed demo accounts (1 super_admin, 2 recruiters), seed rubrics for all 4 positions |
| 7.5 | Mobile responsiveness | Ensure upload + dashboard readable on mobile for pameran visitors |
| 7.6 | Final testing | Full pameran flow: visitor registers as candidate → uploads CV → recruiter evaluates → shows results |

**Milestone:** System ready for pameran demo. Visitors can try the full flow independently.

---

## 6. API Design (Phase 2)

New endpoints to add:

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register as candidate |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `POST` | `/api/auth/logout` | Auth | Logout |
| `GET` | `/api/auth/me` | Auth | Get current user info |
| `GET` | `/api/users` | Super Admin | List all users |
| `PUT` | `/api/users/{id}/role` | Super Admin | Change user role |
| `GET` | `/api/my-applications` | Candidate | List own uploaded CVs + status |
| `GET` | `/api/audit-logs` | Recruiter+ | List override audit logs |

### JWT Flow
```
Login → server returns { token, user } 
→ frontend stores token
→ all subsequent requests: Authorization: Bearer <token>
→ backend middleware validates token + checks role
```

---

## 7. Frontend Pages (Phase 2)

| Page | Route | Role | Key Elements |
|------|-------|------|-------------|
| **Login** | `/login` | Public | Email + password form, link to register |
| **Register** | `/register` | Public | Email + password + name, auto-assigned Candidate role |
| **My Applications** | `/my-applications` | Candidate | List of uploaded CVs, status badges (anonymized/scored), score if available |
| **Admin Panel** | `/admin/users` | Super Admin | User table: name, email, role, actions (change role, deactivate) |

Existing pages get role protection:
- `/upload` → Candidate only
- `/` (Dashboard) → Recruiter + Super Admin
- `/rubrics` → Recruiter + Super Admin
- `/candidates/:id` → Recruiter + Super Admin

---

## 8. Environment & Config (Phase 2)

Additional `.env` variables needed:

```env
# Auth
SECRET_KEY=your-super-secret-jwt-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Production Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/screenai

# Production
ENVIRONMENT=production
ALLOWED_ORIGINS=https://screenai.vercel.app
```

Additional dependencies:
```
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
psycopg2-binary>=2.9.0     # PostgreSQL driver
alembic>=1.13.0             # DB migrations
```

---

## 9. Deployment Plan

### Recommended Stack (Free Tier)

| Service | Platform | Notes |
|---|---|---|
| Backend | Railway | Auto-deploy from GitHub, free $5/month credit |
| Frontend | Vercel | Free tier, auto-deploy from GitHub |
| Database | Railway PostgreSQL | Included with Railway |
| NER Model | Loaded at startup | ~1.3GB, needs sufficient RAM (512MB min) |

### Deployment Steps
1. Create Railway project → add Python service + PostgreSQL
2. Set all env vars in Railway dashboard
3. Connect GitHub repo → auto-deploy on push to `main`
4. Create Vercel project → connect GitHub → set `VITE_API_URL`
5. Run DB migrations on production
6. Seed demo rubrics and admin account

---

## 10. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Railway free tier RAM insufficient for IndoBERT (1.3GB) | NER fails in production | Upgrade to paid tier ($5/mo) or use lighter NER model |
| JWT token theft | Unauthorized access | Use httpOnly cookies, short expiry (8h), refresh token |
| PostgreSQL migration breaks existing queries | Data loss | Test migration on local PostgreSQL first, use Alembic |
| Demo day server overload | System unavailable during pameran | Test with 10+ concurrent users before pameran |
| Candidate uploads other person's CV | Data integrity | Certificate name matching + manual verification flag |

---

## 11. Post-Phase-2 Backlog

| Item | Notes |
|------|-------|
| Binary classification evaluation | Needs ground truth labels |
| Interview question generator | LLM generates personalized questions |
| OCR support | For scanned PDFs |
| Email notifications | Notify candidate when evaluation is done |
| Non-EPrT certificate support | TOEFL ITP, IELTS, ECCT |
| Analytics dashboard | Recruiter sees aggregate stats across positions |
