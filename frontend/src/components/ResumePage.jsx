import { useRef, useState } from 'react'
import {
  FileText,
  ClipboardList,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Search,
  Layers,
  FileSearch,
} from 'lucide-react'
import UploadZone from './UploadZone'
import ProfileCard from './ProfileCard'
import SkillsGrid from './SkillsGrid'
import './ResumePage.css'

/**
 * Resume & Job Description page.
 * Section A: Resume Parsing – reuses the existing UploadZone → ProfileCard + SkillsGrid pipeline.
 * Section B: JD Analysis   – new JD upload, calls POST /jd/extract-skills.
 */
export default function ResumePage({
  resumeProfile,
  isResumeLoading,
  setResumeLoading,
  onResumeProfile,
  jdData,
  onJdData,
  onNavigate,
}) {
  return (
    <div>
      <div className="resume-page-header">
        <h1>Resume Parsing &amp; Job Description Analysis</h1>
        <p>Upload a resume to extract skills, and upload a job description to see what the role demands.</p>
      </div>

      <div className="resume-layout">
        {/* ── Section A: Resume ─────────────────────────────────── */}
        <div className="section-panel">
          <div className="section-panel-header">
            <div className="section-panel-icon" aria-hidden="true">
              <FileText size={18} strokeWidth={2} />
            </div>
            <div>
              <h2>Resume Parsing</h2>
              <p>Uploads a resume (PDF/DOCX) and extracts a structured candidate profile with skill levels and evidence.</p>
            </div>
          </div>

          {/* Existing UploadZone — GSAP animations preserved */}
          <UploadZone
            onProfileReceived={onResumeProfile}
            isLoading={isResumeLoading}
            setIsLoading={setResumeLoading}
          />

          {isResumeLoading && (
            <div className="status-bar processing" role="status" aria-live="polite">
              <Loader2 size={15} className="spinner" aria-hidden="true" />
              <span>Extracting profile from resume…</span>
            </div>
          )}

          {resumeProfile && !isResumeLoading && (
            <>
              <div className="status-bar success" role="status" aria-live="polite">
                <CheckCircle2 size={15} strokeWidth={2} aria-hidden="true" />
                <span>Profile extracted successfully</span>
              </div>
              <ProfileCard profile={resumeProfile} />
              <SkillsGrid skills={resumeProfile.skills} />
            </>
          )}

          {!resumeProfile && !isResumeLoading && (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <ClipboardList size={36} strokeWidth={1.8} />
              </span>
              <h3>No resume parsed yet</h3>
              <p>Upload a PDF or DOCX resume above to see extracted profile data.</p>
            </div>
          )}
        </div>

        {/* ── Section B: JD Analysis ────────────────────────────── */}
        <JdAnalysisPanel jdData={jdData} onJdData={onJdData} onNavigate={onNavigate} />
      </div>

      {/* ── Navigation CTA ─────────────────────────────────────── */}
      {(resumeProfile || jdData) && (
        <div className="resume-navigate-cta">
          <p>Ready to see how your profile compares to the job?</p>
          <button
            id="resume-to-analysis-btn"
            className="neo-btn neo-btn-accent"
            onClick={() => onNavigate('analysis')}
          >
            View Skill Match →
          </button>
          {!resumeProfile && (
            <button
              id="resume-to-profile-btn"
              className="neo-btn neo-btn-ghost"
              onClick={() => onNavigate('profile')}
            >
              ← Build Profile First
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function JdAnalysisPanel({ jdData, onJdData, onNavigate }) {
  const [loading, setLoading]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [error, setError]       = useState(null)
  const inputRef                = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF or DOCX files are supported.')
      return
    }
    setError(null)
    setFileName(file.name)
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:8000/jd/extract-skills', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      onJdData(data)
    } catch (err) {
      setError(`Failed to extract JD skills: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const nonEmptyCategories = jdData
    ? Object.entries(jdData.radix_categories).filter(([, skills]) => skills.length > 0)
    : []

  return (
    <div className="section-panel">
      <div className="section-panel-header">
        <div className="section-panel-icon" aria-hidden="true">
          <FileSearch size={18} strokeWidth={2} />
        </div>
        <div>
          <h2>Job Description Analysis</h2>
          <p>Upload a JD (PDF/DOCX) to extract required skill categories and specific technologies.</p>
        </div>
      </div>

      {/* JD Upload zone */}
      <div
        id="jd-upload-zone"
        className={`jd-upload-zone${dragging ? ' dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload job description file"
        onClick={() => !loading && inputRef.current.click()}
        onKeyDown={(e) => e.key === 'Enter' && !loading && inputRef.current.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          aria-hidden="true"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="jd-upload-icon" aria-hidden="true">
          {loading ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="spinner">
              <circle cx="12" cy="12" r="9" stroke="var(--border)" strokeWidth="3"/>
              <path d="M12 3 A9 9 0 0 1 21 12" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : (
            <FolderOpen size={24} strokeWidth={1.8} />
          )}
        </div>
        <div className="jd-upload-text">
          {loading ? (
            <>
              <h3>Analysing job description…</h3>
              <p>Extracting RADIX skill categories and technologies</p>
            </>
          ) : fileName ? (
            <>
              <h3>{fileName}</h3>
              <p>Click or drop another file to replace</p>
            </>
          ) : (
            <>
              <h3>Drop job description here</h3>
              <p>PDF or DOCX · Click to browse</p>
            </>
          )}
        </div>
        {fileName && !loading && (
          <span className="jd-file-name" aria-label={`Selected file: ${fileName}`}>{fileName}</span>
        )}
      </div>

      {error && (
        <p className="section-error" role="alert">{error}</p>
      )}

      {loading && (
        <div className="status-bar processing" role="status" aria-live="polite">
          <Loader2 size={15} className="spinner" aria-hidden="true" />
          <span>Mapping skills to RADIX categories…</span>
        </div>
      )}

      {jdData && !loading && (
        <>
          <div className="status-bar success" role="status" aria-live="polite">
            <CheckCircle2 size={15} strokeWidth={2} aria-hidden="true" />
            <span>JD analysis complete</span>
          </div>

          <div className="jd-results">
            {/* RADIX Skill Categories */}
            {nonEmptyCategories.length > 0 && (
              <div>
                <div className="jd-results-title">RADIX Skill Categories Required</div>
                <div className="categories-grid">
                  {nonEmptyCategories.map(([cat, skills]) => (
                    <div key={cat} className="category-row">
                      <div className="category-name">{cat}</div>
                      <div className="category-skills">
                        {skills.map((s) => (
                          <span key={s} className="category-skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {jdData.technologies?.length > 0 && (
              <div>
                <div className="jd-results-title">Specific Technologies &amp; Tools</div>
                <div className="tech-list">
                  {jdData.technologies.map((t) => (
                    <span key={t} className="tech-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {nonEmptyCategories.length === 0 && !jdData.technologies?.length && (
              <div className="empty-state">
                <span className="empty-state-icon" aria-hidden="true">
                  <Search size={36} strokeWidth={1.8} />
                </span>
                <h3>No specific skills found</h3>
                <p>The job description did not yield clear skill signals. Try a more detailed JD.</p>
              </div>
            )}
          </div>

          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button
              id="jd-to-analysis-btn"
              className="neo-btn neo-btn-accent"
              onClick={() => onNavigate('analysis')}
              style={{ width: '100%' }}
            >
              Compare with My Profile →
            </button>
          </div>
        </>
      )}

      {!jdData && !loading && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <Layers size={36} strokeWidth={1.8} />
          </span>
          <h3>No JD analysed yet</h3>
          <p>Upload a job description above to see what skills and technologies this role requires.</p>
        </div>
      )}
    </div>
  )
}
