export interface ScoredPlayer {
  id: number;
  pFName: string;
  pDName: string;
  web_name: string;
  first_name: string;
  second_name: string;
  now_cost: number;
  cost: number;
  score: number;
  xP: number;
  horizonXP?: number;
  ppm: number;
  team_name: string;
  team_short_name: string;
  position: string;
  next_fixtures: { event?: number; opponent: string; difficulty: number; is_home?: boolean }[];
  isCaptain: boolean;
  isViceCaptain: boolean;
  position_in_squad?: number;
  eo?: number;
  ownership?: number;
  isStartingWeapon?: boolean;
  isBenchEnabler?: boolean;
  convictionIndex?: number;
  totPts?: number;
  minsPlyd?: number;
  gS?: number;
  assist?: number;
  cS?: number;
  bR?: number;
  mOM?: number;
  gOB?: number;
  pStatus?: string;
  trained?: string;
  cCode?: string;
}

export interface ScenarioComparison {
  quant: {
    name: string;
    expectedPoints: number;
    averageXiEo: number;
    captain: { name: string; team: string; xP: number };
  };
  template: {
    name: string;
    expectedPoints: number;
    averageXiEo: number;
    captain: { name: string; team: string; xP: number };
  };
  delta: {
    xpDiff: number;
    eoDiff: number;
    swaps: Array<{ outPlayer: string; inPlayer: string; position: string; xpDiff: number; eoDiff: number }>;
  };
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
        differentialQuality: string;
        withinThresholdPct: number;
        divergenceTier: string;
        avgSwapCostPerGw: number;
        totalXpSacrificed8GW: number;
        avgEoReduction: number;
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

