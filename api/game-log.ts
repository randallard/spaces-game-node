/**
 * Game Log API Endpoint
 *
 * Writes round-level research data to Supabase for all opponent types.
 * Called by the frontend after every completed round.
 *
 * POST: Insert a board_construction or round_outcome record
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

const TABLE = {
  board_construction: 'board_constructions',
  round_outcome: 'round_outcomes',
} as const;

type RecordType = keyof typeof TABLE;

function supabaseInsert(table: string, data: Record<string, unknown>): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Logging not configured — accept silently so clients don't need to handle this
    return res.status(200).json({ ok: true });
  }

  const { type, ...data } = req.body as { type: RecordType } & Record<string, unknown>;

  const table = TABLE[type];
  if (!table) {
    return res.status(400).json({ error: `Unknown type: ${type}` });
  }

  try {
    const response = await supabaseInsert(table, data);
    if (!response.ok) {
      const text = await response.text();
      console.error(`[game-log] Supabase ${table} insert failed (${response.status}):`, text);
      return res.status(502).json({ error: 'Upstream insert failed' });
    }
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[game-log] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
