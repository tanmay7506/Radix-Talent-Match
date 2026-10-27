import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
import { Badge, Button, Callout, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader, ProgressBar, Spinner } from '../ui'
import './CompanyMatchesPage.css'

const resultCache = new Map()
const pendingRequests = new Map()

function loadMatches(skills) {
  const key = JSON.stringify(skills)
  if (resultCache.has(key)) return Promise.resolve(resultCache.get(key))
  if (pendingRequests.has(key)) return pendingRequests.get(key)
  const request = api.getCompanyMatches(skills).then((result) => {
    resultCache.set(key, result)
    return result
  }).finally(() => pendingRequests.delete(key))
  pendingRequests.set(key, request)
  return request
}

export function CompanyMatchesPage({ profile, onNavigate }) {
  const pageRef = useRef(null)
  const skills = (profile?.skills || []).filter((skill) => skill?.skill_code && Number.isInteger(Number(skill.skill_level)))
    .map(({ skill_code, skill_level }) => ({ skill_code, skill_level: Number(skill_level) }))
  const skillKey = JSON.stringify(skills)
  const [resultState, setResultState] = useState(() => ({ key: skillKey, value: resultCache.get(skillKey) || null }))
  const [errorState, setErrorState] = useState({ key: '', value: '' })
  const [retry, setRetry] = useState(0)
  const result = resultState.key === skillKey ? resultState.value : resultCache.get(skillKey) || null
  const error = errorState.key === skillKey ? errorState.value : ''

  useEffect(() => {
    if (!skills.length) return
    loadMatches(skills)
      .then((value) => setResultState({ key: skillKey, value }))
      .catch((err) => { if (err.name !== 'AbortError') setErrorState({ key: skillKey, value: err.message || 'Unable to load company matches.' }) })
  // skillKey captures the exact request data and avoids refetches from profile object identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillKey, retry])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const context = gsap.context(() => {
      gsap.fromTo('.company-match-page-card',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.28, stagger: 0.05, ease: 'power2.out', clearProps: 'transform,opacity' })
    }, pageRef)
    return () => context.revert()
  }, [result, error])

  return (
    <div className="company-match-page" ref={pageRef}>
      <PageHeader
        title="Company skill matches"
        description={profile?.name ? `See how ${profile.name}’s assessed skills compare with company requirements.` : 'See how your assessed skills compare with company requirements.'}
        actions={<Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => onNavigate('/match')}>Back to Match Wizard</Button>}
      />

      {!profile ? (
        <EmptyState title="Candidate profile unavailable" description="Open the Match Wizard to load or create a candidate profile before viewing company matches." action={<Button variant="primary" onClick={() => onNavigate('/match')}>Open Match Wizard</Button>} />
      ) : !skills.length ? (
        <EmptyState title="No assessed skills found" description="Add or assess candidate skills in the Match Wizard to compare companies." action={<Button variant="primary" onClick={() => onNavigate('/match')}>Open Match Wizard</Button>} />
      ) : error ? (
        <Callout type="error" title="Company matches unavailable">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => { setErrorState({ key: skillKey, value: '' }); setRetry((value) => value + 1) }} icon={<RefreshCw size={14} />}>Try again</Button>
        </Callout>
      ) : !result ? (
        <div className="company-match-loading" role="status"><Spinner /> <span>Finding company matches…</span></div>
      ) : result.matches?.length ? (
        <>
          <div className="company-match-legend" aria-label="Skill level chart legend">
            <span><i className="company-match-legend-candidate" /> Candidate level</span>
            <span><i className="company-match-legend-requirement" /> Required level</span>
          </div>
          <div className="company-match-page-list">
            {result.matches.slice(0, 6).map((company, index) => (
              <CompanyCard key={company.company_id} company={company} rank={index + 1} />
            ))}
          </div>
          <p className="company-match-page-score-note">{result.score_semantics}</p>
        </>
      ) : (
        <EmptyState title="No company matches available" description="No companies with usable skill requirements were found." />
      )}
    </div>
  )
}

function CompanyCard({ company, rank }) {
  const requirements = (company.matched_skills || []).filter((skill) => skill.status !== 'missing')

  return (
    <Card padding="lg" className="company-match-page-card">
      <CardHeader className="company-match-card-header">
        <div className="company-match-card-title">
          <span className="company-match-rank">{String(rank).padStart(2, '0')}</span>
          <div>
            <CardTitle as="h2">{company.company_name}</CardTitle>
            {company.category && <p className="company-match-page-category">{company.category}</p>}
          </div>
        </div>
        <div className="company-match-card-score">
          <strong>{Math.round(company.match_score)}%</strong>
          <span>match score</span>
        </div>
      </CardHeader>
      <CardContent>
        <ProgressBar value={company.match_score} max={100} label="Requirement coverage" valueLabel={`${Math.round(company.match_score)}%`} variant="accent" />

        <div className="company-match-table-wrap">
          <table className="company-match-table">
            <thead>
              <tr><th scope="col">Skill</th><th scope="col">Level comparison</th><th scope="col">Candidate / required</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {requirements.map((skill) => <SkillRow key={skill.skill_set_id} skill={skill} />)}
            </tbody>
          </table>
        </div>
        {company.incomplete_requirements && <p className="company-match-incomplete">Some company requirements were unavailable and were skipped.</p>}
      </CardContent>
    </Card>
  )
}

function SkillRow({ skill }) {
  const hasCandidate = skill.candidate_level !== null && skill.candidate_level !== undefined
  const candidatePct = hasCandidate ? Math.max(0, Math.min(100, skill.candidate_level * 10)) : 0
  const requiredPct = Math.max(0, Math.min(100, skill.required_level * 10))
  const status = skill.status === 'meets' ? 'Meets' : skill.status === 'missing' ? 'Not listed' : 'Below'

  return (
    <tr>
      <th scope="row">{skill.skill_name}</th>
      <td>
        <div className="company-match-compare" role="img" aria-label={`${skill.skill_name}: candidate ${hasCandidate ? skill.candidate_level : 'not listed'}, requirement ${skill.required_level}, out of 10`}>
          <div className="company-match-track">
            {hasCandidate && <span className="company-match-candidate-bar" style={{ width: `${candidatePct}%` }} />}
            <span className="company-match-required-mark" style={{ left: `${requiredPct}%` }} />
          </div>
        </div>
      </td>
      <td className="company-match-level-values">{hasCandidate ? skill.candidate_level : '—'} <span>/ {skill.required_level}</span></td>
      <td><Badge variant={skill.status === 'meets' ? 'success' : skill.status === 'missing' ? 'warning' : 'error'} size="sm">{status}</Badge></td>
    </tr>
  )
}
