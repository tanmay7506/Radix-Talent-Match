import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { authService } from '../services/authService'
import { profileService } from '../services/profileService'
import { FileUploadZone } from './ui/FileUploadZone'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
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

  async function useDebugLogin() {
    setError('')
    setBusy(true)
    try {
      const nextSession = await authService.login({ email: 'debug@radix.dev', password: 'debug-only' })
      setSession(nextSession)
      await navigate({ to: search.redirect || '/match' })
    } catch (err) {
      setError(err.message || 'Debug login failed.')
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
          <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className="check-line">
          <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
          Show password
        </label>
        <button
          type="button"
          className="route-text-button"
          onClick={() => setError('Password recovery will be available when the authentication backend is connected.')}
        >
          Forgot password?
        </button>
        {error && <p className="route-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" fullWidth isLoading={busy}>Log in</Button>
        {(import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV) && (
          <Button type="button" variant="ghost" fullWidth disabled={busy} onClick={useDebugLogin}>Use dummy debug login</Button>
        )}
        <p className="route-switch">New to RADIX? <Link to="/signup">Create an account</Link></p>
        {(import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV) && (
          <p className="route-note">Development mock sign-in is enabled. This is not secure authentication.</p>
        )}
      </form>
    </AuthFrame>
  )
}

export function SignupPage() {
  const { setSession, setProfile, setProfileNotice } = useApp()
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

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }
    if (mode === 'resume' && !file) {
      setError('Choose a resume or switch to manual profile setup.')
      return
    }

    setBusy(true)
    try {
      const nextSession = await authService.signup({ name, email, password })
      setSession(nextSession)

      if (mode === 'resume') {
        try {
          const extractedProfile = await profileService.extractFromResume(file)
          setProfile(extractedProfile)
          await navigate({ to: '/profile/setup', search: { review: true } })
        } catch (err) {
          setProfileNotice(err.message === 'LLM free tier failed'
            ? err.message
            : `Your account was created, but resume processing failed: ${err.message}. You can retry from Profile.`)
          await navigate({ to: '/profile' })
        }
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
  }

  return (
    <AuthFrame title="Create your account" intro="Choose how you want to start your candidate profile. Resume upload is optional.">
      <form className="route-form" onSubmit={submit}>
        <label>Name
          <input name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>Email
          <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>Password
          <input name="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>Confirm password
          <input name="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </label>
        <label className="check-line">
          <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
          Show passwords
        </label>

        <fieldset className="signup-options">
          <legend>Profile setup</legend>
          <label className="check-line">
            <input type="radio" name="profileMode" checked={mode === 'manual'} onChange={() => setMode('manual')} />
            Create my profile manually
          </label>
          <label className="check-line">
            <input type="radio" name="profileMode" checked={mode === 'resume'} onChange={() => setMode('resume')} />
            Start with a resume
          </label>
        </fieldset>

        {mode === 'resume' && (
          <FileUploadZone
            id="signup-resume"
            onFileSelect={chooseResume}
            acceptedExtensions={['pdf', 'docx']}
            title="Choose your resume"
            subtitle="PDF or DOCX · Maximum size 10 MB"
            animate={false}
          />
        )}
        {error && <p className="route-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" fullWidth isLoading={busy}>
          {busy && mode === 'resume' ? 'Creating account & processing resume…' : 'Create account'}
        </Button>
        <p className="route-switch">Already have an account? <Link to="/login">Log in</Link></p>
        {(import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV) && (
          <p className="route-note">Development mock account only. This is not secure authentication.</p>
        )}
      </form>
    </AuthFrame>
  )
}
