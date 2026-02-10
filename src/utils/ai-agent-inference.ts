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
  model_info?: Record<string, unknown>;
}

/**
 * Convert a Board's sequence to the API request history format
 * Each history entry is the sequence of moves from that round's board
 */
function boardToHistoryEntry(board: Board): Array<{
  row: number;
  col: number;
  type: string;
  order: number;
}> {
  return board.sequence.map((move) => ({
    row: move.position.row,
    col: move.position.col,
    type: move.type,
    order: move.order,
  }));
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
 * @returns Constructed Board or null on error
 */
export async function requestAiAgentBoard(
  boardSize: BoardSize,
  roundNum: number,
  playerScore: number,
  opponentScore: number,
  playerBoardHistory: Board[],
  skillLevel: AiAgentSkillLevel
): Promise<Board | null> {
  try {
    const url = getInferenceApiEndpoint('/construct-board');

    // Convert player's board history to API format
    const opponentHistory = playerBoardHistory.map(boardToHistoryEntry);

    // Flip scores: API expects agent_score = AI's score, opponent_score = player's score
    const requestBody = {
      board_size: boardSize,
      round_num: roundNum,
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
      return null;
    }

    const data: ConstructBoardResponse = await response.json();

    if (!data.valid || !data.board) {
      console.error('[requestAiAgentBoard] Server returned invalid board');
      return null;
    }

    // Validate response board size matches request
    if (data.board.boardSize !== boardSize) {
      console.error(
        `[requestAiAgentBoard] Board size mismatch: requested ${boardSize}, got ${data.board.boardSize}`
      );
      return null;
    }

    return responseBoardToBoard(data.board, skillLevel);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[requestAiAgentBoard] Request timed out');
    } else if (error instanceof Error) {
      console.error('[requestAiAgentBoard] Error:', error.message);
    } else {
      console.error('[requestAiAgentBoard] Unknown error:', error);
    }
    return null;
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
