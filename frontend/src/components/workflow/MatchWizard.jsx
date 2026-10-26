import { useState } from 'react'
import { api } from '../../services/api'
import { PageHeader } from '../ui/PageHeader'
import { WizardStepper } from './WizardStepper'
import { Step1Resume } from './Step1Resume'
import { Step2ProfileReview } from './Step2ProfileReview'
import { Step3JobDescription } from './Step3JobDescription'
import { Step4JdReview } from './Step4JdReview'
import { Step5SkillMatching } from './Step5SkillMatching'
import { Step6Results } from './Step6Results'
import './MatchWizard.css'

export function MatchWizard({
  initialProfile = null,
  initialJdData = null,
  onProfileSynced,
  onJdSynced,
  onNavigate,
}) {
  const [currentStep, setCurrentStep] = useState(() => (initialProfile ? 2 : 1))
  const [maxStepReached, setMaxStepReached] = useState(() => (initialProfile ? 2 : 1))

  // ── Step 1 State: Resume ────────────────────────────────────────────────
  const [resumeFile, setResumeFile] = useState(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeError, setResumeError] = useState(null)

  // ── Step 2 State: Profile ───────────────────────────────────────────────
  const [originalProfile, setOriginalProfile] = useState(initialProfile)
  const [editedProfile, setEditedProfile] = useState(initialProfile)
  const [isProfileEdited, setIsProfileEdited] = useState(false)

  // ── Step 3 State: Job Description ───────────────────────────────────────
  const [jdInputMode, setJdInputMode] = useState('text') // 'text' | 'file'
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState(null)
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false)
  const [jdError, setJdError] = useState(null)

  // ── Step 4 State: JD Extraction ─────────────────────────────────────────
  const [jdData, setJdData] = useState(initialJdData)

  // ── Step 5 & 6 State: Skill Matching & Results ──────────────────────────
  const [matchResult, setMatchResult] = useState(null)
  const [isMatching, setIsMatching] = useState(false)
  const [matchingError, setMatchingError] = useState(null)

  // ── Navigation between steps ────────────────────────────────────────────
  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Step 1: Resume Upload Submission ────────────────────────────────────
  const handleResumeSubmit = async (file) => {
    if (!file || isUploadingResume) return
    setResumeError(null)
    setIsUploadingResume(true)

    try {
      const data = await api.buildProfileFromResume(file)
      // Save original immutable profile + editable draft
      setOriginalProfile(JSON.parse(JSON.stringify(data)))
      setEditedProfile(JSON.parse(JSON.stringify(data)))
      setIsProfileEdited(false)
      setResumeFile(file)

      // Invalidate downstream match results because candidate input changed
      setMatchResult(null)

      if (onProfileSynced) onProfileSynced(data)

      setMaxStepReached((prev) => Math.max(prev, 2))
      goToStep(2)
    } catch (err) {
      setResumeError(err.message || 'Failed to extract candidate profile.')
    } finally {
      setIsUploadingResume(false)
    }
  }

  // When a user selects a new file in Step 1, invalidate downstream profile
  const handleResumeFileChange = (newFile) => {
    setResumeFile(newFile)
    if (!newFile) {
      setOriginalProfile(null)
      setEditedProfile(null)
      setIsProfileEdited(false)
      setMatchResult(null)
      setMaxStepReached(1)
    }
  }

  // ── Step 2: Profile Review Edits ────────────────────────────────────────
  const handleProfileChange = (updatedProfile) => {
    setEditedProfile(updatedProfile)
    setIsProfileEdited(true)
    // Invalidate downstream match since profile requirements changed
    setMatchResult(null)
    if (onProfileSynced) onProfileSynced(updatedProfile)
  }

  const handleResetOriginalProfile = () => {
    if (originalProfile) {
      setEditedProfile(JSON.parse(JSON.stringify(originalProfile)))
      setIsProfileEdited(false)
      setMatchResult(null)
      if (onProfileSynced) onProfileSynced(originalProfile)
    }
  }

  // ── Step 3: Job Description Input ───────────────────────────────────────
  const handleJdInputChange = ({ mode, text, file }) => {
    setJdInputMode(mode)
    setJdText(text)
    setJdFile(file)
    // Invalidate downstream analysis and match when input changes
    setJdData(null)
    setMatchResult(null)
  }

  const handleJdSubmit = async ({ mode, text, file }) => {
    if (isAnalyzingJd) return
    setJdError(null)
    setIsAnalyzingJd(true)

    try {
      let data = null
      if (mode === 'text') {
        data = await api.extractJdSkillsFromText(text)
      } else {
        data = await api.extractJdSkills(file)
      }

      setJdData(data)
      setMatchResult(null) // Invalidate match since JD changed
      if (onJdSynced) onJdSynced(data)

      setMaxStepReached((prev) => Math.max(prev, 4))
      goToStep(4)
    } catch (err) {
      setJdError(err.message || 'Failed to parse job description.')
      // Stay on step 3 to show error and allow quick correction
    } finally {
      setIsAnalyzingJd(false)
    }
  }

  // ── Step 5: Execute Skill Matching ──────────────────────────────────────
  const handleRunSkillMatch = async () => {
    const candidateProfile = editedProfile || originalProfile
    if (!candidateProfile || !jdData || isMatching) return

    setMatchingError(null)
    setIsMatching(true)

    try {
      const result = await api.analyzeSkillMatch({
        candidateProfile,
        jdSkills: jdData,
        jdSourceFile: jdFile ? jdFile.name : 'Pasted Job Description',
      })

      setMatchResult(result)
      setMaxStepReached((prev) => Math.max(prev, 6))
      // Automatic smooth progression to results view
      goToStep(6)
    } catch (err) {
      setMatchingError(err.message || 'Failed to calculate role alignment.')
    } finally {
      setIsMatching(false)
    }
  }

  // ── Step 6: Start New Analysis ──────────────────────────────────────────
  const handleStartNewAnalysis = () => {
    setResumeFile(null)
    setOriginalProfile(null)
    setEditedProfile(null)
    setIsProfileEdited(false)
    setJdText('')
    setJdFile(null)
    setJdData(null)
    setMatchResult(null)
    setResumeError(null)
    setJdError(null)
    setMatchingError(null)
    setMaxStepReached(1)
    goToStep(1)
  }

  return (
    <div className="match-wizard-container">
      <PageHeader
        title="Candidate &amp; Role Matching Wizard"
        description="A guided multi-step talent intelligence workflow: upload candidate credentials, review structured profile signals, analyze role demands, and evaluate objective competency alignment."
      />

      <WizardStepper
        currentStep={currentStep}
        maxStepReached={maxStepReached}
        onStepClick={goToStep}
        isProcessing={isUploadingResume || isAnalyzingJd || isMatching}
      />

      <div className="wizard-step-stage">
        {currentStep === 1 && (
          <Step1Resume
            selectedFile={resumeFile}
            onFileChange={handleResumeFileChange}
            onSubmit={handleResumeSubmit}
            isProcessing={isUploadingResume}
            error={resumeError}
            onClearError={() => setResumeError(null)}
          />
        )}

        {currentStep === 2 && editedProfile && (
          <Step2ProfileReview
            originalProfile={originalProfile}
            profile={editedProfile}
            onProfileChange={handleProfileChange}
            onResetOriginal={handleResetOriginalProfile}
            onBack={() => goToStep(1)}
            onNext={() => {
              setMaxStepReached((prev) => Math.max(prev, 3))
              goToStep(3)
            }}
            isEdited={isProfileEdited}
          />
        )}

        {currentStep === 3 && (
          <Step3JobDescription
            inputMode={jdInputMode}
            jdText={jdText}
            jdFile={jdFile}
            onInputChange={handleJdInputChange}
            onSubmit={handleJdSubmit}
            onBack={() => goToStep(2)}
            isProcessing={isAnalyzingJd}
            error={jdError}
          />
        )}

        {currentStep === 4 && (
          <Step4JdReview
            jdData={jdData}
            onRetry={() => handleJdSubmit({ mode: jdInputMode, text: jdText, file: jdFile })}
            onBack={() => goToStep(3)}
            onNext={() => {
              setMaxStepReached((prev) => Math.max(prev, 5))
              goToStep(5)
            }}
            isProcessing={isAnalyzingJd}
            error={jdError}
          />
        )}

        {currentStep === 5 && (
          <Step5SkillMatching
            profile={editedProfile || originalProfile}
            jdData={jdData}
            matchResult={matchResult}
            onRunMatch={handleRunSkillMatch}
            onBack={() => goToStep(4)}
            onNext={() => goToStep(6)}
            isMatching={isMatching}
            error={matchingError}
          />
        )}

        {currentStep === 6 && matchResult && (
          <Step6Results
            matchResult={matchResult}
            profile={editedProfile || originalProfile}
            onStartNew={handleStartNewAnalysis}
            onEditProfile={() => goToStep(2)}
            onChangeJd={() => goToStep(3)}
          />
        )}
      </div>
    </div>
  )
}
