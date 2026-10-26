import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set playback speed to 1.18x (between 1.15x and 1.2x for natural, slightly faster movement)
    video.playbackRate = 1.18;

    // Respect user's reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      video.pause();
    }

    const handleMotionChange = (e) => {
      if (!videoRef.current) return;
      if (e.matches) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };

    mediaQuery.addEventListener('change', handleMotionChange);

    // Attempt autoplay
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setVideoLoaded(true);
        })
        .catch((err) => {
          console.warn('Autoplay prevented or video loading postponed:', err);
        });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const handleCanPlay = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.18;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Cinematic Hero Section with Background Video */}
      <section className="relative w-full -mt-16 h-[80vh] min-h-[580px] max-h-[820px] overflow-hidden bg-[#0B0B0B] border-b border-[#303030]">
        {/* Background Video */}
        {!videoError && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            src="/Home.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={handleCanPlay}
            onError={() => setVideoError(true)}
          />
        )}

        {/* Strengthened dark overlay (50% opacity) for enhanced foreground contrast & legibility */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />

        {/* Seamless bottom edge darkening that meets the lower border cleanly */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Content Container (Positioned above video & overlay) */}
        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col justify-center pt-20 sm:pt-24">
          {/* Subheader Tag */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#F5F5F5]/90 font-medium drop-shadow-sm">
              Alohomora System Platform
            </span>
            <span className="text-xs text-white/40 hidden sm:inline">|</span>
            <span className="text-xs text-[#F5F5F5]/80 tracking-wider uppercase hidden sm:inline drop-shadow-sm">
              Autonomous Talent Intelligence
            </span>
          </div>

          {/* Simple, Confident Headline */}
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F5F5] leading-tight drop-shadow-md">
              Every candidate has a story.
            </h1>
            <p className="text-base sm:text-lg text-[#F5F5F5]/90 mt-4 max-w-xl leading-relaxed drop-shadow">
              Alohomora analyzes the depth within resumes and job profiles — evaluating context, skill mastery, and readiness with clarity and precision.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link
              to="/jd-intelligence"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs font-semibold tracking-wider uppercase transition-colors shadow-md"
            >
              <span>Open Workspaces</span>
              <span className="material-symbols-outlined text-[15px] ml-1.5">arrow_forward</span>
            </Link>

            <Link
              to="/candidates"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[#141414]/80 hover:bg-[#1C1C1C] text-[#F5F5F5] text-xs font-medium tracking-wider uppercase border border-[#303030] backdrop-blur-sm transition-colors"
            >
              <span>Explore Candidates</span>
              <span className="material-symbols-outlined text-[15px] ml-1.5 text-[#A0A0A0]">group</span>
            </Link>
          </div>
        </div>
      </section>

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
