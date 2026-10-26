import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  Code2,
  GitBranch,
  Boxes,
  Brain,
  MessageSquare,
  Cpu,
  Cloud,
  Database,
  Terminal,
  Server,
  Network,
  Laptop,
  Sparkles,
} from 'lucide-react'
import './SkillsGrid.css'

const SKILL_META = {
  COD: { Icon: Code2 },
  DSA: { Icon: GitBranch },
  OOD: { Icon: Boxes },
  APT: { Icon: Brain },
  COM: { Icon: MessageSquare },
  AI:  { Icon: Cpu },
  CLD: { Icon: Cloud },
  SQL: { Icon: Database },
  SWE: { Icon: Terminal },
  SYS: { Icon: Server },
  NET: { Icon: Network },
  OS:  { Icon: Laptop },
  OTH: { Icon: Sparkles },
}

export default function SkillsGrid({ skills }) {
  const gridRef = useRef(null)

  // ── Preserved GSAP animation on skills entrance and progress bars ────────
  useEffect(() => {
    if (!skills?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      gridRef.current.querySelectorAll('.skill-card'),
      { opacity: 0, y: 30, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: { amount: 0.6, from: 'start' },
        duration: 0.55,
        ease: 'power3.out',
      }
    )
    // Animate each progress bar fill
    gridRef.current.querySelectorAll('.skill-fill').forEach((el) => {
      const target = el.dataset.level
      gsap.fromTo(el,
        { width: '0%' },
        { width: `${target}%`, duration: 1, ease: 'power2.out', delay: 0.3 }
      )
    })
  }, [skills])

  if (!skills?.length) return null

  return (
    <section id="skills" className="skills-section">
      <div className="section-header">
        <h2 className="section-title">Skill Assessment</h2>
        <p className="section-sub">AI-evaluated competencies extracted from your resume</p>
      </div>
      <div className="skills-grid" ref={gridRef}>
        {skills.map((skill, i) => (
          <SkillCard key={i} skill={skill} />
        ))}
      </div>
    </section>
  )
}

function SkillCard({ skill }) {
  const meta = SKILL_META[skill.skill_code] || SKILL_META.OTH
  const levelPct = (skill.skill_level / 10) * 100
  return (
    <div
      className="skill-card neo-card"
    >
      <div className="skill-top">
        <div className="skill-icon">
          <meta.Icon size={18} strokeWidth={2} />
        </div>
        <div className="skill-level-badge neo-inset">
          <span>{skill.skill_level}</span>
          <span className="skill-level-max">/10</span>
        </div>
      </div>

      <div className="skill-name">{skill.skill_name}</div>

      <div className="skill-bar neo-inset">
        <div
          className="skill-fill"
          data-level={levelPct}
          style={{ width: '0%' }}
        />
      </div>

      <div className="skill-meta">
        <ConfidencePip level={skill.confidence} />
        {skill.evidence?.length > 0 && (
          <span className="evidence-count">{skill.evidence.length} evidence{skill.evidence.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {skill.evidence?.length > 0 && (
        <details className="evidence-details">
          <summary>View evidence</summary>
          <ul className="evidence-list">
            {skill.evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function ConfidencePip({ level }) {
  const colors = { High: '#EDEDED', Medium: '#5e5e5e', Low: '#707070' }
  return (
    <span className="confidence-pip" style={{ '--pip-color': colors[level] || '#5e5e5e' }}>
      <span className="pip-dot" />
      {level}
    </span>
  )
}
