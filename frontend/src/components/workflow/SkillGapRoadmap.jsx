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
 * Returns foundational prerequisites only when candidate proficiency is low (<= 3).
 */
function getPrerequisitesForCategory(categoryCode, candidateLevel) {
  if (typeof candidateLevel === 'number' && candidateLevel >= 4) return []

  const catalog = {
    SQL: {
      title: 'Relational Data Modeling & Basic CRUD',
      reason: 'Database schema fundamentals required before index optimization.',
      tasks: ['Review relational tables, primary/foreign keys, and 1NF-3NF normalization.', 'Practise fundamental SELECT, INSERT, UPDATE, and DELETE operations.'],
      checkpoint: 'Checkpoint — Relational Schema Baseline',
    },
    COD: {
      title: 'Syntax, Control Flow & Modular Functions',
      reason: 'Core language mechanics required before production application development.',
      tasks: ['Review data types, loops, conditionals, and modular functions.', 'Implement structured error handling and clean code conventions.'],
      checkpoint: 'Checkpoint — Core Program Flow & Tests',
    },
    DSA: {
      title: 'Linear Data Structures & Complexity Basics',
      reason: 'Arrays, hash maps, and Big-O are prerequisites for non-linear structures.',
      tasks: ['Implement and manipulate arrays, strings, hash maps, and sets.', 'Analyse Time and Space complexity (Big-O) for basic search and sort.'],
      checkpoint: 'Checkpoint — Linear Structure Implementations',
    },
    SYSD: {
      title: 'Client-Server Architecture & HTTP Basics',
      reason: 'Network protocols and APIs are essential before distributed system design.',
      tasks: ['Review client-server request-response lifecycle and HTTP status codes.', 'Understand synchronous vs asynchronous communication patterns.'],
      checkpoint: 'Checkpoint — RESTful Communication Baseline',
    },
    SWE: {
      title: 'Git Version Control & Basic Unit Testing',
      reason: 'Version control and test habits are required before automated CI/CD pipelines.',
      tasks: ['Practise Git branch workflows, pull requests, and commit standards.', 'Write basic unit tests asserting input/output boundaries.'],
      checkpoint: 'Checkpoint — Git Workflow & Test Suite',
    },
    CLOUD: {
      title: 'CLI Navigation & Container Basics',
      reason: 'Command-line competence and containers are required before cloud deployment.',
      tasks: ['Review shell commands, environment variables, and process management.', 'Create a simple Dockerfile and run a containerized application.'],
      checkpoint: 'Checkpoint — Local Container Execution',
    },
    OOD: {
      title: 'Classes, Objects & Encapsulation Basics',
      reason: 'Object orientation fundamentals precede design patterns and SOLID principles.',
      tasks: ['Model simple real-world entities with classes, attributes, and methods.', 'Practise encapsulation, inheritance, and interface contracts.'],
      checkpoint: 'Checkpoint — Domain Model with Unit Tests',
    },
    AI: {
      title: 'API Integration & Structured JSON Handling',
      reason: 'Working with model endpoints and validating schemas precedes complex AI workflows.',
      tasks: ['Connect to an AI API endpoint and pass structured parameters.', 'Validate model response JSON schemas with strict validation.'],
      checkpoint: 'Checkpoint — Structured API Pipeline',
    },
    OS: {
      title: 'Process, Memory & File System Fundamentals',
      reason: 'Operating system basics are required before tackling concurrency and synchronization.',
      tasks: ['Review process states, memory allocation, and file descriptors.', 'Inspect running processes and resource usage via system utilities.'],
      checkpoint: 'Checkpoint — Process Inspection & Trace',
    },
    NETW: {
      title: 'TCP/IP, DNS & Port Fundamentals',
      reason: 'Transport and naming basics are required before advanced network diagnostics.',
      tasks: ['Review IP addressing, DNS resolution, and TCP handshake steps.', 'Inspect local network ports and active socket connections.'],
      checkpoint: 'Checkpoint — Socket Connection Trace',
    },
    COMM: {
      title: 'Technical Documentation Foundations',
      reason: 'Clear written structure is essential before presenting complex system designs.',
      tasks: ['Draft structured markdown documentation explaining a technical feature.', 'Define user expectations, setup instructions, and known boundaries.'],
      checkpoint: 'Checkpoint — Documentation Review',
    },
    APTI: {
      title: 'Quantitative & Logical Diagnostic Baseline',
      reason: 'A baseline diagnostic isolates specific problem types needing focused remediation.',
      tasks: ['Complete a foundational problem set covering arithmetic and logical deduction.', 'Identify specific problem patterns causing incorrect answers.'],
      checkpoint: 'Checkpoint — Diagnostic Gap Inventory',
    },
  }

  const item = catalog[categoryCode]
  if (!item) return []
  return [{
    id: `prereq-${categoryCode.toLowerCase()}`,
    title: item.title,
    categoryCode,
    nodeType: 'prerequisite',
    whyItMatters: item.reason,
    tasks: item.tasks,
    checkpoint: item.checkpoint,
  }]
}

/**
 * Builds local verified graph from talentResult and uploaded jdData.
 */
function buildLocalJdRoadmap(talentResult, jdData, profile) {
  const assessment = talentResult?.assessment || talentResult || {}
  const rawGaps = assessment.skillset_gap || []
  const roleTitle = jdData?.job_title || jdData?.jobTitle || assessment.role || 'Target Role'
  const companyName = talentResult?.company?.name || assessment.company || 'Selected Role'

  // Confirmed gaps: meets_requirement is explicitly false with numeric levels
  const confirmedGaps = rawGaps.filter((item) => item.meets_requirement === false)
  const unassessedGaps = rawGaps.filter((item) => item.candidate_level === null || item.meets_requirement === null)

  // Completion State: 0 confirmed gaps
  if (confirmedGaps.length === 0) {
    return {
      targetRole: roleTitle,
      company: companyName,
      totalGaps: 0,
      hasGaps: false,
      summary: `All evaluated skills meet or exceed configured requirements for ${roleTitle}.`,
      stages: [
        {
          id: 'stage-verified',
          name: 'Role Alignment Verified',
          description: `Candidate demonstrates required proficiency across all evaluated categories for ${roleTitle}.`,
          tracks: [
            {
              trackId: 'track-verified',
              trackName: 'Readiness & Verification Track',
              nodes: [
                {
                  id: 'node-verified-alignment',
                  title: 'Core Role Alignment Confirmed',
                  category: 'Role Alignment',
                  categoryCode: 'MATCH',
                  nodeType: 'milestone',
                  status: 'completed',
                  whyItMatters: `Assessed levels meet or exceed the requirements for ${roleTitle} at ${companyName}.`,
                  tasks: [
                    'Review technical project architecture highlights to prepare for technical interviews.',
                    'Document system trade-offs, database choices, and testing strategies from existing portfolio work.',
                  ],
                  checkpoint: 'Checkpoint — Portfolio & Technical Interview Readiness',
                },
              ],
            },
          ],
        },
      ],
      unassessedSkills: unassessedGaps.map((item) => ({
        category: item.category_name,
        categoryCode: item.category_code,
      })),
    }
  }

  // Group confirmed gaps into parallel disciplines
  const engineeringCodes = new Set(['COD', 'SWE', 'OOD', 'DSA'])
  const dataSystemsCodes = new Set(['SQL', 'SYSD', 'CLOUD', 'AI', 'OS', 'NETW'])
  const diagnosticCodes = new Set(['APTI', 'COMM'])

  const prereqNodes = []
  const trackEngineering = []
  const trackDataSystems = []
  const trackDiagnostic = []
  const seenCategories = new Set()

  confirmedGaps.forEach((gapItem) => {
    const catName = gapItem.category_name
    const catCode = gapItem.category_code || normalizeCategory(catName)
    if (seenCategories.has(catCode)) return
    seenCategories.add(catCode)

    const currentLevel = gapItem.candidate_level ?? 1
    const requiredLevel = gapItem.required_level ?? 5
    const gapShortfall = gapItem.gap ?? Math.max(1, requiredLevel - currentLevel)
    const jdTerms = getJdTermsForCategory(catCode, catName, jdData)

    const focusTitle = jdTerms.length > 0
      ? `${catName} (${jdTerms.slice(0, 2).join(', ')})`
      : catName

    const whyMatters = jdTerms.length > 0
      ? `Explicitly required in the uploaded JD (${jdTerms.slice(0, 3).join(', ')}). Assessed at Level ${currentLevel} vs required Level ${requiredLevel} (gap of ${gapShortfall} levels).`
      : `Required by ${roleTitle} expectations at Level ${requiredLevel}; assessed at Level ${currentLevel} (gap of ${gapShortfall} levels).`

    // Check for prerequisite only when level is low (<= 3)
    const prereqs = getPrerequisitesForCategory(catCode, currentLevel)
    prereqs.forEach((p) => prereqNodes.push(p))

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
      tasks: [
        `Review core concepts and practices for ${focusTitle} targeting Level ${requiredLevel}.`,
        `Complete a targeted exercise demonstrating ${catName} in a practical project.`,
        'Document implementation decisions and test against expected criteria.',
      ],
      prerequisites: prereqs.map((p) => p.title),
      checkpoint: `Checkpoint — Practical ${catName} Implementation`,
    }

    const checkpointNode = {
      id: `checkpoint-${catCode.toLowerCase()}`,
      title: `Checkpoint — ${catName} Demonstration`,
      category: catName,
      categoryCode: catCode,
      nodeType: 'checkpoint',
      whyItMatters: `Verifies practical attainment of ${catName} to satisfy ${roleTitle} criteria.`,
      tasks: [
        `Deliver a working demonstration of ${focusTitle} with clear documentation.`,
        'Verify edge cases, test coverage, and performance considerations.',
      ],
    }

    if (engineeringCodes.has(catCode)) {
      trackEngineering.push(gapNode, checkpointNode)
    } else if (diagnosticCodes.has(catCode)) {
      trackDiagnostic.push(gapNode, checkpointNode)
    } else {
      trackDataSystems.push(gapNode, checkpointNode)
    }
  })

  const stages = []

  // Stage 1: Prerequisites (if low proficiency exists)
  if (prereqNodes.length > 0) {
    stages.append?.({
      id: 'stage-1-prereq',
      name: 'Phase 1: Foundational Prerequisites',
      description: 'Essential fundamentals required before diving into advanced role requirements.',
      tracks: [{ trackId: 'prereq-track', trackName: 'Prerequisites Track', nodes: prereqNodes }],
    }) || stages.push({
      id: 'stage-1-prereq',
      name: 'Phase 1: Foundational Prerequisites',
      description: 'Essential fundamentals required before diving into advanced role requirements.',
      tracks: [{ trackId: 'prereq-track', trackName: 'Prerequisites Track', nodes: prereqNodes }],
    })
  }

  // Stage 2: Core Skill Gap Remediation (Parallel branches)
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

  stages.push({
    id: 'stage-2-gaps',
    name: 'Phase 2: Core Skill Gap Remediation (Parallel Tracks)',
    description: 'Focused learning paths for confirmed skill gaps. Independent tracks can proceed in parallel.',
    parallel: activeTracks.length > 1,
    tracks: activeTracks,
  })

  // Stage 3: Applied Capstone Milestone
  const capstoneNode = {
    id: 'node-capstone-integration',
    title: `Applied Capstone: ${roleTitle} Integration`,
    category: 'Role Integration',
    categoryCode: 'INTEGRATION',
    nodeType: 'milestone',
    whyItMatters: `Demonstrates end-to-end competence across the skills required by ${roleTitle} at ${companyName}.`,
    tasks: [
      `Build a working application integrating the newly leveled skills from the JD (${[...seenCategories].join(', ')}).`,
      'Document architecture decisions, data flow, and testing procedures in a README.',
      'Record a technical walkthrough demonstrating system resilience and lessons learned.',
    ],
    checkpoint: `Checkpoint — Verified ${roleTitle} Project Submission`,
  }

  stages.push({
    id: 'stage-3-capstone',
    name: 'Phase 3: Applied Integration & Role Readiness',
    description: `Synthesize improved skills in a practical project meeting ${roleTitle} role expectations.`,
    tracks: [
      {
        trackId: 'capstone-track',
        trackName: 'Role Integration Track',
        nodes: [capstoneNode],
      },
    ],
  })

  return {
    targetRole: roleTitle,
    company: companyName,
    totalGaps: seenCategories.size,
    hasGaps: true,
    summary: `Targeted learning roadmap addressing ${seenCategories.size} confirmed skill gaps for ${roleTitle}.`,
    stages,
    unassessedSkills: unassessedGaps.map((item) => ({
      category: item.category_name,
      categoryCode: item.category_code,
    })),
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
    if (roadmapGraph && Array.isArray(roadmapGraph.stages) && roadmapGraph.stages.length > 0) {
      return roadmapGraph
    }
    return buildLocalJdRoadmap(talentResult, jdData, profile)
  }, [roadmapGraph, talentResult, jdData, profile])

  const targetRole = graph?.targetRole || graph?.target_role || jdData?.job_title || jdData?.jobTitle || talentResult?.assessment?.role || 'Target Role'
  const companyName = graph?.company || graph?.company_name || talentResult?.company?.name || talentResult?.assessment?.company || 'Selected Role'
  const totalGaps = graph?.totalGaps ?? graph?.total_gaps ?? 0
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
              An objective, connected learning path generated for <strong className="candidate-name-highlight">{profile?.name || 'Candidate'}</strong> to remediate confirmed skill gaps required by <strong>{companyName}</strong>.
            </p>
            <div className="roadmap-badge-strip">
              <Badge variant="subtle" size="sm">Target: {targetRole}</Badge>
              <Badge variant={totalGaps > 0 ? 'warning' : 'success'} size="sm">
                {totalGaps > 0 ? `${totalGaps} Confirmed Skill Gaps` : 'All Evaluated Requirements Met'}
              </Badge>
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
                <span className="legend-sample sample-prereq" aria-hidden="true" />
                <span>Foundational Prerequisite</span>
              </div>
              <div className="legend-item">
                <span className="legend-sample sample-checkpoint" aria-hidden="true" />
                <span>Practical Checkpoint / Milestone</span>
              </div>
              <div className="legend-item">
                <span className="legend-sample sample-branch" aria-hidden="true" />
                <span>Parallel Learning Tracks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Completion State (When 0 Confirmed Gaps Exist) ── */}
      {totalGaps === 0 && (
        <div className="roadmap-verified-box">
          <div className="verified-icon-circle" aria-hidden="true">
            <CheckCircle2 size={26} strokeWidth={2.5} />
          </div>
          <h4>Role Alignment Verified for {targetRole}</h4>
          <p>
            The candidate demonstrates proficiency meeting or exceeding the required levels across all evaluated categories for this position. No remediation tracks are needed.
          </p>
        </div>
      )}

      {/* ── Connected Node Flow ── */}
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
                                  {currentLevel != null && targetLevel != null && (
                                    <span className="badge-tag badge-level">
                                      L{currentLevel} → L{targetLevel}
                                    </span>
                                  )}
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
