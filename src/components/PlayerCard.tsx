import React, { useState, useEffect, useRef } from 'react';
import { ScoredPlayer } from '../types';
import { Lock, Ban, X } from 'lucide-react';
import { getTeamKit, JerseySVG } from './JerseySVG';

export interface PlayerCardProps {
  player: ScoredPlayer;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isConsensusCaptain?: boolean;
  isLocked?: boolean;
  isExcluded?: boolean;
  onToggleLock?: (id: number) => void;
  onToggleExclude?: (id: number) => void;
  compact?: boolean;
  benchIndex?: number;
  showFixtures?: boolean;
  onSelect?: (player: ScoredPlayer) => void;
}

const PHOTO_SEASONS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCaptain = false,
  isViceCaptain = false,
  isConsensusCaptain = player.isConsensusCaptain || false,
  isLocked = false,
  isExcluded = false,
  onToggleLock,
  onToggleExclude,
  compact = false,
  benchIndex,
  showFixtures = true,
  onSelect
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipAlignment, setTooltipAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset season fallback when player ID changes
  useEffect(() => {
    setSeasonIndex(0);
    setImgError(false);
  }, [player?.id]);

  const updateAlignment = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const screenWidth = window.innerWidth;

    if (cardCenter < 110) {
      setTooltipAlignment('left');
    } else if (screenWidth - cardCenter < 110) {
      setTooltipAlignment('right');
    } else {
      setTooltipAlignment('center');
    }
  };

  useEffect(() => {
    if (!showTooltip) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showTooltip]);

  if (!player) return null;

  const nextFixture = player.next_fixtures?.[0];
  const isGkp = player.position === 'GKP';
  const teamShort = (player.team_short_name || player.team_name || 'UCL').toUpperCase();
  const kit = getTeamKit(teamShort, isGkp);

  // Progressive UEFA headshot photo URL with fallback across registration seasons
  const currentSeason = PHOTO_SEASONS[seasonIndex] || 2025;
  const uefaPhotoUrl = `https://img.uefa.com/imgml/TP/players/1/${currentSeason}/324x324/${player.id}.jpg`;

  const handleImageError = () => {
    if (seasonIndex < PHOTO_SEASONS.length - 1) {
      setSeasonIndex(prev => prev + 1);
    } else {
      setImgError(true);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    updateAlignment();
    setShowTooltip(prev => !prev);
  };

  const alignmentClasses = {
    center: "left-1/2 -translate-x-1/2",
    left: "left-0 translate-x-0 sm:left-1/2 sm:-translate-x-1/2",
    right: "right-0 left-auto translate-x-0 sm:left-1/2 sm:-translate-x-1/2"
  }[tooltipAlignment];

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onMouseEnter={updateAlignment}
      className={`group relative flex flex-col items-center justify-start transition-all duration-200 hover:scale-105 select-none cursor-pointer ${
        compact ? "w-[52px] sm:w-[68px] md:w-[76px]" : "w-[56px] sm:w-[72px] md:w-[82px] lg:w-[88px]"
      } ${isExcluded ? "opacity-35 grayscale" : ""}`}
    >
      {/* 🎖️ Official Captain / Vice-Captain / Consensus Captain Circular Badge */}
      {isCaptain && (
        <div
          title={isConsensusCaptain ? `Consensus & Optimal Captain (2x Points • ${Math.round((player.consensusCaptainRate || 0.27) * 100)}% of Top Managers)` : "Captain (2x Points)"}
          className={`absolute -top-1.5 -left-1 sm:-top-2 sm:-left-1.5 z-30 flex items-center justify-center w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-[#001438] text-amber-300 border-2 border-white/80 font-black text-[9px] sm:text-xs shadow-lg ${
            isConsensusCaptain ? "ring-2 ring-amber-400 shadow-amber-500/50" : ""
          }`}
        >
          {isConsensusCaptain ? "👑" : "C"}
        </div>
      )}
      {isConsensusCaptain && !isCaptain && (
        <div
          title={`Elite Consensus Captain (${Math.round((player.consensusCaptainRate || 0.27) * 100)}% of Top Managers)`}
          className="absolute -top-1.5 -left-1 sm:-top-2 sm:-left-1.5 z-30 flex items-center justify-center w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-[#1c0836] text-amber-300 border-2 border-amber-400 font-black text-[9px] sm:text-xs shadow-lg ring-1 ring-purple-400"
        >
          👑
        </div>
      )}
      {isViceCaptain && !isCaptain && !isConsensusCaptain && (
        <div
          title="Vice Captain"
          className="absolute -top-1.5 -left-1 sm:-top-2 sm:-left-1.5 z-30 flex items-center justify-center w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-[#001438] text-cyan-300 border-2 border-white/80 font-black text-[8px] sm:text-[11px] shadow-lg flex items-center gap-0.5"
        >
          <span>V</span>
        </div>
      )}

      {/* ⚔️ Starting Weapon Badge */}
      {Boolean(player.isStartingWeapon) && !isCaptain && !isLocked && (
        <div
          title="Starting Weapon (High Conviction Elite Pick)"
          className="absolute -top-1.5 -right-1 sm:-top-2 sm:-right-1.5 z-30 flex items-center justify-center px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[6.5px] sm:text-[8px] shadow border border-amber-300"
        >
          SW
        </div>
      )}

      {/* 🔒 Lock Constraint Badge */}
      {isLocked && (
        <div
          title="Locked in Solver (Mandatory)"
          className="absolute -top-1.5 -right-1 sm:-top-2 sm:-right-1.5 z-30 flex items-center justify-center w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-400 text-slate-950 shadow-md font-bold"
        >
          <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
        </div>
      )}

      {/* 🎛️ Interactive Solver Constraints Hover Overlay */}
      {(onToggleLock || onToggleExclude) && (
        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-40 bg-slate-950/95 p-0.5 rounded-md border border-slate-700 shadow-xl">
          {onToggleLock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(player.id);
              }}
              title={isLocked ? "Unlock Player" : "Lock Player (Force Include in Solver)"}
              className={`p-1 rounded transition-colors ${
                isLocked ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
              }`}
            >
              <Lock className="w-2.5 h-2.5" />
            </button>
          )}
          {onToggleExclude && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExclude(player.id);
              }}
              title={isExcluded ? "Unban Player" : "Exclude Player (Ban from Solver)"}
              className={`p-1 rounded transition-colors ${
                isExcluded ? "bg-rose-500 text-white" : "text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              }`}
            >
              <Ban className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}

      {/* 1. Official Player Picture with Frosted Spotlight & Jersey Fallback */}
      <div className={`relative flex items-center justify-center ${
        compact 
          ? "w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] md:w-[60px] md:h-[60px]" 
          : "w-[48px] h-[48px] sm:w-[58px] sm:h-[58px] md:w-[66px] md:h-[66px]"
      } mb-0.5 rounded-xl bg-gradient-to-b from-white/25 via-white/10 to-white/5 border border-white/30 backdrop-blur-md p-0.5 shadow-md drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]`}>
        {!imgError ? (
          <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-slate-900 ring-1 ring-white/20 shadow-inner">
            <img
              src={uefaPhotoUrl}
              alt={player.web_name}
              className="w-full h-full object-cover object-top filter contrast-[1.07] brightness-[1.02] saturate-[1.07] hover:scale-105 transition-all duration-300 pointer-events-none drop-shadow-sm"
              style={{
                imageRendering: '-webkit-optimize-contrast',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
              }}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <JerseySVG kit={kit} className={compact ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"} />
        )}

        {/* Floating Analytical xP Badge on Corner */}
        <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 bg-slate-950/95 border border-fpl-green/70 text-fpl-green font-mono font-black text-[7.5px] sm:text-[9px] px-1 py-0.2 rounded shadow-lg backdrop-blur-xs flex items-center gap-0.5 z-20">
          <span>{typeof player.xP === 'number' ? player.xP.toFixed(1) : '—'}</span>
          <span className="text-[5.5px] text-slate-400 font-normal">xP</span>
        </div>
      </div>

      {/* 2. Official 2-Tier Nameplate (Authentic White Background Design) */}
      <div className="w-full rounded-md shadow-md overflow-hidden border border-slate-300/80 bg-white">
        {/* Tier 1: Player Name Bar (Official Clean White Background with Sharp Dark Text) */}
        <div className="bg-white px-1 py-0.5 text-center flex items-center justify-center gap-1 border-b border-slate-200/90">
          <span className="font-extrabold text-slate-950 text-[8px] sm:text-[10px] md:text-[11px] leading-tight truncate">
            {player.web_name}
          </span>
        </div>

        {/* Tier 2: Next Fixture & Solid FDR Price/EO Pill */}
        <div className="w-full bg-slate-50 px-1 py-0.5 flex items-center justify-between gap-0.5 sm:gap-1 text-[6.5px] sm:text-[8px] font-bold text-slate-800">
          {/* Opponent & Venue Info */}
          <span className="truncate tracking-tighter text-slate-700 font-semibold font-mono">
            {nextFixture ? `${nextFixture.opponent} (${nextFixture.is_home ? 'H' : 'A'})` : teamShort}
          </span>

          {/* Solid FDR-Colored Accent Pill (Price or Est. EO) */}
          <span
            className={`text-[6.5px] sm:text-[7.5px] font-black px-1 py-0.2 rounded text-white font-mono shrink-0 shadow-sm ${
              nextFixture ? (
                nextFixture.difficulty <= 2 ? "bg-[#00753b]" :
                nextFixture.difficulty === 3 ? "bg-[#374151]" :
                nextFixture.difficulty === 4 ? "bg-[#e11d48]" :
                "bg-[#881337]"
              ) : "bg-cyan-700"
            }`}
          >
            {typeof player.eo === 'number' && player.eo > 0
              ? `${player.eo.toFixed(0)}%`
              : `€${player.cost.toFixed(1)}M`}
          </span>
        </div>
      </div>

      {/* 3. Next 3 FDR Fixture Difficulty Ticker (Distinctive Solid Backgrounds) */}
      {showFixtures && player.next_fixtures && player.next_fixtures.length > 0 && (
        <div className="flex items-center justify-center gap-0.5 mt-0.5 sm:mt-1 w-full px-0.5">
          {player.next_fixtures.slice(0, 3).map((f, idx) => (
            <span
              key={idx}
              title={`${f.opponent} (${f.is_home ? 'Home' : 'Away'}) - FDR ${f.difficulty}`}
              className={`text-[6px] sm:text-[7.5px] font-black px-0.5 sm:px-1 py-0.5 rounded font-mono leading-none tracking-tight truncate flex items-center justify-center shadow-md flex-1 text-center ${
                f.difficulty <= 2 ? "bg-[#00753b] text-white border border-emerald-400/40" :
                f.difficulty === 3 ? "bg-[#374151] text-white border border-slate-500/40" :
                f.difficulty === 4 ? "bg-[#e11d48] text-white border border-rose-400/40" :
                "bg-[#881337] text-white border border-pink-400/40"
              }`}
            >
              {f.opponent}{f.is_home ? 'H' : 'A'}
            </span>
          ))}
        </div>
      )}

      {/* 4. Engine Math Tooltip (Interactive: Tap on Mobile / Hover on Desktop) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute z-50 bg-slate-950/98 backdrop-blur-md border border-slate-700 text-slate-300 text-[9px] p-2.5 rounded-xl shadow-2xl w-44 sm:w-48 max-w-[calc(100vw-24px)] bottom-full mb-2 transition-all duration-200 ${alignmentClasses} ${
          showTooltip
            ? "opacity-100 pointer-events-auto scale-100 ring-2 ring-cyan-400/40"
            : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 scale-95"
        }`}
      >
        <div className="font-bold border-b border-slate-800 pb-2 mb-2 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-cyan-400/50 shrink-0 bg-slate-900 shadow-lg ring-1 ring-white/15">
              <img
                src={uefaPhotoUrl}
                alt={player.web_name}
                className="w-full h-full object-cover object-top filter contrast-[1.07] brightness-[1.02] saturate-[1.07]"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                }}
                onError={handleImageError}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white leading-tight">{player.web_name}</span>
              <span className="text-[8px] font-mono text-cyan-300 font-bold mt-0.5">
                {teamShort} • {player.position}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="p-1 text-slate-400 hover:text-white rounded-md bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between py-0.2">
            <span className="text-slate-400">Matchday xP:</span>
            <span className="text-cyan-400 font-mono font-black">{player.xP?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.2">
            <span className="text-slate-400">Price:</span>
            <span className="font-mono font-bold text-slate-200">€{player.cost.toFixed(1)}M</span>
          </div>
          <div className="flex justify-between py-0.2">
            <span className="text-slate-400">Top-1k EO:</span>
            <span className="font-mono text-cyan-300 font-bold">{player.eo ? `${player.eo.toFixed(1)}%` : 'Differential'}</span>
          </div>
          {isConsensusCaptain && (
            <div className="flex justify-between items-center py-0.5 px-1.5 rounded bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold my-0.5">
              <span className="flex items-center gap-1">
                <span>👑</span> Consensus Captain:
              </span>
              <span className="font-mono font-black">{Math.round((player.consensusCaptainRate || 0.27) * 100)}% Herd</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-slate-800/80 pt-1 mt-1">
            <span className="text-slate-400">Value Efficiency:</span>
            <span className="text-amber-400 font-mono">{((player.xP || 0) / (player.cost || 1)).toFixed(2)} xP/€M</span>
          </div>
        </div>

        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              onSelect(player);
            }}
            className="w-full mt-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[8.5px] font-bold uppercase tracking-wider transition-colors text-center cursor-pointer"
          >
            Inspect Detailed Stats
          </button>
        )}
      </div>
    </div>
  );
};
