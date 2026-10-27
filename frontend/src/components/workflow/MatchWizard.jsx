import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/api'
import { profileService } from '../../services/profileService'
import { resultsService } from '../../services/resultsService'
import { PageHeader } from '../ui/PageHeader'
import { WizardStepper } from './WizardStepper'
import { Step1Resume } from './Step1Resume'
import { Step2ProfileReview } from './Step2ProfileReview'
import { Step3JobDescription } from './Step3JobDescription'
import { Step4JdReview } from './Step4JdReview'
import { Step5SkillMatching } from './Step5SkillMatching'
import { Step6TalentCheck } from './Step6TalentCheck'
import { Step6Results } from './Step6Results'
import './MatchWizard.css'

export function MatchWizard({
  initialProfile = null,
  initialJdData = null,
  onProfileSynced,
  onJdSynced,
  onNavigate,
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)

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

  // ── Step 5–7 State: Skill Matching, Talent Check & Results ──────────────
  const [matchResult, setMatchResult] = useState(null)
  const [talentResult, setTalentResult] = useState(null)
  const [isMatching, setIsMatching] = useState(false)
  const [matchingError, setMatchingError] = useState(null)
  const [profilePersistenceWarning, setProfilePersistenceWarning] = useState('')
  const savedResultRef = useRef(null)
  const controllersRef = useRef({})
  useEffect(() => () => Object.values(controllersRef.current).forEach((controller) => controller.abort()), [])

  const handleUseSavedProfile = () => {
    if (!initialProfile) return
    const profile = JSON.parse(JSON.stringify(initialProfile))
    setOriginalProfile(profile); setEditedProfile(profile); setIsProfileEdited(false)
    setMatchResult(null); setTalentResult(null); setMaxStepReached((prev) => Math.max(prev, 2)); goToStep(2)
  }

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
    const controller = new AbortController()
    controllersRef.current.resume?.abort()
    controllersRef.current.resume = controller

    try {
      const data = await api.buildProfileFromResume(file, { signal: controller.signal })
      // Save original immutable profile + editable draft
      setOriginalProfile(JSON.parse(JSON.stringify(data)))
      setEditedProfile(JSON.parse(JSON.stringify(data)))
      setIsProfileEdited(false)
      setResumeFile(file)

      // Invalidate downstream match results because candidate input changed
      setMatchResult(null)
      setTalentResult(null)

      if (onProfileSynced) onProfileSynced(data)

      setMaxStepReached((prev) => Math.max(prev, 2))
      goToStep(2)
    } catch (err) {
      if (err.name !== 'AbortError') setResumeError(err.message || 'Failed to extract candidate profile.')
    } finally {
      if (!controller.signal.aborted) setIsUploadingResume(false)
      if (controllersRef.current.resume === controller) delete controllersRef.current.resume
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
      setTalentResult(null)
      setMaxStepReached(1)
    }
  }

  // ── Step 2: Profile Review Edits ────────────────────────────────────────
  const handleProfileChange = (updatedProfile) => {
    setEditedProfile(updatedProfile)
    setIsProfileEdited(true)
    // Invalidate downstream match since profile requirements changed
    setMatchResult(null)
    setTalentResult(null)
    if (onProfileSynced) onProfileSynced(updatedProfile)
  }

  const handleConfirmProfile = async (reviewedProfile = editedProfile) => {
    if (!reviewedProfile) return
    try {
      const saved = await profileService.saveProfile(reviewedProfile)
      setOriginalProfile(saved); setEditedProfile(saved)
      setProfilePersistenceWarning('')
      if (onProfileSynced) onProfileSynced(saved)
    } catch (err) {
      // Matching can continue with the explicitly reviewed in-memory draft.
      // Saving remains available from the Profile page after backend setup.
      setOriginalProfile(reviewedProfile); setEditedProfile(reviewedProfile)
      if (onProfileSynced) onProfileSynced(reviewedProfile)
      setProfilePersistenceWarning(`Your reviewed profile could not be saved. This match will use the reviewed draft. ${err.message}`)
    }
    setMaxStepReached((prev) => Math.max(prev, 3)); goToStep(3)
  }

  const handleResetOriginalProfile = () => {
    if (originalProfile) {
      setEditedProfile(JSON.parse(JSON.stringify(originalProfile)))
      setIsProfileEdited(false)
      setMatchResult(null)
      setTalentResult(null)
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
    setTalentResult(null)
  }

  const handleJdSubmit = async ({ mode, text, file }) => {
    if (isAnalyzingJd) return
    setJdError(null)
    setIsAnalyzingJd(true)
    const controller = new AbortController()
    controllersRef.current.jd?.abort()
    controllersRef.current.jd = controller

    try {
      let data = null
      if (mode === 'text') {
        data = await api.extractJdSkillsFromText(text, { signal: controller.signal })
      } else {
        data = await api.extractJdSkills(file, { signal: controller.signal })
      }

      setJdData(data)
      setMatchResult(null) // Invalidate match since JD changed
      setTalentResult(null)
      if (onJdSynced) onJdSynced(data)

      setMaxStepReached((prev) => Math.max(prev, 4))
      goToStep(4)
    } catch (err) {
      if (err.name !== 'AbortError') setJdError(err.message || 'Failed to parse job description.')
      // Stay on step 3 to show error and allow quick correction
    } finally {
      if (!controller.signal.aborted) setIsAnalyzingJd(false)
      if (controllersRef.current.jd === controller) delete controllersRef.current.jd
    }
  }

  // ── Step 5: Execute Skill Matching ──────────────────────────────────────
  const handleRunSkillMatch = async () => {
    const candidateProfile = editedProfile || originalProfile
    if (!candidateProfile || !jdData || isMatching) return

    setMatchingError(null)
    setTalentResult(null)
    setIsMatching(true)
    const controller = new AbortController()
    controllersRef.current.match?.abort()
    controllersRef.current.match = controller

    try {
      const result = await api.analyzeSkillMatch({
        candidateProfile,
        jdSkills: jdData,
        jdSourceFile: jdFile ? jdFile.name : 'Pasted Job Description',
      }, { signal: controller.signal })

      setMatchResult(result)
      if (savedResultRef.current !== result) {
        savedResultRef.current = result
        resultsService.saveResult({
          matchResult: result,
          profile: candidateProfile,
          job_title: jdData?.job_title || jdData?.jobTitle,
          company: jdData?.company || jdData?.company_name,
          location: jdData?.location,
          employment_type: jdData?.employment_type,
          job_description: jdData?.description_text || jdData?.job_description,
        }).catch(() => {})
      }
      setMaxStepReached((prev) => Math.max(prev, 6))
      // Continue to the company talent-check step after skill matching.
      goToStep(6)
    } catch (err) {
      if (err.name !== 'AbortError') setMatchingError(err.message || 'Failed to calculate role alignment.')
    } finally {
      if (!controller.signal.aborted) setIsMatching(false)
      if (controllersRef.current.match === controller) delete controllersRef.current.match
    }
  }

  // ── Step 7: Start New Analysis ──────────────────────────────────────────
  const handleStartNewAnalysis = () => {
    setResumeFile(null)
    setOriginalProfile(null)
    setEditedProfile(null)
    setIsProfileEdited(false)
    setJdText('')
    setJdFile(null)
    setJdData(null)
    setMatchResult(null)
    setTalentResult(null)
    setResumeError(null)
    setJdError(null)
    setMatchingError(null)
    savedResultRef.current = null
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
      {profilePersistenceWarning && <div className="wizard-persistence-warning" role="status">{profilePersistenceWarning}</div>}

      <div className="wizard-step-stage">
        {currentStep === 1 && (
          <Step1Resume
            selectedFile={resumeFile}
            onFileChange={handleResumeFileChange}
            onSubmit={handleResumeSubmit}
            isProcessing={isUploadingResume}
            error={resumeError}
            onClearError={() => setResumeError(null)}
            savedProfile={initialProfile}
            onUseProfile={handleUseSavedProfile}
            onNavigate={onNavigate}
          />
        )}

        {currentStep === 2 && editedProfile && (
          <Step2ProfileReview
            originalProfile={originalProfile}
            profile={editedProfile}
            onProfileChange={handleProfileChange}
            onResetOriginal={handleResetOriginalProfile}
            onBack={() => goToStep(1)}
            onNext={handleConfirmProfile}
            isEdited={isProfileEdited}
            error={resumeError}
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
          <Step6TalentCheck
            profile={editedProfile || originalProfile}
            jdData={jdData}
            onBack={() => goToStep(5)}
            onComplete={(result) => {
              setTalentResult(result)
              setMaxStepReached((prev) => Math.max(prev, 7))
              goToStep(7)
            }}
          />
        )}

        {currentStep === 7 && matchResult && talentResult && (
          <Step6Results
            matchResult={matchResult}
            profile={editedProfile || originalProfile}
            talentResult={talentResult}
            stepNumber={7}
            stackSkillColumns
            onStartNew={handleStartNewAnalysis}
            onEditProfile={() => goToStep(2)}
            onChangeJd={() => goToStep(3)}
          />
        )}
      </div>
    </div>
  )
}
