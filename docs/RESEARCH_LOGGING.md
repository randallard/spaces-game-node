# Research Data Logging

Spaces Game logs board construction records and round outcomes to Supabase for every completed round, across all opponent types (human, cpu, remote-cpu, ai-agent). The data is used for RL training analysis and game research.

## Architecture

The Node frontend is the single writer. After each round completes:

1. `logRoundData()` in `src/utils/game-logger.ts` fires two fire-and-forget POSTs to `/api/game-log`
2. The Vercel API route `api/game-log.ts` inserts the record directly into Supabase via the REST API
3. Errors are swallowed — logging never affects game play

```
Browser (logRoundData)
  → POST /api/game-log  (Vercel serverless, has Supabase credentials)
    → Supabase REST API
      → board_constructions / round_outcomes tables
```

Credentials are server-side only (no `VITE_` prefix), so the Supabase anon key is never exposed to the browser.

## Supabase Setup

### 1. Create the tables

Run this SQL in the Supabase SQL editor (Dashboard → SQL Editor → New query):

```sql
-- Board construction records: both players' boards as built going into each round
create table board_constructions (
  id              bigserial primary key,
  game_id         text        not null,
  round_num       smallint    not null check (round_num between 1 and 5),
  seq             smallint    not null,  -- interleaved with round_outcomes: odd numbers (1,3,5,7,9)
  player_board    text        not null,  -- minimal board encoding (e.g. "3|02p01p00pG1f")
  opponent_board  text        not null,
  player_score    smallint    not null default 0,   -- cumulative rounds won before this round
  opponent_score  smallint    not null default 0,
  board_size      smallint    not null,
  opponent_type   text        not null,  -- 'human' | 'cpu' | 'remote-cpu' | 'ai-agent'
  skill_level     text,                  -- ai-agent only
  model_id        text,                  -- ai-agent only (stable model hash)
  valid           boolean     not null default true,
  player_id       text,                  -- anonymous device UUID from localStorage
  lot_session_id  text,                  -- set when playing via The Lot
  created_at      timestamptz not null default now()
);

-- Round outcome records: simulation results and fog-of-war views
create table round_outcomes (
  id                  bigserial primary key,
  game_id             text        not null,
  round_num           smallint    not null check (round_num between 1 and 5),
  seq                 smallint    not null,  -- interleaved: even numbers (2,4,6,8,10)
  player_points       numeric     not null default 0,
  opponent_points     numeric     not null default 0,
  winner              text        check (winner in ('player', 'opponent', 'tie')),
  player_hit_trap     boolean     not null default false,
  opponent_hit_trap   boolean     not null default false,
  collision           boolean     not null default false,
  player_last_step    smallint    not null default -1,   -- step index (-1 = no trap hit)
  opponent_last_step  smallint    not null default -1,
  player_fog          text        not null,  -- fog-filtered view of opponent's board
  opponent_fog        text        not null,  -- fog-filtered view of player's board
  player_id           text,
  opponent_type       text        not null,
  created_at          timestamptz not null default now()
);

-- Indexes for common query patterns
create index board_constructions_game_id_idx on board_constructions (game_id);
create index board_constructions_player_id_idx on board_constructions (player_id);
create index board_constructions_opponent_type_idx on board_constructions (opponent_type);
create index round_outcomes_game_id_idx on round_outcomes (game_id);
create index round_outcomes_player_id_idx on round_outcomes (player_id);
```

### 2. Get your credentials

In the Supabase Dashboard → Project Settings → API:

- **Project URL** — looks like `https://abcdefghijkl.supabase.co`
- **anon / publishable key** — the `anon` key under "Project API keys"

RLS is not required. The anon key is stored as a server-side Vercel environment variable (no `VITE_` prefix) and never reaches the browser — all Supabase writes go through the `/api/game-log` serverless function, which acts as the sole gatekeeper.

## Vercel Setup

Add these as environment variables in the Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Notes |
|---|---|---|
| `SUPABASE_URL` | `https://your-project.supabase.co` | No trailing slash |
| `SUPABASE_ANON_KEY` | `eyJ...` | anon key from Supabase |

Do **not** prefix with `VITE_` — these are server-side only and must not be exposed to the browser.

For local development with Vercel CLI (`vercel dev`), add them to `.env.local`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

If these variables are absent, `/api/game-log` returns `200 { ok: true }` silently — logging is a no-op and the game is unaffected.

## What Gets Logged

### `board_constructions`

One record per completed round, written immediately when the round finishes.

| Field | Description |
|---|---|
| `game_id` | Shared game identifier (same for both players in a human game) |
| `round_num` | Round number 1–5 |
| `seq` | Interleaved sequence number within game: `(round_num - 1) * 2 + 1` |
| `player_board` | Player's board in minimal encoding |
| `opponent_board` | Opponent's board in minimal encoding |
| `player_score` | Rounds won by player **before** this round |
| `opponent_score` | Rounds won by opponent **before** this round |
| `board_size` | Grid dimension N (for NxN board) |
| `opponent_type` | `'human'`, `'cpu'`, `'remote-cpu'`, or `'ai-agent'` |
| `skill_level` | AI skill level (ai-agent games only) |
| `model_id` | Stable model hash (ai-agent games with model assignment only) |
| `valid` | Whether the round produced a determined winner |
| `player_id` | Anonymous device UUID from localStorage |
| `lot_session_id` | The Lot session ID (Lot games only) |

### `round_outcomes`

One record per completed round, written alongside `board_constructions`.

| Field | Description |
|---|---|
| `game_id` | Shared game identifier |
| `round_num` | Round number 1–5 |
| `seq` | Interleaved sequence number: `(round_num - 1) * 2 + 2` |
| `player_points` | Points scored by player this round |
| `opponent_points` | Points scored by opponent this round |
| `winner` | `'player'`, `'opponent'`, `'tie'`, or `null` |
| `player_hit_trap` | Whether the player's piece hit a trap |
| `opponent_hit_trap` | Whether the opponent's piece hit a trap |
| `collision` | Whether both pieces collided |
| `player_last_step` | Step index where player stopped (-1 if no early stop) |
| `opponent_last_step` | Step index where opponent stopped (-1 if no early stop) |
| `player_fog` | Fog-of-war view of opponent's board (minimal encoding) |
| `opponent_fog` | Fog-of-war view of player's board (minimal encoding) |
| `player_id` | Anonymous device UUID |
| `opponent_type` | Opponent type string |

### Seq interleaving

The `seq` column lets you reconstruct the exact order of events within a game across both tables:

```
seq 1  → board_constructions round 1  (boards submitted)
seq 2  → round_outcomes round 1       (simulation result)
seq 3  → board_constructions round 2
seq 4  → round_outcomes round 2
...
seq 9  → board_constructions round 5
seq 10 → round_outcomes round 5
```

### Minimal board encoding

Boards are stored in the compact format documented in [MINIMAL_BOARD_ENCODING.md](./MINIMAL_BOARD_ENCODING.md). Example: `"3|02p01p11t00pG1f"` encodes a 3×3 board with its full move sequence.

## Example Queries

Reconstructing a full game timeline:

```sql
select 'board' as record_type, game_id, round_num, seq, player_board, opponent_board, opponent_type
from board_constructions
where game_id = 'your-game-id'

union all

select 'outcome', game_id, round_num, seq, player_fog, opponent_fog, opponent_type
from round_outcomes
where game_id = 'your-game-id'

order by seq;
```

AI-agent games by skill level:

```sql
select skill_level, count(*) as rounds, avg(player_score + opponent_score) as avg_round_num
from board_constructions
where opponent_type = 'ai-agent'
group by skill_level
order by skill_level;
```

Player win rate vs AI:

```sql
select
  bc.skill_level,
  count(*) as total_rounds,
  sum(case when ro.winner = 'player' then 1 else 0 end) as player_wins,
  round(100.0 * sum(case when ro.winner = 'player' then 1 else 0 end) / count(*), 1) as player_win_pct
from round_outcomes ro
join board_constructions bc on bc.game_id = ro.game_id and bc.round_num = ro.round_num
where ro.opponent_type = 'ai-agent'
group by bc.skill_level
order by bc.skill_level;
```
