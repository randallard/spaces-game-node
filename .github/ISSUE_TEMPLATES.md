# GitHub Issues to Create

## Issue 1: Discord Score Bug (Priority: High)

**Title:** `fix: Discord round-complete notifications show incorrect scores (0-0)`

**Labels:** `bug`, `discord`, `priority:high`

**Body:**
```markdown
## Problem
Discord round-complete notifications are showing incorrect scores (0-0) instead of the actual cumulative scores after each round.

### Example
After Round 2 where player won 3-1:
- Expected: "Current Score: 3 - 1"
- Actual: "Current Score: 0 - 0"

## Root Cause
In `src/App.tsx` line 1966-1967, the notification uses `playerScore` and `opponentScore` from the closure, but these are stale values because `completeRound(result)` is an async state update that hasn't completed yet.

## Solution
✅ Fix implemented - Calculate scores directly from the `completeRounds` array:

```typescript
const updatedPlayerScore = completeRounds.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0);
const updatedOpponentScore = completeRounds.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0);
```

## Status
- ✅ Fix implemented in local branch
- ⏳ Needs testing
- ⏳ Needs deployment to Railway

## Test Plan
1. Start a game with Discord-connected opponent
2. Complete Round 1 and Round 2
3. Check Discord notification after Round 2
4. Verify scores shown match actual cumulative scores

## Files Changed
- `src/App.tsx` (lines ~1960-1970)
```

---

## Issue 2: Smart Navigation for Viewed Results (Priority: Medium)

**Title:** `feat: Skip to board selection if round results already viewed`

**Labels:** `enhancement`, `ux`, `discord`

**Body:**
```markdown
## User Story
As a player, when I click a Discord "turn ready" notification link, I want to skip the round results screen if I've already viewed it, so I can get straight to choosing my board.

## Current Behavior
1. Discord: "Round 2 Complete" → Click link → See Round 2 results ✅
2. Discord: "Your Turn - Round 3" → Click link → See Round 2 results again ❌
3. User must click "Continue" to get to board selection

## Desired Behavior
1. Discord: "Round 2 Complete" → Click link → See Round 2 results ✅
2. Discord: "Your Turn - Round 3" → Click link → **Skip straight to board selection** ✅

## Implementation Ideas
Check localStorage/roundHistory to see if:
- Round results already exist for this round
- User has already viewed results (maybe track view timestamps?)

If round is already viewed, derive phase directly to `board-selection` instead of `round-results`.

## Acceptance Criteria
- [ ] Clicking "round-complete" link always shows results (first time viewing)
- [ ] Clicking "turn-ready" link for next round skips results if already viewed
- [ ] Works correctly for both initiator and responder
- [ ] Does not break existing URL sharing functionality

## Files Likely Affected
- `src/App.tsx` - URL parsing and phase derivation logic
- `src/utils/derive-state.ts` - Phase derivation from roundHistory
- `src/utils/challenge-url.ts` - Challenge URL parsing
```

---

## Issue 3: Headless/API Mode for Reinforcement Learning (Priority: High)

**Title:** `feat: Add headless API mode for RL agent training`

**Labels:** `feature`, `ai`, `api`, `priority:high`

**Body:**
```markdown
## Goal
Enable reinforcement learning agents to play Spaces Game programmatically without needing a browser/UI.

## Requirements

### 1. Headless Game API
Create REST/GraphQL API endpoints for:
- **Create Game**: Start a new game session
- **Get Game State**: Retrieve current game state
- **Select Board**: Submit board selection for current round
- **Get Valid Actions**: List available boards/moves
- **Simulate Round**: Execute round and get results

### 2. Game State Format
Return structured game state suitable for RL:
```json
{
  "gameId": "uuid",
  "currentRound": 1,
  "phase": "board-selection",
  "playerScore": 0,
  "opponentScore": 0,
  "availableBoards": [...],
  "roundHistory": [...]
}
```

### 3. Batch Training Support
- Create multiple game instances concurrently
- Reset games quickly for iterative training
- Track training metrics (win rate, avg score, etc.)

### 4. RL Agent Interface
Python client library for agents:
```python
from spaces_game import SpacesGameClient, RandomAgent

client = SpacesGameClient(api_url="http://localhost:3001")
agent = RandomAgent()

game = client.create_game(board_size=2)
while not game.is_complete():
    action = agent.select_action(game.get_state())
    game.submit_action(action)

print(f"Final score: {game.player_score} - {game.opponent_score}")
```

## Architecture Options

### Option A: Extend Existing Vercel API
- Add `/api/game/*` endpoints
- Reuse existing game simulation logic
- Store game state in Vercel KV or external DB

### Option B: Separate Training Server
- New Node.js/Python service for training
- Direct access to game logic (no HTTP overhead)
- Better for high-throughput training

### Option C: WebSocket Real-time API
- Bidirectional communication
- Real-time game state updates
- Lower latency for agent decisions

## Implementation Phases

### Phase 1: Core API (MVP)
- [ ] Create game endpoint
- [ ] Submit board selection endpoint
- [ ] Get game state endpoint
- [ ] Simulate round endpoint

### Phase 2: Python Client
- [ ] Python SDK for API
- [ ] Example random agent
- [ ] Training loop helpers

### Phase 3: RL Integration
- [ ] Gym environment wrapper
- [ ] Reward function design
- [ ] State representation for neural networks
- [ ] Action space encoding

### Phase 4: Advanced Features
- [ ] Self-play support
- [ ] Tournament mode (agents vs agents)
- [ ] Training metrics dashboard
- [ ] Leaderboard for agent performance

## Success Criteria
- [ ] Agent can play 1000+ games/minute
- [ ] API is stateless and scalable
- [ ] Training runs don't interfere with production users
- [ ] Easy to plug in different RL algorithms (DQN, PPO, A3C, etc.)

## References
- OpenAI Gym: https://gymnasium.farama.org/
- Reinforcement Learning algorithms: https://spinningup.openai.com/
- Similar projects: AlphaZero, OpenSpiel

## Questions
- What RL algorithm should we target first? (DQN, PPO, A3C?)
- Should we use existing game simulation or rewrite in Python for speed?
- Do we need GPU support for training?
- Where should training data/models be stored?
```

---

## Issue 4: Intermittent DNS Failure for Railway Bot (Priority: Low)

**Title:** `bug: Intermittent DNS resolution failure for Railway bot notifications`

**Labels:** `bug`, `network`, `monitoring`

**Body:**
```markdown
## Problem
Occasional DNS resolution failure when sending Discord notifications to Railway bot:

```
Error: getaddrinfo ENOTFOUND spaces-game-bot-production.up.railway.app
```

## Observed Behavior
- Most notifications succeed ✅
- Occasionally (1 in ~10?), round-complete notification fails with DNS error
- Subsequent notifications work fine (DNS resolves)

## Example Timeline
```
19:25:52 - round-complete notification fails (DNS error)
19:26:45 - turn-ready notification succeeds ✅
```

## Potential Causes
1. **Transient network issue** - Temporary DNS resolution failure
2. **Railway domain propagation** - DNS updates not fully propagated
3. **Local DNS cache** - Stale DNS cache on local machine
4. **Rate limiting** - Too many requests to Railway domain?

## Recommendations

### Short-term (Monitor)
- Track frequency of failures over next week
- Log full error details (timestamp, request, response)
- Check if failures correlate with specific times/patterns

### Medium-term (Resilience)
- Add retry logic (1-2 retries with exponential backoff)
- Add timeout handling (5s timeout)
- Fallback to IP address if DNS fails repeatedly

### Long-term (Custom Domain)
- Consider custom domain for bot (more stable DNS)
- Add health check monitoring (uptime alerts)

## Implementation
```typescript
// Add retry logic to sendDiscordNotification
async function sendDiscordNotificationWithRetry(
  opponent: Opponent,
  eventType: string,
  data: any,
  retries = 2
): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await sendDiscordNotification(opponent, eventType, data);
    } catch (error) {
      if (i === retries) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
  return null;
}
```

## Status
⏳ Monitoring for frequency
⏳ Will implement retry logic if failures are common (>5%)

## Files Affected
- `src/utils/discord-helpers.ts` (or wherever sendDiscordNotification lives)
```

---

# How to Create These Issues

1. Go to: https://github.com/randallard/spaces-game-node/issues/new
2. Copy the title and body from above
3. Add the specified labels
4. Click "Submit new issue"

Or use GitHub CLI if authenticated:
```bash
gh issue create --title "..." --body "..." --label "bug,discord"
```
