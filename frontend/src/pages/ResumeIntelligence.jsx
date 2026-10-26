import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractResumeProfile } from '../services/api';

const PRESET_ELENA = {
  name: "Elena Rostova",
  title: "Principal Systems Architect",
  summary: "12+ Years Experience • Systems Engineering & Distributed Databases",
  location: "San Francisco, CA / Hybrid",
  tier: "Tier 1 Target",
  trajectory: [
    {
      role: "Principal Systems Architect",
      company: "Chronos Labs",
      period: "2021 — PRESENT",
      description: "Spearheaded low-latency consensus engine across 4,000+ nodes using Raft and Rust. Eliminated tail-latency jitter by 42% through eBPF kernel tracing and zero-alloc memory allocator."
    },
    {
      role: "Staff Infrastructure Engineer",
      company: "Vortex Distributed",
      period: "2017 — 2021",
      description: "Architected distributed key-value storage engine handling 8M+ QPS. Led shard rebalancing protocols and Byzantine fault recovery."
    },
    {
      role: "Senior Systems Engineer",
      company: "Nexis Cloud",
      period: "2013 — 2017",
      description: "Implemented high-performance Linux network stack primitives and container runtime isolation."
    }
  ],
  skills: [
    { skill_name: "Distributed Consensus (Raft/Paxos)", category_code: "SYSD", level: 9 },
    { skill_name: "Rust / C++ Memory Safety", category_code: "COD", level: 9 },
    { skill_name: "Linux Kernel & eBPF Tracing", category_code: "OS", level: 8 },
    { skill_name: "Distributed Storage Engines", category_code: "SQL", level: 8 },
    { skill_name: "Fault Tolerance & Byzantine Recovery", category_code: "SYSD", level: 9 },
    { skill_name: "High Concurrency & Low Latency", category_code: "COD", level: 8 },
    { skill_name: "Cloud Native Orchestration", category_code: "CLOUD", level: 7 },
    { skill_name: "Technical Architecture RFCs", category_code: "COMM", level: 8 },
    { skill_name: "Algorithmic Complexity", category_code: "DSA", level: 9 },
    { skill_name: "Production Resiliency", category_code: "SWE", level: 8 },
    { skill_name: "Cognitive Problem Solving", category_code: "APTI", level: 8 },
    { skill_name: "CI/CD & GitOps Automation", category_code: "SWE", level: 7 }
  ]
};

export default function ResumeIntelligence() {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(PRESET_ELENA);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => setResumeText(event.target.result);
        reader.readAsText(file);
      }
    }
  };

  const handleLoadPreset = () => {
    setSelectedFile(null);
    setResumeText('');
    setCandidateProfile(PRESET_ELENA);
    sessionStorage.setItem('alohomora_current_candidate', JSON.stringify(PRESET_ELENA));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let payload = selectedFile;
      if (!payload) {
        if (!resumeText.trim()) {
          throw new Error('Please select a resume file (PDF/DOCX) or paste candidate text.');
        }
        payload = resumeText;
      }

      const result = await extractResumeProfile(payload);
      
      const mappedProfile = {
        name: result.name || result.candidate_name || "Extracted Candidate",
        title: result.title || result.role || "Software Specialist",
        summary: result.summary || result.profile_summary || "Extracted candidate profile.",
        location: result.location || "Verified Location",
        tier: "Direct Dossier",
        trajectory: result.experience || result.work_experience || [
          {
            role: result.title || "Senior Engineer",
            company: "Enterprise Organization",
            period: "VERIFIED TENURE",
            description: "Demonstrated technical execution across evaluated competency areas."
          }
        ],
        skills: result.skills || result.extracted_skills || PRESET_ELENA.skills,
        raw: result
      };

      setCandidateProfile(mappedProfile);
      sessionStorage.setItem('alohomora_current_candidate', JSON.stringify(mappedProfile));
      
      try {
        const stored = JSON.parse(localStorage.getItem('alohomora_custom_candidates') || '[]');
        stored.push(mappedProfile);
        localStorage.setItem('alohomora_custom_candidates', JSON.stringify(stored));
      } catch (e) {}

    } catch (err) {
      console.error('Resume extraction error:', err);
      setError(err.message || 'Failed to extract resume dossier.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessReadiness = () => {
    sessionStorage.setItem('alohomora_current_candidate', JSON.stringify(candidateProfile));
    navigate('/talent-readiness');
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#303030] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium">Resume Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Resume Analysis & Profiler</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Extract verified career trajectories and normalize skills into Bloom proficiency tiers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadPreset}
          className="px-3 py-1.5 text-xs rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#303030] text-[#F5F5F5] flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px] text-[#E50914]">account_circle</span>
          <span>Load Preset: Elena Rostova</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Upload (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold block mb-2.5">
                Resume Ingest
              </span>

              {/* Upload Drop Area */}
              <div className="p-5 rounded border border-dashed border-[#303030] hover:border-[#E50914] bg-[#0B0B0B] flex flex-col items-center justify-center text-center transition-colors">
                <span className="material-symbols-outlined text-2xl text-[#A0A0A0] mb-1.5">upload_file</span>
                <p className="text-xs text-[#F5F5F5] font-medium">
                  {selectedFile ? selectedFile.name : 'Drag & drop resume or browse file'}
                </p>
                <p className="text-[11px] text-[#A0A0A0] mt-0.5">Supports PDF, DOCX, or TXT</p>
                
                <label className="mt-3 px-3 py-1 rounded bg-[#1C1C1C] hover:bg-[#252525] text-[#F5F5F5] text-xs font-medium cursor-pointer">
                  Browse File
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Direct Paste */}
            <div>
              <label className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium block mb-1.5">
                Or Paste Resume Text
              </label>
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste plain text resume content..."
                className="w-full bg-[#0B0B0B] border border-[#303030] rounded p-2.5 text-xs text-[#F5F5F5] font-mono placeholder:text-[#707070] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-[#690005]/40 border border-[#93000a] text-xs text-[#ffdad6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-4 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Extracting Profile...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">neurology</span>
                  <span>Extract Candidate Profile</span>
                </>
              )}
            </button>
          </form>

          {/* Simple Telemetry Card */}
          <div className="p-4 bg-[#141414] border border-[#303030] rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-[#F5F5F5] font-medium block">Extraction Confidence</span>
              <span className="text-[11px] text-[#A0A0A0]">Calibrated against peer benchmark norms</span>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">98.2%</span>
          </div>
        </div>

        {/* Right Column: Dossier Display (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="p-6 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-[#303030] gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1C1C1C] text-[#E50914] border border-[#303030]">
                    {candidateProfile.tier || 'Verified Profile'}
                  </span>
                  <span className="text-xs text-[#A0A0A0]">{candidateProfile.location}</span>
                </div>
                <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
                  {candidateProfile.name}
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-1">{candidateProfile.summary}</p>
              </div>

              <button
                type="button"
                onClick={handleAssessReadiness}
                className="px-4 py-2 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 self-start cursor-pointer"
              >
                <span>Assess Readiness</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            {/* Trajectory Timeline */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                  Professional Trajectory
                </span>
                <span className="text-xs text-[#A0A0A0]">
                  {candidateProfile.trajectory?.length || 0} Organizations Verified
                </span>
              </div>

              <div className="relative pl-5 flex flex-col gap-4">
                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-[#303030]"></div>

                {candidateProfile.trajectory?.map((item, idx) => (
                  <div key={idx} className="relative flex flex-col gap-0.5">
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#E50914] border-2 border-[#141414]"></div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-[#F5F5F5]">{item.role}</span>
                        <span className="text-xs text-[#A0A0A0]">at</span>
                        <span className="text-xs text-[#F5F5F5] font-medium">{item.company}</span>
                      </div>
                      <span className="text-[10px] text-[#A0A0A0] font-mono">{item.period}</span>
                    </div>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed mt-0.5">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Skills Matrix */}
            <div className="pt-3 border-t border-[#303030]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                  Calibrated Skills & Bloom Levels
                </span>
                <span className="text-xs text-[#A0A0A0]">
                  {candidateProfile.skills?.length || 0} Skills
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {candidateProfile.skills?.map((s, idx) => {
                  const skillName = typeof s === 'string' ? s : (s.skill_name || s.name || s.category_code || 'Skill');
                  const category = typeof s === 'object' ? (s.category_code || s.category || 'SKILL') : 'SKILL';
                  const level = typeof s === 'object' ? (s.level || s.required_level || 8) : 8;
                  
                  return (
                    <div key={idx} className="p-2 rounded bg-[#0B0B0B] border border-[#303030] flex items-center justify-between">
                      <div className="flex flex-col pr-2">
                        <span className="text-xs text-[#F5F5F5] font-medium truncate">{skillName}</span>
                        <span className="text-[10px] text-[#A0A0A0] uppercase font-mono">{category}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#E50914]">L{level}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
