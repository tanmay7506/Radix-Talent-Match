import { api } from './api'
import { setAccessToken } from './authSession'

let session = null
let refreshTimer = null

function clearRefreshTimer() {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = null
}

function keepSession(nextSession) {
  session = nextSession
  setAccessToken(nextSession?.access_token)
  clearRefreshTimer()
  if (!nextSession) return
  const delay = Math.max(1000, new Date(nextSession.expires_at).getTime() - Date.now() - 60_000)
  refreshTimer = setTimeout(async () => {
    try { keepSession(await request('refresh')) }
    catch {
      session = null
      setAccessToken(null)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('radix:session-expired'))
    }
  }, delay)
}

async function request(path, body) {
  const response = await fetch(`${api.baseUrl}/auth/${path}`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || `Request failed (${response.status}).`)
  }
  if (response.status === 204) return null
  return response.json()
}

export const authService = {
  async login({ email, password }) {
    keepSession(await request('login', { email, password }))
    return session
  },
  async signup({ name, email, password }) {
    keepSession(await request('register', { name, email, password }))
    return session
  },
  async logout() {
    try { await request('logout') } finally { keepSession(null) }
  },
  clearSession() { keepSession(null) },
  async getSession() {
    try {
      keepSession(await request('session'))
      return session
    } catch (error) {
      keepSession(null)
      if (/401|Refresh token/i.test(error.message)) return null
      throw error
    }
  },
  async getCurrentUser() {
    return session?.user || null
  },
}
