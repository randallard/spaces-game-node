# Vercel Redis Setup Guide (2026)

This guide explains how to set up Redis through the Vercel Marketplace for the URL shortening service that keeps Discord notification URLs under 512 characters.

## What is Vercel Marketplace Redis?

As of January 2026, Vercel has moved storage solutions to the Marketplace. Redis Cloud is the primary Redis provider available through Vercel Marketplace, offering a durable, serverless key-value store compatible with the `@vercel/kv` SDK.

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
4. Under "Storage partners," click **View all partners**
5. Find **Redis Cloud** (formerly Vercel KV)
6. Click **Continue**

### 2. Configure Your Database

1. Select your plan:
   - **Free tier** available (starts at $0)
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

This automatically adds the required environment variables to your Vercel project:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Note:** The `@vercel/kv` SDK is compatible with Redis Cloud through Vercel Marketplace.

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

## Pricing

**Free Tier:**
- Starts at $0/month
- Perfect for getting started and testing
- Specific limits vary (check Redis Cloud pricing for current details)

**Production Tiers:**
- Pay-as-you-go options available
- Multi-zone high availability (coming soon)
- Region selection (coming soon)

URLs are stored for 30 days with automatic expiration (TTL).

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

### Via Redis Cloud Console
1. In Vercel Dashboard, click on your database
2. Click **Open in Redis Cloud**
3. Access advanced features:
   - Password management
   - Eviction policies
   - Detailed analytics
   - Performance tuning

## Troubleshooting

### Error: "Cannot read properties of null"

**Cause:** Redis database not connected to project

**Solution:**
1. Go to Vercel Dashboard → Storage
2. Find your Redis database
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
- Redis Cloud Console (via "Open in Redis Cloud")

## Migration Notes (from old Vercel KV)

If you previously used Vercel KV (before January 2026):
- The `@vercel/kv` SDK remains compatible
- Redis Cloud is the recommended replacement
- Same environment variable names
- No code changes required
- Just follow the new Marketplace setup flow

## Additional Resources

- [Vercel Marketplace - Redis](https://vercel.com/marketplace/redis)
- [Redis Cloud Vercel Integration Docs](https://redis.io/docs/latest/operate/rc/cloud-integrations/vercel/)
- [Vercel Storage Overview](https://vercel.com/docs/storage)
- [@vercel/kv SDK Documentation](https://vercel.com/docs/storage/vercel-kv/kv-reference)
