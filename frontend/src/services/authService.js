// Provisional backend contract. The development provider is intentionally
// in-memory and is not authentication suitable for production.
import { api } from './api'
let session = null
const mockEnabled = () => import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true'

async function request(path, body) {
  const response = await fetch(`${api.baseUrl}/auth/${path}`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || `Request failed (${response.status}).`)
  return response.json()
}

export const authService = {
  /** @param {import('./contracts').LoginRequest} credentials */
  async login({ email, password }) {
    if (mockEnabled()) {
      session = { user: { id: 'dev-user', name: email.split('@')[0], email }, expiresAt: null }
      return session
    }
    session = await request('login', { email, password })
    return session
  },
  /** @param {import('./contracts').SignupRequest} account */
  async signup({ name, email, password }) {
    if (mockEnabled()) {
      session = { user: { id: 'dev-user', name, email }, expiresAt: null }
      return session
    }
    session = await request('signup', { name, email, password })
    return session
  },
  async logout() {
    try {
      if (!mockEnabled()) await fetch(`${api.baseUrl}/auth/logout`, { method: 'POST', credentials: 'include' })
    } finally { session = null }
  },
  clearSession() { session = null },
  async getSession() {
    if (mockEnabled()) return session
    const response = await fetch(`${api.baseUrl}/auth/session`, { credentials: 'include' })
    if (response.status === 401) { session = null; return null }
    if (!response.ok) throw new Error(`Unable to check session (${response.status}).`)
    session = await response.json()
    return session
  },
  async getCurrentUser() {
    try { return (await this.getSession())?.user || null }
    catch { return null }
  },
}
