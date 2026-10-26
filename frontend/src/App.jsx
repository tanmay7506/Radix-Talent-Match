import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Home from './pages/Home';
import JDIntelligence from './pages/JDIntelligence';
import ResumeIntelligence from './pages/ResumeIntelligence';
import Candidates from './pages/Candidates';
import TalentReadiness from './pages/TalentReadiness';
import SkillMatch from './pages/SkillMatch';
import History from './pages/History';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0B0B0B] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#E50914] selection:text-white">
          {/* Fixed Top Header */}
          <Header />

          {/* Routed Main Content */}
          <main className="flex-1 pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jd-intelligence" element={<JDIntelligence />} />
              <Route path="/resume-intelligence" element={<ResumeIntelligence />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/talent-readiness" element={<TalentReadiness />} />
              <Route path="/skill-match" element={<SkillMatch />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <footer className="w-full bg-[#0B0B0B] border-t border-[#303030] py-6 text-center text-xs text-[#A0A0A0]">
            <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-widest uppercase text-[#F5F5F5]">ALOHOMORA</span>
                <span className="text-[#303030]">•</span>
                <span>Talent Intelligence Platform</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-[#A0A0A0]">
                <span>Bloom Calibration</span>
                <span>•</span>
                <span>Supabase Verified</span>
                <span>•</span>
                <span>Zero-Bias Standard</span>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
