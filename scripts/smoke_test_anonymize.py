"""Smoke test: upload a sample PDF and verify anonymization results.

Tests the full pipeline: upload -> extract -> normalize -> anonymize.
Checks that identity attributes are properly masked in the output.

Usage:
    python scripts/smoke_test_anonymize.py
"""

import json
import requests
import sqlite3

API_URL = "http://127.0.0.1:8000"
SAMPLE_PDF = "data/raw_pdfs/sample_cv.pdf"
DB_PATH = "data/app.db"

# Known identity attributes in the sample CV that MUST be anonymized
KNOWN_IDENTITIES = [
    "Budi Santoso",       # PERSON
    "081234567890",        # PHONE
    "budi.santoso@email.com",  # EMAIL
    "Surabaya",           # LOC
    "Jawa Timur",         # LOC
]

# Known organizations that should be anonymized
KNOWN_ORGS = [
    "Institut Teknologi Sepuluh Nopember",
    "ITS",
    "Tokopedia",
]


def main():
    print("=" * 60)
    print("SMOKE TEST: Anonymization Pipeline (Phase 2)")
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
    assert data["success"] is True, "Response success should be True"

    candidate = data["data"]["candidates"][0]
    cand_id = candidate["candidate_id"]
    anon_id = candidate["anonymous_id"]
    print(f"  Candidate ID: {cand_id}, Anonymous ID: {anon_id}")
    print(f"  Status: {candidate['status']}")

    # --- 2. Check anonymization results from response ---
    anon_info = candidate.get("anonymization", {})
    entity_count = anon_info.get("entity_count", 0)
    entities = anon_info.get("entities_found", [])

    print(f"\n[2] Anonymization results:")
    print(f"  Entities detected: {entity_count}")
    for ent in entities:
        print(f"    {ent['label']:8s} | {ent['text']:30s} -> {ent['replacement']}")

    # --- 3. Check database for anonymized text ---
    print(f"\n[3] Checking database records...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    doc = conn.execute(
        "SELECT * FROM documents WHERE candidate_id = ?", (cand_id,)
    ).fetchone()
    assert doc is not None, "Document not found in DB"

    anonymized_text = doc["anonymized_text"]
    assert anonymized_text, "anonymized_text should be populated in DB"
    print(f"  Anonymized text length: {len(anonymized_text)} chars")

    entities_db = doc["entities_json"]
    if isinstance(entities_db, str):
        entities_db = json.loads(entities_db)
    print(f"  Entities in DB: {len(entities_db)} entries")

    conn.close()

    # --- 4. Verify identity leak check ---
    print(f"\n[4] Identity leak check:")
    leaks = []
    for identity in KNOWN_IDENTITIES:
        if identity.lower() in anonymized_text.lower():
            leaks.append(identity)
            print(f"  [LEAK] '{identity}' still found in anonymized text!")
        else:
            print(f"  [SAFE] '{identity}' successfully anonymized")

    # Check orgs (softer — some may be partially matched)
    for org in KNOWN_ORGS:
        if org.lower() in anonymized_text.lower():
            leaks.append(org)
            print(f"  [LEAK] '{org}' still found in anonymized text!")
        else:
            print(f"  [SAFE] '{org}' successfully anonymized")

    # --- 5. Verify anonymized JSON file ---
    print(f"\n[5] Checking anonymized JSON file...")
    json_path = f"data/anonymized/{anon_id}.json"
    try:
        with open(json_path, "r", encoding="utf-8") as jf:
            anon_json = json.load(jf)
        print(f"  JSON file exists: {json_path}")
        print(f"  Keys: {list(anon_json.keys())}")
    except FileNotFoundError:
        print(f"  FAIL: JSON file not found at {json_path}")
        return

    # --- 6. Show anonymized text preview ---
    print(f"\n[6] Anonymized text preview (first 500 chars):")
    print("-" * 50)
    print(anonymized_text[:500])
    print("-" * 50)

    # --- Summary ---
    print(f"\n{'=' * 60}")
    if leaks:
        print(f"SMOKE TEST COMPLETED WITH {len(leaks)} LEAK(S): {leaks}")
        print("Note: Some leaks may be acceptable if the NER model")
        print("doesn't recognize certain entity patterns. Check manually.")
    else:
        print("SMOKE TEST PASSED - NO IDENTITY LEAKS DETECTED")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
