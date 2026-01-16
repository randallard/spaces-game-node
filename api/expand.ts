/**
 * URL Expander API Endpoint
 *
 * Retrieves full challenge data from Vercel KV using a short ID.
 * This allows clients to fetch the full challenge data from shortened URLs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Timestamped logging helper
const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);
const logError = (message: string, ...args: any[]) => console.error(`[${new Date().toISOString()}] ${message}`, ...args);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers - allow requests from localhost and GitHub Pages
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://randallard.github.io',
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get short ID from query parameter
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required parameter: id'
      });
    }

    log(`[Expand] Retrieving challenge data for ID: ${id}`);

    // Retrieve from Vercel KV
    const challengeData = await kv.get(`challenge:${id}`);

    if (!challengeData) {
      log(`[Expand] ❌ Challenge data not found for ID: ${id}`);
      return res.status(404).json({
        error: 'Challenge not found',
        message: 'This challenge link may have expired or is invalid.'
      });
    }

    log(`[Expand] ✅ Challenge data retrieved successfully`);

    return res.status(200).json({
      success: true,
      challengeData,
    });

  } catch (error) {
    logError('[Expand] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
