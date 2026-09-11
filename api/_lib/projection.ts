import { PlayerDistribution } from './types.js';

export interface UtilityParameters {
  betaEO: number;
  betaVariance: number;
  budgetMultiplier?: number;
  minEoTotal?: number;
  minElitePlayers?: number;
  enableDefensiveDiversification?: boolean;
  maxStandardDefendersPerTeam?: number;
  maxEliteDefendersPerTeam?: number;
  eliteDefensePercentile?: number;
}

export function getParamsForRiskMode(
  riskMode: string, 
  baseWeights: Record<string, any> = {}, 
  scenario: 'quant' | 'template' = 'quant'
): UtilityParameters {
  const isTemplate = scenario === 'template';

  switch (riskMode.toLowerCase()) {
    case 'safe':
      return {
        betaEO: isTemplate ? 1.2 : 0.8,
        betaVariance: -0.5,
        budgetMultiplier: 1.0,
        minEoTotal: isTemplate ? 300 : 250,
        minElitePlayers: isTemplate ? 2 : 1,
        enableDefensiveDiversification: true,
        maxStandardDefendersPerTeam: 1,
        maxEliteDefendersPerTeam: 2,
        eliteDefensePercentile: 0.80
      };
    case 'risky':
    case 'aggressive':
      return {
        betaEO: -0.4,
        betaVariance: 0.7,
        budgetMultiplier: 1.0,
        minEoTotal: 0,
        minElitePlayers: 0,
        enableDefensiveDiversification: true,
        maxStandardDefendersPerTeam: 1,
        maxEliteDefendersPerTeam: 2,
        eliteDefensePercentile: 0.80
      };
    case 'value':
      return {
        betaEO: 0.1,
        betaVariance: 0.0,
        budgetMultiplier: 1.0,
        minEoTotal: 0,
        minElitePlayers: 0,
        enableDefensiveDiversification: true,
        maxStandardDefendersPerTeam: 1,
        maxEliteDefendersPerTeam: 2,
        eliteDefensePercentile: 0.80
      };
    default:
      return {
        betaEO: 0.5,
        betaVariance: -0.2,
        budgetMultiplier: 1.0,
        enableDefensiveDiversification: true,
        maxStandardDefendersPerTeam: 1,
        maxEliteDefendersPerTeam: 2
      };
  }
}

export interface ProjectionInput {
  playerId: number;
  features: any;
  externalXP?: number;
}

export class ProjectionEngine {
  private params: UtilityParameters;

  constructor(params: UtilityParameters) {
    this.params = params;
  }

  public predict(input: ProjectionInput, matchday: number): { expected: number; variance: number } {
    let baseXp = input.externalXP ?? 0;
    
    // Fallback baseline model if externalXP not populated
    if (baseXp === 0 && input.features) {
      const f = input.features;
      const mins = f.predictedMinutes || 60;
      const appPts = mins >= 60 ? 2 : (mins > 0 ? 1 : 0);
      
      const pos = f.position || 'MID';
      const xG = f.xG90 || 0.2;
      const xA = f.xA90 || 0.15;
      const bR = f.ballRecoveriesPer90 || 4; // Ball recoveries
      
      const goalPts = pos === 'FWD' ? 4 : (pos === 'MID' ? 5 : 6);
      const csPts = (pos === 'DEF' || pos === 'GKP') ? 4 : (pos === 'MID' ? 1 : 0);

      const expGoals = xG * (mins / 90) * goalPts;
      const expAssists = xA * (mins / 90) * 3;
      const expCs = (f.csProb || 0.35) * csPts;
      const expRecoveries = Math.floor(bR / 3) * (mins / 90); // 3 recoveries = +1 pt

      baseXp = appPts + expGoals + expAssists + expCs + expRecoveries;
    }

    const variance = Math.max(0.5, baseXp * 0.45);
    return { expected: baseXp, variance };
  }

  public simulatePlayerDistribution(input: ProjectionInput, matchday: number): PlayerDistribution {
    const { expected, variance } = this.predict(input, matchday);
    const p50 = Math.round(expected * 10) / 10;
    const p75 = Math.round((expected + 0.67 * Math.sqrt(variance)) * 10) / 10;
    const p90 = Math.round((expected + 1.28 * Math.sqrt(variance)) * 10) / 10;
    const p95 = Math.round((expected + 1.64 * Math.sqrt(variance)) * 10) / 10;

    return {
      mean: expected,
      variance,
      skewness: 0.35,
      p50,
      p75,
      p90,
      p95,
      tails: {
        8: expected >= 6 ? 0.35 : 0.15,
        15: expected >= 9 ? 0.18 : 0.05
      },
      histogram: {
        2: 0.3,
        6: 0.5,
        10: 0.2
      }
    };
  }
}
