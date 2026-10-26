import { useState } from 'react'
import { FileText, ArrowRight, AlertCircle, X, ShieldCheck } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout } from '../ui'
import { FileUploadZone } from '../ui/FileUploadZone'
import './Step1Resume.css'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Step1Resume({
  selectedFile,
  onFileChange,
  onSubmit,
  isProcessing = false,
  error = null,
  onClearError,
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
        <h2>Step 1: Upload Candidate Resume</h2>
        <p>
          Upload your resume in PDF or DOCX format. The RADIX backend extracts your verified competencies, education, and career experience.
        </p>
      </div>

      <div className="wizard-step-body">
        <Card className="resume-upload-card" padding="lg">
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
                <span>Strictly uses existing backend parsing without mocking or synthetic profile generation.</span>
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
