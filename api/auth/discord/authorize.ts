/**
 * Discord OAuth Authorization URL Generator
 *
 * Redirects user to Discord's OAuth authorization page.
 * This is the first step in the OAuth flow.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    console.log('[Discord Auth] Environment check:', {
      hasClientId: !!clientId,
      hasRedirectUri: !!redirectUri,
      clientId: clientId?.substring(0, 10) + '...',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('DISCORD')),
    });

    if (!clientId || !redirectUri) {
      console.error('[Discord Auth] Missing environment variables');
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
    authUrl.searchParams.set('scope', 'identify'); // Just need basic user info

    console.log('[Discord Auth] Redirecting to Discord OAuth:', authUrl.toString().substring(0, 80) + '...');

    // Redirect user to Discord
    return res.redirect(authUrl.toString());

  } catch (error) {
    console.error('[Discord Auth] Error:', error);
    return res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
}
