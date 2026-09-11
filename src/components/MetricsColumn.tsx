import React from 'react';
import { Star, Shield, Cpu, Activity, Layers } from 'lucide-react';
import { RecommendationResponse } from '../types';
import { EngineDiagnostics } from './EngineDiagnostics';

interface MetricsColumnProps {
  data: RecommendationResponse | null;
  riskMode: 'safe' | 'risky' | 'value';
  scenario: 'quant' | 'template';
  setScenario: (sc: 'quant' | 'template') => void;
  onSyncTeamId?: (teamId: string) => void;
}

export const MetricsColumn: React.FC<MetricsColumnProps> = ({ data, riskMode, scenario, setScenario, onSyncTeamId }) => {
  const squadValue = data?.totalCost || 100.0;
  const itb = Math.max(0, 100.0 - squadValue);

  return (
    <div className="col-span-12 lg:col-span-3 grid grid-cols-1 gap-4">
      {/* Squad Metrics Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Squad Value</h2>
          <div className="flex items-center gap-2">
            {data?.isHeuristicFallback && (
              <span className="text-amber-500 text-[9px] font-black uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                ⚠️ Heuristic Fallback
              </span>
            )}
            <span className="text-cyan-400 text-[10px] font-bold">OPTIMAL</span>
          </div>
        </div>

        <div>
          <div className="text-4xl font-bold font-mono tracking-tighter text-white">
            €{squadValue.toFixed(1)}M
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-slate-800">
            <span className="text-slate-400 text-xs font-medium">ITB Remaining</span>
            <span className="font-mono font-black text-sm text-cyan-400">€{itb.toFixed(1)}M</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Projected Rank Gain</span>
            <span className="font-bold text-emerald-400">+14%</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Risk Profile</span>
            <span className={`font-bold uppercase ${
              riskMode === 'risky' ? 'text-amber-400' : riskMode === 'value' ? 'text-cyan-400' : 'text-emerald-400'
            }`}>
              {riskMode}
            </span>
          </div>
        </div>
      </div>

      {/* Top Captain Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Top Recommendation</h2>
        <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Star className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">{data?.captain?.team_name || "Real Madrid"}</p>
            <p className="text-sm font-black text-white">{data?.captain?.web_name || "K. Mbappé"}</p>
            <p className="text-[10px] text-cyan-400 font-bold">Captain Pick (2x Multiplier)</p>
          </div>
        </div>
      </div>

      {/* Engine Diagnostics */}
      <EngineDiagnostics data={data} onSyncTeamId={onSyncTeamId} />
    </div>
  );
};

