/**
 * Lot Results API Endpoint
 *
 * Stores and retrieves game results for the-lot NPC games in Vercel KV.
 * This allows townage to fetch results for games completed without returning.
 *
 * POST: Save a result (called by spaces-game when a lot game ends)
 * GET: Fetch results by session IDs (called by townage on mount)
 * DELETE: Clear consumed results (called by townage after processing)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Timestamped logging helper
const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);
const logError = (message: string, ...args: any[]) => console.error(`[${new Date().toISOString()}] ${message}`, ...args);

interface LotResult {
  sessionId: string;
  npcId: string;
  playerScore: number;
  opponentScore: number;
  winner: 'player' | 'opponent' | 'tie';
  rounds: Array<{
    round: number;
    playerPoints: number;
    opponentPoints: number;
    winner: string;
  }>;
  completedAt: number;
}

// 30 days in seconds (matches challenge URL TTL)
const RESULT_TTL = 30 * 24 * 60 * 60;

function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://randallard.github.io',
    'https://townage.app',
    'https://www.townage.app',
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      return await handlePost(req, res);
    } else if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'DELETE') {
      return await handleDelete(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logError('[LotResults] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const body = req.body as LotResult;

  if (!body.sessionId || !body.npcId || body.winner === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: sessionId, npcId, winner',
    });
  }

  const key = `lot-result:${body.sessionId}`;
  log(`[LotResults] Saving result for session: ${body.sessionId}`);

  await kv.set(key, body, { ex: RESULT_TTL });

  log(`[LotResults] Result saved successfully`);
  return res.status(200).json({ success: true });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { sessions } = req.query;

  if (!sessions || typeof sessions !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid required parameter: sessions (comma-separated IDs)',
    });
  }

  const sessionIds = sessions.split(',').filter(Boolean);
  if (sessionIds.length === 0) {
    return res.status(200).json({ success: true, results: [] });
  }

  // Cap at 50 to prevent abuse
  const cappedIds = sessionIds.slice(0, 50);

  log(`[LotResults] Fetching results for ${cappedIds.length} sessions`);

  const results: LotResult[] = [];
  for (const id of cappedIds) {
    const result = await kv.get<LotResult>(`lot-result:${id}`);
    if (result) {
      results.push(result);
    }
  }

  log(`[LotResults] Found ${results.length} results`);
  return res.status(200).json({ success: true, results });
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const body = req.body as { sessions: string[] };

  if (!body.sessions || !Array.isArray(body.sessions)) {
    return res.status(400).json({
      error: 'Missing required field: sessions (array of IDs)',
    });
  }

  const cappedIds = body.sessions.slice(0, 50);
  log(`[LotResults] Deleting ${cappedIds.length} results`);

  for (const id of cappedIds) {
    await kv.del(`lot-result:${id}`);
  }

  log(`[LotResults] Deleted successfully`);
  return res.status(200).json({ success: true });
}
