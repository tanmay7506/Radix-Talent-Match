/**
 * Alohomora Unified API Service Client
 * Provides centralized communication with backend intelligence endpoints.
 */

const API_BASE = ''; // Proxied by Vite to http://localhost:8001 in dev

/**
 * Analyze Job Description and extract RADIX categories and technologies
 * @param {File|string} input - Uploaded JD file (PDF, DOCX, TXT) or raw JD text string
 * @returns {Promise<{ radix_categories: Record<string, string[]>, technologies: string[] }>}
 */
export async function analyzeJobDescription(input) {
  const formData = new FormData();
  if (typeof input === 'string') {
    const blob = new Blob([input], { type: 'text/plain' });
    formData.append('file', blob, 'job_description.txt');
  } else {
    formData.append('file', input);
  }

  const response = await fetch(`${API_BASE}/jd/extract-skills`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `JD analysis failed with HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Extract candidate dossier and structured skills from resume
 * @param {File|string} input - Uploaded resume file (PDF, DOCX, TXT) or resume text
 * @returns {Promise<any>} Structured candidate profile
 */
export async function extractResumeProfile(input) {
  const formData = new FormData();
  if (typeof input === 'string') {
    const blob = new Blob([input], { type: 'text/plain' });
    formData.append('file', blob, 'resume.txt');
  } else {
    formData.append('file', input);
  }

  const response = await fetch(`${API_BASE}/profile/build/from-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Resume extraction failed with HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch company list from Supabase
 * @param {string} [query=''] - Search term
 * @param {number} [limit=50] - Number of companies
 * @returns {Promise<{ companies: Array<{ company_id: number, company_name: string, industry?: string }> }>}
 */
export async function getCompanies(query = '', limit = 100) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE}/talent-check/companies?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch companies: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Run deterministic talent assessment against company benchmark
 * @param {number} companyId - Target company identifier
 * @param {any} candidateProfile - Candidate profile or skills payload
 * @returns {Promise<any>} Assessment outcome
 */
export async function runTalentAssessment(companyId, candidateProfile) {
  const response = await fetch(`${API_BASE}/talent-check?company_id=${companyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateProfile),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Talent assessment failed: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Run talent assessment with AI explanation layer (roadmaps, strengths, projects)
 * @param {number} companyId - Target company identifier
 * @param {any} candidateProfile - Candidate profile or skills payload
 * @returns {Promise<any>} Assessment + AI analysis outcome
 */
export async function runTalentAnalysis(companyId, candidateProfile) {
  const response = await fetch(`${API_BASE}/talent-check/analyze?company_id=${companyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateProfile),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Talent analysis failed: HTTP ${response.status}`);
  }

  return await response.json();
}
