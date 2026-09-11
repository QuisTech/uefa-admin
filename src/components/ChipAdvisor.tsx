import React from 'react';
import { RecommendationResponse } from '../types';
import { Zap, Shield, Sparkles } from 'lucide-react';

interface ChipAdvisorProps {
  data: RecommendationResponse | null;
}

export const ChipAdvisor: React.FC<ChipAdvisorProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        UEFA Chip Strategy Advisor
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center justify-between">
            <span>Wildcard Chip</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">HOLD</span>
          </div>
          <p className="text-slate-400">
            Squad structural health is optimal. Reserve Wildcard for heavy rotation matchdays or Knockout transitions.
          </p>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center justify-between">
            <span>Limitless Chip</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">AVOID</span>
          </div>
          <p className="text-slate-400">
            Unlimited budget chip is best saved for Matchday 5 or 6 when premium matchups align favorably.
          </p>
        </div>
      </div>
    </div>
  );
};
