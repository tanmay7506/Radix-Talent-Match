import { useState, useEffect, useMemo } from 'react'
import {
  Building2,
  Target,
  FolderOpen,
  FileText,
  User,
  Link2,
  Check,
  X,
  AlertCircle,
  Lightbulb,
} from 'lucide-react'
import { api } from '../services/api'
import { computeLocalSkillMatch, formatBackendMatchResponse } from '../utils/skillMatcher'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Callout,
  EmptyState,
  Button,
  Tag,
  ProgressBar,
  Badge,
} from './ui'
import './AnalysisPage.css'

/**
 * Company Analysis & Candidate Skill Matching Page.
 */
export default function AnalysisPage({ profile, jdData, onNavigate }) {
  return (
    <div className="analysis-page">
      <PageHeader
        title="Company Analysis & Skill Matching"
        description="Explore role-specific demands extracted from the job description and evaluate how your candidate competencies align with the target position."
      />

      <div className="analysis-layout">
        {/* ── Left: Company-Wise Analysis ───────────────────────── */}
        <CompanyPanel jdData={jdData} onNavigate={onNavigate} />

        {/* ── Right: Candidate Skill Match ──────────────────────── */}
        <SkillMatchPanel profile={profile} jdData={jdData} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

/* ─── Company Analysis Panel ────────────────────────────────────────────── */
function CompanyPanel({ jdData, onNavigate }) {
  const nonEmptyCategories = jdData?.radix_categories
    ? Object.entries(jdData.radix_categories).filter(([, skills]) => Array.isArray(skills) && skills.length > 0)
    : []

  return (
    <Card className="analysis-panel">
      <CardHeader>
        <div className="analysis-panel-header">
          <div className="analysis-panel-icon" aria-hidden="true">
            <Building2 size={18} strokeWidth={2} />
          </div>
          <div>
            <CardTitle as="h2">Role & Company Skill Demand</CardTitle>
            <CardDescription>
              Requirements discovered across RADIX technical categories and required tools.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Callout type="info">
          Aggregate cross-company analytics requires a dedicated multi-tenant dataset.
          The section below presents requirements extracted from the target job description representing this role.
        </Callout>

        {jdData ? (
          <div className="company-analysis-body">
            <div className="jd-summary-section">
              <div className="section-label">Target Role Skill Demands</div>
              <div className="categories-stack">
                {nonEmptyCategories.map(([cat, skills]) => (
                  <div key={cat} className="category-group">
                    <div className="category-group-header">
                      <span className="category-group-name">{cat}</span>
                      <Badge variant="subtle" size="sm">{skills.length} skills</Badge>
                    </div>
                    <div className="category-group-tags">
                      {skills.map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {jdData.technologies?.length > 0 && (
              <div className="jd-summary-section">
                <div className="section-label">Mandatory Technologies &amp; Tools</div>
                <div className="tech-tags-grid">
                  {jdData.technologies.map((t) => (
                    <Tag key={t} className="tech-tag-highlight">{t}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<FolderOpen size={28} strokeWidth={1.8} />}
            title="No job description analysed"
            description="Upload a job description to review extracted company skill requirements and technical criteria."
            action={
              <Button
                id="analysis-to-resume-btn"
                variant="primary"
                onClick={() => onNavigate('resume')}
              >
                Upload Job Description
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Skill Match Panel ─────────────────────────────────────────────────── */
function SkillMatchPanel({ profile, jdData, onNavigate }) {
  const [backendMatch, setBackendMatch] = useState(null)

  // Compute immediate local heuristic match as initial baseline
  const localMatch = useMemo(() => {
    if (!profile || !jdData) return null
    return computeLocalSkillMatch(profile, jdData)
  }, [profile, jdData])

  // Enhance with backend /skill-matching/analyze if available
  useEffect(() => {
    if (!profile || !jdData) return

    let isMounted = true

    api
      .analyzeSkillMatch({
        candidateProfile: profile,
        jdSkills: jdData,
        jdSourceFile: 'Job description',
      })
      .then((backendRes) => {
        if (isMounted && backendRes) {
          const formatted = formatBackendMatchResponse(backendRes, profile)
          setBackendMatch(formatted)
        }
      })
      .catch(() => {
        // Fall back gracefully to local match
      })

    return () => {
      isMounted = false
    }
  }, [profile, jdData])

  const isCalculating = Boolean(profile && jdData && !backendMatch)
  const matchData = profile && jdData ? (backendMatch || localMatch) : null

  return (
    <Card className="analysis-panel">
      <CardHeader>
        <div className="analysis-panel-header">
          <div className="analysis-panel-icon" aria-hidden="true">
            <Target size={18} strokeWidth={2} />
          </div>
          <div>
            <CardTitle as="h2">Candidate Skill Match</CardTitle>
            <CardDescription>
              Objective alignment score, matched strengths, and identified skill gaps.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!profile && !jdData && (
          <EmptyState
            icon={<Link2 size={28} strokeWidth={1.8} />}
            title="Profile and JD required"
            description="Build a candidate profile and upload a job description to calculate role compatibility."
            action={
              <div className="match-empty-actions">
                <Button id="match-to-profile-btn" variant="primary" onClick={() => onNavigate('profile')}>
                  Build Profile
                </Button>
                <Button id="match-to-resume-btn" variant="secondary" onClick={() => onNavigate('resume')}>
                  Upload JD
                </Button>
              </div>
            }
          />
        )}

        {profile && !jdData && (
          <EmptyState
            icon={<FileText size={28} strokeWidth={1.8} />}
            title="Job description needed"
            description="Upload a target job description to match your parsed competencies against role requirements."
            action={
              <Button id="match-need-jd-btn" variant="primary" onClick={() => onNavigate('resume')}>
                Upload Job Description
              </Button>
            }
          />
        )}

        {!profile && jdData && (
          <EmptyState
            icon={<User size={28} strokeWidth={1.8} />}
            title="Candidate profile needed"
            description="Upload or build your profile to see how your background aligns with this job."
            action={
              <Button id="match-need-profile-btn" variant="primary" onClick={() => onNavigate('profile')}>
                Build Your Profile
              </Button>
            }
          />
        )}

        {matchData && (
          <MatchResultView
            result={matchData}
            isCalculating={isCalculating}
            onNavigate={onNavigate}
          />
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Match Result View ─────────────────────────────────────────────────── */
function MatchResultView({ result, isCalculating, onNavigate }) {
  const { scorePct, matched, missing, profileSkillBars, recommendations, ambiguityAlerts } = result
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (scorePct / 100) * circumference

  return (
    <div className="match-result-container">
      {/* Overall Score Dial */}
      <div className="match-score-section" aria-label={`Overall skill match: ${scorePct}%`}>
        <div className="match-score-ring" role="img" aria-label={`${scorePct}% match`}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="var(--color-secondary)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="match-score-text">
            <span className="match-score-num">{scorePct}</span>
            <span className="match-score-pct">%</span>
          </div>
        </div>

        <div className="match-score-label">Overall Match Score</div>
        <div className="match-score-sub">
          {matched.length} matched competencies · {missing.length} gap{missing.length !== 1 ? 's' : ''} identified
        </div>

        {isCalculating && (
          <span className="calculating-indicator">Refining alignment with deep verification…</span>
        )}
      </div>

      {/* Matched vs Missing Columns */}
      {(matched.length > 0 || missing.length > 0) && (
        <div className="match-columns">
          {matched.length > 0 && (
            <div className="match-column matched-column">
              <div className="match-col-title">
                <Check size={15} strokeWidth={2.5} className="col-icon-check" />
                <span>Matched Skills ({matched.length})</span>
              </div>
              <div className="match-skill-list">
                {matched.map((s) => (
                  <div key={s} className="match-skill-item matched">
                    <span className="match-dot matched" aria-hidden="true" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missing.length > 0 && (
            <div className="match-column missing-column">
              <div className="match-col-title">
                <X size={15} strokeWidth={2.5} className="col-icon-cross" />
                <span>Skill Gaps ({missing.length})</span>
              </div>
              <div className="match-skill-list">
                {missing.map((s) => (
                  <div key={s} className="match-skill-item missing">
                    <span className="match-dot missing" aria-hidden="true" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidate Verified Skill Levels */}
      {profileSkillBars.length > 0 && (
        <div className="verified-skills-section">
          <div className="section-label">Demonstrated Competency Levels</div>
          <div className="verified-skills-grid">
            {profileSkillBars.map((s) => (
              <ProgressBar
                key={s.name}
                label={s.name}
                value={s.level}
                max={10}
                variant="accent"
              />
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {recommendations?.length > 0 && (
        <div className="recommendations-section">
          <div className="section-label">
            <Lightbulb size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Actionable Gap Recommendations
          </div>
          <div className="recommendations-list">
            {recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="recommendation-card">
                <strong className="rec-skill">{rec.skill_name}</strong>
                <span className="rec-action">{rec.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ambiguity alerts */}
      {ambiguityAlerts?.length > 0 && (
        <Callout type="warning" title="Model Ambiguity Alerts">
          {ambiguityAlerts[0]}
        </Callout>
      )}

      {/* Disclaimer */}
      <Callout type="info" icon={<AlertCircle size={15} />}>
        A &quot;gap&quot; indicates this requirement was not explicitly found in the candidate document — it does not guarantee lack of skill. Scores are heuristic estimates and should be verified during interviews.
      </Callout>

      {/* Navigation CTAs */}
      <div className="analysis-nav-cta">
        <Button
          id="analysis-update-profile-btn"
          variant="ghost"
          onClick={() => onNavigate('profile')}
        >
          Update Profile
        </Button>
        <Button
          id="analysis-update-jd-btn"
          variant="ghost"
          onClick={() => onNavigate('resume')}
        >
          Change Job Description
        </Button>
      </div>
    </div>
  )
}
