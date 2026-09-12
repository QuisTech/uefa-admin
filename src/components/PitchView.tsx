import React, { useState } from 'react';
import { RecommendationResponse, ScoredPlayer } from '../types';
import { Zap, Shield, Eye, EyeOff, Layout, List, Lock, Ban, X, ArrowRightLeft } from 'lucide-react';
import { PlayerCard } from './PlayerCard';

interface PitchViewProps {
  data: RecommendationResponse | null;
  onSelectPlayer?: (player: ScoredPlayer) => void;
  scenario?: 'quant' | 'template';
  setScenario?: (sc: 'quant' | 'template') => void;
  lockedPlayerIds?: number[];
  excludedPlayerIds?: number[];
  onToggleLock?: (id: number) => void;
  onToggleExclude?: (id: number) => void;
  onClearConstraints?: () => void;
}

const getPosBadgeColor = (pos?: string) => {
  switch (pos) {
    case 'GKP':
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case 'DEF':
      return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    case 'MID':
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case 'FWD':
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    default:
      return "bg-slate-800 text-slate-400 border-slate-700";
  }
};

export const PitchView: React.FC<PitchViewProps> = ({
  data,
  onSelectPlayer,
  scenario = 'quant',
  setScenario,
  lockedPlayerIds = [],
  excludedPlayerIds = [],
  onToggleLock,
  onToggleExclude,
  onClearConstraints
}) => {
  const [showFixtures, setShowFixtures] = useState(true);
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');

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
  const delta = scenarioComp?.delta;

  const gkps = startingXI.filter(p => p.position === 'GKP');
  const defs = startingXI.filter(p => p.position === 'DEF');
  const mids = startingXI.filter(p => p.position === 'MID');
  const fwds = startingXI.filter(p => p.position === 'FWD');

  const allPlayersMap = new Map<number, ScoredPlayer>();
  data?.squad?.forEach(p => allPlayersMap.set(p.id, p));

  const hasConstraints = lockedPlayerIds.length > 0 || excludedPlayerIds.length > 0;
  const captain = data?.captain?.web_name || startingXI.find(p => p.isCaptain)?.web_name || 'TBD';

  return (
    <div className="flex-grow flex flex-col justify-start space-y-3 py-1 w-full max-w-5xl mx-auto animate-fadeIn">
      {/* 🌟 Top Controls: Scenario Switcher & Delta Comparison Bar */}
      {setScenario && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          {/* Left: Scenario Toggle Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setScenario('quant')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                scenario === 'quant'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quant Optimum</span>
            </button>
            <button
              onClick={() => setScenario('template')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                scenario === 'template'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-300" />
              <span>Template Shield</span>
            </button>
          </div>

          {/* Right: Delta Metric Badges */}
          {delta && (
            <div className="flex items-center gap-2 text-[10px] font-mono w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[8px]">Delta xP</span>
                <span className={`font-black font-mono ${delta.xpDiff >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {delta.xpDiff > 0 ? `+${delta.xpDiff.toFixed(1)}` : delta.xpDiff.toFixed(1)} pts
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[8px]">Delta EO</span>
                <span className={`font-black font-mono ${delta.eoDiff >= 0 ? "text-cyan-400" : "text-slate-300"}`}>
                  {delta.eoDiff > 0 ? `+${delta.eoDiff.toFixed(1)}` : delta.eoDiff.toFixed(1)}%
                </span>
              </div>

              {delta.swaps?.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 hidden md:flex">
                  <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-300 font-bold">{delta.swaps.length} Swaps</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 📊 UEFA Matchday & Squad Diagnostics Stats Ribbon */}
      <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-md shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-[9.5px] sm:text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Matchday {data?.nextEventId || 1}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white truncate">
              {scenario === 'template' ? 'Template Shield Consensus Lineup' : 'Quant Optimal Starting Lineup'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 text-[9px] font-mono flex-wrap">
            {/* 1. Optimal Captain Badge */}
            <span
              title={`Engine Recommended Captain: ${captain} (${data?.captain?.xP?.toFixed(1) || ''} xP)`}
              className="bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold flex items-center gap-1 shadow-sm"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[7.5px] font-black border border-white/60">C</span>
              <span className="text-slate-400 font-normal">Pick:</span> {captain}
            </span>

            {/* 2. Elite Consensus Captain Badge */}
            {data?.topManagerInsight?.consensusCaptain && (
              <span
                title={`Elite Consensus Captain: ${data.topManagerInsight.consensusCaptain.full_name || data.topManagerInsight.consensusCaptain.web_name} (${data.topManagerInsight.consensusCaptain.captainPercentage}% of Elite Managers)`}
                className={`border px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-sm ${
                  data.topManagerInsight.consensusCaptain.isQuantCaptainMatch || captain === data.topManagerInsight.consensusCaptain.web_name
                    ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
                    : "bg-purple-950/60 border-purple-500/40 text-purple-300"
                }`}
              >
                <span>👑</span>
                <span className="text-slate-400 font-normal">Consensus C:</span> {data.topManagerInsight.consensusCaptain.full_name || data.topManagerInsight.consensusCaptain.web_name}
                <span className="text-[8px] bg-white/10 px-1 rounded font-mono">
                  {data.topManagerInsight.consensusCaptain.captainPercentage}%
                </span>
                {(data.topManagerInsight.consensusCaptain.isQuantCaptainMatch || captain === data.topManagerInsight.consensusCaptain.web_name) && (
                  <span className="text-amber-400 text-[8px] font-black uppercase">🔥 Match</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* 6-Metric Matchday Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-black font-mono text-cyan-400 leading-none">{expectedPoints.toFixed(1)}</span>
            <span className="text-[8px] font-mono uppercase text-slate-400 mt-1">Expected xP</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-400 leading-none">{metrics?.averageXiEo ?? 0}%</span>
            <span className="text-[8px] font-mono uppercase text-slate-400 mt-1">Avg XI EO</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-black font-mono text-white leading-none">€{totalCost.toFixed(1)}M</span>
            <span className="text-[8px] font-mono uppercase text-slate-400 mt-1">Squad Value</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-black font-mono text-amber-400 leading-none">€{Math.max(0, 100.0 - totalCost).toFixed(1)}M</span>
            <span className="text-[8px] font-mono uppercase text-slate-400 mt-1">In Bank</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-black font-mono text-purple-300 leading-none">{startingXI.length} Starters</span>
            <span className="text-[8px] font-mono uppercase text-slate-400 mt-1">Active XI</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-400 leading-none">{bench.length} Subs</span>
            <span className="text-[8px] font-mono uppercase text-slate-400 mt-1">Bench Dugout</span>
          </div>
        </div>
      </div>

      {/* Active Constraints Pill Bar */}
      {hasConstraints && (
        <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/70 border border-slate-800/90 rounded-xl backdrop-blur-sm">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider mr-1">Active Solver Rules:</span>
          {lockedPlayerIds.map(id => {
            const p = allPlayersMap.get(id);
            return (
              <span key={`lock-${id}`} className="inline-flex items-center gap-1 bg-amber-400/15 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded text-[9px] font-bold">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>{p?.web_name || `ID ${id}`}</span>
                {onToggleLock && (
                  <button onClick={() => onToggleLock(id)} className="hover:text-white ml-0.5 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            );
          })}
          {excludedPlayerIds.map(id => {
            const p = allPlayersMap.get(id);
            return (
              <span key={`ex-${id}`} className="inline-flex items-center gap-1 bg-rose-500/15 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded text-[9px] font-bold">
                <Ban className="w-2.5 h-2.5 text-rose-400" />
                <span>{p?.web_name || `ID ${id}`}</span>
                {onToggleExclude && (
                  <button onClick={() => onToggleExclude(id)} className="hover:text-white ml-0.5 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            );
          })}
          {onClearConstraints && (
            <button
              onClick={onClearConstraints}
              className="text-[8px] text-slate-400 hover:text-white underline ml-auto font-bold uppercase tracking-wider cursor-pointer"
            >
              Clear All Rules
            </button>
          )}
        </div>
      )}

      {/* 🎛️ Pitch / List View Mode & Formation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 max-w-2xl sm:max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider">
            {defs.length}-{mids.length}-{fwds.length} Formation
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            11 Starters, {bench.length} Subs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/95 p-1 rounded-lg border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode('pitch')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'pitch'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3 h-3" />
              <span>Pitch</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3 h-3" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🏟️ View Mode Content: Authentic Pitch or List View */}
      {viewMode === 'pitch' ? (
        /* 🌟 Authentic Football Pitch Container (1:1 Proportional Match with fpl-admin max-w-2xl) */
        <div className="relative mx-auto w-full max-w-2xl py-0.5 sm:py-1">
          <div className="relative rounded-2xl shadow-2xl border-2 border-slate-800 bg-[#00a350] p-1.5 sm:p-3">
            
            {/* 🌿 Clipped Stadium Turf & Diagram Underlay (Keeps Rounded Corners without Clipping Tooltips) */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              {/* Realistic Mown Grass Horizontal Lawn Stripes Background */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `repeating-linear-gradient(
                    to bottom,
                    #00a350,
                    #00a350 40px,
                    #009b4d 40px,
                    #009b4d 80px
                  )`
                }}
              />

              {/* 🏟️ Authentic Perspective Pitch Diagram SVG (Aligned with Rows) */}
              <svg 
                className="absolute inset-0 w-full h-full stroke-white/80 fill-none" 
                preserveAspectRatio="none" 
                viewBox="0 0 800 680"
              >
                {/* Stadium Outer Flanks */}
                <polygon points="-10,-10 105,-10 105,4 0,227.44 -10,227.44 -10,-10" className="fill-[#020617] stroke-[#020617]" strokeWidth="2" />
                <polygon points="810,-10 695,-10 695,4 800,227.44 810,227.44 810,-10" className="fill-[#020617] stroke-[#020617]" strokeWidth="2" />
                <polygon points="105,-10 695,-10 695,4 105,4" className="fill-[#020617] stroke-[#020617]" strokeWidth="2" />

                {/* Outer Touchlines */}
                <line x1="105" y1="4" x2="0" y2="227.44" strokeWidth="2" className="stroke-white/70" />
                <line x1="695" y1="4" x2="800" y2="227.44" strokeWidth="2" className="stroke-white/70" />
                <line x1="105" y1="4" x2="695" y2="4" strokeWidth="2" className="stroke-white/70" />

                {/* Left UEFA Champions League Billboard */}
                <rect x="125" y="4" width="215" height="20" rx="4" className="fill-[#001438] stroke-none" />
                <g transform="translate(135, 6)">
                  <circle cx="8" cy="8" r="6" fill="#00e5ff" />
                  <text x="20" y="12" fill="#00e5ff" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.4">UEFA CHAMPIONS LEAGUE</text>
                </g>

                {/* Center Goal Net Frame */}
                <rect x="340" y="4" width="120" height="20" className="fill-cyan-500/25 stroke-white" strokeWidth="2" />
                <line x1="364" y1="4" x2="364" y2="24" strokeWidth="1" className="stroke-white/50" />
                <line x1="388" y1="4" x2="388" y2="24" strokeWidth="1" className="stroke-white/50" />
                <line x1="412" y1="4" x2="412" y2="24" strokeWidth="1" className="stroke-white/50" />
                <line x1="436" y1="4" x2="436" y2="24" strokeWidth="1" className="stroke-white/50" />
                <line x1="340" y1="10" x2="460" y2="10" strokeWidth="1" className="stroke-white/50" />
                <line x1="340" y1="17" x2="460" y2="17" strokeWidth="1" className="stroke-white/50" />

                {/* Right UEFA Billboard */}
                <rect x="460" y="4" width="215" height="20" rx="4" className="fill-[#001438] stroke-none" />
                <g transform="translate(490, 6)">
                  <circle cx="8" cy="8" r="6" fill="#00e5ff" />
                  <text x="20" y="12" fill="#00e5ff" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.4">FANTASY HORIZON</text>
                </g>

                {/* Goal Line & Sidelines */}
                <line x1="125" y1="24" x2="675" y2="24" strokeWidth="2.5" />
                <line x1="125" y1="24" x2="0" y2="290" strokeWidth="3" />
                <line x1="0" y1="290" x2="0" y2="450" strokeWidth="3" />
                <line x1="675" y1="24" x2="800" y2="290" strokeWidth="3" />
                <line x1="800" y1="290" x2="800" y2="450" strokeWidth="3" />

                {/* 6-Yard Box */}
                <polygon points="295,24 505,24 512,62 288,62" strokeWidth="2" />

                {/* 18-Yard Penalty Box */}
                <polygon points="200,24 600,24 618,125 182,125" strokeWidth="2.5" />
                
                {/* Penalty Spot & Arc */}
                <circle cx="400" cy="90" r="4" className="fill-white" stroke="none" />
                <path d="M 325,125 A 85,38 0 0,0 475,125" strokeWidth="2.2" />

                {/* Corner Arcs */}
                <path d="M 117.0,46.8 A 24,24 0 0,0 149,24" strokeWidth="2.2" />
                <path d="M 651,24 A 24,24 0 0,0 683.0,46.8" strokeWidth="2.2" />

                {/* Halfway Line (Cutting horizontally through center of Forwards) */}
                <line x1="0" y1="450" x2="800" y2="450" strokeWidth="3.5" />
                
                {/* Center Circle */}
                <ellipse cx="400" cy="450" rx="160" ry="85" strokeWidth="2.8" />
                <circle cx="400" cy="450" r="4.5" className="fill-white" stroke="none" />
              </svg>
            </div>

            {/* 🎛️ Floating Fixture Ticker Toggle */}
            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30">
              <button
                onClick={() => setShowFixtures(!showFixtures)}
                className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider backdrop-blur-md transition-all shadow-lg select-none cursor-pointer ${
                  showFixtures 
                    ? "bg-black/70 border-cyan-400/50 text-cyan-300 hover:bg-black/90 hover:border-cyan-400" 
                    : "bg-black/40 border-white/20 text-white/70 hover:bg-black/70 hover:text-white"
                }`}
                title="Toggle upcoming 3-match FDR fixture ticker under players"
              >
                {showFixtures ? (
                  <>
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                    <span>3-Match FDR: On</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/50" />
                    <span>3-Match FDR: Off</span>
                  </>
                )}
              </button>
            </div>

            {/* 🏟️ Starting XI Lines on the Pitch (1:1 Proportional Match with fpl-admin) */}
            <div className="relative z-10 flex flex-col justify-between min-h-[360px] sm:min-h-[420px] md:min-h-[490px] pt-4 pb-0.5 sm:pt-6 sm:pb-1.5">
              
              {/* Row 1: Goalkeeper (Inside Goalmouth & 18-Yard Box) */}
              <div className="flex justify-center items-center w-full my-0 sm:my-0.5">
                {gkps.map(p => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    isCaptain={p.isCaptain}
                    isViceCaptain={p.isViceCaptain}
                    isLocked={lockedPlayerIds.includes(p.id)}
                    isExcluded={excludedPlayerIds.includes(p.id)}
                    onToggleLock={onToggleLock}
                    onToggleExclude={onToggleExclude}
                    onSelect={onSelectPlayer}
                  />
                ))}
              </div>

              {/* Row 2: Defenders (Upper Pitch between Penalty Box & Midfield) */}
              <div className="flex justify-around items-center w-full max-w-[88%] mx-auto my-0 sm:my-0.5">
                {defs.map(p => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    isCaptain={p.isCaptain}
                    isViceCaptain={p.isViceCaptain}
                    isLocked={lockedPlayerIds.includes(p.id)}
                    isExcluded={excludedPlayerIds.includes(p.id)}
                    onToggleLock={onToggleLock}
                    onToggleExclude={onToggleExclude}
                    onSelect={onSelectPlayer}
                  />
                ))}
              </div>

              {/* Row 3: Midfielders (Wider Middle Pitch above Halfway Line) */}
              <div className="flex justify-around items-center w-full max-w-[98%] mx-auto my-0 sm:my-0.5">
                {mids.map(p => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    isCaptain={p.isCaptain}
                    isViceCaptain={p.isViceCaptain}
                    isLocked={lockedPlayerIds.includes(p.id)}
                    isExcluded={excludedPlayerIds.includes(p.id)}
                    onToggleLock={onToggleLock}
                    onToggleExclude={onToggleExclude}
                    onSelect={onSelectPlayer}
                  />
                ))}
              </div>

              {/* Row 4: Forwards (Inside the Center Circle & Over Halfway Line) */}
              <div className="flex justify-around items-center w-full max-w-[80%] mx-auto my-0 sm:my-0.5">
                {fwds.map(p => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    isCaptain={p.isCaptain}
                    isViceCaptain={p.isViceCaptain}
                    isLocked={lockedPlayerIds.includes(p.id)}
                    isExcluded={excludedPlayerIds.includes(p.id)}
                    onToggleLock={onToggleLock}
                    onToggleExclude={onToggleExclude}
                    onSelect={onSelectPlayer}
                  />
                ))}
              </div>
            </div>

            {/* 🌿 Smooth Bottom Grass-to-App Background Fade */}
            <div className="absolute inset-x-0 bottom-0 h-20 sm:h-28 bg-gradient-to-b from-transparent via-[#020617]/70 to-[#020617] pointer-events-none z-10" />

            {/* 🪑 Official Substitutes Bench Dugout Shelf */}
            <div className="relative z-20 w-full max-w-[94%] mx-auto mt-0.5 sm:mt-1.5 rounded-xl border border-white/15 bg-[#020617]/50 backdrop-blur-md p-1.5 sm:p-2.5 shadow-2xl">
              <div className="flex justify-around items-end gap-0.5 sm:gap-1.5 px-0.5 sm:px-1">
                {bench.map((p, idx) => {
                  const isGkp = idx === 0 || p.position === 'GKP';
                  const subLabel = isGkp ? 'GKP' : `${idx}. ${p.position || 'SUB'}`;

                  return (
                    <div key={p.id} className="flex flex-col items-center gap-0.5">
                      {/* Official Position / Auto-Sub Priority Header Label */}
                      <div className="text-[8px] sm:text-[9px] font-mono font-extrabold uppercase tracking-wider text-cyan-200 border-b border-dotted border-white/40 pb-0.5 px-0.5">
                        {subLabel}
                      </div>

                      {/* Semi-transparent frosted slot card wrapper */}
                      <div className="bg-white/10 rounded-lg p-0.5 sm:p-1 border border-white/15 shadow-inner">
                        <PlayerCard
                          player={p}
                          compact
                          benchIndex={idx}
                          showFixtures={showFixtures}
                          isCaptain={p.isCaptain}
                          isViceCaptain={p.isViceCaptain}
                          isLocked={lockedPlayerIds.includes(p.id)}
                          isExcluded={excludedPlayerIds.includes(p.id)}
                          onToggleLock={onToggleLock}
                          onToggleExclude={onToggleExclude}
                          onSelect={onSelectPlayer}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Substitutes Header Label */}
              <p className="text-center text-white font-extrabold text-[10px] sm:text-[11px] tracking-wider mt-1 drop-shadow-md">
                Substitutes
              </p>
            </div>

          </div>
        </div>
      ) : (
        /* 📋 Official List View Table Container */
        <div className="w-full max-w-4xl mx-auto space-y-3">
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Starting XI Lineup</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold border border-slate-700">
                  {startingXI.length} Players
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-cyan-400">
                {expectedPoints.toFixed(1)} Total xP
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Pos</th>
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3">Next Fixture</th>
                    <th className="py-2.5 px-3 text-right">Cost</th>
                    <th className="py-2.5 px-3 text-right">Matchday xP</th>
                    <th className="py-2.5 px-3 text-right">Top 1k EO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {startingXI.map(p => (
                    <tr 
                      key={p.id} 
                      onClick={() => onSelectPlayer && onSelectPlayer(p)}
                      className="hover:bg-slate-900/70 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-black uppercase tracking-wider border ${getPosBadgeColor(p.position)}`}>
                          {p.position}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{p.web_name}</span>
                          {p.isCaptain && (
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-black border border-white/70">
                              C
                            </span>
                          )}
                          {Boolean(p.isStartingWeapon) && (
                            <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              SW
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.team_name || p.team_short_name}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs text-slate-300">
                        {p.next_fixtures?.[0] ? `${p.next_fixtures[0].opponent} (${p.next_fixtures[0].is_home ? 'H' : 'A'})` : 'TBD'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-200 font-bold">
                        €{p.cost.toFixed(1)}M
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-cyan-400">
                        {p.isCaptain ? (p.xP * 2).toFixed(1) : p.xP.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-400">
                        {p.eo ?? p.ownership ?? 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
