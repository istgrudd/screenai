"""Demo Mode router — public, auth-less CV evaluation for the exhibition.

All endpoints are gated behind ``settings.demo_mode``; when it is False they
return 404 so the demo surface stays disabled in normal deployments.

Endpoints:
    GET  /api/demo/positions    — list the two hardcoded demo positions
    GET  /api/demo/sample-cvs   — list bundled sample CVs (may be empty)
    POST /api/demo/evaluate     — evaluate an uploaded CV synchronously

The evaluation reuses the SAME pipeline as the production flow
(extract -> normalize -> anonymize/NER -> RAG scoring). The uploaded file is
never persisted: it is written to a temp path, processed, then deleted.
Results are stored in the separate ``demo_submissions`` table and a
background task purges rows older than ``settings.demo_purge_minutes``.
"""

import asyncio
import os
import re
import tempfile
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import SessionLocal, get_db
from backend.middleware.auth_middleware import require_role
from backend.models.demo_submission import DemoSubmission
from backend.models.rubric import Dimension, Rubric
from backend.models.user import UserRole
from backend.services.anonymizer import anonymize_text
from backend.services.demo_positions import (
    canonical_dimension_label,
    ensure_demo_rubrics,
    get_demo_rubric,
    list_demo_rubrics,
    strip_demo_prefix,
)
from backend.services.extractor import extract_text_from_pdf
from backend.services.normalizer import normalize_and_segment
from backend.services.rag_pipeline import evaluate_candidate

router = APIRouter(prefix="/api/demo", tags=["demo"])

# Demo submission detail (E) is a presenter-only surface, so it stays behind
# recruiter/admin auth even though the rest of the demo router is public.
_recruiter_or_admin = require_role(UserRole.RECRUITER, UserRole.SUPER_ADMIN)

# Limit concurrent heavy evaluations; extra requests await the semaphore
# (queue) instead of overwhelming the LLM / NER model during the exhibition.
_eval_semaphore = asyncio.Semaphore(settings.demo_max_concurrency)

# Directory that may hold bundled sample CVs (optional; empty -> feature off).
_SAMPLE_CV_DIR = os.path.join("frontend", "public", "sample-cvs")


def purge_old_demo_submissions(minutes: int | None = None) -> int:
    """Delete demo submissions older than ``minutes``; return the count removed.

    No uploaded files are stored, so purging only needs to clear DB rows.
    Returns the number of deleted rows (handy for tests/logging).
    """
    if minutes is None:
        minutes = settings.demo_purge_minutes
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    db: Session = SessionLocal()
    try:
        deleted = (
            db.query(DemoSubmission)
            .filter(DemoSubmission.created_at < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        return deleted
    finally:
        db.close()


async def demo_purge_loop(interval_seconds: int = 300) -> None:
    """Background loop that periodically purges stale demo submissions."""
    while True:
        try:
            removed = purge_old_demo_submissions()
            if removed:
                print(f"[DEMO] Auto-purged {removed} demo submission(s)")
        except Exception as e:  # pragma: no cover - defensive
            print(f"[DEMO] Purge error: {e}")
        await asyncio.sleep(interval_seconds)


def _require_demo_mode() -> None:
    """Raise 404 when demo mode is disabled, hiding the endpoint entirely."""
    if not settings.demo_mode:
        raise HTTPException(status_code=404, detail="Not Found")


def _split_sentences(text: str, limit: int = 4) -> str:
    """Return the first ``limit`` sentences of ``text`` as the demo explanation."""
    if not text:
        return ""
    # Split on sentence terminators followed by whitespace.
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    snippet = " ".join(p for p in parts[:limit] if p).strip()
    return snippet


@router.get("/positions")
def get_positions():
    """List demo-visible rubrics ([DEMO] prefix) for the frontend dropdown.

    Sourced live from the rubrics table — any [DEMO] rubric created/edited via
    the admin Rubrics page shows up here without a restart. ``ensure_demo_rubrics``
    bootstraps the two defaults first so the list is never empty (reset-safe).
    """
    _require_demo_mode()
    db: Session = SessionLocal()
    try:
        ensure_demo_rubrics(db)
        data = list_demo_rubrics(db)
    finally:
        db.close()
    return {"success": True, "data": data, "error": None}


@router.get("/sample-cvs")
def get_sample_cvs():
    """List bundled sample CVs, if any are present in the repo.

    Returns an empty list when no samples exist — the frontend hides the
    "try a sample CV" card in that case.
    """
    _require_demo_mode()
    samples: list[dict] = []
    if os.path.isdir(_SAMPLE_CV_DIR):
        for name in sorted(os.listdir(_SAMPLE_CV_DIR)):
            if name.lower().endswith(".pdf"):
                samples.append({
                    "filename": name,
                    "url": f"/sample-cvs/{name}",
                })
    return {"success": True, "data": samples, "error": None}


def _run_pipeline_sync(pdf_path: str, rubric_id: int) -> dict:
    """Run the blocking pipeline (extract -> normalize -> NER -> RAG).

    Executed in a worker thread via ``asyncio.to_thread`` so the blocking
    LLM call does not freeze the event loop and the semaphore can actually
    serialise concurrent demo requests. Uses its own DB session because it
    runs off the request thread.
    """
    extraction = extract_text_from_pdf(pdf_path)
    raw_text = extraction["raw_text"]
    if not raw_text or not raw_text.strip():
        raise ValueError("Tidak ada teks yang dapat diekstrak dari PDF ini.")

    normalization = normalize_and_segment(raw_text)
    anonymization = anonymize_text(normalization["normalized_text"])

    db: Session = SessionLocal()
    try:
        # evaluate_candidate is async but only awaits a synchronous LLM call;
        # run it to completion on this worker thread's own event loop.
        evaluation = asyncio.run(
            evaluate_candidate(
                anonymized_cv={"anonymized_text": anonymization["anonymized_text"]},
                rubric_id=rubric_id,
                db=db,
                certificate_data=None,
                max_tokens=2048,
            )
        )
    finally:
        db.close()

    sections = {
        k: v for k, v in (normalization.get("sections") or {}).items() if v and v.strip()
    }

    return {
        "evaluation": evaluation,
        "entities": anonymization["entities_found"],
        "sections": sections,
    }


@router.post("/evaluate")
async def evaluate_demo(
    file: UploadFile = File(...),
    position_id: int = Form(...),
    name: str | None = Form(None),
):
    """Evaluate an uploaded CV against a demo position and return the result.

    Validates the file (PDF, <= demo_max_upload_mb), runs the full pipeline
    behind a concurrency semaphore, stores the result in ``demo_submissions``,
    and deletes the uploaded file before returning.
    """
    _require_demo_mode()

    # --- Validate the target rubric (SECURITY GATE) ---
    # ``position_id`` carries a rubric id resolved live from /positions. The
    # public endpoint must only ever score against a demo-visible ([DEMO])
    # rubric — never an arbitrary internal rubric.
    setup_db: Session = SessionLocal()
    try:
        ensure_demo_rubrics(setup_db)  # bootstrap defaults (reset-safe)
        rubric = get_demo_rubric(setup_db, position_id)
        if rubric is None:
            raise HTTPException(status_code=400, detail="Posisi tidak valid.")
        rubric_id = rubric.id
        position_title = strip_demo_prefix(rubric.name)
    finally:
        setup_db.close()

    # --- Validate file type ---
    filename = file.filename or ""
    is_pdf = filename.lower().endswith(".pdf") or file.content_type == "application/pdf"
    if not is_pdf:
        raise HTTPException(status_code=400, detail="Hanya file PDF yang diterima.")

    # --- Read + validate size ---
    contents = await file.read()
    max_bytes = settings.demo_max_upload_mb * 1024 * 1024
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File kosong.")
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran file melebihi batas {settings.demo_max_upload_mb} MB.",
        )

    display_name = (name or "").strip() or "Pengunjung Pameran"

    # --- Write to a temp file (never persisted) ---
    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".pdf")
        with os.fdopen(fd, "wb") as f:
            f.write(contents)

        # --- Run the heavy pipeline behind the concurrency limiter ---
        async with _eval_semaphore:
            try:
                result = await asyncio.to_thread(
                    _run_pipeline_sync, tmp_path, rubric_id
                )
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e))
            except Exception as e:  # pragma: no cover - surfaced to the client
                raise HTTPException(
                    status_code=500, detail=f"Evaluasi gagal: {e}"
                )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    evaluation = result["evaluation"]
    explanation = _split_sentences(evaluation.get("profile_summary", ""), limit=4)

    # --- Persist to the separate demo_submissions table ---
    db: Session = SessionLocal()
    try:
        # Normalise dimension labels to the rubric record (single source of
        # truth, kills label drift) and PASS THROUGH justification + evidence
        # the pipeline already produced — no extra LLM call. Stored in the
        # existing JSON column so the detail view (E) has full data too.
        rubric_dims = (
            db.query(Dimension).filter(Dimension.rubric_id == rubric_id).all()
        )
        dimension_scores_json = [
            {
                "dimension": canonical_dimension_label(rubric_dims, ds["dimension"]),
                "score": ds["score"],
                "weight": ds["weight"],
                "weighted_score": ds["weighted_score"],
                "justification": ds.get("justification", ""),
                "evidence": ds.get("evidence", []),
            }
            for ds in evaluation.get("dimension_scores", [])
        ]

        submission = DemoSubmission(
            display_name=display_name,
            position_id=position_id,
            rubric_id=rubric_id,
            composite_score=evaluation.get("composite_score"),
            dimension_scores_json=dimension_scores_json,
            entities_json=result["entities"],
            sections_json=result["sections"],
            profile_summary=evaluation.get("profile_summary", ""),
            explanation=explanation,
            status="scored",
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

        data = {
            "submission_id": submission.id,
            "anonymous_id": submission.anonymous_id,
            "display_name": submission.display_name,
            "position_id": position_id,
            "position_title": position_title,
            "composite_score": submission.composite_score,
            "dimension_scores": submission.dimension_scores_json,
            "entities": submission.entities_json,
            "sections": list((submission.sections_json or {}).keys()),
            "explanation": submission.explanation,
        }
    finally:
        db.close()

    return {"success": True, "data": data, "error": None}


def _demo_dimension_scores_for_detail(rows: list[dict] | None) -> list[dict]:
    """Reshape stored demo dimension JSON into the candidate-detail shape."""
    out: list[dict] = []
    for ds in rows or []:
        out.append({
            "id": None,
            "dimension_name": ds.get("dimension", "Unknown"),
            "score": ds.get("score", 0),
            "weight": ds.get("weight", 0),
            "weighted_score": ds.get("weighted_score", 0),
            "justification": ds.get("justification", ""),
            "evidence": ds.get("evidence", []),
            "is_override": False,
        })
    return out


@router.get("/submissions/{submission_id}", dependencies=[Depends(_recruiter_or_admin)])
def get_demo_submission(submission_id: int, db: Session = Depends(get_db)):
    """Presenter-only detail of one demo submission (reuses candidate-detail UI).

    Auth-gated (recruiter/admin) and behind DEMO_MODE. Sourced entirely from
    ``demo_submissions`` (never the real candidates table). Returns 404 with a
    friendly message when the row has already been auto-purged so the frontend
    can show a graceful empty state instead of crashing.
    """
    _require_demo_mode()

    sub = (
        db.query(DemoSubmission)
        .filter(DemoSubmission.id == submission_id)
        .first()
    )
    if sub is None:
        raise HTTPException(
            status_code=404,
            detail="Data demo ini sudah dihapus otomatis.",
        )

    # Resolve the position label from the rubric record (may have been edited
    # or deleted; fall back gracefully).
    position_title = None
    if sub.rubric_id is not None:
        rubric = db.query(Rubric).filter(Rubric.id == sub.rubric_id).first()
        if rubric is not None:
            position_title = strip_demo_prefix(rubric.name)

    data = {
        "submission_id": sub.id,
        "anonymous_id": sub.anonymous_id,
        "display_name": sub.display_name,
        "status": sub.status,
        "composite_score": sub.composite_score,
        "position_title": position_title,
        "created_at": sub.created_at.isoformat() if sub.created_at else None,
        "profile_summary": sub.profile_summary,
        "explanation": sub.explanation,
        "dimension_scores": _demo_dimension_scores_for_detail(sub.dimension_scores_json),
        "entities": sub.entities_json or [],
        "sections": list((sub.sections_json or {}).keys()),
        "is_demo": True,
    }
    return {"success": True, "data": data, "error": None}
