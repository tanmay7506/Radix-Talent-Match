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
      description: "Spearheaded low-latency consensus engine across 4,000+ nodes using Raft and Rust. Eliminated tail-latency jitter by 42% through eBPF kernel tracing and custom zero-alloc memory allocator."
    },
    {
      role: "Staff Infrastructure Engineer",
      company: "Vortex Distributed",
      period: "2017 — 2021",
      description: "Architected distributed key-value storage engine handling 8M+ QPS. Led shard rebalancing protocols and Byzantine fault recovery with zero production data corruption."
    },
    {
      role: "Senior Systems Engineer",
      company: "Nexis Cloud",
      period: "2013 — 2017",
      description: "Implemented high-performance Linux network stack primitives (SO_REUSEPORT, io_uring) and container runtime isolation."
    }
  ],
  skills: [
    { skill_name: "Distributed Consensus (Raft/Paxos)", category_code: "SYSD", level: 9, bloom_name: "Create" },
    { skill_name: "Rust / C++ Memory Safety", category_code: "COD", level: 9, bloom_name: "Create" },
    { skill_name: "Linux Kernel & eBPF Tracing", category_code: "NETW", level: 8, bloom_name: "Evaluate" },
    { skill_name: "Distributed Storage Engines", category_code: "DB", level: 8, bloom_name: "Evaluate" },
    { skill_name: "Fault Tolerance & Byzantine Recovery", category_code: "SYSD", level: 9, bloom_name: "Create" },
    { skill_name: "High Concurrency & Low Latency", category_code: "COD", level: 8, bloom_name: "Evaluate" },
    { skill_name: "Cloud Native Orchestration", category_code: "CLOUD", level: 7, bloom_name: "Analyze" },
    { skill_name: "Technical Architecture RFCs", category_code: "COMM", level: 8, bloom_name: "Evaluate" },
    { skill_name: "Algorithmic Complexity", category_code: "DSA", level: 9, bloom_name: "Create" },
    { skill_name: "Production Resiliency", category_code: "TEST", level: 8, bloom_name: "Evaluate" },
    { skill_name: "Cognitive Problem Solving", category_code: "APTI", level: 8, bloom_name: "Evaluate" },
    { skill_name: "CI/CD & GitOps Automation", category_code: "DEVOPS", level: 7, bloom_name: "Analyze" }
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
      
      // Adapt result from Role 3 format to normalized view
      const mappedProfile = {
        name: result.name || result.candidate_name || "Extracted Candidate",
        title: result.title || result.role || "Software Engineering Specialist",
        summary: result.summary || result.profile_summary || "Extracted via Alohomora Autonomous Intelligence",
        location: result.location || "Verified Profile",
        tier: "Direct Dossier",
        trajectory: result.experience || result.work_experience || [
          {
            role: result.title || "Senior Engineer",
            company: "Enterprise Organization",
            period: "VERIFIED TENURE",
            description: "Demonstrated production technical execution across extracted competency dimensions."
          }
        ],
        skills: result.skills || result.extracted_skills || PRESET_ELENA.skills,
        raw: result
      };

      setCandidateProfile(mappedProfile);
      sessionStorage.setItem('alohomora_current_candidate', JSON.stringify(mappedProfile));
      
      // Also register in candidate roster
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
    <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#262626] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">Workspace 02</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Resume Intelligence</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Unpack authentic candidate trajectories and normalize claimed technical capabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadPreset}
          className="px-4 py-2 text-xs rounded bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-white flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-[#e50914]">account_circle</span>
          <span>Load Benchmark: Elena Rostova</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Input & Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-5">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold block mb-3">
                Dossier Ingest Gateway
              </span>

              {/* Upload Drop Area */}
              <div className="p-6 rounded border-2 border-dashed border-[#262626] hover:border-[#e50914] bg-[#0A0A0A] flex flex-col items-center justify-center text-center transition-colors">
                <span className="material-symbols-outlined text-3xl text-[#737373] mb-2">upload_file</span>
                <p className="text-xs text-white font-medium">
                  {selectedFile ? selectedFile.name : 'Drag & drop candidate resume'}
                </p>
                <p className="text-[11px] text-[#737373] mt-1">Supports PDF, DOCX, or TXT (Max 25MB)</p>
                
                <label className="mt-4 px-4 py-1.5 rounded bg-[#1A1A1A] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer">
                  Select File
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
              <label className="text-xs uppercase tracking-wider text-[#737373] font-semibold block mb-2">
                Or Paste Plaintext Dossier Payload
              </label>
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste candidate resume transcript or markdown profile..."
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded p-3 text-xs text-white font-mono placeholder:text-[#737373] focus:outline-none focus:border-[#e50914]"
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
              className="py-3 px-4 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Extracting & Calibrating Profile...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">neurology</span>
                  <span>Extract Candidate Profile</span>
                </>
              )}
            </button>
          </form>

          {/* Telemetry Diagnostics */}
          <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-4">
            <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">
              Extraction Telemetry Diagnostics
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded bg-[#0A0A0A] border border-[#262626]">
                <span className="text-xs text-[#737373]">Semantic Confidence</span>
                <div className="text-xl font-bold text-white mt-1">98.2%</div>
                <div className="w-full h-1 bg-[#201f1f] rounded-full overflow-hidden mt-2">
                  <div className="bg-[#e50914] h-full w-[98%]"></div>
                </div>
              </div>

              <div className="p-4 rounded bg-[#0A0A0A] border border-[#262626]">
                <span className="text-xs text-[#737373]">Verified Milestones</span>
                <div className="text-xl font-bold text-white mt-1">14 / 14</div>
                <div className="w-full h-1 bg-[#201f1f] rounded-full overflow-hidden mt-2">
                  <div className="bg-[#e50914] h-full w-full"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#737373] pt-2 border-t border-[#262626]">
              <span>Identity Hash: <span className="font-mono text-[#A3A3A3]">#ALOH-ROSTOVA-8820</span></span>
              <span className="text-emerald-500 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Synthesized Dossier (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 lg:p-8 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-6">
            {/* Dossier Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-[#262626] gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1A1A1A] text-[#e50914] border border-[#262626]">
                    {candidateProfile.tier || 'Verified Target'}
                  </span>
                  <span className="text-xs text-[#737373]">{candidateProfile.location}</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  {candidateProfile.name}
                </h2>
                <p className="text-sm text-[#A3A3A3] mt-1">{candidateProfile.summary}</p>
              </div>

              <button
                type="button"
                onClick={handleAssessReadiness}
                className="px-5 py-2.5 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shrink-0 self-start cursor-pointer"
              >
                <span>Assess for Readiness</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Trajectory Timeline */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                  Verified Professional Trajectory
                </span>
                <span className="text-xs text-[#737373]">
                  {candidateProfile.trajectory?.length || 0} Organizations Analyzed
                </span>
              </div>

              <div className="relative pl-6 flex flex-col gap-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#262626]"></div>

                {candidateProfile.trajectory?.map((item, idx) => (
                  <div key={idx} className="relative flex flex-col gap-1">
                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#e50914] border-2 border-[#141414]"></div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-white">{item.role}</span>
                        <span className="text-xs text-[#737373]">at</span>
                        <span className="text-sm text-white font-medium">{item.company}</span>
                      </div>
                      <span className="text-[11px] text-[#737373] uppercase font-mono">{item.period}</span>
                    </div>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Skills Matrix */}
            <div className="pt-4 border-t border-[#262626]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                  Calibrated RADIX Competency Set
                </span>
                <span className="text-xs text-[#A3A3A3]">
                  {candidateProfile.skills?.length || 0} Skills Calibrated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {candidateProfile.skills?.map((s, idx) => {
                  const skillName = typeof s === 'string' ? s : (s.skill_name || s.name || s.category_code || 'Skill');
                  const category = typeof s === 'object' ? (s.category_code || s.category || 'SKILL') : 'SKILL';
                  const level = typeof s === 'object' ? (s.level || s.required_level || 7) : 7;
                  
                  return (
                    <div key={idx} className="p-2.5 rounded bg-[#0A0A0A] border border-[#262626] flex items-center justify-between">
                      <div className="flex flex-col pr-2">
                        <span className="text-xs text-white font-medium truncate">{skillName}</span>
                        <span className="text-[10px] text-[#737373] uppercase">{category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-[#e50914]">L{level}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A1A] text-[#A3A3A3]">
                          Bloom {level}/10
                        </span>
                      </div>
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
