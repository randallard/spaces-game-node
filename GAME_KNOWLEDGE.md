# Spaces Game — Complete Knowledge Base

This document is the single source of truth for the Spaces Game, designed to be consumed by an LLM game expert. It covers rules, mechanics, strategy, and technical details.

---

## What Is Spaces Game?

Spaces Game is a two-player abstract strategy game where players race to reach the goal while strategically placing traps to slow down their opponent. Each player designs a board (a pre-planned sequence of moves and traps), and both boards are executed simultaneously, step by step. The game rewards both speed (reaching the goal quickly) and cunning (trapping your opponent).

---

## The Board

- **Grid**: An N×N grid (supported sizes: 2×2, 3×3, 4×4, 5×5)
- **Starting Position**: Your piece starts at the bottom row (row N-1) at any column you choose
- **Goal**: Reach row -1 (one square above the top edge of the board)
- **Rotation**: Your opponent's board is rotated 180° — they're coming from the opposite side

### Coordinate System

- Origin (0,0) is top-left
- Row 0 = top row, Row N-1 = bottom row
- Row -1 = the goal (above the board)
- "Forward" = decreasing row number (moving toward row 0 and then to -1)

---

## Moves

Each board is a **sequence of moves** executed in order. There are three types:

### 1. Piece Movement (`piece`)
- Move your piece to an adjacent square (up, down, left, or right)
- **No diagonal moves** — orthogonal only
- **No jumping** — exactly 1 square per move
- Cannot move into a square containing one of your own traps

### 2. Trap Placement (`trap`)
- Place a trap on a square **adjacent** to your piece (up, down, left, right)
- **OR** place a trap on your piece's **current square** — this is called a **supermove**
- After a supermove, the very next action **must** be a piece movement (you can't stay put or place another trap)
- No duplicate traps on the same square
- Traps are invisible to your opponent until triggered

### 3. Final Move (`final`)
- Moving to row -1 (the goal)
- This ends your sequence
- The final move does not require adjacency — you can reach the goal from any column at row 0

---

## Legal Board Rules

A valid board must satisfy all of these:

1. Start at the bottom row (row = boardSize - 1)
2. Only move orthogonally (no diagonals)
3. Never revisit a square (no loops)
4. Never move backward (away from goal — row number must not increase during piece moves, except for lateral moves on the same row)
5. Place traps only adjacent to current position (or at current position for supermove)
6. After a supermove, the next action must be a piece movement
7. No duplicate traps on the same position
8. At row 0, the next move must be to the goal (no lateral moves or additional traps from the top row)
9. End with a final move to the goal (row -1)

---

## Simultaneous Execution

Both players' boards are executed **step by step at the same time**:

- Step 1: Both players execute their first move
- Step 2: Both players execute their second move
- And so on...

### Round Ending Conditions

The round ends immediately when any of these occur:
- **Goal reached**: A player's piece reaches row -1
- **Collision**: Both pieces occupy the same square at the same time
- **Trap hit**: A player's piece lands on a square where the opponent placed a trap
- **Sequences complete**: Both players have no more moves

If the round ends early, any remaining moves in both sequences are **not executed**. This is important for the fog of war mechanic.

---

## Scoring

### Points Gained
- **+1 point** for each forward move (each new row reached — only counts the first time you visit a row)
- **+1 point** for reaching the goal

### Points Lost
- **-1 point** for hitting an opponent's trap (score cannot go below 0)
- **-1 point** for collision — **both** players lose 1 point (score cannot go below 0)

### Round Winner
- The player with the higher score wins the round
- Equal scores = tie

---

## Game Structure (Round-by-Round Mode)

A full game consists of **5 rounds**. The player with the highest total score across all 5 rounds wins.

### Turn Order

Board selection order alternates each round:

| Round | Who selects first | Who responds |
|-------|-------------------|--------------|
| 1     | Game creator (Player 1) | Player 2 |
| 2     | Player 2 | Player 1 |
| 3     | Player 1 | Player 2 |
| 4     | Player 2 | Player 1 |
| 5     | Player 1 | Player 2 |

**Pattern**: Odd rounds (1, 3, 5) → game creator goes first. Even rounds (2, 4) → opponent goes first.

The player who selects first commits their board without knowing what the opponent will play. The responding player sees the challenge (but **not** the opponent's board — just that it's their turn to select) and picks their board.

### Challenge URLs

When a player selects their board, they share a challenge URL with their opponent. The URL contains only the sender's board for the current round — not future rounds, and not the opponent's board. The responding player loads this URL to see it's their turn and select their own board.

---

## Fog of War

After a round is played, players can review the results. However, they can only see the opponent's moves that **actually happened** during the round.

### What You Can See
- Opponent piece moves up to the step where the round ended
- The trap that hit you (if you triggered one)

### What Stays Hidden
- Opponent moves that were planned but never executed (because the round ended early)
- Opponent traps that were never triggered
- The opponent's full intended sequence

### Example
If your opponent planned 5 moves but you reached the goal after step 2, you'll only see their first 2 moves. Their remaining 3 moves and any traps placed after step 2 stay completely hidden.

### Strategic Significance
Fog of war prevents you from gaining full information about your opponent's strategy. You can't see traps you didn't trigger, so you have to **infer** your opponent's tendencies from the partial information revealed across multiple rounds.

---

## Strategy Guide

### Beginner Tips

1. **Reach the goal** — the most reliable source of points. A simple, fast path to the goal is a solid starting point.
2. **Forward moves score points** — every new row you reach is +1. Don't waste too many moves going sideways unless there's a good reason.
3. **Place at least one trap** — even one well-placed trap can cost your opponent a point and end the round early before they score more.
4. **Watch for collisions** — if you and your opponent start in the same column, you might collide. Consider starting in a different column or using lateral moves to dodge.

### Intermediate Concepts

#### Speed vs. Safety Tradeoff
- **Fast boards** (few traps, direct path) score more points from forward movement but don't slow down the opponent
- **Trap-heavy boards** (multiple traps, winding path) score fewer points from movement but can neutralize the opponent's score
- The best boards balance both — score well AND place effective traps

#### Trap Placement Heuristics
- **Anticipate the opponent's path**: Where would you move if you were them? Put traps there.
- **Center column traps** are statistically more likely to be triggered on 3×3 boards because there are fewer paths that avoid the center
- **Row 0 and row 1 traps** are high-value because they catch opponents near the goal, after they've already accumulated points
- **Supermove traps** on the starting position can catch opponents who start in the same column, but cost you an extra move

#### Column Selection
- Your starting column determines your available paths
- On a 3×3 board, starting in the center (column 1) gives the most flexibility but is also the most predictable
- Edge starts (column 0 or 2) limit your options but are harder for opponents to predict

### Advanced Concepts

#### Opponent History Reading
- After each round, study the partial information revealed about your opponent's board
- Look for patterns: do they favor the same column? Do they always place traps in certain positions?
- Adapt your board design in later rounds based on what you've learned

#### Fog Exploitation
- Under fog of war, your opponent can't see traps they didn't trigger — this means placing traps in "backup" positions (where they'd go if they avoided your primary trap) is less valuable information-wise but still useful tactically
- You can use this to set up deceptive patterns: show a predictable strategy in early rounds, then change it up when your opponent adapts

#### Board Archetypes
- **The Sprinter**: Minimal traps, maximum forward moves. Wins by outscoring through speed.
- **The Trapper**: Heavy trap coverage, sacrificing some forward progress. Wins by denying opponent points.
- **The Balanced**: One or two traps along a moderately fast path. Most common and most reliable.
- **The Supermover**: Uses supermove(s) to cover unexpected positions. Higher risk, harder to predict.

---

## AI Opponents

The game includes AI opponents trained using reinforcement learning (Stable Baselines 3, PPO algorithm). AI opponents have different skill levels:

| Skill Level | Description |
|-------------|-------------|
| Beginner | Early training checkpoint, random sampling — makes suboptimal but legal moves |
| Beginner+ | Early checkpoint, deterministic — consistently plays the early-training strategy |
| Intermediate | Mid-training checkpoint, random sampling — decent strategy with some variation |
| Intermediate+ | Mid checkpoint, deterministic — consistently plays mid-level strategy |
| Advanced | Latest checkpoint, random sampling — strong strategy with some exploration |
| Advanced+ | Latest checkpoint, deterministic — best consistent play |

AI opponents construct boards using the same rules as human players. They receive the fog-filtered opponent history from previous rounds and use their trained policy to design boards.

---

## Technical Details (Developer Mode)

### Inference API

AI opponents are served by a Python inference server (`POST /construct-board`) that:
- Takes board size, round number, scores, and fog-filtered opponent history
- Returns a valid board sequence
- Retries up to 5 times if the model produces an invalid board
- Supports model selection by stable model ID

### Observation Space (Fog / Stage 4)

The AI agent observes:
- `building_board`: The board being constructed (N×N×2 — piece channel + trap channel)
- `construction_step`: Current step count
- `round`: Current round (0-4)
- `score_diff`: Agent score minus opponent score
- `agent_score` / `opponent_score`: Individual scores
- `opponent_history`: Previous rounds' opponent boards (fog-filtered, rotated 180°)
- `fog_outcomes`: Per-round outcome signals (6 features: visible moves, sprung trap info)

### Board Validation

Boards are validated by both the TypeScript game engine and the Python environment. The rules are identical in both implementations. Invalid boards are rejected and the AI retries with a different random seed.

---

## Glossary

| Term | Definition |
|------|------------|
| **Board** | A pre-planned sequence of moves and traps on an N×N grid |
| **Sequence** | The ordered list of actions (piece moves, traps, final) defining a board |
| **Supermove** | Placing a trap on your piece's current position (requires immediate movement afterward) |
| **Forward Movement** | Moving closer to the goal (decreasing row number) |
| **Lateral Movement** | Moving left or right (same row) |
| **Collision** | Both pieces occupying the same square at the same step — both lose 1 point |
| **Fog of War** | Partial information — you only see opponent moves that were executed before the round ended |
| **Round** | One complete simultaneous execution of both players' boards |
| **Game** | A series of 5 rounds; highest total score wins |
| **Game Creator** | The player who initiated the game (selects first in odd rounds) |
| **Challenge URL** | A link containing one player's board, sent to the other player to respond |
| **Rotation** | Opponent boards are flipped 180° — they approach from the opposite side of the grid |
| **Action Masking** | RL training technique that prevents the agent from choosing invalid moves |
