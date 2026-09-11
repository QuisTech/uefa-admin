import { z } from 'zod';

export const UEFAPlayerSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  pFName: z.string().default(''),
  pDName: z.string().default(''),
  latinName: z.string().optional().default(''),
  tId: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  tName: z.string().default(''),
  cCode: z.string().default(''),
  skill: z.number().default(3), // 1: GKP, 2: DEF, 3: MID, 4: FWD
  value: z.number().default(5.0), // Cost in Millions (e.g. 11.0, 4.5)
  totPts: z.number().nullish().default(0),
  minsPlyd: z.number().nullish().default(0),
  gS: z.number().nullish().default(0),
  assist: z.number().nullish().default(0),
  cS: z.number().nullish().default(0),
  gC: z.number().nullish().default(0),
  yC: z.number().nullish().default(0),
  rC: z.number().nullish().default(0),
  oG: z.number().nullish().default(0),
  pS: z.number().nullish().default(0),
  pM: z.number().nullish().default(0),
  bR: z.number().nullish().default(0), // Ball Recoveries (3 recoveries = +1 pt)
  gOB: z.number().nullish().default(0), // Goals outside box (+1 pt)
  mOM: z.number().nullish().default(0), // Player of the Match awards (+3 pts)
  mOMPts: z.number().nullish().default(0),
  pStatus: z.string().nullish().default(''),
  qStatus: z.string().nullish().default(''),
  trained: z.string().nullish().default(''),
  selPer: z.number().nullish().default(0), // Selection percentage
  mTransferIn: z.number().nullish().default(0),
  mTransferOut: z.number().nullish().default(0),
}).passthrough();

export const UEFATeamSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  webName: z.string().default(''),
  offName: z.string().default(''),
  shortName: z.string().default(''),
  countryCode: z.string().nullish().default(''),
  htPtName: z.string().nullish().default(''), // e.g. Pot 1, Pot 2
}).passthrough();

export const UEFAFixtureSchema = z.object({
  mId: z.number(),
  dateTime: z.string(),
  htId: z.number(),
  htName: z.string(),
  htShortName: z.string(),
  htCCode: z.string(),
  atId: z.number(),
  atName: z.string(),
  atShortName: z.string(),
  atCCode: z.string(),
  mdId: z.number(),
  isLive: z.number().default(0),
});

export type UEFAPlayer = z.infer<typeof UEFAPlayerSchema>;
export type UEFATeam = z.infer<typeof UEFATeamSchema>;
export type UEFAFixture = z.infer<typeof UEFAFixtureSchema>;

export interface ScoredPlayer extends UEFAPlayer {
  web_name: string;
  first_name: string;
  second_name: string;
  now_cost: number; // cost * 10 or value * 10 for budget logic (e.g. 110 for 11.0m)
  cost: number; // value in millions (e.g. 11.0)
  score: number;
  xP: number;
  horizonXP?: number;
  ppm: number;
  team_name: string;
  team_short_name: string;
  position: string; // GKP, DEF, MID, FWD
  next_fixtures: { event?: number; opponent: string; difficulty: number; is_home?: boolean }[];
  isCaptain: boolean;
  isViceCaptain: boolean;
  position_in_squad?: number;
  multiplier?: number;
  eo?: number;
  ownership?: number;
  isStartingWeapon?: boolean;
  isBenchEnabler?: boolean;
  convictionIndex?: number;
}

export interface OmissionAnalysis {
  omittedPlayer: {
    id: number;
    name: string;
    team: string;
    position: string;
    cost: number;
    eo: number;
    xP: number;
  };
  replacementPlayers: Array<{
    id: number;
    name: string;
    team: string;
    position: string;
    cost: number;
    xP: number;
  }>;
  netXpGain: number;
  explanation: string;
}

export interface ScenarioComparison {
  quant: {
    name: string;
    expectedPoints: number;
    averageXiEo: number;
    captain: {
      name: string;
      team: string;
      xP: number;
    };
    topPicksSummary?: string;
  };
  template: {
    name: string;
    expectedPoints: number;
    averageXiEo: number;
    captain: {
      name: string;
      team: string;
      xP: number;
    };
    topPicksSummary?: string;
  };
  delta: {
    xpDiff: number;
    eoDiff: number;
    swaps: Array<{
      outPlayer: string;
      inPlayer: string;
      position: string;
      xpDiff: number;
      eoDiff: number;
    }>;
  };
}

export interface EliteIntelligenceConfig {
  startWeight: number;
  captainWeight: number;
  benchPenalty: number;
  startingWeaponMinStartRate: number;
  benchEnablerMinBenchRate: number;
  hardLockMinConviction: number;
}

export interface EliteConsensusDetail {
  id: number;
  web_name: string;
  position: string;
  cost: number;
  squadCount: number;
  startCount: number;
  benchCount: number;
  captainCount: number;
  viceCaptainCount: number;
  transfersInCount: number;
  transfersOutCount: number;
  eligibleManagers: number;
  ownershipRate: number;
  startRate: number;
  benchRate: number;
  captainRate: number;
  viceCaptainRate: number;
  transfersInRate: number;
  transfersOutRate: number;
  convictionScore: number;
  convictionIndex: number;
  isStartingWeapon: boolean;
  isBenchEnabler: boolean;
  qualifiesForHardLock: boolean;
  isPrimaryXIWeapon?: boolean;
  xiRank?: number;
  xiJustification?: string;
}

export interface TopManagerInsight {
  noChipLeaderCount: number;
  eligibleManagers: number;
  pureZeroChipCount?: number;
  normalizedChipCount?: number;
  sampleLeaders: Array<{
    rank: number;
    entry: number;
    manager_name: string;
    team_name: string;
    total_points: number;
    normalized_total_points?: number;
    chip_deduction?: number;
    is_chip_normalized?: boolean;
    chips_used?: Array<{ name: string; time: string; event: number }>;
  }>;
  marketDisagreementRating: number;
  eliteConsensusPicks: string[];
  consensusDetails: EliteConsensusDetail[];
}

export interface RecommendationResponse {
  squad: ScoredPlayer[];
  startingXI: ScoredPlayer[];
  bench: ScoredPlayer[];
  captain: ScoredPlayer;
  viceCaptain: ScoredPlayer;
  expectedPoints: number;
  totalCost: number;
  isHeuristicFallback?: boolean;
  activeScenario?: 'quant' | 'template';
  lockedPlayerIds?: number[];
  excludedPlayerIds?: number[];
  engineDiagnostics?: {
    budgetUsed: number;
    budgetLimit: number;
    riskMode: string;
    solverStatus: 'optimal' | 'heuristic_fallback';
    activeConstraints: {
      minEoTotal?: number;
      minElitePlayers?: number;
      lockedCount?: number;
      excludedCount?: number;
    };
    metrics?: {
      averageXiEo: number;
      horizonTotalXp: number;
      swapAnalysis?: {
        swapCount: number;
        divergenceTier: 'LOW_DIVERGENCE_WARNING' | 'HEALTHY_DIFFERENTIAL' | 'HIGH_DIVERGENCE_WARNING';
        totalXpSacrificed8GW: number;
        avgSwapCostPerGw: number;
        avgEoReduction: number;
        withinThresholdCount: number;
        withinThresholdPct: number;
        differentialQuality: 'PASS' | 'WARNING';
        swaps: Array<{
          outPlayer: string;
          inPlayer: string;
          position: string;
          xpSacrifice8GW: number;
          xpSacrificePerGw: number;
          eoReduction: number;
        }>;
      };
      scenarioComparison?: ScenarioComparison;
      omissionAnalysis?: OmissionAnalysis[];
    };
  };
  topPicks: {
    gkp: ScoredPlayer[];
    def: ScoredPlayer[];
    mid: ScoredPlayer[];
    fwd: ScoredPlayer[];
  };
  topManagerInsight?: TopManagerInsight;
  nextEventId: number;
  lastUpdated: number;
}

export interface TransferRecommendation {
  out: ScoredPlayer;
  in: ScoredPlayer;
  localTransferSignal: number;
  xPDelta: number;
  strategicScore?: number;
  horizon8GwXpIn?: number;
  horizon8GwXpOut?: number;
  horizon8GwDelta?: number;
  squad8GwXpBefore?: number;
  squad8GwXpAfter?: number;
}

export interface ChipAdvice {
  chip: string;
  recommendation: 'STRONG BUY' | 'HOLD' | 'AVOID';
  reason: string;
}

export interface PlayerDistribution {
  mean: number;
  variance: number;
  skewness: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  tails: Record<number, number>;
  histogram: Record<number, number>;
}

export interface ManagerInfo {
  id: number;
  teamName: string;
  managerName: string;
  summary_overall_rank?: number;
  summary_overall_points?: number;
  summary_event_points?: number;
  summary_event_rank?: number;
}

export interface TeamSyncResponse {
  squad: ScoredPlayer[];
  transfers: TransferRecommendation[];
  chips: ChipAdvice[];
  bank?: number;
  totalCost?: number;
  managerInfo?: ManagerInfo | null;
  matchday?: number;
}
