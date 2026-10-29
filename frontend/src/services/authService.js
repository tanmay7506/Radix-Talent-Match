import { api } from './api'
import { setAccessToken } from './authSession'

const SESSION_KEY = 'radix_session'
let session = null

function keepSession(nextSession) {
  session = nextSession
  setAccessToken(nextSession?.access_token)
  if (typeof window === 'undefined') return
  if (nextSession) window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
  else window.localStorage.removeItem(SESSION_KEY)
}

async function request(path, body) {
  const response = await fetch(`${api.baseUrl}/auth/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || `Request failed (${response.status}).`)
  }
  return response.json()
}

function restoreSession() {
  if (session || typeof window === 'undefined') return session
  try {
    const saved = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null')
    if (!saved?.access_token || new Date(saved.expires_at).getTime() <= Date.now()) return null
    session = saved
    setAccessToken(saved.access_token)
    return session
  } catch {
    window.localStorage.removeItem(SESSION_KEY)
    return null
  }
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
  async logout() { keepSession(null) },
  clearSession() { keepSession(null) },
  async getSession() { return restoreSession() },
  async getCurrentUser() { return restoreSession()?.user || null },
}
