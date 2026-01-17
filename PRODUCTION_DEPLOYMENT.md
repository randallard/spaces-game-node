# Production Deployment Guide

This guide covers deploying Spaces Game to production with Vercel (frontend + API) and Railway (Discord bot).

## 🎯 Current Status

✅ **Completed:**
- Discord OAuth integration (frontend)
- Discord avatar display for opponents
- Vercel API endpoints (`/api/auth/discord/*`, `/api/discord/notify`)
- Discord bot implementation (sends DMs)
- Local development environment working

🚧 **Production Ready:**
- All code is production-ready
- Need to configure production environment variables
- Need to deploy to Vercel and Railway

---

## 📋 Pre-Deployment Checklist

### 0. Vercel Project Setup & Configuration

**IMPORTANT: Complete these steps before deploying**

#### Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project" or select existing project
3. Click "Import Git Repository"
4. Select your GitHub repo: `randallard/spaces-game-node`
5. Configure project:
   - **Framework Preset:** Vite
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`

#### Set Production Branch
1. Go to **Settings → Environments**
2. Click on **Production** environment
3. Under **Branch Tracking**, ensure it's set to `main`

#### Fix Common Deployment Issues

**Issue 1: Base Path Mismatch**
- ❌ **Problem:** Vite configured for GitHub Pages (`/spaces-game-node/`) causes 404s on Vercel
- ✅ **Solution:** Already fixed in `vite.config.ts` - detects Vercel environment automatically

**Issue 2: Missing Production Dependencies**
- ❌ **Problem:** `@vercel/kv` in devDependencies causes module not found errors
- ✅ **Solution:** Already fixed - `@vercel/kv` moved to dependencies

Verify in `package.json`:
```json
"dependencies": {
  "@vercel/kv": "^3.0.0",
  "nanoid": "^5.1.6",
  // ... other deps
}
```

#### Set Up Vercel KV (URL Shortening)
1. Go to **Storage** tab in Vercel dashboard
2. Click "Create Database"
3. Select **Serverless Redis** (Upstash) - NOT Redis Cloud
4. Configure:
   - Name: `upstash-kv-cheese` (or your preference)
   - Plan: Free tier (pay-per-request)
5. Click "Create"
6. Connect to your project:
   - Click "Connect Project"
   - Select `spaces-game-api`
   - Check: Production ✅ Preview ✅ Development ✅
   - Click "Connect"

Environment variables will be added automatically:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

**Verify in Settings → Environment Variables** - all should say "All Environments"

### 1. Discord Application Setup

**Go to:** https://discord.com/developers/applications

#### Create Application (if not done)
- [ ] Click "New Application"
- [ ] Name: "Spaces Game" (or your preferred name)
- [ ] Accept Discord's terms

#### Configure OAuth2
- [ ] Go to OAuth2 → General
- [ ] Copy **Client ID** (save for later)
- [ ] Copy **Client Secret** (save for later - click "Reset Secret" if needed)
- [ ] Add Redirect URIs:
  - Production: `https://your-vercel-url.vercel.app/api/auth/discord/callback`
  - Or custom domain: `https://yourdomain.com/api/auth/discord/callback`

#### Create Bot
- [ ] Go to "Bot" section
- [ ] Click "Add Bot"
- [ ] **Important:** Disable "Public Bot" (only you can add it)
- [ ] Enable these Privileged Gateway Intents:
  - [ ] SERVER MEMBERS INTENT (optional, for future features)
  - [ ] MESSAGE CONTENT INTENT (optional, for future features)
- [ ] Copy **Bot Token** (save for later - you can only see this once!)

#### Bot Permissions
Required permissions (for inviting bot to servers):
- [ ] Send Messages
- [ ] Embed Links
- [ ] Read Message History

**Bot Invite URL:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=19456&scope=bot
```
Replace `YOUR_CLIENT_ID` with your actual client ID.

---

### 2. Vercel Deployment

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Login to Vercel
```bash
vercel login
```

#### Link Project (first time)
```bash
# From project root
vercel link
```

Follow prompts:
- Set up and deploy? **Yes**
- Which scope? (select your account/team)
- Link to existing project? **No** (first time)
- Project name? **spaces-game-node** (or your preference)
- Directory? **./dist**
- Override settings? **No**

#### Set Environment Variables in Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable below

**Option B: Via CLI**
```bash
# Discord OAuth
vercel env add DISCORD_CLIENT_ID
# Paste your Discord client ID, press Enter

vercel env add DISCORD_CLIENT_SECRET
# Paste your Discord client secret, press Enter

vercel env add DISCORD_REDIRECT_URI
# Enter: https://your-project.vercel.app/api/auth/discord/callback

vercel env add FRONTEND_URL
# Enter: https://your-project.vercel.app

# Bot Configuration
vercel env add BOT_URL
# Enter: https://your-bot-app.railway.app (get this after bot deployment)

vercel env add BOT_API_KEY
# Generate a random secure key: openssl rand -base64 32
```

**Required Environment Variables for Vercel:**
| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_CLIENT_ID` | From Discord Developer Portal | `123456789012345678` |
| `DISCORD_CLIENT_SECRET` | From Discord Developer Portal | `abcdef123456...` |
| `DISCORD_REDIRECT_URI` | OAuth callback URL | `https://yourapp.vercel.app/api/auth/discord/callback` |
| `FRONTEND_URL` | Your frontend URL | `https://yourapp.vercel.app` |
| `BOT_URL` | Discord bot API URL (Railway) | `https://your-bot.railway.app` |
| `BOT_API_KEY` | Secure key for API→Bot auth | `random-secure-key-here` |

#### Deploy to Vercel
```bash
# Deploy to production
vercel --prod
```

This will:
1. Build your app (`pnpm build`)
2. Deploy frontend to Vercel CDN
3. Deploy API functions to Vercel serverless

**Your app will be live at:** `https://your-project.vercel.app`

---

### 3. Railway Bot Deployment

#### Install Railway CLI
```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Or via npm
npm install -g @railway/cli
```

#### Login to Railway
```bash
railway login
```

#### Create New Project
```bash
# From bot directory
cd bot
railway init
```

Follow prompts:
- Project name: **spaces-game-bot** (or your preference)
- Environment: **production**

#### Set Environment Variables in Railway

```bash
# Discord bot token
railway variables set DISCORD_BOT_TOKEN=your_bot_token_here

# API key (must match Vercel's BOT_API_KEY)
railway variables set API_KEY=same_secure_key_as_vercel

# Frontend URL
railway variables set FRONTEND_URL=https://your-project.vercel.app

# Port (Railway will set this automatically, but good to have)
railway variables set PORT=3002
```

**Required Environment Variables for Railway:**
| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | From Discord Developer Portal | `MTIzNDU2Nzg5MDEyMzQ1Njc4.GhJKlM.xyz...` |
| `API_KEY` | Secure key (must match Vercel) | `random-secure-key-here` |
| `FRONTEND_URL` | Your frontend URL | `https://yourapp.vercel.app` |
| `PORT` | HTTP server port | `3002` |

#### Deploy Bot to Railway
```bash
# Deploy from bot directory
cd bot
railway up
```

Railway will:
1. Build your TypeScript bot
2. Start the process
3. Keep it running 24/7

**Get Your Bot URL:**
```bash
railway domain
```

This generates a public URL like: `https://spaces-game-bot-production.up.railway.app`

**Important:** Copy this URL and add it as `BOT_URL` in Vercel environment variables!

---

### 4. Update Vercel with Bot URL

After bot is deployed, update Vercel:

```bash
# Update BOT_URL with your Railway URL
vercel env add BOT_URL production
# Enter: https://your-bot-app.railway.app

# Redeploy Vercel for changes to take effect
vercel --prod
```

Or via Vercel Dashboard:
1. Project Settings → Environment Variables
2. Add `BOT_URL` → `https://your-bot-app.railway.app`
3. Redeploy (Deployments → click ... → Redeploy)

---

### 5. Update Discord OAuth Redirect URI

Update your Discord application with the production URL:

1. Go to https://discord.com/developers/applications
2. Select your application
3. OAuth2 → General
4. Add redirect URI: `https://your-project.vercel.app/api/auth/discord/callback`
5. Save Changes

---

### 6. Test Production Deployment

#### Test OAuth Flow
1. Visit `https://your-project.vercel.app`
2. Create a human opponent
3. Click "Connect Discord"
4. Should redirect to Discord, authorize, and return with Discord info

#### Test Bot Notifications
1. Start a game with a Discord-connected opponent
2. Complete your turn
3. Opponent should receive Discord DM within seconds
4. Check Railway logs: `railway logs`

#### Check Health Endpoints
```bash
# Bot health check
curl https://your-bot-app.railway.app/health

# Should return:
# {"status":"ok","botReady":true,"uptime":123}
```

---

## 🚀 Deployment Commands Cheat Sheet

### Vercel
```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# Set environment variable
vercel env add VAR_NAME production

# List environment variables
vercel env ls

# Open project in browser
vercel open
```

### Railway
```bash
# Deploy bot
railway up

# View logs (live)
railway logs

# Set environment variable
railway variables set VAR_NAME=value

# List environment variables
railway variables

# Open dashboard
railway open

# Check service status
railway status
```

---

## 🔒 Security Checklist

- [ ] **Never commit secrets to Git**
  - Check `.gitignore` includes `.env`, `.env.local`
  - Verify no tokens in commit history

- [ ] **Secure API keys**
  - Generate random `BOT_API_KEY`: `openssl rand -base64 32`
  - Same key in both Vercel and Railway
  - Never expose in frontend code

- [ ] **Discord Bot Token**
  - Treat as password - never share
  - Rotate if compromised
  - Only in Railway environment variables

- [ ] **OAuth Client Secret**
  - Never expose in frontend
  - Only in Vercel serverless functions
  - Rotate if compromised

- [ ] **Verify CORS**
  - API only accepts requests from your domain
  - Check `api/discord/notify.ts` allowed origins

---

## 📊 Monitoring & Maintenance

### Vercel
- **Dashboard:** https://vercel.com/dashboard
- **Analytics:** Check function invocations, errors
- **Logs:** Real-time logs for debugging

### Railway
- **Dashboard:** https://railway.app/dashboard
- **Metrics:** CPU, memory, network usage
- **Logs:** Discord bot activity, errors
- **Costs:** Free tier has $5/month credit

### Discord Bot Status
Monitor bot health:
```bash
# Check if bot is online
curl https://your-bot-app.railway.app/health
```

---

## 🆘 Troubleshooting

### Common Deployment Issues

#### "Cannot find package '@vercel/kv'" in Production

**Problem:** Build succeeds but function fails at runtime

**Symptoms:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vercel/kv' imported from /var/task/api/shorten.js
```

**Cause:** Package in `devDependencies` instead of `dependencies`

**Solution:**
```bash
pnpm add @vercel/kv
git commit -am "fix: move @vercel/kv to production dependencies"
git push
```

#### Blank Page / 404 on Assets

**Problem:** Page loads blank, console shows 404 errors

**Symptoms:**
```
Failed to load resource: /spaces-game-node/assets/index-xxx.js (404)
```

**Cause:** Vite `base` path configured for GitHub Pages

**Solution:** Already fixed in `vite.config.ts` - ensure you have:
```typescript
base: process.env.VERCEL ? '/' : (mode === 'production' ? '/spaces-game-node/' : '/'),
```

#### "OAuth redirect_uri mismatch"

**Problem:** Discord OAuth fails with redirect URI error

**Solution:**
1. Check Discord Developer Portal → OAuth2 → Redirects
2. Ensure exact match: `https://your-domain.vercel.app/api/auth/discord/callback`
3. No trailing slash
4. HTTPS in production

#### "Bot not sending DMs" / Discord 500 Error

**Problem:** URL shortening works but Discord notifications fail

**Symptoms:**
- Browser console: `[Discord] Failed to send notification: 500`
- Vercel function logs: `fetch failed` when calling bot

**Cause:** Bot running locally (`localhost:3002`) not accessible from Vercel

**Solution:**
1. Deploy bot to Railway/Fly.io/Render
2. Update Vercel environment variable: `BOT_URL` → deployed bot URL
3. Ensure `BOT_API_KEY` matches in both environments

**Check:**
1. Railway logs: `railway logs`
2. Bot status: `curl https://bot-url/health`
3. User has DMs enabled (Privacy Settings)
4. Bot token is valid
5. `BOT_URL` in Vercel matches Railway URL
6. `BOT_API_KEY` matches in both Vercel and Railway

#### URL Shortening Not Working

**Problem:** Discord gets long URLs instead of short ones

**Check:**
1. Vercel KV connected: Settings → Storage
2. Environment variables present: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
3. Function logs in Vercel: `/api/shorten` should show success
4. Browser console: Should see `[generateChallengeUrlShortened] ✅ Generated short URL`

**Common causes:**
- Vercel KV not connected to project
- Wrong Redis provider (Redis Cloud instead of Upstash)
- Environment variables not set for Production environment

### "Vercel function timeout"
**Problem:** API functions timing out

**Solution:**
1. Check Railway bot is responding: `curl bot-url/health`
2. Increase Vercel timeout (Pro plan only)
3. Add retry logic in `api/discord/notify.ts`

### "Railway bot offline"
**Problem:** Bot keeps restarting

**Check:**
1. Railway logs for errors
2. Verify `DISCORD_BOT_TOKEN` is correct
3. Check memory usage (might need upgrade)
4. Ensure `PORT` environment variable is set

---

## 💰 Cost Breakdown

| Service | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| **Vercel** | 100GB bandwidth, unlimited sites | $20/month Pro |
| **Railway** | $5 credit/month (~500 hours) | $0.000463/GB-hour |
| **Discord API** | Unlimited | Free forever |
| **Total** | **$0/month** | ~$5-10/month |

**Expected Usage:**
- Small userbase (100-1000 users): **Free**
- Medium userbase (1000-10000 users): **$5-10/month**
- Large userbase (10k+ users): **$20-50/month**

---

## 🎉 Post-Deployment

### Custom Domain (Optional)
**Vercel:**
1. Project Settings → Domains
2. Add your domain
3. Configure DNS (Vercel provides instructions)

**Railway:**
1. `railway domain add yourdomain.com`
2. Configure DNS CNAME to Railway

### Enable Analytics
**Vercel:**
- Enable Web Analytics in project settings
- Free on all plans

**Railway:**
- Metrics available in dashboard
- Consider integrating with monitoring service (Sentry, etc.)

### Invite Bot to Server (Optional)
For community features:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=19456&scope=bot
```

---

## 📝 Environment Variable Reference

### Complete List

#### Vercel (.env.local → Vercel Dashboard)
```bash
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://yourapp.vercel.app/api/auth/discord/callback
FRONTEND_URL=https://yourapp.vercel.app
BOT_URL=https://your-bot.railway.app
BOT_API_KEY=random-secure-key
```

#### Railway (bot/.env → Railway Variables)
```bash
DISCORD_BOT_TOKEN=your_bot_token
API_KEY=random-secure-key
FRONTEND_URL=https://yourapp.vercel.app
PORT=3002
```

#### Frontend Build (.env for Vite)
```bash
VITE_API_URL=https://yourapp.vercel.app
```
*(This is automatically handled by Vite config for production)*

---

## ✅ Final Checklist

Before going live:

- [ ] Discord app configured with OAuth redirect URI
- [ ] Discord bot created and token saved
- [ ] Vercel project created and linked
- [ ] All Vercel environment variables set
- [ ] Railway project created
- [ ] All Railway environment variables set
- [ ] Bot deployed to Railway and running
- [ ] Vercel updated with Railway `BOT_URL`
- [ ] Tested OAuth flow in production
- [ ] Tested Discord notifications working
- [ ] Checked Railway and Vercel logs for errors
- [ ] Custom domain configured (if desired)
- [ ] Monitoring set up

---

## 🚀 Quick Deploy (After Setup)

```bash
# Deploy everything at once
# 1. Deploy Vercel (frontend + API)
vercel --prod

# 2. Deploy Railway (bot)
cd bot && railway up

# Done! 🎉
```

---

**Questions or Issues?**
- Discord API Docs: https://discord.com/developers/docs
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app

**Your Setup:**
- Frontend + API: Vercel
- Discord Bot: Railway
- OAuth: Discord Developer Portal
