import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './Header.css'

export default function Header() {
  const logoRef = useRef(null)
  const navRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(logoRef.current,
      { opacity: 0, y: -20, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7 }
    )
    .fromTo(titleRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.4'
    )
    .fromTo(navRef.current.children,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 },
      '-=0.4'
    )
  }, [])

  return (
    <header className="header neo-card">
      <div className="header-brand">
        <div className="header-logo" ref={logoRef}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#logoGrad)" />
            <path d="M10 20 L16 12 L22 20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="16" cy="22" r="1.8" fill="#fff" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6c63ff" />
                <stop offset="1" stopColor="#9b8fff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="header-title" ref={titleRef}>ResumeAI</span>
      </div>
      <nav className="header-nav" ref={navRef}>
        <a href="#upload" className="nav-link">Upload</a>
        <a href="#profile" className="nav-link">Profile</a>
        <a href="#skills" className="nav-link">Skills</a>
        <a href="#talent-check" className="nav-link">Talent Check</a>
      </nav>
    </header>
  )
}
