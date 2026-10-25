import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import ProfileCard from './components/ProfileCard'
import SkillsGrid from './components/SkillsGrid'
import './App.css'
import './index.css'

export default function App() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const resultRef = useRef(null)

  const handleProfileReceived = (data) => {
    setProfile(data)
    if (data && resultRef.current) {
      // Smooth scroll to results after state update
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  // Ambient background glow that follows mouse
  useEffect(() => {
    const glow = document.querySelector('.ambient-glow')
    if (!glow) return
    const onMove = (e) => {
      gsap.to(glow, {
        x: e.clientX - 200,
        y: e.clientY - 200,
        duration: 1.2,
        ease: 'power2.out',
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      {/* Ambient blob */}
      <div className="ambient-glow" aria-hidden="true" />

      <div className="app-shell">
        <Header />

        <main className="main-content">
          <div className="hero-text">
            <h1 className="hero-title">
              AI-Powered<br />
              <span className="gradient-text">Resume Profiler</span>
            </h1>
            <p className="hero-sub">
              Upload your resume and let our AI extract your skills, education,
              and career preferences in seconds.
            </p>
          </div>

          <UploadZone
            onProfileReceived={handleProfileReceived}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {profile && (
            <div ref={resultRef} className="results-section">
              <div className="results-divider">
                <span className="divider-label">Your Profile</span>
              </div>
              <ProfileCard profile={profile} />
              <SkillsGrid skills={profile.skills} />
            </div>
          )}
        </main>

        <footer className="footer">
          <p>Built with <span className="accent-dot">♥</span> using FastAPI + Gemini AI</p>
        </footer>
      </div>
    </>
  )
}
