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

    console.log('[Discord OAuth] Received authorization code:', code.substring(0, 10) + '...');

    // Exchange code for access token
    console.log('[Discord OAuth] Exchanging code for token...');
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Discord OAuth] Token exchange failed:', errorText);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/?discord_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json() as DiscordTokenResponse;
    console.log('[Discord OAuth] Token received, fetching user info...');

    // Get user info with access token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('[Discord OAuth] User fetch failed:', errorText);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/?discord_error=user_fetch_failed`);
    }

    const user = await userResponse.json() as DiscordUser;
    console.log('[Discord OAuth] User authenticated:', {
      id: user.id,
      username: user.username,
      globalName: user.global_name,
    });

    // Redirect back to frontend with user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('discord_id', user.id);
    redirectUrl.searchParams.set('discord_username', user.global_name || user.username);
    if (user.avatar) {
      redirectUrl.searchParams.set('discord_avatar', user.avatar);
    }

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('[Discord OAuth] Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/?discord_error=server_error`);
  }
}
