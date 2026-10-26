import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_HISTORY = [
  {
    id: "RUN-1740562810",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    company_name: "Google LLC",
    candidate_name: "Elena Rostova",
    readiness_score: 94.4,
    status: "Qualified Target",
    dimensions: 12
  },
  {
    id: "RUN-1740559200",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    company_name: "Microsoft Corporation",
    candidate_name: "Marcus Vance",
    readiness_score: 96.2,
    status: "Exceeds Benchmark",
    dimensions: 12
  },
  {
    id: "RUN-1740540000",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    company_name: "Amazon Web Services",
    candidate_name: "Julian Chen",
    readiness_score: 91.0,
    status: "Qualified Target",
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
    <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-12 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#262626] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
            <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">Audit Records</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Assessment History & Logs</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Revisit previously executed talent readiness calibrations and benchmark comparisons.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] text-xs text-[#A3A3A3] hover:text-white transition-colors self-start md:self-auto cursor-pointer"
          >
            Clear Log Archive
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="mt-8 bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 bg-[#0A0A0A] border-b border-[#262626] text-[11px] uppercase tracking-wider text-[#737373] font-semibold">
          <div className="col-span-12 md:col-span-3">Run Identifier</div>
          <div className="col-span-12 md:col-span-3">Target Benchmark</div>
          <div className="hidden md:block md:col-span-3">Candidate Evaluated</div>
          <div className="col-span-6 md:col-span-2 text-right md:text-left">Readiness Score</div>
          <div className="col-span-6 md:col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-[#262626]">
          {historyItems.map((item, idx) => {
            const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent';
            const score = item.readiness_score != null ? Math.round(item.readiness_score) : 90;

            return (
              <div
                key={item.id || idx}
                className="grid grid-cols-12 px-6 py-4 items-center hover:bg-[#1A1A1A] transition-colors"
              >
                <div className="col-span-12 md:col-span-3">
                  <div className="text-xs font-mono font-bold text-white">{item.id || `RUN-${idx + 1}`}</div>
                  <div className="text-[11px] text-[#737373] mt-0.5">{dateStr}</div>
                </div>

                <div className="col-span-12 md:col-span-3 mt-1 md:mt-0">
                  <div className="text-xs font-semibold text-white">{item.company_name}</div>
                  <div className="text-[10px] text-emerald-500 font-mono">12 RADIX Dimensions</div>
                </div>

                <div className="hidden md:block md:col-span-3">
                  <div className="text-xs font-medium text-white">{item.candidate_name}</div>
                  <div className="text-[10px] text-[#737373]">Autonomous Profile</div>
                </div>

                <div className="col-span-6 md:col-span-2 mt-2 md:mt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#e50914] font-mono">{score}%</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0A] text-[#e50914] font-semibold uppercase">
                      Ready
                    </span>
                  </div>
                </div>

                <div className="col-span-6 md:col-span-1 text-right mt-2 md:mt-0">
                  <button
                    onClick={() => navigate('/talent-readiness')}
                    className="p-1.5 rounded bg-[#0A0A0A] hover:bg-[#e50914] text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                    title="Re-run assessment"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                  </button>
                </div>
              </div>
            );
          })}

          {historyItems.length === 0 && (
            <div className="py-16 text-center text-[#737373] text-sm">
              No previous assessment records archived. Execute a Talent Readiness check to record telemetry logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
