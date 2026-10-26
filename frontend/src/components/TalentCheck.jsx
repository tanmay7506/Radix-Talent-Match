import { useState, useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import './TalentCheck.css'

export default function TalentCheck({ profile, onDemoProfileRequested }) {
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [mode, setMode] = useState('single-analyze')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const resultsRef = useRef(null)

  // Fetch company directory from live Supabase on mount
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch('/talent-check/companies')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setCompanies(Array.isArray(data) ? data : [])
        // Default to Google if available, or first
        const defaultComp = data.find(c => c.name.toLowerCase().includes('google')) || data[0]
        if (defaultComp) {
          setSelectedCompanyId(defaultComp.company_id)
        }
      } catch (err) {
        console.error('Failed to load companies from Supabase:', err)
        setError('Could not connect to Supabase company directory.')
      }
    }
    loadCompanies()
  }, [])

  // Filter companies by search query
  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies
    const q = search.trim().toLowerCase()
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.short_name && c.short_name.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    )
  }, [companies, search])

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.company_id === selectedCompanyId) || null
  }, [companies, selectedCompanyId])

  // Run Talent Check against selected company
  const handleRunTalentCheck = async () => {
    if (!profile) {
      setError('Please upload a resume or load a demo profile first.')
      return
    }
    if (!selectedCompanyId) {
      setError('Please select a target company from the database.')
      return
    }

    setIsEvaluating(true)
    setError(null)

    const endpoint = mode === 'single-analyze'
      ? `/talent-check/analyze?company_id=${selectedCompanyId}`
      : `/talent-check?company_id=${selectedCompanyId}`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error (HTTP ${res.status})`)
      }

      const data = await res.json()
      setResults(data)

      if (resultsRef.current) {
        setTimeout(() => {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (err) {
      setError(err.message || 'Failed to evaluate Talent Check.')
      setResults(null)
    } finally {
      setIsEvaluating(false)
    }
  }

  // Animation for results card
  useEffect(() => {
    if (results && resultsRef.current) {
      gsap.fromTo(resultsRef.current,
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      )
    }
  }, [results])

  const assessment = results?.assessment || results || null
  const analysis = results?.analysis || null

  const getReadinessClass = (score) => {
    if (score == null) return ''
    if (score >= 75) return 'readiness-high'
    if (score >= 50) return 'readiness-medium'
    return 'readiness-low'
  }

  return (
    <section id="talent-check" className="talent-check-section">
      <div className="tc-card neo-card">
        <div className="tc-header">
          <h2 className="tc-title">
            <span>🎯</span> Role 4: Company-Specific Talent Check
          </h2>
          <p className="tc-sub">
            Compare candidate profiler competencies against real enterprise skill bars sourced live from Supabase.
          </p>
        </div>

        {/* Candidate Status Notice */}
        {!profile && (
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--neo-shadow-inset)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text)' }}>
              ℹ️ No candidate profile loaded yet. Upload a resume above, or load our test candidate to explore Talent Check immediately:
            </div>
            {onDemoProfileRequested && (
              <button
                type="button"
                className="neo-btn neo-btn-accent"
                style={{ fontSize: '12px', padding: '8px 18px' }}
                onClick={onDemoProfileRequested}
              >
                ⚡ Load Demo Candidate (Rohan Verma)
              </button>
            )}
          </div>
        )}

        {/* Company Selector & Search */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>
              Target Enterprise Company
            </label>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {companies.length} companies available in Supabase
            </span>
          </div>

          <div className="company-search-box">
            <input
              type="text"
              className="tc-input"
              placeholder="Search companies by name or category (e.g. Google, Apple, FinTech)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="neo-btn"
                style={{ padding: '10px 16px' }}
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="tc-select"
            size={5}
            value={selectedCompanyId || ''}
            onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
          >
            {filteredCompanies.map((c) => (
              <option key={c.company_id} value={c.company_id}>
                {c.name} ({c.category || 'Technology'})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Company Preview Card */}
        {selectedCompany && (
          <div className="company-preview-card">
            <div className="company-logo-wrap">
              {selectedCompany.logo_url ? (
                <img
                  src={selectedCompany.logo_url}
                  alt={selectedCompany.name}
                  className="company-logo-img"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span style={{ fontSize: '20px' }}>🏢</span>
              )}
            </div>
            <div className="company-preview-info">
              <div className="company-preview-name">{selectedCompany.name}</div>
              <div className="company-preview-meta">
                ID: {selectedCompany.company_id} · {selectedCompany.category || 'Enterprise'} · Source: Supabase
              </div>
            </div>
            <span className="stat-pill stat-pill-green">Selected</span>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="mode-toggle-group">
          <label
            className={`mode-option-card ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            <span style={{ fontSize: '20px' }}>📊</span>
            <div>
              <div className="mode-option-title">Talent Check (Deterministic)</div>
              <div className="mode-option-sub">Direct 12-skill mathematical gap scoring</div>
            </div>
          </label>

          <label
            className={`mode-option-card ${mode === 'single-analyze' ? 'active' : ''}`}
            onClick={() => setMode('single-analyze')}
          >
            <span style={{ fontSize: '20px' }}>✨</span>
            <div>
              <div className="mode-option-title">Talent Check + AI Analysis</div>
              <div className="mode-option-sub">Deterministic scoring + Gemini/Groq grounded synthesis</div>
            </div>
          </label>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(252, 129, 129, 0.15)',
            borderLeft: '4px solid var(--error)',
            color: 'var(--error)',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          className="neo-btn neo-btn-accent"
          style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 600 }}
          disabled={isEvaluating}
          onClick={handleRunTalentCheck}
        >
          {isEvaluating ? 'Evaluating against Supabase…' : `Run Talent Check against ${selectedCompany?.short_name || 'Selected Company'}`}
        </button>
      </div>

      {/* Results Section */}
      {assessment && (
        <div ref={resultsRef} className="results-card neo-card">
          <div className="results-top-bar">
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)' }}>
                {assessment.company}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Evaluated candidate: <strong>{profile?.name || 'Candidate'}</strong> · Role: {assessment.role || 'Software Engineering'}
              </p>

              <div className="stat-pills-row">
                <span className="stat-pill stat-pill-green">
                  ✔ {assessment.skills_meeting_requirement} Meeting Requirement
                </span>
                <span className="stat-pill stat-pill-orange">
                  ⚠ {assessment.skills_below_requirement} Below Requirement
                </span>
                <span className="stat-pill stat-pill-gray">
                  — {assessment.skills_not_assessed} Not Assessed
                </span>
                <span className="stat-pill stat-pill-blue">
                  Coverage: {assessment.coverage_percentage}%
                </span>
              </div>
            </div>

            <div className={`readiness-score-badge ${getReadinessClass(assessment.readiness_score)}`}>
              {assessment.readiness_score != null ? `${assessment.readiness_score.toFixed(1)}%` : 'N/A'}
              <span className="readiness-sublabel">Readiness</span>
            </div>
          </div>

          {/* Coverage Bar */}
          <div className="coverage-container">
            <div className="coverage-track">
              <div
                className="coverage-fill"
                style={{ width: `${assessment.coverage_percentage}%` }}
              />
            </div>
            <div className="coverage-text">
              {assessment.assessed_categories} of {assessment.total_categories} RADIX competency categories assessed.
              Readiness calculated strictly across assessed skills.
            </div>
          </div>

          {/* 12-Skill Gap Comparison Table */}
          <div className="tc-table-wrapper">
            <table className="tc-table">
              <thead>
                <tr>
                  <th>Competency Category</th>
                  <th>Candidate Level</th>
                  <th>Required Level</th>
                  <th>Shortfall Gap</th>
                  <th>Evaluation Status</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {assessment.skillset_gap?.map((s) => {
                  const isUnassessed = s.candidate_level == null
                  return (
                    <tr key={s.category_code}>
                      <td>
                        <strong>{s.category_name}</strong>{' '}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ({s.category_code})
                        </span>
                      </td>
                      <td>
                        {isUnassessed ? (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          <span><strong>{s.candidate_level}</strong>/10</span>
                        )}
                      </td>
                      <td>
                        <strong>{s.required_level}</strong>/10
                      </td>
                      <td>
                        {isUnassessed ? (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        ) : s.gap > 0 ? (
                          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>-{s.gap}</span>
                        ) : (
                          <span style={{ color: 'var(--success)' }}>None</span>
                        )}
                      </td>
                      <td>
                        {isUnassessed ? (
                          <span className="status-badge status-unassessed">— Not Assessed</span>
                        ) : s.meets_requirement ? (
                          <span className="status-badge status-meets">✔ Meets</span>
                        ) : (
                          <span className="status-badge status-gap">⚠ Gap</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                          {s.confidence || '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* AI Analysis Section */}
          {analysis && (
            <div className="ai-analysis-container">
              {/* AI Status Banner */}
              <div className="ai-status-banner ai-status-complete">
                <span>✨</span>
                <div>
                  <strong>AI Status: {analysis.ai_status}</strong>
                  <span style={{ opacity: 0.8, fontSize: '11px', marginLeft: '8px' }}>
                    ({analysis.analysis_mode})
                  </span>
                  <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.9 }}>
                    Grounded AI analysis generated for {assessment.company}.
                  </div>
                </div>
              </div>

              {/* AI Overview */}
              {(analysis.ai_overview || analysis.summary) && (
                <div className="ai-overview-card neo-inset">
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-h)' }}>
                    Executive Synthesis
                  </div>
                  <p>{analysis.ai_overview || analysis.summary}</p>
                </div>
              )}

              {/* Strengths & Improvement Areas */}
              <div className="ai-grid-2col">
                <div>
                  <h4 className="ai-section-title"><span>🌟</span> Key Strengths</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.strengths?.map((str, idx) => (
                      <div key={idx} className="ai-item-card neo-card-sm">
                        <div className="ai-item-header">{str.category || str.name || 'Strength'}</div>
                        <div className="ai-item-detail">{str.reason || str.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="ai-section-title"><span>📈</span> Focus Areas for Growth</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.improvement_areas?.map((imp, idx) => (
                      <div key={idx} className="ai-item-card neo-card-sm">
                        <div className="ai-item-header">{imp.category}</div>
                        <div className="ai-item-meta">
                          Current: L{imp.current_level} · Required: L{imp.required_level} (Gap: -{imp.gap})
                        </div>
                        <div className="ai-item-detail">{imp.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4-Week Learning Roadmap */}
              {analysis.learning_roadmap?.length > 0 && (
                <div>
                  <h4 className="ai-section-title"><span>🗺️</span> Recommended 4-Week Roadmap</h4>
                  <div className="roadmap-timeline">
                    {analysis.learning_roadmap.map((week, idx) => (
                      <div key={idx} className="roadmap-week-card neo-card-sm">
                        <div className="roadmap-week-badge">Week {week.week || idx + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '14px' }}>
                            {week.focus}
                          </div>
                          {Array.isArray(week.tasks) && week.tasks.length > 0 && (
                            <ul className="roadmap-tasks">
                              {week.tasks.map((task, tIdx) => (
                                <li key={tIdx}>{task}</li>
                              ))}
                            </ul>
                          )}
                          {week.milestone && (
                            <div className="roadmap-milestone">
                              🎯 Milestone: {week.milestone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Projects */}
              {analysis.recommended_projects?.length > 0 && (
                <div>
                  <h4 className="ai-section-title"><span>🚀</span> Practical Recommended Projects</h4>
                  <div className="ai-grid-2col">
                    {analysis.recommended_projects.map((proj, idx) => (
                      <div key={idx} className="ai-item-card neo-card-sm">
                        <div className="ai-item-header">{proj.name}</div>
                        <div className="ai-item-detail">{proj.purpose}</div>
                        {Array.isArray(proj.deliverables) && (
                          <ul style={{ fontSize: '12px', paddingLeft: '16px', marginTop: '6px', color: 'var(--text-muted)' }}>
                            {proj.deliverables.map((d, dIdx) => (
                              <li key={dIdx}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
