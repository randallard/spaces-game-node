# Vercel KV Setup Guide

This guide explains how to set up Vercel KV (Redis) for the URL shortening service that keeps Discord notification URLs under 512 characters.

## What is Vercel KV?

Vercel KV is a durable, serverless Redis-compatible key-value store. We use it to store challenge data server-side and generate short URLs for Discord notifications.

## Why do we need it?

Discord buttons have a 512-character URL limit. With full round history, challenge URLs can exceed 2000+ characters. The URL shortening service solves this by:

1. Storing full challenge data in Vercel KV
2. Generating a short ID (8 characters)
3. Creating URLs like `https://game.com/#s=abc12345` (< 100 chars)
4. Fetching full data when the URL is loaded

## Setup Instructions

### 1. Create a Vercel KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **KV (Redis)**
5. Choose a name (e.g., `spaces-game-kv`)
6. Select a region close to your users
7. Click **Create**

### 2. Connect to Your Project

1. In the KV database page, click **Connect Project**
2. Select your `spaces-game` project
3. Choose the environment(s):
   - ✅ Production
   - ✅ Preview (optional, for testing)
   - ✅ Development (optional, for local testing)
4. Click **Connect**

This automatically adds the required environment variables to your Vercel project:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 3. Local Development Setup (Optional)

To test URL shortening locally:

1. Go to your KV database settings
2. Click **`.env.local`** tab
3. Copy the environment variables
4. Create `.env.local` in your project root:

```bash
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

5. Restart your dev server

### 4. Deploy

```bash
git add .
git commit -m "Add Vercel KV URL shortening"
git push
```

Vercel will automatically deploy with KV enabled.

## Pricing

**Free Tier:**
- 256 MB storage
- 3,000 commands/day
- 10 GB bandwidth/month

This is plenty for typical usage. URLs are stored for 30 days with automatic expiration.

## Testing

### Test URL Shortening

1. Start a game with a human opponent
2. Complete a round
3. Check the browser console for:
   ```
   [generateChallengeUrlShortened] Stored challenge data with ID: abc12345
   ```
4. The Discord notification should contain a short URL like:
   ```
   https://yourgame.com/#s=abc12345
   ```

### Test URL Expansion

1. Open the short URL from Discord
2. Check browser console for:
   ```
   [parseChallengeUrlAsync] Detected shortened URL, fetching full data...
   [parseChallengeUrlAsync] ✅ Successfully expanded shortened URL
   ```
3. Game should load with full round history intact

## Troubleshooting

### Error: "Cannot read properties of null"

**Cause:** Vercel KV not connected to project

**Solution:**
1. Go to Vercel Dashboard → Storage
2. Find your KV database
3. Click "Connect Project"
4. Redeploy

### Error: "Challenge not found"

**Cause:** URL expired (30 days) or invalid short ID

**Solution:** Generate a new challenge URL

### URLs still too long

**Cause:** Shortening failed, falling back to regular URLs

**Solution:**
1. Check Vercel logs for errors in `/api/shorten`
2. Verify KV connection
3. Check browser console for errors

## API Endpoints

### POST /api/shorten

Stores challenge data and returns short ID.

**Request:**
```json
{
  "challengeData": { /* ChallengeData object */ },
  "ttl": 2592000  // 30 days in seconds
}
```

**Response:**
```json
{
  "success": true,
  "shortId": "abc12345",
  "expiresIn": 2592000
}
```

### GET /api/expand?id=abc12345

Retrieves full challenge data.

**Response:**
```json
{
  "success": true,
  "challengeData": { /* ChallengeData object */ }
}
```

## How It Works

### URL Generation Flow

1. User completes board selection
2. `generateChallengeUrlShortened()` is called
3. Full challenge data is POSTed to `/api/shorten`
4. Vercel stores data in KV with TTL of 30 days
5. Short URL is returned: `#s=abc12345`
6. Discord notification sends short URL (< 512 chars) ✅

### URL Loading Flow

1. User clicks Discord notification link
2. App detects `#s=abc12345` format
3. `getChallengeFromUrlAsync()` is called
4. GETs `/api/expand?id=abc12345`
5. Full challenge data retrieved from KV
6. Game loads with complete round history ✅

## Fallback Behavior

If URL shortening fails:
- Falls back to compressed URL format (`#c=...`)
- Works for early rounds (short URLs)
- May fail for later rounds with long history
- Discord will send URL as text instead of button

## Monitoring

Check Vercel logs for:
- `[Shorten]` - URL shortening requests
- `[Expand]` - URL expansion requests
- Success rate and latency

Monitor KV usage in Vercel Dashboard → Storage → your KV database.
