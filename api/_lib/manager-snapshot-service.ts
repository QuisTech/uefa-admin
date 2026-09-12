import fs from 'fs';
import path from 'path';
import { EliteIntelligenceConfig, EliteConsensusDetail, TopManagerInsight } from './types.js';

export const DEFAULT_INTELLIGENCE_CONFIG: EliteIntelligenceConfig = {
  startWeight: 1.0,
  captainWeight: 0.5,
  benchPenalty: 0.2,
  startingWeaponMinStartRate: 0.50,
  benchEnablerMinBenchRate: 0.50,
  hardLockMinConviction: 1.0,
};

export interface ManagerGWDecisionSnapshot {
  season: string;
  matchday: number;
  manager_id: number;
  manager_name: string;
  team_name: string;
  overall_rank: number;
  total_points: number;
  normalized_total_points?: number;
  chip_deduction?: number;
  is_chip_normalized?: boolean;
  chips_used: Array<{ name: string; time: string; event: number }>;
  active_chip?: string | null;
  squad_15: number[];
  starting_xi: number[];
  captain_id: number | null;
  vice_captain_id: number | null;
  transfers_in: number[];
  transfers_out: number[];
  bank: number;
  team_value: number;
  timestamp: number;
}

export interface EliteCohortArchive {
  season: string;
  matchday: number;
  sample_size: number;
  last_updated: number;
  decisions: ManagerGWDecisionSnapshot[];
}

export class ManagerSnapshotService {
  /**
   * Save snapshot of manager decisions
   */
  public static saveSnapshot(season: string, matchday: number, decisions: ManagerGWDecisionSnapshot[]) {
    const dir = path.resolve(process.cwd(), 'data', 'snapshots', `md_${matchday}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const archivePath = path.join(dir, 'manager_decisions.json');
    const archive: EliteCohortArchive = {
      season,
      matchday,
      sample_size: decisions.length,
      last_updated: Date.now(),
      decisions
    };
    fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2));
    console.log(`[ManagerSnapshotService] Archived ${decisions.length} raw manager decision records to ${archivePath}`);
  }

  /**
   * Load snapshot of manager decisions
   */
  public static loadSnapshot(matchday: number): EliteCohortArchive | null {
    const archivePath = path.resolve(process.cwd(), 'data', 'snapshots', `md_${matchday}`, 'manager_decisions.json');
    if (!fs.existsSync(archivePath)) {
      for (let md = matchday - 1; md >= 1; md--) {
        const fallbackPath = path.resolve(process.cwd(), 'data', 'snapshots', `md_${md}`, 'manager_decisions.json');
        if (fs.existsSync(fallbackPath)) {
          try {
            const raw = fs.readFileSync(fallbackPath, 'utf-8');
            return JSON.parse(raw);
          } catch {
            // ignore
          }
        }
      }
      return null;
    }
    try {
      const raw = fs.readFileSync(archivePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err: any) {
      console.warn(`[ManagerSnapshotService] Failed to load snapshot for MD${matchday}: ${err.message}`);
      return null;
    }
  }

  /**
   * Calculate Chip-Normalized Score for UEFA Fantasy (deducting Wildcard/Limitless anomalies)
   */
  public static calculateNormalizedScore(
    snap: ManagerGWDecisionSnapshot,
    playerPointsMap?: Map<number, number>
  ): { normalizedScore: number; isEligibleForCohort: boolean; chipDeduction: number } {
    if (snap.active_chip === 'limitless' || snap.active_chip === 'wildcard') {
      return { normalizedScore: 0, isEligibleForCohort: false, chipDeduction: 0 };
    }

    let deduction = 0;
    const chips = snap.chips_used || [];

    for (const chip of chips) {
      if (chip.name === '3xc') {
        if (chip.event === snap.matchday && snap.captain_id && playerPointsMap?.has(snap.captain_id)) {
          const capPts = playerPointsMap.get(snap.captain_id) || 0;
          deduction += capPts;
        } else {
          deduction += 12;
        }
      }
    }

    const normalizedScore = Math.max(0, snap.total_points - deduction);
    return { normalizedScore, isEligibleForCohort: true, chipDeduction: deduction };
  }

  public static encodeUefaName(name: string): string {
    return Array.from(name)
      .map(c => c.charCodeAt(0).toString(16).padStart(4, '0'))
      .join('');
  }

  public static buildUefaTeamUrl(guid: string, name: string): string {
    return `https://gaming.uefa.com/en/uclfantasy/team/${guid}/${this.encodeUefaName(name)}/0/0/0/Worldleaderboard?typeId=0031`;
  }

  public static BASE_ELITE_LEADERS = [
    { rank: 0, entry: 532002, guid: "146242f4-adcf-11f1-820b-916aae5300aa", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/146242f4-adcf-11f1-820b-916aae5300aa/006d0069006300680071007500690073/0/0/0/Worldleaderboard?typeId=0031", manager_name: "michquis", team_name: "MichQuis", total_points: 0, normalized_total_points: 0, chip_deduction: 0, chips_used: [], captainId: 250041741, squad: [250016833, 250076574, 250220576, 250041741, 250112880, 250171184, 250176450, 250210649, 250131901, 250136465, 250188006, 250188223, 250088061, 250171278, 250085391] },
    { rank: 1, entry: 88255, guid: "0aba30ba-aa35-11f1-831c-0f22566c6f8d", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/0aba30ba-aa35-11f1-831c-0f22566c6f8d/0050006c006100790065007200380038003200350035/0/0/0/Worldleaderboard?typeId=0031", manager_name: "Player88255", team_name: "biRD", total_points: 162, normalized_total_points: 162, chip_deduction: 0, chips_used: [], captainId: 250171184, squad: [250178823,250088320,250080553,250176450,250075995,250112880,250187689,250143747,250066886,250085391,250171184,250118908,250101444,250127538,250164780] },
    { rank: 2, entry: 88256, guid: "e505e466-aba8-11f1-bdc8-9bb64931f28b", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/e505e466-aba8-11f1-bdc8-9bb64931f28b/0041006e0064007200e90020004600720061006e00e70061/0/0/0/Worldleaderboard?typeId=0031", manager_name: "André França", team_name: "Cafelokos FC", total_points: 157, normalized_total_points: 157, chip_deduction: 0, chips_used: [], captainId: 250112880, squad: [250178823,250079383,250128120,250176450,250127347,250136465,250118908,250112880,250066886,250050319,250171184,250070418,250090766,250088061,250134138] },
    { rank: 3, entry: 88257, guid: "e3dbdda0-9a52-11f1-b0f4-35b542929b50", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/e3dbdda0-9a52-11f1-b0f4-35b542929b50/007300610073006f006a00750072006900630069006e00650063/0/0/0/Worldleaderboard?typeId=0031", manager_name: "sasojuricinec", team_name: "Letos pa te zares! Barca!", total_points: 150, normalized_total_points: 150, chip_deduction: 0, chips_used: [], captainId: 250112880, squad: [250137260,250088320,250016833,250176450,250118908,250104066,250055660,250112880,250210435,250132803,250171184,250070418,250176488,250117036,250064064] },
    { rank: 3, entry: 88258, guid: "4e8c2c5e-ab97-11f1-b3bd-c539f1d6f81e", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/4e8c2c5e-ab97-11f1-b3bd-c539f1d6f81e/00470065006f0020004400650020004c00610020004f00720061006400650061/0/0/0/Worldleaderboard?typeId=0031", manager_name: "Geo De La Oradea", team_name: "JUVENTUS Oradea", total_points: 150, normalized_total_points: 150, chip_deduction: 0, chips_used: [], captainId: 250055294, squad: [250088320,250016833,250176450,250118908,250055294,250112880,250090766,250066886,250132803,250163731,250171184,250118131,250088061,250163777,250156423] },
    { rank: 5, entry: 88259, guid: "7b12b1fa-a5d2-11f1-ab82-91396041c666", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/7b12b1fa-a5d2-11f1-ab82-91396041c666/004f006c0069007600650072/0/0/0/Worldleaderboard?typeId=0031", manager_name: "Oliver", team_name: "Rigged", total_points: 149, normalized_total_points: 149, chip_deduction: 0, chips_used: [], captainId: 250112880, squad: [250078886,250088320,250016833,250128120,250076007,250055294,250081555,250112880,250112998,250132803,250171184,250118131,250096309,250088061,250153874] },
    { rank: 5, entry: 88260, guid: "923c5da2-aa93-11f1-bbf9-ed9bb6db0549", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/923c5da2-aa93-11f1-bbf9-ed9bb6db0549/0041006e0064007200650069002d0043007200690073007400690061006e/0/0/0/Worldleaderboard?typeId=0031", manager_name: "Andrei-Cristian", team_name: "AC ABC", total_points: 149, normalized_total_points: 149, chip_deduction: 0, chips_used: [], captainId: 250055294, squad: [250088320,250016833,250128120,250176450,250118908,250055294,250194673,250110943,250210435,250132803,250171184,250046901,250088061,250101808,250090766] },
    { rank: 5, entry: 88261, guid: "e0d24faa-aad2-11f1-ba16-6557f2c803b2", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/e0d24faa-aad2-11f1-ba16-6557f2c803b2/0052006f006e006e006900650020/0/0/0/Worldleaderboard?typeId=0031", manager_name: "Ronnie ", team_name: "the mbappe special", total_points: 149, normalized_total_points: 149, chip_deduction: 0, chips_used: [], captainId: 250171184, squad: [250069832,250174126,250132803,250079545,250086928,250176450,250112880,250153621,250171184,250066886,250103758,250065792,250136348,250190383,250109003] },
    { rank: 5, entry: 88262, guid: "008d3aba-aaf8-11f1-8519-c15c7fcc77a6", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/008d3aba-aaf8-11f1-8519-c15c7fcc77a6/0046006c006100760069006f/0/0/0/Worldleaderboard?typeId=0031", manager_name: "Flavio", team_name: "Flavio", total_points: 149, normalized_total_points: 149, chip_deduction: 0, chips_used: [], captainId: 250176450, squad: [250137260,250171278,250187727,250088320,250176450,250136465,250055660,250112880,250079545,250066886,250171184,250118908,250176453,50327420,250202036] },
    { rank: 9, entry: 88263, guid: "7d0f0cf8-a661-11f1-8808-978bb38432fe", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/7d0f0cf8-a661-11f1-8808-978bb38432fe/00460061007a0061/0/0/0/Worldleaderboard?typeId=0031", manager_name: "Faza", team_name: "Auf Arena", total_points: 148, normalized_total_points: 148, chip_deduction: 0, chips_used: [], captainId: 250176450, squad: [250088320,250016833,250128120,250176450,250118908,250186227,250112880,250066886,250123068,250163731,250171184,250218560,250117036,250090766,250127538] },
    { rank: 9, entry: 88264, guid: "05a737ee-9a7c-11f1-804c-496ca83e32b5", uefa_url: "https://gaming.uefa.com/en/uclfantasy/team/05a737ee-9a7c-11f1-804c-496ca83e32b5/00520041004d0049004c/0/0/0/Worldleaderboard?typeId=0031", manager_name: "RAMIL", team_name: "R A M İ L A N", total_points: 148, normalized_total_points: 148, chip_deduction: 0, chips_used: [], captainId: 250176450, squad: [250088320,250016833,250176450,250136465,250118908,250194673,250112880,250079545,250132803,250101284,250171184,250218560,250112224,250101238,250197801] }
  ];

  public static loadTop100Leaders() {
    try {
      const p = path.resolve(process.cwd(), 'data', 'har_extracted', 'top100_verified_live_squads.json');
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (e: any) {
      console.warn('[ManagerSnapshotService] Could not load top 100 leaders, falling back:', e.message);
    }
    return null;
  }

  public static getEliteLeaderProfile(identifier: string | number) {
    const pool = this.loadTop100Leaders() || this.BASE_ELITE_LEADERS;
    const strId = String(identifier).trim().toLowerCase();
    const numericId = parseInt(strId, 10);

    return pool.find((l: any) => 
      (l.entry && (l.entry === numericId || String(l.entry) === strId)) || 
      (l.rank && (l.rank === numericId || String(l.rank) === strId)) ||
      (l.manager_name && l.manager_name.toLowerCase() === strId) ||
      (l.team_name && l.team_name.toLowerCase() === strId) ||
      (l.guid && strId.includes(l.guid.toLowerCase())) ||
      (l.uefa_url && strId.includes(l.guid.toLowerCase()))
    ) || null;
  }

  public static async getDynamicTopManagerInsight(
    players: Array<{ id: number; pFName?: string; pDName?: string; web_name?: string; selPer?: number; skill?: number; value?: number }>,
    targetMatchday: number,
    configPartial?: Partial<EliteIntelligenceConfig>
  ): Promise<TopManagerInsight> {
    const config: EliteIntelligenceConfig = {
      ...DEFAULT_INTELLIGENCE_CONFIG,
      ...(configPartial || {})
    };

    let decisions: ManagerGWDecisionSnapshot[] = [];
    const archive = this.loadSnapshot(targetMatchday);
    if (archive && archive.decisions && archive.decisions.length > 0) {
      decisions = archive.decisions;
    }

    // Build player map
    const playerMap = new Map(players.map(p => [Number(p.id), p]));
    const posMap: Record<number, string> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

    const baseEliteLeaders = this.loadTop100Leaders() || this.BASE_ELITE_LEADERS;

    const syncedLeaders = decisions.map((d, i) => ({
      rank: d.overall_rank || i + 1,
      entry: d.manager_id,
      manager_name: d.manager_name,
      team_name: d.team_name,
      total_points: d.total_points,
      normalized_total_points: d.normalized_total_points || d.total_points,
      chip_deduction: d.chip_deduction || 0,
      chips_used: d.chips_used,
      captainId: d.captain_id,
      squad: d.squad_15 || []
    }));

    // Merge synced leaders with baseline elite cohort without duplicating entries
    const syncedEntrySet = new Set(syncedLeaders.map(s => s.entry));
    const sampleLeaders = [...syncedLeaders, ...baseEliteLeaders.filter(b => !syncedEntrySet.has(b.entry))];
    const totalCount = sampleLeaders.length;

    // Tally consensus directly from the verified authentic squads of the elite leaders
    const tallies = new Map<number, {
      squadCount: number;
      startCount: number;
      captainCount: number;
      viceCaptainCount: number;
    }>();

    sampleLeaders.forEach(leader => {
      const squad = leader.squad || [];
      const starters = squad.slice(0, 11);

      squad.forEach((pid: number) => {
        let t = tallies.get(pid);
        if (!t) {
          t = { squadCount: 0, startCount: 0, captainCount: 0, viceCaptainCount: 0 };
          tallies.set(pid, t);
        }
        t.squadCount += 1;
      });

      starters.forEach((pid: number) => {
        const t = tallies.get(pid);
        if (t) t.startCount += 1;
      });

      if (leader.captainId) {
        let t = tallies.get(leader.captainId);
        if (!t) {
          t = { squadCount: 0, startCount: 0, captainCount: 0, viceCaptainCount: 0 };
          tallies.set(leader.captainId, t);
        }
        t.captainCount += 1;
      }
    });

    const consensusDetails: EliteConsensusDetail[] = [];

    tallies.forEach((t, pid) => {
      const p = playerMap.get(pid);
      if (!p) return;

      const benchCount = Math.max(0, t.squadCount - t.startCount);
      const ownershipRate = Math.round((t.squadCount / totalCount) * 1000) / 1000;
      const startRate = Math.round((t.startCount / totalCount) * 1000) / 1000;
      const benchRate = Math.round((benchCount / totalCount) * 1000) / 1000;
      const captainRate = Math.round((t.captainCount / totalCount) * 1000) / 1000;
      const viceCaptainRate = 0;

      const rawConviction = (startRate * config.startWeight) + (captainRate * config.captainWeight) - (benchRate * config.benchPenalty);
      const convictionScore = Math.round(rawConviction * 1000) / 1000;
      const convictionIndex = Math.round(convictionScore * 100);
      const cost = p.value || 5.0;

      // Starting Weapons: Starting rate >= 35%, in starting XI of multiple top managers, cost > 5.5M
      // Bench Enablers: Budget cost (<= 5.5M), ACTUALLY benched by top managers (benchRate >= 2% of cohort)
      const isStartingWeapon = startRate >= 0.35 && cost > 5.5;
      const isBenchEnabler = !isStartingWeapon && cost <= 5.5 && benchRate >= 0.02 && benchCount > 0;
      const qualifiesForHardLock = convictionScore >= config.hardLockMinConviction && startRate >= config.startingWeaponMinStartRate;

      const position = p.skill ? posMap[p.skill] || 'MID' : 'MID';

      consensusDetails.push({
        id: pid,
        web_name: p.pDName || p.pFName || `Player ${pid}`,
        full_name: p.pFName || p.pDName || `Player ${pid}`,
        team_code: (p as any).cCode || (p as any).tName || 'UCL',
        position,
        cost,
        squadCount: t.squadCount,
        startCount: t.startCount,
        benchCount,
        captainCount: t.captainCount,
        viceCaptainCount: t.viceCaptainCount,
        transfersInCount: 0,
        transfersOutCount: 0,
        eligibleManagers: totalCount,
        ownershipRate,
        startRate,
        benchRate,
        captainRate,
        viceCaptainRate,
        transfersInRate: 0,
        transfersOutRate: 0,
        convictionScore,
        convictionIndex,
        isStartingWeapon,
        isBenchEnabler,
        qualifiesForHardLock
      });
    });

    consensusDetails.sort((a, b) => b.convictionScore - a.convictionScore || b.ownershipRate - a.ownershipRate);

    // Algorithmic justification & demarcation for Starting Weapons (Primary 11 Core XI vs Rotation 12+)
    const startingWeapons = consensusDetails.filter(d => d.isStartingWeapon);
    startingWeapons.forEach((weapon, idx) => {
      const xiRank = idx + 1;
      weapon.xiRank = xiRank;
      if (xiRank <= 11) {
        weapon.isPrimaryXIWeapon = true;
        const capReason = weapon.captainRate >= 0.15 ? ` & ${Math.round(weapon.captainRate * 100)}% elite captaincy` : '';
        weapon.xiJustification = `Primary XI Core #${xiRank}: Prioritized in Top 11 Starting XI by conviction score (${Math.round(weapon.startRate * 100)}% elite start rate${capReason}, conviction score: ${weapon.convictionScore}). Chosen above rotation weapons due to superior starting frequency & minimal bench penalty.`;
      } else {
        weapon.isPrimaryXIWeapon = false;
        weapon.xiJustification = `Squad Rotation Weapon #${xiRank}: Qualified as a Starting Weapon, but ranked #${xiRank} in conviction score. Placed in squad rotation behind the Top 11 Core XI due to higher bench rotation risk or positional squad competition.`;
      }
    });

    const eliteConsensusPicks = consensusDetails
      .filter(d => d.isStartingWeapon || d.ownershipRate >= 0.4)
      .slice(0, 10)
      .map(d => d.web_name);


    const pureZeroCount = sampleLeaders.filter(m => (!m.chips_used || m.chips_used.length === 0) && !m.chip_deduction).length;
    const normalizedCount = sampleLeaders.filter(m => m.chip_deduction && m.chip_deduction > 0).length;

    const derivedFallbackPicks = players
      .filter(p => (p.selPer || 0) >= 8.0)
      .sort((a, b) => (b.selPer || 0) - (a.selPer || 0))
      .slice(0, 8)
      .map(p => p.pDName || p.pFName || `Player ${p.id}`);

    // Extract Consensus Captain & Captaincy Distribution across Elite Cohort
    const captainSorted = [...consensusDetails]
      .filter(d => (d.captainRate || 0) > 0 || (d.captainCount || 0) > 0)
      .sort((a, b) => b.captainCount - a.captainCount || b.captainRate - a.captainRate);

    const consensusCaptain = captainSorted[0] ? {
      id: captainSorted[0].id,
      web_name: captainSorted[0].web_name,
      full_name: captainSorted[0].full_name,
      team_code: captainSorted[0].team_code,
      position: captainSorted[0].position,
      cost: captainSorted[0].cost,
      captainRate: captainSorted[0].captainRate,
      captainPercentage: Math.round(captainSorted[0].captainRate * 100),
      captainCount: captainSorted[0].captainCount,
      eligibleManagers: totalCount,
    } : undefined;

    const consensusViceCaptain = captainSorted[1] ? {
      id: captainSorted[1].id,
      web_name: captainSorted[1].web_name,
      full_name: captainSorted[1].full_name,
      team_code: captainSorted[1].team_code,
      position: captainSorted[1].position,
      cost: captainSorted[1].cost,
      captainRate: captainSorted[1].captainRate,
      captainPercentage: Math.round(captainSorted[1].captainRate * 100),
      captainCount: captainSorted[1].captainCount,
      eligibleManagers: totalCount,
    } : undefined;

    const captaincyDistribution = captainSorted.slice(0, 5).map(d => ({
      id: d.id,
      web_name: d.web_name,
      full_name: d.full_name,
      team_code: d.team_code,
      position: d.position,
      cost: d.cost,
      captainRate: d.captainRate,
      captainPercentage: Math.round(d.captainRate * 100),
      captainCount: d.captainCount,
    }));

    return {
      noChipLeaderCount: totalCount,
      eligibleManagers: totalCount,
      pureZeroChipCount: pureZeroCount,
      normalizedChipCount: normalizedCount,
      sampleLeaders,
      marketDisagreementRating: 0.28,
      eliteConsensusPicks: eliteConsensusPicks.length > 0 ? eliteConsensusPicks : (
        derivedFallbackPicks.length > 0 ? derivedFallbackPicks : consensusDetails.slice(0, 8).map(d => d.web_name)
      ),
      consensusDetails,
      consensusCaptain,
      consensusViceCaptain,
      captaincyDistribution
    };
  }
}
