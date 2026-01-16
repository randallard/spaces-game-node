/**
 * URL Shortener API Endpoint
 *
 * Stores full challenge data in Vercel KV and returns a short ID.
 * This allows Discord notifications to use short URLs that fit in button constraints.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

// Timestamped logging helper
const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);
const logError = (message: string, ...args: any[]) => console.error(`[${new Date().toISOString()}] ${message}`, ...args);

// Type definition for stored challenge data
interface ShortenRequest {
  challengeData: any; // The full challenge data object to store
  ttl?: number; // Optional TTL in seconds (default: 30 days)
}

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

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as ShortenRequest;

    // Validate request
    if (!body.challengeData) {
      return res.status(400).json({
        error: 'Missing required field: challengeData'
      });
    }

    // Generate a short ID (8 characters, URL-safe)
    const shortId = nanoid(8);

    // Default TTL: 30 days (in seconds)
    const ttl = body.ttl || 30 * 24 * 60 * 60;

    log(`[Shorten] Storing challenge data with ID: ${shortId}, TTL: ${ttl}s`);

    // Store in Vercel KV with TTL
    await kv.set(`challenge:${shortId}`, body.challengeData, { ex: ttl });

    log(`[Shorten] ✅ Challenge data stored successfully`);

    return res.status(200).json({
      success: true,
      shortId,
      expiresIn: ttl,
    });

  } catch (error) {
    logError('[Shorten] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
