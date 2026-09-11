import React from 'react';
import { RecommendationResponse } from '../types';
import { BarChart3 } from 'lucide-react';

interface FixtureListProps {
  data: RecommendationResponse | null;
}

export const FixtureList: React.FC<FixtureListProps> = ({ data }) => {
  if (!data) return null;
  const matchday = data.nextEventId;

  const fixturesList = [
    { home: 'Real Madrid', away: 'Roma', date: 'Matchday 2', homeDiff: 2, awayDiff: 5 },
    { home: 'Man City', away: 'Paris', date: 'Matchday 2', homeDiff: 3, awayDiff: 4 },
    { home: 'Bayern', away: 'Arsenal', date: 'Matchday 2', homeDiff: 4, awayDiff: 4 },
    { home: 'Inter', away: 'Barcelona', date: 'Matchday 2', homeDiff: 3, awayDiff: 3 },
    { home: 'Leverkusen', away: 'Atlético', date: 'Matchday 2', homeDiff: 3, awayDiff: 3 },
    { home: 'Liverpool', away: 'Dortmund', date: 'Matchday 2', homeDiff: 3, awayDiff: 4 }
  ];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          MD{matchday} Featured Fixtures
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">Difficulty FDR</span>
      </div>

      {/* Vertical List for Sidebar */}
      <div className="space-y-2">
        {fixturesList.map((fix, idx) => (
          <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5 min-w-0 flex-1 pr-2">
              <div className="font-bold text-white truncate flex items-center gap-1.5">
                <span className="truncate">{fix.home}</span>
                <span className="text-slate-500 text-[10px]">vs</span>
                <span className="truncate">{fix.away}</span>
              </div>
              <div className="text-[10px] text-slate-500">{fix.date}</div>
            </div>

            <div className="flex gap-1 text-[10px] font-bold shrink-0">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                H:{fix.homeDiff}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                A:{fix.awayDiff}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
