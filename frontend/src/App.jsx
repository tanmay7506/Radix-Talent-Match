import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
    <BrowserRouter>
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#e50914] selection:text-white">
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
        <footer className="w-full bg-[#0A0A0A] border-t border-[#262626] py-8 text-center text-xs text-[#737373]">
          <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest uppercase text-white">ALOHOMORA</span>
              <span className="text-[#3a3939]">•</span>
              <span>Autonomous Talent Intelligence Engine</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[#A3A3A3]">
              <span>Bloom Taxonomy Calibration</span>
              <span>•</span>
              <span>Supabase Enterprise Synced</span>
              <span>•</span>
              <span>Zero-Bias Protocol</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
