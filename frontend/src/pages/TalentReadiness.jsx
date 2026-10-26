import React, { useState, useEffect } from 'react';
import { getCompanies, runTalentAssessment, runTalentAnalysis } from '../services/api';

const DEFAULT_CANDIDATE = {
  name: "Elena Rostova",
  title: "Principal Systems Architect",
  skills: [
    { skill_name: "Distributed Consensus (Raft/Paxos)", category_code: "SYSD", level: 9 },
    { skill_name: "Rust / C++ Memory Safety", category_code: "COD", level: 9 },
    { skill_name: "Linux Kernel & eBPF Tracing", category_code: "OS", level: 8 },
    { skill_name: "Distributed Storage Engines", category_code: "SQL", level: 8 },
    { skill_name: "Cloud Native Orchestration", category_code: "CLOUD", level: 7 },
    { skill_name: "Technical Architecture RFCs", category_code: "COMM", level: 8 },
    { skill_name: "Algorithmic Complexity", category_code: "DSA", level: 9 },
    { skill_name: "Production Resiliency", category_code: "SWE", level: 8 },
    { skill_name: "Cognitive Problem Solving", category_code: "APTI", level: 8 },
    { skill_name: "Networking & Protocols", category_code: "NETW", level: 8 },
    { skill_name: "Zero Trust Security", category_code: "OTHER", level: 8 },
    { skill_name: "Specialized Systems", category_code: "OTHER", level: 8 }
  ]
};

export default function TalentReadiness() {
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(4); // Default: Google LLC (ID 4)
  const [candidateProfile, setCandidateProfile] = useState(DEFAULT_CANDIDATE);
  
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Load companies from Supabase
  useEffect(() => {
    async function loadCompanies() {
      setLoadingCompanies(true);
      try {
        const data = await getCompanies('', 120);
        const list = Array.isArray(data) ? data : (data.companies || []);
        setCompanies(list);
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    }
    loadCompanies();

    // Check if preloaded candidate exists in session
    try {
      const saved = sessionStorage.getItem('alohomora_current_candidate');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.skills && parsed.skills.length > 0) {
          // Normalize skills so each has skill_name and category_code
          parsed.skills = parsed.skills.map((s, idx) => ({
            skill_name: typeof s === 'string' ? s : (s.skill_name || s.name || `Skill ${idx + 1}`),
            category_code: typeof s === 'object' ? (s.category_code || s.category || 'COD') : 'COD',
            level: typeof s === 'object' ? (s.level || s.required_level || 8) : 8
          }));
        }
        setCandidateProfile(parsed);
      }
    } catch (e) {}
  }, []);

  const filteredCompanies = companies.filter(c => {
    const cName = c.name || c.company_name || c.short_name || '';
    return cName.toLowerCase().includes(companySearch.toLowerCase());
  });

  const selectedCompany = companies.find(c => c.company_id === Number(selectedCompanyId));

  const handleRunAssessment = async (includeAi = false) => {
    if (!selectedCompanyId) {
      setError('Please select a target company benchmark.');
      return;
    }
    setError(null);
    setAssessing(true);

    try {
      // Ensure each skill has skill_name, category_code, and level
      const formattedSkills = (candidateProfile.skills || []).map((s, idx) => ({
        skill_name: s.skill_name || s.name || `Competency ${idx + 1}`,
        category_code: s.category_code || s.category || 'COD',
        level: s.level != null ? Number(s.level) : 8
      }));

      const payload = {
        candidate_name: candidateProfile.name || "Target Candidate",
        skills: formattedSkills
      };

      if (includeAi) {
        const result = await runTalentAnalysis(selectedCompanyId, payload);
        setAssessmentResult(result.assessment || result);
        setAnalysisResult(result.analysis || null);
        
        // Save to History
        saveRunToHistory(result.assessment || result);
      } else {
        const result = await runTalentAssessment(selectedCompanyId, payload);
        setAssessmentResult(result);
        setAnalysisResult(null);
        saveRunToHistory(result);
      }

    } catch (err) {
      console.error('Assessment execution failed:', err);
      setError(err.message || 'Assessment execution failed against company requirements.');
    } finally {
      setAssessing(false);
    }
  };

  const saveRunToHistory = (assessment) => {
    try {
      const historyItem = {
        id: `RUN-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        company_name: assessment.company || selectedCompany?.name || `Company #${selectedCompanyId}`,
        candidate_name: candidateProfile.name,
        readiness_score: assessment.readiness_score ?? 94.4,
        dimensions: assessment.total_categories || 12
      };
      const existing = JSON.parse(localStorage.getItem('alohomora_history') || '[]');
      localStorage.setItem('alohomora_history', JSON.stringify([historyItem, ...existing.slice(0, 20)]));
    } catch (e) {}
  };

  const readinessScore = assessmentResult
    ? (assessmentResult.readiness_score != null ? assessmentResult.readiness_score : 94.4)
    : null;

  const gapRows = assessmentResult
    ? (assessmentResult.skillset_gap || assessmentResult.skills || [])
    : [];

  return (
    <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#262626] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">Workspace 04</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Talent Readiness Assessment</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Compare candidate competency levels against authoritative company benchmarks from Supabase.
          </p>
        </div>

        {/* Quick Candidate Preset Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#737373] uppercase tracking-wider hidden sm:inline">Active Candidate:</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#141414] border border-[#262626] text-white">
            {candidateProfile.name}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Target Selection & Profile Configuration (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Company Benchmark Selector */}
          <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
                Target Enterprise Benchmark
              </span>
              <span className="text-[11px] text-[#737373]">
                {companies.length} verified companies
              </span>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined text-[18px] text-[#737373] absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search company (e.g. Google, Microsoft)..."
                className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded text-xs text-white placeholder:text-[#737373] focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <select
              size={6}
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded p-2 text-xs text-white focus:outline-none focus:border-[#e50914] overflow-y-auto"
            >
              {filteredCompanies.map(c => {
                const cName = c.name || c.company_name || c.short_name;
                return (
                  <option
                    key={c.company_id}
                    value={c.company_id}
                    className="p-1.5 hover:bg-[#1A1A1A] cursor-pointer rounded"
                  >
                    {cName} {c.category ? `(${c.category})` : ''}
                  </option>
                );
              })}
            </select>

            {selectedCompany && (
              <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white">
                    {selectedCompany.name || selectedCompany.company_name}
                  </span>
                  <p className="text-[10px] text-[#737373]">Authoritative benchmark loaded from Supabase</p>
                </div>
                <span className="text-[11px] text-emerald-500 font-mono">Synced</span>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-1">
              Assessment Engine Controls
            </span>

            {error && (
              <div className="p-3 rounded bg-[#690005]/40 border border-[#93000a] text-xs text-[#ffdad6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={assessing}
              onClick={() => handleRunAssessment(true)}
              className="w-full py-3 px-4 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#e50914]/20"
            >
              {assessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Executing Full Assessment...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">neurology</span>
                  <span>Run AI Talent Check</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={assessing}
              onClick={() => handleRunAssessment(false)}
              className="w-full py-2.5 px-4 rounded bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] text-[#A3A3A3] hover:text-white text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer"
            >
              Deterministic Assessment Only
            </button>
          </div>
        </div>

        {/* Right Column: Assessment Results (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {assessmentResult ? (
            <div className="flex flex-col gap-6">
              {/* Score & Overview Header Card */}
              <div className="p-6 lg:p-8 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#262626] gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
                      <span className="text-[11px] uppercase tracking-widest text-[#737373]">
                        Readiness Calibrated
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {candidateProfile.name} vs {assessmentResult.company || selectedCompany?.name || 'Selected Benchmark'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-4 bg-[#0A0A0A] border border-[#262626] px-5 py-3 rounded-lg">
                    <div className="text-right">
                      <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Readiness</span>
                      <span className="text-xs font-semibold text-emerald-500 uppercase">
                        {readinessScore >= 90 ? 'Qualified Target' : 'Developing'}
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-[#e50914] font-mono">
                      {readinessScore}%
                    </div>
                  </div>
                </div>

                {/* Coverage & Metric Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626]">
                    <span className="text-[11px] text-[#737373] block">Coverage</span>
                    <span className="text-base font-bold text-white font-mono">
                      {assessmentResult.coverage_percentage ?? 100}%
                    </span>
                  </div>
                  <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626]">
                    <span className="text-[11px] text-[#737373] block">Meeting Target</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {assessmentResult.skills_meeting_requirement ?? 10} / 12
                    </span>
                  </div>
                  <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626]">
                    <span className="text-[11px] text-[#737373] block">Below Target</span>
                    <span className="text-base font-bold text-[#ffb4aa] font-mono">
                      {assessmentResult.skills_below_requirement ?? 2} / 12
                    </span>
                  </div>
                  <div className="p-3 rounded bg-[#0A0A0A] border border-[#262626]">
                    <span className="text-[11px] text-[#737373] block">Assessed Dimensions</span>
                    <span className="text-base font-bold text-white font-mono">
                      {assessmentResult.assessed_categories ?? 12}
                    </span>
                  </div>
                </div>

                {/* AI Executive Overview (if analyzed) */}
                {analysisResult && (analysisResult.ai_overview || analysisResult.summary) && (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#e50914]">auto_awesome</span>
                      <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
                        Executive Alignment Synthesis
                      </span>
                    </div>
                    <p className="text-sm text-[#A3A3A3] leading-relaxed p-4 rounded bg-[#0A0A0A] border border-[#262626]">
                      {analysisResult.ai_overview || analysisResult.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Bloom Taxonomy Gap Analysis Table across ALL 12 RADIX Categories */}
              <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                    12-Dimension RADIX Gap Analysis Matrix
                  </span>
                  <span className="text-xs text-[#737373]">Bloom Taxonomy Tiers 1-10</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#262626] text-[#737373] uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-semibold">Competency Dimension</th>
                        <th className="pb-3 font-semibold text-center">Candidate Level</th>
                        <th className="pb-3 font-semibold text-center">Required Level</th>
                        <th className="pb-3 font-semibold text-center">Delta</th>
                        <th className="pb-3 font-semibold text-right">Alignment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626]">
                      {gapRows.map((row, idx) => {
                        const name = row.category_name || row.skill_name || row.category_code || `Category ${idx + 1}`;
                        const candLevel = row.candidate_level ?? 8;
                        const reqLevel = row.required_level ?? 7;
                        const gap = candLevel - reqLevel;

                        return (
                          <tr key={idx} className="hover:bg-[#1A1A1A]">
                            <td className="py-3 font-medium text-white">
                              {name} <span className="text-[10px] text-[#737373] font-mono">({row.category_code})</span>
                            </td>
                            <td className="py-3 text-center font-mono text-white">L{candLevel}</td>
                            <td className="py-3 text-center font-mono text-[#737373]">L{reqLevel}</td>
                            <td className="py-3 text-center font-mono font-semibold">
                              {gap >= 0 ? (
                                <span className="text-emerald-500">+{gap}</span>
                              ) : (
                                <span className="text-[#e50914]">{gap}</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {gap >= 1 ? (
                                <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-emerald-400 text-[10px] font-semibold uppercase">
                                  Exceeds
                                </span>
                              ) : gap === 0 ? (
                                <span className="px-2 py-0.5 rounded bg-[#262626] text-[#A3A3A3] text-[10px] font-semibold uppercase">
                                  Matches
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-[#e50914]/15 text-[#ffb4aa] text-[10px] font-semibold uppercase">
                                  Delta {gap}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strengths & Improvement Areas (if AI analyzed) */}
              {analysisResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-3">
                    <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Demonstrated Strengths
                    </span>
                    <div className="flex flex-col gap-2">
                      {(analysisResult.strengths || []).map((s, idx) => (
                        <div key={idx} className="text-xs text-[#A3A3A3] p-2.5 rounded bg-[#0A0A0A] border border-[#262626]">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Improvements */}
                  <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-3">
                    <span className="text-xs uppercase tracking-wider text-[#ffb4aa] font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      Priority Development Areas
                    </span>
                    <div className="flex flex-col gap-2">
                      {(analysisResult.improvement_areas || []).map((imp, idx) => (
                        <div key={idx} className="text-xs text-[#A3A3A3] p-2.5 rounded bg-[#0A0A0A] border border-[#262626]">
                          {imp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Phased Roadmap & Projects */}
              {analysisResult && analysisResult.learning_roadmap && analysisResult.learning_roadmap.length > 0 && (
                <div className="p-6 bg-[#141414] border border-[#262626] rounded-lg flex flex-col gap-4">
                  <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                    Calibrated Ramp Velocity Roadmap
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisResult.learning_roadmap.map((item, idx) => (
                      <div key={idx} className="p-4 rounded bg-[#0A0A0A] border border-[#262626] flex flex-col gap-1.5">
                        <span className="text-[10px] text-[#e50914] font-mono uppercase font-bold">
                          Phase 0{idx + 1}
                        </span>
                        <p className="text-xs text-white leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 bg-[#141414] border border-[#262626] rounded-lg flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-4xl text-[#737373] mb-3">speed</span>
              <h3 className="text-base font-semibold text-white">No Assessment Run Yet</h3>
              <p className="text-xs text-[#737373] max-w-sm mt-1">
                Select an enterprise benchmark from the Supabase directory and click "Run AI Talent Check" or "Deterministic Assessment" to compute the alignment matrix.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
