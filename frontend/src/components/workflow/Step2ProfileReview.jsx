import { useState } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Edit3,
  Check,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../ui'
import './Step2ProfileReview.css'

export function Step2ProfileReview({
  _originalProfile,
  profile,
  onProfileChange,
  onResetOriginal,
  onBack,
  onNext,
  isEdited = false,
  error = null,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftProfile, setDraftProfile] = useState(() => JSON.parse(JSON.stringify(profile)))
  const [newSkillName, setNewSkillName] = useState('Coding')
  const [newSkillLevel, setNewSkillLevel] = useState(7)
  const [newRole, setNewRole] = useState('')

  const handleStartEdit = () => {
    setDraftProfile(JSON.parse(JSON.stringify(profile)))
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    onProfileChange(draftProfile)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setDraftProfile(JSON.parse(JSON.stringify(profile)))
    setIsEditing(false)
  }

  const handleFieldChange = (field, value) => {
    setDraftProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEducationChange = (field, value) => {
    setDraftProfile((prev) => ({
      ...prev,
      education: {
        ...(prev.education || {}),
        [field]: value,
      },
    }))
  }

  const handleSkillLevelChange = (index, newLevel) => {
    setDraftProfile((prev) => {
      const updated = [...prev.skills]
      updated[index] = { ...updated[index], skill_level: parseInt(newLevel, 10) }
      return { ...prev, skills: updated }
    })
  }

  const handleRemoveSkill = (index) => {
    setDraftProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  const handleAddSkill = () => {
    const skillCodes = {
      Coding: 'COD',
      'Data Structures & Algorithms': 'DSA',
      'Object-Oriented Design': 'OOD',
      Aptitude: 'APT',
      Communication: 'COM',
      'Artificial Intelligence': 'AI',
      Cloud: 'CLD',
      SQL: 'SQL',
      'Software Engineering': 'SWE',
      'System Design': 'SYS',
      Networking: 'NET',
      'Operating Systems': 'OS',
      'Outside These Category': 'OTH',
    }

    if (!draftProfile.skills.some((s) => s.skill_name === newSkillName)) {
      setDraftProfile((prev) => ({
        ...prev,
        skills: [
          ...prev.skills,
          {
            skill_name: newSkillName,
            skill_code: skillCodes[newSkillName] || 'OTH',
            skill_level: parseInt(newSkillLevel, 10),
            confidence: 'Medium',
            evidence: ['Candidate confirmed practical experience.'],
          },
        ],
      }))
    }
  }

  const handleAddRole = () => {
    const trimmed = newRole.trim()
    if (trimmed && !draftProfile.preferred_roles.includes(trimmed)) {
      setDraftProfile((prev) => ({
        ...prev,
        preferred_roles: [...prev.preferred_roles, trimmed],
      }))
      setNewRole('')
    }
  }

  const handleRemoveRole = (roleToRemove) => {
    setDraftProfile((prev) => ({
      ...prev,
      preferred_roles: prev.preferred_roles.filter((r) => r !== roleToRemove),
    }))
  }

  const activeProfile = isEditing ? draftProfile : profile

  return (
    <div className="wizard-step-container">
      <div className="wizard-step-header">
        <div className="header-badge-row">
          <h2>Step 2: Review &amp; Edit Extracted Profile</h2>
          {isEdited && (
            <Badge variant="accent" size="sm">
              Custom Edits Applied
            </Badge>
          )}
        </div>
        <p>
          Inspect the structured signals extracted from your resume. You may adjust or supplement competencies to ensure the role comparison is completely accurate.
        </p>
      </div>
      {error && <div className="step2-error" role="alert">{error}</div>}

      <div className="profile-review-actions-top">
        {!isEditing ? (
          <div className="button-group-left">
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 size={14} />}
              onClick={handleStartEdit}
            >
              Edit Profile Fields
            </Button>
            {isEdited && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={onResetOriginal}
              >
                Reset to Original
              </Button>
            )}
          </div>
        ) : (
          <div className="button-group-left">
            <Button
              variant="primary"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleSaveEdit}
            >
              Save Edits
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="profile-review-grid">
        {/* Identity & Education Card */}
        <Card padding="md">
          <CardHeader>
            <CardTitle as="h3">Candidate Credentials</CardTitle>
            <CardDescription>Biographical details and academic degrees.</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="edit-form-stack">
                <div className="form-field">
                  <label htmlFor="edit-name">Full Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={draftProfile.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="edit-email">Email Address</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={draftProfile.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="edit-degree">Degree</label>
                    <input
                      id="edit-degree"
                      type="text"
                      value={draftProfile.education?.degree || ''}
                      onChange={(e) => handleEducationChange('degree', e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="edit-college">Institution</label>
                    <input
                      id="edit-college"
                      type="text"
                      value={draftProfile.education?.college || ''}
                      onChange={(e) => handleEducationChange('college', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="edit-year">Graduation Year</label>
                    <input
                      id="edit-year"
                      type="text"
                      value={draftProfile.education?.graducation_year || ''}
                      onChange={(e) => handleEducationChange('graducation_year', e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="edit-cgpa">CGPA / GPA</label>
                    <input
                      id="edit-cgpa"
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={draftProfile.education?.cgpa || ''}
                      onChange={(e) => handleEducationChange('cgpa', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="credentials-view">
                <div className="credential-item">
                  <span className="credential-label">Name</span>
                  <strong className="credential-value">{activeProfile.name || 'Not provided'}</strong>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Email</span>
                  <span className="credential-value">{activeProfile.email || 'Not provided'}</span>
                </div>
                {activeProfile.education && (
                  <div className="credential-item education-box">
                    <span className="credential-label">Education</span>
                    <strong className="credential-value">{activeProfile.education.degree}</strong>
                    <span className="credential-sub">
                      {activeProfile.education.college} · {activeProfile.education.graducation_year}
                      {activeProfile.education.cgpa ? ` (CGPA: ${activeProfile.education.cgpa})` : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferred Roles & Background Card */}
        <Card padding="md">
          <CardHeader>
            <CardTitle as="h3">Target Roles &amp; Experience</CardTitle>
            <CardDescription>Roles, internships, and certifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="section-block">
              <span className="block-label">Preferred Roles</span>
              <div className="tag-list-wrap">
                {activeProfile.preferred_roles?.map((role) => (
                  <Badge key={role} variant="subtle" size="md">
                    {role}
                    {isEditing && (
                      <button
                        type="button"
                        className="badge-remove-btn"
                        onClick={() => handleRemoveRole(role)}
                        aria-label={`Remove role ${role}`}
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="add-tag-row">
                  <input
                    type="text"
                    placeholder="Add target role…"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddRole} icon={<Plus size={14} />}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            {activeProfile.internships?.length > 0 && (
              <div className="section-block">
                <span className="block-label">Internships</span>
                <ul className="bullet-list-clean">
                  {activeProfile.internships.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeProfile.hackathons?.length > 0 && (
              <div className="section-block">
                <span className="block-label">Hackathons &amp; Competitions</span>
                <ul className="bullet-list-clean">
                  {activeProfile.hackathons.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeProfile.certifications?.length > 0 && (
              <div className="section-block">
                <span className="block-label">Certifications</span>
                <ul className="bullet-list-clean">
                  {activeProfile.certifications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extracted Skills Card */}
      <Card padding="md">
        <CardHeader>
          <div className="skills-card-header">
            <div>
              <CardTitle as="h3">Evaluated Competencies ({activeProfile.skills?.length || 0})</CardTitle>
              <CardDescription>
                Skills classified across the 12 RADIX categories with evaluated levels and evidence.
              </CardDescription>
            </div>
            {isEditing && (
              <div className="add-skill-controls">
                <select
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="skill-select"
                  aria-label="Skill category to add"
                >
                  <option value="Coding">Coding</option>
                  <option value="Data Structures & Algorithms">Data Structures &amp; Algorithms</option>
                  <option value="Object-Oriented Design">Object-Oriented Design</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Communication">Communication</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Cloud">Cloud</option>
                  <option value="SQL">SQL</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="System Design">System Design</option>
                  <option value="Networking">Networking</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Outside These Category">Outside These Category</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value)}
                  className="level-input"
                  aria-label="Skill level from 1 to 10"
                />
                <Button variant="secondary" size="sm" onClick={handleAddSkill} icon={<Plus size={14} />}>
                  Add Skill
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="skills-review-table">
            {activeProfile.skills?.map((skill, index) => (
              <div key={skill.skill_name} className="skill-review-row">
                <div className="skill-review-info">
                  <div className="skill-code-badge">{skill.skill_code}</div>
                  <div className="skill-title-group">
                    <strong className="skill-name-text">{skill.skill_name}</strong>
                    {skill.evidence?.[0] && (
                      <span className="skill-evidence-preview">{skill.evidence[0]}</span>
                    )}
                  </div>
                </div>

                <div className="skill-review-level">
                  {isEditing ? (
                    <div className="level-edit-control">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={skill.skill_level}
                        onChange={(e) => handleSkillLevelChange(index, e.target.value)}
                        className="level-slider"
                        aria-label={`${skill.skill_name} level`}
                      />
                      <span className="level-val-text">{skill.skill_level}/10</span>
                      <button
                        type="button"
                        className="skill-delete-btn"
                        onClick={() => handleRemoveSkill(index)}
                        aria-label={`Delete skill ${skill.skill_name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="level-display-badge">
                      <span className="level-num">{skill.skill_level}</span>
                      <span className="level-denom">/10</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Bar */}
      <div className="wizard-action-bar">
        <Button
          variant="ghost"
          size="md"
          icon={<ArrowLeft size={16} />}
          onClick={onBack}
        >
          Back to Resume
        </Button>
        <Button
          variant="primary"
          size="lg"
            onClick={() => onNext(isEditing ? draftProfile : profile)}
          iconRight={<ArrowRight size={16} />}
        >
          Continue to Job Description
        </Button>
      </div>
    </div>
  )
}
