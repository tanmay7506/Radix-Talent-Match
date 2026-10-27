import { useState, useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Building2,
  Target,
  FolderOpen,
  FileText,
  User,
  Link2,
  Check,
  AlertCircle,
  Lightbulb,
  BriefcaseBusiness,
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

gsap.registerPlugin(ScrollTrigger)

/**
 * Company Analysis & Candidate Skill Matching Page.
 */
export default function AnalysisPage({ profile, jdData, onNavigate }) {
  const pageRef = useRef(null)
  const [activeTab, setActiveTab] = useState('demand')
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo('.analysis-page-header',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    }, pageRef)
    return () => ctx.revert()
  }, [])
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo('.analysis-tab-content',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' })
    }, pageRef)
    return () => ctx.revert()
  }, [activeTab])
  return (
    <div className="analysis-page" ref={pageRef}>
      <div className="analysis-page-header"><PageHeader
        title="Role analysis"
        description="Review the requirements and see how your experience aligns with this role."
        actions={<Button variant="secondary" icon={<BriefcaseBusiness size={16} />} onClick={() => onNavigate('/analysis/job-details')}>{jdData ? 'Edit job details' : 'Add a job description'}</Button>}
      /></div>

      <div className="analysis-workspace">
        <div className="analysis-tabs" role="tablist" aria-label="Analysis views">
          <button id="analysis-demand-tab" type="button" role="tab" aria-selected={activeTab === 'demand'} aria-controls="analysis-demand-panel" className={activeTab === 'demand' ? 'is-active' : ''} onClick={() => setActiveTab('demand')}>
            <Building2 size={16} /><span>Skill demand</span>{jdData && <span className="analysis-tab-count">{Object.values(jdData.radix_categories || {}).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0)}</span>}
          </button>
          <button id="analysis-match-tab" type="button" role="tab" aria-selected={activeTab === 'match'} aria-controls="analysis-match-panel" className={activeTab === 'match' ? 'is-active' : ''} onClick={() => setActiveTab('match')}>
            <Target size={16} /><span>Candidate match</span>
          </button>
        </div>
        <section id={activeTab === 'demand' ? 'analysis-demand-panel' : 'analysis-match-panel'} className="analysis-tab-content" role="tabpanel" aria-labelledby={activeTab === 'demand' ? 'analysis-demand-tab' : 'analysis-match-tab'} key={activeTab}>
          {activeTab === 'demand'
            ? <CompanyPanel jdData={jdData} onNavigate={onNavigate} />
            : <SkillMatchPanel profile={profile} jdData={jdData} onNavigate={onNavigate} />}
        </section>
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
                onClick={() => onNavigate('/analysis/job-details')}
              >
                Open Match Wizard
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
  const [matchError, setMatchError] = useState('')

  // Compute immediate local heuristic match as initial baseline
  const localMatch = useMemo(() => {
    if (!profile || !jdData) return null
    return computeLocalSkillMatch(profile, jdData)
  }, [profile, jdData])

  // Enhance with backend /skill-matching/analyze if available
  useEffect(() => {
    if (!profile || !jdData) return undefined
    const controller = new AbortController()

    api
      .analyzeSkillMatch({
        candidateProfile: profile,
        jdSkills: jdData,
        jdSourceFile: 'Job description',
      }, { signal: controller.signal })
      .then((backendRes) => {
        if (backendRes) {
          const formatted = formatBackendMatchResponse(backendRes, profile)
          setBackendMatch({ profile, jdData, data: formatted })
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setMatchError({ profile, jdData, message: 'Showing a local estimate because the match service is unavailable.' })
      })

    return () => controller.abort()
  }, [profile, jdData])

  const currentBackendMatch = backendMatch?.profile === profile && backendMatch?.jdData === jdData ? backendMatch.data : null
  const currentError = matchError?.profile === profile && matchError?.jdData === jdData ? matchError.message : ''
  const isCalculating = Boolean(profile && jdData && !currentBackendMatch)
  const matchData = profile && jdData ? (currentBackendMatch || localMatch) : null

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
        {currentError && <p className="analysis-match-note" role="status">{currentError}</p>}
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
                <Button id="match-to-resume-btn" variant="secondary" onClick={() => onNavigate('/analysis/job-details')}>
                  Add a job description
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
              <Button id="match-need-jd-btn" variant="primary" onClick={() => onNavigate('/analysis/job-details')}>
                Add a job description
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
  const { scorePct, matched, matchedDetails = [], missing, missingDetails = [], profileSkillBars, recommendations, skillGaps = [], ambiguityAlerts } = result
  const [priorityTab, setPriorityTab] = useState('all')
  const resultsRef = useRef(null)
  const gapCards = missing.map((name, index) => {
    const missingDetail = missingDetails.find((item) => item.skill_name?.toLowerCase() === name.toLowerCase()) || {}
    const gapDetail = skillGaps.find((item) => item.skill_name?.toLowerCase() === name.toLowerCase()) || {}
    const recommendation = recommendations.find((item) => item.skill_name?.toLowerCase() === name.toLowerCase()) || {}
    return {
      skill_name: name,
      priority: String(missingDetail.priority || gapDetail.priority || 'medium').toLowerCase().replace(/\s+priority$/, ''),
      originalIndex: index,
      category_code: missingDetail.category_code || '',
      reason: missingDetail.reason || '',
      action: gapDetail.suggested_action || recommendation.action || `Build and document a practical example demonstrating ${name}.`,
    }
  })
  const visibleGaps = gapCards
    .filter((gap) => priorityTab === 'all' || gap.priority === priorityTab)
    .slice()
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 1) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 1) || a.originalIndex - b.originalIndex)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.skill-gap-card').forEach((card) => {
        gsap.fromTo(card, { opacity: 0, y: 14 }, {
          opacity: 1,
          y: 0,
          duration: 0.24,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 90%', once: true },
        })
      })
    }, resultsRef)
    return () => ctx.revert()
  }, [visibleGaps.length, priorityTab])

  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (scorePct / 100) * circumference

  return (
    <div className="match-result-container" ref={resultsRef}>
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
      {matched.length > 0 && (
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
                    <span className="matched-skill-copy"><strong>{s}</strong>{matchedDetails.find((item) => item.skill_name === s)?.candidate_evidence && <small>{matchedDetails.find((item) => item.skill_name === s).candidate_evidence}</small>}{matchedDetails.find((item) => item.skill_name === s) && <small className="matched-skill-meta">{[matchedDetails.find((item) => item.skill_name === s).match_type, matchedDetails.find((item) => item.skill_name === s).match_confidence && `${matchedDetails.find((item) => item.skill_name === s).match_confidence} confidence`].filter(Boolean).join(' · ')}</small>}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {gapCards.length > 0 && <section className="skill-gaps-section" aria-labelledby="skill-gaps-title">
        <div className="skill-gaps-heading">
          <div><span className="section-label">What to focus on</span><h2 id="skill-gaps-title">Skill gaps</h2><p>Prioritized requirements that need clearer evidence in your profile.</p></div>
          <span className="skill-gap-total">{gapCards.length} identified</span>
        </div>
        <div className="skill-gap-tabs" role="tablist" aria-label="Filter skill gaps by priority">
          {[['all', 'All', gapCards.length], ['high', 'High priority', gapCards.filter((item) => item.priority === 'high').length], ['medium', 'Medium priority', gapCards.filter((item) => item.priority === 'medium').length], ['low', 'Low priority', gapCards.filter((item) => item.priority === 'low').length]].map(([key, label, count]) => <button key={key} type="button" role="tab" aria-selected={priorityTab === key} className={priorityTab === key ? 'is-active' : ''} onClick={() => setPriorityTab(key)}>{label}<span>{count}</span></button>)}
        </div>
        <div className="skill-gap-card-list" role="tabpanel">
          {visibleGaps.length ? visibleGaps.map((gap) => <article className={`skill-gap-card priority-${gap.priority}`} key={gap.skill_name}>
            <div className="skill-gap-card-heading"><div><span className="skill-gap-kicker">{gap.category_code || 'Role requirement'}</span><h3>{gap.skill_name}</h3></div><Badge variant={gap.priority === 'high' ? 'error' : gap.priority === 'low' ? 'success' : 'warning'}>{gap.priority} priority</Badge></div>
            {gap.reason && <p className="skill-gap-reason">{gap.reason}</p>}
            <div className="skill-gap-action"><Lightbulb size={17} /><div><strong>Suggested next step</strong><p>{gap.action}</p></div></div>
          </article>) : <p className="skill-gap-empty">No gaps at this priority.</p>}
        </div>
      </section>}

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
      {recommendations?.length > 0 && gapCards.length === 0 && (
        <div className="recommendations-section">
          <div className="section-label">
            <Lightbulb size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Actionable Gap Recommendations
          </div>
          <div className="recommendations-list">
            {recommendations.map((rec, i) => (
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
          onClick={() => onNavigate('/analysis/job-details')}
        >
          Change Job Description
        </Button>
      </div>
    </div>
  )
}
