import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const solver = require("javascript-lp-solver");

import { XPOracle } from "./ingestion.js";
import { UtilityParameters, getParamsForRiskMode } from "./projection.js";

const DEFAULT_PARAMETERS = getParamsForRiskMode('safe');

interface LPSolverModel {
  optimize: string;
  opType: "max" | "min";
  constraints: Record<string, { max?: number; min?: number; equal?: number }>;
  variables: Record<string, Record<string, number>>;
  ints: Record<string, 1>;
  options?: {
    timeout?: number;
    tolerance?: number;
  };
}

function calculateUtility(xp: number, variance: number, eo: number, params: UtilityParameters, id: number): number {
  const varPenalty = params.betaVariance * Math.sqrt(variance);
  const eoReward = (params.betaEO * eo) / 100;
  return xp + varPenalty + eoReward;
}

function getPlayerScore(oracle: XPOracle, matchday: number, id: number, horizon: number, params: UtilityParameters): number {
  let xp = 0;
  let varSum = 0;
  for (let i = 0; i < horizon; i++) {
    xp += oracle.getXP(id, matchday + i);
    varSum += oracle.getVariance(id, matchday + i);
  }
  const eo = oracle.getTop1kEO?.(id) ?? 0;
  return calculateUtility(xp, varSum, eo, params, id);
}

function getRawXP(oracle: XPOracle, matchday: number, id: number, horizon: number): number {
  let xp = 0;
  for (let i = 0; i < horizon; i++) {
    xp += oracle.getXP(id, matchday + i);
  }
  return xp;
}

export function solveOptimalSquad(
  oracle: XPOracle, 
  matchday: number, 
  budget: number, // in 10s (e.g. 1000 for 100.0m)
  horizon: number = 8, 
  params: UtilityParameters = DEFAULT_PARAMETERS,
  availableIds?: Set<number>,
  lockedIds?: Set<number>,
  excludedIds?: Set<number>
): number[] {
  // If exactly 15 squad players are locked (e.g. from syncing a manager squad), return immediately
  if (lockedIds && lockedIds.size >= 15) {
    return Array.from(lockedIds).slice(0, 15);
  }

  const allIds = oracle.getAllPlayerIds();
  let actualBudget = params.budgetMultiplier ? Math.floor(budget * params.budgetMultiplier) : budget;
  
  if (lockedIds && lockedIds.size > 0) {
    const lockedCost = Array.from(lockedIds).reduce((sum, id) => sum + oracle.getCost(id), 0);
    const remainingSlots = Math.max(0, 15 - lockedIds.size);
    const minRequired = lockedCost + remainingSlots * 40;
    if (minRequired > actualBudget) {
      actualBudget = minRequired;
    }
  }

  const model: LPSolverModel = {
    optimize: "score",
    opType: "max",
    constraints: { 
      cost: { max: actualBudget }, 
      total: { equal: 15 }, 
      gkp: { equal: 2 }, 
      def: { equal: 5 }, 
      mid: { equal: 5 }, 
      fwd: { equal: 3 },
      total_cap: { max: 1 }
    },
    variables: {},
    ints: {},
    options: {
      timeout: 3000,
      tolerance: 0.02
    }
  };

  if (params.minEoTotal && (!lockedIds || lockedIds.size < 5)) {
    model.constraints['eo_total'] = { min: params.minEoTotal };
  }
  if (params.minElitePlayers && (!lockedIds || lockedIds.size < 5)) {
    model.constraints['elite_total'] = { min: params.minElitePlayers };
  }

  // Pre-calculate candidates to prune variables for maximum solver speed
  const candidates: Array<{
    id: number;
    pos: string;
    team: string;
    score: number;
    rawXP: number;
    cost: number;
    capScore: number;
    isLocked: boolean;
  }> = [];

  allIds.forEach(id => {
    if (availableIds && !availableIds.has(id)) return;
    if (excludedIds && excludedIds.has(id)) return;

    const isLocked = !!(lockedIds && lockedIds.has(id));
    const score = getPlayerScore(oracle, matchday, id, horizon, params);
    const rawXP = getRawXP(oracle, matchday, id, horizon);
    const cost = oracle.getCost(id);
    const capScore = getPlayerScore(oracle, matchday, id, 1, params);
    const pos = oracle.getPosition(id).toLowerCase();
    const team = oracle.getTeam(id);

    if (rawXP > 0 || cost <= 45 || isLocked) {
      candidates.push({ id, pos, team, score, rawXP, cost, capScore, isLocked });
    }
  });

  // Keep top candidates per position + best value budget enablers + all locked
  const posLimit: Record<string, number> = { gkp: 15, def: 25, mid: 25, fwd: 20 };
  const filteredCandidates: typeof candidates = [];

  (['gkp', 'def', 'mid', 'fwd'] as const).forEach(pos => {
    const posList = candidates.filter(c => c.pos === pos);
    const sortedByVFM = [...posList].sort((a, b) => (b.score / (b.cost / 10)) - (a.score / (a.cost / 10)));
    const sortedByScore = [...posList].sort((a, b) => b.score - a.score);
    const sortedByCost = [...posList].sort((a, b) => a.cost - b.cost);

    const limit = posLimit[pos] || 25;
    const selectedIds = new Set<number>();

    sortedByScore.slice(0, limit).forEach(c => selectedIds.add(c.id));
    sortedByVFM.slice(0, limit).forEach(c => selectedIds.add(c.id));
    sortedByCost.slice(0, 8).forEach(c => selectedIds.add(c.id));
    posList.filter(c => c.isLocked).forEach(c => selectedIds.add(c.id));

    posList.forEach(c => {
      if (selectedIds.has(c.id)) {
        filteredCandidates.push(c);
      }
    });
  });

  // Top captain contenders (top 8 highest scoring attackers)
  const topCaptainIds = new Set(
    filteredCandidates
      .filter(c => (c.capScore >= 3.5 && (c.pos === 'mid' || c.pos === 'fwd')) || c.isLocked)
      .sort((a, b) => b.capScore - a.capScore)
      .slice(0, 8)
      .map(c => c.id)
  );

  const enableDiversification = params.enableDefensiveDiversification !== false;
  const maxStandardDef = params.maxStandardDefendersPerTeam ?? 1;
  const maxEliteDef = params.maxEliteDefendersPerTeam ?? 2;
  const elitePercentile = params.eliteDefensePercentile ?? 0.80;
  const eliteDefensiveTeams = oracle.getEliteDefensiveTeams?.(elitePercentile) ?? new Set<string>();

  filteredCandidates.forEach(c => {
    const v = `p_${c.id}`;
    const capVar = `c_${c.id}`;

    if (!model.constraints[`team_${c.team}`]) {
      model.constraints[`team_${c.team}`] = { max: 3 }; // Max 3 per club during League Phase
    }

    if (enableDiversification && c.pos === 'def') {
      const defKey = `def_team_${c.team}`;
      if (!model.constraints[defKey]) {
        const lockedDefCount = filteredCandidates.filter(cand => cand.isLocked && cand.pos === 'def' && cand.team === c.team).length;
        const baseAllowed = eliteDefensiveTeams.has(c.team) ? maxEliteDef : maxStandardDef;
        const maxAllowed = Math.max(baseAllowed, lockedDefCount);
        model.constraints[defKey] = { max: maxAllowed };
      }
    }

    const hasCapOption = topCaptainIds.has(c.id);

    model.variables[v] = { 
      score: c.score, 
      cost: c.cost, 
      total: 1, 
      [c.pos]: 1, 
      [`team_${c.team}`]: 1, 
      [v]: 1
    };

    if (enableDiversification && c.pos === 'def') {
      model.variables[v][`def_team_${c.team}`] = 1;
    }

    if (hasCapOption) {
      model.variables[v][`cap_link_${c.id}`] = -1;
      model.constraints[`cap_link_${c.id}`] = { max: 0 };
    }

    if (params.minEoTotal) {
      model.variables[v]['eo_total'] = oracle.getTop1kEO?.(c.id) ?? 0;
    }
    if (params.minElitePlayers) {
      model.variables[v]['elite_total'] = c.cost >= 100 ? 1 : 0;
    }

    model.constraints[v] = c.isLocked ? { equal: 1 } : { max: 1 };
    model.ints[v] = 1;

    if (hasCapOption && c.capScore > 0) {
      const horizonCaptainBonus = Math.round(c.capScore * (1 + (horizon - 1) * 0.70) * 10) / 10;
      model.variables[capVar] = {
        score: horizonCaptainBonus,
        total_cap: 1,
        [`cap_link_${c.id}`]: 1,
        [capVar]: 1
      };
      model.constraints[capVar] = { max: 1 };
      model.ints[capVar] = 1;
    }
  });

  const solution = solver.Solve(model) as Record<string, any>;
  
  if (!solution || !solution.feasible) {
    return []; 
  }
  
  const squadIds: number[] = [];
  for (const key in solution) {
    if (key.startsWith('p_')) {
      const val = solution[key];
      if (val === true || val === 1 || (typeof val === 'number' && val > 0.5)) {
        squadIds.push(parseInt(key.replace('p_', ''), 10));
      }
    }
  }

  return squadIds;
}

export function solveStartingXI(
  oracle: XPOracle,
  matchday: number,
  squadIds: number[],
  params: UtilityParameters = DEFAULT_PARAMETERS,
  lockedIds?: Set<number>
): number[] {
  const scored = squadIds.map(id => {
    const rawPos = (oracle.getPosition(id) || 'MID').toUpperCase();
    const pos = rawPos === 'GK' ? 'GKP' : rawPos;
    const isLocked = !!(lockedIds && lockedIds.has(id));
    const rawScore = getPlayerScore(oracle, matchday, id, 1, params);
    // Give locked players a priority boost in selection only if a subset of the squad is locked
    const score = rawScore + (isLocked && lockedIds && lockedIds.size < 11 ? 1000 : 0);
    return { id, pos, isLocked, score, rawScore };
  });

  const gkps = scored.filter(p => p.pos === 'GKP').sort((a, b) => b.score - a.score);
  const defs = scored.filter(p => p.pos === 'DEF').sort((a, b) => b.score - a.score);
  const mids = scored.filter(p => p.pos === 'MID').sort((a, b) => b.score - a.score);
  const fwds = scored.filter(p => p.pos === 'FWD').sort((a, b) => b.score - a.score);

  if (gkps.length === 0) return squadIds.slice(0, 11);

  const bestGkp = gkps[0];

  // Legal UEFA Champions League Fantasy Formations (1 GKP + 10 outfield players = 11 starters)
  const legalFormations = [
    { d: 3, m: 5, f: 2 },
    { d: 3, m: 4, f: 3 },
    { d: 4, m: 4, f: 2 },
    { d: 4, m: 3, f: 3 },
    { d: 4, m: 5, f: 1 },
    { d: 5, m: 3, f: 2 },
    { d: 5, m: 4, f: 1 },
    { d: 5, m: 2, f: 3 }
  ];

  let bestStarters: number[] = [];
  let bestScore = -Infinity;

  for (const { d, m, f } of legalFormations) {
    if (defs.length >= d && mids.length >= m && fwds.length >= f) {
      const selectedDefs = defs.slice(0, d);
      const selectedMids = mids.slice(0, m);
      const selectedFwds = fwds.slice(0, f);
      const formationScore = bestGkp.score +
        selectedDefs.reduce((s, p) => s + p.score, 0) +
        selectedMids.reduce((s, p) => s + p.score, 0) +
        selectedFwds.reduce((s, p) => s + p.score, 0);

      if (formationScore > bestScore) {
        bestScore = formationScore;
        bestStarters = [
          bestGkp.id,
          ...selectedDefs.map(p => p.id),
          ...selectedMids.map(p => p.id),
          ...selectedFwds.map(p => p.id)
        ];
      }
    }
  }

  if (bestStarters.length === 11) {
    return bestStarters;
  }

  // Fallback guaranteeing exactly 11 players
  return [bestGkp.id, ...defs.slice(0, 4).map(p => p.id), ...mids.slice(0, 4).map(p => p.id), ...fwds.slice(0, 2).map(p => p.id)].slice(0, 11);
}

export function solveCaptain(
  oracle: XPOracle,
  matchday: number,
  xiIds: number[],
  params: UtilityParameters = DEFAULT_PARAMETERS
): { captain: number; viceCaptain: number } {
  if (xiIds.length === 0) return { captain: 0, viceCaptain: 0 };
  
  const getCaptainScore = (id: number) => {
    const dist = oracle.getDistribution(id, matchday);
    const eo = oracle.getTop1kEO?.(id) ?? 0;
    const pos = oracle.getPosition(id);
    const posMultiplier = (pos === 'FWD' || pos === 'MID') ? 1.25 : 1.0;
    
    const targetTail = params.betaVariance > 0 ? (dist.tails[15] || 0) : (dist.tails[8] || 0);
    const tailWeight = Math.abs(params.betaVariance) * 10; 
    const skewReward = params.betaVariance > 0 ? ((dist.skewness || 0) * 0.5) : 0;

    return (dist.mean + (tailWeight * targetTail) + skewReward + (params.betaEO * eo / 100)) * posMultiplier;
  };

  const playersWithScores = xiIds.map(id => ({
    id,
    score: getCaptainScore(id)
  }));
  
  playersWithScores.sort((a, b) => b.score - a.score);
  const captain = playersWithScores[0];
  
  const vcCandidates = xiIds
    .filter(id => id !== captain.id)
    .map(id => ({ id, score: getCaptainScore(id) }));

  vcCandidates.sort((a, b) => b.score - a.score);
  const viceCaptain = vcCandidates[0] ? vcCandidates[0].id : captain.id;

  return { captain: captain.id, viceCaptain };
}
