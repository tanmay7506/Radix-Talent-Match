import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './ProfileCard.css'

export default function ProfileCard({ profile }) {
  const cardRef = useRef(null)
  const avatarRef = useRef(null)

  useEffect(() => {
    if (!profile) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(cardRef.current,
      { opacity: 0, y: 50, scale: 0.93 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8 }
    )
    .fromTo(avatarRef.current,
      { scale: 0, rotate: -15 },
      { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(1.8)' },
      '-=0.4'
    )
    .fromTo(
      cardRef.current.querySelectorAll('.info-row'),
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, stagger: 0.1, duration: 0.5 },
      '-=0.3'
    )
  }, [profile])

  if (!profile) return null

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  return (
    <div id="profile" className="profile-card neo-card" ref={cardRef}>
      <div className="profile-header">
        <div className="avatar-wrap" ref={avatarRef}>
          <div className="avatar neo-inset">
            <span className="avatar-initials">{initials}</span>
          </div>
        </div>
        <div className="profile-identity">
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-email">{profile.email}</p>
        </div>
      </div>

      <div className="profile-body">
        {profile.education && (
          <InfoRow icon="🎓" label="Education">
            <strong>{profile.education.degree}</strong>
            <span className="info-sub">{profile.education.college} · {profile.education.graducation_year}</span>
            {profile.education.cgpa && (
              <span className="badge neo-inset">CGPA {profile.education.cgpa}</span>
            )}
          </InfoRow>
        )}

        {profile.preferred_roles?.length > 0 && (
          <InfoRow icon="💼" label="Preferred Roles">
            <div className="tag-list">
              {profile.preferred_roles.map((r, i) => (
                <span key={i} className="tag neo-inset">{r}</span>
              ))}
            </div>
          </InfoRow>
        )}

        {profile.internships?.length > 0 && (
          <InfoRow icon="🏢" label="Internships">
            <ul className="bullet-list">
              {profile.internships.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </InfoRow>
        )}

        {profile.hackathons?.length > 0 && (
          <InfoRow icon="⚡" label="Hackathons">
            <ul className="bullet-list">
              {profile.hackathons.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </InfoRow>
        )}

        {profile.certifications?.length > 0 && (
          <InfoRow icon="🏅" label="Certifications">
            <div className="tag-list">
              {profile.certifications.map((c, i) => (
                <span key={i} className="tag neo-inset">{c}</span>
              ))}
            </div>
          </InfoRow>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="info-row">
      <div className="info-row-label">
        <span className="info-icon">{icon}</span>
        <span className="info-label-text">{label}</span>
      </div>
      <div className="info-row-content">{children}</div>
    </div>
  )
}
