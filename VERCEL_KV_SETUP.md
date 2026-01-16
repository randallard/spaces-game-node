# Vercel Redis Setup Guide (2026)

This guide explains how to set up Redis through the Vercel Marketplace for the URL shortening service that keeps Discord notification URLs under 512 characters.

## What is Vercel Marketplace Redis?

As of January 2026, Vercel has moved storage solutions to the Marketplace. **Serverless Redis** (powered by Upstash) is available through Vercel Marketplace, offering a durable, serverless key-value store compatible with the `@vercel/kv` SDK.

Upstash is what Vercel KV was originally built on, so this is a seamless transition with the same SDK and API.

We use it to store challenge data server-side and generate short URLs for Discord notifications.

## Why do we need it?

Discord buttons have a 512-character URL limit. With full round history, challenge URLs can exceed 2000+ characters. The URL shortening service solves this by:

1. Storing full challenge data in Redis Cloud
2. Generating a short ID (8 characters)
3. Creating URLs like `https://game.com/#s=abc12345` (< 100 chars)
4. Fetching full data when the URL is loaded

## Setup Instructions

### 1. Create a Redis Database via Vercel Marketplace

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Look for **Serverless Redis** or **Upstash** (may be under "View all partners")
5. Click **Continue**

**⚠️ IMPORTANT:** You **MUST** use **Upstash Redis** (Serverless Redis), not Redis Cloud!

Our code uses the `@vercel/kv` SDK, which **only works with Upstash**. Redis Cloud does not provide the REST API interface that `@vercel/kv` requires.

If you accidentally created a Redis Cloud database:
1. Delete it from Vercel Storage dashboard
2. Create a new database, selecting **Upstash** or **Serverless Redis**

### 2. Configure Your Database

1. Select your plan:
   - **Free tier** available (pay-per-request, starts at $0)
   - Upgrade options available for production workloads
2. Enter a database name (e.g., `spaces-game-redis`) or use auto-generated name
3. Click **Create**

### 3. Wait for Provisioning

- Initial status: **Initializing**
- Refresh your browser until status changes to **Available**
- This usually takes 1-2 minutes

### 4. Connect to Your Vercel Project

1. Once database status is **Available**, click on the database
2. Click **Connect Project**
3. Select your `spaces-game` project
4. Choose the environment(s):
   - ✅ Production (required)
   - ✅ Preview (optional, for testing)
   - ✅ Development (optional, for local testing)
5. Click **Connect**

### 5. Verify Environment Variables

After connecting your project, verify the environment variables were added:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. You should see these variables (added automatically by Upstash):
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL` (optional)

**✅ If you see these variables:** You're all set! The `@vercel/kv` SDK will work automatically.

**❌ If you only see `KV_REDIS_URL` or `REDIS_URL`:** You created a Redis Cloud database by mistake. Redis Cloud is **not compatible** with `@vercel/kv`. You need to:

1. Delete the Redis Cloud database
2. Create a new **Upstash** or **Serverless Redis** database
3. Reconnect to your project

The `@vercel/kv` SDK requires Upstash's REST API, which only Upstash provides.

### 5. Local Development Setup (Optional)

To test URL shortening locally:

1. Go to your Redis database in the Vercel Dashboard
2. Navigate to the **Quickstart** section
3. Copy the connection string
4. In your Redis database **Settings**, find the environment variables
5. Create `.env.local` in your project root:

```bash
KV_URL="redis://default:your-password@your-host.redis.io:port"
KV_REST_API_URL="https://your-endpoint.upstash.io"
KV_REST_API_TOKEN="your-token"
KV_REST_API_READ_ONLY_TOKEN="your-readonly-token"
```

6. Restart your dev server

### 6. Deploy

```bash
git add .
git commit -m "Add Redis Cloud URL shortening"
git push
```

Vercel will automatically deploy with Redis enabled.

## Pricing (Upstash Serverless Redis)

**Free Tier:**
- Starts at $0/month
- Pay-per-request pricing (only pay for what you use)
- 10,000 commands/day free
- Perfect for getting started and testing
- Never pay more than the cap price

**Production Tiers:**
- Pay-as-you-go based on actual usage
- Data replicated across 8+ regions globally for lowest latency
- Add/remove regions without downtime

URLs are stored for 30 days with automatic expiration (TTL).

For detailed pricing, visit [Upstash Pricing](https://upstash.com/pricing/redis).

## Testing

### Test URL Shortening

1. Start a game with a human opponent (Discord connected)
2. Complete a round
3. Check the browser console for:
   ```
   [Shorten] Storing challenge data with ID: abc12345, TTL: 2592000s
   [Shorten] ✅ Challenge data stored successfully
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
   [Expand] Retrieving challenge data for ID: abc12345
   [Expand] ✅ Challenge data retrieved successfully
   [parseChallengeUrlAsync] ✅ Successfully expanded shortened URL
   ```
3. Game should load with full round history intact

## Managing Your Database

### Via Vercel Dashboard
- View connection details
- See usage metrics
- Connect/disconnect projects
- Delete database

### Via Upstash Console
1. In Vercel Dashboard, click on your database
2. Click **Open in Upstash** (or similar link to external console)
3. Access advanced features:
   - Password management
   - Eviction policies
   - Detailed analytics
   - Performance tuning
   - Region management

## Troubleshooting

### Error: "Cannot read properties of null" or "kv is not defined"

**Cause:** Wrong Redis provider (Redis Cloud instead of Upstash) OR database not connected to project

**Solution:**

**Check your environment variables first:**
1. Vercel Project → Settings → Environment Variables
2. Look for `KV_REST_API_URL`

**If you see `KV_REDIS_URL` or `REDIS_URL` instead:**
- You created Redis Cloud by mistake
- Delete it and create **Upstash/Serverless Redis** instead
- `@vercel/kv` ONLY works with Upstash

**If environment variables are missing:**
1. Go to Vercel Dashboard → Storage
2. Find your Upstash Redis database
3. Click **Connect Project**
4. Select your project and environments
5. Redeploy your project

### Error: "Challenge not found"

**Cause:** URL expired (30 days) or invalid short ID

**Solution:** Generate a new challenge URL

### URLs still too long / Discord button error

**Cause:** Shortening failed, falling back to regular URLs

**Solution:**
1. Check Vercel deployment logs for errors in `/api/shorten`
2. Verify Redis connection in Vercel Dashboard
3. Check browser console for connection errors
4. Ensure environment variables are set correctly

### Error: "Failed to shorten URL"

**Cause:** Network error or Redis unavailable

**Solution:**
1. Check Vercel status page
2. Verify Redis database status is "Available"
3. Check function logs in Vercel Dashboard
4. System will fall back to compressed URLs

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
4. Vercel stores data in Redis with TTL of 30 days
5. Short URL is returned: `#s=abc12345`
6. Discord notification sends short URL (< 512 chars) ✅

### URL Loading Flow

1. User clicks Discord notification link
2. App detects `#s=abc12345` format
3. `getChallengeFromUrlAsync()` is called
4. GETs `/api/expand?id=abc12345`
5. Full challenge data retrieved from Redis
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

Monitor Redis usage in:
- Vercel Dashboard → Storage → Your Redis Database
- Upstash Console (via "Open in Upstash" or external link)

## Migration Notes (from old Vercel KV)

If you previously used Vercel KV (before November 2024):
- The `@vercel/kv` SDK remains 100% compatible
- Upstash (Serverless Redis) is the same provider that powered Vercel KV
- Same environment variable names
- Same API and SDK
- No code changes required
- Just follow the new Marketplace setup flow

**Note:** Vercel automatically migrated existing KV stores to the Marketplace starting in November 2024.

## Additional Resources

- [Vercel Marketplace - Upstash](https://vercel.com/marketplace/upstash)
- [Upstash Vercel Integration Docs](https://upstash.com/docs/redis/howto/vercelintegration)
- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [Vercel Storage Overview](https://vercel.com/docs/storage)
- [@vercel/kv SDK Documentation](https://vercel.com/docs/storage/vercel-kv/kv-reference)
- [Upstash Pricing](https://upstash.com/pricing/redis)
