import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#262626]">
      <div className="h-16 w-full px-6 lg:px-12 flex items-center justify-between">
        {/* Brand & Nav */}
        <div className="flex items-center gap-10">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-white tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            <span className="text-lg tracking-[0.22em] font-bold text-white">ALOHOMORA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] inline-block mb-1"></span>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-white border-b-2 border-[#e50914] pb-[22px] pt-[22px]'
                    : 'text-[#A3A3A3] hover:text-white'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/jd-intelligence"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-white border-b-2 border-[#e50914] pb-[22px] pt-[22px]'
                    : 'text-[#A3A3A3] hover:text-white'
                }`
              }
            >
              JD Intelligence
            </NavLink>

            <NavLink
              to="/resume-intelligence"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-white border-b-2 border-[#e50914] pb-[22px] pt-[22px]'
                    : 'text-[#A3A3A3] hover:text-white'
                }`
              }
            >
              Resume Intelligence
            </NavLink>

            <NavLink
              to="/candidates"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-white border-b-2 border-[#e50914] pb-[22px] pt-[22px]'
                    : 'text-[#A3A3A3] hover:text-white'
                }`
              }
            >
              Candidates
            </NavLink>

            <NavLink
              to="/skill-match"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-white border-b-2 border-[#e50914] pb-[22px] pt-[22px]'
                    : 'text-[#A3A3A3] hover:text-white'
                }`
              }
            >
              Skill Match
            </NavLink>

            <NavLink
              to="/talent-readiness"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-white border-b-2 border-[#e50914] pb-[22px] pt-[22px]'
                    : 'text-[#A3A3A3] hover:text-white'
                }`
              }
            >
              Talent Readiness
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-white border-b-2 border-[#e50914] pb-[22px] pt-[22px]'
                    : 'text-[#A3A3A3] hover:text-white'
                }`
              }
            >
              History
            </NavLink>
          </nav>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/candidates')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#141414] border border-[#262626] text-[#737373] hover:text-white hover:border-[#3a3939] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="text-xs hidden sm:inline tracking-wider uppercase font-medium">Telemetry Search</span>
            <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0A] text-[#737373] border border-[#262626]">⌘K</kbd>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#141414] border border-[#262626]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-[#A3A3A3]">Active Session</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-[#262626]">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-white font-medium">Talent Ops</span>
              <span className="text-[10px] text-[#737373] uppercase tracking-wider">Executive</span>
            </div>
            <div className="w-8 h-8 rounded bg-[#ffb4aa] flex items-center justify-center font-bold text-[#690003] text-xs">
              TO
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
