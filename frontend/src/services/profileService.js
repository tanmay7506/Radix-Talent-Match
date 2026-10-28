import { api } from './api'
import { notifySessionExpired } from './sessionEvents'

// Provisional contract until profile persistence endpoints are defined.
const devProfiles = new Map()
let activeProfileId = 'current'
const mockEnabled = () => import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV

export const profileService = {
  /** @returns {Promise<import('./contracts').CandidateProfile|null>} */
  async getProfile({ signal } = {}) {
    if (mockEnabled()) {
      return devProfiles.get(activeProfileId) || null
    }
    const response = await fetch(`${api.baseUrl}/profiles/me`, { signal, credentials: 'include' })
    notifySessionExpired(response)
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Unable to load profile (${response.status}).`)
    return response.json()
  },
  /** @param {import('./contracts').CandidateProfile} profile */
  async saveProfile(profile, { signal } = {}) {
    if (mockEnabled()) {
      const saved = { ...profile, updated_at: new Date().toISOString() }
      devProfiles.set(activeProfileId, saved)
      return saved
    }
    const response = await fetch(`${api.baseUrl}/profiles/me`, {
      method: 'PUT', credentials: 'include', signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
    })
    notifySessionExpired(response)
    if (!response.ok) throw new Error(`Unable to save profile (${response.status}).`)
    return response.json()
  },
  extractFromResume(file, options) { return api.buildProfileFromResume(file, options) },
}
