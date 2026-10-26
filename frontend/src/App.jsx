import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import ProfileCard from './components/ProfileCard'
import SkillsGrid from './components/SkillsGrid'
import TalentCheck from './components/TalentCheck'
import './App.css'
import './index.css'

const DEMO_PROFILE = {
  name: 'Rohan Verma',
  email: 'rohan.verma@example.com',
  education: {
    degree: 'B.Tech, Computer Science and Engineering',
    college: 'Class of 2026',
    graducation_year: '2026',
    cgpa: 9.1,
  },
  skills: [
    { skill_name: 'Coding', skill_code: 'COD', skill_level: 9, evidence: ['Proficient in C++, Python, SQL', '500+ problems solved across competitive programming platforms'], confidence: 'High' },
    { skill_name: 'Data Structures & Algorithms', skill_code: 'DSA', skill_level: 9, evidence: ['500+ competitive programming problems', 'Strong foundation in trees, graphs, dynamic programming'], confidence: 'High' },
    { skill_name: 'Object-Oriented Design', skill_code: 'OOD', skill_level: 8, evidence: ['Wrote technical blog series on object-oriented design patterns used in real-world systems'], confidence: 'High' },
    { skill_name: 'Aptitude', skill_code: 'APT', skill_level: 8, evidence: ['High analytical and quantitative aptitude from engineering coursework'], confidence: 'Medium' },
    { skill_name: 'Communication', skill_code: 'COM', skill_level: 7, evidence: ['Technical blogger and open-source contributor with 2 merged PRs'], confidence: 'Medium' },
    { skill_name: 'Artificial Intelligence', skill_code: 'AI', skill_level: 7, evidence: ['Built recommendation engine using collaborative filtering on movie-ratings dataset'], confidence: 'High' },
    { skill_name: 'Cloud', skill_code: 'CLD', skill_level: 8, evidence: ['Docker, Git, and horizontally-scalable workers in cloud deployment'], confidence: 'High' },
    { skill_name: 'SQL', skill_code: 'SQL', skill_level: 8, evidence: ['Relational schema design and query optimization for distributed notification backend'], confidence: 'High' },
    { skill_name: 'Software Engineering', skill_code: 'SWE', skill_level: 8, evidence: ['Software Engineering intern at Series-B startup — shipped a feature end-to-end including tests and CI'], confidence: 'High' },
    { skill_name: 'System Design', skill_code: 'SYS', skill_level: 8, evidence: ['Designed and built a scalable notification service (pub-sub architecture, horizontally-scalable workers)'], confidence: 'High' },
    { skill_name: 'Networking', skill_code: 'NET', skill_level: 7, evidence: ['Network sockets and real-time collaborative document editor at national hackathon'], confidence: 'Medium' },
    { skill_name: 'Operating Systems', skill_code: 'OS', skill_level: 8, evidence: ['Concurrency, multithreading, and OS scheduling fundamentals'], confidence: 'High' },
  ],
  hackathons: ['Winner, national inter-college hackathon — built a real-time collaborative document editor'],
  internships: ['Software Engineering intern at a Series-B startup — shipped a feature end-to-end including tests and CI'],
  certifications: ['Self-taught via applied projects; open-source contributor'],
  preferred_roles: ['Software Engineer', 'Data Scientist', 'Backend Engineer'],
  cv_file: 'Rohan Verma.pdf',
}

export default function App() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const resultRef = useRef(null)

  const handleProfileReceived = (data) => {
    setProfile(data)
    if (data && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const handleLoadDemoProfile = () => {
    handleProfileReceived(DEMO_PROFILE)
  }

  // Ambient background glow that follows mouse
  useEffect(() => {
    const glow = document.querySelector('.ambient-glow')
    if (!glow) return
    const onMove = (e) => {
      gsap.to(glow, {
        x: e.clientX - 200,
        y: e.clientY - 200,
        duration: 1.2,
        ease: 'power2.out',
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      {/* Ambient blob */}
      <div className="ambient-glow" aria-hidden="true" />

      <div className="app-shell">
        <Header />

        <main className="main-content">
          <div className="hero-text">
            <h1 className="hero-title">
              AI-Powered<br />
              <span className="gradient-text">Talent Match Platform</span>
            </h1>
            <p className="hero-sub">
              End-to-end candidate assessment: extract your competencies from resumes,
              inspect job requirements, and run deep Talent Checks against real enterprise bars.
            </p>
          </div>

          <UploadZone
            onProfileReceived={handleProfileReceived}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {profile && (
            <div ref={resultRef} className="results-section">
              <div className="results-divider">
                <span className="divider-label">Role 3: Extracted Candidate Profile</span>
              </div>
              <ProfileCard profile={profile} />
              <SkillsGrid skills={profile.skills} />
            </div>
          )}

          {/* Role 4: Company-Specific Talent Check */}
          <TalentCheck
            profile={profile}
            onDemoProfileRequested={handleLoadDemoProfile}
          />
        </main>
      </div>
    </>
  )
}
