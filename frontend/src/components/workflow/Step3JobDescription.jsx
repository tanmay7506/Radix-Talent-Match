import { useState } from 'react'
import {
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Callout } from '../ui'
import { FileUploadZone } from '../ui/FileUploadZone'
import './Step3JobDescription.css'

export function Step3JobDescription({
  inputMode = 'text',
  jdText = '',
  jdFile = null,
  onInputChange,
  onSubmit,
  onBack,
  isProcessing = false,
  error = null,
}) {
  const [mode, setMode] = useState(inputMode) // 'text' | 'file'
  const [text, setText] = useState(jdText)
  const [file, setFile] = useState(jdFile)
  const [validationError, setValidationError] = useState(null)

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setValidationError(null)
    onInputChange({ mode: newMode, text, file })
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    setText(val)
    setValidationError(null)
    onInputChange({ mode, text: val, file })
  }

  const handleFileChange = (newFile) => {
    if (!newFile) return
    const ext = newFile.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setValidationError('Only PDF or DOCX files are supported.')
      return
    }
    setValidationError(null)
    setFile(newFile)
    onInputChange({ mode, text, file: newFile })
  }

  const handleClearText = () => {
    setText('')
    setValidationError(null)
    onInputChange({ mode, text: '', file })
  }

  const handleAnalyze = () => {
    if (mode === 'text') {
      if (!text || text.trim().length < 30) {
        setValidationError('Please enter a job description of at least 30 characters for meaningful analysis.')
        return
      }
      setValidationError(null)
      onSubmit({ mode: 'text', text: text.trim() })
    } else {
      if (!file) {
        setValidationError('Please select a PDF or DOCX job description file.')
        return
      }
      setValidationError(null)
      onSubmit({ mode: 'file', file })
    }
  }

  const charCount = text ? text.length : 0
  const isInputValid = mode === 'text' ? text.trim().length >= 30 : Boolean(file)
  const displayError = validationError || error

  return (
    <div className="wizard-step-container">
      <div className="wizard-step-header">
        <h2>Step 3: Provide Target Job Description</h2>
        <p>
          Enter the job description for the role you wish to target. You can either paste the job posting text directly or upload the JD document.
        </p>
      </div>

      <div className="jd-input-card-wrap">
        <Card padding="lg">
          <CardHeader>
            <div className="jd-tabs-header">
              <div>
                <CardTitle as="h3">Role Requirements Specification</CardTitle>
                <CardDescription>
                  Paste job text or upload an official role document.
                </CardDescription>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="jd-mode-tabs" role="tablist" aria-label="Job description input format">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'text'}
                  className={`jd-tab-btn ${mode === 'text' ? 'active' : ''}`}
                  onClick={() => handleModeChange('text')}
                >
                  <FileText size={15} />
                  <span>Paste Text</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'file'}
                  className={`jd-tab-btn ${mode === 'file' ? 'active' : ''}`}
                  onClick={() => handleModeChange('file')}
                >
                  <Upload size={15} />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {mode === 'text' ? (
              <div className="jd-textarea-container">
                <div className="textarea-top-bar">
                  <label htmlFor="jd-pasted-text" className="textarea-label">
                    Job Description Content
                  </label>
                  <div className="textarea-tools">
                    <span className="char-counter" aria-live="polite">
                      {charCount} character{charCount !== 1 ? 's' : ''}
                    </span>
                    {text.length > 0 && !isProcessing && (
                      <button
                        type="button"
                        className="clear-text-btn"
                        onClick={handleClearText}
                        aria-label="Clear job description text"
                      >
                        <RotateCcw size={12} />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  id="jd-pasted-text"
                  rows={10}
                  className="jd-textarea"
                  placeholder="Paste the complete job description here, including responsibilities, requirements, technical qualifications, and preferred tools…"
                  value={text}
                  onChange={handleTextChange}
                  disabled={isProcessing}
                />
              </div>
            ) : (
              <div className="jd-file-container">
                <FileUploadZone
                  id="wizard-jd-file-upload"
                  onFileSelect={handleFileChange}
                  isLoading={isProcessing}
                  currentFileName={file?.name}
                  acceptedExtensions={['pdf', 'docx']}
                  title="Drop job description document here"
                  subtitle="PDF or DOCX format · Max 10MB"
                  loadingTitle="Processing document…"
                  compact={false}
                />
              </div>
            )}

            {displayError && (
              <Callout type="error" role="alert" icon={<AlertCircle size={16} />}>
                {displayError}
              </Callout>
            )}

            <div className="step3-tip">
              <Sparkles size={16} className="tip-icon" aria-hidden="true" />
              <span>
                Tip: Comprehensive job postings with explicit technology stacks and responsibilities produce higher match confidence.
              </span>
            </div>

            <div className="wizard-action-bar">
              <Button
                variant="ghost"
                size="md"
                icon={<ArrowLeft size={16} />}
                onClick={onBack}
                disabled={isProcessing}
              >
                Back to Profile
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={!isInputValid || isProcessing}
                isLoading={isProcessing}
                onClick={handleAnalyze}
                iconRight={<ArrowRight size={16} />}
              >
                {isProcessing ? 'Extracting Requirements…' : 'Analyze Job Requirements'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
