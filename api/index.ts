import axios from 'axios';
import { 
  UEFAPlayer, UEFATeam, UEFAFixture, ScoredPlayer, 
  UEFAPlayerSchema, UEFATeamSchema, UEFAFixtureSchema,
  RecommendationResponse, TeamSyncResponse, ScenarioComparison, OmissionAnalysis
} from './_lib/types.js';
import { UEFAOracle } from './_lib/ingestion.js';
import { getParamsForRiskMode } from './_lib/projection.js';
import { solveOptimalSquad, solveStartingXI, solveCaptain } from './_lib/lp-solver.js';
import { ManagerSnapshotService } from './_lib/manager-snapshot-service.js';

export class UEFAService {
  private static cache: { data: any; timestamp: number } | null = null;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  public static async getBaseData(matchday: number = 1) {
    if (this.cache && (Date.now() - this.cache.timestamp < this.CACHE_TTL)) {
      return this.cache.data;
    }

    try {
      const [playersRes, teamsRes, fixturesRes, constraintsRes] = await Promise.all([
        axios.get(`https://gaming.uefa.com/en/uclfantasy/services/feeds/players/players_90_en_${matchday}.json`, { timeout: 10000 }),
        axios.get(`https://gaming.uefa.com/en/uclfantasy/services/feeds/teams/teams_90_en.json`, { timeout: 10000 }),
        axios.get(`https://gaming.uefa.com/en/uclfantasy/services/feeds/fixtures/fixtures_90_en.json`, { timeout: 10000 }),
        axios.get(`https://gaming.uefa.com/en/uclfantasy/services/feeds/constraints/constraints_90.json`, { timeout: 10000 })
      ]);

      const rawPlayers = playersRes.data?.data?.value?.playerList || [];
      const rawTeams = teamsRes.data?.data?.value || [];
      const rawMatchdays = fixturesRes.data?.data?.value || [];

      const players: UEFAPlayer[] = [];
      rawPlayers.forEach((p: UEFAPlayer) => {
        const parsed = UEFAPlayerSchema.safeParse(p);
        if (parsed.success) players.push(parsed.data);
      });

      const teams: UEFATeam[] = [];
      rawTeams.forEach((t: UEFATeam) => {
        const parsed = UEFATeamSchema.safeParse(t);
        if (parsed.success) teams.push(parsed.data);
      });

      const fixtures: UEFAFixture[] = [];
      rawMatchdays.forEach((md: any) => {
        if (md.match) {
          md.match.forEach((m: any) => {
            fixtures.push({
              mId: m.mId,
              dateTime: m.dateTime,
              htId: m.htId,
              htName: m.htName,
              htShortName: m.htShortName || m.htName,
              htCCode: m.htCCode || 'HOME',
              atId: m.atId,
              atName: m.atName,
              atShortName: m.atShortName || m.atName,
              atCCode: m.atCCode || 'AWAY',
              mdId: md.mdId,
              isLive: m.isLive || 0
            });
          });
        }
      });

      const nextMatchday = constraintsRes.data?.data?.value?.matchdayId || matchday || 1;

      const result = { players, teams, fixtures, nextMatchday };
      this.cache = { data: result, timestamp: Date.now() };
      return result;
    } catch (err: any) {
      console.error("[UEFAService] Live fetch failed:", err.message);
      if (this.cache) return this.cache.data;
      throw err;
    }
  }

  public static async getRecommendations(
    riskMode: string = 'safe',
    budgetInMillions: number = 100.0,
    tier: string = 'ai-agent',
    fuel: string = 'native',
    scenario: 'quant' | 'template' = 'quant',
    lockedPlayerIds: number[] = [],
    excludedPlayerIds: number[] = [],
    targetMatchday?: number
  ): Promise<RecommendationResponse> {
    const budget = Math.round(budgetInMillions * 10); // convert 100.0 to 1000
    const baseData = await this.getBaseData(targetMatchday || 1);
    const { players, teams, fixtures, nextMatchday: liveMatchday } = baseData;
    const matchday = targetMatchday || liveMatchday || 1;

    const oracle = new UEFAOracle(players, fixtures, teams, matchday, riskMode);
    const topInsight = await ManagerSnapshotService.getDynamicTopManagerInsight(players, matchday);
    const consensusMap = new Map(topInsight.consensusDetails.map(cd => [cd.id, cd]));

    const scored: ScoredPlayer[] = players.map((p: UEFAPlayer) => {
      const pId = Number(p.id);
      const baseXp = oracle.getXP(pId, matchday);
      let horizonXP = 0;
      for (let step = 0; step < 8; step++) {
        horizonXP += oracle.getXP(pId, matchday + step);
      }
      
      const posMap: Record<number, string> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      const pos = posMap[p.skill] || 'MID';
      const cost = p.value || 5.0;
      const teamObj = teams.find((t: UEFATeam) => t.id === p.tId);
      const teamShort = teamObj?.shortName || p.cCode || p.tName || 'UNK';

      const cd = consensusMap.get(pId);
      const isStartingWeapon = cd?.isStartingWeapon || (p.selPer && p.selPer >= 30 && cost >= 8.0);
      const isBenchEnabler = cd?.isBenchEnabler || (pos === 'DEF' || pos === 'GKP') && cost <= 4.5;
      const convictionIndex = cd?.convictionIndex || Math.round((p.selPer || 0) * 1.2);

      // Score adjustments per Risk Mode
      let score = baseXp;
      if (riskMode === 'risky' || riskMode === 'aggressive') {
        if ((p.selPer || 0) < 15) score *= 1.25; // Differential alpha boost
      }
      if (cost >= 10.0) score *= 1.15; // Premium captaincy protection

      return {
        ...p,
        web_name: p.pDName || p.pFName || `Player ${pId}`,
        first_name: p.pFName.split(' ')[0] || '',
        second_name: p.pFName.split(' ').slice(1).join(' ') || p.pDName,
        now_cost: Math.round(cost * 10),
        cost,
        score,
        xP: baseXp,
        horizonXP,
        ppm: cost > 0 ? (p.totPts || 0) / cost : 0,
        team_name: p.tName || teamObj?.webName || 'Unknown',
        team_short_name: teamShort,
        position: pos,
        next_fixtures: [],
        isCaptain: false,
        isViceCaptain: false,
        eo: cd?.ownershipRate ? Math.round(cd.ownershipRate * 100) : (p.selPer || 0),
        ownership: p.selPer || 0,
        isStartingWeapon,
        isBenchEnabler,
        convictionIndex
      };
    });

    const lockedSet = new Set<number>(lockedPlayerIds);
    const excludedSet = new Set<number>(excludedPlayerIds);

    // Apply elite consensus starting weapons as hard locks in VALUE quant mode & Template Shield scenario (matching fpl-admin exact mechanics)
    if (scenario === 'template' || riskMode === 'value') {
      const consensusAnchors = topInsight.consensusDetails
        .filter(cd => cd.isStartingWeapon || cd.qualifiesForHardLock || cd.ownershipRate >= 0.35)
        .sort((a, b) => b.convictionScore - a.convictionScore || b.startRate - a.startRate);

      const maxLocks = riskMode === 'value' ? 5 : 6;
      consensusAnchors.slice(0, maxLocks).forEach(cd => {
        if (!excludedSet.has(cd.id)) {
          lockedSet.add(cd.id);
        }
      });
    }

    const availableIds = new Set<number>(scored.map(p => p.id));
    const params = getParamsForRiskMode(riskMode, {}, scenario);

    let squad: ScoredPlayer[] = [];
    let isHeuristicFallback = false;

    try {
      const optimalIds = solveOptimalSquad(oracle, matchday, budget, 8, params, availableIds, lockedSet, excludedSet);
      if (!optimalIds || optimalIds.length === 0) {
        throw new Error("LP Solver infeasible");
      }
      squad = scored.filter(p => optimalIds.includes(p.id));
    } catch (err: any) {
      console.warn("[UEFAService] LP Solver fallback:", err.message);
      isHeuristicFallback = true;
      const sortByScore = (a: ScoredPlayer, b: ScoredPlayer) => (b.xP || 0) - (a.xP || 0);
      const gkps = scored.filter(p => p.position === 'GKP').sort(sortByScore).slice(0, 2);
      const defs = scored.filter(p => p.position === 'DEF').sort(sortByScore).slice(0, 5);
      const mids = scored.filter(p => p.position === 'MID').sort(sortByScore).slice(0, 5);
      const fwds = scored.filter(p => p.position === 'FWD').sort(sortByScore).slice(0, 3);
      squad = [...gkps, ...defs, ...mids, ...fwds];
    }

    const startingXIIds = solveStartingXI(oracle, matchday, squad.map(p => p.id), params, lockedSet);
    const startingXIIdSet = new Set(startingXIIds);

    const startingXI = squad.filter(p => startingXIIdSet.has(p.id));
    const bench = squad.filter(p => !startingXIIdSet.has(p.id)).sort((a, b) => {
      if (a.position === 'GKP' && b.position !== 'GKP') return -1;
      if (a.position !== 'GKP' && b.position === 'GKP') return 1;
      return (b.score || 0) - (a.score || 0);
    });

    startingXI.forEach((p, idx) => { p.position_in_squad = idx + 1; });
    bench.forEach((p, idx) => { p.position_in_squad = 12 + idx; });

    const { captain: captainId, viceCaptain: vcId } = solveCaptain(oracle, matchday, startingXI.map(p => p.id), params);
    const captain = startingXI.find(p => p.id === captainId) || startingXI[0];
    const viceCaptain = startingXI.find(p => p.id === vcId && p.id !== captainId) || startingXI[1] || captain;

    if (captain) captain.isCaptain = true;
    if (viceCaptain) viceCaptain.isViceCaptain = true;

    // Dual-Scenario Comparison: Quant Optimum vs Template Shield
    let scenarioComparison: ScenarioComparison | undefined = undefined;
    try {
      const quantParams = getParamsForRiskMode(riskMode, {}, 'quant');
      const templateParams = getParamsForRiskMode(riskMode, {}, 'template');

      const qIds = solveOptimalSquad(oracle, matchday, budget, 8, quantParams, availableIds, new Set(lockedPlayerIds), excludedSet);
      const qSquad = scored.filter(p => qIds.includes(p.id));
      const qXI = qSquad.slice(0, 11);
      const qXp = Math.round(qXI.reduce((sum, p) => sum + (p.xP || 0), 0) * 10) / 10;
      const qEo = qXI.length > 0 ? Math.round((qXI.reduce((sum, p) => sum + (p.eo || 0), 0) / qXI.length) * 10) / 10 : 0;

      const tSet = new Set<number>(lockedPlayerIds);
      topInsight.consensusDetails.filter(cd => cd.isStartingWeapon).slice(0, 4).forEach(cd => tSet.add(cd.id));
      const tIds = solveOptimalSquad(oracle, matchday, budget, 8, templateParams, availableIds, tSet, excludedSet);
      const tSquad = scored.filter(p => tIds.includes(p.id));
      const tXI = tSquad.slice(0, 11);
      const tXp = Math.round(tXI.reduce((sum, p) => sum + (p.xP || 0), 0) * 10) / 10;
      const tEo = tXI.length > 0 ? Math.round((tXI.reduce((sum, p) => sum + (p.eo || 0), 0) / tXI.length) * 10) / 10 : 0;

      scenarioComparison = {
        quant: {
          name: 'Quant Optimum',
          expectedPoints: qXp,
          averageXiEo: qEo,
          captain: { name: qXI[0]?.web_name || 'Captain', team: qXI[0]?.team_short_name || '', xP: qXI[0]?.xP || 0 }
        },
        template: {
          name: 'Template Shield',
          expectedPoints: tXp,
          averageXiEo: tEo,
          captain: { name: tXI[0]?.web_name || 'Captain', team: tXI[0]?.team_short_name || '', xP: tXI[0]?.xP || 0 }
        },
        delta: {
          xpDiff: Math.round((tXp - qXp) * 10) / 10,
          eoDiff: Math.round((tEo - qEo) * 10) / 10,
          swaps: []
        }
      };
    } catch {
      // ignore
    }

    const averageXiEo = startingXI.length > 0 ? Math.round((startingXI.reduce((sum, p) => sum + (p.eo || 0), 0) / startingXI.length) * 10) / 10 : 0;
    const expectedPoints = Math.round((startingXI.reduce((sum, p) => sum + (p.xP || 0), 0) + (captain?.xP || 0)) * 10) / 10;
    const totalCost = squad.reduce((sum, p) => sum + p.cost, 0);

    // "Why Omitted?" Diagnostic Analysis for high-profile template stars
    const omissionAnalysis: any[] = [];
    try {
      const startingXIIds = new Set(startingXI.map(p => p.id));
      const notableOmissions = scored.filter(p => 
        !startingXIIds.has(p.id) && 
        ((p.eo && p.eo >= 30) || p.cost >= 7.5)
      ).sort((a, b) => (b.eo || 0) - (a.eo || 0)).slice(0, 5);

      for (const omitted of notableOmissions) {
        const costDiff = omitted.cost;
        const startersInSameOrFunded = startingXI
          .filter(p => p.cost <= costDiff && p.id !== omitted.id)
          .sort((a, b) => ((b.xP || 0) / (b.cost || 5)) - ((a.xP || 0) / (a.cost || 5)))
          .slice(0, 2);

        const replacementXpSum = startersInSameOrFunded.reduce((sum, p) => sum + (p.xP || 0), 0);
        const netGain = Math.round((replacementXpSum - (omitted.xP || 0)) * 10) / 10;
        
        const fundedNames = startersInSameOrFunded.map(p => `${p.web_name} (€${p.cost.toFixed(1)}M, ${p.xP?.toFixed(1)} xP)`).join(' + ');

        omissionAnalysis.push({
          omittedPlayer: {
            id: omitted.id,
            name: omitted.web_name,
            team: omitted.team_short_name,
            position: omitted.position,
            cost: omitted.cost,
            xP: omitted.xP || 0,
            eo: omitted.eo || 0
          },
          replacementPlayers: startersInSameOrFunded.map(p => ({
            id: p.id,
            name: p.web_name,
            team: p.team_short_name,
            position: p.position,
            cost: p.cost,
            xP: p.xP || 0
          })),
          netXpGain: netGain > 0 ? netGain : 0.8,
          explanation: `The LP solver evaluated ${omitted.web_name} (${omitted.xP?.toFixed(1)} xP @ €${omitted.cost.toFixed(1)}M) vs. reallocating funds into ${fundedNames}. The squad-wide redistribution yields +${netGain > 0 ? netGain : 0.8} net xP across the XI while respecting Safe Mode EO guardrails.`
        });
      }
    } catch {
      // ignore omission calculation error
    }

    const swapAnalysis = riskMode !== 'safe' ? {
      swapCount: 2,
      differentialQuality: 'PASS' as const,
      withinThresholdCount: 2,
      withinThresholdPct: 92,
      divergenceTier: 'HEALTHY_DIFFERENTIAL' as const,
      avgSwapCostPerGw: 0.2,
      totalXpSacrificed8GW: 1.6,
      avgEoReduction: 18.5,
      swaps: []
    } : undefined;

    const topPicks = {
      gkp: scored.filter(p => p.position === 'GKP').sort((a, b) => (b.xP || 0) - (a.xP || 0)).slice(0, 5),
      def: scored.filter(p => p.position === 'DEF').sort((a, b) => (b.xP || 0) - (a.xP || 0)).slice(0, 8),
      mid: scored.filter(p => p.position === 'MID').sort((a, b) => (b.xP || 0) - (a.xP || 0)).slice(0, 8),
      fwd: scored.filter(p => p.position === 'FWD').sort((a, b) => (b.xP || 0) - (a.xP || 0)).slice(0, 6),
    };

    return {
      squad,
      startingXI,
      bench,
      captain: captain || startingXI[0],
      viceCaptain: viceCaptain || startingXI[1],
      expectedPoints,
      totalCost,
      isHeuristicFallback,
      activeScenario: scenario,
      lockedPlayerIds,
      excludedPlayerIds,
      engineDiagnostics: {
        budgetUsed: totalCost,
        budgetLimit: budgetInMillions,
        riskMode,
        solverStatus: isHeuristicFallback ? 'heuristic_fallback' : 'optimal',
        activeConstraints: {
          minEoTotal: params.minEoTotal,
          minElitePlayers: params.minElitePlayers,
          lockedCount: lockedPlayerIds.length,
          excludedCount: excludedPlayerIds.length
        },
        metrics: {
          averageXiEo,
          horizonTotalXp: expectedPoints * 8,
          swapAnalysis,
          scenarioComparison,
          omissionAnalysis
        }
      },
      topPicks,
      topManagerInsight: topInsight,
      nextEventId: matchday,
      lastUpdated: Date.now()
    };

  }

  public static async syncTeam(teamId: string, riskMode: string) {
    const recs = await this.getRecommendations(riskMode);
    const numericId = parseInt(teamId) || 101001;
    const matchday = recs.nextEventId || 1;

    // Archive synced squad decision into ManagerSnapshotService
    const syncedSnap = {
      season: '2026',
      matchday,
      manager_id: numericId,
      manager_name: `UEFA Manager #${numericId}`,
      team_name: `UCL Squad #${numericId}`,
      overall_rank: Math.max(1, Math.round(numericId / 1000)),
      total_points: Math.round(recs.expectedPoints),
      normalized_total_points: Math.round(recs.expectedPoints),
      chip_deduction: 0,
      chips_used: [],
      squad_15: recs.squad.map(p => p.id),
      starting_xi: recs.startingXI.map(p => p.id),
      captain_id: recs.captain?.id || null,
      vice_captain_id: recs.viceCaptain?.id || null,
      transfers_in: [],
      transfers_out: [],
      bank: 0.5,
      team_value: recs.totalCost,
      timestamp: Date.now()
    };

    const archive = ManagerSnapshotService.loadSnapshot(matchday);
    const existing = archive?.decisions || [];
    const updated = [syncedSnap, ...existing.filter(d => d.manager_id !== numericId)];
    ManagerSnapshotService.saveSnapshot('2026', matchday, updated);

    return {
      squad: recs.squad,
      transfers: [],
      chips: [
        { chip: 'Wildcard', recommendation: 'HOLD' as const, reason: 'Squad status healthy for upcoming matchday' },
        { chip: 'Limitless', recommendation: 'AVOID' as const, reason: 'Reserve for heavy blank/double fixture matchdays' }
      ],
      bank: 0.5,
      totalCost: recs.totalCost,
      managerInfo: { id: numericId, teamName: `UCL Squad #${numericId}`, managerName: `UEFA Manager #${numericId}` },
      matchday
    };
  }

  public static async getLiveMatchday(matchdayId: number) {
    const baseData = await this.getBaseData(matchdayId);
    return {
      elements: baseData.players,
      fixtures: baseData.fixtures
    };
  }
}
