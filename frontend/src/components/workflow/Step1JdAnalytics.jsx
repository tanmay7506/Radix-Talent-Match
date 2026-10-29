import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Tag as TagIcon,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout, Tag, Badge, LoadingOverlay } from '../ui'
import './Step1JdAnalytics.css'

export function Step1JdAnalytics({
  jdData,
  onRetry,
  onBack,
  onNext,
  isProcessing = false,
  error = null,
}) {
  const nonEmptyCategories = jdData?.radix_categories
    ? Object.entries(jdData.radix_categories).filter(([, skills]) => Array.isArray(skills) && skills.length > 0)
    : []

  const totalSkillsCount = nonEmptyCategories.reduce((acc, [, skills]) => acc + skills.length, 0)
  const technologies = jdData?.technologies || []

  return (
    <div className="wizard-step-container">
      <div className="wizard-step-header">
        <h2>Step 1: Review Extracted Role Requirements</h2>
        <p>
          The AI engine has parsed the job description into standardized RADIX competency categories and specific technical tools. Review what the position requires before matching.
        </p>
      </div>

      <div className="step4-content">
        {isProcessing && (
          <LoadingOverlay message="Extracting job requirements from document…" />
        )}

        {error && !isProcessing && (
          <Card padding="lg">
            <Callout type="error" icon={<AlertCircle size={18} />}>
              {error}
            </Callout>
            <div className="error-retry-row">
              <Button variant="secondary" onClick={onRetry} icon={<RotateCcw size={15} />}>
                Retry Analysis
              </Button>
              <Button variant="ghost" onClick={onBack}>
                Modify Job Description
              </Button>
            </div>
          </Card>
        )}

        {jdData && !isProcessing && !error && (
          <>
            <Callout type="success" icon={<CheckCircle2 size={16} />}>
              Successfully parsed job description: identified {nonEmptyCategories.length} RADIX competency categories ({totalSkillsCount} individual skills) and {technologies.length} required technologies.
            </Callout>

            <div className="jd-review-grid">
              {/* Specific Technologies Card */}
              <Card padding="md">
                <CardHeader>
                  <div className="card-header-with-badge">
                    <CardTitle as="h3">Named Technologies &amp; Tools</CardTitle>
                    <Badge variant="subtle" size="sm">
                      {technologies.length} Tools
                    </Badge>
                  </div>
                  <CardDescription>
                    Frameworks, languages, cloud platforms, and databases requested.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {technologies.length > 0 ? (
                    <div className="tech-tags-flow">
                      {technologies.map((tool) => (
                        <Tag key={tool} className="tech-tool-pill">
                          <TagIcon size={11} className="pill-icon" aria-hidden="true" />
                          {tool}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-subtext">No specific tools or frameworks explicitly identified.</p>
                  )}
                </CardContent>
              </Card>

              {/* RADIX Categories Card */}
              <Card padding="md">
                <CardHeader>
                  <div className="card-header-with-badge">
                    <CardTitle as="h3">Categorized Role Demands</CardTitle>
                    <Badge variant="accent" size="sm">
                      {nonEmptyCategories.length} Categories
                    </Badge>
                  </div>
                  <CardDescription>
                    Skills mapped into standard technical competencies.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nonEmptyCategories.length > 0 ? (
                    <div className="categories-review-list">
                      {nonEmptyCategories.map(([cat, skills]) => (
                        <div key={cat} className="category-review-box">
                          <div className="category-review-header">
                            <span className="category-title">{cat}</span>
                            <span className="category-count">{skills.length} skills</span>
                          </div>
                          <div className="category-tags-flow">
                            {skills.map((s) => (
                              <Tag key={s} className="jd-skill-pill">{s}</Tag>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-subtext">No general competency categories were extracted.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Bar */}
            <div className="wizard-action-bar">
              <Button
                variant="ghost"
                size="md"
                icon={<ArrowLeft size={16} />}
                onClick={onBack}
              >
                Change Job Description
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={onNext}
                iconRight={<ArrowRight size={16} />}
              >
                Match Candidate with Role
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
