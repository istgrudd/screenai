/**
 * Public Demo Mode API client.
 *
 * Kept separate from lib/api.js so demo calls never attach an auth token
 * and never trigger the 401 -> /login redirect (the demo page is public).
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

async function unwrap(res) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || body.error || detail;
    } catch {
      // ignore parse error
    }
    throw new Error(detail);
  }
  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.error || "Unknown API error");
  }
  return json.data;
}

/** List the hardcoded demo positions for the dropdown. */
export async function listDemoPositions() {
  return unwrap(await fetch(`${BASE_URL}/demo/positions`));
}

/** List bundled sample CVs (may be empty). */
export async function listSampleCvs() {
  return unwrap(await fetch(`${BASE_URL}/demo/sample-cvs`));
}

/**
 * Evaluate a CV against a demo position.
 * @param {File} file - PDF file
 * @param {number} positionId
 * @param {string} [name] - optional visitor name
 * @param {AbortSignal} [signal] - to support client-side timeout
 */
export async function evaluateDemo(file, positionId, name, signal) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("position_id", String(positionId));
  if (name && name.trim()) formData.append("name", name.trim());

  const res = await fetch(`${BASE_URL}/demo/evaluate`, {
    method: "POST",
    body: formData,
    signal,
  });
  return unwrap(res);
}
