import React from 'react';
import { RecommendationResponse, ScoredPlayer } from '../types';
import { Lock, XCircle, Sparkles } from 'lucide-react';
import { PlayerPhoto } from './PlayerPhoto';

interface DataGridProps {
  data: RecommendationResponse | null;
  lockedPlayerIds: number[];
  excludedPlayerIds: number[];
  onToggleLock: (id: number) => void;
  onToggleExclude: (id: number) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  data,
  lockedPlayerIds,
  excludedPlayerIds,
  onToggleLock,
  onToggleExclude
}) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Optimal 15-Man Squad Pick Details
        </h3>
        <span className="text-xs text-slate-400 font-mono">Total Budget: €{data.totalCost.toFixed(1)}M</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Pos</th>
              <th className="p-3">Player</th>
              <th className="p-3">Club</th>
              <th className="p-3">Cost (€M)</th>
              <th className="p-3">Matchday xP</th>
              <th className="p-3">Top 1k EO</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-right">Lock / Exclude</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
            {data.squad.map(player => {
              const isLocked = lockedPlayerIds.includes(player.id);
              const isExcluded = excludedPlayerIds.includes(player.id);
              const isStarter = data.startingXI.some(p => p.id === player.id);

              return (
                <tr key={player.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-bold text-cyan-400">{player.position}</td>
                  <td className="p-3 font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <PlayerPhoto
                        playerId={player.id}
                        playerName={player.web_name}
                        position={player.position}
                        teamShortName={player.team_short_name}
                        sizeClassName="w-8 h-8"
                        roundedClassName="rounded-lg"
                      />
                      <span>{player.web_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-400">{player.team_short_name}</td>
                  <td className="p-3 text-cyan-300 font-mono">€{player.cost.toFixed(1)}M</td>
                  <td className="p-3 font-extrabold text-cyan-400 font-mono">{player.xP.toFixed(1)}</td>
                  <td className="p-3 text-slate-400 font-mono">{player.eo ?? player.ownership}%</td>
                  <td className="p-3">
                    {player.isCaptain ? (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">CAPTAIN (2x)</span>
                    ) : player.isViceCaptain ? (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded bg-slate-800 text-slate-300">VC</span>
                    ) : isStarter ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400">STARTER</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-slate-500">BENCH</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onToggleLock(player.id)}
                        className={`p-1 rounded transition-colors ${isLocked ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-500 hover:text-emerald-400'}`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleExclude(player.id)}
                        className={`p-1 rounded transition-colors ${isExcluded ? 'bg-rose-500 text-white font-bold' : 'text-slate-500 hover:text-rose-400'}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
