import { useRef } from 'react'
import { ClipboardList, ArrowRight, RotateCcw } from 'lucide-react'
import UploadZone from './UploadZone'
import ProfileCard from './ProfileCard'
import SkillsGrid from './SkillsGrid'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Callout,
  EmptyState,
  LoadingOverlay,
  Button,
} from './ui'
import './ProfilePage.css'

/**
 * Profile page — candidate resume upload and structured profile inspection.
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
    <div className="profile-page">
      <PageHeader
        title="Candidate Profile"
        description="Upload your resume to build a structured profile with AI-extracted competencies, experience, and educational background."
      />

      <div className="profile-layout" ref={resultRef}>
        {!profile && !isLoading && (
          <EmptyState
            icon={<ClipboardList size={28} strokeWidth={1.8} />}
            title="No profile built yet"
            description="Upload a resume on the left to generate your structured candidate profile and competency assessment."
          />
        )}

        {isLoading && (
          <LoadingOverlay message="Extracting skills, experience, and competencies from resume…" />
        )}

        {profile && !isLoading && (
          <div className="profile-results">
            <Callout type="success" title="Profile Built Successfully">
              Candidate signals and competency levels extracted from your resume.
            </Callout>

            {/* Existing ProfileCard — GSAP animations intact */}
            <ProfileCard profile={profile} />

            {/* Existing SkillsGrid — GSAP animations intact */}
            <SkillsGrid skills={profile.skills} />

            {/* Navigation CTAs */}
            <Card className="navigate-card" padding="md">
              <div className="navigate-content">
                <p className="navigate-prompt">Your profile is ready. Compare it against job requirements:</p>
                <div className="navigate-actions">
                  <Button
                    id="profile-to-resume-btn"
                    variant="primary"
                    onClick={() => onNavigate('resume')}
                    iconRight={<ArrowRight size={15} />}
                  >
                    Parse a Job Description
                  </Button>
                  <Button
                    id="profile-to-analysis-btn"
                    variant="secondary"
                    onClick={() => onNavigate('analysis')}
                  >
                    View Skill Match
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
