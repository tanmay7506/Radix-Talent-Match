import { createJdPdfFile } from '../utils/textToPdf'
import { notifySessionExpired } from './sessionEvents'
import { getAccessToken } from './authSession'

function authHeaders(headers = {}) {
  const token = getAccessToken()
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers
}

/**
 * Centralized API service for RADIX Talent Match backend communication.
 *
 * Configurable via VITE_API_URL.
 * In a multi-service Vercel deployment, public rewrites route /api/(.*) to the backend service.
 * When running in a deployed browser environment (like Vercel), it safely uses relative '/api'
 * so that API calls are never blocked trying to reach localhost.
 */

function getApiBaseUrl() {
  const envUrl = (import.meta.env?.VITE_API_URL || '').trim()

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0'

    // When running in a deployed browser (e.g. *.vercel.app), ignore any localhost target
    if (!isLocalhost && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1') || envUrl.includes(':8000') || !envUrl)) {
      return '/api'
    }
  }

  // In production builds, default to /api unless an explicit external HTTPS URL is provided
  if (import.meta.env.PROD && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1') || !envUrl)) {
    return '/api'
  }

  return envUrl || '/api'
}

const FILE_UPLOAD_TIMEOUT_MS = 90_000
const FILE_UPLOAD_TIMEOUT_MESSAGE = 'LLM free tier failed'

function resolveUrl(endpoint) {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    return `${base}${path.slice(4)}`
  }
  return `${base}${path}`
}

async function postFormData(endpoint, formData, signal) {
  const url = resolveUrl(endpoint)
  const requestController = new AbortController()
  let timedOut = false
  const abortRequest = () => requestController.abort()
  if (signal?.aborted) abortRequest()
  else signal?.addEventListener('abort', abortRequest, { once: true })
  const timeoutId = setTimeout(() => {
    timedOut = true
    requestController.abort()
  }, FILE_UPLOAD_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: authHeaders(),
      signal: requestController.signal,
    })

    if (!res.ok) {
      notifySessionExpired(res)
      let errorDetail = res.statusText
      try {
        const errorData = await res.json()
        if (errorData?.detail) {
          errorDetail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // Fallback to res.statusText
      }
      throw new Error(`Server returned ${res.status}: ${errorDetail}`)
    }

    return await res.json()
  } catch (err) {
    if (timedOut) throw new Error(FILE_UPLOAD_TIMEOUT_MESSAGE)
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Unable to connect to RADIX backend at ${url}. Ensure the backend service is running.`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortRequest)
  }
}

async function postJson(endpoint, data, signal) {
  const url = resolveUrl(endpoint)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data),
      credentials: 'include',
      signal,
    })

    if (!res.ok) {
      notifySessionExpired(res)
      let errorDetail = res.statusText
      try {
        const errorData = await res.json()
        if (errorData?.detail) {
          errorDetail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // Fallback to res.statusText
      }
      throw new Error(`Server returned ${res.status}: ${errorDetail}`)
    }

    return await res.json()
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Unable to connect to RADIX backend at ${url}. Ensure the backend service is running.`)
    }
    throw err
  }
}

async function getJson(endpoint, signal) {
  const url = resolveUrl(endpoint)
  try {
    const res = await fetch(url, { signal, credentials: 'include', headers: authHeaders() })
    if (!res.ok) {
      notifySessionExpired(res)
      let errorDetail = res.statusText
      try {
        const errorData = await res.json()
        if (errorData?.detail) {
          errorDetail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // Fallback to res.statusText
      }
      throw new Error(`Server returned ${res.status}: ${errorDetail}`)
    }
    return await res.json()
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Unable to connect to RADIX backend at ${url}. Ensure the backend service is running.`)
    }
    throw err
  }
}

export const api = {
  get baseUrl() {
    return getApiBaseUrl()
  },

  /**
   * Upload resume and extract structured candidate profile.
   * POST /profile/build/from-resume
   */
  async buildProfileFromResume(file, { signal } = {}) {
    const formData = new FormData()
    formData.append('file', file)
    return await postFormData('/profile/build/from-resume', formData, signal)
  },

  /**
   * Upload job description file and extract 12 RADIX categories + technologies.
   * POST /jd/extract-skills
   */
  async extractJdSkills(file, { signal } = {}) {
    const formData = new FormData()
    formData.append('file', file)
    return await postFormData('/jd/extract-skills', formData, signal)
  },

  /**
   * Extract skills from pasted text by generating an in-memory PDF for the existing endpoint.
   * POST /jd/extract-skills
   */
  async extractJdSkillsFromText(text, { signal } = {}) {
    const file = createJdPdfFile(text, 'pasted_job_description.pdf')
    const formData = new FormData()
    formData.append('file', file)
    return await postFormData('/jd/extract-skills', formData, signal)
  },

  /**
   * Analyze skill matching between candidate profile and JD skills.
   * POST /skill-matching/analyze
   */
  async analyzeSkillMatch({ candidateProfile, jdSkills, jdSourceFile = 'Job description' }, { signal } = {}) {
    return await postJson('/skill-matching/analyze', {
      jd_source_file: jdSourceFile,
      candidate_profile: candidateProfile,
      jd_skills: jdSkills,
    }, signal)
  },

  /** Retrieve companies available to the talent-check assessment. */
  async getTalentCheckCompanies({ signal } = {}) {
    return await getJson('/talent-check/companies', signal)
  },

  /** Assess a candidate profile against one company's requirements. */
  async runTalentCheck(profile, companyId, { signal } = {}) {
    const company = encodeURIComponent(companyId)
    return await postJson(`/talent-check?company_id=${company}`, { profile }, signal)
  },

  /** Generate a JD-specific learning roadmap from the Talent Check assessment. */
  async getTalentCheckRoadmap(profile, companyId, { jdSkills = null, jdTitle = '', signal } = {}) {
    const company = encodeURIComponent(companyId)
    const payload = { profile }
    if (jdSkills) payload.jd_skills = jdSkills
    if (jdTitle) payload.jd_title = jdTitle
    return await postJson(`/talent-check/analyze?company_id=${company}`, payload, signal)
  },

  /** Rank companies using the current assessed candidate skills. */
  async getCompanyMatches(skills, { signal } = {}) {
    return await postJson('/company-matches', { skills }, signal)
  },

  /** Send a message to the AI Chatbot agent */
  async sendChatMessage(message, history = [], signal = null) {
    return await postJson('/api/chat', { message, history }, signal)
  },
}

export default api
