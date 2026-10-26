import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SkillMatch() {
  const navigate = useNavigate();
  const [selectedJd, setSelectedJd] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    // Load current JD if available
    try {
      const jd = sessionStorage.getItem('alohomora_current_jd');
      if (jd) {
        setSelectedJd(JSON.parse(jd));
      } else {
        setSelectedJd({
          title: "Staff Distributed Systems Engineer",
          level: "L6",
          domain: "Platform Engineering",
          technologies: ["Go", "Rust", "C++", "eBPF", "Raft", "Paxos", "Prometheus", "io_uring"],
          radix_categories: {
            "coding": ["Go", "Rust", "Zero-alloc memory safety"],
            "system_design": ["Paxos/Raft consensus", "Partition-tolerant state machines", "Shard rebalancing"],
            "networking": ["Low-latency gossip protocols", "Linux networking SO_REUSEPORT"],
            "databases": ["Distributed storage engines", "Replicated log platforms"]
          }
        });
      }
    } catch (e) {}

    // Load current candidate
    try {
      const cand = sessionStorage.getItem('alohomora_current_candidate');
      if (cand) {
        setSelectedCandidate(JSON.parse(cand));
      } else {
        setSelectedCandidate({
          name: "Elena Rostova",
          title: "Principal Systems Architect",
          skills: [
            { skill_name: "Distributed Consensus (Raft/Paxos)", category_code: "SYSD", level: 9 },
            { skill_name: "Rust / C++ Memory Safety", category_code: "COD", level: 9 },
            { skill_name: "Linux Kernel & eBPF Tracing", category_code: "NETW", level: 8 },
            { skill_name: "Distributed Storage Engines", category_code: "DB", level: 8 },
            { skill_name: "Fault Tolerance & Byzantine Recovery", category_code: "SYSD", level: 9 },
            { skill_name: "High Concurrency & Low Latency", category_code: "COD", level: 8 }
          ]
        });
      }
    } catch (e) {}
  }, []);

  const handleRunAssessment = () => {
    navigate('/talent-readiness');
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#262626] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">Workspace 03</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Cross-Domain Skill Match</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            High-dimensional vector comparison separating adjacent competencies from true operational mastery.
          </p>
        </div>

        <button
          onClick={handleRunAssessment}
          className="px-5 py-2.5 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <span>Evaluate Company Readiness</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Target Role Requirements (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                Target Role Benchmark
              </span>
              <span className="text-xs text-[#e50914] font-semibold">
                {selectedJd?.level || 'L6'} LEVEL
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">{selectedJd?.title || 'Target Role'}</h2>
              <p className="text-xs text-[#A3A3A3] mt-1">{selectedJd?.domain || 'Platform Engineering'}</p>
            </div>

            {/* Extracted Core Requirements */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                Required Competency Pillars
              </span>
              {Object.entries(selectedJd?.radix_categories || {}).map(([cat, skills], idx) => (
                <div key={idx} className="p-3 rounded bg-[#0A0A0A] border border-[#262626] flex flex-col gap-1">
                  <span className="text-xs font-medium text-white capitalize">{cat.replace(/_/g, ' ')}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(skills) ? (
                      skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#141414] text-[#A3A3A3]">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#A3A3A3]">{String(skills)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tech Stack */}
            {selectedJd?.technologies && (
              <div className="pt-2">
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold block mb-2">
                  Prerequisite Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJd.technologies.map((t, idx) => (
                    <span key={idx} className="text-xs font-mono px-2 py-1 rounded bg-[#0A0A0A] border border-[#262626] text-white">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Candidate Skills Alignment (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-6">
            {/* Header with Match Percentage */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262626] gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold block mb-1">
                  Candidate Profile Alignment
                </span>
                <h3 className="text-xl font-bold text-white">{selectedCandidate?.name || 'Target Candidate'}</h3>
                <p className="text-xs text-[#A3A3A3]">{selectedCandidate?.title || 'Principal Systems Architect'}</p>
              </div>

              <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#262626] px-4 py-2.5 rounded-lg">
                <span className="text-xs uppercase text-[#737373] font-medium">Fit Score</span>
                <span className="text-2xl font-bold text-[#e50914] font-mono">96.8%</span>
              </div>
            </div>

            {/* Alignment Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626] flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Exact Stack Match</span>
                <span className="text-base font-bold text-white">8 / 8 Tools</span>
                <span className="text-[10px] text-emerald-500">100% Coverage</span>
              </div>

              <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626] flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Seniority Level</span>
                <span className="text-base font-bold text-white">L8 (Exceeds L6)</span>
                <span className="text-[10px] text-emerald-500">+2 Tiers Delta</span>
              </div>

              <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626] flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Ramp Time</span>
                <span className="text-base font-bold text-white">&lt; 14 Days</span>
                <span className="text-[10px] text-[#e50914]">Immediate Impact</span>
              </div>
            </div>

            {/* Detailed Alignment Rows */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                Competency Alignment Vector
              </span>

              {[
                { title: "High-Throughput Consensus Architecture", match: "Direct Match (Raft / Paxos L9)", status: "Exceeds" },
                { title: "Low-Latency Kernel Systems (C++ / Rust)", match: "Direct Match (Zero-Alloc Memory L9)", status: "Exceeds" },
                { title: "Bare-Metal Micro-Instance Telemetry", match: "Verified Match (eBPF & Linux Sockets L8)", status: "Matches" },
                { title: "Multi-Quarter Architecture RFC Ownership", match: "Demonstrated Multi-Org Leadership L8", status: "Matches" },
                { title: "Zero-Downtime Shard Rebalancing", match: "Production 8M QPS Distributed Storage L8", status: "Matches" }
              ].map((row, idx) => (
                <div key={idx} className="p-3 rounded bg-[#0A0A0A] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-white">{row.title}</span>
                    <p className="text-[11px] text-[#A3A3A3] mt-0.5">{row.match}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#10b981]/15 text-emerald-400 self-start sm:self-center">
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
