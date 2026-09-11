import axios from 'axios';
import { UEFAPlayer, UEFATeam, UEFAFixture, PlayerDistribution } from './types.js';
import { ProjectionEngine, getParamsForRiskMode } from './projection.js';

export interface XPOracle {
  getXP(playerId: number, matchday: number): number;
  getVariance(playerId: number, matchday: number): number;
  getDistribution(playerId: number, matchday: number): PlayerDistribution;
  getPosition(playerId: number): string;
  getCost(playerId: number): number;
  getTeam(playerId: number): string;
  getAllPlayerIds(): number[];
  getTop1kEO?(playerId: number): number;
  getTop1kOwnership?(playerId: number): number;
  getEliteDefensiveTeams?(percentile?: number): Set<string>;
  playerNames: Record<number, string>;
}

export class UEFAOracle implements XPOracle {
  protected xpMatrix: Record<number, Record<number, number>> = {};
  protected distributionMatrix: Record<number, Record<number, PlayerDistribution>> = {};
  public playerNames: Record<number, string> = {};
  protected playerPositions: Record<number, string> = {};
  protected playerCosts: Record<number, number> = {};
  protected playerTeams: Record<number, string> = {};
  protected teamDefenseRatings: Record<string, number> = {};
  protected allIds: number[] = [];
  protected top1kData: Record<number, { ownership: number; eo: number }> = {};

  protected projectionEngine: ProjectionEngine;
  protected nextEventId: number;

  constructor(
    players: UEFAPlayer[] = [],
    fixtures: UEFAFixture[] = [],
    teams: UEFATeam[] = [],
    nextMatchday: number = 1,
    riskMode: string = 'safe'
  ) {
    this.nextEventId = nextMatchday;
    const params = getParamsForRiskMode(riskMode);
    this.projectionEngine = new ProjectionEngine(params);
    
    this.populateMetadataAndFeatures(players, fixtures, teams, nextMatchday);
  }

  private populateMetadataAndFeatures(
    players: UEFAPlayer[],
    fixtures: UEFAFixture[],
    teams: UEFATeam[],
    nextMatchday: number
  ) {
    const teamMap = new Map<number, UEFATeam>();
    teams.forEach(t => {
      teamMap.set(t.id, t);
      const isElite = /pot 1|real madrid|man city|bayern|inter|arsenal|barcelona|paris/i.test((t.htPtName || t.webName || t.offName || '').toString());
      const key = String(t.shortName || t.cCode || t.webName || `TEAM_${t.id}`);
      this.teamDefenseRatings[key] = isElite ? 9 : 5;
    });

    players.forEach(p => {
      const pId = Number(p.id);
      const posMap: Record<number, string> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      const pos = posMap[p.skill] || 'MID';
      const cost = p.value || 5.0;
      const teamObj = teamMap.get(p.tId);
      const teamShort = teamObj?.shortName || p.cCode || p.tName || `TEAM_${p.tId}`;

      this.playerNames[pId] = p.pDName || p.pFName || `Player ${pId}`;
      this.playerPositions[pId] = pos;
      this.playerCosts[pId] = Math.round(cost * 10); // cost in 10s (e.g. 11.0 -> 110)
      this.playerTeams[pId] = teamShort;
      this.allIds.push(pId);

      const selPct = p.selPer || 0;
      this.top1kData[pId] = {
        ownership: selPct,
        eo: Math.min(200, Math.round(selPct * 1.3))
      };

      // Compute base expected points (xP) per matchday
      this.xpMatrix[pId] = {};
      
      const mins = p.minsPlyd || 0;
      const totPts = p.totPts || 0;
      const gs = p.gS || 0;
      const assist = p.assist || 0;
      const cs = p.cS || 0;
      const bR = p.bR || 0; // Ball recoveries
      const mOM = p.mOM || 0; // Player of the Match awards
      const gOB = p.gOB || 0; // Outside box goals

      const isInjured = (p.pStatus && p.pStatus !== '') || (p.trained && /out|injured|suspended/i.test(p.trained));
      const appearanceProb = isInjured ? 0.0 : (mins > 0 ? 0.90 : (cost >= 5.0 ? 0.85 : 0.40));

      // Calculate underlying per-90 rates
      const matchCount = Math.max(1, nextMatchday - 1);
      const expMins = appearanceProb * 80;
      const appPts = expMins >= 60 ? 2 : (expMins > 0 ? 1 : 0);

      const goalPts = pos === 'FWD' ? 4 : (pos === 'MID' ? 5 : 6);
      const csPts = (pos === 'DEF' || pos === 'GKP') ? 4 : (pos === 'MID' ? 1 : 0);

      // Positional prior baseline adjusted by price
      const priceScale = cost / 7.0;
      const priorGoals = (pos === 'FWD' ? 0.45 : pos === 'MID' ? 0.22 : pos === 'DEF' ? 0.05 : 0.0) * priceScale;
      const priorAssists = (pos === 'MID' ? 0.22 : pos === 'FWD' ? 0.15 : pos === 'DEF' ? 0.08 : 0.0) * priceScale;
      const priorCS = (pos === 'DEF' || pos === 'GKP') ? 0.40 : (pos === 'MID' ? 0.20 : 0.0);
      const priorBR = (pos === 'DEF' ? 5.5 : pos === 'MID' ? 4.5 : 2.0); // Ball recoveries prior

      const expGoals = (gs > 0 ? (gs / matchCount) * 0.5 + priorGoals * 0.5 : priorGoals) * goalPts;
      const expAssists = (assist > 0 ? (assist / matchCount) * 0.5 + priorAssists * 0.5 : priorAssists) * 3;
      const expCS = (cs > 0 ? (cs / matchCount) * 0.5 + priorCS * 0.5 : priorCS) * csPts;
      const expBR = Math.floor((bR > 0 ? (bR / matchCount) * 0.5 + priorBR * 0.5 : priorBR) / 3); // 3 recoveries = +1 pt
      const expPOTM = (mOM > 0 ? (mOM / matchCount) * 0.3 : 0.05) * 3; // +3 pts for POTM
      const expGOB = (gOB > 0 ? (gOB / matchCount) * 0.2 : 0.02) * 1; // +1 pt for outside box goal

      const rawBaseXp = (appPts + expGoals + expAssists + expCS + expBR + expPOTM + expGOB) * appearanceProb;
      const finalXp = Math.min(20.0, Math.max(0, Math.round(rawBaseXp * 10) / 10));

      for (let step = 0; step < 15; step++) {
        const md = nextMatchday + step;
        this.xpMatrix[pId][md] = finalXp;
      }
    });
  }

  getXP(playerId: number, matchday: number): number {
    return this.xpMatrix[playerId]?.[matchday] ?? 0;
  }

  getVariance(playerId: number, matchday: number): number {
    const xp = this.getXP(playerId, matchday);
    return Math.max(0.5, xp * 0.45);
  }

  getDistribution(playerId: number, matchday: number): PlayerDistribution {
    if (!this.distributionMatrix[playerId]) this.distributionMatrix[playerId] = {};
    if (!this.distributionMatrix[playerId][matchday]) {
      const xp = this.getXP(playerId, matchday);
      const variance = this.getVariance(playerId, matchday);
      this.distributionMatrix[playerId][matchday] = {
        mean: xp,
        variance,
        skewness: 0.35,
        p50: xp,
        p75: Math.round((xp + 1.2) * 10) / 10,
        p90: Math.round((xp + 2.5) * 10) / 10,
        p95: Math.round((xp + 3.8) * 10) / 10,
        tails: { 8: xp >= 6 ? 0.30 : 0.10, 15: xp >= 9 ? 0.15 : 0.03 },
        histogram: { 2: 0.3, 6: 0.5, 10: 0.2 }
      };
    }
    return this.distributionMatrix[playerId][matchday];
  }

  getPosition(playerId: number): string {
    return this.playerPositions[playerId] || 'MID';
  }

  getCost(playerId: number): number {
    return this.playerCosts[playerId] || 50;
  }

  getTeam(playerId: number): string {
    return this.playerTeams[playerId] || 'UNK';
  }

  getAllPlayerIds(): number[] {
    return this.allIds;
  }

  getTop1kEO(playerId: number): number {
    return this.top1kData[playerId]?.eo ?? 0;
  }

  getTop1kOwnership(playerId: number): number {
    return this.top1kData[playerId]?.ownership ?? 0;
  }

  getEliteDefensiveTeams(percentile: number = 0.80): Set<string> {
    const entries = Object.entries(this.teamDefenseRatings);
    if (entries.length === 0) return new Set();
    const scores = entries.map(([_, score]) => score).sort((a, b) => b - a);
    const cutoffIndex = Math.min(scores.length - 1, Math.max(0, Math.floor(scores.length * (1 - percentile)) - 1));
    const threshold = scores[cutoffIndex] ?? 8;
    const eliteSet = new Set<string>();
    entries.forEach(([team, score]) => {
      if (score >= threshold) eliteSet.add(team);
    });
    return eliteSet;
  }
}
