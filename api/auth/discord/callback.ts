/**
 * Discord OAuth Callback Endpoint
 *
 * Handles the OAuth callback from Discord after user authorizes the app.
 * Exchanges the authorization code for an access token and retrieves user info.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Type definitions
interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests (OAuth callback)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, error: oauthError } = req.query;

    // Check if user denied authorization
    if (oauthError) {
      console.log('[Discord OAuth] User denied authorization:', oauthError);
      // Redirect back to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/?discord_error=access_denied`);
    }

    // Validate code exists
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Phase 1: Just log the code (no actual OAuth yet)
    console.log('[Discord OAuth] Received authorization code:', code.substring(0, 10) + '...');

    // TODO Phase 2: Exchange code for token
    // const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     client_id: process.env.DISCORD_CLIENT_ID!,
    //     client_secret: process.env.DISCORD_CLIENT_SECRET!,
    //     grant_type: 'authorization_code',
    //     code: code,
    //     redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    //   }),
    // });

    // TODO Phase 2: Get user info with token
    // const token = await tokenResponse.json() as DiscordTokenResponse;
    // const userResponse = await fetch('https://discord.com/api/users/@me', {
    //   headers: { Authorization: `Bearer ${token.access_token}` },
    // });
    // const user = await userResponse.json() as DiscordUser;

    // Phase 1: Return mock user data
    const mockUser = {
      id: '123456789',
      username: 'testuser',
      discriminator: '0',
      avatar: null,
    };

    console.log('[Discord OAuth] Returning mock user data (Phase 1):', mockUser);

    // Redirect back to frontend with user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('discord_id', mockUser.id);
    redirectUrl.searchParams.set('discord_username', mockUser.username);

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('[Discord OAuth] Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/?discord_error=server_error`);
  }
}
