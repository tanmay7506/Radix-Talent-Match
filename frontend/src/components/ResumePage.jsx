import { useState } from 'react'
import {
  FileText,
  ClipboardList,
  FileSearch,
  Search,
  Layers,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { api } from '../services/api'
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
  Tag,
  FileUploadZone,
} from './ui'
import './ResumePage.css'

/**
 * Resume Parsing & Job Description Analysis Page.
 * Section A: Resume Parsing – extracts candidate competencies.
 * Section B: JD Analysis – extracts required RADIX categories and technologies via API service.
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
    <div className="resume-page">
      <PageHeader
        title="Resume & Job Description Analysis"
        description="Upload a candidate resume to evaluate individual competencies, and upload a job description to extract demanded skill categories and technical requirements."
      />

      <div className="resume-layout">
        {/* ── Section A: Resume Parsing ─────────────────────────── */}
        <div className="resume-col">
          <Card className="section-panel">
            <CardHeader>
              <div className="section-panel-header">
                <div className="section-panel-icon" aria-hidden="true">
                  <FileText size={18} strokeWidth={2} />
                </div>
                <div>
                  <CardTitle as="h2">Candidate Resume</CardTitle>
                  <CardDescription>
                    Upload a PDF or DOCX resume to extract structured candidate profile and evaluated skills.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <UploadZone
                onProfileReceived={onResumeProfile}
                isLoading={isResumeLoading}
                setIsLoading={setResumeLoading}
              />

              {isResumeLoading && (
                <LoadingOverlay message="Extracting competencies from resume…" />
              )}

              {resumeProfile && !isResumeLoading && (
                <>
                  <Callout type="success" title="Resume Parsed">
                    Candidate profile successfully extracted and ready for role matching.
                  </Callout>
                  <ProfileCard profile={resumeProfile} />
                  <SkillsGrid skills={resumeProfile.skills} />
                </>
              )}

              {!resumeProfile && !isResumeLoading && (
                <EmptyState
                  icon={<ClipboardList size={28} strokeWidth={1.8} />}
                  title="No resume parsed yet"
                  description="Upload a PDF or DOCX resume above to see extracted competencies and evidence."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Section B: JD Analysis ────────────────────────────── */}
        <div className="resume-col">
          <JdAnalysisPanel jdData={jdData} onJdData={onJdData} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── Global Step CTA ─────────────────────────────────────── */}
      {(resumeProfile || jdData) && (
        <Card className="resume-bottom-cta" padding="md">
          <div className="resume-cta-content">
            <div className="resume-cta-text">
              <h4>Ready to evaluate the role alignment?</h4>
              <p>Compare your parsed candidate skills against the job description requirements.</p>
            </div>
            <div className="resume-cta-buttons">
              <Button
                id="resume-to-analysis-btn"
                variant="primary"
                onClick={() => onNavigate('analysis')}
                iconRight={<ArrowRight size={15} />}
              >
                View Skill Match
              </Button>
              {!resumeProfile && (
                <Button
                  id="resume-to-profile-btn"
                  variant="ghost"
                  onClick={() => onNavigate('profile')}
                  icon={<ArrowLeft size={15} />}
                >
                  Build Profile First
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function JdAnalysisPanel({ jdData, onJdData, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleFileSelect = async (file) => {
    if (!file) return
    setError(null)
    setFileName(file.name)
    setLoading(true)

    try {
      const data = await api.extractJdSkills(file)
      onJdData(data)
    } catch (err) {
      setError(err.message || 'Failed to extract skills from job description.')
    } finally {
      setLoading(false)
    }
  }

  const nonEmptyCategories = jdData?.radix_categories
    ? Object.entries(jdData.radix_categories).filter(([, skills]) => Array.isArray(skills) && skills.length > 0)
    : []

  return (
    <Card className="section-panel">
      <CardHeader>
        <div className="section-panel-header">
          <div className="section-panel-icon" aria-hidden="true">
            <FileSearch size={18} strokeWidth={2} />
          </div>
          <div>
            <CardTitle as="h2">Job Description Analysis</CardTitle>
            <CardDescription>
              Upload a JD to extract required RADIX skill categories and specific technical requirements.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <FileUploadZone
          id="jd-upload-zone"
          onFileSelect={handleFileSelect}
          isLoading={loading}
          currentFileName={fileName}
          acceptedExtensions={['pdf', 'docx']}
          title="Drop job description here"
          subtitle="PDF or DOCX format · Click to browse"
          loadingTitle="Analysing job description…"
          loadingSubtitle="Mapping skills to RADIX categories & tech stack"
          compact={true}
        />

        {error && <Callout type="error">{error}</Callout>}

        {loading && (
          <LoadingOverlay message="Mapping job requirements to RADIX categories…" />
        )}

        {jdData && !loading && (
          <div className="jd-results">
            <Callout type="success" title="Job Description Analysed">
              Identified {nonEmptyCategories.length} skill categories and {jdData.technologies?.length || 0} specific technologies.
            </Callout>

            {/* RADIX Skill Categories */}
            {nonEmptyCategories.length > 0 && (
              <div className="jd-results-block">
                <div className="jd-results-title">RADIX Skill Categories Required</div>
                <div className="categories-grid">
                  {nonEmptyCategories.map(([cat, skills]) => (
                    <div key={cat} className="category-row">
                      <div className="category-name">{cat}</div>
                      <div className="category-skills">
                        {skills.map((s) => (
                          <Tag key={s} className="category-skill-tag">{s}</Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {jdData.technologies?.length > 0 && (
              <div className="jd-results-block">
                <div className="jd-results-title">Specific Technologies &amp; Tools</div>
                <div className="tech-list">
                  {jdData.technologies.map((t) => (
                    <Tag key={t} className="tech-tag">{t}</Tag>
                  ))}
                </div>
              </div>
            )}

            {nonEmptyCategories.length === 0 && !jdData.technologies?.length && (
              <EmptyState
                icon={<Search size={28} strokeWidth={1.8} />}
                title="No specific skills detected"
                description="The job description did not yield distinct technical signals. Try uploading a more comprehensive JD."
              />
            )}

            <div className="jd-action-row">
              <Button
                id="jd-to-analysis-btn"
                variant="primary"
                fullWidth
                onClick={() => onNavigate('analysis')}
                iconRight={<ArrowRight size={15} />}
              >
                Compare with Candidate Profile
              </Button>
            </div>
          </div>
        )}

        {!jdData && !loading && (
          <EmptyState
            icon={<Layers size={28} strokeWidth={1.8} />}
            title="No JD analysed yet"
            description="Upload a job description above to inspect required competencies and technical tools."
          />
        )}
      </CardContent>
    </Card>
  )
}
