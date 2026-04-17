# Product Requirements Document (PRD)
## ScreenAI — Sistem Screening Rekrutasi Otomatis Berbasis RAG dan NER dengan Explainable AI

---

## Phase Status

| Phase | Scope | Status |
|---|---|---|
| **Phase 1 — MVP** | Core pipeline + local dashboard (no auth) | ✅ Complete |
| **Phase 2 — Production** | RBAC + deployment + certificate verification | 🔄 In Progress |

---

## 1. Overview

### 1.1 Ringkasan Produk

Platform berbasis AI yang mengotomatiskan proses seleksi awal kandidat (CV screening) dengan tiga mekanisme utama: **Blind Screening** berbasis NER, **Evaluasi Kompetensi** berbasis RAG, dan **Explainable AI (XAI)** untuk transparansi penilaian.

### 1.2 Masalah yang Diselesaikan

1. Rekruter hanya punya ~7 detik per CV → banyak kandidat bagus terlewat.
2. Seleksi manual rentan bias (nama, institusi, gender) → keputusan tidak adil.
3. ATS yang ada hanya cocokkan keyword → tidak transparan, tidak dipercaya rekruter.

---

## 2. Ruang Lingkup

### Phase 1 — MVP (✅ Complete)

- Ekstraksi teks dari PDF CV dan sertifikat bahasa (ATS-compatible only).
- Anonimisasi otomatis identitas kandidat via IndoBERT NER.
- Evaluasi kompetensi terhadap rubrik rekruter via RAG + LangChain + DeepSeek V3.
- Skor per dimensi kompetensi + justifikasi berbasis bukti (XAI).
- Ringkasan profil kandidat.
- Dashboard rekruter: ranking, detail kandidat, override penilaian.
- Batch processing dokumen.
- EPrT language certificate bonus scoring.
- Reveal Identity feature (post-evaluation).

### Phase 2 — Production (🔄 In Progress)

- **RBAC** — Role-Based Access Control (Super Admin, Recruiter, Candidate).
- **Authentication** — register, login, JWT-based session.
- **Deployment** — VPS/cloud hosting, accessible via public URL.
- **Certificate Ownership Verification** — name matching CV vs sertifikat.
- **Audit Log** — log semua tindakan override rekruter.

### Out-of-Scope (Both Phases)

- PDF berbasis scan / gambar (OCR).
- Sertifikat bahasa non-EPrT sebagai standar utama.
- Evaluasi binary classification (ground truth belum tersedia).
- Generator pertanyaan wawancara.

---

## 3. Fitur

### Phase 1 Features (✅ Implemented)

| ID | Fitur | Status |
|---|---|---|
| F-01 | Upload PDF (CV + sertifikat bahasa) via antarmuka web | ✅ |
| F-02 | Ekstraksi teks dari PDF menggunakan PyMuPDF | ✅ |
| F-03 | Normalisasi & segmentasi teks per seksi | ✅ |
| F-04 | Deteksi entitas identitas via IndoBERT NER | ✅ |
| F-05 | Anonimisasi otomatis dengan token anonim | ✅ |
| F-07 | Konfigurasi rubrik per posisi | ✅ |
| F-08 | Indexing rubrik ke ChromaDB | ✅ |
| F-09 | Pipeline RAG: Embedding → Retrieval → Augmentation → Generation | ✅ |
| F-10 | Competency-based inference | ✅ |
| F-11 | Output skor per dimensi dalam format JSON | ✅ |
| F-12 | Justifikasi berbasis bukti per dimensi | ✅ |
| F-13 | Ringkasan profil naratif per kandidat | ✅ |
| F-15 | Ranking kandidat berdasarkan skor komposit | ✅ |
| F-16 | Halaman detail kandidat | ✅ |
| F-17 | Override skor penilaian oleh rekruter | ✅ |
| F-18 | Batch processing dokumen | ✅ |
| F-19 | EPrT certificate bonus scoring (CEFR mapping) | ✅ |
| F-20 | Reveal Identity (post-evaluation) | ✅ |
| F-21 | Certificate ownership name matching | 🔄 Phase 2 |

### Phase 2 Features (🔄 Planned)

#### Modul Autentikasi & RBAC

| ID | Fitur | Role | Prioritas |
|---|---|---|---|
| F-30 | Registrasi akun Candidate | Candidate | Must Have |
| F-31 | Login / Logout (JWT) | All roles | Must Have |
| F-32 | Role assignment oleh Super Admin | Super Admin | Must Have |
| F-33 | Route protection per role | All | Must Have |

#### Role Definitions

| Role | Akses |
|---|---|
| **Super Admin** | Semua fitur + manage users + manage rubrics |
| **Recruiter** | Dashboard, detail kandidat, override, reveal identity, run evaluation |
| **Candidate** | Upload CV + sertifikat, lihat status lamaran sendiri |

#### Modul Deployment

| ID | Fitur | Prioritas |
|---|---|---|
| F-40 | Backend deployed ke VPS/cloud (Railway/Render/DigitalOcean) | Must Have |
| F-41 | Frontend deployed (Vercel/Netlify) | Must Have |
| F-42 | Environment variables configured for production | Must Have |
| F-43 | CORS configured for production domain | Must Have |
| F-44 | Database migration: SQLite → PostgreSQL (production) | Should Have |

#### Modul Tambahan

| ID | Fitur | Prioritas |
|---|---|---|
| F-50 | Audit log: catat semua override (old score, new score, reason, timestamp) | Should Have |
| F-51 | Candidate dapat melihat status lamaran mereka sendiri | Should Have |
| F-52 | Super Admin dashboard: user management, system stats | Should Have |

---

## 4. Stack Teknologi

| Layer | Phase 1 | Phase 2 Addition |
|---|---|---|
| PDF Parsing | PyMuPDF | — |
| NER | IndoBERT via Hugging Face | — |
| RAG & Orchestration | LangChain | — |
| Vector Store | ChromaDB (local) | ChromaDB (persistent) |
| LLM Inference | DeepSeek V3 | — |
| Backend | FastAPI | + JWT auth (python-jose) |
| Frontend | React + Vite + Tailwind + shadcn/ui | + Auth pages |
| Database | SQLite | PostgreSQL (production) |
| Deployment | Local | Railway / Render + Vercel |

---

## 5. Alur Sistem

### Phase 1 (Current)
```
Upload CV/Sertifikat (PDF)
    → Name matching (CV vs certificate)
    → Ekstraksi teks (PyMuPDF)
    → Anonimisasi identitas (IndoBERT NER)
    → RAG Pipeline (LangChain + ChromaDB) ← Rubrik dari rekruter
    → LLM Inference (DeepSeek V3)
    → Skor JSON + Justifikasi + Ringkasan Profil + Language Bonus
    → Dashboard Rekruter (ranking, detail, override, reveal identity)
```

### Phase 2 (Target)
```
Candidate: Register → Login → Upload CV (pilih posisi) → Submit
                                        ↓
Recruiter: Login → Dashboard → Filter per posisi → Run Evaluation
                                        ↓
                          Ranking + Skor + Justifikasi XAI
                                        ↓
                    Override (logged) → Reveal Identity → Keputusan
```

---

## 6. Non-Fungsional

| Kategori | Phase 1 | Phase 2 |
|---|---|---|
| Data privacy | Data lokal | Data di server, enkripsi at-rest |
| Auth security | — | JWT with expiry, bcrypt password hashing |
| Output consistency | JSON terstruktur | JSON terstruktur |
| NER accuracy | Miss rate ≤ 5% | Miss rate ≤ 5% |
| Batch performance | 240 dokumen tanpa timeout | Async queue untuk scalability |
| Availability | Local only | 99% uptime target (VPS) |
