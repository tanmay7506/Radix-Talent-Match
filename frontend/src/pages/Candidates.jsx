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
    summary: "Exemplary architectural depth with demonstrated ownership of tier-1 distributed storage engines. Consistently solves complex consensus bottlenecks. Matches ideal profile for high-concurrency systems infrastructure.",
    benchmarkScores: [
      { name: "Distributed Systems Topology", score: 99 },
      { name: "Technical Authority & Multi-Org Influence", score: 95 },
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
    summary: "Deep specialization in high-throughput LLM inferencing pipelines and low-latency quantization kernels. Demonstrated success deploying models serving millions of concurrent requests.",
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
    summary: "Specialist in bare-metal hyperconvergence and real-time distributed telemetry systems. Led disaster recovery exercises across multi-datacenter setups.",
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
    summary: "Expert in end-to-end cryptographic integrity, identity access management, and threat surface minimization for high-security distributed backbones.",
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

  // Combine default candidates with custom extracted ones
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
      orgType: "Analyzed Profile",
      tenure: "Analyzed via Dossier",
      skills: (c.skills || []).map(s => typeof s === 'string' ? s : (s.skill_name || s.category_code)),
      summary: c.summary || "Autonomous profile extracted from uploaded resume.",
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
    // Format candidate profile for talent-readiness
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
    <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12 py-10 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#262626] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">Candidate Pool</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Candidate Dossier Directory</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Search, filter, and inspect verified candidates calibrated across the RADIX standard.
          </p>
        </div>

        <button
          onClick={() => navigate('/resume-intelligence')}
          className="px-4 py-2.5 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          <span>Ingest New Resume</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-8 p-4 bg-[#141414] border border-[#262626] rounded-lg flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <span className="material-symbols-outlined text-[18px] text-[#737373] absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by candidate name, skill, or role..."
            className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-[#262626] rounded text-sm text-white placeholder:text-[#737373] focus:outline-none focus:border-[#e50914]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
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
            className="bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
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
            className="bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
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
              className="px-3 py-2 rounded bg-[#1A1A1A] hover:bg-[#262626] text-xs text-[#A3A3A3] hover:text-white"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Candidate Rows Surface */}
      <div className="mt-6 bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-3 bg-[#0A0A0A] border-b border-[#262626] text-[11px] uppercase tracking-wider text-[#737373] font-semibold">
          <div className="col-span-12 md:col-span-4">Candidate & Role</div>
          <div className="hidden md:block md:col-span-3">Core Competencies</div>
          <div className="hidden lg:block lg:col-span-1 text-center">Exp.</div>
          <div className="col-span-6 md:col-span-3 lg:col-span-2">Readiness Score</div>
          <div className="col-span-6 md:col-span-2 lg:col-span-2 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#262626]">
          {filteredCandidates.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCandidate(c)}
              className="grid grid-cols-12 px-6 py-4 items-center hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
            >
              <div className="col-span-12 md:col-span-4 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white group-hover:text-[#ffb4aa] transition-colors">
                    {c.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-[#262626] text-[#A3A3A3] font-mono">
                    {c.level}
                  </span>
                </div>
                <div className="text-xs text-[#A3A3A3] mt-0.5">{c.role}</div>
              </div>

              <div className="hidden md:flex md:col-span-3 flex-wrap gap-1 pr-4">
                {c.skills.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-[#0A0A0A] border border-[#262626] text-[#A3A3A3]">
                    {s}
                  </span>
                ))}
                {c.skills.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-[#737373]">
                    +{c.skills.length - 3} more
                  </span>
                )}
              </div>

              <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center">
                <span className="text-xs font-semibold text-white">{c.exp}</span>
                <span className="text-[10px] text-[#737373]">{c.orgType}</span>
              </div>

              <div className="col-span-6 md:col-span-3 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#e50914]">{c.score}%</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0A] text-[#e50914] font-semibold uppercase">
                    Ready
                  </span>
                </div>
                <div className="w-24 h-1 bg-[#0A0A0A] rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-[#e50914] h-full" style={{ width: `${c.score}%` }}></div>
                </div>
              </div>

              <div className="col-span-6 md:col-span-2 lg:col-span-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCandidate(c);
                  }}
                  className="px-3 py-1.5 rounded bg-[#0A0A0A] group-hover:bg-[#e50914] text-[#A3A3A3] group-hover:text-white text-xs uppercase tracking-wider font-medium transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="py-16 text-center text-[#737373] text-sm">
              No candidates match the specified filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Inspector Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedCandidate(null)}
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-[#141414] border-l border-[#262626] shadow-2xl flex flex-col z-10">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-[#0A0A0A] border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#e50914] uppercase tracking-widest">ALOHOMORA DOSSIER</span>
                <span className="text-[#737373]">/</span>
                <span className="font-mono text-[#A3A3A3]">{selectedCandidate.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded bg-[#141414] hover:bg-[#1A1A1A] text-[#737373] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">{selectedCandidate.name}</h3>
                  <span className="text-xl font-bold text-[#e50914]">{selectedCandidate.score}%</span>
                </div>
                <div className="text-sm text-[#A3A3A3] mt-1">{selectedCandidate.role}</div>
                <div className="flex items-center gap-3 text-xs text-[#737373] mt-2">
                  <span>{selectedCandidate.tenure}</span>
                  <span>•</span>
                  <span className="text-emerald-500 font-medium">Ready for Alignment</span>
                </div>
              </div>

              {/* Benchmark Scores */}
              <div className="p-4 rounded-lg bg-[#0A0A0A] border border-[#262626] flex flex-col gap-3">
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                  Telemetry Benchmark Scores
                </span>
                {selectedCandidate.benchmarkScores.map((b, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A3A3A3]">{b.name}</span>
                      <span className="text-white font-semibold">{b.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden">
                      <div className="bg-[#e50914] h-full" style={{ width: `${b.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                  AI Evaluation Summary
                </span>
                <p className="text-xs text-[#A3A3A3] leading-relaxed p-4 rounded bg-[#0A0A0A] border border-[#262626]">
                  {selectedCandidate.summary}
                </p>
              </div>

              {/* Verified Capabilities */}
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                  Verified Core Capabilities
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#0A0A0A] text-white border border-[#262626] text-xs font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 bg-[#0A0A0A] border-t border-[#262626] flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="w-1/2 py-2.5 rounded bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-white text-xs uppercase tracking-wider font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleInitiateAlignment(selectedCandidate)}
                className="w-1/2 py-2.5 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Initiate Alignment</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
