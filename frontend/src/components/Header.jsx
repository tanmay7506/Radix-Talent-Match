import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Home, Sparkles, User, FileText, BarChart3, Menu, X } from 'lucide-react'
import './Header.css'

const PAGES = [
  { id: 'home',     label: 'Home',          Icon: Home },
  { id: 'wizard',   label: 'Match Wizard',  Icon: Sparkles },
  { id: 'profile',  label: 'Profile',        Icon: User },
  { id: 'resume',   label: 'Resume & JD',    Icon: FileText },
  { id: 'analysis', label: 'Company & Match', Icon: BarChart3 },
]

export default function Header({ currentPage, onNavigate }) {
  const logoRef   = useRef(null)
  const navRef    = useRef(null)
  const titleRef  = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  const handleNav = (id) => {
    setDrawerOpen(false)
    onNavigate(id)
  }

  return (
    <>
      <header className="header">
        {/* Brand */}
        <div className="header-brand" onClick={() => handleNav('home')} role="button" tabIndex={0}
             onKeyDown={(e) => e.key === 'Enter' && handleNav('home')} aria-label="Go to home">
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
        </div>

        {/* Desktop nav */}
        <nav className="header-nav" ref={navRef} aria-label="Main navigation">
          {PAGES.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-link${currentPage === id ? ' active' : ''}`}
              onClick={() => handleNav(id)}
              aria-current={currentPage === id ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={2} />
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Hamburger for mobile */}
        <button
          className="nav-hamburger"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
        >
          {drawerOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-drawer${drawerOpen ? ' open' : ''}`} role="navigation" aria-label="Mobile navigation">
        {PAGES.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-link${currentPage === id ? ' active' : ''}`}
            onClick={() => handleNav(id)}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={2} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
