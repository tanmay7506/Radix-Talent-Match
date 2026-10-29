import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  redirect,
  RouterProvider,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { gsap } from 'gsap'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import ProfilePage from './components/ProfilePage'
import AnalysisPage from './components/AnalysisPage'
import AnalysisJobDetailsPage from './components/AnalysisJobDetailsPage'
import { MatchWizard } from './components/workflow/MatchWizard'
import { CompanyMatchesPage } from './components/workflow/CompanyMatchesPage'
import { LoginPage, SignupPage } from './components/AuthPages'
import { MatchHistoryPage, SavedResultPage } from './components/HistoryPages'
import Chatbot from './components/Chatbot'
import { authService } from './services/authService'
import { profileService } from './services/profileService'
import { AppStateContext, useApp } from './state/AppState'
import './App.css'

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, setProfile, jdData, setJdData, session, setSession, loadProfile } = useApp()
  const pageRef = useRef(null)
  const interactiveOrbRef = useRef(null)
  const ambientOrbRef = useRef(null)
  const pathname = location.pathname
  const userId = session?.user?.id

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' })
    }
  }, [pathname])

  useEffect(() => {
    const orb = interactiveOrbRef.current
    const ambient = ambientOrbRef.current
    if (!orb || !ambient || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onMove = (event) => gsap.to(orb, { x: event.clientX - 260, y: event.clientY - 260, duration: 1.4, ease: 'power2.out' })
    window.addEventListener('mousemove', onMove)
    const timeline = gsap.timeline({ repeat: -1, yoyo: true }).fromTo(
      ambient,
      { x: -50, y: -40, scale: 0.9, opacity: 0.12 },
      { x: 80, y: 60, scale: 1.25, opacity: 0.22, duration: 9, ease: 'sine.inOut' },
    )
    return () => { window.removeEventListener('mousemove', onMove); timeline.kill() }
  }, [])

  useEffect(() => {
    if (!userId || profile) return undefined
    const controller = new AbortController()
    loadProfile(controller.signal, session.user)
    return () => controller.abort()
  }, [userId, profile, loadProfile, session?.user])

  const currentPage = pathname === '/' ? 'home'
    : pathname === '/login' ? 'login'
    : pathname.startsWith('/profile') ? 'profile'
      : pathname === '/analysis' ? 'analysis'
        : pathname.startsWith('/history') ? 'history'
          : pathname === '/match' ? 'wizard' : null
  const go = (target) => {
    const paths = { home: '/', wizard: '/match', profile: '/profile', analysis: '/analysis', history: '/history' }
    navigate({ to: paths[target] || target })
  }
  const logout = async () => {
    try { await authService.logout() } catch { /* Local route state still needs to clear. */ }
    setSession(null)
    setProfile(null)
    go('/')
  }

  return <>
    <div className="bg-canvas" aria-hidden="true">
      <div className="bg-grid-overlay" />
      <div className="bg-orb bg-orb-interactive" ref={interactiveOrbRef} />
      <div className="bg-orb bg-orb-ambient" ref={ambientOrbRef} />
      <div className="bg-vignette" />
    </div>
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header currentPage={currentPage} user={session?.user} onLogout={logout} />
      <main className="page-content" id="main-content">
        <div className={`page-inner page-transition${pathname === '/login' ? ' login-page-inner' : ''}`} ref={pageRef}>
          {session?.user && (
            <div hidden={pathname !== '/match'} aria-hidden={pathname !== '/match'}>
              <MatchWizard
                initialProfile={profile}
                initialJdData={jdData}
                onProfileSynced={setProfile}
                onJdSynced={setJdData}
                onNavigate={(path) => navigate({ to: path })}
              />
            </div>
          )}
          <Outlet />
        </div>
      </main>
      <footer className="footer"><span>RADIX Talent Match<span className="accent-dot">.</span></span> · Intelligent talent intelligence platform</footer>
    </div>
    <Chatbot />
  </>
}

function HomeRoute() {
  const navigate = useNavigate()
  const paths = { wizard: '/match', profile: '/profile', analysis: '/analysis', history: '/history' }
  return <LandingPage onNavigate={(page) => navigate({ to: paths[page] || page })} />
}

function ProfileRoute() {
  const state = useApp()
  const navigate = useNavigate()
  return <ProfilePage
    key={state.profile ? state.profile.id || 'profile-ready' : 'profile-empty'}
    profile={state.profile}
    setProfile={state.setProfile}
    isLoading={state.profileLoading}
    loadError={state.profileError}
    notice={state.profileNotice}
    setNotice={state.setProfileNotice}
    onRetry={state.loadProfile}
    onNavigate={(path) => navigate({ to: path })}
  />
}

function MatchRoute() {
  return null
}

function AnalysisRoute() {
  const state = useApp()
  const navigate = useNavigate()
  const paths = { wizard: '/match', profile: '/profile' }
  return <AnalysisPage
    profile={state.profile}
    jdData={state.jdData}
    onNavigate={(path) => navigate({ to: paths[path] || path })}
  />
}

function AnalysisJobDetailsRoute() {
  const state = useApp()
  const navigate = useNavigate()
  return <AnalysisJobDetailsPage jdData={state.jdData} onJdData={state.setJdData} onNavigate={(path) => navigate({ to: path })} />
}

function CompanyMatchesRoute() {
  const state = useApp()
  const navigate = useNavigate()
  return <CompanyMatchesPage profile={state.profile} onNavigate={(path) => navigate({ to: path })} />
}

const rootRoute = createRootRouteWithContext()({
  component: Shell,
  beforeLoad: () => {
    const legacyPath = {
      home: '/', wizard: '/match', profile: '/profile', resume: '/analysis', analysis: '/analysis',
    }[window.location.hash.slice(1)]
    if (legacyPath) throw redirect({ to: legacyPath, replace: true })
  },
  notFoundComponent: () => <section><h1>Page not found</h1><Link to="/">Return home</Link></section>,
  errorComponent: ({ error, reset }) => <section role="alert"><h1>Something went wrong</h1><p>{error.message || 'The page could not load.'}</p><button type="button" onClick={reset}>Try again</button></section>,
})
const requireUser = {
  beforeLoad: async ({ location }) => {
    if (!(await authService.getCurrentUser())) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
}
const route = (path, component, options = {}) => createRoute({ getParentRoute: () => rootRoute, path, component, ...options })
const routes = [
  route('/', HomeRoute),
  route('/login', LoginPage, { validateSearch: (search) => ({ redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') && !search.redirect.startsWith('//') ? search.redirect : undefined }) }),
  route('/signup', SignupPage),
  route('/profile', ProfileRoute, requireUser),
  route('/profile/setup', ProfileRoute, requireUser),
  route('/match', MatchRoute, requireUser),
  route('/company-matches', CompanyMatchesRoute, requireUser),
  route('/resume', () => null, { beforeLoad: () => { throw redirect({ to: '/analysis' }) } }),
  route('/analysis', AnalysisRoute, requireUser),
  route('/analysis/job-details', AnalysisJobDetailsRoute, requireUser),
  route('/history', MatchHistoryPage, requireUser),
  route('/history/$resultId', SavedResultPage, requireUser),
]
const router = createRouter({ routeTree: rootRoute.addChildren(routes), context: { getCurrentUser: () => authService.getCurrentUser() }, defaultPreload: 'intent' })

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfileState] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileNotice, setProfileNotice] = useState('')
  const [jdData, setJdData] = useState(null)

  const setProfile = useCallback((value) => { setProfileState(value); setProfileError('') }, [])
  const loadProfile = useCallback(async (signal, user = session?.user) => {
    setProfileLoading(true)
    setProfileError('')
    try {
      const savedProfile = await profileService.getProfile({ signal })
      setProfileState(savedProfile || (user ? {
        skills: [], education: {}, internships: [], hackathons: [], certifications: [], preferred_roles: [],
        ...user,
        source: 'manual',
      } : null))
    }
    catch (error) { if (error.name !== 'AbortError') setProfileError(error.message || 'Unable to load your profile.') }
    finally { setProfileLoading(false) }
  }, [session?.user])
  const appState = useMemo(() => ({
    session, setSession, profile, setProfile, jdData, setJdData, profileLoading,
    profileError, profileNotice, setProfileNotice, loadProfile,
  }), [session, profile, jdData, profileLoading, profileError, profileNotice, loadProfile, setProfile])

  useEffect(() => {
    authService.getSession().then(setSession).catch(() => setSession(null)).finally(() => setAuthReady(true))
  }, [])
  useEffect(() => {
    const expire = () => { authService.clearSession(); setSession(null); setProfileState(null); setProfileError('') }
    window.addEventListener('radix:session-expired', expire)
    return () => window.removeEventListener('radix:session-expired', expire)
  }, [])

  if (!authReady) return <div className="route-loading" role="status">Checking your session…</div>
  return <AppStateContext.Provider value={appState}><RouterProvider router={router} context={{ getCurrentUser: () => authService.getCurrentUser() }} /></AppStateContext.Provider>
}
