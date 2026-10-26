import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0B]/95 backdrop-blur-md border-b border-[#303030]">
      <div className="h-16 w-full px-6 lg:px-10 flex items-center justify-between">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[#F5F5F5] tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            <span className="text-base tracking-[0.2em] font-bold text-[#F5F5F5]">ALOHOMORA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] inline-block mb-0.5"></span>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b-2 border-[#E50914] pb-[22px] pt-[22px]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/jd-intelligence"
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b-2 border-[#E50914] pb-[22px] pt-[22px]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`
              }
            >
              JD Analysis
            </NavLink>

            <NavLink
              to="/resume-intelligence"
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b-2 border-[#E50914] pb-[22px] pt-[22px]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`
              }
            >
              Resume Analysis
            </NavLink>

            <NavLink
              to="/candidates"
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b-2 border-[#E50914] pb-[22px] pt-[22px]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`
              }
            >
              Candidates
            </NavLink>

            <NavLink
              to="/skill-match"
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b-2 border-[#E50914] pb-[22px] pt-[22px]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`
              }
            >
              Skill Match
            </NavLink>

            <NavLink
              to="/talent-readiness"
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b-2 border-[#E50914] pb-[22px] pt-[22px]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`
              }
            >
              Talent Readiness
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider font-medium transition-colors py-2 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b-2 border-[#E50914] pb-[22px] pt-[22px]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`
              }
            >
              History
            </NavLink>
          </nav>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/candidates')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#141414] border border-[#303030] text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#404040] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">search</span>
            <span className="text-xs hidden sm:inline tracking-wider uppercase font-medium">Search</span>
            <kbd className="hidden md:inline text-[9px] px-1 py-0.5 rounded bg-[#0B0B0B] text-[#707070] border border-[#303030]">⌘K</kbd>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141414] border border-[#303030]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-[#A0A0A0]">Online</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-[#303030]">
            <div className="w-7 h-7 rounded bg-[#1C1C1C] border border-[#303030] flex items-center justify-center font-semibold text-[#F5F5F5] text-xs">
              TO
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
