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
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout, Badge } from '../ui'
import './Step6Results.css'

export function Step6Results({
  matchResult,
  profile,
  onStartNew,
  onEditProfile,
  onChangeJd,
}) {
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
          <h2>Step 6: Role Alignment &amp; Skill Gap Report</h2>
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

      <div className="results-grid">
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
        <div className="matched-vs-missing-grid">
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
