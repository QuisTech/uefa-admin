import React, { useState } from 'react';
import { RecommendationResponse, ScoredPlayer } from '../types';
import { Zap, Shield, Eye, EyeOff, Layout, List, Lock, Ban, X, ArrowRightLeft } from 'lucide-react';

interface PitchViewProps {
  data: RecommendationResponse | null;
  onSelectPlayer: (player: ScoredPlayer) => void;
  scenario: 'quant' | 'template';
  setScenario: (sc: 'quant' | 'template') => void;
  lockedPlayerIds?: number[];
  excludedPlayerIds?: number[];
  onToggleLock?: (id: number) => void;
  onToggleExclude?: (id: number) => void;
}

const getFdrBadgeColor = (difficulty?: number) => {
  switch (difficulty) {
    case 1:
    case 2:
      return "bg-emerald-400 text-slate-950 font-black";
    case 3:
      return "bg-slate-700 text-slate-200 font-bold";
    case 4:
      return "bg-rose-600 text-white font-black";
    case 5:
      return "bg-rose-900 text-white font-black";
    default:
      return "bg-slate-800 text-slate-400";
  }
};

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

export interface TeamKit {
  primary: string;
  secondary: string;
  sleeve: string;
  pattern?: 'stripes' | 'sleeves' | 'chest' | 'solid';
  textColor: string;
}

export const getTeamKit = (teamCode: string = '', isGkp: boolean = false): TeamKit => {
  if (isGkp) {
    return {
      primary: '#00e676', // Neon GKP Emerald Green
      secondary: '#00a152',
      sleeve: '#00e676',
      pattern: 'solid',
      textColor: '#020617'
    };
  }

  const code = (teamCode || '').toUpperCase().trim();

  switch (code) {
    case 'RMA': // Real Madrid - All White with Gold
      return { primary: '#ffffff', secondary: '#e2b13c', sleeve: '#ffffff', pattern: 'solid', textColor: '#0f172a' };
    case 'MCI': // Man City - Sky Blue
      return { primary: '#6cabdd', secondary: '#1c2d5a', sleeve: '#6cabdd', pattern: 'solid', textColor: '#ffffff' };
    case 'BAY': // Bayern Munich - Red
      return { primary: '#dc052d', secondary: '#ffffff', sleeve: '#dc052d', pattern: 'solid', textColor: '#ffffff' };
    case 'BAR': // Barcelona - Blaugrana Stripes
      return { primary: '#004d98', secondary: '#a50044', sleeve: '#004d98', pattern: 'stripes', textColor: '#ffffff' };
    case 'ARS': // Arsenal - Red body, White sleeves
      return { primary: '#ef0107', secondary: '#ffffff', sleeve: '#ffffff', pattern: 'sleeves', textColor: '#ffffff' };
    case 'PSG': // Paris Saint-Germain - Navy with Red stripe
      return { primary: '#002342', secondary: '#da291c', sleeve: '#002342', pattern: 'chest', textColor: '#ffffff' };
    case 'INT': // Inter Milan - Nerazzurri Black & Blue
      return { primary: '#000000', secondary: '#0053a0', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'LIV': // Liverpool - Crimson Red
      return { primary: '#c8102e', secondary: '#f6eb61', sleeve: '#c8102e', pattern: 'solid', textColor: '#ffffff' };
    case 'BVB': // Dortmund - Yellow & Black
      return { primary: '#fde100', secondary: '#000000', sleeve: '#fde100', pattern: 'solid', textColor: '#000000' };
    case 'LEV': // Bayer Leverkusen - Red body, Black sleeves
      return { primary: '#e32219', secondary: '#000000', sleeve: '#000000', pattern: 'sleeves', textColor: '#ffffff' };
    case 'ATM': // Atletico Madrid - Red & White Stripes
      return { primary: '#cb3524', secondary: '#ffffff', sleeve: '#cb3524', pattern: 'stripes', textColor: '#ffffff' };
    case 'PSV': // PSV Eindhoven - Red & White Stripes
      return { primary: '#ee1c25', secondary: '#ffffff', sleeve: '#ee1c25', pattern: 'stripes', textColor: '#ffffff' };
    case 'AVL': // Aston Villa - Claret body, Sky sleeves
      return { primary: '#670e36', secondary: '#95bfe6', sleeve: '#95bfe6', pattern: 'sleeves', textColor: '#ffffff' };
    case 'RBL': // RB Leipzig - White body, Red shoulders
      return { primary: '#ffffff', secondary: '#dd0741', sleeve: '#dd0741', pattern: 'sleeves', textColor: '#0f172a' };
    case 'JUV': // Juventus - Black & White Stripes
      return { primary: '#000000', secondary: '#ffffff', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'MIL': // AC Milan - Red & Black Stripes
      return { primary: '#fb090b', secondary: '#000000', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'ATA': // Atalanta - Blue & Black Stripes
      return { primary: '#1e71b8', secondary: '#000000', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'BEN': // Benfica - Red
      return { primary: '#e30613', secondary: '#ffffff', sleeve: '#e30613', pattern: 'solid', textColor: '#ffffff' };
    case 'SCP': // Sporting CP - Green & White Stripes
      return { primary: '#008057', secondary: '#ffffff', sleeve: '#008057', pattern: 'stripes', textColor: '#ffffff' };
    case 'CEL': // Celtic - Green & White Hoops
      return { primary: '#008542', secondary: '#ffffff', sleeve: '#008542', pattern: 'stripes', textColor: '#ffffff' };
    default:
      return { primary: '#00e5ff', secondary: '#002342', sleeve: '#00e5ff', pattern: 'solid', textColor: '#0f172a' };
  }
};

const JerseySVG: React.FC<{ kit: TeamKit; size?: number }> = ({ kit, size = 42 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg filter shrink-0">
      {/* Short Sleeves Left & Right */}
      <path d="M 15 25 L 30 18 L 35 38 L 22 45 Z" fill={kit.sleeve} stroke="#000000" strokeWidth="2" />
      <path d="M 85 25 L 70 18 L 65 38 L 78 45 Z" fill={kit.sleeve} stroke="#000000" strokeWidth="2" />

      {/* Main Jersey Body */}
      <path d="M 30 18 L 70 18 L 75 82 C 75 85, 25 85, 25 82 Z" fill={kit.primary} stroke="#000000" strokeWidth="2.5" />

      {/* Vertical Stripe Pattern */}
      {kit.pattern === 'stripes' && (
        <g stroke="#000000" strokeWidth="1.2">
          <rect x="42" y="19" width="7" height="63" fill={kit.secondary} />
          <rect x="55" y="19" width="7" height="63" fill={kit.secondary} />
          <rect x="68" y="21" width="5" height="60" fill={kit.secondary} />
          <rect x="29" y="21" width="5" height="60" fill={kit.secondary} />
        </g>
      )}

      {/* Central Chest Stripe Pattern */}
      {kit.pattern === 'chest' && (
        <rect x="44" y="19" width="12" height="63" fill={kit.secondary} stroke="#000000" strokeWidth="1.2" />
      )}

      {/* Collar Accent */}
      <path d="M 38 18 C 45 28, 55 28, 62 18 Z" fill="#000000" />
      <path d="M 40 18 C 46 25, 54 25, 60 18 Z" fill="#ffffff" />
    </svg>
  );
};

export const PitchView: React.FC<PitchViewProps> = ({
  data,
  onSelectPlayer,
  scenario,
  setScenario,
  lockedPlayerIds = [],
  excludedPlayerIds = [],
  onToggleLock,
  onToggleExclude
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
      {/* 🌟 Scenario Switcher & Delta Comparison Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
        {/* Left: Scenario Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setScenario('quant')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
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
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
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

      {/* 📊 UEFA Matchday & Squad Diagnostics Stats Ribbon */}
      <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-md shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-[9.5px] sm:text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Matchday {data?.nextEventId || 1}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white truncate">
              {scenario === 'template' ? 'Risky Template Shield XI' : 'Quant Optimal Lineup'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 text-[9px] font-mono">
            <span className="bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[7.5px] font-black border border-white/60">C</span>
              {captain}
            </span>
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
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-slate-950/70 border border-slate-800/90 rounded-xl backdrop-blur-sm">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider mr-1">Active Rules:</span>
          {lockedPlayerIds.map(id => {
            const p = allPlayersMap.get(id);
            return (
              <span key={`lock-${id}`} className="inline-flex items-center gap-1 bg-amber-400/15 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded text-[9px] font-bold">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>{p?.web_name || `ID ${id}`}</span>
                {onToggleLock && (
                  <button onClick={() => onToggleLock(id)} className="hover:text-white ml-0.5">
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
                  <button onClick={() => onToggleExclude(id)} className="hover:text-white ml-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* 🎛️ Pitch / List View Mode & Formation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 max-w-4xl mx-auto w-full">
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === 'pitch'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3 h-3" />
              <span>3D Pitch</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3 h-3" />
              <span>List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🏟️ View Mode Content: Authentic 3D Stadium Pitch or List View */}
      {viewMode === 'pitch' ? (
        /* 🌟 Authentic Football 3D Pitch Container */
        <div className="relative mx-auto w-full max-w-3xl py-1">
          <div className="relative rounded-3xl shadow-2xl border-2 border-slate-800 bg-[#1ed0b0] p-2 sm:p-4 overflow-hidden">
            
            {/* 🌿 Mown Grass Turf & Perspective Diagram Underlay */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              {/* Grass Horizontal Lawn Stripes */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `repeating-linear-gradient(
                    to bottom,
                    #1ed0b0,
                    #1ed0b0 40px,
                    #17b89b 40px,
                    #17b89b 80px
                  )`
                }}
              />

              {/* 🏟️ Authentic Perspective Pitch Diagram SVG */}
              <svg 
                className="absolute inset-0 w-full h-full stroke-white/80 fill-none" 
                preserveAspectRatio="none" 
                viewBox="0 0 800 680"
              >
                {/* Stadium Outer Flanks */}
                <polygon points="-10,-10 105,-10 105,4 0,227 -10,227 -10,-10" className="fill-[#020617] stroke-[#020617]" strokeWidth="2" />
                <polygon points="810,-10 695,-10 695,4 800,227 810,227 810,-10" className="fill-[#020617] stroke-[#020617]" strokeWidth="2" />
                <polygon points="105,-10 695,-10 695,4 105,4" className="fill-[#020617] stroke-[#020617]" strokeWidth="2" />

                {/* Outer Touchlines */}
                <line x1="105" y1="4" x2="0" y2="227" strokeWidth="2" className="stroke-white/70" />
                <line x1="695" y1="4" x2="800" y2="227" strokeWidth="2" className="stroke-white/70" />
                <line x1="105" y1="4" x2="695" y2="4" strokeWidth="2" className="stroke-white/70" />

                {/* Left UEFA Champions League Billboard */}
                <rect x="125" y="4" width="215" height="20" rx="4" className="fill-[#001438] stroke-none" />
                <g transform="translate(145, 7)">
                  <circle cx="8" cy="8" r="6" fill="#00e5ff" />
                  <text x="20" y="11" fill="#00e5ff" fontSize="11" fontWeight="900" fontFamily="sans-serif">UEFA CHAMPIONS LEAGUE</text>
                </g>

                {/* Top Goal Net Frame */}
                <rect x="340" y="4" width="120" height="20" className="fill-cyan-500/25 stroke-white" strokeWidth="2" />
                <line x1="364" y1="4" x2="364" y2="24" strokeWidth="1" className="stroke-white/50" />
                <line x1="388" y1="4" x2="388" y2="24" strokeWidth="1" className="stroke-white/50" />
                <line x1="412" y1="4" x2="412" y2="24" strokeWidth="1" className="stroke-white/50" />
                <line x1="436" y1="4" x2="436" y2="24" strokeWidth="1" className="stroke-white/50" />

                {/* Right UEFA Billboard */}
                <rect x="460" y="4" width="215" height="20" rx="4" className="fill-[#001438] stroke-none" />
                <g transform="translate(485, 7)">
                  <circle cx="8" cy="8" r="6" fill="#00e5ff" />
                  <text x="20" y="11" fill="#00e5ff" fontSize="11" fontWeight="900" fontFamily="sans-serif">FANTASY HORIZON</text>
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
                <path d="M 117,46 A 24,24 0 0,0 149,24" strokeWidth="2.2" />
                <path d="M 651,24 A 24,24 0 0,0 683,46" strokeWidth="2.2" />

                {/* Halfway Line */}
                <line x1="0" y1="450" x2="800" y2="450" strokeWidth="3.5" />
                
                {/* Center Circle */}
                <ellipse cx="400" cy="450" rx="160" ry="85" strokeWidth="2.8" />
                <circle cx="400" cy="450" r="4.5" className="fill-white" stroke="none" />
              </svg>
            </div>

            {/* Floating FDR Ticker Toggle */}
            <div className="absolute top-3 right-3 z-30">
              <button
                onClick={() => setShowFixtures(!showFixtures)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md transition-all shadow-lg select-none ${
                  showFixtures 
                    ? "bg-slate-950/80 border-cyan-400/50 text-cyan-300" 
                    : "bg-slate-950/50 border-white/20 text-slate-400"
                }`}
              >
                {showFixtures ? (
                  <>
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>3-Match FDR: On</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    <span>3-Match FDR: Off</span>
                  </>
                )}
              </button>
            </div>

            {/* 🏟️ Starting XI 4 Tactical Rows */}
            <div className="relative z-10 flex flex-col justify-between min-h-[420px] sm:min-h-[480px] pt-5 pb-2">
              
              {/* Row 1: Goalkeeper (Inside Goalmouth Box) */}
              <div className="flex justify-center items-center w-full my-1">
                {gkps.map(p => (
                  <PitchPlayerNode
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    onClick={() => onSelectPlayer(p)}
                  />
                ))}
              </div>

              {/* Row 2: Defenders */}
              <div className="flex justify-around items-center w-full max-w-[90%] mx-auto my-1">
                {defs.map(p => (
                  <PitchPlayerNode
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    onClick={() => onSelectPlayer(p)}
                  />
                ))}
              </div>

              {/* Row 3: Midfielders */}
              <div className="flex justify-around items-center w-full max-w-[98%] mx-auto my-1">
                {mids.map(p => (
                  <PitchPlayerNode
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    onClick={() => onSelectPlayer(p)}
                  />
                ))}
              </div>

              {/* Row 4: Forwards */}
              <div className="flex justify-around items-center w-full max-w-[82%] mx-auto my-1">
                {fwds.map(p => (
                  <PitchPlayerNode
                    key={p.id}
                    player={p}
                    showFixtures={showFixtures}
                    onClick={() => onSelectPlayer(p)}
                  />
                ))}
              </div>
            </div>

            {/* 🌿 Bottom Fade */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-[#020617]/70 to-[#020617] pointer-events-none z-10" />

            {/* 🪑 Official Substitutes Bench Dugout Shelf */}
            <div className="relative z-20 w-full max-w-[95%] mx-auto mt-2 rounded-2xl border border-white/15 bg-slate-950/60 backdrop-blur-md p-2 shadow-2xl">
              <div className="flex justify-around items-end gap-1.5 px-1">
                {bench.map((p, idx) => (
                  <div key={p.id} className="flex flex-col items-center gap-0.5">
                    <div className="text-[8px] font-mono font-extrabold uppercase tracking-wider text-cyan-300 border-b border-dotted border-white/30 pb-0.5 px-1">
                      {idx === 0 ? 'GKP' : `SUB ${idx}`}
                    </div>
                    <div className="bg-white/10 rounded-xl p-1 border border-white/15 shadow-inner">
                      <PitchPlayerNode
                        player={p}
                        compact
                        showFixtures={showFixtures}
                        onClick={() => onSelectPlayer(p)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-white font-extrabold text-[10px] tracking-wider mt-1 drop-shadow-md">
                Substitutes Dugout
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
                  11 Players
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
                      onClick={() => onSelectPlayer(p)}
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
                          {p.isStartingWeapon && (
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

interface PitchPlayerNodeProps {
  player: ScoredPlayer;
  compact?: boolean;
  showFixtures?: boolean;
  onClick: () => void;
}

const PitchPlayerNode: React.FC<PitchPlayerNodeProps> = ({ player, compact = false, showFixtures = false, onClick }) => {
  const nextFix = player.next_fixtures?.[0];
  const isGkp = player.position === 'GKP';
  const kit = getTeamKit(player.team_short_name || player.team_name, isGkp);

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer flex flex-col items-center transition-all duration-300 hover:scale-105 shrink-0 ${compact ? 'max-w-[70px]' : 'max-w-[95px]'}`}
    >
      {/* Captain / Vice Captain Badge */}
      {player.isCaptain && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 text-[8.5px] font-black rounded-full bg-amber-400 text-slate-950 shadow border border-amber-200 whitespace-nowrap">
          CAPTAIN (2x)
        </span>
      )}

      {/* Starting Weapon Badge */}
      {player.isStartingWeapon && !player.isCaptain && (
        <span className="absolute -top-3 right-0 z-20 px-1 py-0.2 text-[8px] font-black rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border border-amber-300 shadow">
          SW
        </span>
      )}

      {/* Official Vector Jersey Kit Container */}
      <div className={`relative flex items-center justify-center transition-all ${compact ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14'}`}>
        <JerseySVG kit={kit} size={compact ? 36 : 46} />
        
        {/* xP overlay badge on the jersey */}
        <span className="absolute inset-0 flex items-center justify-center pt-1 text-[11px] sm:text-xs font-black font-mono drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)]" style={{ color: kit.textColor }}>
          {player.xP.toFixed(1)}
        </span>
      </div>

      {/* Nameplate Card */}
      <div className="mt-1 px-1.5 py-0.5 rounded-lg bg-slate-950/95 border border-slate-800 text-center w-full shadow-md">
        <div className="text-[10px] sm:text-[11px] font-bold text-white truncate">{player.web_name}</div>
        <div className="text-[8.5px] text-slate-400 flex items-center justify-center gap-1 font-mono">
          <span>€{player.cost.toFixed(1)}M</span>
          <span>•</span>
          <span className="text-cyan-300 font-bold">{player.eo ?? player.ownership ?? 0}%</span>
        </div>

        {/* Optional 3-Match FDR Ticker */}
        {showFixtures && nextFix && !compact && (
          <div className="mt-0.5 pt-0.5 border-t border-slate-800/80 flex items-center justify-center gap-1">
            <span className="text-[8px] font-mono text-slate-300 truncate">
              {nextFix.opponent} ({nextFix.is_home ? 'H' : 'A'})
            </span>
            <span className={`text-[7.5px] font-mono px-1 py-0.2 rounded ${getFdrBadgeColor(nextFix.difficulty)}`}>
              {nextFix.difficulty}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
