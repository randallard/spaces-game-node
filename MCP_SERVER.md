# MCP Server — Spaces Game Expert

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that exposes Spaces Game knowledge, board validation, and round simulation as tools for Claude Desktop (or any MCP client).

## What It Does

The MCP server turns the Python game engine into a set of callable tools that an LLM can use to:

- **Look up game rules** — search the knowledge base by topic (scoring, traps, fog of war, etc.)
- **Validate boards** — check whether a board dict is legal according to all game rules
- **Simulate rounds** — run two boards against each other and get the full result

This is the foundation for a game expert chat that can answer rule questions, verify player-submitted boards, and walk through round outcomes step by step.

## Architecture

```
mcp_server/
├── __init__.py          # Package marker
├── main.py              # FastMCP server: 1 resource, 3 tools
├── config.py            # Knowledge base path config (MCP_KNOWLEDGE_PATH env var)
└── board_helpers.py     # JSON ↔ dataclass conversion (wraps existing board_loader)
```

The server imports directly from the existing `spaces_game` package — no game logic is duplicated. Board parsing uses `board_loader.load_board_from_dict()`, validation uses `validation.validate_board()`, and simulation uses `simulation.simulate_round()`.

## Resource

| URI | Description |
|-----|-------------|
| `knowledge://game-rules` | Full contents of `GAME_KNOWLEDGE.md` — rules, strategy, technical details |

## Tools

### `validate_board_tool`

Validates a board dict against all game rules.

**Input:**
```json
{
  "board": {
    "boardSize": 3,
    "grid": [["piece", "empty", "empty"], ...],
    "sequence": [{"position": {"row": 2, "col": 0}, "type": "piece", "order": 0}, ...]
  }
}
```

**Output:** JSON with `valid` (bool), `errors` (list), `boardSize`, `sequenceLength`

### `simulate_round_tool`

Simulates a round between two boards.

**Input:**
```json
{
  "round_num": 1,
  "player_board": { "boardSize": 3, "grid": [...], "sequence": [...] },
  "opponent_board": { "boardSize": 3, "grid": [...], "sequence": [...] }
}
```

**Output:** JSON with `winner`, `playerPoints`, `opponentPoints`, `collision`, `simulationDetails` (moves, traps hit, final positions)

### `get_game_rules`

Searches the knowledge base by topic keyword.

**Input:**
```json
{
  "topic": "scoring"
}
```

**Output:** Matching sections from the knowledge base, or available section headings if no match found.

## Setup

### Install Dependencies

```bash
cd spaces-game-python
uv pip install "mcp[cli]>=1.2.0"
```

### Claude Desktop Configuration

Add to `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spaces-game": {
      "command": "/path/to/spaces-game-python/.venv/bin/python",
      "args": ["-m", "mcp_server.main"],
      "cwd": "/path/to/spaces-game-python"
    }
  }
}
```

The server must use the venv Python (not system) because `spaces_game` imports gymnasium/SB3 at the package level.

After saving the config, restart Claude Desktop. The "spaces-game" server should appear in the MCP server list.

### Transport

Currently runs via **stdio** for local Claude Desktop use. HTTP transport can be added later for remote access.

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `MCP_KNOWLEDGE_PATH` | `../../GAME_KNOWLEDGE.md` (repo root) | Path to the game knowledge base file |

Follows the same env-var config pattern as the inference server (`inference_server/config.py`).

## Running Tests

```bash
cd spaces-game-python
.venv/bin/python -m pytest tests/test_mcp_server.py -v
```

Tests cover:
- `board_from_json` — valid/invalid board parsing, frozen tuple preservation
- `validate_board_tool` — valid boards, invalid boards, malformed input
- `simulate_round_tool` — two-board simulation, invalid input handling
- `get_game_rules` — topic search, case insensitivity, no-match fallback

## Running the Server Manually

```bash
cd spaces-game-python
.venv/bin/python -m mcp_server.main
```

The server starts and waits for MCP messages on stdin. This is mainly useful for verifying the server starts without errors — normal usage is through Claude Desktop.
