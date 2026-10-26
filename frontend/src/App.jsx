import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import ProfilePage from './components/ProfilePage'
import ResumePage from './components/ResumePage'
import AnalysisPage from './components/AnalysisPage'
import Chatbot from './components/Chatbot'
import './App.css'
import './index.css'

/**
 * Root application component for RADIX Talent Match.
 *
 * Routing: lightweight hash-based navigation.
 *   #home | #profile | #resume | #analysis
 *
 * Theme:
 *   Primary:   #131314 (Obsidian Dark)
 *   Secondary: #5e5e5e (Slate Gray)
 *
 * Background:
 *   Professional, simple, elegant GSAP-animated dual-orb ambient mesh.
 */

const VALID_PAGES = ['home', 'profile', 'resume', 'analysis']

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '')
  return VALID_PAGES.includes(hash) ? hash : 'home'
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)

  // ── Shared profile state (used by Profile page AND Resume page) ─────────
  const [profile, setProfile]                 = useState(null)
  const [isProfileLoading, setProfileLoading] = useState(false)

  // ── Resume-only profile state (separate so pages don't collide) ─────────
  const [resumeProfile, setResumeProfile]     = useState(null)
  const [isResumeLoading, setResumeLoading]   = useState(false)

  // ── JD extraction data ──────────────────────────────────────────────────
  const [jdData, setJdData]                   = useState(null)

  // ── Animation refs ──────────────────────────────────────────────────────
  const pageRef           = useRef(null)
  const interactiveOrbRef = useRef(null)
  const ambientOrbRef     = useRef(null)

  // ── Professional, simple, elegant GSAP animated background ───────────────
  useEffect(() => {
    const orb = interactiveOrbRef.current
    const ambient = ambientOrbRef.current
    if (!orb || !ambient) return

    // Fluid mouse-responsive ambient light
    const onMove = (e) => {
      gsap.to(orb, {
        x: e.clientX - 260,
        y: e.clientY - 260,
        duration: 1.4,
        ease: 'power2.out',
      })
    }
    window.addEventListener('mousemove', onMove)

    // Gentle, breathing ambient drift
    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    tl.fromTo(
      ambient,
      { x: -50, y: -40, scale: 0.9, opacity: 0.12 },
      { x: 80, y: 60, scale: 1.25, opacity: 0.22, duration: 9, ease: 'sine.inOut' }
    )

    return () => {
      window.removeEventListener('mousemove', onMove)
      tl.kill()
    }
  }, [])

  // ── Hash-based routing ──────────────────────────────────────────────────
  useEffect(() => {
    const onHashChange = () => {
      const page = getPageFromHash()
      setCurrentPage(page)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // ── Page transition animation ───────────────────────────────────────────
  useEffect(() => {
    if (!pageRef.current) return
    gsap.fromTo(
      pageRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
    )
  }, [currentPage])

  const navigate = (page) => {
    if (!VALID_PAGES.includes(page)) return
    window.location.hash = page
    setCurrentPage(page)
  }

  return (
    <>
      {/* ── Professional, simple, elegant GSAP animated background ─────── */}
      <div className="bg-canvas" aria-hidden="true">
        <div className="bg-grid-overlay" />
        <div className="bg-orb bg-orb-interactive" ref={interactiveOrbRef} />
        <div className="bg-orb bg-orb-ambient" ref={ambientOrbRef} />
        <div className="bg-vignette" />
      </div>

      <div className="app-shell">
        {/* Persistent navigation */}
        <Header currentPage={currentPage} onNavigate={navigate} />

        {/* Page content */}
        <main className="page-content" id="main-content">
          <div className="page-inner page-transition" ref={pageRef}>
            {currentPage === 'home' && (
              <LandingPage onNavigate={navigate} />
            )}

            {currentPage === 'profile' && (
              <ProfilePage
                profile={profile}
                isLoading={isProfileLoading}
                setIsLoading={setProfileLoading}
                onProfileReceived={setProfile}
                onClear={() => setProfile(null)}
                onNavigate={navigate}
              />
            )}

            {currentPage === 'resume' && (
              <ResumePage
                resumeProfile={resumeProfile}
                isResumeLoading={isResumeLoading}
                setResumeLoading={setResumeLoading}
                onResumeProfile={setResumeProfile}
                jdData={jdData}
                onJdData={setJdData}
                onNavigate={navigate}
              />
            )}

            {currentPage === 'analysis' && (
              <AnalysisPage
                profile={profile || resumeProfile}
                jdData={jdData}
                onNavigate={navigate}
              />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          <span>RADIX Talent Match<span className="accent-dot">.</span></span>
          {' '}· Intelligent talent intelligence platform
        </footer>
      </div>

      {/* Floating chatbot — persistent across all pages */}
      <Chatbot />
    </>
  )
}
