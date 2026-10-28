import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowRight, Building2, Clock3, MapPin, RotateCw } from 'lucide-react'
import { gsap } from 'gsap'
import { resultsService } from '../services/resultsService'
import { Step6Results } from './workflow/Step6Results'
import { PageHeader } from './ui/PageHeader'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'
import './RoutePages.css'

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function summarizeResult(item) {
  const match = item.matchResult || item.match_result || item.result || item
  const metadata = item.metadata || item.job || item.job_metadata || match.metadata || match.job || {}
  const rawScore = item.match_score ?? item.score ?? match.match_score ?? match.overall_score
  const score = typeof rawScore === 'number' ? rawScore : Number.isFinite(Number(rawScore)) ? Number(rawScore) : null
  const canonicalSkills = Array.isArray(match.canonical_skills) ? match.canonical_skills : []
  const matched = canonicalSkills.length > 0
    ? canonicalSkills.filter((item) => item.status === 'matched')
    : (match.matched_skills || match.matchedSkills || [])
  const missing = canonicalSkills.length > 0
    ? canonicalSkills.filter((item) => item.status === 'not_assessed' || item.status === 'gap')
    : (match.unassessed_skills || match.missing_skills || match.missingSkills || match.skill_gaps || [])
  const createdAt = item.created_at || item.matched_at || item.saved_at || item.createdAt
  const companyValue = item.company || item.company_name || metadata.company || metadata.company_name || match.company
  const company = typeof companyValue === 'string' ? companyValue : companyValue?.name || companyValue?.title
  return {
    title: item.job_title || item.jobTitle || metadata.job_title || metadata.title || match.job_title || match.jobTitle || 'Role match',
    company,
    location: item.location || metadata.location,
    employment: item.employment_type || metadata.employment_type || metadata.seniority,
    date: formatDate(createdAt),
    score: score === null ? null : Math.round(score),
    matchedCount: Array.isArray(matched) ? matched.length : null,
    missingCount: Array.isArray(missing) ? missing.length : null,
    description: item.job_description || metadata.description || match.job_description,
  }
}

export function MatchHistoryPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const response = await resultsService.listResults({ signal })
      const items = Array.isArray(response) ? response : response?.results || response?.items || response?.data || []
      const seenIds = new Set()
      setResults(items.filter((item) => {
        if (!item?.id) return true
        if (seenIds.has(item.id)) return false
        seenIds.add(item.id)
        return true
      }))
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'History is unavailable.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!results.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = gsap.context(() => gsap.fromTo('.history-link',
      { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }), listRef)
    return () => ctx.revert()
  }, [results.length])

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => load(controller.signal))
    return () => controller.abort()
  }, [load])

  useEffect(() => {
    const refreshHistory = () => load()
    window.addEventListener('radix:match-saved', refreshHistory)
    return () => window.removeEventListener('radix:match-saved', refreshHistory)
  }, [load])

  return (
    <div className="history-page">
      <PageHeader title="Match history" description="Review saved role alignment results." />
      {(import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true' || import.meta.env.DEV) && <p className="route-note">Development mock mode: history is temporary and clears on refresh.</p>}
      {loading && <p role="status">Loading match history…</p>}
      {error && (
        <div className="history-error" role="alert">
          <p>{error}</p>
          <Button onClick={() => load()} icon={<RotateCw size={15} />}>Try again</Button>
        </div>
      )}
      {!loading && !error && !results.length && (
        <EmptyState
          icon={<Clock3 size={28} />}
          title="No saved matches yet"
          description="Results will appear here after a match is saved."
          action={<Link className="ui-btn ui-btn-primary ui-btn-md" to="/match">Start a match</Link>}
        />
      )}
      {!loading && !error && <div className="history-list" ref={listRef}>{results.map((item) => {
        const summary = summarizeResult(item)
        return (
          <Link key={item.id} className="history-link" to="/history/$resultId" params={{ resultId: item.id }}>
            <Card padding="md">
              <CardContent>
                <div className="history-row">
                  <div>
                    <h2>{summary.title}</h2>
                    {summary.company && <p className="history-company"><Building2 size={14} aria-hidden="true" />{summary.company}</p>}
                    {summary.location && <p className="history-detail"><MapPin size={14} aria-hidden="true" />{summary.location}</p>}
                    {summary.employment && <p className="history-detail">{summary.employment}</p>}
                    {summary.date && <p className="history-detail">Matched {summary.date}</p>}
                    {(summary.matchedCount !== null || summary.missingCount !== null) && <p className="history-detail">{summary.matchedCount ?? 0} matched · {summary.missingCount ?? 0} gaps</p>}
                    {summary.description && <p className="history-description">{summary.description}</p>}
                  </div>
                  <div className="history-score">
                    {summary.score !== null ? `${summary.score}%` : '—'}
                    <span className="history-score-label">Match score</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}</div>}
    </div>
  )
}

export function SavedResultPage() {
  const { resultId } = useParams({ from: '/history/$resultId' })
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      setItem(await resultsService.getResultById(resultId, { signal }))
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Unable to load saved result.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [resultId])

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => load(controller.signal))
    return () => controller.abort()
  }, [load])

  if (loading) return <p role="status">Loading saved result…</p>
  if (error) {
    return <div className="history-error" role="alert"><p>{error}</p><Button onClick={() => load()}>Try again</Button></div>
  }
  if (!item) {
    return <EmptyState title="Result not found" description="This saved match may have been removed." action={<Link to="/history">Back to history</Link>} />
  }

  return (
    <Step6Results
      matchResult={item.matchResult || item.match_result || item.result || item}
      profile={item.profile || {}}
      talentResult={item.talentResult || item.talent_result || null}
      jdData={item.jdData || item.jd_data || item.jd || null}
      stackSkillColumns
      onStartNew={() => navigate({ to: '/match' })}
      onEditProfile={() => navigate({ to: '/profile' })}
      onChangeJd={() => navigate({ to: '/match' })}
    />
  )
}
