import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { gsap } from 'gsap'
import { Home, Sparkles, User, BarChart3, Menu, X, Clock3, LogIn, LogOut } from 'lucide-react'
import './Header.css'

const PAGES = [
  { id: 'home',     label: 'Home',          Icon: Home },
  { id: 'wizard',   label: 'Match Wizard',  Icon: Sparkles },
  { id: 'profile',  label: 'Profile',        Icon: User },
  { id: 'analysis', label: 'Company & Match', Icon: BarChart3 },
  { id: 'history', label: 'Match History', Icon: Clock3 },
]

export default function Header({ currentPage, user, onLogout }) {
  const logoRef   = useRef(null)
  const navRef    = useRef(null)
  const titleRef  = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPage, setDrawerPage] = useState(currentPage)
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])
  const mobileMenuOpen = drawerOpen && drawerPage === currentPage

  // ── Preserved GSAP entrance animation ──────────────────────────────────
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(logoRef.current,
      { opacity: 0, y: -20, scale: 0.8 },
      { opacity: 1,  y: 0,  scale: 1,  duration: 0.7 }
    )
    .fromTo(titleRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0,  duration: 0.6 },
      '-=0.4'
    )
    .fromTo(navRef.current.children,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 },
      '-=0.4'
    )
    return () => { tl.kill() }
  }, [])

  const paths = { home: '/', wizard: '/match', profile: '/profile', analysis: '/analysis', history: '/history' }

  return (
    <>
      <header className="header">
        {/* Brand */}
        <Link className="header-brand" to="/" aria-label="Go to home" onClick={() => setDrawerOpen(false)}>
          <div className="header-logo" ref={logoRef}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect width="36" height="36" rx="10" fill="url(#radixGrad)" stroke="rgba(94,94,94,0.4)" strokeWidth="1" />
              <path d="M11 26 L18 12 L25 26" stroke="#EDEDED" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="18" cy="10" r="2.4" fill="#5e5e5e"/>
              <defs>
                <linearGradient id="radixGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#1a1a1c"/>
                  <stop offset="1" stopColor="#5e5e5e"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="header-title" ref={titleRef}>
            RADIX <span>Talent Match</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="header-nav" ref={navRef} aria-label="Main navigation">
          {user && PAGES.map(({ id, label, Icon }) => (
            <Link
              key={id}
              to={paths[id]}
              className={`nav-link${currentPage === id ? ' active' : ''}`}
              onClick={() => setDrawerOpen(false)}
              aria-current={currentPage === id ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={2} />
              </span>
              {label}
            </Link>
          ))}
          {user ? <button className="nav-link" onClick={onLogout}><LogOut size={16} aria-hidden="true" /> Log out</button> : <Link className={`nav-link${currentPage === 'login' ? ' active' : ''}`} to="/login" aria-current={currentPage === 'login' ? 'page' : undefined}><LogIn size={16} aria-hidden="true" /> Log in</Link>}
        </nav>

        {/* Hamburger for mobile */}
        <button
          className="nav-hamburger"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => { setDrawerPage(currentPage); setDrawerOpen((v) => !v) }}
        >
          {mobileMenuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
        </button>
      </header>

      {/* Mobile drawer */}
      <nav id="mobile-navigation" className={`mobile-drawer${mobileMenuOpen ? ' open' : ''}`} aria-label="Mobile navigation" aria-hidden={!mobileMenuOpen}>
        {user && PAGES.map(({ id, label, Icon }) => (
          <Link
            key={id}
            to={paths[id]}
            className={`nav-link${currentPage === id ? ' active' : ''}`}
            onClick={() => setDrawerOpen(false)}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={2} />
            </span>
            {label}
          </Link>
        ))}
        {user ? <button className="nav-link" onClick={onLogout}><LogOut size={18} aria-hidden="true" /> Log out</button> : <Link className={`nav-link${currentPage === 'login' ? ' active' : ''}`} to="/login" onClick={() => setDrawerOpen(false)} aria-current={currentPage === 'login' ? 'page' : undefined}><LogIn size={18} aria-hidden="true" /> Log in</Link>}
      </nav>
    </>
  )
}
