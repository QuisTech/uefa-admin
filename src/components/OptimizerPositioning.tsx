import React from 'react';
import { Cpu, Shield, Zap, TrendingUp, Sparkles, Layers } from 'lucide-react';

export const OptimizerPositioning: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 rounded-2xl border border-cyan-500/20 space-y-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Quant Portfolio Positioning Framework
        </h2>
        <p className="text-xs text-slate-400">
          The Horizon V3 Quant Engine operates as a hedge-fund style fantasy football positioning system. It separates the **Truth Engine** (Expected Value) from the **Risk Overlay** (Herd Effective Ownership bounds).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <div className="font-bold text-emerald-400 uppercase flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> SAFE MODE (Rank Shield)
          </div>
          <p className="text-slate-400">
            Enforces herd defense constraints (minimum 250% EO coverage, min 1 elite anchor). Minimizes portfolio variance while capitalizing on market mispricings.
          </p>
        </div>

        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <div className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> RISKY MODE (Differential Alpha)
          </div>
          <p className="text-slate-400">
            Rewards explosive tail variance and differential assets (&lt;15% selected by public). Searches for rank spikes during high-volatility matchdays.
          </p>
        </div>

        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <div className="font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> VALUE MODE (Knapsack PPM)
          </div>
          <p className="text-slate-400">
            Maximizes Expected Points per Million (€M). Locks in high-conviction Starting Weapons while preserving bank budget for future matchdays.
          </p>
        </div>
      </div>
    </div>
  );
};
