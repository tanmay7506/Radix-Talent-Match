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

  const profileSkillNames = (profile.skills || []).map((s) => s.skill_name)

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

  const profileSkillBars = (profile.skills || [])
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

  const matchedSkillNames = (backendResponse.matched_skills || []).map((s) => s.skill_name)
  const missingSkillNames = (backendResponse.missing_skills || []).map((s) => s.skill_name)

  const profileSkillBars = (profile?.skills || [])
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
    missing: missingSkillNames,
    profileSkillBars,
    confidence: backendResponse.match_confidence || 'medium',
    recommendations: backendResponse.recommendations || [],
    skillGaps: backendResponse.skill_gaps || [],
    ambiguityAlerts: backendResponse.ambiguity_alerts || [],
    source: 'backend',
  }
}
