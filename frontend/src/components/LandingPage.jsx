import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  UserCheck,
  FileText,
  FileSearch,
  Building2,
  Target,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import './LandingPage.css'

const FEATURES = [
  {
    Icon: UserCheck,
    title: 'Candidate Profile Building',
    desc: 'Upload your resume and get a structured candidate profile with skills, education, certifications, and experience automatically extracted.',
  },
  {
    Icon: FileText,
    title: 'Resume Parsing',
    desc: 'AI-powered parsing extracts meaningful signals from your resume, evaluating skill levels with confidence ratings and supporting evidence.',
  },
  {
    Icon: FileSearch,
    title: 'Job Description Analysis',
    desc: 'Upload any job description to extract required skills mapped across 12 RADIX skill categories and specific technologies.',
  },
  {
    Icon: Building2,
    title: 'Company Skill Insights',
    desc: 'Explore what technical and non-technical skills companies demand and how requirements differ across roles and levels.',
  },
  {
    Icon: Target,
    title: 'Skill Gap Identification',
    desc: 'See exactly which skills you match, which are missing, and get actionable recommendations to close the gap.',
  },
]

const WORKFLOW = [
  { num: '1', title: 'Build Profile',   desc: 'Upload your resume' },
  { num: '2', title: 'Parse Resume',    desc: 'AI extracts your skills' },
  { num: '3', title: 'Analyse JD',      desc: 'Upload a job description' },
  { num: '4', title: 'Match & Improve', desc: 'See your gap report' },
]

export default function LandingPage({ onNavigate }) {
  const heroRef     = useRef(null)
  const badgeRef    = useRef(null)
  const titleRef    = useRef(null)
  const subRef      = useRef(null)
  const ctaRef      = useRef(null)
  const visualRef   = useRef(null)
  const statsRef    = useRef(null)
  const featuresRef = useRef(null)

  useEffect(() => {
    // ── Hero staggered entrance (GSAP animation) ──────────────────────────
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
      .fromTo(titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      )
      .fromTo(subRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.35'
      )
      .fromTo(ctaRef.current?.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 },
        '-=0.3'
      )
      .fromTo(visualRef.current,
        { opacity: 0, scale: 0.92, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.7 },
        '-=0.5'
      )

      // Floating idle animation on the hero visual card
      gsap.to(visualRef.current?.querySelector('.hero-card-main'), {
        y: -10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      })

      // Stats entrance
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, delay: 0.6, ease: 'power2.out' }
        )
      }

      // Features entrance
      if (featuresRef.current) {
        gsap.fromTo(
          featuresRef.current.children,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, delay: 0.8, ease: 'power2.out' }
        )
      }
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={heroRef} className="landing-page">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-left">
          <div className="hero-badge-wrap" ref={badgeRef}>
            <Badge
              variant="default"
              icon={<span className="hero-badge-dot" aria-hidden="true" />}
            >
              Powered by AI · 12 RADIX skill categories
            </Badge>
          </div>

          <h1 id="hero-heading" className="hero-title" ref={titleRef}>
            Connect Talent<br />
            with <span className="gradient-text">Opportunity</span>
          </h1>

          <p className="hero-sub" ref={subRef}>
            RADIX Talent Match uses AI to build candidate profiles, parse resumes,
            analyse job descriptions, and pinpoint exactly where skills match — and where gaps remain.
          </p>

          <div className="hero-ctas" ref={ctaRef}>
            <Button
              id="hero-cta-profile"
              variant="primary"
              size="lg"
              onClick={() => onNavigate('wizard')}
              iconRight={<ArrowRight size={16} />}
            >
              Start Match Wizard
            </Button>
            <Button
              id="hero-cta-analysis"
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('analysis')}
            >
              Explore Skill Matching
            </Button>
          </div>
        </div>

        <div className="hero-visual" ref={visualRef} aria-hidden="true">
          <div className="hero-card-stack">
            <div className="hero-card hero-card-behind">
              <div className="hero-card-label">Candidate Profile</div>
              <div className="hero-card-name">Alex Johnson</div>
              <div className="hero-card-role">Software Engineer</div>
              <div className="hero-mini-skills">
                <span className="hero-mini-skill">Python</span>
                <span className="hero-mini-skill">Cloud</span>
              </div>
            </div>
            <div className="hero-card hero-card-main">
              <div className="hero-card-label">Skill Match Report</div>
              <div className="hero-card-name">Senior Backend Role</div>
              <div className="hero-card-role">Your profile · 3 matches found</div>
              <div className="hero-mini-skills">
                <span className="hero-mini-skill">
                  <Check size={11} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Coding
                </span>
                <span className="hero-mini-skill">
                  <Check size={11} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  SQL
                </span>
                <span className="hero-mini-skill">
                  <Check size={11} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Cloud
                </span>
              </div>
              <div className="hero-match-score">
                <span className="hero-score-num">76%</span>
                <span className="hero-score-label">Skill match<br />2 gaps identified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="stats-bar" ref={statsRef} role="list" aria-label="Platform statistics">
        <div className="stat-card" role="listitem">
          <div className="stat-num">12</div>
          <div className="stat-label">RADIX Skill Categories</div>
        </div>
        <div className="stat-card" role="listitem">
          <div className="stat-num">2</div>
          <div className="stat-label">Active API Endpoints</div>
        </div>
        <div className="stat-card" role="listitem">
          <div className="stat-num">AI</div>
          <div className="stat-label">LLM-Powered Extraction</div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="features-section" aria-labelledby="features-heading">
        <div className="features-header">
          <h2 id="features-heading">Everything you need to find the right fit</h2>
          <p>A complete talent intelligence pipeline from resume to recommendation.</p>
        </div>
        <div className="features-grid" ref={featuresRef} role="list">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card" role="listitem">
              <div className="feature-icon-wrap" aria-hidden="true">
                <f.Icon size={24} strokeWidth={2} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow ──────────────────────────────────────────────── */}
      <section className="workflow-section" aria-labelledby="workflow-heading">
        <div className="workflow-header">
          <h2 id="workflow-heading">How it works</h2>
        </div>
        <div className="workflow-steps" role="list">
          {WORKFLOW.map((step) => (
            <div key={step.num} className="workflow-step" role="listitem">
              <div className="workflow-step-num" aria-label={`Step ${step.num}`}>{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ────────────────────────────────────────────── */}
      <div className="cta-strip" role="complementary" aria-label="Get started call to action">
        <h2>Ready to find your perfect match?</h2>
        <p>Build your profile in seconds and discover where you stand.</p>
        <div className="cta-strip-btns">
          <Button
            id="cta-strip-profile"
            variant="primary"
            size="lg"
            onClick={() => onNavigate('wizard')}
          >
            Start Match Wizard
          </Button>
          <Button
            id="cta-strip-resume"
            variant="ghost"
            size="lg"
            onClick={() => onNavigate('resume')}
          >
            Parse a Resume
          </Button>
        </div>
      </div>
    </div>
  )
}
