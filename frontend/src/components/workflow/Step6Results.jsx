import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { api } from '../../services/api'
import {
  Check,
  X,
  Target,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  Edit,
  FileSearch,
  Building2,
  Compass,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout, Badge, ProgressBar } from '../ui'
import { SkillGapRoadmap } from './SkillGapRoadmap'
import './Step6Results.css'

export function Step6Results({
  matchResult,
  profile,
  onStartNew,
  onEditProfile,
  onChangeJd,
  onViewCompanyMatches,
  talentResult = null,
  stepNumber = 6,
  stackSkillColumns = false,
  jdData = null,
}) {
  const [activeResultTab, setActiveResultTab] = useState('skill')
  const [activeSkillView, setActiveSkillView] = useState('gaps')
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapGraph, setRoadmapGraph] = useState(null)
  const [roadmapError, setRoadmapError] = useState('')
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false)
  const resultsRef = useRef(null)
  const roadmapControllerRef = useRef(null)

  // Clear roadmap when candidate profile, JD, or talent assessment changes
  useEffect(() => {
    setRoadmap(null)
    setRoadmapGraph(null)
    setRoadmapError('')
  }, [profile, jdData, talentResult])
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const context = gsap.context(() => {
      gsap.fromTo('.results-grid > *:not(.results-navigation-footer)',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.28, stagger: 0.05, ease: 'power2.out', clearProps: 'transform,opacity' })
    }, resultsRef)
    return () => context.revert()
  }, [activeResultTab])
  useEffect(() => () => roadmapControllerRef.current?.abort(), [])
  if (!matchResult) return null

  const score = typeof matchResult.match_score === 'number' ? Math.round(matchResult.match_score) : 0
  const confidence = matchResult.match_confidence || 'medium'
  const canonicalSkills = matchResult.canonical_skills || []
  const hasCanonicalSkills = canonicalSkills.length > 0
  const matched = hasCanonicalSkills
    ? canonicalSkills.filter((item) => item.status === 'matched').map((item) => ({
      ...item,
      skill_name: item.category_name,
      match_type: 'evidence',
      candidate_skill_level: item.candidate_level,
    }))
    : (matchResult.matched_skills || [])
  const unassessed = hasCanonicalSkills
    ? canonicalSkills.filter((item) => item.status === 'not_assessed').map((item) => ({
      ...item,
      skill_name: item.category_name,
      source: 'category',
    }))
    : (matchResult.unassessed_skills || [])
  const requiredSkillCount = hasCanonicalSkills
    ? canonicalSkills.filter((item) => item.required_by_jd).length
    : matched.length + unassessed.length
  const notApplicableCount = hasCanonicalSkills
    ? canonicalSkills.filter((item) => item.status === 'not_applicable').length
    : 0
  const ambiguityAlerts = matchResult.ambiguity_alerts || []

  // SVG Dial
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  const confidenceBadgeVariant =
    confidence.toLowerCase() === 'high'
      ? 'success'
      : confidence.toLowerCase() === 'low'
      ? 'error'
      : 'warning'

  const showRoadmap = async () => {
    setActiveSkillView('roadmap')
    if (roadmapGraph || roadmap || isLoadingRoadmap) return

    const companyId = talentResult?.company?.company_id || jdData?.company_id || jdData?.companyId
    if (!profile) {
      setRoadmapError('Candidate profile is required before a roadmap can be generated.')
      return
    }

    const controller = new AbortController()
    roadmapControllerRef.current?.abort()
    roadmapControllerRef.current = controller
    setRoadmapError('')
    setIsLoadingRoadmap(true)
    try {
      const response = await api.getTalentCheckRoadmap(profile, companyId, {
        jdSkills: jdData,
        jdTitle: jdData?.job_title || jdData?.jobTitle || jdData?.title || talentResult?.assessment?.role,
        signal: controller.signal,
      })
      setRoadmap(response.analysis?.learning_roadmap || [])
      setRoadmapGraph(response.analysis?.roadmap_graph || null)
    } catch (error) {
      if (error.name !== 'AbortError') setRoadmapError(error.message || 'Unable to generate the learning roadmap.')
    } finally {
      if (!controller.signal.aborted) setIsLoadingRoadmap(false)
      if (roadmapControllerRef.current === controller) roadmapControllerRef.current = null
    }
  }

  return (
    <div className="wizard-step-container" ref={resultsRef}>
      <div className="results-header-banner">
        <div>
          <h2>{talentResult ? `Step ${stepNumber}: Combined Match Results` : `Step ${stepNumber}: Role Alignment & Skill Gap Report`}</h2>
          <p>
            Candidate match report for <strong className="candidate-name-highlight">{profile?.name || 'Candidate'}</strong> evaluated against the target job description.
          </p>
        </div>
        <div className="results-header-actions">
          {stepNumber === 6 && onViewCompanyMatches && (
            <Button variant="secondary" size="sm" onClick={onViewCompanyMatches} icon={<Building2 size={14} />}>
              Company Matches
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={onStartNew}
            icon={<RotateCcw size={14} />}
          >
            New Analysis
          </Button>
        </div>
      </div>

      {talentResult && (
        <div className="analysis-tabs" role="tablist" aria-label="Match results">
            <button id="result-skill-tab" type="button" role="tab" aria-selected={activeResultTab === 'skill'} aria-controls="result-skill-panel" className={activeResultTab === 'skill' ? 'is-active' : ''} onClick={() => setActiveResultTab('skill')}>
              <Target size={16} /><span>Skill Match</span>
            </button>
            <button id="result-talent-tab" type="button" role="tab" aria-selected={activeResultTab === 'talent'} aria-controls="result-talent-panel" className={activeResultTab === 'talent' ? 'is-active' : ''} onClick={() => setActiveResultTab('talent')}>
              <Building2 size={16} /><span>Talent Check</span>
            </button>
            <button
              id="result-roadmap-tab"
              type="button"
              role="tab"
              aria-selected={activeResultTab === 'roadmap'}
              aria-controls="result-roadmap-panel"
              className={activeResultTab === 'roadmap' ? 'is-active' : ''}
              onClick={() => {
                setActiveResultTab('roadmap')
                showRoadmap()
              }}
            >
              <Compass size={16} /><span>Skill-Gap Roadmap</span>
            </button>
        </div>
      )}

      <div
        className="results-grid"
        role={talentResult ? 'tabpanel' : undefined}
        id={talentResult ? `result-${activeResultTab}-panel` : undefined}
        aria-labelledby={talentResult ? `result-${activeResultTab}-tab` : undefined}
      >
        {(!talentResult || activeResultTab === 'skill') && (
          <>
        {talentResult && (
          <div className="results-view-tabs" role="tablist" aria-label="Skill match detail views">
            <button
              id="results-gaps-tab"
              type="button"
              role="tab"
              aria-selected={activeSkillView === 'gaps'}
              aria-controls="results-gaps-panel"
              className={activeSkillView === 'gaps' ? 'is-active' : ''}
              onClick={() => setActiveSkillView('gaps')}
            >
              Gaps
            </button>
            <button
              id="results-roadmap-tab"
              type="button"
              role="tab"
              aria-selected={activeSkillView === 'roadmap'}
              aria-controls="results-roadmap-panel"
              className={activeSkillView === 'roadmap' ? 'is-active' : ''}
              onClick={showRoadmap}
            >
              Open Roadmap
            </button>
          </div>
        )}
        {activeSkillView === 'gaps' ? (
          <div id={talentResult ? 'results-gaps-panel' : undefined} role={talentResult ? 'tabpanel' : undefined} aria-labelledby={talentResult ? 'results-gaps-tab' : undefined} className="results-view-panel">
        {/* Score Dial & Overview Card */}
        <Card padding="lg" className="score-overview-card">
          <div className="score-dial-wrap">
            <div className="score-dial" role="img" aria-label={`Match score: ${score} percent`}>
              <svg viewBox="0 0 100 100" className="dial-svg" aria-hidden="true">
                <circle cx="50" cy="50" r={radius} className="dial-track" />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="dial-fill"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: dashOffset,
                  }}
                />
              </svg>
              <div className="dial-center-text">
                <span className="dial-num">{score}</span>
                <span className="dial-unit">%</span>
              </div>
            </div>

            <div className="score-details">
              <div className="score-confidence-row">
                <span className="score-title">Evidence Match Score</span>
                <Badge variant={confidenceBadgeVariant} size="sm">
                  {confidence.toUpperCase()} CONFIDENCE
                </Badge>
              </div>
              <p className="score-subtitle">
                Based on direct evidence across {requiredSkillCount} JD-required RADIX skills.
              </p>
              <div className="matched-counter-badges">
                <span className="count-badge matched-count">
                  <Check size={12} strokeWidth={3} />
                  {matched.length} Matched
                </span>
                <span className="count-badge missing-count">
                  <X size={12} strokeWidth={3} />
                  {unassessed.length} Not assessed
                </span>
                {hasCanonicalSkills && <Badge variant="subtle">{notApplicableCount} Not required</Badge>}
              </div>
            </div>
          </div>
        </Card>

        {/* Ambiguity alerts if present */}
        {ambiguityAlerts.length > 0 && (
          <div className="ambiguity-callout-wrap">
            <Callout type="warning" title="Model Ambiguity Notes" icon={<AlertTriangle size={16} />}>
              <ul className="ambiguity-list">
                {ambiguityAlerts.map((alert, i) => (
                  <li key={i}>{alert}</li>
                ))}
              </ul>
            </Callout>
          </div>
        )}

        {/* Matched requirements vs requirements without assessment evidence */}
        <div className={`matched-vs-missing-grid${stackSkillColumns ? ' stacked' : ''}`}>
          {/* Matched Skills */}
          <Card padding="md">
            <CardHeader>
              <div className="skills-col-header">
                <div className="icon-badge matched-badge">
                  <Check size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <CardTitle as="h3">Matched RADIX Skills ({matched.length})</CardTitle>
                  <CardDescription>Requirements confirmed by candidate profile evidence.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {matched.length > 0 ? (
                <div className="matched-skills-list">
                  {matched.map((item, idx) => (
                    <div key={`${item.skill_name}-${idx}`} className="matched-skill-item">
                      <div className="matched-skill-top">
                        <div className="matched-name-group">
                          <strong className="matched-skill-name">{item.skill_name}</strong>
                          <span className="match-type-pill">{item.match_type} match</span>
                        </div>
                        <span className="candidate-level-pill">
                          Level {item.candidate_skill_level}/10
                        </span>
                      </div>
                      {item.candidate_evidence && (
                        <p className="candidate-evidence-text">
                          &ldquo;{item.candidate_evidence}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-subtext">No direct skills matched the JD criteria.</p>
              )}
            </CardContent>
          </Card>

          {/* Not assessed requirements */}
          <Card padding="md">
            <CardHeader>
              <div className="skills-col-header">
                <div className="icon-badge missing-badge">
                  <X size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <CardTitle as="h3">Not Assessed RADIX Skills ({unassessed.length})</CardTitle>
                  <CardDescription>Required by the JD, but without direct profile evidence. These are not confirmed gaps.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {unassessed.length > 0 ? (
                <div className="missing-skills-list">
                {unassessed.map((item, idx) => (
                    <div key={`${item.skill_name}-${idx}`} className="missing-skill-item">
                      <div className="missing-skill-top">
                        <strong className="missing-skill-name">{item.skill_name}</strong>
                        <Badge variant="subtle" size="sm">{item.source === 'technology' ? 'JD TOOL' : 'RADIX CATEGORY'}</Badge>
                      </div>
                      <p className="missing-reason-text">{item.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-subtext">All unique JD requirements have direct supporting profile evidence.</p>
              )}
            </CardContent>
          </Card>
        </div>

          </div>
        ) : (
          <SkillGapRoadmap
            talentResult={talentResult}
            matchResult={matchResult}
            jdData={jdData}
            profile={profile}
            roadmapGraph={roadmapGraph}
            legacyRoadmap={roadmap}
            isLoading={isLoadingRoadmap}
            error={roadmapError}
            onRetry={showRoadmap}
          />
        )}
          </>
        )}

        {talentResult && activeResultTab === 'talent' && (
          <TalentCheckResults talentResult={talentResult} />
        )}

        {talentResult && activeResultTab === 'roadmap' && (
          <SkillGapRoadmap
            talentResult={talentResult}
            matchResult={matchResult}
            jdData={jdData}
            profile={profile}
            roadmapGraph={roadmapGraph}
            legacyRoadmap={roadmap}
            isLoading={isLoadingRoadmap}
            error={roadmapError}
            onRetry={showRoadmap}
          />
        )}

        {/* Navigation & Reset Controls */}
        <div className="results-navigation-footer">
          <div className="footer-left-buttons">
            <Button
              variant="secondary"
              size="md"
              icon={<Edit size={14} />}
              onClick={onEditProfile}
            >
              Modify Profile
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<FileSearch size={14} />}
              onClick={onChangeJd}
            >
              Change Job Description
            </Button>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={<RotateCcw size={16} />}
            onClick={onStartNew}
          >
            Start New Analysis
          </Button>
        </div>
      </div>
    </div>
  )
}

function RoadmapResults({ roadmap, error, isLoading }) {
  return (
    <div id="results-roadmap-panel" role="tabpanel" aria-labelledby="results-roadmap-tab" className="results-view-panel">
      <Card padding="lg" className="recommendations-card">
        <CardHeader>
          <div className="skills-col-header">
            <div className="icon-badge rec-badge"><Lightbulb size={16} strokeWidth={2.2} /></div>
            <div>
              <CardTitle as="h3">Personalized Learning Roadmap</CardTitle>
              <CardDescription>Prioritized next steps based on the completed company assessment.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="roadmap-status" role="status">Generating your roadmap…</p>
          ) : error ? (
            <Callout type="error" title="Roadmap unavailable">{error}</Callout>
          ) : roadmap?.length ? (
            <ol className="roadmap-list">
              {roadmap.map((item, index) => (
                <li key={`${item.week}-${item.focus}-${index}`} className="roadmap-item">
                  <span className="roadmap-week">{item.week}</span>
                  <div>
                    <strong>{item.focus}</strong>
                    {item.tasks?.length > 0 && <ul>{item.tasks.map((task, taskIndex) => <li key={taskIndex}>{task}</li>)}</ul>}
                    <p><b>Milestone:</b> {item.milestone}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="roadmap-status">No roadmap steps are available for this assessment yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TalentCheckResults({ talentResult }) {
  const assessment = talentResult.assessment || talentResult
  const company = talentResult.company?.name || assessment.company || 'Selected company'
  const categories = assessment.skillset_gap || []
  const percentage = (value) => (
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : null
  )
  const readiness = percentage(assessment.readiness_score)
  const coverage = percentage(assessment.coverage_percentage)

  return (
    <>
      <Card padding="lg" className="score-overview-card">
        <CardHeader>
          <div className="skills-col-header">
            <div className="icon-badge rec-badge"><Building2 size={17} /></div>
            <div>
              <CardTitle as="h3">Assessment Overview</CardTitle>
              <CardDescription>A quick view of readiness and assessment coverage for {company}.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="talent-metric-bars">
            <div className="talent-metric-bar" aria-label={readiness == null ? 'Readiness score not assessed' : `Readiness score ${Math.round(readiness)} percent`}>
              <ProgressBar
                value={readiness ?? 0}
                max={100}
                label="Readiness Score"
                valueLabel={readiness == null ? 'Not assessed' : `${Math.round(readiness)}%`}
                size="md"
                variant="accent"
              />
            </div>
            <div className="talent-metric-bar" aria-label={coverage == null ? 'Assessment coverage not assessed' : `Assessment coverage ${Math.round(coverage)} percent`}>
              <ProgressBar
                value={coverage ?? 0}
                max={100}
                label="Assessment Coverage"
                valueLabel={coverage == null ? 'Not assessed' : `${Math.round(coverage)}%`}
                size="md"
                variant="success"
              />
            </div>
          </div>
          <div className="matched-counter-badges">
            <span className="count-badge matched-count">{assessment.skills_meeting_requirement || 0} Meets requirement</span>
            <span className="count-badge missing-count">{assessment.skills_below_requirement || 0} Below requirement</span>
            <Badge variant="subtle">{assessment.skills_not_assessed || 0} Not assessed</Badge>
          </div>
        </CardContent>
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle as="h3">Category assessment ({assessment.assessed_categories || 0}/{assessment.total_categories || categories.length})</CardTitle>
          <CardDescription>Candidate evidence and skill levels for each RADIX category.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="matched-skills-list">
            {categories.map((item) => {
              const status = item.meets_requirement === true ? 'success' : item.meets_requirement === false ? 'error' : 'subtle'
              const statusText = item.meets_requirement === true ? 'Meets requirement' : item.meets_requirement === false ? 'Below requirement' : 'Not assessed'
              return (
                <div key={item.category_code} className="matched-skill-item">
                  <div className="matched-skill-top">
                    <div className="matched-name-group"><strong className="matched-skill-name">{item.category_name}</strong><span className="match-type-pill">{item.category_code}</span></div>
                    <Badge variant={status} size="sm">{statusText}</Badge>
                  </div>
                  <p className="candidate-evidence-text">
                    Candidate level: {item.candidate_level ?? 'Not assessed'} · Required level: {item.required_level}/10
                  </p>
                  {item.evidence?.length > 0 && <p className="candidate-evidence-text">{item.evidence.join(' · ')}</p>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
