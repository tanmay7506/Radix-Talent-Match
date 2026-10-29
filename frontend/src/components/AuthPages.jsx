import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { authService } from '../services/authService'
import { profileService } from '../services/profileService'
import { FileUploadZone } from './ui/FileUploadZone'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Callout } from './ui/Callout'
import ProfileCard from './ProfileCard'
import { WizardStepper } from './workflow/WizardStepper'
import { useApp } from '../state/AppState'
import './RoutePages.css'

function AuthFrame({ title, intro, children }) {
  const cardRef = useRef(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const tween = gsap.fromTo(cardRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' })
    return () => tween.kill()
  }, [])
  return (
    <section className="auth-page">
      <Card padding="lg" className="auth-card" ref={cardRef}>
        <CardHeader>
          <CardTitle as="h1">{title}</CardTitle>
          <p>{intro}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}

export function LoginPage() {
  const { setSession } = useApp()
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!event.currentTarget.reportValidity()) return
    setBusy(true)
    try {
      const nextSession = await authService.login({ email, password })
      setSession(nextSession)
      await navigate({ to: search.redirect || '/match' })
    } catch (err) {
      setError(err.message || 'Login failed. Check your details and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="Log in" intro="Sign in to manage your profile and match history.">
      <form className="route-form" onSubmit={submit}>
        <label>Email
          <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>Password
          <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" minLength={1} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className="check-line">
          <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
          Show password
        </label>
        <button
          type="button"
          className="route-text-button"
          onClick={() => setError('Password reset is not available yet. Contact your administrator for help.')}
        >
          Forgot password?
        </button>
        {error && <p className="route-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" fullWidth isLoading={busy}>Log in</Button>
        <p className="route-switch">New to RADIX? <Link to="/signup">Create an account</Link></p>
      </form>
    </AuthFrame>
  )
}

export function SignupPage() {
  const { setSession, setProfile } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [mode, setMode] = useState('manual')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [resumeProfile, setResumeProfile] = useState(null)
  const [extracting, setExtracting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (mode === 'resume' && step === 1) {
      if (!file) {
        setError('Choose a resume to continue.')
        return
      }
      setExtracting(true)
      try {
        const extracted = await profileService.extractFromResume(file)
        // Resume extraction is best-effort: keep whatever was parsed and collect
        // missing account details in the profile review step.
        const rawProfile = extracted && typeof extracted === 'object' ? extracted : {}
        const profile = {
          ...rawProfile,
          education: rawProfile.education && typeof rawProfile.education === 'object' && Object.keys(rawProfile.education).length ? rawProfile.education : undefined,
          skills: Array.isArray(rawProfile.skills) ? rawProfile.skills : [],
          preferred_roles: Array.isArray(rawProfile.preferred_roles) ? rawProfile.preferred_roles : [],
          internships: Array.isArray(rawProfile.internships) ? rawProfile.internships : [],
          hackathons: Array.isArray(rawProfile.hackathons) ? rawProfile.hackathons : [],
          certifications: Array.isArray(rawProfile.certifications) ? rawProfile.certifications : [],
        }
        setResumeProfile(profile)
        const extractedName = String(profile.name || '').trim()
        const extractedEmail = String(profile.email || '').trim()
        setName(extractedName)
        setEmail(extractedEmail)
        setStep(2)
      } catch (err) {
        setError(err.message || 'Could not read your resume. Try again or choose manual registration.')
      } finally {
        setExtracting(false)
      }
      return
    }
    if (mode === 'resume' && step === 2) {
      if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Add a name and valid email address before continuing.')
        return
      }
      setStep(3)
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const nextSession = await authService.signup({ name, email, password })
      setSession(nextSession)

      if (mode === 'resume') {
        setProfile({ ...resumeProfile, name, email, source: 'resume' })
        await navigate({ to: '/profile/setup', search: { review: true } })
      } else {
        setProfile({ name, email, source: 'manual', skills: [] })
        await navigate({ to: '/profile/setup' })
      }
    } catch (err) {
      setError(err.message || 'Account creation failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const chooseResume = (selectedFile) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Resume must be 10 MB or smaller.')
      return
    }
    setError('')
    setFile(selectedFile)
    setResumeProfile(null)
    setStep(1)
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setStep(1)
    setResumeProfile(null)
    setError('')
  }

  return (
    <AuthFrame title="Create your account" intro="Register manually or start with your resume.">
      <form className="route-form" onSubmit={submit}>
        <div className="signup-tabs" role="tablist" aria-label="Registration method">
          <button type="button" role="tab" aria-selected={mode === 'manual'} className={mode === 'manual' ? 'signup-tab is-active' : 'signup-tab'} onClick={() => switchMode('manual')}>Manual registration</button>
          <button type="button" role="tab" aria-selected={mode === 'resume'} className={mode === 'resume' ? 'signup-tab is-active' : 'signup-tab'} onClick={() => switchMode('resume')}>Load from resume</button>
        </div>

        {mode === 'resume' && <WizardStepper currentStep={step} maxStepReached={step} onStepClick={setStep} steps={[{ id: 1, label: 'Resume', short: 'Resume' }, { id: 2, label: 'Profile details', short: 'Profile' }, { id: 3, label: 'Password', short: 'Password' }]} />}

        {mode === 'resume' && step === 1 && (
          <FileUploadZone
            id="signup-resume"
            onFileSelect={chooseResume}
            acceptedExtensions={['pdf', 'docx']}
            title="Choose your resume"
            subtitle="PDF or DOCX · Maximum size 10 MB"
            animate={false}
          />
        )}
        {(mode === 'manual' || (mode === 'resume' && step === 2)) && <>
          {mode === 'resume' && step === 2 && (!name.trim() || !email.trim()) && <Callout type="info">Some account details were not found in your resume. Add the missing information below to continue.</Callout>}
          <label>Name
            <input name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>Email
            <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          {mode === 'resume' && step === 2 && <section className="signup-profile-preview" aria-label="Profile preview">
            <h2>Profile preview</h2>
            <p>Review the information extracted from your resume.</p>
            <ProfileCard profile={{ ...(resumeProfile || {}), name, email }} />
          </section>}
        </>}
        {(mode === 'manual' || (mode === 'resume' && step === 3)) && <>
          <label>Password
            <input name="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label>Confirm password
            <input name="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          <label className="check-line">
            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
            Show passwords
          </label>
        </>}
        {error && <p className="route-error" role="alert">{error}</p>}
        {mode === 'resume' && step === 2 && <Button type="button" variant="secondary" fullWidth onClick={() => { setStep(1); setError('') }}>Back to resume</Button>}
        {mode === 'resume' && step === 3 && <Button type="button" variant="secondary" fullWidth onClick={() => { setStep(2); setError('') }}>Back to profile details</Button>}
        <Button type="submit" variant="primary" fullWidth isLoading={busy || extracting}>
          {extracting ? 'Reading resume…' : busy ? 'Creating account…' : mode === 'resume' && step < 3 ? 'Continue' : 'Create account'}
        </Button>
        <p className="route-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </AuthFrame>
  )
}
