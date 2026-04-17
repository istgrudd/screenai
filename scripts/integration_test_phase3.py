"""Integration test: Full pipeline — Upload PDF, Anonymize, Score via RAG.

Tests the complete pipeline:
  Upload PDF -> Extract -> Normalize -> Anonymize -> RAG Score -> DB Storage

Prerequisites:
  1. Server running on http://127.0.0.1:8000
  2. Rubric seeded (run: python -m scripts.seed_rubric)
  3. DeepSeek API key configured in .env
  4. Sample CV available

Usage:
    python scripts/integration_test_phase3.py
"""

import json
import requests
import sqlite3
import time

API_URL = "http://127.0.0.1:8000"
SAMPLE_PDF = "data/raw_pdfs/CV_Fadly Huwaiza Khalid.pdf"
DB_PATH = "data/app.db"


def main():
    print("=" * 60)
    print("INTEGRATION TEST: Phase 3 — Full Pipeline")
    print("=" * 60)

    # --- 1. Check health ---
    print("\n[1] Checking API health...")
    resp = requests.get(f"{API_URL}/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    print("  API is healthy")

    # --- 2. Check rubric exists ---
    print("\n[2] Checking rubric...")
    resp = requests.get(f"{API_URL}/api/rubrics")
    assert resp.status_code == 200, f"Rubrics endpoint failed: {resp.status_code}"
    rubrics = resp.json()["data"]
    assert len(rubrics) > 0, "No rubrics found — run: python -m scripts.seed_rubric"
    rubric_id = rubrics[0]["id"]
    print(f"  Rubric found: id={rubric_id}, name='{rubrics[0]['name']}'")

    # --- 3. Get rubric detail ---
    resp = requests.get(f"{API_URL}/api/rubrics/{rubric_id}")
    assert resp.status_code == 200
    rubric_detail = resp.json()["data"]
    print(f"  Dimensions: {len(rubric_detail['dimensions'])}")
    for dim in rubric_detail["dimensions"]:
        print(f"    - {dim['name']} ({dim['weight']*100:.0f}%)")

    # --- 4. Upload a sample PDF ---
    print(f"\n[3] Uploading sample PDF...")
    with open(SAMPLE_PDF, "rb") as f:
        resp = requests.post(
            f"{API_URL}/api/upload",
            files=[("files", ("sample_cv.pdf", f, "application/pdf"))],
        )
    assert resp.status_code == 200, f"Upload failed: {resp.text}"
    upload_data = resp.json()["data"]
    candidate = upload_data["candidates"][0]
    cand_id = candidate["candidate_id"]
    anon_id = candidate["anonymous_id"]
    print(f"  Uploaded: candidate_id={cand_id}, anon_id={anon_id}")
    print(f"  Status: {candidate['status']}")
    print(f"  Entities anonymized: {candidate['anonymization']['entity_count']}")

    # --- 5. Run batch evaluation ---
    print(f"\n[4] Running batch evaluation (rubric_id={rubric_id})...")
    print("  [This calls DeepSeek V3 — may take 15-30 seconds]")
    start_time = time.time()
    resp = requests.post(
        f"{API_URL}/api/evaluate",
        json={"rubric_id": rubric_id},
    )
    elapsed = time.time() - start_time

    if resp.status_code != 200:
        print(f"  FAIL: status={resp.status_code}")
        print(f"  Body: {resp.text[:1000]}")
        return

    eval_data = resp.json()["data"]
    print(f"  Evaluation completed in {elapsed:.1f}s")
    print(f"  Evaluated: {eval_data['evaluated_count']} candidates")
    print(f"  Errors: {eval_data['error_count']}")

    if eval_data["errors"]:
        for err in eval_data["errors"]:
            print(f"  ERROR: {err['anonymous_id']}: {err['error']}")
        return

    # --- 6. Check results ---
    if eval_data["results"]:
        result = eval_data["results"][0]
        print(f"\n[5] Scoring Results for {result['anonymous_id']}:")
        print(f"  Composite Score: {result['composite_score']:.1f}/100")
        for ds in result["dimension_scores"]:
            print(f"    {ds['dimension']:40s} {ds['score']:5.1f} (weighted: {ds['weighted_score']:.2f})")

    # --- 7. Verify database ---
    print(f"\n[6] Verifying database records...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cand = conn.execute("SELECT * FROM candidates WHERE id = ?", (cand_id,)).fetchone()
    print(f"  Candidate status: {cand['status']}")
    print(f"  Composite score in DB: {cand['composite_score']}")
    if cand["profile_summary"]:
        summary_preview = cand["profile_summary"][:200].replace("\n", " ")
        print(f"  Profile summary: {summary_preview}...")

    scores = conn.execute(
        "SELECT * FROM dimension_scores WHERE candidate_id = ?", (cand_id,)
    ).fetchall()
    print(f"  DimensionScore records: {len(scores)}")
    for s in scores:
        print(f"    dim_id={s['dimension_id']}, score={s['score']}, weighted={s['weighted_score']}")

    conn.close()

    print(f"\n{'=' * 60}")
    print("INTEGRATION TEST PASSED")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
