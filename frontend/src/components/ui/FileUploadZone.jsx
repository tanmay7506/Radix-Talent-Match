import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { UploadCloud, FolderOpen, AlertCircle } from 'lucide-react'
import { Spinner } from './Spinner'
import './FileUploadZone.css'

export function FileUploadZone({
  id = 'file-upload',
  onFileSelect,
  isLoading = false,
  acceptedExtensions = ['pdf', 'docx'],
  title = 'Drop your file here',
  subtitle = 'PDF or DOCX · Click to browse',
  loadingTitle = 'Processing file…',
  loadingSubtitle = 'AI is extracting structured data',
  icon: customIcon = null,
  currentFileName = null,
  compact = false,
  animate = true,
  className = '',
}) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)
  const [internalFileName, setInternalFileName] = useState(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const iconRef = useRef(null)

  const fileName = currentFileName !== undefined && currentFileName !== null ? currentFileName : internalFileName

  useEffect(() => {
    if (!animate || !containerRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Gentle floating icon effect
    if (iconRef.current) {
      const anim = gsap.to(iconRef.current, {
        y: -4,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
      return () => anim.kill()
    }
  }, [animate])

  const validateAndHandle = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!acceptedExtensions.includes(ext)) {
      setError(`Only ${acceptedExtensions.map((e) => e.toUpperCase()).join(' or ')} files are supported.`)
      return
    }
    setError(null)
    setInternalFileName(file.name)

    // Subtle press bounce animation
    if (containerRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.to(containerRef.current, {
        scale: 0.985,
        duration: 0.15,
        ease: 'power2.in',
        yoyo: true,
        repeat: 1,
      })
    }

    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (isLoading) return
    const file = e.dataTransfer?.files?.[0]
    validateAndHandle(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    validateAndHandle(file)
  }

  const handleClick = () => {
    if (!isLoading && inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const defaultIcon = compact ? (
    <FolderOpen size={24} strokeWidth={1.8} />
  ) : (
    <UploadCloud size={32} strokeWidth={1.8} />
  )

  return (
    <div className="ui-upload-wrapper">
      <div
        id={id}
        ref={containerRef}
        className={`ui-upload-zone ${compact ? 'ui-upload-compact' : ''} ${dragging ? 'ui-upload-dragging' : ''} ${isLoading ? 'ui-upload-loading' : ''} ${className}`}
        role="button"
        tabIndex={0}
        aria-label={`${title}. ${subtitle}`}
        aria-disabled={isLoading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault()
          if (!isLoading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedExtensions.map((ext) => `.${ext}`).join(',')}
          className="sr-only"
          onChange={handleInputChange}
          disabled={isLoading}
          aria-hidden="true"
        />

        <div className="ui-upload-icon-wrap" ref={iconRef} aria-hidden="true">
          {isLoading ? <Spinner size={compact ? 'md' : 'lg'} /> : customIcon || defaultIcon}
        </div>

        <div className="ui-upload-body">
          {isLoading ? (
            <>
              <h3 className="ui-upload-title">{loadingTitle}</h3>
              <p className="ui-upload-subtitle">{loadingSubtitle}</p>
            </>
          ) : fileName ? (
            <>
              <h3 className="ui-upload-title">{fileName}</h3>
              <p className="ui-upload-subtitle">Click or drop another file to replace</p>
            </>
          ) : (
            <>
              <h3 className="ui-upload-title">{title}</h3>
              <p className="ui-upload-subtitle">{subtitle}</p>
            </>
          )}
        </div>

        {fileName && !isLoading && (
          <span className="ui-upload-filename-pill" aria-label={`Selected file: ${fileName}`}>
            {fileName}
          </span>
        )}
      </div>

      {error && (
        <div className="ui-upload-error" role="alert">
          <AlertCircle size={14} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
