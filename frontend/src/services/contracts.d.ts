/** Provisional frontend contracts for backend capabilities not implemented yet. */
export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthSession {
  user: AuthUser
  /** Session expiry metadata supplied by the future backend, if available. */
  expiresAt?: string | null
}

export interface LoginRequest { email: string; password: string }
export interface SignupRequest extends LoginRequest { name: string }

export interface CandidateSkill {
  skill_name: string
  skill_code?: string
  skill_level?: number
  confidence?: 'High' | 'Medium' | 'Low' | string
  evidence?: string[]
}

/** Fields reflect the current profile review UI; extra extracted fields are preserved. */
export interface CandidateProfile {
  id?: string
  name?: string
  email?: string
  skills?: CandidateSkill[]
  education?: {
    degree?: string
    college?: string
    /** Existing RADIX extraction payload uses this misspelling. */
    graducation_year?: string | number
    graduation_year?: string | number
    cgpa?: string | number
    [key: string]: unknown
  }
  internships?: unknown[]
  hackathons?: unknown[]
  certifications?: unknown[]
  preferred_roles?: string[]
  cv_file?: string
  updated_at?: string
  source?: 'resume' | 'manual' | string
  manually_edited?: boolean
  [key: string]: unknown
}

export interface MatchResult {
  match_score?: number
  match_confidence?: string
  matched_skills?: unknown[]
  missing_skills?: unknown[]
  skill_gaps?: unknown[]
  recommendations?: unknown[]
  ambiguity_alerts?: unknown[]
  [key: string]: unknown
}

export interface SavedMatchResult {
  id: string
  created_at?: string
  job_title?: string
  company?: string
  company_name?: string
  location?: string
  employment_type?: string
  job_description?: string
  metadata?: {
    title?: string
    job_title?: string
    company?: string
    company_name?: string
    location?: string
    employment_type?: string
    seniority?: string
    description?: string
    [key: string]: unknown
  }
  match_score?: number
  matchResult: MatchResult
  profile?: CandidateProfile
  [key: string]: unknown
}
