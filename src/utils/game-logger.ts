/**
 * Research data logger — records board constructions and round outcomes
 * for all opponent types to Supabase via the /api/game-log Vercel route.
 *
 * All functions are fire-and-forget and never throw.
 */

import { getApiEndpoint } from '@/config/api';
import { encodeMinimalBoard, buildFogBoard } from './board-encoding';
import type { RoundResult } from '@/types';

export interface LogContext {
  gameId: string;
  roundNum: number;        // 1-indexed
  opponentType: string;    // 'ai-agent' | 'cpu' | 'remote-cpu' | 'human'
  boardSize: number;
  playerScoreBefore: number;   // cumulative rounds won BEFORE this round
  opponentScoreBefore: number;
  playerId?: string;
  lotSessionId?: string;
  skillLevel?: string;
  modelId?: string;
}

async function post(type: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch(getApiEndpoint('/api/game-log'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data }),
    });
  } catch {
    // Fire-and-forget — never surface errors to the game
  }
}

/**
 * Log both the board construction record and the round outcome for a completed round.
 * Call this immediately after simulateRound() completes, for all opponent types.
 */
export function logRoundData(result: RoundResult, ctx: LogContext): void {
  if (!result.playerBoard || !result.opponentBoard) return;

  const seq_board = (ctx.roundNum - 1) * 2 + 1;
  const seq_outcome = (ctx.roundNum - 1) * 2 + 2;

  // Board construction record — both boards in minimal encoding
  post('board_construction', {
    game_id: ctx.gameId,
    round_num: ctx.roundNum,
    seq: seq_board,
    player_board: encodeMinimalBoard(result.playerBoard),
    opponent_board: encodeMinimalBoard(result.opponentBoard),
    player_score: ctx.playerScoreBefore,
    opponent_score: ctx.opponentScoreBefore,
    board_size: ctx.boardSize,
    opponent_type: ctx.opponentType,
    skill_level: ctx.skillLevel ?? null,
    model_id: ctx.modelId ?? null,
    valid: result.winner !== undefined,
    player_id: ctx.playerId ?? null,
    lot_session_id: ctx.lotSessionId ?? null,
  });

  // Fog views — what each side sees of the other's board post-round
  const sim = result.simulationDetails;
  const playerFog = sim
    ? encodeMinimalBoard(buildFogBoard(
        result.opponentBoard,
        sim.opponentLastStep,
        sim.opponentHitTrap,
        sim.opponentTrapPosition,
      ))
    : encodeMinimalBoard(result.opponentBoard);

  const opponentFog = sim
    ? encodeMinimalBoard(buildFogBoard(
        result.playerBoard,
        sim.playerLastStep,
        sim.playerHitTrap,
        sim.playerTrapPosition,
      ))
    : encodeMinimalBoard(result.playerBoard);

  // Round outcome record
  post('round_outcome', {
    game_id: ctx.gameId,
    round_num: ctx.roundNum,
    seq: seq_outcome,
    player_points: result.playerPoints ?? 0,
    opponent_points: result.opponentPoints ?? 0,
    winner: result.winner ?? null,
    player_hit_trap: sim?.playerHitTrap ?? false,
    opponent_hit_trap: sim?.opponentHitTrap ?? false,
    collision: result.collision ?? false,
    player_last_step: sim?.playerLastStep ?? -1,
    opponent_last_step: sim?.opponentLastStep ?? -1,
    player_fog: playerFog,
    opponent_fog: opponentFog,
    player_id: ctx.playerId ?? null,
    opponent_type: ctx.opponentType,
  });
}
