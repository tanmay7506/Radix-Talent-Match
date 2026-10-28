/**
 * Business logic for Skill Matching and Gap Analysis.
 * Can calculate local heuristic match or normalize the backend /skill-matching/analyze response.
 */

export function computeLocalSkillMatch(profile, jdData) {
  if (!profile || !jdData) return null

  const jdCategories = new Set(
    Object.entries(jdData.radix_categories || {})
      .filter(([, skills]) => Array.isArray(skills) && skills.length > 0)
      .map(([cat]) => cat.toLowerCase())
  )

  const normalizedSkills = (profile.skills || []).map((skill) => typeof skill === 'string' ? { skill_name: skill } : skill).filter((skill) => skill?.skill_name)
  const profileSkillNames = normalizedSkills.map((s) => s.skill_name)

  const matched = profileSkillNames.filter((n) => jdCategories.has(n.toLowerCase()))
  const missing = [...jdCategories]
    .filter((cat) => !profileSkillNames.map((n) => n.toLowerCase()).includes(cat))
    .map((cat) => {
      const originalKey = Object.keys(jdData.radix_categories || {}).find(
        (k) => k.toLowerCase() === cat
      )
      return originalKey || cat
    })

  const total = matched.length + missing.length
  const scorePct = total > 0 ? Math.round((matched.length / total) * 100) : 0

  const profileSkillBars = normalizedSkills
    .filter((s) => matched.includes(s.skill_name))
    .sort((a, b) => (b.skill_level || 0) - (a.skill_level || 0))
    .map((s) => ({
      name: s.skill_name,
      level: s.skill_level || 1,
      confidence: s.confidence || 'Medium',
      evidence: s.evidence || [],
    }))

  return {
    scorePct,
    matched,
    missing,
    profileSkillBars,
    confidence: scorePct > 70 ? 'high' : scorePct > 35 ? 'medium' : 'low',
    recommendations: missing.map((skill) => ({
      skill_name: skill,
      action: `Review ${skill}, build a small portfolio project, and verify practical competence.`,
    })),
    source: 'client',
  }
}

/**
 * Normalizes backend /skill-matching/analyze response into the view model format.
 */
export function formatBackendMatchResponse(backendResponse, profile) {
  if (!backendResponse) return null

  const canonicalSkills = backendResponse.canonical_skills || []
  const hasCanonicalSkills = canonicalSkills.length > 0

  const matchedDetails = hasCanonicalSkills
    ? canonicalSkills.filter((item) => item.status === 'matched').map((item) => ({
        ...item,
        skill_name: item.category_name,
        match_type: 'evidence',
        candidate_skill_level: item.candidate_level,
      }))
    : (backendResponse.matched_skills || [])
  const missingDetails = hasCanonicalSkills
    ? canonicalSkills.filter((item) => item.status === 'not_assessed' || item.status === 'gap').map((item) => ({
        ...item,
        skill_name: item.category_name,
        source: 'category',
        reason: item.reason,
      }))
    : (backendResponse.unassessed_skills || backendResponse.missing_skills || [])
  const matchedSkillNames = matchedDetails.map((skill) => skill.skill_name)
  const missingSkillNames = missingDetails.map((skill) => skill.skill_name)

  const normalizedSkills = (profile?.skills || []).map((skill) => typeof skill === 'string' ? { skill_name: skill } : skill).filter((skill) => skill?.skill_name)
  const profileSkillBars = normalizedSkills
    .filter((s) => matchedSkillNames.some((m) => m.toLowerCase() === s.skill_name.toLowerCase()))
    .sort((a, b) => (b.skill_level || 0) - (a.skill_level || 0))
    .map((s) => ({
      name: s.skill_name,
      level: s.skill_level || 1,
      confidence: s.confidence || 'Medium',
      evidence: s.evidence || [],
    }))

  return {
    scorePct: Math.round(backendResponse.match_score || 0),
    matched: matchedSkillNames,
    matchedDetails,
    missing: missingSkillNames,
    missingDetails,
    profileSkillBars,
    confidence: backendResponse.match_confidence || 'medium',
    recommendations: backendResponse.recommendations || [],
    skillGaps: backendResponse.skill_gaps || [],
    ambiguityAlerts: backendResponse.ambiguity_alerts || [],
    canonicalSkills,
    source: 'backend',
  }
}
