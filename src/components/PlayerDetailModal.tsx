import React from 'react';
import { ScoredPlayer } from '../types';
import { X, Activity, Sparkles } from 'lucide-react';
import { PlayerPhoto } from './PlayerPhoto';

interface PlayerDetailModalProps {
  player: ScoredPlayer | null;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/80 bg-slate-950/95 space-y-5 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player Header with HD Portrait */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <PlayerPhoto
              playerId={player.id}
              playerName={player.web_name}
              position={player.position}
              teamShortName={player.team_short_name}
              sizeClassName="w-20 h-20 sm:w-22 sm:h-22"
              roundedClassName="rounded-2xl"
              showSpotlight={true}
              className="border-2 border-cyan-400/40 shadow-xl shadow-cyan-950/50"
            />
            <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg bg-cyan-600 text-white border border-cyan-300 shadow-md">
              {player.position}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{player.pFName || player.web_name}</h2>
              {Boolean(player.isStartingWeapon) && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  STARTING WEAPON
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {player.team_name} ({player.team_short_name}) • €{player.cost.toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Key Quant Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Matchday xP</div>
            <div className="text-xl font-extrabold text-cyan-300">{player.xP.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">8-MD Horizon</div>
            <div className="text-xl font-extrabold text-indigo-300">{(player.horizonXP || player.xP * 8).toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Top 1k EO</div>
            <div className="text-xl font-extrabold text-emerald-300">{player.eo ?? player.ownership}%</div>
          </div>
        </div>

        {/* UEFA Fantasy Performance Statistics */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            UEFA Performance Metrics
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Total Points:</span>
              <span className="font-bold text-white">{player.totPts || 0}</span>
            </div>
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Minutes Played:</span>
              <span className="font-bold text-white">{player.minsPlyd || 0}'</span>
            </div>
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Goals Scored:</span>
              <span className="font-bold text-white">{player.gS || 0}</span>
            </div>
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Assists:</span>
              <span className="font-bold text-white">{player.assist || 0}</span>
            </div>
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Ball Recoveries (bR):</span>
              <span className="font-bold text-cyan-300">{player.bR || 0}</span>
            </div>
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Player of Match (POTM):</span>
              <span className="font-bold text-amber-300">{player.mOM || 0}</span>
            </div>
          </div>
        </div>

        {/* Conviction Status Footer */}
        <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 rounded-xl border border-cyan-500/20 text-xs text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
            <Sparkles className="w-4 h-4" /> Conviction Index:
          </span>
          <span className="font-extrabold text-white">{player.convictionIndex ?? 75} / 100</span>
        </div>
      </div>
    </div>
  );
};
