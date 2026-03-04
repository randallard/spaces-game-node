# Agent vs Agent / MCP / LLM / API — Ideas & Discussion

Brainstorming document for expanding Spaces Game to support agent-vs-agent play, bring-your-own-model, LLM-as-agent via MCP, and a chat expert system.

---

## 1. Agent vs Agent (RL Model vs RL Model)

**Status:** High interest, technically straightforward.

Two trained RL models play a full 5-round match against each other. No human interaction needed during the match — just set it up and watch (or review results).

### How It Would Work

- Both agents use the existing `POST /construct-board` inference API
- Each round: Agent A constructs a board → Agent B constructs a board → simulate → record result
- The game orchestrator alternates who "goes first" per round (same rules as human games)
- Opponent history from each round feeds into both agents' next construction step
- Final score determines the winner

### Key Decisions

- **Where does it run?** Client-side (browser orchestrates API calls) or server-side (dedicated match engine)?
  - Client-side: simpler, no new infrastructure, but slower (round-trip per board)
  - Server-side: faster, could run batch tournaments, but needs new service
- **Visualization:** Replay the match with simulation animations? Or just show results?
- **Fog-only models:** Only Stage 4 (fog of war) models participate — Stage 3 (full reveal) models are being phased out. This simplifies the observation space question since all agents share the same partial-information view.

### Fun Extensions

- **Leaderboard / tournament brackets** — run round-robin or elimination tournaments
- **Live spectating** — watch agent matches in real-time with commentary (see Chat Agent section below)
- **Model comparison** — "My advanced fog model vs your intermediate fog model, 100 matches, go"

---

## 2. Standardized API Interface (Bring Your Own Model)

**Status:** Strong candidate for enabling external models. Preferred over model upload for security reasons.

### The Concept

Define a simple HTTP API contract that any external model server must implement. Users host their own inference server (wherever they want) and register its URL with the game.

### API Contract (Draft)

External servers would implement a single endpoint that mirrors our existing inference API:

```
POST /construct-board

Request:
{
  "board_size": 3,
  "round_num": 0,           // 0-indexed (0-4)
  "agent_score": 0.0,
  "opponent_score": 0.0,
  "opponent_history": [      // Previous rounds' opponent boards (fog-filtered)
    {
      "sequence": [
        { "row": 0, "col": 1, "type": "piece", "order": 1 },
        { "row": 1, "col": 0, "type": "trap", "order": 2 }
      ]
    }
  ]
}

Response:
{
  "board": {
    "sequence": [
      { "position": { "row": 0, "col": 0 }, "type": "piece", "order": 1 },
      { "position": { "row": 1, "col": 1 }, "type": "trap", "order": 2 },
      { "position": { "row": 0, "col": 1 }, "type": "piece", "order": 3 }
    ],
    "boardSize": 3
  }
}
```

### Advantages

- **No pickle risk** — we never load their model files, just call their API
- **Language agnostic** — they can implement in Python, Rust, JavaScript, whatever
- **LLM-compatible** — an LLM-based agent can implement the same interface
- **Fog-only simplification** — `opponent_history` only contains fog-filtered data (moves visible up to where your piece stopped + the sprung trap). External models only need to handle the fog observation space.

### Validation & Security

- Server-side board validation (already exists) catches invalid boards
- Rate limiting on API calls
- Timeout on external server responses (e.g., 10 seconds per board)
- CORS / allowlisting for registered servers
- Max retry attempts (currently 5) before forfeiting the round

### Open Questions

- How do users register their server URL? UI in the game? Config file?
- Do we proxy requests through our server (adds latency, but controls access) or call directly from the browser (faster, but CORS issues)?
- How do we handle external server downtime mid-match?

---

## 3. LLM-as-Agent via MCP (Tyler's Challenge)

**Status:** Exploratory. Cool proof-of-concept, but not top priority.

### The Idea

Instead of a trained RL model, use an LLM (Claude, GPT, etc.) to play the game. The LLM would receive the game state as context and use tool calls to construct boards move-by-move.

### How MCP Fits In

MCP (Model Context Protocol) is a standardized way for LLMs to call external tools. Two possible architectures:

#### Option A: Game as MCP Server

The Spaces Game exposes itself as an MCP server with tools like:

```
Tools:
  - get_game_state()          → current round, scores, opponent history
  - get_valid_actions()       → list of valid next moves
  - place_piece(row, col)     → place a piece at position
  - place_trap(row, col)      → place a trap at position
  - submit_board()            → finalize and submit the constructed board
  - get_game_rules()          → return game rules and strategy tips
```

An LLM client (Claude Desktop, a custom agent, etc.) connects to this MCP server and plays the game through tool calls. The LLM reasons about strategy using its general intelligence.

**Pros:** Leverages existing MCP ecosystem. Tyler could literally open Claude Desktop, connect the MCP server, and start playing.

**Cons:** Requires someone to run the MCP server. Each move costs LLM API tokens. Quality depends heavily on prompt engineering.

#### Option B: LLM Agent Implements the Standardized API

The LLM agent wraps itself behind the same `POST /construct-board` HTTP interface from Section 2. Internally, it:

1. Receives the game state (board size, round, opponent history)
2. Formats it as a prompt for the LLM
3. LLM reasons about optimal board construction
4. Parses the LLM response into a valid board
5. Returns it via the API

**Pros:** Fits into the same infrastructure as RL models. No special MCP integration needed on the game side.

**Cons:** More work for the person building the LLM agent. Slower per-move (LLM inference). Potential for invalid boards requiring retries.

### Tyler's Challenge: MCP vs RL

The interesting experiment: can an LLM (with access to game rules and opponent history) outperform a purpose-trained RL agent?

**Arguments for RL:**
- Trained specifically on this game through millions of episodes
- Action masking prevents illegal moves entirely
- Sub-millisecond inference
- Consistent performance (deterministic mode)

**Arguments for LLM:**
- General reasoning about opponent patterns
- Can adapt strategy mid-game without retraining
- Could potentially read and reason about complex board patterns
- Might discover creative strategies an RL agent wouldn't explore

**Likely outcome:** RL wins on mechanical execution (never makes invalid moves, optimized through millions of games). LLM *might* show more creative/adaptive strategy but will be slower and more expensive. Would be fun to test.

---

## 4. Chat Expert / Game Guide Agent

**Status:** High interest. Could serve multiple purposes.

### The Concept

A chat agent (LLM-powered) that:

1. **Introduces new players to the game** — explains rules, strategy basics, board construction
2. **Answers questions** — "What happens if both pieces collide?" "How do traps work?"
3. **Commentates on matches** — narrate agent-vs-agent games in real-time
4. **Coaches players** — analyze a player's board and suggest improvements

### Implementation Options

#### Option A: Knowledge Base + RAG

- Extract game rules from `validation.py`, `simulation.py`, game docs
- Build a knowledge base of rules, strategies, and FAQs
- Use RAG to give an LLM accurate, grounded answers

#### Option B: MCP-Powered Expert

- Build an MCP server that exposes game knowledge as resources
- Connect to Claude or another LLM
- The LLM can query game rules, look up scoring, simulate scenarios

#### Option C: Embedded Chat in Game UI

- Chat widget in the game interface
- Pre-loaded with game context
- Could use the Standardized API to understand the current game state

### Commentary for Agent vs Agent Matches

When two agents play, the chat expert could:
- Explain each board's strategy in plain language
- Predict outcomes before simulation runs
- Highlight interesting patterns ("Agent A is adapting to Agent B's trap placement from round 2!")
- Provide color commentary like a sports announcer

### Informing Tyler's MCP Agent

The chat expert's knowledge base could double as a strategy guide that Tyler's LLM agent reads before playing. If the game rules and strategies are well-documented and accessible via MCP, Tyler's agent could:

1. Connect to the game knowledge MCP server
2. Read all rules and strategy tips
3. Connect to the game play MCP server
4. Play with informed strategy

---

## 5. Implementation Priority / Roadmap Thoughts

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Agent vs Agent (our models) | Low | Fun demo, validation | High |
| Standardized API Interface | Medium | Enables external models | High |
| Chat Expert / Game Guide | Medium | UX, onboarding | Medium |
| LLM-as-Agent (MCP) | Medium-High | Tyler's challenge, novelty | Low-Medium |
| Model Upload (pickle) | Medium | Convenience | Low (security risk) |
| Match Commentary | High | Entertainment | Low (depends on chat expert) |

### Suggested Sequence

1. **Agent vs Agent** — prove two models can play each other through the existing API
2. **Standardized API spec** — formalize the contract, document it, add external server registration
3. **Chat Expert** — build game knowledge base, deploy as a chat widget or MCP server
4. **MCP Game Server** — expose game as MCP tools for Tyler's challenge
5. **Commentary** — layer on top of agent-vs-agent + chat expert

---

## 6. Fog-Only Simplification

All new work targets **Stage 4 (fog of war) only**. This means:

- External models only receive fog-filtered opponent history
- The observation space is standardized around partial information
- Stage 3 (full reveal) models are being phased out
- This is more realistic and prevents agents from having perfect information

The `opponent_history` in the API contract will only contain:
- Opponent piece moves visible up to where the agent's piece stopped
- The trap that was sprung (if the agent hit one)
- Everything else is hidden

This makes the challenge fairer and more interesting for both RL and LLM agents.
