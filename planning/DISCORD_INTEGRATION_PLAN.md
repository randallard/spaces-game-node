# Discord Integration Plan

## Overview
Integrate Discord as the primary communication and notification system for Spaces Game. This will enable automatic challenge delivery, real-time notifications, community features, and potential for future enhancements.

**Alternatives Considered**: [Email Integration](./EMAIL_INTEGRATION_PLAN.md) - decided against in favor of Discord due to better gaming community fit and richer feature set.

---

## Multi-Channel Notification Strategy

**Core Principle**: Discord is **optional and additive**, not a requirement.

### Always Available: Manual Link Sharing
- Copy/paste link functionality **always present**
- Works without any account
- Universal fallback
- Never removed or hidden

### Discord as Enhancement
- Opt-in for convenience
- Works asymmetrically (one player can use, other doesn't need to)
- Gradual adoption encouraged, not forced
- Clear value proposition at point of use

### Four Notification States

| Your Discord | Opponent Discord | What Happens |
|--------------|-----------------|--------------|
| ❌ No | ❌ No | Manual links only + Discord upsell |
| ✅ Yes | ❌ No | You get notifications, manual send to opponent |
| ❌ No | ✅ Yes | Auto-send to opponent, you send manually |
| ✅ Yes | ✅ Yes | **Full automation** - both get notifications |

**Key Insight**: Even if only ONE player has Discord, they get value!

### Detailed UX for Each State

#### State 1: Neither Has Discord
**ShareChallenge Component**:
```
┌─────────────────────────────────────────────────────┐
│        Challenge Ready!                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [📋 Copy Link]  ← Primary action                   │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ ✨ Want to automate this?                  │    │
│  │                                             │    │
│  │ Connect your Discord account to:           │    │
│  │ • Get notified when it's your turn         │    │
│  │ • Auto-send challenges to opponents        │    │
│  │ • Track games in one place                 │    │
│  │                                             │    │
│  │ [Connect Discord]                          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Note: Your opponent doesn't have Discord yet,      │
│        but you'll still get notified when they      │
│        complete their turns!                        │
└─────────────────────────────────────────────────────┘
```

**After Round Submitted**:
```
┌─────────────────────────────────────────────────────┐
│  ✅ Board Submitted!                                 │
│                                                      │
│  Share this link with your opponent:                │
│  [📋 Copy Link]                                      │
│                                                      │
│  💡 Connect Discord to get notified when they       │
│     complete their turn!                            │
│     [Connect Discord]                               │
└─────────────────────────────────────────────────────┘
```

---

#### State 2: You Have Discord, Opponent Doesn't
**ShareChallenge Component**:
```
┌─────────────────────────────────────────────────────┐
│        Challenge Ready!                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [📋 Copy Link] ← Still needed to send              │
│                                                      │
│  [✉️ Enable My Notifications]                       │
│                                                      │
│  ✅ You'll get a Discord DM when Bob responds!      │
│  ⚠️ Bob doesn't have Discord - send them the        │
│     link manually                                   │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Invite Bob to Discord?                     │    │
│  │ [Copy Invite Message]                      │    │
│  │                                             │    │
│  │ "Hey Bob! I'm using Discord for Spaces     │    │
│  │  Game notifications. Join me! [link]"      │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**After Round Submitted**:
```
┌─────────────────────────────────────────────────────┐
│  ✅ Board Submitted!                                 │
│                                                      │
│  ✅ You'll get a Discord notification when Bob      │
│     completes their turn!                           │
│                                                      │
│  Share this link with Bob:                          │
│  [📋 Copy Link]                                      │
│                                                      │
│  (Bob doesn't have Discord yet - they won't get     │
│   automatic notifications)                          │
└─────────────────────────────────────────────────────┘
```

---

#### State 3: Opponent Has Discord, You Don't
**ShareChallenge Component**:
```
┌─────────────────────────────────────────────────────┐
│        Challenge Ready!                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [📤 Send to Bob's Discord] ← Primary action        │
│                                                      │
│  [📋 Copy Link] ← Fallback                          │
│                                                      │
│  ✅ Bob will receive this on Discord automatically! │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ 💡 Want notifications too?                 │    │
│  │                                             │    │
│  │ Connect your Discord to get notified       │    │
│  │ when Bob responds!                         │    │
│  │                                             │    │
│  │ [Connect Discord]                          │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**After Round Submitted**:
```
┌─────────────────────────────────────────────────────┐
│  ✅ Board Submitted!                                 │
│                                                      │
│  Share this link with Bob:                          │
│  [📋 Copy Link]                                      │
│                                                      │
│  💡 Bob has Discord! You could auto-send this       │
│     challenge if you connect your account:          │
│     [Connect Discord]                               │
└─────────────────────────────────────────────────────┘
```

---

#### State 4: Both Have Discord (Optimal!)
**ShareChallenge Component**:
```
┌─────────────────────────────────────────────────────┐
│        Challenge Ready!                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [📤 Send via Discord] ← Primary, auto-sends        │
│                                                      │
│  [📋 Copy Link] ← Still available as fallback       │
│                                                      │
│  ✅ Challenge sent to Bob on Discord!               │
│  ✅ You'll be notified when Bob responds!           │
│                                                      │
│  Game on! 🎮                                        │
└─────────────────────────────────────────────────────┘
```

**After Round Submitted (During Game)**:
```
┌─────────────────────────────────────────────────────┐
│  ✅ Board Submitted!                                 │
│                                                      │
│  ✅ Bob has been notified on Discord!               │
│                                                      │
│  Watch for a Discord notification when Bob          │
│  completes their turn. Be ready for Round 2!        │
│                                                      │
│  [Close]                                            │
└─────────────────────────────────────────────────────┘
```

**After Final Round (Game Over)**:
```
┌─────────────────────────────────────────────────────┐
│  🏁 Game Complete!                                   │
│                                                      │
│  ✅ Bob has been notified on Discord!               │
│                                                      │
│  Watch for a Discord notification with the          │
│  final results and rematch option!                  │
│                                                      │
│  [View Results Now]  [Close]                        │
└─────────────────────────────────────────────────────┘
```

---

### Gradual Adoption Funnel

**The Natural Progression**:
```
Game 1: No Discord
  ├─> Manual copy/paste
  ├─> See "Connect Discord" suggestion
  ├─> Ignore it (that's fine!)
  └─> Play game normally

Game 2: Still No Discord
  ├─> Manual copy/paste again
  ├─> "You could save time with Discord..."
  ├─> Maybe click this time? Or skip again
  └─> No pressure

Game 3: One Player Connects
  ├─> Player A connects Discord
  ├─> Player A gets notifications! 🎉
  ├─> Player B sees "Player A uses Discord now!"
  ├─> Social proof → Player B more likely to connect
  └─> Asymmetric value delivered

Game 4+: Both Connected (Optimal)
  ├─> Automatic everything
  ├─> Best experience
  ├─> Higher retention
  └─> More games played
```

**Incentive Progression**:
1. **Game 1-2**: Awareness ("Discord exists")
2. **Game 3-5**: Curiosity ("What's Discord do?")
3. **Game 6-10**: Frustration ("Ugh, copy/paste again...")
4. **Game 11+**: Conversion ("Fine, I'll connect!")

**Accelerators**:
- Friend already uses Discord → faster conversion
- Playing many games → copy/paste fatigue sets in
- Sees opponent got notified faster → FOMO kicks in
- Achievement unlock for connecting → gamification works

---

## Why Discord Over Email?

| Factor | Discord | Email |
|--------|---------|-------|
| **Cost** | $0 (completely free) | $0 with free tier limits |
| **Speed** | Instant | Seconds to minutes |
| **Interactive** | ✅ Buttons, menus, reactions | ❌ Static links only |
| **Community** | ✅ Built-in (servers, channels) | ❌ Individual only |
| **Gaming Audience** | ✅ Natural fit | ⚠️ Universal but less engaged |
| **Real-time** | ✅ Live updates | ❌ Pull-based |
| **Setup Complexity** | Medium (OAuth + bot) | Medium (API + SMTP) |
| **User Barrier** | Low (gamers have Discord) | None (everyone has email) |
| **Future Potential** | ✅✅✅ High (slash commands, servers, bots) | ⚠️ Limited |

**Decision**: Discord aligns better with gaming audience and offers more growth opportunities.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Spaces Game Frontend                      │
│                    (GitHub Pages / Vercel)                    │
│                                                               │
│  - React game UI                                             │
│  - "Login with Discord" button                              │
│  - Game state management                                     │
└───────────────┬──────────────────────────────────────────────┘
                │
                │ (1) User clicks "Login with Discord"
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    Discord OAuth Flow                         │
│                   (Discord's servers)                         │
│                                                               │
│  - User authorizes app                                       │
│  - Returns authorization code                                │
└───────────────┬──────────────────────────────────────────────┘
                │
                │ (2) Auth code sent to backend
                ▼
┌──────────────────────────────────────────────────────────────┐
│                   Vercel Serverless API                       │
│                    (api.yoursite.com)                         │
│                                                               │
│  Endpoints:                                                  │
│  - POST /api/auth/discord (handle OAuth callback)           │
│  - POST /api/notify/challenge (send challenge notification) │
│  - POST /api/notify/round-complete (notify turn complete)   │
│  - GET  /api/user/profile (get Discord user info)           │
│                                                               │
│  Responsibilities:                                           │
│  - Exchange auth code for access token                       │
│  - Store Discord ID with user profile                        │
│  - Trigger bot actions (send DMs, update status)            │
└───────────────┬──────────────────────────────────────────────┘
                │
                │ (3) API tells bot to DM user
                ▼
┌──────────────────────────────────────────────────────────────┐
│                     Discord Bot                               │
│              (Railway / fly.io / Vercel)                      │
│                                                               │
│  Capabilities:                                               │
│  - Send DMs to users by Discord ID                          │
│  - Send embeds with challenge links                          │
│  - Interactive buttons ("Accept Challenge")                  │
│  - Slash commands (/challenge, /stats)                       │
│  - Server management (leaderboards, roles)                   │
│                                                               │
│  Libraries:                                                  │
│  - discord.js (Node.js Discord library)                      │
│  - Express (webhook endpoint for API → Bot communication)    │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Options

### Option 1: OAuth + Bot (Recommended)
**What**: Users log in with Discord, bot DMs them automatically.

**Pros**:
- ✅ Best user experience (one-click login)
- ✅ Automatic challenge delivery
- ✅ No manual setup for users
- ✅ Single sign-on (persistent identity)
- ✅ Enables future features (slash commands, server integration)

**Cons**:
- ❌ More complex implementation (OAuth + bot setup)
- ❌ Bot hosting required (though free options exist)
- ❌ ~1-2 weeks development time

**When to Use**: Production implementation, best long-term solution.

---

### Option 2: Webhooks Only (Quick Start)
**What**: Users paste their Discord webhook URL, challenges post to their channel.

**Pros**:
- ✅ Very simple implementation (~2-3 hours)
- ✅ No backend needed (direct browser → Discord)
- ✅ No bot hosting
- ✅ Good for testing/validation

**Cons**:
- ❌ Manual setup (users must create webhook)
- ❌ Posts to channel, not DMs
- ❌ No interactivity (just messages)
- ❌ Can't verify user identity
- ❌ Limited future potential

**When to Use**: Quick proof-of-concept, validate Discord demand.

---

### Option 3: Hybrid (Webhooks → OAuth)
**What**: Start with webhooks, migrate to OAuth later.

**Pros**:
- ✅ Fast initial validation
- ✅ Gradual complexity increase
- ✅ Can keep webhooks as fallback

**Cons**:
- ❌ Technical debt (two systems to maintain)
- ❌ Migration work later

**When to Use**: Uncertain about demand, want to test first.

---

## Recommended Approach: Phased Implementation

### Phase 1: Webhook Proof-of-Concept (1-2 days)
**Goal**: Validate that users want Discord integration.

**Tasks**:
1. Add optional `discordWebhook` field to Opponent type
2. Update OpponentManager UI with webhook input
3. Add "Send to Discord" button on ShareChallenge component
4. POST challenge notification to webhook
5. Test with personal Discord server

**Success Criteria**:
- ✅ Challenge posts to Discord channel
- ✅ Link is clickable and works
- ✅ Message is readable and attractive
- ✅ No errors in console

**Deliverable**: Working webhook integration, ready to gather feedback.

---

### Phase 2: Discord Bot Setup (2-3 days)
**Goal**: Create bot that can send DMs to users.

**Tasks**:
1. Create Discord application at https://discord.com/developers
2. Create bot user and get bot token
3. Set up bot project (discord.js)
4. Deploy bot to Railway/fly.io (free hosting)
5. Implement DM sending capability
6. Test DMs with your Discord account

**Success Criteria**:
- ✅ Bot is online and running
- ✅ Can DM users by Discord ID
- ✅ Rich embeds working
- ✅ Interactive buttons functional

**Deliverable**: Bot deployed and capable of sending challenge DMs.

---

### Phase 3: OAuth Integration (3-4 days)
**Goal**: Users can log in with Discord, linking their account.

**Tasks**:
1. Register OAuth application with Discord
2. Create Vercel API endpoints for OAuth flow
3. Implement "Login with Discord" button in frontend
4. Store Discord ID with user profile
5. Test OAuth flow end-to-end
6. Handle token refresh and errors

**Success Criteria**:
- ✅ Users can log in with Discord
- ✅ Discord ID stored in user profile
- ✅ Profile synced across devices
- ✅ Error handling works (denied permissions, etc.)

**Deliverable**: Working OAuth login, users linked to Discord accounts.

---

### Phase 4: Automated Challenge Delivery (2-3 days)
**Goal**: Challenges automatically DM opponents via Discord bot.

**Tasks**:
1. Create `/api/notify/challenge` endpoint
2. Frontend calls API when challenge created
3. API tells bot to DM opponent by Discord ID
4. Bot sends rich embed with challenge link
5. Add interactive "Accept Challenge" button
6. Test full flow with 2 Discord accounts

**Success Criteria**:
- ✅ Creating challenge triggers DM automatically
- ✅ DM received within 1-2 seconds
- ✅ Embed is attractive and informative
- ✅ Button click opens game correctly
- ✅ Works for both initiator and responder

**Deliverable**: End-to-end automated challenge delivery via Discord.

---

### Phase 5: Additional Notifications (2-3 days)
**Goal**: Notify users for other game events.

**Tasks**:
1. Round completion notifications
2. Game over notifications
3. Reminders for pending moves
4. Achievement unlocks
5. User preferences for notification types

**Success Criteria**:
- ✅ All event types trigger DMs
- ✅ Users can toggle notification types
- ✅ Rate limiting prevents spam
- ✅ Messages are clear and actionable

**Deliverable**: Full notification system via Discord DMs.

---

### Phase 6: Server & Community Features (Ongoing)
**Goal**: Build Discord server for Spaces Game community.

**Tasks**:
1. Create official Spaces Game Discord server
2. Set up channels (announcements, general, leaderboards)
3. Bot posts match results to server
4. Leaderboard auto-updates
5. Role progression (Beginner → Master)
6. Tournament support

**Success Criteria**:
- ✅ Server is active and welcoming
- ✅ Leaderboard updates automatically
- ✅ Roles assigned based on stats
- ✅ Community engagement metrics positive

**Deliverable**: Thriving Discord community for Spaces Game.

---

### Phase 7: Slash Commands (1-2 weeks)
**Goal**: Users can interact with game via Discord commands.

**Tasks**:
1. Register slash commands with Discord
2. Implement command handlers in bot
3. Commands: `/challenge`, `/stats`, `/leaderboard`, `/rematch`
4. Command responses with embeds and buttons
5. Error handling and validation

**Success Criteria**:
- ✅ All commands work reliably
- ✅ Responses are fast (<2 seconds)
- ✅ UI is intuitive and helpful
- ✅ Users prefer commands to web UI for simple tasks

**Deliverable**: Full slash command suite for game management.

---

## Technical Details

### Discord OAuth Flow

```
1. User clicks "Login with Discord"
   ↓
2. Redirect to Discord:
   https://discord.com/api/oauth2/authorize?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=https://yoursite.com/api/auth/discord/callback&
     response_type=code&
     scope=identify

3. User authorizes → Discord redirects back with code
   ↓
4. Backend exchanges code for access token:
   POST https://discord.com/api/oauth2/token
   Body: { code, client_id, client_secret, grant_type, redirect_uri }
   ↓
5. Get user info with access token:
   GET https://discord.com/api/users/@me
   Headers: { Authorization: Bearer ACCESS_TOKEN }
   ↓
6. Store Discord ID with user profile
   ↓
7. Frontend receives user data, login complete
```

### Discord Bot Architecture

**Technology Stack**:
- **Language**: TypeScript (Node.js)
- **Library**: discord.js v14
- **Hosting**: Railway.app (free tier) or fly.io
- **Database**: Not needed initially (stateless bot)

**Bot Responsibilities**:
1. Listen for API requests (send DM to user X)
2. Format message with embeds and buttons
3. Send DM via Discord API
4. Handle button interactions
5. Process slash commands (Phase 7)

**Bot Code Structure**:
```typescript
// bot/index.ts
import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages]
});

// Express server for receiving API requests
const app = express();
app.use(express.json());

// Endpoint: API → Bot communication
app.post('/send-dm', async (req, res) => {
  const { discordId, embed, components } = req.body;

  try {
    const user = await client.users.fetch(discordId);
    await user.send({ embeds: [embed], components });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
app.listen(3000);
```

### Vercel API Endpoints

**`/api/auth/discord/callback`**:
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  // Exchange code for token
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    }),
  });

  const { access_token } = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const user = await userResponse.json();

  // Return to frontend with user data
  res.redirect(`${process.env.FRONTEND_URL}/?discord_id=${user.id}&discord_username=${user.username}`);
}
```

**`/api/notify/challenge`**:
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { discordId, challengeUrl, senderName, boardSize } = req.body;

  // Call bot to send DM
  const botResponse = await fetch(`${process.env.BOT_URL}/send-dm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BOT_API_KEY}` // Secure bot endpoint
    },
    body: JSON.stringify({
      discordId,
      embed: {
        title: '🎮 Challenge Received!',
        description: `**${senderName}** has challenged you to a game of Spaces!`,
        color: 0x5865F2,
        fields: [
          { name: 'Board Size', value: `${boardSize}×${boardSize}`, inline: true },
          { name: 'Game Mode', value: 'Round-by-Round', inline: true }
        ],
        url: challengeUrl
      },
      components: [{
        type: 1,
        components: [{
          type: 2,
          style: 5,
          label: 'Accept Challenge',
          url: challengeUrl
        }]
      }]
    })
  });

  if (botResponse.ok) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
```

---

## Data Model Changes

### Update Opponent Type

```typescript
// src/types/opponent.ts
export type Opponent = {
  id: string;
  name: string;
  type: OpponentType;
  wins: number;
  losses: number;
  hasCompletedGame?: boolean;

  // NEW: Discord integration fields
  discordId?: string;          // Discord user ID (for OAuth + bot DMs)
  discordUsername?: string;    // Discord username (for display)
  discordWebhook?: string;     // Webhook URL (for webhook-only mode)
};
```

### Update User Profile Type

```typescript
// src/types/user.ts
export type UserProfile = {
  name: string;
  stats: UserStats;
  preferences?: UserPreferences;

  // NEW: Discord integration fields
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;      // Discord avatar URL
  discordNotifications?: {
    challenges: boolean;
    roundComplete: boolean;
    gameOver: boolean;
    achievements: boolean;
  };
};
```

---

## Hosting & Deployment

### Bot Hosting Options

#### Option 1: Railway.app (Recommended)
**Free Tier**:
- $5 credit per month (renews monthly)
- ~500 hours runtime (basically 24/7 for small bot)
- 1GB RAM, 1GB storage
- Perfect for Discord bots

**Setup**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Initialize project
railway init

# Deploy
railway up
```

**Pros**: Simple, generous free tier, great for bots
**Cons**: Credit-based (need to watch usage)

---

#### Option 2: fly.io
**Free Tier**:
- 3 shared-cpu VMs with 256MB RAM
- 160GB outbound transfer
- Enough for small Discord bot

**Setup**:
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Deploy
fly deploy
```

**Pros**: Very generous, global edge network
**Cons**: Slightly more complex than Railway

---

#### Option 3: Vercel (Experimental)
**Possibility**: Run bot as serverless functions

**Challenges**:
- Bots usually need persistent connection
- Serverless = ephemeral
- Would need webhook-based bot (not traditional connection)

**Verdict**: Probably not ideal for Discord bot, better for API

---

### Recommended Architecture

```
Frontend (GitHub Pages):
  - Static React app
  - No backend logic

API (Vercel Serverless):
  - OAuth endpoints
  - Notification triggers
  - Lightweight, stateless

Bot (Railway):
  - Persistent connection to Discord
  - Handles DMs and commands
  - Always-on service

Database (Future):
  - Not needed initially
  - If needed later: Railway Postgres or Vercel Postgres
```

---

## Security Considerations

### OAuth Secrets
- **Discord Client Secret**: Store in Vercel environment variables
- **Never expose in frontend**
- Use PKCE flow if possible (more secure)

### Bot Token
- **Discord Bot Token**: Extremely sensitive
- Store in Railway environment variables
- Never commit to Git
- Rotate if compromised

### Bot ↔ API Communication
- Secure bot webhook endpoint with API key
- Verify requests are from your API
- Use HTTPS only
- Rate limiting to prevent abuse

### User Data
- Store minimal Discord data (ID, username only)
- Respect Discord ToS (no data scraping)
- Allow users to disconnect Discord account
- Clear data on request (GDPR compliance)

---

## Cost Analysis

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | GitHub Pages | **Free** |
| API | Vercel | **Free** (100GB bandwidth) |
| Bot | Railway | **Free** ($5 credit/month) |
| Discord OAuth | Discord | **Free** |
| Discord Bot | Discord | **Free** |
| **Total** | | **$0/month** |

**Scalability**:
- Free tiers support 100s-1000s of users
- When outgrown, costs are minimal:
  - Railway: $5-10/month for more resources
  - Vercel: Still free for most use cases
  - Total: ~$5-10/month even with 10k+ users

---

## Comparison: Webhooks vs OAuth

| Feature | Webhooks | OAuth + Bot |
|---------|----------|-------------|
| **Setup Time** | 2-3 hours | 1-2 weeks |
| **User Setup** | Manual (paste URL) | **One-click** |
| **Delivery** | Channel post | **Private DM** |
| **Identity** | None | **Verified** |
| **Interactive** | No | **Yes (buttons)** |
| **Commands** | No | **Yes (/commands)** |
| **Community** | No | **Yes (server)** |
| **Future Potential** | Low | **Very High** |
| **Cost** | Free | Free |

**Verdict**: Webhooks for quick validation, OAuth for production.

---

## Migration Path

### Step 1: Webhooks (This Week)
- Quick implementation
- Gather user feedback
- Validate Discord demand
- **Decision point**: If popular, proceed to OAuth

### Step 2: Bot Development (Week 2)
- Set up Discord bot
- Deploy to Railway
- Test DM functionality
- **Decision point**: If bot works well, add OAuth

### Step 3: OAuth Integration (Week 3-4)
- Implement OAuth flow
- Connect frontend to bot
- Test end-to-end
- **Decision point**: If OAuth works, deprecate webhooks

### Step 4: Polish & Launch (Week 5)
- Refine UX
- Add error handling
- Write documentation
- **Public launch**

### Step 5: Community (Ongoing)
- Create Discord server
- Add slash commands
- Build community features
- **Continuous improvement**

---

## Success Metrics

### Phase 1 (Webhooks):
- **Target**: 10+ users set up webhooks
- **Metric**: % of users who try webhooks
- **Success**: >20% adoption rate

### Phase 2-4 (OAuth + Bot):
- **Target**: 50+ users log in with Discord
- **Metric**: OAuth login vs traditional
- **Success**: >50% of new users choose Discord login

### Phase 5 (Notifications):
- **Target**: 80%+ notification delivery success
- **Metric**: Notifications sent vs received
- **Success**: <5% error rate

### Phase 6 (Community):
- **Target**: 100+ members in Discord server
- **Metric**: Server growth rate
- **Success**: 10+ active daily users

### Phase 7 (Slash Commands):
- **Target**: 30%+ users try slash commands
- **Metric**: Command usage vs web UI
- **Success**: Commands feel natural, frequently used

---

## Risk Mitigation

### Risk 1: Discord Changes API
- **Likelihood**: Low (Discord is stable)
- **Impact**: High (could break integration)
- **Mitigation**: Follow Discord changelog, have email fallback ready

### Risk 2: Bot Hosting Costs Increase
- **Likelihood**: Medium (free tiers can change)
- **Impact**: Medium ($5-20/month is manageable)
- **Mitigation**: Monitor usage, have migration plan to cheaper host

### Risk 3: Users Don't Want Discord
- **Likelihood**: Low (gaming audience)
- **Impact**: High (wasted development)
- **Mitigation**: Start with webhooks to validate demand before OAuth

### Risk 4: OAuth Complexity Confuses Users
- **Likelihood**: Medium (OAuth can be confusing)
- **Impact**: Medium (lower adoption)
- **Mitigation**: Clear onboarding, tooltips, help docs

### Risk 5: Spam/Abuse of Bot
- **Likelihood**: Medium (if popular)
- **Impact**: Medium (rate limits, bans)
- **Mitigation**: Rate limiting, user reporting, moderation tools

---

## Open Questions

1. **Should we support both webhooks and OAuth long-term?**
   - Pro: Flexibility for users
   - Con: Maintenance burden
   - **Recommendation**: Phase out webhooks after OAuth is stable

2. **Create official Discord server from day 1 or wait?**
   - Pro early: Community from the start
   - Con early: Empty server is sad
   - **Recommendation**: Wait until 50+ OAuth users

3. **Allow users to disconnect Discord account?**
   - Required for privacy/GDPR
   - **Recommendation**: Yes, add "Disconnect" button in settings

4. **What if both players don't have Discord?**
   - Fallback to URL copying (current behavior)
   - Encourage Discord adoption with benefits
   - **Recommendation**: Discord optional, not required

5. **Should Discord login replace manual name entry?**
   - Pro: Simpler, verified identity
   - Con: Requires Discord account
   - **Recommendation**: Discord login optional, name entry fallback

---

## Next Steps

1. ✅ **This Document**: Finalize plan and get approval
2. **Start Phase 1**: Implement webhook proof-of-concept
3. **Test & Gather Feedback**: See if users want Discord
4. **Decision**: Proceed to Phase 2 (bot) or pivot
5. **Iterate**: Based on user feedback and metrics

---

## Resources

**Discord Developer Docs**:
- OAuth2: https://discord.com/developers/docs/topics/oauth2
- Bot Guide: https://discord.com/developers/docs/getting-started
- Embeds: https://discord.com/developers/docs/resources/channel#embed-object

**Libraries**:
- discord.js: https://discord.js.org/
- OAuth libraries: passport-discord, discord-oauth2

**Hosting**:
- Railway: https://railway.app/
- fly.io: https://fly.io/
- Vercel: https://vercel.com/

**Examples**:
- Discord OAuth example: https://github.com/discord/discord-example-app
- Bot examples: https://github.com/discordjs/discord.js/tree/main/packages/discord.js/examples

---

**Document Version**: 1.0
**Last Updated**: 2025-12-29
**Status**: Planning
**Next Review**: After Phase 1 completion
