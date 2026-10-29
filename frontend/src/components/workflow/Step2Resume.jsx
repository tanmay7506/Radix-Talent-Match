import { useState } from 'react'
import { FileText, ArrowRight, AlertCircle, X, ShieldCheck } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout } from '../ui'
import { FileUploadZone } from '../ui/FileUploadZone'
import ProfileCard from '../ProfileCard'
import SkillsGrid from '../SkillsGrid'
import './Step2Resume.css'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Step2Resume({
  selectedFile,
  onFileChange,
  onSubmit,
  isProcessing = false,
  error = null,
  onClearError,
  savedProfile = null,
  onUseProfile,
  onNavigate,
}) {
  const [localFile, setLocalFile] = useState(selectedFile)
  const [validationError, setValidationError] = useState(null)

  const handleFileSelected = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setValidationError('Only PDF or DOCX files are supported by the extraction engine.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Resume must be 10 MB or smaller.')
      return
    }
    setValidationError(null)
    if (onClearError) onClearError()
    setLocalFile(file)
    onFileChange(file)
  }

  const handleRemoveFile = (e) => {
    e.stopPropagation()
    if (isProcessing) return
    setLocalFile(null)
    onFileChange(null)
    if (onClearError) onClearError()
  }

  const handleProceed = () => {
    if (!localFile || isProcessing) return
    onSubmit(localFile)
  }

  const displayError = validationError || error

  return (
    <div className="wizard-step-container">
      <div className="wizard-step-header">
        <h2>Step 2: Choose a candidate profile</h2>
        <p>
          Use the profile you have already reviewed, or update it from a new resume.
        </p>
      </div>

      <div className="wizard-step-body step1-card-list">
        {savedProfile && <Card className="step1-card" padding="lg">
          <CardHeader><CardTitle as="h3">Use your saved profile</CardTitle><CardDescription>{savedProfile.name || 'Your profile'}{savedProfile.skills?.length ? ` · ${savedProfile.skills.slice(0, 5).map((item) => typeof item === 'string' ? item : item.skill_name).join(', ')}` : ' · Add skills to improve your match'}</CardDescription></CardHeader>
          <CardContent><details className="saved-profile-preview"><summary>Inspect profile details</summary><ProfileCard profile={savedProfile}/><SkillsGrid skills={savedProfile.skills}/></details><div className="wizard-action-bar"><Button variant="secondary" onClick={() => onNavigate?.('/profile')}>Edit profile</Button><Button variant="primary" onClick={onUseProfile}>Use this profile</Button></div></CardContent>
        </Card>}
        {!savedProfile && <Card className="step1-card" padding="md"><CardContent><Callout type="info">No saved profile yet. Create one from a resume below or set it up manually on the Profile page.</Callout><Button variant="secondary" onClick={() => onNavigate?.('/profile')}>Create profile manually</Button></CardContent></Card>}
        <Card className="step1-card" padding="lg">
          <CardHeader>
            <CardTitle as="h3">Resume Document</CardTitle>
            <CardDescription>
              Select or drop your latest curriculum vitae or resume document.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!localFile ? (
              <FileUploadZone
                id="wizard-resume-upload"
                onFileSelect={handleFileSelected}
                isLoading={isProcessing}
                acceptedExtensions={['pdf', 'docx']}
                title="Drop your resume here or click to browse"
                subtitle="Accepts PDF or DOCX documents · Maximum recommended size 10MB"
                loadingTitle="Processing resume…"
                loadingSubtitle="AI is analyzing document structure"
                animate={true}
              />
            ) : (
              <div className="selected-file-panel">
                <div className="selected-file-icon" aria-hidden="true">
                  <FileText size={24} strokeWidth={2} />
                </div>
                <div className="selected-file-details">
                  <span className="selected-file-name">{localFile.name}</span>
                  <span className="selected-file-meta">
                    {formatFileSize(localFile.size)} · {localFile.name.endsWith('.docx') ? 'Word DOCX Document' : 'PDF Document'}
                  </span>
                </div>
                {!isProcessing && (
                  <button
                    type="button"
                    className="selected-file-remove"
                    onClick={handleRemoveFile}
                    aria-label={`Remove file ${localFile.name}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {displayError && (
              <Callout type="error" role="alert" icon={<AlertCircle size={16} />}>
                {displayError}
              </Callout>
            )}

            <div className="step1-guidelines">
              <div className="guideline-item">
                <ShieldCheck size={16} className="guideline-icon" aria-hidden="true" />
                <span>Resume extraction uses the configured RADIX backend. Extracted details can be reviewed before continuing.</span>
              </div>
            </div>

            <div className="wizard-action-bar">
              <div />
              <Button
                variant="primary"
                size="lg"
                disabled={!localFile || isProcessing}
                isLoading={isProcessing}
                onClick={handleProceed}
                iconRight={<ArrowRight size={16} />}
              >
                {isProcessing ? 'Extracting Profile…' : 'Extract & Review Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
