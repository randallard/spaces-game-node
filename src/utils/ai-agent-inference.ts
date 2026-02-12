/**
 * AI Agent inference API client
 * Communicates with the Python inference server for board construction
 * @module utils/ai-agent-inference
 */

import { getInferenceApiEndpoint } from '@/config/api';
import type { Board, BoardSize, AiAgentSkillLevel } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request timeout in milliseconds
 */
const REQUEST_TIMEOUT = 30000;

/**
 * Convert a deterministic (_plus) skill level to its stochastic variant.
 * Useful for retries: if a deterministic seed produced a bad board,
 * switching to stochastic gives the model a better chance.
 */
export function toStochasticSkillLevel(skillLevel: AiAgentSkillLevel): AiAgentSkillLevel {
  if (skillLevel.endsWith('_plus')) {
    return skillLevel.replace('_plus', '') as AiAgentSkillLevel;
  }
  return skillLevel;
}

/**
 * Validate that an AI-constructed board has a complete path.
 * Checks that the piece visits every row (0 through boardSize-1)
 * and reaches the goal (has a final move).
 * This mirrors Python's is_board_playable() full-path checks.
 */
function isValidAiBoard(board: Board): boolean {
  const size = board.boardSize;
  const rowsWithPiece = new Set<number>();
  let hasFinal = false;

  for (const move of board.sequence) {
    if (move.type === 'piece') {
      rowsWithPiece.add(move.position.row);
    } else if (move.type === 'final') {
      hasFinal = true;
    }
  }

  if (!hasFinal) {
    return false;
  }

  for (let r = 0; r < size; r++) {
    if (!rowsWithPiece.has(r)) {
      return false;
    }
  }

  return true;
}

/**
 * Move in the API response format
 */
interface ApiMove {
  position: { row: number; col: number };
  type: 'piece' | 'trap' | 'final';
  order: number;
}

/**
 * API response for board construction
 */
interface ConstructBoardResponse {
  board: {
    sequence: ApiMove[];
    boardSize: number;
    grid: string[][];
  };
  valid: boolean;
  attempts_used: number;
  model_info?: Record<string, unknown>;
}

/**
 * Result of a board construction request
 */
export interface AiAgentBoardResult {
  board: Board | null;
  failed: boolean;
  attemptsUsed: number;
}

/**
 * Convert a Board to the API request history format (OpponentBoardHistory)
 * Each history entry has a `sequence` field containing the moves
 */
function boardToHistoryEntry(board: Board): {
  sequence: Array<{ row: number; col: number; type: string; order: number }>;
} {
  return {
    sequence: board.sequence.map((move) => ({
      row: move.position.row,
      col: move.position.col,
      type: move.type,
      order: move.order,
    })),
  };
}

/**
 * Reconstruct a full Board object from the API response
 */
function responseBoardToBoard(
  responseBoard: ConstructBoardResponse['board'],
  skillLevel: AiAgentSkillLevel
): Board {
  return {
    id: `ai-agent-${uuidv4()}`,
    name: `AI Agent (${skillLevel})`,
    boardSize: responseBoard.boardSize,
    grid: responseBoard.grid as Board['grid'],
    sequence: responseBoard.sequence.map((move) => ({
      position: { row: move.position.row, col: move.position.col },
      type: move.type,
      order: move.order,
    })),
    thumbnail: '',
    createdAt: Date.now(),
  };
}

/**
 * Request the AI agent to construct a board for the current round.
 *
 * Note: From the game's perspective, the AI is the "opponent".
 * But the inference API expects agent_score/opponent_score from the agent's
 * perspective, so we flip the scores when building the request.
 *
 * @param boardSize - Board grid size
 * @param roundNum - Current round number (1-5)
 * @param playerScore - Player's cumulative score (game perspective)
 * @param opponentScore - AI's cumulative score (game perspective)
 * @param playerBoardHistory - Player's boards from previous rounds
 * @param skillLevel - AI skill level
 * @returns AiAgentBoardResult with board (or null), failure status, and attempts used
 */
export async function requestAiAgentBoard(
  boardSize: BoardSize,
  roundNum: number,
  playerScore: number,
  opponentScore: number,
  playerBoardHistory: Board[],
  skillLevel: AiAgentSkillLevel
): Promise<AiAgentBoardResult> {
  try {
    const url = getInferenceApiEndpoint('/construct-board');

    // Convert player's board history to API format
    const opponentHistory = playerBoardHistory.map(boardToHistoryEntry);

    // Flip scores: API expects agent_score = AI's score, opponent_score = player's score
    // round_num is 0-indexed on the server (0-4), but Node uses 1-indexed (1-5)
    const requestBody = {
      board_size: boardSize,
      round_num: roundNum - 1,
      agent_score: opponentScore,    // AI's score from game perspective
      opponent_score: playerScore,    // Player's score from game perspective
      opponent_history: opponentHistory,
      skill_level: skillLevel,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[requestAiAgentBoard] Server returned ${response.status}: ${response.statusText}`
      );
      return { board: null, failed: true, attemptsUsed: 0 };
    }

    const data: ConstructBoardResponse = await response.json();
    const attemptsUsed = data.attempts_used ?? 1;

    if (!data.valid || !data.board) {
      console.error(`[requestAiAgentBoard] Server returned invalid board after ${attemptsUsed} attempts`);
      return { board: null, failed: true, attemptsUsed };
    }

    // Validate response board size matches request
    if (data.board.boardSize !== boardSize) {
      console.error(
        `[requestAiAgentBoard] Board size mismatch: requested ${boardSize}, got ${data.board.boardSize}`
      );
      return { board: null, failed: true, attemptsUsed };
    }

    const constructedBoard = responseBoardToBoard(data.board, skillLevel);

    // Local validation: ensure the board has a complete path (visits every row + reaches goal)
    if (!isValidAiBoard(constructedBoard)) {
      console.error(
        `[requestAiAgentBoard] Board failed local validation (incomplete path or missing goal)`
      );
      return { board: null, failed: true, attemptsUsed };
    }

    return { board: constructedBoard, failed: false, attemptsUsed };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[requestAiAgentBoard] Request timed out');
    } else if (error instanceof Error) {
      console.error('[requestAiAgentBoard] Error:', error.message);
    } else {
      console.error('[requestAiAgentBoard] Unknown error:', error);
    }
    return { board: null, failed: true, attemptsUsed: 0 };
  }
}

/**
 * Check if the inference server is available
 * @returns true if the server is reachable and healthy
 */
export async function checkInferenceServerHealth(): Promise<boolean> {
  try {
    const url = getInferenceApiEndpoint('/health');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
