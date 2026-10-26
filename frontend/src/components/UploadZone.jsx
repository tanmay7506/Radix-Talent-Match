import { useState } from 'react'
import { api } from '../services/api'
import { FileUploadZone } from './ui/FileUploadZone'
import './UploadZone.css'

/**
 * UploadZone component for candidate resume upload.
 * Preserves the exact props interface and GSAP physics while using the centralized API service.
 */
export default function UploadZone({ onProfileReceived, isLoading, setIsLoading }) {
  const [error, setError] = useState(null)

  const handleFileSelect = async (file) => {
    if (!file) return
    setError(null)
    setIsLoading(true)

    try {
      const data = await api.buildProfileFromResume(file)
      onProfileReceived(data)
    } catch (err) {
      setError(err.message || 'Failed to extract candidate profile.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="upload-zone-wrapper">
      <FileUploadZone
        id="resume-upload-zone"
        onFileSelect={handleFileSelect}
        isLoading={isLoading}
        acceptedExtensions={['pdf', 'docx']}
        title="Drop resume here or browse"
        subtitle="PDF or DOCX format · AI will parse skills and background"
        loadingTitle="Analysing your resume…"
        loadingSubtitle="Extracting competencies, experience, and education"
        animate={true}
      />

      {error && (
        <p className="upload-error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
