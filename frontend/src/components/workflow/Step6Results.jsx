import { useState } from 'react'
import {
  Check,
  X,
  Target,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  Edit,
  FileSearch,
  Award,
  Sparkles,
  Building2,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout, Badge, ProgressBar } from '../ui'
import './Step6Results.css'

export function Step6Results({
  matchResult,
  profile,
  onStartNew,
  onEditProfile,
  onChangeJd,
  talentResult = null,
  stepNumber = 6,
  stackSkillColumns = false,
}) {
  const [activeResultTab, setActiveResultTab] = useState('skill')
  if (!matchResult) return null

  const score = typeof matchResult.match_score === 'number' ? Math.round(matchResult.match_score) : 0
  const confidence = matchResult.match_confidence || 'medium'
  const matched = matchResult.matched_skills || []
  const missing = matchResult.missing_skills || []
  const sortedMissing = missing.map((item, index) => ({ item, index })).sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 }
    const priority = (item) => String(item.priority || 'medium').toLowerCase().replace(/\s+priority$/, '')
    return (rank[priority(a.item)] ?? 1) - (rank[priority(b.item)] ?? 1) || a.index - b.index
  }).map(({ item }) => item)
  const gaps = matchResult.skill_gaps || []
  const recommendations = matchResult.recommendations || []
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

  return (
    <div className="wizard-step-container">
      <div className="results-header-banner">
        <div>
          <h2>{talentResult ? `Step ${stepNumber}: Combined Match Results` : `Step ${stepNumber}: Role Alignment & Skill Gap Report`}</h2>
          <p>
            Candidate match report for <strong className="candidate-name-highlight">{profile?.name || 'Candidate'}</strong> evaluated against the target job description.
          </p>
        </div>
        <div className="results-header-actions">
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
                <span className="score-title">Role Match Score</span>
                <Badge variant={confidenceBadgeVariant} size="sm">
                  {confidence.toUpperCase()} CONFIDENCE
                </Badge>
              </div>
              <p className="score-subtitle">
                Based on evidence signals across {matched.length + missing.length} role requirements.
              </p>
              <div className="matched-counter-badges">
                <span className="count-badge matched-count">
                  <Check size={12} strokeWidth={3} />
                  {matched.length} Matched
                </span>
                <span className="count-badge missing-count">
                  <X size={12} strokeWidth={3} />
                  {missing.length} Gaps
                </span>
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

        {/* Matched Skills vs Missing Skills Columns */}
        <div className={`matched-vs-missing-grid${stackSkillColumns ? ' stacked' : ''}`}>
          {/* Matched Skills */}
          <Card padding="md">
            <CardHeader>
              <div className="skills-col-header">
                <div className="icon-badge matched-badge">
                  <Check size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <CardTitle as="h3">Matched Competencies ({matched.length})</CardTitle>
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

          {/* Missing Skills */}
          <Card padding="md">
            <CardHeader>
              <div className="skills-col-header">
                <div className="icon-badge missing-badge">
                  <X size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <CardTitle as="h3">Identified Skill Gaps ({missing.length})</CardTitle>
                  <CardDescription>Required competencies without verified evidence.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {missing.length > 0 ? (
                <div className="missing-skills-list">
                {sortedMissing.map((item, idx) => (
                    <div key={`${item.skill_name}-${idx}`} className="missing-skill-item">
                      <div className="missing-skill-top">
                        <strong className="missing-skill-name">{item.skill_name}</strong>
                        <Badge
                          variant={String(item.priority || 'medium').toLowerCase().startsWith('high') ? 'error' : String(item.priority || '').toLowerCase().startsWith('low') ? 'success' : 'warning'}
                          size="sm"
                        >
                          {item.priority?.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                      <p className="missing-reason-text">{item.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-subtext">Outstanding! No required competency gaps were found.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actionable Recommendations */}
        {recommendations.length > 0 && (
          <Card padding="md" className="recommendations-card">
            <CardHeader>
              <div className="skills-col-header">
                <div className="icon-badge rec-badge">
                  <Lightbulb size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <CardTitle as="h3">Actionable Next Steps to Close Gaps</CardTitle>
                  <CardDescription>Targeted suggestions to improve candidate qualifications for this role.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="recommendations-flow">
                {recommendations.map((rec, i) => (
                  <div key={i} className="rec-item">
                    <strong className="rec-item-title">{rec.skill_name}</strong>
                    <p className="rec-item-action">{rec.action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}

        {talentResult && activeResultTab === 'talent' && (
          <TalentCheckResults talentResult={talentResult} />
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

function TalentCheckResults({ talentResult }) {
  const assessment = talentResult.assessment || talentResult
  const company = talentResult.company?.name || assessment.company || 'Selected company'
  const categories = assessment.skillset_gap || []
  const readiness = assessment.readiness_score

  return (
    <>
      <Card padding="lg" className="score-overview-card">
        <CardHeader>
          <div className="skills-col-header">
            <div className="icon-badge rec-badge"><Building2 size={17} /></div>
            <div>
              <CardTitle as="h3">Talent Check · {company}</CardTitle>
              <CardDescription>{assessment.role ? `Assessment for ${assessment.role}` : 'Candidate skill levels compared with company requirements.'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={readiness ?? 0}
            max={100}
            label="Readiness score"
            valueLabel={readiness == null ? 'Not assessed' : `${Math.round(readiness)}%`}
          />
          <ProgressBar
            value={assessment.coverage_percentage || 0}
            max={100}
            label="Assessment coverage"
            valueLabel={`${Math.round(assessment.coverage_percentage || 0)}%`}
          />
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
