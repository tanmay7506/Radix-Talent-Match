import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, Building2, RotateCcw } from 'lucide-react'
import { api } from '../../services/api'
import { Button, Callout, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui'

export function Step6TalentCheck({ profile, jdData, onBack, onComplete }) {
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const requestController = useRef(null)

  useEffect(() => () => requestController.current?.abort(), [])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoadingCompanies(true)
    setError('')
    api.getTalentCheckCompanies({ signal: controller.signal })
      .then((items) => {
        const availableCompanies = Array.isArray(items) ? items : []
        setCompanies(availableCompanies)
        if (availableCompanies.length === 0) {
          setError('No companies are available for the talent check.')
          return
        }
        const targetCompany = String(jdData?.company || jdData?.company_name || '').trim().toLowerCase()
        const matchingCompany = availableCompanies.find((company) =>
          [company.name, company.short_name].some((name) => String(name || '').trim().toLowerCase() === targetCompany)
        )
        setSelectedCompany((current) => current || (matchingCompany ? String(matchingCompany.company_id) : ''))
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'Unable to load companies for the talent check.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCompanies(false)
      })
    return () => controller.abort()
  }, [jdData, loadAttempt])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!profile || !selectedCompany || isChecking) return
    setError('')
    setIsChecking(true)
    const controller = new AbortController()
    requestController.current = controller
    try {
      const assessment = await api.runTalentCheck(profile, selectedCompany, { signal: controller.signal })
      const company = companies.find((item) => String(item.company_id) === selectedCompany)
      onComplete({ assessment, company })
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Unable to complete the talent check.')
    } finally {
      setIsChecking(false)
      if (requestController.current === controller) requestController.current = null
    }
  }

  return (
    <div className="wizard-step-container">
      <div className="wizard-step-header">
        <h2>Step 6: Company Talent Check</h2>
        <p>Compare the candidate’s assessed skill levels with a company’s requirements.</p>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div className="match-ready-header">
            <div className="match-ready-icon" aria-hidden="true"><Building2 size={22} /></div>
            <div>
              <CardTitle as="h3">Select a company</CardTitle>
              <CardDescription>
                {profile?.name || 'Candidate'}’s profile will be assessed against the selected company’s skill requirements.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Callout type="error" icon={<AlertCircle size={18} />}>{error}</Callout>}
          {error && companies.length === 0 && (
            <Button variant="secondary" size="sm" onClick={() => setLoadAttempt((attempt) => attempt + 1)} icon={<RotateCcw size={14} />}>
              Retry loading companies
            </Button>
          )}
          <form className="edit-form-stack" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="talent-check-company">Company</label>
              <select
                id="talent-check-company"
                value={selectedCompany}
                onChange={(event) => setSelectedCompany(event.target.value)}
                disabled={isLoadingCompanies || companies.length === 0 || isChecking}
                required
              >
                <option value="">{isLoadingCompanies ? 'Loading companies…' : 'Choose a company'}</option>
                {companies.map((company) => (
                  <option key={company.company_id} value={company.company_id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div className="wizard-action-bar">
              <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={onBack} disabled={isChecking}>Back to Skill Match</Button>
              <Button type="submit" variant="primary" size="lg" isLoading={isChecking || isLoadingCompanies} disabled={!selectedCompany || companies.length === 0} iconRight={<ArrowRight size={16} />}>
                Run Talent Check
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
