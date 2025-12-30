# Spaces Game API

Vercel serverless functions for Discord OAuth and notifications.

## Local Development

### Start Vercel Dev Server

```bash
vercel dev --listen 3001
```

This will start the API server on `http://localhost:3001`.

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `DISCORD_CLIENT_ID` - Get from Discord Developer Portal
- `DISCORD_CLIENT_SECRET` - Get from Discord Developer Portal
- `DISCORD_REDIRECT_URI` - OAuth callback URL (local: `http://localhost:3001/api/auth/discord/callback`)
- `FRONTEND_URL` - Your frontend URL (local: `http://localhost:5173`)

## API Endpoints

### POST `/api/discord/notify`

Send a Discord notification to a user.

**Request Body:**
```json
{
  "discordId": "123456789",
  "eventType": "turn-ready" | "game-complete" | "challenge-sent",
  "gameData": {
    "round": 2,
    "playerName": "Alice",
    "gameUrl": "https://...",
    "boardSize": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent",
  "data": { ... }
}
```

### GET `/api/auth/discord/callback`

OAuth callback endpoint. Discord redirects here after user authorizes.

**Query Parameters:**
- `code` - Authorization code from Discord
- `error` - Error code if user denied

**Behavior:**
Exchanges code for token, gets user info, redirects to frontend with Discord data.

## Testing

### Test Notification Endpoint

```bash
curl -X POST http://localhost:3001/api/discord/notify \
  -H "Content-Type: application/json" \
  -d '{
    "discordId": "123456789",
    "eventType": "turn-ready",
    "gameData": {
      "round": 2,
      "playerName": "Alice",
      "gameUrl": "http://localhost:5173/game/123"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Notification logged (Phase 1 - no bot yet)",
  "data": {
    "discordId": "123456789",
    "eventType": "turn-ready"
  }
}
```

### Test OAuth Callback

Visit in browser:
```
http://localhost:3001/api/auth/discord/callback?code=test_code_123
```

Should redirect to `http://localhost:5173/?discord_id=123456789&discord_username=testuser`

## Phase Progress

- [x] **Phase 1**: Stub endpoints, local testing
- [ ] **Phase 2**: Real Discord OAuth
- [ ] **Phase 3**: Discord bot integration
- [ ] **Phase 4**: Deploy to Vercel
- [ ] **Phase 5**: Deploy bot to Railway
