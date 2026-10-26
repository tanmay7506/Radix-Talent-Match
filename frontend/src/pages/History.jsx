import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_HISTORY = [
  {
    id: "RUN-1740562810",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    company_name: "Google LLC",
    candidate_name: "Elena Rostova",
    readiness_score: 94.4,
    dimensions: 12
  },
  {
    id: "RUN-1740559200",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    company_name: "Microsoft Corporation",
    candidate_name: "Marcus Vance",
    readiness_score: 96.2,
    dimensions: 12
  },
  {
    id: "RUN-1740540000",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    company_name: "Amazon Web Services",
    candidate_name: "Julian Chen",
    readiness_score: 91.0,
    dimensions: 12
  }
];

export default function History() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('alohomora_history') || '[]');
      if (stored.length > 0) {
        setHistoryItems(stored);
      } else {
        setHistoryItems(DEFAULT_HISTORY);
      }
    } catch (e) {
      setHistoryItems(DEFAULT_HISTORY);
    }
  }, []);

  const handleClear = () => {
    localStorage.removeItem('alohomora_history');
    setHistoryItems([]);
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#303030] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span>
            <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium">Audit Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Assessment History & Logs</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Revisit previously executed talent readiness calibrations and benchmark comparisons.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#303030] text-xs text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors self-start md:self-auto cursor-pointer"
          >
            Clear Archive
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="mt-6 bg-[#141414] border border-[#303030] rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-2.5 bg-[#0B0B0B] border-b border-[#303030] text-[10px] uppercase tracking-wider text-[#A0A0A0] font-semibold">
          <div className="col-span-12 md:col-span-3">Run ID</div>
          <div className="col-span-12 md:col-span-3">Company Benchmark</div>
          <div className="hidden md:block md:col-span-3">Candidate</div>
          <div className="col-span-6 md:col-span-2 text-right md:text-left">Readiness Score</div>
          <div className="col-span-6 md:col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-[#303030]">
          {historyItems.map((item, idx) => {
            const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent';
            const score = item.readiness_score != null ? Math.round(item.readiness_score) : 90;

            return (
              <div
                key={item.id || idx}
                className="grid grid-cols-12 px-5 py-3 items-center hover:bg-[#1C1C1C] transition-colors"
              >
                <div className="col-span-12 md:col-span-3">
                  <div className="text-xs font-mono font-semibold text-[#F5F5F5]">{item.id || `RUN-${idx + 1}`}</div>
                  <div className="text-[11px] text-[#A0A0A0] mt-0.5">{dateStr}</div>
                </div>

                <div className="col-span-12 md:col-span-3 mt-1 md:mt-0">
                  <div className="text-xs font-semibold text-[#F5F5F5]">{item.company_name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">12 RADIX Dimensions</div>
                </div>

                <div className="hidden md:block md:col-span-3">
                  <div className="text-xs font-medium text-[#F5F5F5]">{item.candidate_name}</div>
                  <div className="text-[10px] text-[#A0A0A0]">Dossier Profile</div>
                </div>

                <div className="col-span-6 md:col-span-2 mt-1 md:mt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#E50914] font-mono">{score}%</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0B0B0B] text-emerald-400 font-semibold uppercase">
                      Ready
                    </span>
                  </div>
                </div>

                <div className="col-span-6 md:col-span-1 text-right mt-1 md:mt-0">
                  <button
                    onClick={() => navigate('/talent-readiness')}
                    className="p-1 rounded bg-[#0B0B0B] hover:bg-[#E50914] text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                    title="Open in Talent Readiness"
                  >
                    <span className="material-symbols-outlined text-[15px]">sync</span>
                  </button>
                </div>
              </div>
            );
          })}

          {historyItems.length === 0 && (
            <div className="py-12 text-center text-[#A0A0A0] text-xs">
              No previous assessment records archived.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
