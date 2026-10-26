import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Editorial Hero Section */}
      <div className="relative w-full overflow-hidden border-b border-[#262626]/50">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-[#e50914]/15 via-transparent to-transparent blur-3xl pointer-events-none"></div>
        
        <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12 pt-12 pb-16 lg:pt-20 lg:pb-24 flex flex-col justify-start relative z-10">
          {/* Subheader Tag */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#737373] font-semibold">
              Alohomora System Platform
            </span>
            <span className="text-xs text-[#3a3939] hidden sm:inline">|</span>
            <span className="text-xs text-[#737373] tracking-wider uppercase hidden sm:inline">
              Autonomous Talent Intelligence
            </span>
          </div>

          {/* Monolithic Headline */}
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[68px] lg:leading-[74px] tracking-tight text-white font-bold">
              Every candidate <br className="hidden sm:inline" />has a story.
            </h1>
            <p className="text-base sm:text-lg text-[#A3A3A3] mt-6 max-w-2xl leading-relaxed">
              Alohomora unlocks the depth within resumes and job profiles — evaluating context, skill mastery, and readiness with quiet precision.
            </p>
          </div>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link
              to="/jd-intelligence"
              className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#e50914] hover:bg-[#b81d24] text-white text-xs font-semibold tracking-wider uppercase transition-colors duration-150"
            >
              <span>Enter Workspaces</span>
              <span className="material-symbols-outlined text-[16px] ml-2">arrow_forward</span>
            </Link>

            <Link
              to="/candidates"
              className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#141414] hover:bg-[#1A1A1A] text-white text-xs font-medium tracking-wider uppercase border border-[#262626] transition-colors duration-150"
            >
              <span>Explore Candidates</span>
              <span className="material-symbols-outlined text-[16px] ml-2 text-[#737373]">group</span>
            </Link>

            <div className="hidden xl:flex items-center gap-2 pl-4 text-[#737373] text-xs">
              <span className="material-symbols-outlined text-[16px] text-[#737373]">lock</span>
              <span>Zero-bias verification protocol engaged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Overview (Minimal 4-Column Array) */}
      <section className="w-full bg-[#141414] py-12 border-b border-[#262626]">
        <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12">
          {/* Section Label */}
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#A3A3A3] font-bold">Workspaces</span>
              <span className="text-[#737373] text-xs">/ Core Analysis Modules</span>
            </div>
            <div className="text-xs text-[#737373] uppercase tracking-widest hidden md:block">
              System State: Realtime Connected
            </div>
          </div>

          {/* 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Module 1: JD Intelligence */}
            <Link
              to="/jd-intelligence"
              className="group flex flex-col justify-between p-6 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] rounded transition-colors duration-150"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#737373] font-semibold">Workspace 01</span>
                  <span className="text-[11px] text-[#e50914] px-1.5 py-0.5 rounded bg-[#131313] font-medium border border-[#262626]">Active</span>
                </div>
                <h2 className="text-lg font-semibold text-white group-hover:text-[#ffb4aa] transition-colors">
                  JD Intelligence
                </h2>
                <p className="text-sm text-[#A3A3A3] mt-2 leading-relaxed">
                  Deconstruct roles into semantic DNA, identifying latent prerequisites and hard performance signals.
                </p>
              </div>
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#262626]">
                <span className="text-xs text-[#737373] uppercase tracking-wider font-medium">Execute Parse</span>
                <span className="material-symbols-outlined text-[18px] text-[#A3A3A3] group-hover:translate-x-1 group-hover:text-[#e50914] transition-all">arrow_forward</span>
              </div>
            </Link>

            {/* Module 2: Resume Intelligence */}
            <Link
              to="/resume-intelligence"
              className="group flex flex-col justify-between p-6 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] rounded transition-colors duration-150"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#737373] font-semibold">Workspace 02</span>
                  <span className="text-[11px] text-[#A3A3A3] px-1.5 py-0.5 rounded bg-[#131313] font-medium border border-[#262626]">Ingest</span>
                </div>
                <h2 className="text-lg font-semibold text-white group-hover:text-[#ffb4aa] transition-colors">
                  Resume Intelligence
                </h2>
                <p className="text-sm text-[#A3A3A3] mt-2 leading-relaxed">
                  Unpack authentic trajectories across tenures, normalizing claims through peer-verified baselines.
                </p>
              </div>
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#262626]">
                <span className="text-xs text-[#737373] uppercase tracking-wider font-medium">Inspect Dossiers</span>
                <span className="material-symbols-outlined text-[18px] text-[#A3A3A3] group-hover:translate-x-1 group-hover:text-[#e50914] transition-all">arrow_forward</span>
              </div>
            </Link>

            {/* Module 3: Skill Match */}
            <Link
              to="/skill-match"
              className="group flex flex-col justify-between p-6 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] rounded transition-colors duration-150"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#737373] font-semibold">Workspace 03</span>
                  <span className="text-[11px] text-[#A3A3A3] px-1.5 py-0.5 rounded bg-[#131313] font-medium border border-[#262626]">Matrix</span>
                </div>
                <h2 className="text-lg font-semibold text-white group-hover:text-[#ffb4aa] transition-colors">
                  Skill Match
                </h2>
                <p className="text-sm text-[#A3A3A3] mt-2 leading-relaxed">
                  High-dimensional vector matching separating adjacent competencies from true operational mastery.
                </p>
              </div>
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#262626]">
                <span className="text-xs text-[#737373] uppercase tracking-wider font-medium">Run Alignment</span>
                <span className="material-symbols-outlined text-[18px] text-[#A3A3A3] group-hover:translate-x-1 group-hover:text-[#e50914] transition-all">arrow_forward</span>
              </div>
            </Link>

            {/* Module 4: Talent Readiness */}
            <Link
              to="/talent-readiness"
              className="group flex flex-col justify-between p-6 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] rounded transition-colors duration-150"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#737373] font-semibold">Workspace 04</span>
                  <span className="text-[11px] text-[#10b981] px-1.5 py-0.5 rounded bg-[#131313] font-medium border border-[#262626]">Telemetry</span>
                </div>
                <h2 className="text-lg font-semibold text-white group-hover:text-[#ffb4aa] transition-colors">
                  Talent Readiness
                </h2>
                <p className="text-sm text-[#A3A3A3] mt-2 leading-relaxed">
                  Project ramp velocities, bloom gap analytics, and company-specific readiness benchmarks.
                </p>
              </div>
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#262626]">
                <span className="text-xs text-[#737373] uppercase tracking-wider font-medium">View Readiness</span>
                <span className="material-symbols-outlined text-[18px] text-[#A3A3A3] group-hover:translate-x-1 group-hover:text-[#e50914] transition-all">arrow_forward</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Telemetry Metrics Bar */}
      <section className="w-full bg-[#0A0A0A] py-12">
        <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-baseline">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl text-white font-bold">94.8%</span>
                <span className="text-xs text-[#e50914] font-semibold">↑ 1.4%</span>
              </div>
              <span className="text-xs uppercase tracking-wider text-[#737373] mt-1 font-semibold">Assessment Alignment</span>
              <span className="text-xs text-[#737373] mt-0.5">Cross-calibrated with 118 verified enterprise benchmarks</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl text-white font-bold">12 / 12</span>
                <span className="text-xs text-emerald-500 font-semibold">RADIX Active</span>
              </div>
              <span className="text-xs uppercase tracking-wider text-[#737373] mt-1 font-semibold">Competency Dimensions</span>
              <span className="text-xs text-[#737373] mt-0.5">Full Bloom taxonomy scoring (Tiers 1-10)</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl text-white font-bold">1,356</span>
                <span className="text-xs text-[#A3A3A3] font-semibold">Supabase DB</span>
              </div>
              <span className="text-xs uppercase tracking-wider text-[#737373] mt-1 font-semibold">Company Skill Benchmarks</span>
              <span className="text-xs text-[#737373] mt-0.5">Authoritative criteria for talent verification</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl text-white font-bold">0.8s</span>
                <span className="text-xs text-emerald-500 font-semibold">High Throughput</span>
              </div>
              <span className="text-xs uppercase tracking-wider text-[#737373] mt-1 font-semibold">Scoring Latency</span>
              <span className="text-xs text-[#737373] mt-0.5">Deterministic matching + AI explanation layer</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
