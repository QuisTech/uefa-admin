import React from 'react';
import { RecommendationResponse } from '../types';
import { Sparkles, TrendingUp, Award, Shield } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PerformanceViewProps {
  data: RecommendationResponse | null;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ data }) => {
  if (!data) return null;

  const mockHistory = [
    { matchday: 'MD1', quant: 72, template: 68, top1kAvg: 54 },
    { matchday: 'MD2', quant: 148, template: 139, top1kAvg: 112 },
    { matchday: 'MD3', quant: 221, template: 208, top1kAvg: 168 },
    { matchday: 'MD4', quant: 295, template: 279, top1kAvg: 225 },
    { matchday: 'MD5', quant: 374, template: 351, top1kAvg: 284 },
    { matchday: 'MD6', quant: 452, template: 426, top1kAvg: 345 }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Quant Performance & Scenario Backtest Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Historical cumulative points tracking: Quant Optimum vs Template Shield vs Top 1k Manager Average
          </p>
        </div>
      </div>

      {/* Recharts Performance Line Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Cumulative Matchday Performance</h3>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="matchday" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
              <Line type="monotone" dataKey="quant" name="Quant Optimum" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4' }} />
              <Line type="monotone" dataKey="template" name="Template Shield" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1' }} />
              <Line type="monotone" dataKey="top1kAvg" name="Top 1k Avg" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
