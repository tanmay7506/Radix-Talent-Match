import { createJdPdfFile } from '../utils/textToPdf'

/**
 * Centralized API service for RADIX Talent Match backend communication.
 *
 * Configurable via VITE_API_URL, defaulting to http://localhost:8000.
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000'

async function postFormData(endpoint, formData) {
  const url = `${API_BASE_URL}${endpoint}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
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
      throw new Error(`Unable to connect to RADIX backend at ${API_BASE_URL}. Ensure the backend server is running.`)
    }
    throw err
  }
}

async function postJson(endpoint, data) {
  const url = `${API_BASE_URL}${endpoint}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
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
      throw new Error(`Unable to connect to RADIX backend at ${API_BASE_URL}. Ensure the backend server is running.`)
    }
    throw err
  }
}

export const api = {
  baseUrl: API_BASE_URL,

  /**
   * Upload resume and extract structured candidate profile.
   * POST /profile/build/from-resume
   */
  async buildProfileFromResume(file) {
    const formData = new FormData()
    formData.append('file', file)
    return await postFormData('/profile/build/from-resume', formData)
  },

  /**
   * Upload job description file and extract 12 RADIX categories + technologies.
   * POST /jd/extract-skills
   */
  async extractJdSkills(file) {
    const formData = new FormData()
    formData.append('file', file)
    return await postFormData('/jd/extract-skills', formData)
  },

  /**
   * Extract skills from pasted text by generating an in-memory PDF for the existing endpoint.
   * POST /jd/extract-skills
   */
  async extractJdSkillsFromText(text) {
    const file = createJdPdfFile(text, 'pasted_job_description.pdf')
    const formData = new FormData()
    formData.append('file', file)
    return await postFormData('/jd/extract-skills', formData)
  },

  /**
   * Analyze skill matching between candidate profile and JD skills.
   * POST /skill-matching/analyze
   */
  async analyzeSkillMatch({ candidateProfile, jdSkills, jdSourceFile = 'Job description' }) {
    return await postJson('/skill-matching/analyze', {
      jd_source_file: jdSourceFile,
      candidate_profile: candidateProfile,
      jd_skills: jdSkills,
    })
  },
}
