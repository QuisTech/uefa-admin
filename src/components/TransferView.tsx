import React, { useState } from 'react';
import { RecommendationResponse, ScoredPlayer } from '../types';
import { Cpu, Shield, Zap, Search, Lock, Unlock, XCircle, CheckCircle } from 'lucide-react';
import { PlayerPhoto } from './PlayerPhoto';

interface TransferViewProps {
  data: RecommendationResponse | null;
  riskMode: string;
  setRiskMode: (mode: string) => void;
  budget: number;
  setBudget: (b: number) => void;
  onSelectPlayer: (p: ScoredPlayer) => void;
  lockedPlayerIds: number[];
  setLockedPlayerIds: React.Dispatch<React.SetStateAction<number[]>>;
  excludedPlayerIds: number[];
  setExcludedPlayerIds: React.Dispatch<React.SetStateAction<number[]>>;
  onSyncTeam: (teamId: string) => void;
}

export const TransferView: React.FC<TransferViewProps> = ({
  data,
  riskMode,
  setRiskMode,
  budget,
  setBudget,
  onSelectPlayer,
  lockedPlayerIds,
  setLockedPlayerIds,
  excludedPlayerIds,
  setExcludedPlayerIds,
  onSyncTeam
}) => {
  const [teamInput, setTeamInput] = useState('');

  if (!data) return null;
  const { topPicks, squad } = data;

  const toggleLock = (id: number) => {
    if (lockedPlayerIds.includes(id)) {
      setLockedPlayerIds(lockedPlayerIds.filter(x => x !== id));
    } else {
      setLockedPlayerIds([...lockedPlayerIds, id]);
      setExcludedPlayerIds(excludedPlayerIds.filter(x => x !== id));
    }
  };

  const toggleExclude = (id: number) => {
    if (excludedPlayerIds.includes(id)) {
      setExcludedPlayerIds(excludedPlayerIds.filter(x => x !== id));
    } else {
      setExcludedPlayerIds([...excludedPlayerIds, id]);
      setLockedPlayerIds(lockedPlayerIds.filter(x => x !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Sync Header */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Squad Optimizer & Team Synchronization
          </h2>
          <p className="text-xs text-slate-400">
            Tune portfolio risk parameters or import your UEFA Champions League team ID
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Enter UEFA Team ID..."
              value={teamInput}
              onChange={e => setTeamInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          </div>
          <button
            onClick={() => teamInput && onSyncTeam(teamInput)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20"
          >
            Sync Team
          </button>
        </div>
      </div>

      {/* Optimizer Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Mode Cards */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-200">Strategy Risk Overlay</h3>
          <div className="space-y-2">
            {[
              { id: 'safe', title: 'SAFE (Rank Shield)', desc: 'Maximizes herd defense (min 250% EO), reduces variance', color: 'emerald' },
              { id: 'risky', title: 'RISKY (Differential Alpha)', desc: 'Targets explosive low-ownership (<15%) differentials', color: 'amber' },
              { id: 'value', title: 'VALUE (Knapsack PPM)', desc: 'Maximizes xP/€M, hard-locks starting weapons', color: 'cyan' }
            ].map(mode => (
              <div
                key={mode.id}
                onClick={() => setRiskMode(mode.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  riskMode === mode.id
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold text-white">{mode.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{mode.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Control */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Budget Limit</h3>
            <span className="text-sm font-extrabold text-cyan-300">€{budget.toFixed(1)}M</span>
          </div>
          <input
            type="range"
            min="90.0"
            max="105.0"
            step="0.5"
            value={budget}
            onChange={e => setBudget(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-xs text-slate-400">
            Default budget is €100.0M for League Phase (Matchdays 1-8).
          </p>
        </div>

        {/* Lock / Exclude Summary */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-200">Player Constraints</h3>
          <div className="text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Lock className="w-3.5 h-3.5" /> Locked Players:
              </span>
              <span className="font-extrabold text-white">{lockedPlayerIds.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <XCircle className="w-3.5 h-3.5" /> Excluded Players:
              </span>
              <span className="font-extrabold text-white">{excludedPlayerIds.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Positional Candidate Tables */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Quant Candidate Rankings per Position
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['fwd', 'mid', 'def', 'gkp'] as const).map(pos => {
            const list = topPicks[pos] || [];
            return (
              <div key={pos} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">{pos.toUpperCase()} Candidates</h4>
                  <span className="text-xs text-slate-500">{list.length} Top Picked</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {list.map(player => {
                    const isLocked = lockedPlayerIds.includes(player.id);
                    const isExcluded = excludedPlayerIds.includes(player.id);

                    return (
                      <div
                        key={player.id}
                        className="glass-card p-2.5 rounded-xl flex items-center justify-between hover:border-cyan-500/40 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => onSelectPlayer(player)}>
                          <PlayerPhoto
                            playerId={player.id}
                            playerName={player.web_name}
                            position={player.position}
                            teamShortName={player.team_short_name}
                            sizeClassName="w-8 h-8"
                            roundedClassName="rounded-lg"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{player.web_name}</div>
                            <div className="text-[10px] text-slate-400">
                              <span>{player.team_short_name}</span> • <span className="text-cyan-300 font-mono font-semibold">€{player.cost.toFixed(1)}M</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-cyan-400">{player.xP.toFixed(1)} xP</span>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleLock(player.id)}
                              className={`p-1 rounded transition-all ${
                                isLocked ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-500 hover:text-emerald-400'
                              }`}
                              title={isLocked ? "Unlock Player" : "Lock Player into Squad"}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleExclude(player.id)}
                              className={`p-1 rounded transition-all ${
                                isExcluded ? 'bg-rose-500 text-white font-bold' : 'text-slate-500 hover:text-rose-400'
                              }`}
                              title={isExcluded ? "Unexclude Player" : "Exclude Player from Solver"}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
