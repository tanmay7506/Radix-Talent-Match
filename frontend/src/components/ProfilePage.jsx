import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ArrowRight, ClipboardList, Save } from 'lucide-react'
import { profileService } from '../services/profileService'
import ProfileCard from './ProfileCard'
import SkillsGrid from './SkillsGrid'
import { PageHeader } from './ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Callout } from './ui/Callout'
import { EmptyState } from './ui/EmptyState'
import { LoadingOverlay } from './ui/Spinner'
import './ProfilePage.css'

export default function ProfilePage({ profile, setProfile, isLoading, loadError = '', notice = '', setNotice, onRetry, onNavigate }) {
  const [draft, setDraft] = useState(profile || null)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const contentRef = useRef(null)
  const fileRef = useRef(null)
  const extractionRef = useRef(null)
  const hasDraft = Boolean(draft)
  useEffect(() => () => extractionRef.current?.abort(), [])
  useEffect(() => {
    if (!hasDraft || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo('.profile-management > .ui-card, .profile-background-group',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.38, stagger: 0.07, ease: 'power2.out' })
    }, contentRef)
    return () => ctx.revert()
  }, [hasDraft])

  const acceptExtracted = (data) => {
    setDraft({ ...data, source: 'resume' })
    setProfile({ ...data, source: 'resume' })
    setError('')
    setNotice?.('')
    setSavedMessage('Resume information is ready for review. Save your changes to update your profile.')
  }

  const handleResumeFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!/\.(pdf|docx)$/i.test(file.name)) { setError('Choose a PDF or DOCX resume.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Resume must be 10 MB or smaller.'); return }
    const controller = new AbortController()
    extractionRef.current?.abort()
    extractionRef.current = controller
    setExtracting(true); setError('')
    try { acceptExtracted(await profileService.extractFromResume(file, { signal: controller.signal })) }
    catch (err) { if (err.name !== 'AbortError') setError(err.message || 'Resume extraction failed. Try again.') }
    finally { if (!controller.signal.aborted) setExtracting(false); if (extractionRef.current === controller) extractionRef.current = null }
  }

  const save = async () => {
    if (!draft || saving) return
    setSaving(true); setError(''); setSavedMessage('')
    if (!draft.name?.trim()) { setError('Add your name before saving the profile.'); setSaving(false); return }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) { setError('Enter a valid email address.'); setSaving(false); return }
    try {
      const result = await profileService.saveProfile({ ...draft, manually_edited: true })
      setDraft(result); setProfile(result); setSavedMessage((import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV) ? 'Profile saved in temporary development storage. It will clear when this session reloads.' : 'Profile changes saved.')
    } catch (e) { setError(e.message || 'Unable to save profile. Try again.') }
    finally { setSaving(false) }
  }

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const skills = (draft?.skills || []).map((skill) => typeof skill === 'string' ? skill : skill.skill_name).filter(Boolean)
  const updatedAt = draft?.updated_at ? new Date(draft.updated_at) : null
  const updatedLabel = updatedAt && !Number.isNaN(updatedAt.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(updatedAt)
    : null

  return <div className="profile-page">
    <PageHeader title="Your profile" description="Review the information used to assess your fit for a role. Resume-extracted details are marked for review; your edits stay yours." />
    <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={handleResumeFile} />
    {error && <Callout type="error" role="alert">{error}</Callout>}
    {savedMessage && <p className="profile-status" role="status">{savedMessage}</p>}
    {loadError && <Callout type="error" role="alert">{loadError} {onRetry && <button type="button" onClick={() => onRetry()}>Retry</button>}</Callout>}
    {notice && <Callout type="warning" role="status">{notice}</Callout>}
    {(import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV) && <Callout type="warning">Development mock mode: profile data is kept in memory and clears on refresh.</Callout>}
    {isLoading && !draft && <LoadingOverlay className="profile-loading-card" message="Fetching your profile…" />}
    {extracting && <LoadingOverlay className="profile-extraction-card" message="Uploading and extracting resume information…" />}
    {!draft && !isLoading && !extracting && <EmptyState icon={<ClipboardList size={28} />} title={loadError ? 'Profile could not load' : 'Start your profile'} description={loadError ? 'You can retry loading, create a manual profile, or use a resume to start over.' : 'Upload a resume to extract a first draft, or create your profile manually.'} action={<div className="profile-actions"><Button variant="primary" onClick={() => setDraft({ name: '', email: '', source: 'manual', skills: [], education: {}, internships: [], hackathons: [], certifications: [], preferred_roles: [] })}>Create profile manually</Button><Button variant="secondary" onClick={() => fileRef.current?.click()}>Upload resume</Button></div>} />}
    {draft && <div className="profile-management" ref={contentRef}>
      <Card padding="md" className="profile-edit-card">
        <CardHeader><CardTitle as="h2">Profile details</CardTitle><span className="profile-source">{draft.source === 'manual' ? 'Manual profile' : draft.manually_edited ? 'Manually edited · resume extracted' : 'Review extracted details'}</span></CardHeader>
        <CardContent>
          {draft.source !== 'manual' && <Callout type="info">Resume extraction can miss context. Review each field and correct anything that needs your input.</Callout>}
          <div className="profile-fields">
            <label>Name<input required value={draft.name || ''} onChange={(e) => update('name', e.target.value)} autoComplete="name" /></label>
            <label>Email<input type="email" value={draft.email || ''} onChange={(e) => update('email', e.target.value)} autoComplete="email" /></label>
            <label>Degree<input value={draft.education?.degree || ''} onChange={(e) => setDraft((current) => ({ ...current, education: { ...current.education, degree: e.target.value } }))} /></label>
            <label>School or university<input value={draft.education?.college || ''} onChange={(e) => setDraft((current) => ({ ...current, education: { ...current.education, college: e.target.value } }))} /></label>
            <label>Graduation year<input value={draft.education?.graducation_year || draft.education?.graduation_year || ''} onChange={(e) => setDraft((current) => ({ ...current, education: { ...current.education, graducation_year: e.target.value } }))} /></label>
            <label>Grade or CGPA<input value={draft.education?.cgpa || ''} onChange={(e) => setDraft((current) => ({ ...current, education: { ...current.education, cgpa: e.target.value } }))} /></label>
            <label className="profile-wide">Skills <span className="profile-help">Separate skills with commas</span><textarea value={skills.join(', ')} onChange={(e) => { const existing=new Map((draft.skills||[]).filter((item)=>typeof item!=='string').map((item)=>[item.skill_name.toLowerCase(),item])); update('skills',e.target.value.split(',').map((name)=>name.trim()).filter(Boolean).map((name)=>existing.get(name.toLowerCase())||{skill_name:name,skill_code:'OTH',skill_level:5,confidence:'Medium',evidence:[]})) }} rows={3} /></label>
            {['internships','hackathons','certifications','preferred_roles'].map((field) => <label key={field} className="profile-wide">{field === 'preferred_roles' ? 'Preferred roles' : field[0].toUpperCase()+field.slice(1)} <span className="profile-help">One item per line</span><textarea value={(draft[field]||[]).map((item)=>typeof item==='string'?item:item.title||item.name||'').join('\n')} onChange={(e)=>update(field,e.target.value.split('\n').map((item)=>item.trim()).filter(Boolean))} rows={3} /></label>)}
          </div>
          <div className="profile-actions"><Button variant="primary" isLoading={saving} icon={<Save size={15} />} onClick={save}>Save profile</Button><Button variant="secondary" onClick={() => fileRef.current?.click()} isLoading={isLoading||extracting}>Update from resume</Button></div>
          {updatedLabel && <p className="profile-updated">Last updated {updatedLabel}</p>}
        </CardContent>
      </Card>
      <ProfileCard profile={draft} />
      <SkillsGrid skills={draft.skills} />
      {['experience', 'internships', 'hackathons', 'certifications', 'projects', 'preferred_roles'].some((field) => Array.isArray(draft[field]) && draft[field].length > 0) && (
        <Card padding="md" className="profile-background-card">
          <CardHeader><CardTitle as="h2">Background</CardTitle><span className="profile-source">Experience, projects and credentials</span></CardHeader>
          <CardContent>
            <div className="profile-background-groups">
              {[
                ['experience', 'Experience'],
                ['internships', 'Internships'],
                ['projects', 'Projects'],
                ['certifications', 'Certifications'],
                ['hackathons', 'Hackathons'],
                ['preferred_roles', 'Preferred roles'],
              ].map(([field, label]) => {
                const entries = Array.isArray(draft[field]) ? draft[field] : []
                if (!entries.length) return null
                return <section className="profile-background-group" key={field} aria-label={label}>
                  <h3>{label}<span>{entries.length}</span></h3>
                  <ul className="profile-background-list">
                    {entries.map((entry, index) => {
                      const item = typeof entry === 'string' ? { title: entry } : (entry || {})
                      const title = item.title || item.role || item.name || item.position || item.certification || item.certificate_name || item.project_name || label.slice(0, -1)
                      const period = item.start_date && item.end_date ? `${item.start_date} – ${item.end_date}` : item.period || item.date || item.year
                      const details = [item.company || item.company_name, item.organization || item.organization_name, item.issuer, item.location, period].filter(Boolean)
                      const description = item.description || item.project_description || item.summary || item.details
                      return <li className="profile-background-item" key={`${field}-${index}`}>
                        <strong>{title}</strong>
                        {details.length > 0 && <span className="profile-background-meta">{details.join(' · ')}</span>}
                        {description && <p>{description}</p>}
                      </li>
                    })}
                  </ul>
                </section>
              })}
            </div>
          </CardContent>
        </Card>
      )}
      <Button variant="ghost" iconRight={<ArrowRight size={15} />} onClick={() => onNavigate('/match')}>Start a match</Button>
    </div>}
  </div>
}
