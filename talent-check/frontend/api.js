/**
 * RADIX Talent Check — API Service Layer
 *
 * All backend communication is centralised here.
 * Base URL is read from the VITE_API_BASE_URL env var at build time,
 * or from window.RADIX_API_BASE_URL at runtime, or falls back to
 * http://127.0.0.1:8000 for local development.
 */

const BASE_URL =
  (typeof window !== 'undefined' && window.RADIX_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://127.0.0.1:8000';

/**
 * Thin wrapper around fetch that always parses JSON and surfaces
 * HTTP errors with their backend `detail` message where available.
 */
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (networkErr) {
    throw new ApiError(`Network error — is the backend running at ${BASE_URL}?`, 0);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status} — ${response.statusText}`, response.status);
    }
    throw new ApiError('The server returned a non-JSON response.', response.status);
  }

  if (!response.ok) {
    const detail = body?.detail ?? `HTTP ${response.status}`;
    throw new ApiError(
      typeof detail === 'string' ? detail : JSON.stringify(detail),
      response.status,
      body,
    );
  }

  return body;
}

export class ApiError extends Error {
  constructor(message, status, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ─── Endpoints ────────────────────────────────────────────────────

/** GET /health */
export async function getHealth() {
  return apiFetch('/health');
}

/**
 * Fetch company requirements JSON directly from the project data.
 * Works with both backend mount (http://127.0.0.1:8000/data/company_skillsets.json)
 * and frontend static server (http://127.0.0.1:5173/data/company_skillsets.json).
 */
export async function getCompanySkillsets() {
  try {
    const res = await fetch(`${BASE_URL}/data/company_skillsets.json`);
    if (res.ok) return await res.json();
  } catch {
    // fallback to local frontend origin
  }
  const fallbackRes = await fetch('/data/company_skillsets.json');
  if (!fallbackRes.ok) throw new Error('Could not load company_skillsets.json');
  return fallbackRes.json();
}

/**
 * Fetch default Profile Builder candidate profile from project data.
 * Works with both backend mount and frontend static server.
 */
export async function getProfileBuilderCandidate() {
  try {
    const res = await fetch(`${BASE_URL}/data/test_candidate_profile.json`);
    if (res.ok) return await res.json();
  } catch {
    // fallback to local frontend origin
  }
  const fallbackRes = await fetch('/data/test_candidate_profile.json');
  if (!fallbackRes.ok) throw new Error('Could not load test_candidate_profile.json');
  return fallbackRes.json();
}

/**
 * POST /talent-check
 * Single-company assessment (no AI analysis).
 * @param {Object} profile  Normalized candidate profile
 * @param {string} company  Company name
 */
export async function talentCheck(profile, company) {
  return apiFetch(`/talent-check?company=${encodeURIComponent(company)}`, {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

/**
 * POST /talent-check/all
 * All-company assessment (no AI analysis).
 * @param {Object} profile  Normalized candidate profile
 */
export async function talentCheckAll(profile) {
  return apiFetch('/talent-check/all', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

/**
 * POST /talent-check/analyze
 * Single-company assessment + AI analysis.
 * @param {Object} profile  Normalized candidate profile
 * @param {string} company  Company name
 */
export async function talentCheckAnalyze(profile, company) {
  return apiFetch(`/talent-check/analyze?company=${encodeURIComponent(company)}`, {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

/**
 * POST /talent-check/all/analyze
 * All-company comparison + AI analysis.
 * @param {Object} profile  Normalized candidate profile
 */
export async function talentCheckAllAnalyze(profile) {
  return apiFetch('/talent-check/all/analyze', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export { BASE_URL };
