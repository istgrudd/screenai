/**
 * API client — fetch wrapper for all backend endpoints.
 * Base URL: http://127.0.0.1:8000/api
 */

const BASE_URL = "http://127.0.0.1:8000/api";

/**
 * Generic fetch wrapper that handles JSON responses and errors.
 * Unwraps the { success, data, error } envelope.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || body.error || JSON.stringify(body);
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

// ── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload one or more PDF files.
 * @param {File[]} files
 * @param {number|null} rubricId - optional rubric to associate candidates with
 * @returns {Promise<{uploaded_count: number, candidates: Array}>}
 */
export async function uploadFiles(files, rubricId = null) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  if (rubricId != null) {
    formData.append("rubric_id", String(rubricId));
  }
  return request("/upload", { method: "POST", body: formData });
}

// ── Candidates ──────────────────────────────────────────────────────────────

/**
 * List candidates, optionally filtered by rubric.
 * @param {number|null} rubricId
 */
export async function listCandidates(rubricId = null) {
  const qs = rubricId ? `?rubric_id=${rubricId}` : "";
  return request(`/candidates${qs}`);
}

/**
 * Get detailed info for a single candidate.
 * @param {number} candidateId
 */
export async function getCandidate(candidateId) {
  return request(`/candidates/${candidateId}`);
}

/**
 * Override a dimension score.
 * @param {number} candidateId
 * @param {number} dimScoreId — the DimensionScore primary key (id)
 * @param {number} score
 * @param {string} reason
 */
export async function overrideScore(candidateId, dimScoreId, score, reason) {
  return request(`/candidates/${candidateId}/scores/${dimScoreId}`, {
    method: "PUT",
    body: JSON.stringify({ score, reason }),
  });
}

// ── Rubrics ─────────────────────────────────────────────────────────────────

export async function listRubrics() {
  return request("/rubrics");
}

export async function getRubric(rubricId) {
  return request(`/rubrics/${rubricId}`);
}

/**
 * Create a rubric.
 * @param {{ name: string, position: string, description?: string, dimensions: Array }} payload
 */
export async function createRubric(payload) {
  return request("/rubrics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update a rubric.
 */
export async function updateRubric(rubricId, payload) {
  return request(`/rubrics/${rubricId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRubric(rubricId) {
  return request(`/rubrics/${rubricId}`, { method: "DELETE" });
}

// ── Evaluation ──────────────────────────────────────────────────────────────

/**
 * Trigger batch evaluation for a rubric.
 * @param {number} rubricId
 */
export async function runEvaluation(rubricId) {
  return request("/evaluate", {
    method: "POST",
    body: JSON.stringify({ rubric_id: rubricId }),
  });
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function healthCheck() {
  return request("/health");
}
