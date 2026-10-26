import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CANDIDATES = [
  {
    id: "8092-ARCH",
    name: "Elena Rostova",
    role: "Principal Systems Architect",
    level: "L8",
    dept: "systems",
    seniority: "principal",
    status: "ready",
    score: 98,
    exp: "14y",
    orgType: "Tier-1 Org",
    tenure: "14 Years Analyzed",
    skills: ["Raft / Paxos", "Rust Kernel", "eBPF", "Zero-Alloc Memory", "Distributed Storage", "Low Latency C++"],
    summary: "Exemplary architectural depth with demonstrated ownership of tier-1 distributed storage engines. Consistently solves complex consensus bottlenecks.",
    benchmarkScores: [
      { name: "Distributed Systems Topology", score: 99 },
      { name: "Technical Authority & Architecture RFCs", score: 95 },
      { name: "Fault Tolerance & Reliability Engineering", score: 97 }
    ]
  },
  {
    id: "7104-CLD",
    name: "Marcus Vance",
    role: "Staff Cloud Architect",
    level: "L7",
    dept: "cloud",
    seniority: "staff",
    status: "ready",
    score: 96,
    exp: "11y",
    orgType: "Hypergrowth",
    tenure: "11 Years Analyzed",
    skills: ["AWS DirectConnect", "Terraform", "Kubernetes Mesh", "FinOps Architecture", "BGP Peering"],
    summary: "Proven leader in multi-cloud mesh networks and zero-downtime infrastructure migration. Extensive experience scaling compute workloads beyond 10k nodes.",
    benchmarkScores: [
      { name: "Cloud Network Architecture", score: 98 },
      { name: "Cost Topology & Capacity Planning", score: 94 },
      { name: "Kubernetes & Service Mesh", score: 96 }
    ]
  },
  {
    id: "6291-ML",
    name: "Julian Chen",
    role: "Senior Machine Learning Engineer",
    level: "L6",
    dept: "ml",
    seniority: "senior",
    status: "ready",
    score: 91,
    exp: "8y",
    orgType: "AI Lab",
    tenure: "8 Years Analyzed",
    skills: ["PyTorch", "Triton Server", "vLLM", "TensorRT", "Vector Embeddings", "CUDA Profiling"],
    summary: "Deep specialization in high-throughput LLM inferencing pipelines and low-latency quantization kernels.",
    benchmarkScores: [
      { name: "Model Optimization & Quantization", score: 93 },
      { name: "Distributed Training & Serving", score: 90 },
      { name: "CUDA & Systems Interfacing", score: 90 }
    ]
  },
  {
    id: "5820-INFRA",
    name: "Maya Lin",
    role: "Lead Infrastructure Engineer",
    level: "L7",
    dept: "infra",
    seniority: "lead",
    status: "ready",
    score: 94,
    exp: "10y",
    orgType: "Fintech",
    tenure: "10 Years Analyzed",
    skills: ["Ceph Storage", "RocksDB", "Linux Sockets", "eBPF Resiliency", "Prometheus"],
    summary: "Specialist in bare-metal hyperconvergence and real-time distributed telemetry systems.",
    benchmarkScores: [
      { name: "Storage Engine Resiliency", score: 96 },
      { name: "Bare-Metal Orchestration", score: 92 },
      { name: "Observability & Tracing", score: 94 }
    ]
  },
  {
    id: "4910-SEC",
    name: "Devin Patel",
    role: "Staff Security Engineer",
    level: "L6",
    dept: "security",
    seniority: "staff",
    status: "ready",
    score: 92,
    exp: "9y",
    orgType: "Enterprise Cyber",
    tenure: "9 Years Analyzed",
    skills: ["Post-Quantum Crypto", "Zero Trust Mesh", "Rust Security", "Auth0/OIDC", "SIEM Telemetry"],
    summary: "Expert in end-to-end cryptographic integrity, identity access management, and threat surface minimization.",
    benchmarkScores: [
      { name: "Zero Trust Architecture", score: 94 },
      { name: "Cryptographic Primitives", score: 92 },
      { name: "Incident Containment", score: 90 }
    ]
  }
];

export default function Candidates() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('all');
  const [seniority, setSeniority] = useState('all');
  const [readiness, setReadiness] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const allCandidates = useMemo(() => {
    let custom = [];
    try {
      custom = JSON.parse(localStorage.getItem('alohomora_custom_candidates') || '[]');
    } catch (e) {}

    const formattedCustom = custom.map((c, i) => ({
      id: `EXT-${1000 + i}`,
      name: c.name || "Extracted Candidate",
      role: c.title || "Software Specialist",
      level: "L6",
      dept: "systems",
      seniority: "senior",
      status: "ready",
      score: 93,
      exp: "8y+",
      orgType: "Direct Dossier",
      tenure: "Analyzed via Dossier",
      skills: (c.skills || []).map(s => typeof s === 'string' ? s : (s.skill_name || s.category_code)),
      summary: c.summary || "Autonomous profile extracted from resume.",
      benchmarkScores: [
        { name: "Domain Knowledge", score: 94 },
        { name: "Execution Mastery", score: 92 },
        { name: "Problem Solving", score: 93 }
      ]
    }));

    return [...DEFAULT_CANDIDATES, ...formattedCustom];
  }, []);

  const filteredCandidates = useMemo(() => {
    return allCandidates.filter(c => {
      const matchSearch = !searchTerm || 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDept = department === 'all' || c.dept === department;
      const matchSeniority = seniority === 'all' || c.seniority === seniority;
      const matchReadiness = readiness === 'all' || 
        (readiness === 'ready' && c.score >= 90) ||
        (readiness === 'developing' && c.score < 90);

      return matchSearch && matchDept && matchSeniority && matchReadiness;
    });
  }, [allCandidates, searchTerm, department, seniority, readiness]);

  const handleInitiateAlignment = (candidate) => {
    const profile = {
      name: candidate.name,
      title: candidate.role,
      summary: candidate.summary,
      skills: candidate.skills.map(s => ({
        skill_name: s,
        category_code: "COD",
        level: 8
      }))
    };
    sessionStorage.setItem('alohomora_current_candidate', JSON.stringify(profile));
    navigate('/talent-readiness');
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 py-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#303030] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium">Candidate Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Candidate Pool</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Search, filter, and inspect verified profiles calibrated across the RADIX standard.
          </p>
        </div>

        <button
          onClick={() => navigate('/resume-intelligence')}
          className="px-3.5 py-1.5 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[15px]">upload_file</span>
          <span>Upload Resume</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-6 p-4 bg-[#141414] border border-[#303030] rounded-lg flex flex-col lg:flex-row items-center justify-between gap-3.5">
        <div className="relative w-full lg:w-80">
          <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate name or skill..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0B0B0B] border border-[#303030] rounded text-xs text-[#F5F5F5] placeholder:text-[#707070] focus:outline-none focus:border-[#E50914]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-[#0B0B0B] border border-[#303030] rounded px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#E50914]"
          >
            <option value="all">All Departments</option>
            <option value="systems">Systems & Core</option>
            <option value="cloud">Cloud Architecture</option>
            <option value="ml">Machine Learning</option>
            <option value="infra">Infrastructure</option>
            <option value="security">Security</option>
          </select>

          <select
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
            className="bg-[#0B0B0B] border border-[#303030] rounded px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#E50914]"
          >
            <option value="all">All Seniorities</option>
            <option value="principal">Principal</option>
            <option value="staff">Staff</option>
            <option value="lead">Lead</option>
            <option value="senior">Senior</option>
          </select>

          <select
            value={readiness}
            onChange={(e) => setReadiness(e.target.value)}
            className="bg-[#0B0B0B] border border-[#303030] rounded px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#E50914]"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready (90%+)</option>
            <option value="developing">Developing (&lt;90%)</option>
          </select>

          {(searchTerm || department !== 'all' || seniority !== 'all' || readiness !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartment('all');
                setSeniority('all');
                setReadiness('all');
              }}
              className="px-2.5 py-1.5 rounded bg-[#1C1C1C] hover:bg-[#252525] text-xs text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Candidate Rows Surface */}
      <div className="mt-5 bg-[#141414] border border-[#303030] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-2.5 bg-[#0B0B0B] border-b border-[#303030] text-[10px] uppercase tracking-wider text-[#A0A0A0] font-semibold">
          <div className="col-span-12 md:col-span-4">Candidate & Role</div>
          <div className="hidden md:block md:col-span-3">Core Competencies</div>
          <div className="hidden lg:block lg:col-span-1 text-center">Exp.</div>
          <div className="col-span-6 md:col-span-3 lg:col-span-2">Readiness Score</div>
          <div className="col-span-6 md:col-span-2 lg:col-span-2 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#303030]">
          {filteredCandidates.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCandidate(c)}
              className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-[#1C1C1C] transition-colors cursor-pointer group"
            >
              <div className="col-span-12 md:col-span-4 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[#F5F5F5] group-hover:text-white transition-colors">
                    {c.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0B0B0B] border border-[#303030] text-[#A0A0A0] font-mono">
                    {c.level}
                  </span>
                </div>
                <div className="text-xs text-[#A0A0A0] mt-0.5">{c.role}</div>
              </div>

              <div className="hidden md:flex md:col-span-3 flex-wrap gap-1 pr-3">
                {c.skills.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0B0B] border border-[#303030] text-[#A0A0A0]">
                    {s}
                  </span>
                ))}
              </div>

              <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center">
                <span className="text-xs font-semibold text-[#F5F5F5]">{c.exp}</span>
              </div>

              <div className="col-span-6 md:col-span-3 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#E50914]">{c.score}%</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0B0B0B] text-emerald-400 font-semibold uppercase">
                    Ready
                  </span>
                </div>
              </div>

              <div className="col-span-6 md:col-span-2 lg:col-span-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCandidate(c);
                  }}
                  className="px-2.5 py-1 rounded bg-[#0B0B0B] group-hover:bg-[#E50914] text-[#A0A0A0] group-hover:text-[#F5F5F5] text-xs uppercase tracking-wider font-medium transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="py-12 text-center text-[#A0A0A0] text-xs">
              No candidates match the specified filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Inspector Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedCandidate(null)}
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-[#141414] border-l border-[#303030] shadow-2xl flex flex-col z-10">
            {/* Drawer Header */}
            <div className="px-5 py-4 bg-[#0B0B0B] border-b border-[#303030] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#E50914] uppercase tracking-wider">CANDIDATE DOSSIER</span>
                <span className="text-[#303030]">/</span>
                <span className="font-mono text-[#A0A0A0]">{selectedCandidate.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded bg-[#141414] hover:bg-[#1C1C1C] text-[#A0A0A0] hover:text-[#F5F5F5]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#F5F5F5]">{selectedCandidate.name}</h3>
                  <span className="text-lg font-bold text-[#E50914]">{selectedCandidate.score}%</span>
                </div>
                <div className="text-xs text-[#A0A0A0] mt-0.5">{selectedCandidate.role}</div>
              </div>

              {/* Benchmark Scores */}
              <div className="p-3.5 rounded-lg bg-[#0B0B0B] border border-[#303030] flex flex-col gap-2.5">
                <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-semibold">
                  Competency Scores
                </span>
                {selectedCandidate.benchmarkScores.map((b, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A0A0A0]">{b.name}</span>
                      <span className="text-[#F5F5F5] font-semibold">{b.score}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
                      <div className="bg-[#E50914] h-full" style={{ width: `${b.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-semibold">
                  Profile Summary
                </span>
                <p className="text-xs text-[#A0A0A0] leading-relaxed p-3 rounded bg-[#0B0B0B] border border-[#303030]">
                  {selectedCandidate.summary}
                </p>
              </div>

              {/* Skills */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-semibold">
                  Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#0B0B0B] text-[#F5F5F5] border border-[#303030] text-xs font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-[#0B0B0B] border-t border-[#303030] flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="w-1/2 py-2 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#303030] text-[#F5F5F5] text-xs uppercase tracking-wider font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleInitiateAlignment(selectedCandidate)}
                className="w-1/2 py-2 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Assess Readiness</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
