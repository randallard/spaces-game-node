# Spaces Game - Game Description

## Overview

Spaces Game is a two-player abstract strategy game where players race to reach the goal while strategically placing traps to slow down their opponent. Each player selects a pre-designed board (a sequence of moves) and both boards are executed simultaneously, step by step.

## Core Concepts

### The Board

- **Grid**: An N×N grid (typically 2-5, supports up to 100)
- **Starting Position**: Pieces start at the bottom row at any column
- **Goal**: Reach row -1 (one square above the top edge)
- **Rotation**: Opponent's board is rotated 180° (mirrored perspective)

### Moves

Each board is a **sequence of moves** executed in order:

1. **Piece Movement** (`piece`)
   - Move to an adjacent orthogonal square (up/down/left/right)
   - Cannot move diagonally
   - Cannot revisit previously visited squares
   - Should generally move toward the goal (forward progress)

2. **Trap Placement** (`trap`)
   - Place a trap on an adjacent square
   - OR place a trap on current square (supermove)
   - After a supermove, the next move MUST be a piece movement

3. **Final Move** (`final`)
   - Reaching the goal (row -1)
   - Ends the board sequence

### Simultaneous Execution

Both players' boards are executed **step-by-step simultaneously**:

- Step 1: Both players execute their first move
- Step 2: Both players execute their second move
- And so on...

The round ends when:
- A player reaches the goal
- Players collide (occupy same square)
- A player hits an opponent's trap
- Both sequences complete

## Scoring

### Points Gained
- **+1 point**: Each forward move (decreasing row number)
- **+1 point**: Reaching the goal

### Points Lost
- **-1 point**: Hitting opponent's trap (minimum 0)
- **-1 point**: Collision (both players lose 1, minimum 0)

### Winner Determination
- Highest score wins
- Tie if scores are equal

## Game Flow Example

### Setup (Size 3 Board)

**Player Board:**
```
Starting position: (2, 1)  [bottom row, middle column]

Sequence:
1. Move to (1, 1)    [piece - forward]
2. Move to (0, 1)    [piece - forward]
3. Trap at (0, 0)    [trap - adjacent]
4. Move to (-1, 1)   [final - goal!]
```

**Opponent Board (rotated 180°):**
```
Original position: (2, 0)
Rotated position: (0, 2)  [from opponent's view]

Sequence:
1. Move to (1, 0)    [piece - forward]
2. Trap at (1, 1)    [trap - adjacent]
3. Move to (0, 0)    [piece - forward]
4. Move to (-1, 0)   [final - goal!]
```

### Simulation (Step by Step)

**Step 1:**
- Player moves (2,1) → (1,1) [+1 point, forward movement]
- Opponent moves (0,2) → (1,2) [+1 point, forward movement]
- Score: Player 1, Opponent 1

**Step 2:**
- Player moves (1,1) → (0,1) [+1 point, forward movement]
- Opponent places trap at (1,1)
- Score: Player 2, Opponent 1

**Step 3:**
- Player places trap at (0,0)
- Opponent moves (1,2) → (0,2)
  - But wait! There's no trap at (0,2) yet, opponent is safe
- Score: Player 2, Opponent 1

**Step 4:**
- Player moves to (-1,1) [+1 point, goal reached]
- Round ends (player reached goal)
- Final Score: Player 3, Opponent 1
- **Winner: Player**

## Strategic Depth

### Board Design Strategy

1. **Speed vs. Safety**: Direct path is fastest but predictable
2. **Trap Placement**: Anticipate opponent's likely moves
3. **Column Selection**: Starting column affects available moves
4. **Supermoves**: Risk/reward of placing trap on current position

### Key Tactical Considerations

- **Simultaneous Timing**: Traps take effect immediately when placed
- **Collision Avoidance**: Both players lose points on collision
- **Forward Progress**: More forward moves = more points
- **Trap Anticipation**: Predict opponent's path to place effective traps

## Legal Board Rules

A legal opponent board must:

1. ✅ Start at bottom row (row = boardSize - 1)
2. ✅ Only move orthogonally (no diagonals)
3. ✅ Never revisit a square (no loops)
4. ✅ Never move backward (away from goal)
5. ✅ Place traps only adjacent to current position
6. ✅ After supermove (trap on current square), next move must be piece movement
7. ✅ No duplicate traps (same position twice)
8. ✅ At row 0, next move must be to goal (no lateral moves or traps)
9. ✅ End with final move to goal (row -1)

## Game Modes

### Round-by-Round (1v1)
- 5 rounds total
- Turn order alternates each round:
  - **Round 1**: Player 1 selects board first → Player 2 responds
  - **Round 2**: Player 2 selects first → Player 1 responds
  - **Round 3**: Player 1 selects first → Player 2 responds
  - **Round 4**: Player 2 selects first → Player 1 responds
  - **Round 5**: Player 1 selects first → Player 2 responds
- Total points across 5 rounds determines winner

### Deck Mode (Tournament)
- Players submit 10 boards each (deck)
- Boards are matched against each other in all combinations
- 10 × 10 = 100 total games
- Cumulative score determines winner

## ML/RL Training Applications

### Reinforcement Learning Environment

The game is ideal for RL training because:

1. **Clear Reward Signal**: Points-based scoring
2. **Strategic Depth**: Balancing speed vs. safety
3. **Opponent Modeling**: Predicting opponent behavior
4. **Finite Action Space**: Limited legal moves
5. **Deterministic**: Same boards always produce same results

### Training Scenarios

- **Board Generation**: Learn to create optimal boards
- **Board Selection**: Choose best board against unknown opponent
- **Opponent Prediction**: Infer opponent strategy from board history
- **Meta-Game**: Adapt to opponent's playing style over multiple rounds

### Observation Space

For a given game state:
- Current board grid (N×N)
- Current position
- Placed traps (both players)
- Current score
- Opponent's visible moves so far
- Step number

### Action Space

For board creation:
- Move up/down/left/right
- Place trap (8 directions + current square)
- Finish sequence

## Implementation Details

### Board Representation

**Grid Format:**
```typescript
type CellContent = 'empty' | 'piece' | 'trap';
type Board = {
  boardSize: number;
  grid: CellContent[][];      // Visual representation
  sequence: BoardMove[];       // Execution order
};
```

**Sequence Format:**
```typescript
type BoardMove = {
  position: { row: number; col: number };
  type: 'piece' | 'trap' | 'final';
  order: number;               // Execution order (1, 2, 3, ...)
};
```

### Coordinate System

- **Origin**: Top-left is (0, 0)
- **Row 0**: Top row
- **Row N-1**: Bottom row (starting position)
- **Row -1**: Goal (above the board)
- **Rotation**: Opponent board rotated 180° around center

### Validation Layers

1. **Board Structure**: Valid grid and sequence
2. **Move Legality**: All moves follow rules
3. **Sequence Validity**: Proper ordering and transitions
4. **Playability**: Board can actually be executed

## Example Boards

### Minimal (Size 2)
```
Grid:           Sequence:
┌─────┬─────┐   1. (1, 0) piece [start]
│     │     │   2. (0, 0) piece [forward]
├─────┼─────┤   3. (-1, 0) final [goal]
│  1● │     │
└─────┴─────┘

Steps: 3
Points: 2 (1 forward + 1 goal)
```

### Trap Strategy (Size 3)
```
Grid:           Sequence:
┌─────┬─────┬─────┐   1. (2, 1) piece [start]
│  3X │ 2●  │     │   2. (1, 1) piece [forward]
├─────┼─────┼─────┤   3. (0, 1) piece [forward]
│     │ 1●  │     │   4. (0, 0) trap [block left]
├─────┼─────┼─────┤   5. (-1, 1) final [goal]
│     │     │     │
└─────┴─────┴─────┘

Steps: 5
Points: 3 (2 forward + 1 goal)
Strategy: Block opponent's left path
```

### Supermove (Size 3)
```
Grid:           Sequence:
┌─────┬─────┬─────┐   1. (2, 1) piece [start]
│ 4●  │     │     │   2. (2, 0) piece [lateral]
├─────┼─────┼─────┤   3. (2, 0) trap [supermove!]
│     │ 5X  │     │   4. (1, 0) piece [forced move]
├─────┼─────┼─────┤   5. (1, 1) trap [block]
│ 2●,3X│ 1● │     │   6. (-1, 0) final [goal]
└─────┴─────┴─────┘

Steps: 6
Points: 2 (1 forward + 1 goal)
Strategy: Aggressive trap coverage with supermove
```

## Resources

- **Game URL**: https://spaces-game.vercel.app
- **Rules**: https://spaces-game.vercel.app/rules
- **CLI Tool**: Interactive board builder and testing framework
- **Board Generator**: Exhaustive legal board generation (sizes 2-5)

## Glossary

- **Supermove**: Placing a trap on the piece's current position
- **Forward Movement**: Moving closer to goal (decreasing row)
- **Lateral Movement**: Moving left/right (same row)
- **Legal Board**: A board that follows all movement and trap placement rules
- **Rotation**: Opponent's perspective (180° flip of the grid)
- **Sequence**: Ordered list of moves defining a board
- **Grid**: Visual representation of piece and trap positions
- **Step**: One simultaneous execution of both players' moves
- **Round**: One complete game (both sequences executed)

## Design Principles

1. **Determinism**: Same boards always produce same results
2. **Clarity**: Simple rules, deep strategy
3. **Balance**: Speed and safety both matter
4. **Skill Expression**: Multiple viable strategies
5. **Observability**: All information is public
6. **Computability**: Fast simulation for ML training
