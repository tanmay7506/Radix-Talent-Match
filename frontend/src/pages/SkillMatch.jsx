import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SkillMatch() {
  const navigate = useNavigate();
  const [selectedJd, setSelectedJd] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    try {
      const jd = sessionStorage.getItem('alohomora_current_jd');
      if (jd) {
        setSelectedJd(JSON.parse(jd));
      } else {
        setSelectedJd({
          title: "Staff Distributed Systems Engineer",
          level: "L6",
          domain: "Platform Engineering",
          technologies: ["Go", "Rust", "C++", "eBPF", "Raft", "Paxos", "Prometheus"],
          radix_categories: {
            "coding": ["Go", "Rust", "Zero-alloc memory safety"],
            "system_design": ["Paxos/Raft consensus", "Partition-tolerant state machines"],
            "networking": ["Low-latency gossip protocols", "Linux networking"],
            "databases": ["Distributed storage engines", "Replicated log platforms"]
          }
        });
      }
    } catch (e) {}

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
            { skill_name: "Linux Kernel & eBPF Tracing", category_code: "OS", level: 8 },
            { skill_name: "Distributed Storage Engines", category_code: "SQL", level: 8 },
            { skill_name: "Fault Tolerance & Byzantine Recovery", category_code: "SYSD", level: 9 },
            { skill_name: "High Concurrency & Low Latency", category_code: "COD", level: 8 }
          ]
        });
      }
    } catch (e) {}
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#303030] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium">Alignment Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Cross-Domain Skill Match</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Compare candidate profiler skills directly against role requirements.
          </p>
        </div>

        <button
          onClick={() => navigate('/talent-readiness')}
          className="px-4 py-2 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span>Evaluate Company Readiness</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Role Benchmark (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
              <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-semibold">
                Target Role Benchmark
              </span>
              <span className="text-xs text-[#E50914] font-semibold font-mono">
                {selectedJd?.level || 'L6'}
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-[#F5F5F5]">{selectedJd?.title || 'Target Role'}</h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5">{selectedJd?.domain || 'Platform Engineering'}</p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-semibold">
                Required Competencies
              </span>
              {Object.entries(selectedJd?.radix_categories || {}).map(([cat, skills], idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030] flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#F5F5F5] capitalize">{cat.replace(/_/g, ' ')}</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {Array.isArray(skills) ? (
                      skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-[#141414] text-[#A0A0A0]">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#A0A0A0]">{String(skills)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedJd?.technologies && (
              <div className="pt-1">
                <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-semibold block mb-1.5">
                  Prerequisite Stack
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedJd.technologies.map((t, idx) => (
                    <span key={idx} className="text-xs font-mono px-2 py-0.5 rounded bg-[#0B0B0B] border border-[#303030] text-[#F5F5F5]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Candidate Alignment (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#303030] gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-semibold block mb-0.5">
                  Candidate Fit
                </span>
                <h3 className="text-lg font-bold text-[#F5F5F5]">{selectedCandidate?.name || 'Target Candidate'}</h3>
                <p className="text-xs text-[#A0A0A0]">{selectedCandidate?.title || 'Principal Systems Architect'}</p>
              </div>

              <div className="flex items-center gap-3 bg-[#0B0B0B] border border-[#303030] px-3.5 py-2 rounded-lg">
                <span className="text-xs uppercase text-[#A0A0A0] font-medium">Fit Index</span>
                <span className="text-xl font-bold text-[#E50914] font-mono">96.8%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                <span className="text-[10px] text-[#A0A0A0] block">Stack Match</span>
                <span className="text-sm font-bold text-[#F5F5F5]">100% Coverage</span>
              </div>

              <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                <span className="text-[10px] text-[#A0A0A0] block">Level Calibration</span>
                <span className="text-sm font-bold text-emerald-400">Exceeds Requirement</span>
              </div>

              <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                <span className="text-[10px] text-[#A0A0A0] block">Ramp Velocity</span>
                <span className="text-sm font-bold text-[#F5F5F5]">&lt; 14 Days</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-semibold">
                Competency Alignment
              </span>

              {[
                { title: "Consensus Architecture", match: "Direct Match (Raft / Paxos L9)", status: "Exceeds" },
                { title: "Low-Latency Kernel Systems", match: "Direct Match (Zero-Alloc Memory L9)", status: "Exceeds" },
                { title: "Distributed Telemetry", match: "Verified Match (eBPF & Linux Sockets L8)", status: "Matches" },
                { title: "Architecture RFC Ownership", match: "Multi-Org Leadership L8", status: "Matches" }
              ].map((row, idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="text-xs font-medium text-[#F5F5F5]">{row.title}</span>
                    <p className="text-[11px] text-[#A0A0A0]">{row.match}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 self-start sm:self-center">
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
