import { api } from './api'
import { notifySessionExpired } from './sessionEvents'
import { getAccessToken } from './authSession'

const authHeaders = (headers = {}) => getAccessToken() ? { ...headers, Authorization: `Bearer ${getAccessToken()}` } : headers

// Provisional result schema: id, created_at, job_title/company/score are optional.
const devResults = []
const mockEnabled = () => import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV

export const resultsService = {
  /** @returns {Promise<import('./contracts').SavedMatchResult[]>} */
  async listResults({ signal } = {}) {
    if (mockEnabled()) return [...devResults]
    const response = await fetch(`${api.baseUrl}/match-results`, { signal, credentials: 'include', headers: authHeaders() })
    notifySessionExpired(response)
    if (!response.ok) throw new Error(`Unable to load match history (${response.status}).`)
    return response.json()
  },
  /** @param {string} id @returns {Promise<import('./contracts').SavedMatchResult|null>} */
  async getResultById(id, { signal } = {}) {
    if (mockEnabled()) return devResults.find((result) => result.id === id) || null
    const response = await fetch(`${api.baseUrl}/match-results/${encodeURIComponent(id)}`, { signal, credentials: 'include', headers: authHeaders() })
    notifySessionExpired(response)
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Unable to load result (${response.status}).`)
    return response.json()
  },
  /** @param {Omit<import('./contracts').SavedMatchResult,'id'|'created_at'>} result */
  async saveResult(result) {
    if (mockEnabled()) {
      const saved = { ...result, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      devResults.unshift(saved)
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('radix:match-saved', { detail: saved }))
      return saved
    }
    const response = await fetch(`${api.baseUrl}/match-results`, {
      method: 'POST', credentials: 'include', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(result),
    })
    notifySessionExpired(response)
    if (!response.ok) throw new Error(`Unable to save result (${response.status}).`)
    const saved = await response.json()
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('radix:match-saved', { detail: saved }))
    return saved
  },
}
