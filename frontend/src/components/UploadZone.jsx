import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './UploadZone.css'

export default function UploadZone({ onProfileReceived, isLoading, setIsLoading }) {
  const cardRef = useRef(null)
  const iconRef = useRef(null)
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [error, setError] = useState(null)

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
      const res = await fetch('/profile/build/from-resume', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Server error')
      }
      const data = await res.json()
      onProfileReceived(data)
    } catch (e) {
      setError(e.message || 'Failed to build profile. Please try again.')
      onProfileReceived(null)
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onInputChange = (e) => handleFile(e.target.files[0])

  return (
    <section id="upload" className={`upload-zone neo-card ${dragging ? 'dragging' : ''}`}
      ref={cardRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !isLoading && inputRef.current.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
      aria-label="Upload resume"
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
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="var(--accent-light)" />
            <path d="M28 38V26M28 26L23 31M28 26L33 31" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="18" y="38" width="20" height="2.5" rx="1.25" fill="var(--accent)" opacity="0.5"/>
          </svg>
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
      <circle cx="28" cy="28" r="22" stroke="var(--accent-light)" strokeWidth="4" />
      <path d="M28 6 A22 22 0 0 1 50 28" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
