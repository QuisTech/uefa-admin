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

      {/* Captaincy Command Card: Optimal vs Consensus */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Captaincy Command</h2>
          {data?.topManagerInsight?.consensusCaptain && (
            <span className="text-[8.5px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded">
              👑 {data.topManagerInsight.consensusCaptain.captainPercentage}% Herd Pick
            </span>
          )}
        </div>

        {/* Optimal Pick */}
        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Star className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 uppercase font-black">{data?.captain?.team_name || "Top Club"}</p>
              <span className="text-[9px] font-mono font-black text-cyan-400">{data?.captain?.xP?.toFixed(1)} xP</span>
            </div>
            <p className="text-sm font-black text-white truncate">{data?.captain?.web_name || "Top Pick"}</p>
            <p className="text-[9.5px] text-emerald-400 font-bold">Optimal Engine Captain (2×)</p>
          </div>
        </div>

        {/* Elite Consensus Captain (if different from optimal pick) */}
        {data?.topManagerInsight?.consensusCaptain && data.topManagerInsight.consensusCaptain.web_name !== data?.captain?.web_name && (
          <div className="flex items-center gap-3 bg-purple-950/30 p-2.5 rounded-2xl border border-purple-500/30 text-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-amber-300 shrink-0 text-sm">
              👑
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase text-purple-300">Elite Consensus</span>
                <span className="text-[9px] font-mono font-black text-amber-300">
                  {data.topManagerInsight.consensusCaptain.captainPercentage}% Armband
                </span>
              </div>
              <p className="text-xs font-black text-white truncate">
                {data.topManagerInsight.consensusCaptain.full_name || data.topManagerInsight.consensusCaptain.web_name} (€{data.topManagerInsight.consensusCaptain.cost.toFixed(1)}M)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Engine Diagnostics */}
      <EngineDiagnostics data={data} onSyncTeamId={onSyncTeamId} />
    </div>
  );
};

