import { useMemo } from 'react'
import {
  Building2,
  Target,
  Info,
  FolderOpen,
  FileText,
  User,
  Link2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'
import './AnalysisPage.css'

/**
 * Company-Wise Analysis & Skill Matching page.
 *
 * Company analysis: no dedicated backend endpoint exists for aggregate company data.
 * The panel clearly communicates this and showcases requirements extracted from the JD.
 *
 * Skill matching: client-side match engine computing overlap between the candidate's
 * parsed profile and the JD-extracted skill categories.
 */
export default function AnalysisPage({ profile, jdData, onNavigate }) {
  return (
    <div>
      <div className="analysis-page-header">
        <h1>Company Analysis &amp; Skill Matching</h1>
        <p>Explore role-specific requirements and evaluate how your candidate profile compares.</p>
      </div>

      <div className="analysis-layout">
        {/* ── Left: Company-Wise Analysis ───────────────────────── */}
        <CompanyPanel jdData={jdData} onNavigate={onNavigate} />

        {/* ── Right: Skill Matching ─────────────────────────────── */}
        <SkillMatchPanel profile={profile} jdData={jdData} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

/* ─── Company Analysis Panel ────────────────────────────────────────────── */
function CompanyPanel({ jdData, onNavigate }) {
  return (
    <div className="analysis-panel">
      <div className="analysis-panel-title">
        <div className="analysis-panel-title-icon" aria-hidden="true">
          <Building2 size={18} strokeWidth={2} />
        </div>
        Company-Wise Skill Analysis
      </div>

      {/* Transparent notice about backend availability */}
      <div className="company-placeholder-notice">
        <span className="company-placeholder-notice-icon" aria-hidden="true">
          <Info size={15} strokeWidth={2} />
        </span>
        <span>
          Aggregate company-wise skill data requires a dedicated analytics data source
          which is not yet available in this version. The panel below shows
          requirements extracted from the uploaded job description, which represents
          one role at a specific company.
        </span>
      </div>

      {jdData ? (
        <div>
          {/* Show what we do have: JD-extracted requirements */}
          <div className="jd-summary-header">Skills Required by This Role</div>

          {Object.entries(jdData.radix_categories)
            .filter(([, skills]) => skills.length > 0)
            .map(([cat, skills]) => (
              <div key={cat} className="jd-summary-cat" style={{ marginBottom: '12px' }}>
                <div className="jd-summary-cat-name">{cat}</div>
                <div className="jd-summary-tags">
                  {skills.map((s) => (
                    <span key={s} className="jd-summary-tag">{s}</span>
                  ))}
                </div>
              </div>
            ))
          }

          {jdData.technologies?.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <div className="jd-summary-cat-name" style={{ marginBottom: '8px' }}>
                Technologies &amp; Tools
              </div>
              <div className="jd-tech-list">
                {jdData.technologies.map((t) => (
                  <span key={t} className="jd-tech-tag">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <FolderOpen size={36} strokeWidth={1.8} />
          </span>
          <h3>No job description analysed</h3>
          <p>Upload a job description on the Resume &amp; JD page to see company skill requirements here.</p>
          <button
            id="analysis-to-resume-btn"
            className="neo-btn neo-btn-accent"
            onClick={() => onNavigate('resume')}
            style={{ marginTop: '12px' }}
          >
            Upload a Job Description
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Skill Match Panel ─────────────────────────────────────────────────── */
function SkillMatchPanel({ profile, jdData, onNavigate }) {
  const matchResult = useMemo(() => {
    if (!profile || !jdData) return null
    return computeMatch(profile, jdData)
  }, [profile, jdData])

  return (
    <div className="analysis-panel">
      <div className="analysis-panel-title">
        <div className="analysis-panel-title-icon" aria-hidden="true">
          <Target size={18} strokeWidth={2} />
        </div>
        Candidate Skill Match
      </div>

      {!profile && !jdData && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <Link2 size={36} strokeWidth={1.8} />
          </span>
          <h3>Profile &amp; JD required</h3>
          <p>
            Build a candidate profile and upload a job description to see the skill match.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button id="match-to-profile-btn" className="neo-btn neo-btn-accent" onClick={() => onNavigate('profile')}>
              Build Profile
            </button>
            <button id="match-to-resume-btn" className="neo-btn neo-btn-ghost" onClick={() => onNavigate('resume')}>
              Upload JD
            </button>
          </div>
        </div>
      )}

      {profile && !jdData && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <FileText size={36} strokeWidth={1.8} />
          </span>
          <h3>Job description needed</h3>
          <p>Upload a job description to compare against your profile.</p>
          <button id="match-need-jd-btn" className="neo-btn neo-btn-accent" onClick={() => onNavigate('resume')} style={{ marginTop: '12px' }}>
            Upload Job Description
          </button>
        </div>
      )}

      {!profile && jdData && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <User size={36} strokeWidth={1.8} />
          </span>
          <h3>Candidate profile needed</h3>
          <p>Build your profile to see how you compare to this job.</p>
          <button id="match-need-profile-btn" className="neo-btn neo-btn-accent" onClick={() => onNavigate('profile')} style={{ marginTop: '12px' }}>
            Build Your Profile
          </button>
        </div>
      )}

      {matchResult && (
        <MatchResultView result={matchResult} onNavigate={onNavigate} />
      )}
    </div>
  )
}

/* ─── Match Result View ─────────────────────────────────────────────────── */
function MatchResultView({ result, onNavigate }) {
  const { scorePct, matched, missing, profileSkillBars } = result
  const circumference = 2 * Math.PI * 40  // r=40
  const dashOffset = circumference - (scorePct / 100) * circumference

  return (
    <>
      {/* Overall score ring */}
      <div className="match-score-section" aria-label={`Overall skill match: ${scorePct}%`}>
        <div className="match-score-ring" role="img" aria-label={`${scorePct}% match`}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="8" fill="none"/>
            <circle
              cx="50" cy="50" r="40"
              stroke="var(--color-secondary)" strokeWidth="8" fill="none"
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
        <div className="match-score-label">Overall Skill Match</div>
        <div className="match-score-sub">
          {matched.length} matched · {missing.length} gaps identified
        </div>
      </div>

      {/* Matched vs Missing columns */}
      {(matched.length > 0 || missing.length > 0) && (
        <div className="match-columns">
          {matched.length > 0 && (
            <div>
              <div className="match-col-title matched" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} strokeWidth={2.5} />
                <span>Matched Skills</span>
              </div>
              <div className="match-skill-list">
                {matched.map((s) => (
                  <div key={s} className="match-skill-item matched">
                    <span className="match-dot matched" aria-hidden="true"/>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <div className="match-col-title missing" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <X size={14} strokeWidth={2.5} />
                <span>Skill Gaps</span>
              </div>
              <div className="match-skill-list">
                {missing.map((s) => (
                  <div key={s} className="match-skill-item missing">
                    <span className="match-dot missing" aria-hidden="true"/>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidate skill level bars */}
      {profileSkillBars.length > 0 && (
        <div>
          <div className="jd-summary-header" style={{ marginBottom: '12px' }}>
            Your Skill Levels
          </div>
          <div className="skill-bars-section">
            {profileSkillBars.map((s) => (
              <div key={s.name} className="skill-bar-row">
                <div className="skill-bar-label">
                  <span>{s.name}</span>
                  <span>{s.level}/10</span>
                </div>
                <div className="skill-bar-track">
                  <div className="skill-bar-fill" style={{ width: `${(s.level / 10) * 100}%` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Important disclaimer */}
      <div className="match-disclaimer" role="note">
        <span className="match-disclaimer-icon" aria-hidden="true">
          <AlertCircle size={15} strokeWidth={2} />
        </span>
        <span>
          A "gap" means this skill was not demonstrated in your uploaded resume — it does not
          confirm you lack the skill. Scores are heuristic estimates based on your document, not guaranteed employability metrics.
          Results marked as uncertain should be reviewed manually.
        </span>
      </div>

      <div className="analysis-nav-cta">
        <button
          id="analysis-update-profile-btn"
          className="neo-btn neo-btn-ghost"
          onClick={() => onNavigate('profile')}
        >
          Update Profile
        </button>
        <button
          id="analysis-update-jd-btn"
          className="neo-btn neo-btn-ghost"
          onClick={() => onNavigate('resume')}
        >
          Change Job Description
        </button>
      </div>
    </>
  )
}

/* ─── Client-side matching logic ────────────────────────────────────────── */
function computeMatch(profile, jdData) {
  const jdCategories = new Set(
    Object.entries(jdData.radix_categories)
      .filter(([, skills]) => skills.length > 0)
      .map(([cat]) => cat.toLowerCase())
  )

  const profileSkillNames = profile.skills.map((s) => s.skill_name)

  const matched = profileSkillNames.filter((n) => jdCategories.has(n.toLowerCase()))
  const missing = [...jdCategories].filter(
    (cat) => !profileSkillNames.map((n) => n.toLowerCase()).includes(cat)
  ).map((cat) => {
    const key = Object.keys(jdData.radix_categories).find((k) => k.toLowerCase() === cat)
    return key || cat
  })

  const total = matched.length + missing.length
  const scorePct = total > 0 ? Math.round((matched.length / total) * 100) : 0

  const profileSkillBars = profile.skills
    .filter((s) => matched.includes(s.skill_name))
    .sort((a, b) => b.skill_level - a.skill_level)
    .map((s) => ({ name: s.skill_name, level: s.skill_level }))

  return { scorePct, matched, missing, profileSkillBars }
}
