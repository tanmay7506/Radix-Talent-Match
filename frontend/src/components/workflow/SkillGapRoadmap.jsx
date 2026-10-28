import { useMemo } from 'react'
import {
  Compass,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Flag,
  Target,
  ArrowDown,
  Layers,
  Sparkles,
  BookOpen,
  Info,
  FileText,
  ExternalLink,
  HelpCircle,
} from 'lucide-react'
import { Badge, Callout } from '../ui'
import './SkillGapRoadmap.css'

/**
 * Authoritative 12 canonical RADIX skill-to-PDF mapping.
 * Files are stored in frontend/public/roadmaps/ and served statically by Vite at /roadmaps/<filename>.
 */
export const SKILL_ROADMAP_PDFS = {
  COD: {
    filename: 'coding-roadmap.pdf',
    title: 'Coding Roadmap',
    description: 'Programming syntax, modular functions, and clean code fundamentals',
  },
  DSA: {
    filename: 'dsa-roadmap.pdf',
    title: 'Data Structures & Algorithms Roadmap',
    description: 'Linear/non-linear structures, complexity analysis, and algorithms',
  },
  OOD: {
    filename: 'object-oriented-design-roadmap.pdf',
    title: 'Object-Oriented Design Roadmap',
    description: 'Object-oriented modeling, design patterns, and SOLID principles',
  },
  APTI: {
    filename: 'aptitude-roadmap.pdf',
    title: 'Aptitude & Problem Solving Roadmap',
    description: 'Quantitative reasoning, logic, and analytical problem solving',
  },
  COMM: {
    filename: 'communication-roadmap.pdf',
    title: 'Communication Skills Roadmap',
    description: 'Technical writing, architecture documentation, and verbal clarity',
  },
  AI: {
    filename: 'ai-native-engineering-roadmap.pdf',
    title: 'AI Native Engineering Roadmap',
    description: 'Applied machine learning, generative AI, and model integrations',
  },
  CLOUD: {
    filename: 'cloud-computing-roadmap.pdf',
    title: 'Cloud Computing Roadmap',
    description: 'Cloud architectures, microservices, containerization, and hosting',
  },
  SQL: {
    filename: 'sql-database-roadmap.pdf',
    title: 'SQL & Database Design Roadmap',
    description: 'Relational data modeling, complex querying, index optimization, and ACID',
  },
  SWE: {
    filename: 'software-engineering-roadmap.pdf',
    title: 'Software Engineering Roadmap',
    description: 'Version control workflows, testing methodologies, and CI/CD automation',
  },
  SYSD: {
    filename: 'system-design-roadmap.pdf',
    title: 'System Design Roadmap',
    description: 'Distributed architectures, scalability, load balancing, and caching',
  },
  NETW: {
    filename: 'networking-roadmap.pdf',
    title: 'Networking Roadmap',
    description: 'Protocols, TCP/IP stack, REST/gRPC interfaces, and sockets',
  },
  OS: {
    filename: 'operating-systems-roadmap.pdf',
    title: 'Operating Systems Roadmap',
    description: 'Process management, concurrency, memory allocation, and kernel basics',
  },
}

/**
 * Normalizes a category string into canonical RADIX comparison format.
 */
function normalizeCategory(val) {
  if (!val || typeof val !== 'string') return ''
  const clean = val.toLowerCase().replace(/&/g, ' and ').replace(/[-_/]+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim()
  const aliases = {
    'coding': 'COD', 'programming': 'COD', 'java': 'COD', 'python': 'COD', 'javascript': 'COD', 'typescript': 'COD',
    'data structures and algorithms': 'DSA', 'data structures & algorithms': 'DSA', 'dsa': 'DSA',
    'object oriented design': 'OOD', 'object oriented programming and design': 'OOD', 'ood': 'OOD',
    'aptitude': 'APTI', 'aptitude and problem solving': 'APTI', 'apt': 'APTI', 'apti': 'APTI',
    'communication': 'COMM', 'communication skills': 'COMM', 'comm': 'COMM',
    'artificial intelligence': 'AI', 'ai': 'AI', 'machine learning': 'AI', 'ai native engineering': 'AI',
    'cloud': 'CLOUD', 'cloud computing': 'CLOUD', 'cld': 'CLOUD', 'devops and cloud': 'CLOUD', 'aws': 'CLOUD', 'azure': 'CLOUD', 'gcp': 'CLOUD',
    'sql': 'SQL', 'database': 'SQL', 'databases': 'SQL', 'sql and design': 'SQL', 'postgresql': 'SQL', 'mysql': 'SQL',
    'software engineering': 'SWE', 'swe': 'SWE', 'devops': 'SWE', 'testing': 'SWE',
    'system design': 'SYSD', 'system design and architecture': 'SYSD', 'sysd': 'SYSD', 'sys': 'SYSD',
    'networking': 'NETW', 'computer networking': 'NETW', 'netw': 'NETW', 'net': 'NETW',
    'operating systems': 'OS', 'operating system': 'OS', 'os': 'OS',
  }
  return aliases[clean] || clean.toUpperCase()
}

/**
 * Extracts specific technologies/skills from uploaded JD for a canonical category code.
 */
function getJdTermsForCategory(categoryCode, categoryName, jdData) {
  if (!jdData) return []
  const terms = []
  const radixCategories = jdData.radix_categories || {}
  const technologies = Array.isArray(jdData.technologies) ? jdData.technologies : []

  Object.entries(radixCategories).forEach(([catKey, items]) => {
    if (!Array.isArray(items)) return
    const mapped = normalizeCategory(catKey)
    if (mapped === categoryCode || normalizeCategory(categoryName) === mapped) {
      items.forEach((item) => {
        if (typeof item === 'string' && item.trim()) terms.push(item.trim())
      })
    }
  })

  technologies.forEach((tech) => {
    if (typeof tech === 'string' && tech.trim()) {
      if (normalizeCategory(tech) === categoryCode) terms.push(tech.trim())
    }
  })

  return [...new Set(terms)]
}

/**
 * Builds local verified graph from talentResult and uploaded jdData/matchResult.
 * Evaluates strictly against verified gaps for the specific uploaded JD.
 */
function buildLocalJdRoadmap(talentResult, jdData, profile, matchResult = null) {
  const assessment = talentResult?.assessment || talentResult || {}
  const rawGaps = assessment.skillset_gap || []
  const roleTitle = jdData?.job_title || jdData?.jobTitle || assessment.role || 'Target Role'
  const companyName = talentResult?.company?.name || assessment.company || 'Selected Role'

  // Determine which canonical categories are required by the uploaded JD
  let jdRequiredCodes = null
  if (matchResult && Array.isArray(matchResult.canonical_skills) && matchResult.canonical_skills.length > 0) {
    jdRequiredCodes = new Set(
      matchResult.canonical_skills.filter((s) => s.required_by_jd).map((s) => s.category_code)
    )
  } else if (jdData) {
    const fromJd = new Set()
    const radixCategories = jdData.radix_categories || {}
    const technologies = Array.isArray(jdData.technologies) ? jdData.technologies : []
    Object.keys(radixCategories).forEach((k) => {
      const code = normalizeCategory(k)
      if (code) fromJd.add(code)
      if (Array.isArray(radixCategories[k])) {
        radixCategories[k].forEach((term) => {
          const tCode = normalizeCategory(String(term))
          if (tCode) fromJd.add(tCode)
        })
      }
    })
    technologies.forEach((t) => {
      const code = normalizeCategory(String(t))
      if (code) fromJd.add(code)
    })
    if (fromJd.size > 0) {
      jdRequiredCodes = fromJd
    }
  }

  // Filter confirmed gaps:
  // 1. meets_requirement is explicitly false and numeric candidate_level is below required_level
  // 2. Candidate does NOT possess the skill (exclude meets_requirement === true)
  // 3. Not unassessed (exclude candidate_level === null)
  // 4. Must be required by the uploaded JD (if JD requirements are known)
  const confirmedGaps = rawGaps.filter((item) => {
    if (item.meets_requirement !== false) return false
    if (typeof item.candidate_level !== 'number' || typeof item.required_level !== 'number') return false
    if (item.candidate_level >= item.required_level) return false
    const catCode = item.category_code || normalizeCategory(item.category_name)
    if (jdRequiredCodes && !jdRequiredCodes.has(catCode)) return false
    return true
  })

  // Deduplicate by canonical category code (Case E)
  const seenCategories = new Set()
  const uniqueGaps = []
  confirmedGaps.forEach((gapItem) => {
    const catCode = gapItem.category_code || normalizeCategory(gapItem.category_name)
    if (!catCode || seenCategories.has(catCode)) return
    seenCategories.add(catCode)
    uniqueGaps.push({ ...gapItem, category_code: catCode })
  })

  // Extract unassessed skills required by the JD and not mentioned in the resume
  const seenUnassessed = new Set()
  const uniqueUnassessed = []

  if (matchResult && Array.isArray(matchResult.canonical_skills)) {
    matchResult.canonical_skills.forEach((s) => {
      if (!s.required_by_jd) return
      const code = s.category_code || normalizeCategory(s.category_name)
      if (!code || seenCategories.has(code) || seenUnassessed.has(code)) return
      if (s.candidate_level == null || s.status === 'unassessed' || s.meets_requirement === null) {
        seenUnassessed.add(code)
        uniqueUnassessed.push({
          category_name: s.category_name || code,
          category_code: code,
          candidate_level: null,
          required_level: s.required_level || 5,
          gap: s.required_level || 5,
        })
      }
    })
  }

  rawGaps.forEach((item) => {
    const code = item.category_code || normalizeCategory(item.category_name)
    if (!code || seenCategories.has(code) || seenUnassessed.has(code)) return
    if (jdRequiredCodes && !jdRequiredCodes.has(code)) return
    if (item.candidate_level == null) {
      seenUnassessed.add(code)
      uniqueUnassessed.push({
        category_name: item.category_name || code,
        category_code: code,
        candidate_level: null,
        required_level: item.required_level || 5,
        gap: item.required_level || 5,
      })
    }
  })

  if (jdRequiredCodes) {
    jdRequiredCodes.forEach((code) => {
      if (!code || seenCategories.has(code) || seenUnassessed.has(code)) return
      seenUnassessed.add(code)
      uniqueUnassessed.push({
        category_name: code,
        category_code: code,
        candidate_level: null,
        required_level: 5,
        gap: 5,
      })
    })
  }

  const totalRoadmapItems = uniqueGaps.length + uniqueUnassessed.length

  // Case B: 0 verified gaps & 0 unassessed JD skills -> Empty state
  if (totalRoadmapItems === 0) {
    return {
      targetRole: roleTitle,
      company: companyName,
      totalGaps: 0,
      unassessedCount: 0,
      totalItems: 0,
      hasGaps: false,
      summary: 'No skill gaps identified against this job description.',
      stages: [],
      unassessedSkills: [],
    }
  }

  // Group confirmed gaps and unassessed JD skills into parallel disciplines
  const engineeringCodes = new Set(['COD', 'SWE', 'OOD', 'DSA'])
  const dataSystemsCodes = new Set(['SQL', 'SYSD', 'CLOUD', 'AI', 'OS', 'NETW'])
  const diagnosticCodes = new Set(['APTI', 'COMM'])

  const trackEngineering = []
  const trackDataSystems = []
  const trackDiagnostic = []

  // 1. Confirmed Gap Nodes
  uniqueGaps.forEach((gapItem) => {
    const catName = gapItem.category_name
    const catCode = gapItem.category_code
    const currentLevel = gapItem.candidate_level
    const requiredLevel = gapItem.required_level
    const gapShortfall = gapItem.gap ?? Math.max(1, requiredLevel - currentLevel)
    const jdTerms = getJdTermsForCategory(catCode, catName, jdData)

    const focusTitle = jdTerms.length > 0
      ? `${catName} (${jdTerms.slice(0, 2).join(', ')})`
      : catName

    const whyMatters = jdTerms.length > 0
      ? `Explicitly required in the uploaded JD (${jdTerms.slice(0, 3).join(', ')}). Assessed at Level ${currentLevel} vs required Level ${requiredLevel} (gap of ${gapShortfall} levels).`
      : `Required by ${roleTitle} expectations at Level ${requiredLevel}; assessed at Level ${currentLevel} (gap of ${gapShortfall} levels).`

    const gapNode = {
      id: `gap-${catCode.toLowerCase()}`,
      title: focusTitle,
      category: catName,
      categoryCode: catCode,
      nodeType: 'gap_skill',
      currentLevel,
      targetLevel: requiredLevel,
      gap: gapShortfall,
      jdTerms,
      whyItMatters: whyMatters,
      status: 'gap',
    }

    if (engineeringCodes.has(catCode)) {
      trackEngineering.push(gapNode)
    } else if (diagnosticCodes.has(catCode)) {
      trackDiagnostic.push(gapNode)
    } else {
      trackDataSystems.push(gapNode)
    }
  })

  // 2. Unassessed JD Skills Nodes (Required by JD, not mentioned in resume)
  uniqueUnassessed.forEach((unItem) => {
    const catName = unItem.category_name
    const catCode = unItem.category_code
    const requiredLevel = unItem.required_level || 5
    const jdTerms = getJdTermsForCategory(catCode, catName, jdData)

    const focusTitle = jdTerms.length > 0
      ? `${catName} (${jdTerms.slice(0, 2).join(', ')})`
      : catName

    const whyMatters = jdTerms.length > 0
      ? `Required in the uploaded JD (${jdTerms.slice(0, 3).join(', ')}), but not mentioned in the resume. Learning roadmap provided for baseline mastery.`
      : `Required by ${roleTitle} but not mentioned in the resume. Learning roadmap provided for baseline mastery.`

    const unassessedNode = {
      id: `unassessed-${catCode.toLowerCase()}`,
      title: focusTitle,
      category: catName,
      categoryCode: catCode,
      nodeType: 'unassessed_skill',
      currentLevel: null,
      targetLevel: requiredLevel,
      gap: requiredLevel,
      jdTerms,
      whyItMatters: whyMatters,
      status: 'unassessed',
    }

    if (engineeringCodes.has(catCode)) {
      trackEngineering.push(unassessedNode)
    } else if (diagnosticCodes.has(catCode)) {
      trackDiagnostic.push(unassessedNode)
    } else {
      trackDataSystems.push(unassessedNode)
    }
  })

  const activeTracks = []
  if (trackEngineering.length > 0) {
    activeTracks.push({
      trackId: 'track-engineering',
      trackName: 'Engineering & Architecture Track',
      nodes: trackEngineering,
    })
  }
  if (trackDataSystems.length > 0) {
    activeTracks.push({
      trackId: 'track-data-systems',
      trackName: 'Data, Systems & Cloud Track',
      nodes: trackDataSystems,
    })
  }
  if (trackDiagnostic.length > 0) {
    activeTracks.push({
      trackId: 'track-diagnostic',
      trackName: 'Analytical & Professional Track',
      nodes: trackDiagnostic,
    })
  }

  const stages = [
    {
      id: 'stage-gaps',
      name: 'Skill Gap & Requirement Roadmap',
      description: `Targeted learning path addressing ${uniqueGaps.length} verified ${uniqueGaps.length === 1 ? 'gap' : 'gaps'}${uniqueUnassessed.length > 0 ? ` and ${uniqueUnassessed.length} unassessed ${uniqueUnassessed.length === 1 ? 'skill' : 'skills'}` : ''} for ${roleTitle}.`,
      parallel: activeTracks.length > 1,
      tracks: activeTracks,
    },
  ]

  return {
    targetRole: roleTitle,
    company: companyName,
    totalGaps: uniqueGaps.length,
    unassessedCount: uniqueUnassessed.length,
    totalItems: totalRoadmapItems,
    hasGaps: totalRoadmapItems > 0,
    summary: `Targeted learning roadmap addressing ${uniqueGaps.length} confirmed skill gaps and ${uniqueUnassessed.length} unassessed skills for ${roleTitle}.`,
    stages,
    unassessedSkills: uniqueUnassessed,
  }
}

/**
 * Node-based visual Skill-Gap Roadmap component inspired by full-stack.pdf.
 */
export function SkillGapRoadmap({
  talentResult,
  matchResult,
  jdData,
  profile,
  roadmapGraph = null,
  legacyRoadmap = null,
  isLoading = false,
  error = '',
  onRetry = null,
}) {
  // Derive robust graph from props or local generator
  const graph = useMemo(() => {
    if (roadmapGraph && Array.isArray(roadmapGraph.stages) && roadmapGraph.stages.length > 0 && roadmapGraph.total_gaps !== 0) {
      return roadmapGraph
    }
    return buildLocalJdRoadmap(talentResult, jdData, profile, matchResult)
  }, [roadmapGraph, talentResult, jdData, profile, matchResult])

  const targetRole = graph?.targetRole || graph?.target_role || jdData?.job_title || jdData?.jobTitle || talentResult?.assessment?.role || 'Target Role'
  const companyName = graph?.company || graph?.company_name || talentResult?.company?.name || talentResult?.assessment?.company || 'Selected Role'
  const totalGaps = graph?.totalGaps ?? graph?.total_gaps ?? 0
  const unassessedCount = graph?.unassessedCount ?? graph?.unassessed_count ?? (Array.isArray(graph?.unassessedSkills) ? graph.unassessedSkills.length : Array.isArray(graph?.unassessed_skills) ? graph.unassessed_skills.length : 0)
  const totalItems = graph?.totalItems ?? graph?.total_items ?? (totalGaps + unassessedCount)
  const stages = graph?.stages || []
  const unassessedSkills = graph?.unassessedSkills || graph?.unassessed_skills || []

  if (isLoading) {
    return (
      <div className="roadmap-container" role="status" aria-live="polite">
        <div className="roadmap-meta-card">
          <p className="roadmap-status">Generating personalized skill-gap roadmap for {targetRole}…</p>
        </div>
      </div>
    )
  }

  if (error && stages.length === 0) {
    return (
      <div className="roadmap-container">
        <Callout type="error" title="Roadmap unavailable">
          {error}
        </Callout>
        {onRetry && (
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onRetry}>
            Retry Roadmap
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="roadmap-container" id="results-roadmap-panel" role="tabpanel" aria-labelledby="results-roadmap-tab">
      {/* ── Visual Header & Legend (Inspired by full-stack.pdf) ── */}
      <div className="roadmap-meta-card">
        <div className="roadmap-header-row">
          <div className="roadmap-title-group">
            <h3>
              <Compass size={22} className="text-secondary" />
              <span>{targetRole} Skill-Gap Roadmap</span>
            </h3>
            <p>
              An objective, connected learning path generated for <strong className="candidate-name-highlight">{profile?.name || 'Candidate'}</strong> covering confirmed skill gaps and unassessed JD requirements for <strong>{companyName}</strong>.
            </p>
            <div className="roadmap-badge-strip">
              <Badge variant="subtle" size="sm">Target: {targetRole}</Badge>
              {totalGaps > 0 && (
                <Badge variant="warning" size="sm">
                  {totalGaps} Confirmed Skill {totalGaps === 1 ? 'Gap' : 'Gaps'}
                </Badge>
              )}
              {unassessedCount > 0 && (
                <Badge variant="info" size="sm">
                  {unassessedCount} Unassessed (Not in Resume)
                </Badge>
              )}
              {totalItems === 0 && (
                <Badge variant="success" size="sm">
                  No Skill Gaps Identified
                </Badge>
              )}
              {jdData?.company && <Badge variant="subtle" size="sm">Company: {jdData.company}</Badge>}
            </div>
          </div>

          {/* Visual Legend matching full-stack.pdf */}
          <div className="roadmap-legend-box" aria-label="Roadmap Legend">
            <span className="roadmap-legend-title">Roadmap Legend</span>
            <div className="roadmap-legend-items">
              <div className="legend-item">
                <span className="legend-sample sample-gap" aria-hidden="true" />
                <span>Confirmed Skill Gap (Target Level)</span>
              </div>
              <div className="legend-item">
                <span className="legend-sample sample-unassessed" aria-hidden="true" />
                <span>Unassessed (Required by JD, Not in Resume)</span>
              </div>
              <div className="legend-item">
                <span className="legend-sample sample-branch" aria-hidden="true" />
                <span>Parallel Learning Tracks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty State (When 0 Items Exist) ── */}
      {totalItems === 0 ? (
        <div className="roadmap-verified-box" role="status">
          <div className="verified-icon-circle" aria-hidden="true">
            <CheckCircle2 size={26} strokeWidth={2.5} />
          </div>
          <h4>No skill gaps identified against this job description.</h4>
          <p>
            The candidate demonstrates proficiency meeting or exceeding all evaluated requirements for <strong>{targetRole}</strong>. No remediation steps are needed.
          </p>
        </div>
      ) : (
        /* ── Connected Node Flow (Verified gap skills and unassessed JD skills) ── */
        <div className="roadmap-flow-wrapper">
          {stages.map((stage, stageIndex) => (
          <div key={stage.id || stageIndex} className="roadmap-stage-block">
            {/* Stage Header */}
            <div className="roadmap-stage-header">
              <span className="stage-number-pill">Stage {stageIndex + 1}</span>
              <span className="stage-title">{stage.name}</span>
              <div className="stage-divider-line" aria-hidden="true" />
            </div>
            {stage.description && <p className="stage-description">{stage.description}</p>}

            {/* Stage Tracks (Parallel Columns if multiple tracks exist) */}
            <div className={`roadmap-tracks-grid${stage.tracks?.length === 1 ? ' single-track' : ''}`}>
              {stage.tracks?.map((track, trackIndex) => {
                const trackId = track.trackId || track.track_id || trackIndex
                const trackName = track.trackName || track.track_name || `Track ${trackIndex + 1}`

                return (
                  <div key={trackId} className="roadmap-track-column">
                    <div className="track-column-header">
                      <GitBranch size={14} className="text-muted" aria-hidden="true" />
                      <span className="track-column-title">{trackName}</span>
                    </div>

                    <div className="roadmap-nodes-chain">
                      {track.nodes?.map((node, nodeIndex) => {
                        const nodeType = node.nodeType || node.node_type || 'gap_skill'
                        const isCheckpoint = nodeType === 'checkpoint'
                        const isPrereq = nodeType === 'prerequisite'
                        const isMilestone = nodeType === 'milestone'
                        const isUnassessed = nodeType === 'unassessed_skill' || node.status === 'unassessed'
                        const categoryCode = node.categoryCode || node.category_code
                        const currentLevel = node.currentLevel ?? node.current_level
                        const targetLevel = node.targetLevel ?? node.target_level
                        const whyItMatters = node.whyItMatters || node.why_it_matters
                        const pdfInfo = categoryCode ? SKILL_ROADMAP_PDFS[categoryCode] : null

                        return (
                          <div key={node.id || nodeIndex}>
                            {nodeIndex > 0 && (
                              <div className={`node-connector-line${isCheckpoint ? ' is-dashed' : ''}`} aria-hidden="true" />
                            )}

                            <div
                              className={`roadmap-node-card ${
                                isCheckpoint
                                  ? 'node-checkpoint'
                                  : isPrereq
                                  ? 'node-prerequisite'
                                  : isMilestone
                                  ? 'node-milestone'
                                  : isUnassessed
                                  ? 'node-unassessed'
                                  : 'node-gap'
                              }`}
                            >
                              <div className="node-top-bar">
                                <div className="node-title-group">
                                  <div className="node-icon-wrap" aria-hidden="true">
                                    {isCheckpoint ? (
                                      <CheckCircle2 size={14} />
                                    ) : isPrereq ? (
                                      <BookOpen size={14} />
                                    ) : isMilestone ? (
                                      <Flag size={14} />
                                    ) : isUnassessed ? (
                                      <HelpCircle size={14} />
                                    ) : (
                                      <Target size={14} />
                                    )}
                                  </div>
                                  <strong className="node-title">{node.title}</strong>
                                </div>

                                <div className="node-badges-row">
                                  {categoryCode && (
                                    <span className="badge-tag badge-cat">{categoryCode}</span>
                                  )}
                                  {isUnassessed && (
                                    <span className="badge-tag badge-unassessed">Not in Resume</span>
                                  )}
                                  {currentLevel != null && targetLevel != null ? (
                                    <span className="badge-tag badge-level">
                                      L{currentLevel} → L{targetLevel}
                                    </span>
                                  ) : targetLevel != null ? (
                                    <span className="badge-tag badge-level-unassessed">
                                      Target L{targetLevel}
                                    </span>
                                  ) : null}
                                  {isPrereq && (
                                    <span className="badge-tag badge-prereq">Prerequisite</span>
                                  )}
                                  {isCheckpoint && (
                                    <span className="badge-tag badge-checkpoint">Checkpoint</span>
                                  )}
                                </div>
                              </div>

                              {whyItMatters && (
                                <div className="node-jd-relevance">
                                  <strong>Role Context:</strong> {whyItMatters}
                                </div>
                              )}

                              {pdfInfo && (
                                <div className="node-action-footer">
                                  <a
                                    href={`/roadmaps/${pdfInfo.filename}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="node-pdf-link"
                                    title={`Open ${pdfInfo.title} in a new browser tab`}
                                  >
                                    <FileText size={13} className="node-pdf-icon" aria-hidden="true" />
                                    <span>{pdfInfo.title}</span>
                                    <ExternalLink size={12} className="node-pdf-ext" aria-hidden="true" />
                                  </a>
                                </div>
                              )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )})}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* ── Unassessed Skills Diagnostic Callout ── */}
      {unassessedSkills.length > 0 && (
        <div className="unassessed-skills-box">
          <div className="unassessed-header">
            <Info size={15} />
            <span>Unassessed Skills ({unassessedSkills.length})</span>
          </div>
          <p className="unassessed-desc">
            The following categories were not evaluated because direct supporting evidence was absent in the profile. In accordance with RADIX evaluation rules, they are <strong>not confirmed skill gaps</strong>.
          </p>
          <div className="unassessed-badges-list">
            {unassessedSkills.map((item, idx) => (
              <Badge key={idx} variant="subtle" size="sm">
                {item.category || item.categoryCode}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
