import { useEffect, useState } from 'react'
import {
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout, LoadingOverlay } from '../ui'
import './Step5SkillMatching.css'

export function Step5SkillMatching({
  profile,
  jdData,
  matchResult,
  onRunMatch,
  onBack,
  onNext,
  isMatching = false,
  error = null,
}) {
  const [matchAttempted, setMatchAttempted] = useState(false)

  // Trigger match if not already calculated
  useEffect(() => {
    if (!matchResult && !isMatching && !error && !matchAttempted) {
      setMatchAttempted(true)
      onRunMatch()
    }
  }, [matchResult, isMatching, error, matchAttempted, onRunMatch])

  const candidateSkillsCount = profile?.skills?.length || 0
  const jdCategoriesCount = Object.keys(jdData?.radix_categories || {}).length
  const jdTechCount = jdData?.technologies?.length || 0

  return (
    <div className="wizard-step-container">
      <div className="wizard-step-header">
        <h2>Step 5: Compute Role Alignment &amp; Skill Matching</h2>
        <p>
          Executing deep comparison between evaluated candidate competencies and the job description requirements using the RADIX semantic matching pipeline.
        </p>
      </div>

      <div className="step5-body">
        {isMatching && (
          <Card padding="lg">
            <div className="matching-in-progress">
              <LoadingOverlay message="Running semantic skill matching pipeline…" />
              <div className="matching-stages-hint">
                <span>Comparing candidate evidence against role expectations</span>
                <span>Calculating priority weights for matched &amp; missing skills</span>
              </div>
            </div>
          </Card>
        )}

        {error && !isMatching && (
          <Card padding="lg">
            <Callout type="error" icon={<AlertCircle size={18} />}>
              {error}
            </Callout>
            <div className="matching-retry-actions">
              <Button variant="primary" onClick={onRunMatch} icon={<RotateCcw size={15} />}>
                Retry Matching
              </Button>
              <Button variant="ghost" onClick={onBack}>
                Review Inputs
              </Button>
            </div>
          </Card>
        )}

        {matchResult && !isMatching && (
          <Card padding="lg">
            <CardHeader>
              <div className="match-ready-header">
                <div className="match-ready-icon" aria-hidden="true">
                  <CheckCircle2 size={24} strokeWidth={2} />
                </div>
                <div>
                  <CardTitle as="h3">Analysis Complete</CardTitle>
                  <CardDescription>
                    Alignment successfully computed across all technical categories and named technologies.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="match-summary-stats">
                <div className="stat-pill">
                  <span className="stat-pill-label">Candidate Skills Evaluated</span>
                  <strong className="stat-pill-val">{candidateSkillsCount}</strong>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">JD Categories Compared</span>
                  <strong className="stat-pill-val">{jdCategoriesCount}</strong>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Matched Skills Discovered</span>
                  <strong className="stat-pill-val stat-val-matched">
                    {matchResult.canonical_skills
                      ? matchResult.canonical_skills.filter((item) => item.status === 'matched').length
                      : (matchResult.matched_skills?.length || 0)}
                  </strong>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Not Assessed Skills</span>
                  <strong className="stat-pill-val stat-val-missing">
                    {matchResult.canonical_skills
                      ? matchResult.canonical_skills.filter((item) => item.status === 'not_assessed').length
                      : (matchResult.unassessed_skills?.length || matchResult.missing_skills?.length || 0)}
                  </strong>
                </div>
              </div>

              <div className="wizard-action-bar">
                <Button
                  variant="ghost"
                  size="md"
                  icon={<ArrowLeft size={16} />}
                  onClick={onBack}
                >
                  Back to JD Review
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onNext}
                  iconRight={<ArrowRight size={16} />}
                >
                  View Complete Match Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
