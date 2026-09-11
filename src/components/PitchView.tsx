import React from 'react';
import { ScoredPlayer, RecommendationResponse } from '../types';
import { Shield, Sparkles } from 'lucide-react';

interface PitchViewProps {
  data: RecommendationResponse | null;
  onSelectPlayer: (player: ScoredPlayer) => void;
  scenario: 'quant' | 'template';
  setScenario: (sc: 'quant' | 'template') => void;
}

export const PitchView: React.FC<PitchViewProps> = ({
  data,
  onSelectPlayer,
  scenario,
  setScenario
}) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const { startingXI, bench, expectedPoints, totalCost, engineDiagnostics } = data;
  const metrics = engineDiagnostics?.metrics;
  const scenarioComp = metrics?.scenarioComparison;

  const gkps = startingXI.filter(p => p.position === 'GKP');
  const defs = startingXI.filter(p => p.position === 'DEF');
  const mids = startingXI.filter(p => p.position === 'MID');
  const fwds = startingXI.filter(p => p.position === 'FWD');

  return (
    <div className="space-y-4">
      {/* Top Banner & Scenario Switcher */}
      <div className="bg-slate-900/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/30 text-cyan-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {scenario === 'quant' ? 'Quant Optimum Squad' : 'Template Shield Squad'}
              </h2>
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                {expectedPoints.toFixed(1)} xP
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Total Budget: €{totalCost.toFixed(1)}M / €100.0M • Average XI EO: {metrics?.averageXiEo ?? 0}%
            </p>
          </div>
        </div>

        {/* Scenario Comparison Switcher */}
        {scenarioComp && (
          <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <div className="text-right px-1">
              <div className="text-[10px] text-slate-400 font-semibold">Delta vs Template</div>
              <div className="text-xs font-bold text-cyan-300">
                {scenarioComp.delta.xpDiff >= 0 ? `+${scenarioComp.delta.xpDiff.toFixed(1)}` : scenarioComp.delta.xpDiff.toFixed(1)} xP
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setScenario('quant')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  scenario === 'quant'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Quant
              </button>
              <button
                onClick={() => setScenario('template')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  scenario === 'template'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Template
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3D Champions League Pitch View */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-gradient-to-b from-slate-950 via-blue-950/50 to-slate-950 p-4 sm:p-6 min-h-[520px] flex flex-col justify-around">
        {/* Pitch Lines Markings Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-x-6 inset-y-6 border-2 border-cyan-400 rounded-xl"></div>
          <div className="absolute top-1/2 inset-x-6 border-t-2 border-cyan-400"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-cyan-400 rounded-full"></div>
        </div>

        {/* Forwards Row */}
        <div className="relative z-10 flex justify-center items-center gap-4 sm:gap-10">
          {fwds.map(player => (
            <PlayerNode key={player.id} player={player} onClick={() => onSelectPlayer(player)} />
          ))}
        </div>

        {/* Midfielders Row */}
        <div className="relative z-10 flex justify-center items-center gap-3 sm:gap-6">
          {mids.map(player => (
            <PlayerNode key={player.id} player={player} onClick={() => onSelectPlayer(player)} />
          ))}
        </div>

        {/* Defenders Row */}
        <div className="relative z-10 flex justify-center items-center gap-3 sm:gap-6">
          {defs.map(player => (
            <PlayerNode key={player.id} player={player} onClick={() => onSelectPlayer(player)} />
          ))}
        </div>

        {/* Goalkeeper Row */}
        <div className="relative z-10 flex justify-center items-center gap-4">
          {gkps.map(player => (
            <PlayerNode key={player.id} player={player} onClick={() => onSelectPlayer(player)} />
          ))}
        </div>
      </div>

      {/* Bench Enablers / Substitutes Section */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Bench Enablers & Reserves</h3>
          </div>
          <span className="text-[11px] text-slate-400">4 Substitutes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {bench.map(player => (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between min-w-0"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-extrabold text-cyan-400 shrink-0">{player.position}</span>
                  <span className="text-xs font-bold text-white truncate">{player.web_name}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {player.team_short_name} • €{player.cost.toFixed(1)}M
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-extrabold text-cyan-300 font-mono">{player.xP.toFixed(1)} xP</div>
                {player.isBenchEnabler && (
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    BE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PlayerNodeProps {
  player: ScoredPlayer;
  onClick: () => void;
}

const PlayerNode: React.FC<PlayerNodeProps> = ({ player, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer flex flex-col items-center transition-all duration-300 hover:scale-105 shrink-0"
    >
      {/* Captain / Vice Captain Badge */}
      {player.isCaptain && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-400 text-slate-950 shadow border border-amber-200 whitespace-nowrap">
          CAPTAIN (2x)
        </span>
      )}
      {player.isViceCaptain && !player.isCaptain && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 text-[9px] font-black rounded-full bg-slate-200 text-slate-950 shadow whitespace-nowrap">
          VC
        </span>
      )}

      {/* Starting Weapon Badge */}
      {player.isStartingWeapon && (
        <span className="absolute -top-3 -right-1.5 z-20 px-1 py-0.2 text-[8px] font-black rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border border-amber-300 shadow">
          SW
        </span>
      )}

      {/* Shirt / Node Circle */}
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg border transition-all ${
        player.isCaptain
          ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-amber-400'
          : player.isStartingWeapon
          ? 'bg-gradient-to-b from-cyan-500/20 via-slate-900 to-slate-950 border-cyan-400'
          : 'bg-gradient-to-b from-slate-800/90 to-slate-950/90 border-slate-700 hover:border-cyan-400'
      }`}>
        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">{player.team_short_name}</span>
        <span className="text-sm sm:text-base font-black text-white font-mono">{player.xP.toFixed(1)}</span>
        <span className="text-[8px] text-slate-400 font-semibold">xP</span>
      </div>

      {/* Player Label Card */}
      <div className="mt-1 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-slate-800 text-center max-w-[95px] shadow-md">
        <div className="text-[11px] font-bold text-white truncate">{player.web_name}</div>
        <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1 font-mono">
          <span>€{player.cost.toFixed(1)}M</span>
          <span>•</span>
          <span className="text-cyan-300 font-bold">{player.eo ?? player.ownership}%</span>
        </div>
      </div>
    </div>
  );
};
