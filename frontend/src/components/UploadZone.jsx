import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { UploadCloud } from 'lucide-react'
import './UploadZone.css'

export default function UploadZone({ onProfileReceived, isLoading, setIsLoading }) {
  const cardRef = useRef(null)
  const iconRef = useRef(null)
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [error, setError] = useState(null)

  // ── Preserved GSAP entrance and floating icon animation ─────────────────
  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 }
    )
    // Floating icon animation
    gsap.to(iconRef.current, {
      y: -6,
      duration: 1.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  }, [])

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF or DOCX files are supported.')
      return
    }
    setError(null)
    setFileName(file.name)
    setIsLoading(true)

    // Button press animation
    gsap.to(cardRef.current, {
      scale: 0.985,
      duration: 0.15,
      ease: 'power2.in',
      yoyo: true,
      repeat: 1,
    })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:8000/profile/build/from-resume', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      onProfileReceived(data)
    } catch (err) {
      setError(`Failed to extract profile: ${err.message}`)
      setIsLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0]
    handleFile(file)
  }

  const onInputChange = (e) => {
    const file = e.target.files?.[0]
    handleFile(file)
  }

  return (
    <section
      id="upload"
      className={`upload-zone neo-card${dragging ? ' dragging' : ''}`}
      ref={cardRef}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      aria-label="Upload resume: click or drag and drop a PDF or DOCX file"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="sr-only"
        onChange={onInputChange}
        aria-hidden="true"
      />

      <div className="upload-icon" ref={iconRef}>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="upload-icon-circle">
            <UploadCloud size={28} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <div className="upload-text">
        {isLoading ? (
          <>
            <h3>Analysing your resume…</h3>
            <p>This may take a moment. Please wait.</p>
          </>
        ) : fileName ? (
          <>
            <h3>{fileName}</h3>
            <p>Click or drop another file to replace</p>
          </>
        ) : (
          <>
            <h3>Drop your resume here</h3>
            <p>PDF or DOCX · Click to browse</p>
          </>
        )}
      </div>

      {error && <p className="upload-error">{error}</p>}

      <div className="upload-formats">
        <span className="format-badge neo-inset">PDF</span>
        <span className="format-badge neo-inset">DOCX</span>
      </div>
    </section>
  )
}

function Spinner() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="spinner">
      <circle cx="28" cy="28" r="22" stroke="var(--border)" strokeWidth="4" />
      <path d="M28 6 A22 22 0 0 1 50 28" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
