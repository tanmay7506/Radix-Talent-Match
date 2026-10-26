import { useRef } from 'react'
import { Info, ClipboardList, CheckCircle2 } from 'lucide-react'
import UploadZone from './UploadZone'
import ProfileCard from './ProfileCard'
import SkillsGrid from './SkillsGrid'
import './ProfilePage.css'

/**
 * Profile page — integrates the existing UploadZone, ProfileCard, and SkillsGrid.
 * All backend calls and GSAP animations in those components are fully preserved.
 *
 * Props:
 *   profile       – current profile state (null if not yet built)
 *   isLoading     – loading flag
 *   setIsLoading  – setter
 *   onProfileReceived – callback when API returns
 *   onClear       – callback to clear the profile
 *   onNavigate    – navigate to another page
 */
export default function ProfilePage({
  profile,
  isLoading,
  setIsLoading,
  onProfileReceived,
  onClear,
  onNavigate,
}) {
  const resultRef = useRef(null)

  const handleProfileReceived = (data) => {
    onProfileReceived(data)
    if (data && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
  }

  return (
    <div>
      <div className="profile-page-header">
        <h1>Candidate Profile</h1>
        <p>Upload your resume to build a structured profile with AI-extracted skills and experience.</p>
      </div>

      <div className="profile-layout">
        {/* ── Left: upload panel ─────────────────────────────────── */}
        <div className="upload-panel">
          <div className="panel-card">
            <h2>Upload Resume</h2>
            <p>Supported formats: PDF and DOCX. The AI will extract your skills, education, internships, certifications, and preferred roles.</p>

            {/* Existing UploadZone — GSAP animations intact */}
            <UploadZone
              onProfileReceived={handleProfileReceived}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {profile && (
              <div className="upload-actions" style={{ marginTop: '16px' }}>
                <button
                  id="clear-profile-btn"
                  className="clear-btn"
                  onClick={onClear}
                  aria-label="Clear current profile"
                >
                  Clear &amp; Start Over
                </button>
              </div>
            )}
          </div>

          <div className="info-callout">
            <span className="info-callout-icon" aria-hidden="true">
              <Info size={16} strokeWidth={2} />
            </span>
            <span>
              The extracted profile reflects only what is present in your resume.
              Missing fields mean the information was not found in the document — not that you lack the skill.
            </span>
          </div>
        </div>

        {/* ── Right: result panel ────────────────────────────────── */}
        <div className="result-panel" ref={resultRef}>
          {!profile && !isLoading && (
            <div className="neo-card empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <ClipboardList size={36} strokeWidth={1.8} />
              </span>
              <h3>No profile yet</h3>
              <p>Upload a resume on the left to generate your structured candidate profile.</p>
            </div>
          )}

          {isLoading && (
            <div className="neo-card loading-overlay">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="spinner" aria-hidden="true">
                <circle cx="22" cy="22" r="18" stroke="var(--border)" strokeWidth="4"/>
                <path d="M22 4 A18 18 0 0 1 40 22" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <span>Analysing your resume…</span>
            </div>
          )}

          {profile && !isLoading && (
            <>
              <div className="profile-complete-banner" role="status" aria-live="polite">
                <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <CheckCircle2 size={16} strokeWidth={2} />
                </span>
                <span>Profile built successfully from your resume</span>
              </div>

              {/* Existing ProfileCard — GSAP animations intact */}
              <ProfileCard profile={profile} />

              {/* Existing SkillsGrid — GSAP animations intact */}
              <SkillsGrid skills={profile.skills} />

              {/* Navigate CTA */}
              <div className="navigate-cta">
                <p>Your profile is ready. What would you like to do next?</p>
                <button
                  id="profile-to-resume-btn"
                  className="neo-btn neo-btn-accent"
                  onClick={() => onNavigate('resume')}
                >
                  Parse a Job Description →
                </button>
                <button
                  id="profile-to-analysis-btn"
                  className="neo-btn neo-btn-ghost"
                  onClick={() => onNavigate('analysis')}
                >
                  View Skill Match
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
