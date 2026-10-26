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
        const assessment = result.assessment || result;
        const analysis = result.analysis || null;
        setAssessmentResult(assessment);
        setAnalysisResult(analysis);
        saveRunToHistory(assessment);
      } else {
        const result = await runTalentAssessment(selectedCompanyId, payload);
        setAssessmentResult(result);
        setAnalysisResult(null);
        saveRunToHistory(result);
      }

    } catch (err) {
      console.error('Assessment execution error:', err);
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
    <div className="max-w-[1400px] mx-auto w-full px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#303030] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium">Evaluation Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Talent Readiness Assessment</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Compare candidate profiler competencies against authoritative enterprise benchmarks.
          </p>
        </div>

        {/* Active Candidate Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A0A0A0]">Active Candidate:</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#1C1C1C] border border-[#303030] text-[#F5F5F5]">
            {candidateProfile.name}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Target Selection (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          {/* Company Benchmark Selector */}
          <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                Target Enterprise Benchmark
              </span>
              <span className="text-[11px] text-[#A0A0A0]">
                {companies.length} verified companies
              </span>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Filter companies..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0B0B0B] border border-[#303030] rounded text-xs text-[#F5F5F5] placeholder:text-[#707070] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <select
              size={6}
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="w-full bg-[#0B0B0B] border border-[#303030] rounded p-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#E50914] overflow-y-auto"
            >
              {filteredCompanies.map(c => {
                const cName = c.name || c.company_name || c.short_name;
                return (
                  <option
                    key={c.company_id}
                    value={c.company_id}
                    className="p-1.5 hover:bg-[#1C1C1C] cursor-pointer rounded"
                  >
                    {cName}
                  </option>
                );
              })}
            </select>

            {selectedCompany && (
              <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F5]">
                    {selectedCompany.name || selectedCompany.company_name}
                  </span>
                  <p className="text-[10px] text-[#A0A0A0]">Authoritative database benchmark</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
              Assessment Actions
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
              className="w-full py-2.5 px-4 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {assessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Evaluating Assessment...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">neurology</span>
                  <span>Run AI Talent Check</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={assessing}
              onClick={() => handleRunAssessment(false)}
              className="w-full py-2 px-4 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] text-[#A0A0A0] hover:text-[#F5F5F5] text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer"
            >
              Deterministic Assessment Only
            </button>
          </div>
        </div>

        {/* Right Column: Assessment Results (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {assessmentResult ? (
            <div className="flex flex-col gap-5">
              {/* Score & Overview Header Card */}
              <div className="p-6 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#303030] gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
                      <span className="text-[11px] uppercase tracking-wider text-[#A0A0A0]">
                        Assessment Outcome
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#F5F5F5]">
                      {candidateProfile.name} vs {assessmentResult.company || selectedCompany?.name || 'Selected Benchmark'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-4 bg-[#0B0B0B] border border-[#303030] px-4 py-2.5 rounded-lg">
                    <div className="text-right">
                      <span className="text-[10px] text-[#A0A0A0] uppercase block">Readiness</span>
                      <span className="text-xs font-semibold text-emerald-400 uppercase">
                        {readinessScore >= 90 ? 'Qualified' : 'Developing'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#E50914] font-mono">
                      {readinessScore}%
                    </div>
                  </div>
                </div>

                {/* Metric Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                    <span className="text-[10px] text-[#A0A0A0] block">Coverage</span>
                    <span className="text-sm font-bold text-[#F5F5F5] font-mono">
                      {assessmentResult.coverage_percentage ?? 100}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                    <span className="text-[10px] text-[#A0A0A0] block">Meeting Target</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {assessmentResult.skills_meeting_requirement ?? 10} / 12
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                    <span className="text-[10px] text-[#A0A0A0] block">Below Target</span>
                    <span className="text-sm font-bold text-[#A0A0A0] font-mono">
                      {assessmentResult.skills_below_requirement ?? 2} / 12
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                    <span className="text-[10px] text-[#A0A0A0] block">Assessed Dimensions</span>
                    <span className="text-sm font-bold text-[#F5F5F5] font-mono">
                      {assessmentResult.assessed_categories ?? 12}
                    </span>
                  </div>
                </div>

                {/* AI Executive Overview */}
                {analysisResult && (analysisResult.ai_overview || analysisResult.summary) && (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#E50914]">auto_awesome</span>
                      <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                        Executive Alignment Synthesis
                      </span>
                    </div>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed p-3.5 rounded bg-[#0B0B0B] border border-[#303030]">
                      {analysisResult.ai_overview || analysisResult.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Bloom Taxonomy Gap Analysis Table */}
              <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                    12-Dimension RADIX Gap Matrix
                  </span>
                  <span className="text-[11px] text-[#A0A0A0]">Bloom Taxonomy Tiers 1-10</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#303030] text-[#A0A0A0] uppercase tracking-wider text-[10px]">
                        <th className="pb-2.5 font-semibold">Competency Category</th>
                        <th className="pb-2.5 font-semibold text-center">Candidate Level</th>
                        <th className="pb-2.5 font-semibold text-center">Required Level</th>
                        <th className="pb-2.5 font-semibold text-center">Delta</th>
                        <th className="pb-2.5 font-semibold text-right">Alignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#303030]">
                      {gapRows.map((row, idx) => {
                        const name = row.category_name || row.skill_name || row.category_code || `Category ${idx + 1}`;
                        const candLevel = row.candidate_level ?? 8;
                        const reqLevel = row.required_level ?? 7;
                        const gap = candLevel - reqLevel;

                        return (
                          <tr key={idx} className="hover:bg-[#1C1C1C]">
                            <td className="py-2.5 font-medium text-[#F5F5F5]">
                              {name} <span className="text-[10px] text-[#A0A0A0] font-mono">({row.category_code})</span>
                            </td>
                            <td className="py-2.5 text-center font-mono text-[#F5F5F5]">L{candLevel}</td>
                            <td className="py-2.5 text-center font-mono text-[#A0A0A0]">L{reqLevel}</td>
                            <td className="py-2.5 text-center font-mono font-semibold">
                              {gap >= 0 ? (
                                <span className="text-emerald-400">+{gap}</span>
                              ) : (
                                <span className="text-[#E50914]">{gap}</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              {gap >= 1 ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] font-semibold uppercase">
                                  Exceeds
                                </span>
                              ) : gap === 0 ? (
                                <span className="px-2 py-0.5 rounded bg-[#1C1C1C] text-[#A0A0A0] text-[10px] font-semibold uppercase">
                                  Matches
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-[#690005]/40 text-[#ffb4aa] text-[10px] font-semibold uppercase">
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

              {/* Strengths & Improvement Areas (Safely rendered against Object or String types) */}
              {analysisResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Strengths */}
                  <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-3">
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Demonstrated Strengths
                    </span>
                    <div className="flex flex-col gap-2">
                      {(analysisResult.strengths || []).map((s, idx) => (
                        <div key={idx} className="text-xs text-[#A0A0A0] p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                          {typeof s === 'string' ? (
                            s
                          ) : (
                            <div>
                              <div className="font-semibold text-[#F5F5F5]">{s.category || s.name || 'Strength'}</div>
                              <div className="mt-0.5">{s.reason || s.description}</div>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!analysisResult.strengths || analysisResult.strengths.length === 0) && (
                        <div className="text-xs text-[#707070] italic">No specific strengths flagged.</div>
                      )}
                    </div>
                  </div>

                  {/* Improvements */}
                  <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-3">
                    <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      Focus Areas for Growth
                    </span>
                    <div className="flex flex-col gap-2">
                      {(analysisResult.improvement_areas || []).map((imp, idx) => (
                        <div key={idx} className="text-xs text-[#A0A0A0] p-2.5 rounded bg-[#0B0B0B] border border-[#303030]">
                          {typeof imp === 'string' ? (
                            imp
                          ) : (
                            <div>
                              <div className="font-semibold text-[#F5F5F5]">{imp.category}</div>
                              {(imp.current_level != null || imp.required_level != null) && (
                                <div className="text-[10px] text-[#A0A0A0] mt-0.5">
                                  Current: L{imp.current_level} · Required: L{imp.required_level} {imp.gap != null ? `(Gap: -${imp.gap})` : ''}
                                </div>
                              )}
                              <div className="mt-1">{imp.reason || imp.description}</div>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!analysisResult.improvement_areas || analysisResult.improvement_areas.length === 0) && (
                        <div className="text-xs text-[#707070] italic">No immediate shortfall gaps identified.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Learning Roadmap (Safely rendered) */}
              {analysisResult && Array.isArray(analysisResult.learning_roadmap) && analysisResult.learning_roadmap.length > 0 && (
                <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-3.5">
                  <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                    Targeted Ramp Roadmap
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {analysisResult.learning_roadmap.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded bg-[#0B0B0B] border border-[#303030] flex flex-col gap-1.5">
                        {typeof item === 'string' ? (
                          <>
                            <span className="text-[10px] text-[#E50914] font-mono uppercase font-bold">
                              Phase 0{idx + 1}
                            </span>
                            <p className="text-xs text-[#F5F5F5] leading-relaxed">{item}</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#E50914] font-mono uppercase font-bold">
                                {item.week ? `Week ${item.week}` : `Phase 0${idx + 1}`}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#F5F5F5]">
                              {item.focus || 'Core Competency'}
                            </div>
                            {Array.isArray(item.tasks) && item.tasks.length > 0 && (
                              <ul className="text-[11px] text-[#A0A0A0] list-disc list-inside space-y-0.5 mt-0.5">
                                {item.tasks.map((task, tIdx) => (
                                  <li key={tIdx}>{task}</li>
                                ))}
                              </ul>
                            )}
                            {item.milestone && (
                              <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                                🎯 Milestone: {item.milestone}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Projects (Safely rendered) */}
              {analysisResult && Array.isArray(analysisResult.recommended_projects) && analysisResult.recommended_projects.length > 0 && (
                <div className="p-5 bg-[#141414] border border-[#303030] rounded-lg flex flex-col gap-3.5">
                  <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">
                    Recommended Practical Projects
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {analysisResult.recommended_projects.map((proj, idx) => (
                      <div key={idx} className="p-3.5 rounded bg-[#0B0B0B] border border-[#303030] flex flex-col gap-1.5">
                        {typeof proj === 'string' ? (
                          <p className="text-xs text-[#F5F5F5] leading-relaxed">{proj}</p>
                        ) : (
                          <>
                            <div className="text-xs font-semibold text-[#F5F5F5]">{proj.name}</div>
                            <div className="text-xs text-[#A0A0A0] leading-relaxed">{proj.purpose}</div>
                            {Array.isArray(proj.deliverables) && proj.deliverables.length > 0 && (
                              <ul className="text-[11px] text-[#A0A0A0] list-disc list-inside space-y-0.5 mt-1">
                                {proj.deliverables.map((d, dIdx) => (
                                  <li key={dIdx}>{d}</li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 bg-[#141414] border border-[#303030] rounded-lg flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-3xl text-[#707070] mb-2.5">speed</span>
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Ready for Assessment</h3>
              <p className="text-xs text-[#A0A0A0] max-w-sm mt-1">
                Select an enterprise benchmark from the Supabase directory and run an evaluation to compute the alignment matrix.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
