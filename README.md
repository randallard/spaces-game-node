# Spaces Game

A turn-based strategy board game built with React, TypeScript, and Vite.

try the initial implementation at https://randallard.github.io/spaces-game/

and the current implementation of this one at https://randallard.github.io/spaces-game-node/ 

## Overview

Spaces Game is a competitive strategy game where players create 2x2 board patterns with pieces and traps, then compete in 8-round matches. Players share game states via URL hash fragments for easy sharing.

## Features

- **Board Creation**: Design 2x2 grids with strategic piece and trap placements
- **Turn-Based Gameplay**: No time pressure - play at your own pace
- **Multiple Opponents**: Play against friends or the CPU
- **URL Sharing**: Share game states via compressed URL hashes
- **Win/Loss Tracking**: Track statistics per opponent
- **LocalStorage Persistence**: Saves boards and user data locally

## Tech Stack

- **React 19.1** - UI framework
- **TypeScript 5.9** - Type safety with strict mode
- **Vite 7.1** - Fast dev server and build tool
- **Zod 3.22** - Runtime validation
- **lz-string 1.5** - URL compression
- **Vitest 3.0** - Unit/integration testing
- **CSS Modules** - Scoped styling

## Getting Started

### Prerequisites

- Node.js >= 20.19.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Development Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage
pnpm lint             # Lint code
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code
pnpm check            # Type check
pnpm validate         # Run all checks (type, lint, test)
```

## Game Rules

### Board Creation
- **Grid Size**: 2x2 cells
- **Piece**: Exactly 1 piece (your starting position)
- **Traps**: 0-3 traps (opponent hits these and loses)
- **Sequence**: Each placement is ordered

### Gameplay
- **Format**: 8 rounds per game
- **Board Selection**: Each round, both players select a saved board
- **Simulation**: Boards are simulated simultaneously
  - Move forward on opponent's board
  - Hit a trap → lose the round
  - Hit opponent's piece → lose the round
  - Safe moves → score points
- **Scoring**: Points for each safe forward move
- **Winner**: Most points after 8 rounds

## Project Structure

```
spaces-game-node/
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Root component
│   ├── App.module.css           # Global styles
│   ├── types/                   # TypeScript types
│   ├── schemas/                 # Zod validation schemas
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   ├── constants/               # Constants and config
│   └── test/                    # Test setup
├── planning/                    # Planning documents
├── public/                      # Static assets
└── index.html                   # HTML entry point
```

## Architecture

This project follows patterns from [kings-cooking](https://github.com/randallard/kings-cooking):

- **Complete State Pattern**: Never update partial state
- **URL Hash Sync**: Compressed game state in URL
- **Zod Validation**: Runtime validation at entry points
- **Discriminated Unions**: Type-safe state machine
- **CSS Modules**: Scoped component styles

See `planning/MIGRATION_PLAN.md` for detailed architecture decisions.

## License

MIT

## Author

randallard
