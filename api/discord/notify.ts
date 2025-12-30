/**
 * Discord Notification API Endpoint
 *
 * Accepts notification requests from the frontend and triggers Discord DMs.
 * This endpoint will forward requests to the Discord bot.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Type definitions for request body
interface NotificationRequest {
  discordId: string;
  eventType: 'turn-ready' | 'game-complete' | 'challenge-sent';
  gameData: {
    round?: number;
    playerName: string;
    gameUrl: string;
    boardSize?: number;
  };
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
    const body = req.body as NotificationRequest;

    // Validate request
    if (!body.discordId || !body.eventType || !body.gameData) {
      return res.status(400).json({
        error: 'Missing required fields: discordId, eventType, gameData'
      });
    }

    // Phase 1: Just log the request (no bot yet)
    console.log('[Discord Notify] Received notification request:', {
      discordId: body.discordId,
      eventType: body.eventType,
      playerName: body.gameData.playerName,
      round: body.gameData.round,
    });

    // TODO Phase 3: Forward to Discord bot
    // const botUrl = process.env.BOT_URL;
    // const botResponse = await fetch(`${botUrl}/send-notification`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.BOT_API_KEY}`
    //   },
    //   body: JSON.stringify(body)
    // });

    // Phase 1: Return success (stub)
    return res.status(200).json({
      success: true,
      message: 'Notification logged (Phase 1 - no bot yet)',
      data: {
        discordId: body.discordId,
        eventType: body.eventType,
      }
    });

  } catch (error) {
    console.error('[Discord Notify] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
