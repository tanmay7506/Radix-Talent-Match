import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeJobDescription } from '../services/api';

const SAMPLE_JDS = {
  distributed: {
    title: 'Staff Distributed Systems Engineer',
    domain: 'engineering',
    level: 'L6',
    text: `We are seeking a Staff Distributed Systems Engineer to spearhead our high-throughput global consensus runtime. You will architect low-latency gossip protocols, deterministic replay guarantees, and partition-tolerant state-machine engines processing 4M+ writes/second.

Key Responsibilities:
- Design and execute next-generation Paxos/Raft consensus kernels in Go and Rust.
- Eliminate telemetry jitter and tail-latency outliers across thousands of bare-metal micro-instances.
- Establish architectural standards for zero-downtime ledger migration and dynamic node shard rebalancing.
- Mentor senior engineers, lead multi-quarter cross-department systems roadmaps, and author RFC specs.

Qualifications:
- 8+ years experience designing distributed storage engines, transactional key-value layers, or replicated log platforms.
- Deep, low-level mastery of Go, Rust, or C++ with zero-allocation memory safety paradigms.
- Proven real-world experience handling Byzantine fault scenarios and split-brain resolution in production.
- Experience with eBPF tracing, low-level Linux networking (SO_REUSEPORT, io_uring), and Prometheus/OpenTelemetry instrumentation is highly preferred.`
  },
  cloud: {
    title: 'Lead Cloud Infrastructure Architect',
    domain: 'infrastructure',
    level: 'L7',
    text: `We are looking for a Lead Cloud Infrastructure Architect to direct our multi-region Kubernetes topology and automated cloud networking backplane.

Key Responsibilities:
- Oversee AWS and hybrid cloud infrastructure automation across 10+ regions using Terraform and GitOps.
- Architect high-performance service mesh networks with Cilium, Envoy, and Istio.
- Drive cloud cost topology optimization, resource rightsizing, and FinOps telemetry.
- Lead site reliability engineers to ensure 99.995% SLA compliance under peak burst workloads.

Qualifications:
- 10+ years hands-on experience in cloud networking, Terraform infrastructure-as-code, and container orchestration.
- Deep expertise in AWS DirectConnect, VPC peering, transit gateways, and BGP routing.
- Proven track record with large-scale Kubernetes clusters (1,000+ nodes) and zero-trust service meshes.
- Strong proficiency with Go or Python for infrastructure automation tooling.`
  }
};

export default function JDIntelligence() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('engineering');
  const [level, setLevel] = useState('L6');
  const [jdText, setJdText] = useState(SAMPLE_JDS.distributed.text);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const loadPreset = (key) => {
    const preset = SAMPLE_JDS[key];
    if (preset) {
      setDomain(preset.domain);
      setLevel(preset.level);
      setJdText(preset.text);
      setSelectedFile(null);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Optional: read preview text if txt
      if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => setJdText(event.target.result);
        reader.readAsText(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let payload = selectedFile;
      if (!payload) {
        if (!jdText.trim()) {
          throw new Error('Please enter job description text or select a document.');
        }
        payload = jdText;
      }

      const result = await analyzeJobDescription(payload);
      setAnalysisResult(result);
      // Cache in session for cross-matching
      sessionStorage.setItem('alohomora_current_jd', JSON.stringify({
        domain,
        level,
        title: domain === 'engineering' ? 'Staff Distributed Systems Engineer' : 'Lead Infrastructure Architect',
        ...result
      }));
    } catch (err) {
      console.error('JD extraction error:', err);
      setError(err.message || 'Failed to extract requirements from job description.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#262626] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">Workspace 01</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">JD Intelligence</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Autonomous decomposition of job mandates into normalized RADIX competency benchmarks.
          </p>
        </div>

        {/* Preset Loader */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#737373] uppercase tracking-wider hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset('distributed')}
            className="px-3 py-1.5 text-xs rounded bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#A3A3A3] hover:text-white"
          >
            Staff Distributed
          </button>
          <button
            type="button"
            onClick={() => loadPreset('cloud')}
            className="px-3 py-1.5 text-xs rounded bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#A3A3A3] hover:text-white"
          >
            Lead Cloud Architect
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Form (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
                  Role Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e50914]"
                >
                  <option value="engineering">Platform Engineering</option>
                  <option value="infrastructure">Infrastructure Architecture</option>
                  <option value="applied-ai">Applied AI & Runtime Systems</option>
                  <option value="security">Distributed Cryptography</option>
                  <option value="reliability">SRE & Resiliency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
                  Target Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e50914]"
                >
                  <option value="L5">L5 — Senior Engineer</option>
                  <option value="L6">L6 — Staff Specialist</option>
                  <option value="L7">L7 — Principal Architect</option>
                  <option value="L8">L8 — Distinguished Engineer</option>
                </select>
              </div>
            </div>

            {/* Document Upload or Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
                  Job Description Specification
                </label>
                <span className="text-[11px] text-[#737373]">{jdText.length} characters</span>
              </div>

              {/* File Attachment Pill */}
              <div className="mb-3 flex items-center justify-between p-2.5 rounded bg-[#0A0A0A] border border-[#262626]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="material-symbols-outlined text-[18px] text-[#e50914]">description</span>
                  <span className="text-xs text-[#A3A3A3] truncate">
                    {selectedFile ? selectedFile.name : 'Upload PDF/DOCX or paste below'}
                  </span>
                </div>
                <label className="cursor-pointer px-2.5 py-1 text-xs rounded bg-[#1A1A1A] hover:bg-[#262626] text-white">
                  Browse
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={12}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste raw JD transcript, internal mandate, or technical requirements..."
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded p-3 text-xs sm:text-sm text-white font-mono leading-relaxed placeholder:text-[#737373] focus:outline-none focus:border-[#e50914]"
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-[#690005]/40 border border-[#93000a] text-xs text-[#ffdad6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Synthesizing Benchmark...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">neurology</span>
                    <span>Analyze Requirements</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setJdText('');
                  setSelectedFile(null);
                  setAnalysisResult(null);
                }}
                className="py-3 px-4 rounded bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] text-[#A3A3A3] hover:text-white text-xs transition-colors"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Reference Card */}
          <div className="p-4 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#737373]">dataset</span>
              <div>
                <p className="text-xs text-white font-medium">Calibrated Reference Corpus</p>
                <p className="text-[11px] text-[#737373]">Indexed against verified enterprise benchmark criteria</p>
              </div>
            </div>
            <span className="text-xs text-[#A3A3A3] font-mono">99.4% CONF</span>
          </div>
        </div>

        {/* Right Column: Analysis Output (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-6">
            {/* Output Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262626] gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
                  <span className="text-[11px] uppercase tracking-widest text-[#737373]">Synthesized Benchmark</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#0A0A0A] border border-[#262626] text-[#ffb4aa] font-medium">
                    {level} ARCHITECT
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {domain === 'engineering' ? 'Staff Distributed Systems Engineer' : 'Lead Infrastructure Architect'}
                </h2>
              </div>

              {analysisResult && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/skill-match')}
                    className="px-4 py-2 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_search</span>
                    <span>Match with Pool</span>
                  </button>
                </div>
              )}
            </div>

            {/* Display Results or Empty State */}
            {analysisResult ? (
              <div className="flex flex-col gap-6">
                {/* RADIX Categories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                      Extracted RADIX Competency Matrix
                    </span>
                    <span className="text-xs text-emerald-500 font-mono">
                      {Object.keys(analysisResult.radix_categories || {}).length} Dimensions Calibrated
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(analysisResult.radix_categories || {}).map(([category, skills]) => (
                      <div key={category} className="p-3 rounded bg-[#0A0A0A] border border-[#262626] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white font-semibold capitalize">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-[#A3A3A3] px-1.5 py-0.5 rounded bg-[#1A1A1A]">
                            {Array.isArray(skills) ? skills.length : 1} required
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.isArray(skills) ? (
                            skills.map((skill, idx) => (
                              <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-[#141414] text-[#A3A3A3] border border-[#262626]">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#A3A3A3]">{String(skills)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technologies & Frameworks */}
                {analysisResult.technologies && analysisResult.technologies.length > 0 && (
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold block mb-3">
                      Named Technologies, Tools & Runtimes
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-[#0A0A0A] text-white border border-[#262626] text-xs font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-[#737373] mb-3">neurology</span>
                <h3 className="text-base text-white font-semibold">No Benchmark Synthesized Yet</h3>
                <p className="text-xs text-[#737373] max-w-sm mt-1">
                  Upload a JD document or click "Analyze Requirements" with one of our enterprise presets to generate the competency matrix.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
