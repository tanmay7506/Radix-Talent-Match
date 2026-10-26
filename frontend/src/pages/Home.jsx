import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Editorial Hero Section */}
      <div className="relative w-full overflow-hidden border-b border-[#303030]">
        <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20 flex flex-col justify-start">
          {/* Subheader Tag */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#A0A0A0] font-semibold">
              Alohomora System Platform
            </span>
            <span className="text-xs text-[#303030] hidden sm:inline">|</span>
            <span className="text-xs text-[#A0A0A0] tracking-wider uppercase hidden sm:inline">
              Autonomous Talent Intelligence
            </span>
          </div>

          {/* Simple, Confident Headline */}
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F5] leading-tight">
              Every candidate has a story.
            </h1>
            <p className="text-base text-[#A0A0A0] mt-4 max-w-xl leading-relaxed">
              Alohomora analyzes the depth within resumes and job profiles — evaluating context, skill mastery, and readiness with clarity and precision.
            </p>
          </div>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link
              to="/jd-intelligence"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              <span>Open Workspaces</span>
              <span className="material-symbols-outlined text-[15px] ml-1.5">arrow_forward</span>
            </Link>

            <Link
              to="/candidates"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[#141414] hover:bg-[#1C1C1C] text-[#F5F5F5] text-xs font-medium tracking-wider uppercase border border-[#303030] transition-colors"
            >
              <span>Explore Candidates</span>
              <span className="material-symbols-outlined text-[15px] ml-1.5 text-[#A0A0A0]">group</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Workspace Overview (Clean 4-Card Grid) */}
      <section className="w-full bg-[#141414] py-10 border-b border-[#303030]">
        <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-10">
          <div className="flex items-center justify-between pb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#F5F5F5] font-semibold">Workspaces</span>
              <span className="text-[#A0A0A0] text-xs">/ Core Modules</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Module 1: JD Analysis */}
            <Link
              to="/jd-intelligence"
              className="group flex flex-col justify-between p-5 bg-[#0B0B0B] hover:bg-[#1C1C1C] border border-[#303030] rounded transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-semibold">Module 01</span>
                  <span className="text-[10px] text-[#E50914] px-1.5 py-0.5 rounded bg-[#141414] font-medium border border-[#303030]">Ready</span>
                </div>
                <h2 className="text-base font-semibold text-[#F5F5F5] group-hover:text-white transition-colors">
                  JD Analysis
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-1.5 leading-relaxed">
                  Deconstruct roles into semantic requirements, identifying required skills and performance signals.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#303030]">
                <span className="text-xs text-[#A0A0A0] font-medium">Parse JD</span>
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] group-hover:text-[#E50914] group-hover:translate-x-0.5 transition-all">arrow_forward</span>
              </div>
            </Link>

            {/* Module 2: Resume Analysis */}
            <Link
              to="/resume-intelligence"
              className="group flex flex-col justify-between p-5 bg-[#0B0B0B] hover:bg-[#1C1C1C] border border-[#303030] rounded transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-semibold">Module 02</span>
                  <span className="text-[10px] text-[#A0A0A0] px-1.5 py-0.5 rounded bg-[#141414] font-medium border border-[#303030]">Ingest</span>
                </div>
                <h2 className="text-base font-semibold text-[#F5F5F5] group-hover:text-white transition-colors">
                  Resume Analysis
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-1.5 leading-relaxed">
                  Extract verified career trajectories across tenures, normalizing technical skills into Bloom taxonomy tiers.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#303030]">
                <span className="text-xs text-[#A0A0A0] font-medium">Extract Resume</span>
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] group-hover:text-[#E50914] group-hover:translate-x-0.5 transition-all">arrow_forward</span>
              </div>
            </Link>

            {/* Module 3: Skill Match */}
            <Link
              to="/skill-match"
              className="group flex flex-col justify-between p-5 bg-[#0B0B0B] hover:bg-[#1C1C1C] border border-[#303030] rounded transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-semibold">Module 03</span>
                  <span className="text-[10px] text-[#A0A0A0] px-1.5 py-0.5 rounded bg-[#141414] font-medium border border-[#303030]">Match</span>
                </div>
                <h2 className="text-base font-semibold text-[#F5F5F5] group-hover:text-white transition-colors">
                  Skill Match
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-1.5 leading-relaxed">
                  Compare candidate skills directly against role requirements with clear coverage and gap indicators.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#303030]">
                <span className="text-xs text-[#A0A0A0] font-medium">Compare Fit</span>
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] group-hover:text-[#E50914] group-hover:translate-x-0.5 transition-all">arrow_forward</span>
              </div>
            </Link>

            {/* Module 4: Talent Readiness */}
            <Link
              to="/talent-readiness"
              className="group flex flex-col justify-between p-5 bg-[#0B0B0B] hover:bg-[#1C1C1C] border border-[#303030] rounded transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-semibold">Module 04</span>
                  <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-[#141414] font-medium border border-[#303030]">Live</span>
                </div>
                <h2 className="text-base font-semibold text-[#F5F5F5] group-hover:text-white transition-colors">
                  Talent Readiness
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-1.5 leading-relaxed">
                  Evaluate candidates against 118 verified company benchmarks from Supabase with full Bloom gap analysis.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#303030]">
                <span className="text-xs text-[#A0A0A0] font-medium">Evaluate Readiness</span>
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] group-hover:text-[#E50914] group-hover:translate-x-0.5 transition-all">arrow_forward</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Concise Metrics Strip */}
      <section className="w-full bg-[#0B0B0B] py-8">
        <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#F5F5F5]">94.8%</span>
              <span className="text-xs text-[#A0A0A0] mt-0.5 font-medium">Average Match Alignment</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#F5F5F5]">12 / 12</span>
              <span className="text-xs text-[#A0A0A0] mt-0.5 font-medium">RADIX Dimensions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#F5F5F5]">118</span>
              <span className="text-xs text-[#A0A0A0] mt-0.5 font-medium">Supabase Enterprise Benchmarks</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-emerald-400">100%</span>
              <span className="text-xs text-[#A0A0A0] mt-0.5 font-medium">Deterministic Reliability</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
