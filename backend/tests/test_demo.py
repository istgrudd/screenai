"""Tests for the public Demo Mode endpoints.

The heavy pipeline (IndoBERT NER + DeepSeek LLM) is mocked so tests run
fast and offline. We verify: the demo surface is hidden when DEMO_MODE is
off, file validation, the response schema, demo_submissions persistence,
ranking union, and the concurrency limiter.
"""

import asyncio
import threading
import time

import httpx
import pytest
from fastapi.testclient import TestClient

import backend.routers.demo as demo_module
from backend.config import settings
from backend.database import SessionLocal
from backend.main import app
from backend.models.demo_submission import DemoSubmission
from backend.models.rubric import Rubric, Dimension


def _create_rubric(name: str, position: str = "Demo Position") -> int:
    """Insert a rubric (with one full-weight dimension) directly; return its id.

    Used to simulate an admin creating a rubric via the Rubrics page, without
    going through the auth-protected admin endpoint.
    """
    db = SessionLocal()
    try:
        rubric = Rubric(name=name, position=position, description=f"{name} desc")
        db.add(rubric)
        db.flush()
        db.add(
            Dimension(
                rubric_id=rubric.id,
                name="Overall",
                weight=1.0,
                description="",
                indicators=[],
            )
        )
        db.commit()
        db.refresh(rubric)
        return rubric.id
    finally:
        db.close()


def _demo_id(client, index: int = 0) -> int:
    """Resolve a valid demo rubric id live from /positions (never hardcoded)."""
    resp = client.get("/api/demo/positions")
    assert resp.status_code == 200
    return resp.json()["data"][index]["id"]


def _fake_pipeline_result():
    return {
        "evaluation": {
            "composite_score": 82.5,
            "dimension_scores": [
                {
                    "dimension": "Technical Proficiency",
                    "score": 85.0,
                    "weight": 0.35,
                    "weighted_score": 29.75,
                    "justification": "Bukti kuat.",
                    "evidence": ["Python", "SQL"],
                },
                {
                    "dimension": "Project & Analytical Experience",
                    "score": 80.0,
                    "weight": 0.30,
                    "weighted_score": 24.0,
                    "justification": "Proyek relevan.",
                    "evidence": ["Skripsi"],
                },
            ],
            "profile_summary": (
                "Kandidat menunjukkan kompetensi teknis yang baik. "
                "Pengalaman proyek relevan dengan posisi. "
                "Komunikasi tergolong memadai. "
                "Memiliki growth mindset yang jelas. "
                "Kalimat kelima yang seharusnya dipotong."
            ),
            "raw_llm_response": "{}",
        },
        "entities": [
            {"text": "Budi Santoso", "label": "PERSON", "replacement": "[PERSON_1]"},
            {"text": "Universitas Telkom", "label": "ORG", "replacement": "[ORG_1]"},
        ],
        "sections": {"skills": "python sql", "education": "telkom"},
    }


@pytest.fixture()
def mock_pipeline(monkeypatch):
    """Replace the heavy pipeline with a fast fake."""
    monkeypatch.setattr(
        demo_module, "_run_pipeline_sync", lambda path, rubric_id: _fake_pipeline_result()
    )


PDF_BYTES = b"%PDF-1.4\n%fake pdf content\n"


# --- Endpoint gating -------------------------------------------------------

def test_evaluate_disabled_returns_404(client):
    """With DEMO_MODE off (default), the endpoint must be hidden (404)."""
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": "1"},
    )
    assert resp.status_code == 404


def test_positions_disabled_returns_404(client):
    resp = client.get("/api/demo/positions")
    assert resp.status_code == 404


def test_positions_enabled(client, demo_enabled):
    """Only [DEMO] rubrics are listed — the two seeded defaults, prefix stripped."""
    resp = client.get("/api/demo/positions")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 2
    # Labels carry no [DEMO] prefix.
    assert {p["label"] for p in data} == {
        "Data Science Intern",
        "Backend Engineer Intern",
    }
    # Backward-compatible contract for the existing frontend.
    assert {p["title"] for p in data} == {
        "Data Science Intern",
        "Backend Engineer Intern",
    }
    for p in data:
        assert isinstance(p["id"], int)
        assert "[DEMO]" not in p["label"]
        assert p["dimension_count"] >= 1


def test_positions_excludes_non_demo_rubrics(client, demo_enabled):
    """Non-[DEMO] rubrics must never surface in the demo dropdown."""
    _create_rubric("Junior Data Analyst Screening", "Junior Data Analyst")
    _create_rubric("asdasdasd", "whatever")

    data = client.get("/api/demo/positions").json()["data"]
    labels = {p["label"] for p in data}
    assert "Junior Data Analyst Screening" not in labels
    assert "asdasdasd" not in labels
    assert labels == {"Data Science Intern", "Backend Engineer Intern"}


def test_new_demo_rubric_appears_without_restart(client, demo_enabled):
    """Creating a [DEMO] rubric makes it show up immediately (no restart)."""
    before = {p["label"] for p in client.get("/api/demo/positions").json()["data"]}
    assert "QA Engineer Intern" not in before

    _create_rubric("[DEMO] QA Engineer Intern", "QA Engineer")

    after = client.get("/api/demo/positions").json()["data"]
    labels = {p["label"] for p in after}
    assert "QA Engineer Intern" in labels
    assert len(after) == 3  # 2 seeded defaults + the new one


def test_bootstrap_recreates_defaults_after_reset(client, demo_enabled):
    """After wiping all rubrics, /positions re-seeds the two defaults."""
    db = SessionLocal()
    try:
        db.query(Dimension).delete()
        db.query(Rubric).delete()
        db.commit()
    finally:
        db.close()

    data = client.get("/api/demo/positions").json()["data"]
    assert {p["label"] for p in data} == {
        "Data Science Intern",
        "Backend Engineer Intern",
    }


# --- File validation -------------------------------------------------------

def test_reject_non_pdf(client, demo_enabled, mock_pipeline):
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.txt", b"hello", "text/plain")},
        data={"position_id": str(_demo_id(client))},
    )
    assert resp.status_code == 400
    assert "PDF" in resp.json()["detail"]


def test_reject_oversize(client, demo_enabled, mock_pipeline):
    big = b"%PDF-1.4\n" + b"0" * (settings.demo_max_upload_mb * 1024 * 1024 + 1)
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", big, "application/pdf")},
        data={"position_id": str(_demo_id(client))},
    )
    assert resp.status_code == 413


def test_reject_unknown_rubric(client, demo_enabled, mock_pipeline):
    """A rubric id that does not exist is rejected."""
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": "999999"},
    )
    assert resp.status_code == 400


def test_reject_non_demo_rubric(client, demo_enabled, mock_pipeline):
    """SECURITY: the public endpoint must refuse a non-[DEMO] internal rubric."""
    internal_id = _create_rubric("Junior Data Analyst Screening", "Junior Data Analyst")
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": str(internal_id)},
    )
    assert resp.status_code == 400
    # And nothing was scored/persisted for it.
    db = SessionLocal()
    try:
        leaked = (
            db.query(DemoSubmission)
            .filter(DemoSubmission.rubric_id == internal_id)
            .count()
        )
    finally:
        db.close()
    assert leaked == 0


# --- Happy path: schema + persistence + ranking ----------------------------

def test_evaluate_success_schema(client, demo_enabled, mock_pipeline):
    rubric_id = _demo_id(client)
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": str(rubric_id), "name": "Andi"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]

    # Full response schema
    for key in (
        "submission_id",
        "anonymous_id",
        "display_name",
        "position_id",
        "position_title",
        "composite_score",
        "dimension_scores",
        "entities",
        "sections",
        "explanation",
    ):
        assert key in data, f"missing key: {key}"

    assert data["display_name"] == "Andi"
    assert data["anonymous_id"].startswith("DEMO-")
    assert data["composite_score"] == 82.5
    assert len(data["dimension_scores"]) == 2
    assert data["entities"][0]["label"] == "PERSON"
    # Explanation is truncated to <= 4 sentences (5th sentence dropped)
    assert "Kalimat kelima" not in data["explanation"]

    # Persisted to the separate demo_submissions table
    db = SessionLocal()
    try:
        row = (
            db.query(DemoSubmission)
            .filter(DemoSubmission.id == data["submission_id"])
            .first()
        )
        assert row is not None
        assert row.composite_score == 82.5
    finally:
        db.close()


def test_default_name(client, demo_enabled, mock_pipeline):
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": str(_demo_id(client))},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["display_name"] == "Pengunjung Pameran"


# --- Auto-purge ------------------------------------------------------------

def test_purge_removes_old_rows(client, demo_enabled, mock_pipeline):
    # Create a submission, then purge with a 0-minute threshold.
    client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": str(_demo_id(client))},
    )
    db = SessionLocal()
    try:
        before = db.query(DemoSubmission).count()
    finally:
        db.close()
    assert before >= 1

    removed = demo_module.purge_old_demo_submissions(minutes=0)
    assert removed >= 1

    db = SessionLocal()
    try:
        after = db.query(DemoSubmission).count()
    finally:
        db.close()
    assert after == 0


# --- Concurrency limiter ---------------------------------------------------

def test_concurrency_limit(demo_enabled, monkeypatch):
    """5 parallel requests must never run more than demo_max_concurrency
    evaluations at once (and must actually run >1 in parallel).

    Driven on a single event loop via httpx ASGITransport so the asyncio
    semaphore is exercised correctly (a thread-pool TestClient would
    deadlock its portal here).
    """
    state = {"current": 0, "max": 0}
    lock = threading.Lock()

    def slow_pipeline(path, rubric_id):
        # Runs in the endpoint's worker thread (asyncio.to_thread).
        with lock:
            state["current"] += 1
            state["max"] = max(state["max"], state["current"])
        time.sleep(0.4)
        with lock:
            state["current"] -= 1
        return _fake_pipeline_result()

    monkeypatch.setattr(demo_module, "_run_pipeline_sync", slow_pipeline)

    # Resolve a valid demo rubric id once, synchronously, before firing.
    rubric_id = _demo_id(TestClient(app))

    async def run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            async def fire():
                return await ac.post(
                    "/api/demo/evaluate",
                    files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
                    data={"position_id": str(rubric_id)},
                )

            responses = await asyncio.gather(*[fire() for _ in range(5)])
            return [r.status_code for r in responses]

    codes = asyncio.run(run())

    assert all(code == 200 for code in codes)
    assert state["max"] <= settings.demo_max_concurrency
    assert state["max"] >= 2  # parallelism actually occurred (queued, not serial)


# --- §7: rubric preview (B) ------------------------------------------------

def test_positions_includes_dimensions(client, demo_enabled):
    """B: /positions exposes each [DEMO] rubric's dimensions for the preview."""
    data = client.get("/api/demo/positions").json()["data"]
    assert len(data) >= 1
    for pos in data:
        assert "dimensions" in pos
        assert len(pos["dimensions"]) == pos["dimension_count"]
        for d in pos["dimensions"]:
            assert {"name", "weight", "description"} <= set(d.keys())
            assert 0 < d["weight"] <= 1


# --- §7: justification + evidence passthrough (C) --------------------------

def test_evaluate_passes_through_justification_evidence(client, demo_enabled, mock_pipeline):
    """C: response carries per-dimension justification + evidence (no LLM call)."""
    rubric_id = _demo_id(client)
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": str(rubric_id)},
    )
    assert resp.status_code == 200
    dims = resp.json()["data"]["dimension_scores"]
    assert all("justification" in d and "evidence" in d for d in dims)
    assert dims[0]["justification"] == "Bukti kuat."
    assert dims[0]["evidence"] == ["Python", "SQL"]
    assert "weight" in dims[0]


def test_dimension_label_canonicalized(client, demo_enabled, monkeypatch):
    """Drift fix: an LLM-paraphrased dimension name is normalised to the rubric's."""
    drifted = _fake_pipeline_result()
    # First demo rubric (Data Science Intern) has "Project & Analytical Experience".
    drifted["evaluation"]["dimension_scores"][1]["dimension"] = "Analytical & Project Experience"
    monkeypatch.setattr(
        demo_module, "_run_pipeline_sync", lambda path, rubric_id: drifted
    )
    rubric_id = _demo_id(client)
    resp = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": str(rubric_id)},
    )
    assert resp.status_code == 200
    names = {d["dimension"] for d in resp.json()["data"]["dimension_scores"]}
    assert "Project & Analytical Experience" in names  # canonical
    assert "Analytical & Project Experience" not in names  # drift removed


# --- §7: demo submission detail (E) ----------------------------------------

@pytest.fixture()
def auth_as_recruiter():
    """Bypass the recruiter/admin auth dependency for detail-endpoint tests."""
    app.dependency_overrides[demo_module._recruiter_or_admin] = lambda: None
    yield
    app.dependency_overrides.pop(demo_module._recruiter_or_admin, None)


def test_demo_detail_requires_auth(client, demo_enabled):
    """E stays behind auth even though the rest of the demo router is public."""
    resp = client.get("/api/demo/submissions/1")
    assert resp.status_code == 401


def test_demo_detail_ok(client, demo_enabled, mock_pipeline, auth_as_recruiter):
    """E: detail is sourced from demo_submissions with justification + evidence."""
    rubric_id = _demo_id(client)
    sub_id = client.post(
        "/api/demo/evaluate",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        data={"position_id": str(rubric_id), "name": "Citra"},
    ).json()["data"]["submission_id"]

    resp = client.get(f"/api/demo/submissions/{sub_id}")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["is_demo"] is True
    assert data["display_name"] == "Citra"
    assert data["position_title"]  # resolved from rubric record, prefix stripped
    assert "[DEMO]" not in data["position_title"]
    ds = data["dimension_scores"]
    assert ds and "dimension_name" in ds[0]
    assert "justification" in ds[0] and "evidence" in ds[0]


def test_demo_detail_purged_is_graceful(client, demo_enabled, auth_as_recruiter):
    """E: a purged/missing submission returns 404 with a friendly message."""
    resp = client.get("/api/demo/submissions/987654")
    assert resp.status_code == 404
    assert "dihapus" in resp.json()["detail"].lower()
