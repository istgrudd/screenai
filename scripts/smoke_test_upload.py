"""Smoke test: upload a sample PDF and verify extraction results.

Usage:
    python scripts/smoke_test_upload.py
"""

import json
import requests
import sqlite3

API_URL = "http://127.0.0.1:8000"
SAMPLE_PDF = "data/raw_pdfs/sample_cv.pdf"
DB_PATH = "data/app.db"


def main():
    print("=" * 60)
    print("SMOKE TEST: Upload + Extraction Pipeline")
    print("=" * 60)

    # --- 1. Upload the sample PDF ---
    print("\n[1] Uploading sample PDF...")
    with open(SAMPLE_PDF, "rb") as f:
        resp = requests.post(
            f"{API_URL}/api/upload",
            files=[("files", ("sample_cv.pdf", f, "application/pdf"))],
        )

    if resp.status_code != 200:
        print(f"  FAIL: status={resp.status_code}, body={resp.text}")
        return

    data = resp.json()
    print(f"  Response: {json.dumps(data, indent=2, ensure_ascii=False)}")

    assert data["success"] is True, "Response success should be True"
    assert data["data"]["uploaded_count"] == 1, "Should upload 1 file"

    candidate = data["data"]["candidates"][0]
    cand_id = candidate["candidate_id"]
    anon_id = candidate["anonymous_id"]
    print(f"  Candidate ID: {cand_id}, Anonymous ID: {anon_id}")
    print(f"  Status: {candidate['status']}")
    print(f"  Sections detected: {candidate['document']['sections_detected']}")

    # --- 2. Verify database records ---
    print("\n[2] Checking database records...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Check candidate
    row = conn.execute(
        "SELECT * FROM candidates WHERE id = ?", (cand_id,)
    ).fetchone()
    assert row is not None, "Candidate not found in DB"
    print(f"  Candidate row: id={row['id']}, anon={row['anonymous_id']}, status={row['status']}")

    # Check document
    doc = conn.execute(
        "SELECT * FROM documents WHERE candidate_id = ?", (cand_id,)
    ).fetchone()
    assert doc is not None, "Document not found in DB"
    print(f"  Document row: id={doc['id']}, type={doc['document_type']}, pages={doc['page_count']}, size={doc['file_size_kb']}kb")

    # Check raw text is present
    assert doc["raw_text"] and len(doc["raw_text"]) > 100, "raw_text should be populated"
    print(f"  Raw text length: {len(doc['raw_text'])} chars")

    # Check normalized text
    assert doc["normalized_text"] and len(doc["normalized_text"]) > 100, "normalized_text should be populated"
    print(f"  Normalized text length: {len(doc['normalized_text'])} chars")

    # Check sections
    sections = json.loads(doc["sections_json"]) if isinstance(doc["sections_json"], str) else doc["sections_json"]
    print(f"\n[3] Section segmentation results:")
    for section, content in sections.items():
        preview = content[:100].replace("\n", " ") if content else "(empty)"
        status = "OK" if content.strip() else "EMPTY"
        print(f"  [{status}] {section}: {preview}...")

    conn.close()

    # --- 3. Verify extracted JSON file ---
    print(f"\n[4] Checking extracted JSON file...")
    json_path = f"data/extracted/{anon_id}.json"
    try:
        with open(json_path, "r", encoding="utf-8") as jf:
            extracted = json.load(jf)
        print(f"  JSON file exists: {json_path}")
        print(f"  Keys: {list(extracted.keys())}")
        print(f"  Extraction pages: {len(extracted['extraction']['pages'])}")
    except FileNotFoundError:
        print(f"  FAIL: JSON file not found at {json_path}")
        return

    print("\n" + "=" * 60)
    print("SMOKE TEST PASSED")
    print("=" * 60)


if __name__ == "__main__":
    main()
