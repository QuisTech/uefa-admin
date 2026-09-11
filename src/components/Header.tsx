import React from 'react';
import { RecommendationResponse } from '../types';
import { Shield, Sparkles, UserCircle, User } from 'lucide-react';

interface HeaderProps {
  data: RecommendationResponse | null;
  riskMode: 'safe' | 'risky' | 'value';
  setRiskMode: (mode: 'safe' | 'risky' | 'value') => void;
  fuel: 'native' | 'csv' | 'eye-test';
  setFuel: (fuel: 'native' | 'csv' | 'eye-test') => void;
  scenario: 'quant' | 'template';
  setScenario: (sc: 'quant' | 'template') => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  riskMode,
  setRiskMode,
  fuel,
  setFuel,
  scenario,
  setScenario
}) => {
  return (
    <header className="col-span-12 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-4">
      {/* Title & Branding */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-cyan-500/20 shrink-0">
          U
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              UEFA <span className="text-cyan-400 font-black">HORIZON</span>
            </h1>
            <span className="bg-cyan-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
              V3
            </span>
            <span className="bg-slate-900 text-cyan-400 text-[8px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
              AI POWERED
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-light uppercase tracking-widest">
            Champions League Quant Positioning System
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between xl:justify-end gap-4 xl:gap-6 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 w-full xl:w-auto">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full xl:w-auto">
          {/* Strategy Mode Toggle */}
          <div className="flex flex-col w-full sm:w-auto">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 text-left sm:text-right font-medium">
              Strategy Mode
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg mt-1 border border-slate-800">
              <button
                onClick={() => setRiskMode('safe')}
                className={`px-3 py-1 text-[10px] rounded font-extrabold transition-all ${
                  riskMode === 'safe' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                SAFE
              </button>
              <button
                onClick={() => setRiskMode('risky')}
                className={`px-3 py-1 text-[10px] rounded font-extrabold transition-all ${
                  riskMode === 'risky' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                RISKY
              </button>
              <button
                onClick={() => setRiskMode('value')}
                className={`px-3 py-1 text-[10px] rounded font-extrabold transition-all ${
                  riskMode === 'value' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                VALUE
              </button>
            </div>
          </div>

          {/* Scenario Toggle */}
          <div className="flex flex-col w-full sm:w-auto">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 text-left sm:text-right font-medium">
              Scenario
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg mt-1 border border-slate-800">
              <button
                onClick={() => setScenario('quant')}
                className={`px-2.5 py-1 text-[10px] rounded font-extrabold transition-all ${
                  scenario === 'quant' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                QUANT
              </button>
              <button
                onClick={() => setScenario('template')}
                className={`px-2.5 py-1 text-[10px] rounded font-extrabold transition-all ${
                  scenario === 'template' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                TEMPLATE
              </button>
            </div>
          </div>
        </div>

        <div className="h-px xl:h-8 w-full xl:w-px bg-slate-800 my-1 xl:my-0"></div>

        {/* Expected Points Summary */}
        <div className="flex items-center justify-between xl:justify-end gap-4 xl:gap-6 w-full xl:w-auto">
          <div className="flex flex-col text-left xl:text-right">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
              Expected Points
            </span>
            <div className="flex items-baseline gap-1.5 xl:justify-end">
              <span className="text-xl font-bold text-cyan-400 tabular-nums">
                +{(data?.expectedPoints || 0).toFixed(1)} xP
              </span>
            </div>
            {data?.captain && (
              <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
                XI: {((data.expectedPoints || 0) - (data.captain.xP || 0)).toFixed(1)} • C (2×): +{(data.captain.xP || 0).toFixed(1)}
              </span>
            )}
          </div>

          <div className="h-8 w-px bg-slate-800 hidden xl:block"></div>

          <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shrink-0">
            <UserCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Quant User</span>
          </button>
        </div>
      </div>
    </header>
  );
};
