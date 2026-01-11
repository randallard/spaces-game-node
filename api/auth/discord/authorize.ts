/**
 * Discord OAuth Authorization URL Generator
 *
 * Redirects user to Discord's OAuth authorization page.
 * This is the first step in the OAuth flow.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Timestamped logging helper
const log = (message: string, ...args: any[]) => console.log(`[${new Date().toISOString()}] ${message}`, ...args);
const logError = (message: string, ...args: any[]) => console.error(`[${new Date().toISOString()}] ${message}`, ...args);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    log(`[Discord Auth] Environment check: hasClientId=${!!clientId}, hasRedirectUri=${!!redirectUri}, clientId=${clientId?.substring(0, 10) + '...'}`);

    if (!clientId || !redirectUri) {
      logError('[Discord Auth] Missing environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        debug: {
          hasClientId: !!clientId,
          hasRedirectUri: !!redirectUri,
        }
      });
    }

    // Build Discord OAuth URL
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify'); // Only need to identify the user

    log(`[Discord Auth] Redirecting to Discord OAuth: ${authUrl.toString().substring(0, 80) + '...'}`);

    // Redirect user to Discord
    return res.redirect(authUrl.toString());

  } catch (error) {
    logError('[Discord Auth] Error:', error);
    return res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
}
