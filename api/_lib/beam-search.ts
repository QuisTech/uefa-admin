import { UEFAOracle } from './ingestion.js';
import { UtilityParameters } from './projection.js';
import { solveStartingXI, solveCaptain } from './lp-solver.js';
import { UEFAPlayer } from './types.js';

export interface BeamNode {
  matchday: number;
  squadIds: number[];
  cumulativeXp: number;
  cumulativeHits: number;
  transfersHistory: Array<{
    matchday: number;
    transfersIn: number[];
    transfersOut: number[];
    hitsCost: number;
  }>;
}

export interface BeamSearchResult {
  horizonMatchdays: number;
  beamWidth: number;
  optimalPath: BeamNode;
  candidatePaths: BeamNode[];
}

export class BeamSearchTransferOptimizer {
  private oracle: UEFAOracle;
  private players: UEFAPlayer[];
  private beamWidth: number;

  constructor(oracle: UEFAOracle, players: UEFAPlayer[], beamWidth: number = 5) {
    this.oracle = oracle;
    this.players = players;
    this.beamWidth = beamWidth;
  }

  /**
   * Evaluate starting 11 xP for a given squad state at a matchday
   */
  private evaluateSquadState(squadIds: number[], matchday: number, params: UtilityParameters): number {
    const xiIds = solveStartingXI(this.oracle, matchday, squadIds, params);
    const { captain } = solveCaptain(this.oracle, matchday, xiIds, params);
    
    let totalXp = 0;
    xiIds.forEach(id => {
      const xp = this.oracle.getXP(id, matchday);
      totalXp += (id === captain ? xp * 2 : xp);
    });

    return totalXp;
  }

  /**
   * Run 8-GW Beam Search Multi-Matchday Transfer Path Search
   */
  public searchOptimalTransferPath(
    initialSquadIds: number[],
    startMatchday: number = 1,
    horizon: number = 8,
    params: UtilityParameters,
    freeTransfersPerGw: number = 1
  ): BeamSearchResult {
    const endMatchday = Math.min(8, startMatchday + horizon - 1);
    
    // Initial beam contains current squad state
    let beam: BeamNode[] = [{
      matchday: startMatchday - 1,
      squadIds: [...initialSquadIds],
      cumulativeXp: 0,
      cumulativeHits: 0,
      transfersHistory: []
    }];

    const playerMap = new Map(this.players.map(p => [Number(p.id), p]));

    for (let md = startMatchday; md <= endMatchday; md++) {
      const nextBeamCandidates: BeamNode[] = [];

      for (const parentState of beam) {
        const currentSquad = parentState.squadIds;
        const currentXp = this.evaluateSquadState(currentSquad, md, params);

        // Branch 1: Roll transfer / No changes
        nextBeamCandidates.push({
          matchday: md,
          squadIds: [...currentSquad],
          cumulativeXp: parentState.cumulativeXp + currentXp,
          cumulativeHits: parentState.cumulativeHits,
          transfersHistory: [
            ...parentState.transfersHistory,
            { matchday: md, transfersIn: [], transfersOut: [], hitsCost: 0 }
          ]
        });

        // Branch 2: Evaluate top 1-transfer mutations
        // Identify weakest player in current squad vs highest xP available player in same position
        const positionWeakest: Record<string, { id: number; xp: number }> = {};
        
        currentSquad.forEach(id => {
          const p = playerMap.get(id);
          if (!p) return;
          const pos = p.skill === 1 ? 'GKP' : p.skill === 2 ? 'DEF' : p.skill === 3 ? 'MID' : 'FWD';
          const xp = this.oracle.getXP(id, md);
          if (!positionWeakest[pos] || xp < positionWeakest[pos].xp) {
            positionWeakest[pos] = { id, xp };
          }
        });

        // Find top target replacement for each position
        (['GKP', 'DEF', 'MID', 'FWD'] as const).forEach(pos => {
          const outObj = positionWeakest[pos];
          if (!outObj) return;

          const squadSet = new Set(currentSquad);
          const topInTargets = this.players
            .filter(p => {
              const pPos = p.skill === 1 ? 'GKP' : p.skill === 2 ? 'DEF' : p.skill === 3 ? 'MID' : 'FWD';
              return pPos === pos && !squadSet.has(Number(p.id));
            })
            .sort((a, b) => this.oracle.getXP(Number(b.id), md) - this.oracle.getXP(Number(a.id), md))
            .slice(0, 3);

          topInTargets.forEach(inTarget => {
            const inId = Number(inTarget.id);
            const mutatedSquad = currentSquad.map(id => id === outObj.id ? inId : id);
            const mutatedXp = this.evaluateSquadState(mutatedSquad, md, params);

            nextBeamCandidates.push({
              matchday: md,
              squadIds: mutatedSquad,
              cumulativeXp: parentState.cumulativeXp + mutatedXp,
              cumulativeHits: parentState.cumulativeHits,
              transfersHistory: [
                ...parentState.transfersHistory,
                { matchday: md, transfersIn: [inId], transfersOut: [outObj.id], hitsCost: 0 }
              ]
            });
          });
        });
      }

      // Sort candidate paths by cumulative net expected points (descending)
      nextBeamCandidates.sort((a, b) => (b.cumulativeXp - b.cumulativeHits) - (a.cumulativeXp - a.cumulativeHits));

      // Prune beam keeping top K candidate states (Beam Width = K)
      beam = nextBeamCandidates.slice(0, this.beamWidth);
    }

    return {
      horizonMatchdays: horizon,
      beamWidth: this.beamWidth,
      optimalPath: beam[0],
      candidatePaths: beam
    };
  }
}
