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
- Eliminate telemetry jitter and tail-latency outliers across bare-metal micro-instances.
- Establish architectural standards for zero-downtime ledger migration and dynamic shard rebalancing.
- Mentor senior engineers, lead cross-department systems roadmaps, and author RFC specs.

Qualifications:
- 8+ years experience designing distributed storage engines, transactional key-value layers, or replicated log platforms.
- Deep mastery of Go, Rust, or C++ with zero-allocation memory safety paradigms.
- Proven real-world experience handling Byzantine fault scenarios and split-brain resolution in production.
- Experience with eBPF tracing, low-level Linux networking, and Prometheus instrumentation is highly preferred.`
  },
  cloud: {
    title: 'Lead Cloud Infrastructure Architect',
    domain: 'infrastructure',
    level: 'L7',
    text: `We are looking for a Lead Cloud Infrastructure Architect to direct our multi-region Kubernetes topology and automated cloud networking backplane.

Key Responsibilities:
- Oversee AWS and hybrid cloud infrastructure automation across regions using Terraform and GitOps.
- Architect high-performance service mesh networks with Envoy and Istio.
- Drive cloud cost topology optimization, resource rightsizing, and FinOps telemetry.
- Ensure 99.995% SLA compliance under peak burst workloads.

Qualifications:
- 10+ years hands-on experience in cloud networking, Terraform infrastructure-as-code, and container orchestration.
- Deep expertise in AWS DirectConnect, VPC peering, transit gateways, and BGP routing.
- Proven track record with large-scale Kubernetes clusters and zero-trust service meshes.
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
    <div className="max-w-[1400px] mx-auto w-full px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#303030] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium">Job Analysis Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Job Description Analysis</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Extract normalized RADIX skill requirements and tech stacks from role descriptions.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A0A0A0] hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset('distributed')}
            className="px-2.5 py-1 text-xs rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#303030] text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
          >
            Staff Distributed
          </button>
          <button
            type="button"
            onClick={() => loadPreset('cloud')}
            className="px-2.5 py-1 text-xs rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#303030] text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
          >
            Lead Cloud Architect
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Form (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-1.5">
                  Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#303030] rounded px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#E50914]"
                >
                  <option value="engineering">Platform Engineering</option>
                  <option value="infrastructure">Infrastructure Architecture</option>
                  <option value="applied-ai">Applied AI Systems</option>
                  <option value="security">Security & Reliability</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-1.5">
                  Seniority Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#303030] rounded px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#E50914]"
                >
                  <option value="L5">L5 — Senior Engineer</option>
                  <option value="L6">L6 — Staff Specialist</option>
                  <option value="L7">L7 — Principal Architect</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium">
                  Job Description Text
                </label>
                <span className="text-[11px] text-[#A0A0A0]">{jdText.length} chars</span>
              </div>

              {/* File Attachment Pill */}
              <div className="mb-2.5 flex items-center justify-between p-2 rounded bg-[#0B0B0B] border border-[#303030]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="material-symbols-outlined text-[16px] text-[#E50914]">description</span>
                  <span className="text-xs text-[#A0A0A0] truncate">
                    {selectedFile ? selectedFile.name : 'Upload PDF/DOCX or paste below'}
                  </span>
                </div>
                <label className="cursor-pointer px-2 py-0.5 text-xs rounded bg-[#1C1C1C] hover:bg-[#252525] text-[#F5F5F5]">
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
                rows={11}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste job description text..."
                className="w-full bg-[#0B0B0B] border border-[#303030] rounded p-2.5 text-xs text-[#F5F5F5] font-mono leading-relaxed placeholder:text-[#707070] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-[#690005]/40 border border-[#93000a] text-xs text-[#ffdad6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">neurology</span>
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
                className="py-2.5 px-3 rounded bg-[#0B0B0B] hover:bg-[#1C1C1C] border border-[#303030] text-[#A0A0A0] hover:text-[#F5F5F5] text-xs transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Analysis Output (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#303030] gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
                  <span className="text-[11px] uppercase tracking-wider text-[#A0A0A0]">Role Synthesis</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0B0B] border border-[#303030] text-[#A0A0A0] font-mono">
                    {level}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#F5F5F5]">
                  {domain === 'engineering' ? 'Staff Distributed Systems Engineer' : 'Lead Infrastructure Architect'}
                </h2>
              </div>

              {analysisResult && (
                <button
                  type="button"
                  onClick={() => navigate('/skill-match')}
                  className="px-3 py-1.5 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">person_search</span>
                  <span>Match Candidates</span>
                </button>
              )}
            </div>

            {analysisResult ? (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                      Extracted Competencies
                    </span>
                    <span className="text-xs text-emerald-400 font-mono">
                      {Object.keys(analysisResult.radix_categories || {}).length} Dimensions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {Object.entries(analysisResult.radix_categories || {}).map(([category, skills]) => (
                      <div key={category} className="p-3 rounded bg-[#0B0B0B] border border-[#303030] flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#F5F5F5] font-medium capitalize">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-[#A0A0A0] px-1.5 py-0.5 rounded bg-[#1C1C1C]">
                            {Array.isArray(skills) ? skills.length : 1}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.isArray(skills) ? (
                            skills.map((skill, idx) => (
                              <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-[#141414] text-[#A0A0A0] border border-[#303030]">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#A0A0A0]">{String(skills)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {analysisResult.technologies && analysisResult.technologies.length > 0 && (
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold block mb-2">
                      Tools & Technologies
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#0B0B0B] text-[#F5F5F5] border border-[#303030] text-xs font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-3xl text-[#707070] mb-2.5">neurology</span>
                <h3 className="text-sm text-[#F5F5F5] font-semibold">No Requirements Analyzed Yet</h3>
                <p className="text-xs text-[#A0A0A0] max-w-sm mt-1">
                  Upload a document or click "Analyze Requirements" with a preset to extract competency dimensions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
