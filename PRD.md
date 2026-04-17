# Product Requirements Document (PRD)
## Sistem Screening Rekrutasi Otomatis Berbasis RAG dan NER dengan Explainable AI

> **Scope:** MVP — local single-user system, no authentication, no deployment.

---

## 1. Overview

### 1.1 Ringkasan Produk

Platform berbasis AI yang mengotomatiskan proses seleksi awal kandidat (CV screening) dengan tiga mekanisme utama: **Blind Screening** berbasis NER, **Evaluasi Kompetensi** berbasis RAG, dan **Explainable AI (XAI)** untuk transparansi penilaian.

### 1.2 Masalah yang Diselesaikan

1. Rekruter hanya punya ~7 detik per CV → banyak kandidat bagus terlewat.
2. Seleksi manual rentan bias (nama, institusi, gender) → keputusan tidak adil.
3. ATS yang ada hanya cocokkan keyword → tidak transparan, tidak dipercaya rekruter.

---

## 2. Ruang Lingkup MVP

### In-Scope

- Ekstraksi teks dari PDF CV dan sertifikat bahasa (ATS-compatible only).
- Anonimisasi otomatis identitas kandidat via IndoBERT NER.
- Evaluasi kompetensi terhadap rubrik rekruter via RAG + LangChain + DeepSeek V3.
- Skor per dimensi kompetensi + justifikasi berbasis bukti (XAI).
- Ringkasan profil kandidat.
- Dashboard rekruter: ranking, detail kandidat, override penilaian.
- Batch processing dokumen.

### Out-of-Scope (MVP)

- Evaluasi sistem binary classification (ground truth belum tersedia — dikerjakan terpisah setelah MVP).
- Generator pertanyaan wawancara.
- Audit log override.
- Autentikasi / user login.
- Deployment ke server publik.
- PDF berbasis scan / gambar (OCR).
- Sertifikat bahasa non-EPrT.

---

## 3. Fitur

### Modul Ekstraksi Dokumen

| ID | Fitur | Prioritas |
|---|---|---|
| F-01 | Upload PDF (CV + sertifikat bahasa) via antarmuka web | Must Have |
| F-02 | Ekstraksi teks dari PDF menggunakan PyMuPDF | Must Have |
| F-03 | Normalisasi & segmentasi teks per seksi (pendidikan, pengalaman, skill) | Must Have |

### Modul Blind Screening (NER)

| ID | Fitur | Prioritas |
|---|---|---|
| F-04 | Deteksi entitas identitas: PERSON, LOC, ORG, kontak, nomor ID | Must Have |
| F-05 | Anonimisasi otomatis — ganti entitas dengan token anonim (`[PERSON_1]`, dst.) | Must Have |
| F-06 | Endpoint untuk melihat hasil anonimisasi (validasi manual) | Should Have |

### Modul Evaluasi Kompetensi (RAG)

| ID | Fitur | Prioritas |
|---|---|---|
| F-07 | Konfigurasi rubrik per posisi (kompetensi, bobot, indikator konkret) | Must Have |
| F-08 | Indexing rubrik ke vector store (ChromaDB) | Must Have |
| F-09 | Pipeline RAG: Embedding → Retrieval → Augmentation → Generation | Must Have |
| F-10 | Competency-based inference: mapping kriteria abstrak ke indikator CV | Must Have |
| F-11 | Output skor per dimensi dalam format JSON terstruktur | Must Have |

### Modul XAI

| ID | Fitur | Prioritas |
|---|---|---|
| F-12 | Justifikasi berbasis bukti: setiap skor disertai kutipan spesifik dari CV | Must Have |
| F-13 | Ringkasan profil naratif per kandidat | Must Have |

### Dashboard Rekruter

| ID | Fitur | Prioritas |
|---|---|---|
| F-15 | Ranking kandidat berdasarkan skor komposit, filter per posisi | Must Have |
| F-16 | Halaman detail kandidat: skor per dimensi + justifikasi XAI + ringkasan profil | Must Have |
| F-17 | Override skor penilaian oleh rekruter | Must Have |
| F-18 | Batch processing seluruh dokumen setelah rekrutasi ditutup | Must Have |

---

## 4. Stack Teknologi

| Layer | Teknologi |
|---|---|
| PDF Parsing | PyMuPDF |
| NER | IndoBERT (`ageng-anugrah/indobert-large-p2-finetuned-ner`) via Hugging Face |
| RAG & Orchestration | LangChain |
| Vector Store | ChromaDB (local) |
| LLM Inference | DeepSeek V3 via OpenAI-compatible endpoint |
| Backend | FastAPI |
| Frontend | React + Vite + Tailwind + shadcn/ui |
| Database | SQLite |

---

## 5. Alur Sistem

```
Upload CV/Sertifikat (PDF)
    → Ekstraksi teks (PyMuPDF)
    → Anonimisasi identitas (IndoBERT NER)
    → RAG Pipeline (LangChain + ChromaDB) ← Rubrik dari rekruter
    → LLM Inference (DeepSeek V3)
    → Skor JSON + Justifikasi + Ringkasan Profil
    → Dashboard Rekruter (ranking, detail, override)
```

---

## 6. Non-Fungsional

| Kategori | Target |
|---|---|
| Data privacy | Semua data tetap lokal, tidak dikirim ke layanan publik |
| Output consistency | Respons LLM wajib dalam format JSON terstruktur |
| NER accuracy | Miss rate identitas ≤ 5% (validasi manual sampel 10% dokumen) |
| Batch performance | 240 dokumen selesai diproses tanpa timeout |
| Modularity | Komponen pipeline (LLM, embedding, vector store) dapat diganti tanpa ubah arsitektur |