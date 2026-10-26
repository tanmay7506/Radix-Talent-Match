import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, FileText, Upload } from 'lucide-react'
import { gsap } from 'gsap'
import { api } from '../services/api'
import { PageHeader, Card, CardContent, Callout, Button, FileUploadZone } from './ui'
import './AnalysisPage.css'

export default function AnalysisJobDetailsPage({ jdData, onJdData, onNavigate }) {
  const [company, setCompany] = useState(jdData?.company || jdData?.company_name || '')
  const [jobTitle, setJobTitle] = useState(jdData?.job_title || jdData?.jobTitle || '')
  const [description, setDescription] = useState(jdData?.description_text || jdData?.job_description || '')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const controllerRef = useRef(null)
  const pageRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = gsap.context(() => gsap.fromTo('.job-details-content', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }), pageRef)
    return () => ctx.revert()
  }, [])

  async function updateAnalysis(source, value) {
    if (source === 'text' && (!value.trim() || value.trim().length < 30)) {
      setError('Enter at least 30 characters of job description to analyse this role.')
      return
    }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setProcessing(true)
    setError('')
    try {
      const extracted = source === 'text'
        ? await api.extractJdSkillsFromText(value.trim(), { signal: controller.signal })
        : await api.extractJdSkills(value, { signal: controller.signal })
      onJdData?.({ ...extracted, company: company.trim() || undefined, company_name: company.trim() || undefined, job_title: jobTitle.trim() || undefined, description_text: source === 'text' ? value.trim() : extracted.description_text || '' })
      onNavigate('/analysis')
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Unable to analyse this job description. Try again.')
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      if (!controller.signal.aborted) setProcessing(false)
    }
  }

  return <div className="analysis-job-page" ref={pageRef}>
    <PageHeader title="Job details" description="Add the role you want to evaluate. Paste the job description or upload a document." actions={<Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => onNavigate('/analysis')}>Back to analysis</Button>} />
    <Card className="job-details-content">
      <CardContent>
        <div className="analysis-update-form">
          <label>Company name<input value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" placeholder="Company" /></label>
          <label>Job title<input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Frontend Engineer" /></label>
        </div>
        <div className="job-input-options">
          <section className="job-input-section">
            <h2><FileText size={17} /> Paste job description</h2>
            <label className="job-description-label">Job description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={9} placeholder="Paste the full job post, including responsibilities and requirements." /></label>
            <Button variant="primary" isLoading={processing} onClick={() => updateAnalysis('text', description)}>Analyse pasted text</Button>
          </section>
          <section className="job-input-section job-file-section">
            <h2><Upload size={17} /> Upload a document</h2>
            <p>Use a PDF or DOCX job description, up to 10 MB.</p>
            <FileUploadZone id="jd-file-upload" acceptedExtensions={['pdf', 'docx']} onFileSelect={(file) => file.size > 10 * 1024 * 1024 ? setError('Job description must be 10 MB or smaller.') : updateAnalysis('file', file)} isLoading={processing} animate={false} title="Choose a job description" subtitle="PDF or DOCX · Click or drop to browse" loadingTitle="Analysing job description…" loadingSubtitle="Extracting role skills and technologies" />
          </section>
        </div>
        {error && <Callout type="error" role="alert">{error}</Callout>}
        {processing && <p className="analysis-update-status" role="status">Extracting requirements. This may take a moment.</p>}
      </CardContent>
    </Card>
  </div>
}
