import React, { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useGameState } from '@/hooks/useGameState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUrlSync } from '@/hooks/useUrlSync';
import { simulateRound, isBoardPlayable } from '@/utils/game-simulation';
import {
  UserProfile,
  OpponentManager,
  BoardCreator,
  SavedBoards,
  RoundResults,
  GameOver,
} from '@/components';
import type { UserProfile as UserProfileType, Board, Opponent, GameState } from '@/types';
import { UserProfileSchema, BoardSchema, OpponentSchema } from '@/schemas';

// Create initial empty user for game state initialization
const createEmptyUser = (): UserProfileType => ({
  id: '',
  name: '',
  createdAt: Date.now(),
  stats: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
  },
});

// Initial game state
const createInitialState = (user: UserProfileType): GameState => ({
  phase: { type: 'user-setup' },
  user,
  opponent: null,
  currentRound: 1,
  playerScore: 0,
  opponentScore: 0,
  playerSelectedBoard: null,
  opponentSelectedBoard: null,
  roundHistory: [],
  checksum: '',
});

function App(): React.ReactElement {
  // LocalStorage for persistence
  const [savedUser, setSavedUser] = useLocalStorage<UserProfileType | null>(
    'spaces-game-user',
    UserProfileSchema.nullable(),
    null
  );

  const [savedBoards, setSavedBoards] = useLocalStorage<Board[] | null>(
    'spaces-game-boards',
    BoardSchema.array(),
    []
  );

  const [savedOpponents, setSavedOpponents] = useLocalStorage<Opponent[] | null>(
    'spaces-game-opponents',
    OpponentSchema.array(),
    []
  );

  // Initialize game state with saved user or empty user
  const [initialState] = useState<GameState>(() =>
    createInitialState(savedUser || createEmptyUser())
  );

  // Initialize game state hook
  const {
    state,
    setPhase,
    selectOpponent,
    selectPlayerBoard,
    selectOpponentBoard,
    completeRound,
    advanceToNextRound,
    resetGame,
    loadState,
  } = useGameState(initialState);

  // URL state synchronization
  const { updateUrl, getShareUrl, copyShareUrl } = useUrlSync({
    debounceMs: 500,
    onGameStateReceived: (urlState) => {
      // Load game state from URL if shared
      loadState(urlState);
    },
    onError: (error) => {
      console.error('URL sync error:', error);
    },
  });

  // Update URL when game state changes (skip user-setup phase)
  useEffect(() => {
    if (state.phase.type !== 'user-setup' && state.user.name) {
      updateUrl(state);
    }
  }, [state, updateUrl]);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (state.user.name) {
      setSavedUser(state.user);
    }
  }, [state.user, setSavedUser]);

  // Handle user creation
  const handleUserCreate = (newUser: UserProfileType) => {
    // Save user and transition to opponent selection
    setSavedUser(newUser);
    setPhase({ type: 'opponent-selection' });
  };

  // Handle opponent selection
  const handleOpponentSelect = (opponent: Opponent) => {
    selectOpponent(opponent);

    // Save opponent to localStorage if not already saved
    const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
    if (existingIndex >= 0) {
      const updated = [...(savedOpponents || [])];
      updated[existingIndex] = opponent;
      setSavedOpponents(updated);
    } else {
      setSavedOpponents([...(savedOpponents || []), opponent]);
    }
  };

  // Handle board CRUD operations
  const handleBoardSave = (board: Board) => {
    const boards = savedBoards || [];
    const existingIndex = boards.findIndex((b) => b.id === board.id);
    if (existingIndex >= 0) {
      const updated = [...boards];
      updated[existingIndex] = board;
      setSavedBoards(updated);
    } else {
      setSavedBoards([...boards, board]);
    }
  };

  const handleBoardDelete = (boardId: string) => {
    setSavedBoards((savedBoards || []).filter((b) => b.id !== boardId));
  };

  const handleBoardCancel = () => {
    // No-op for now
  };

  // Handle board selection for round
  const handleBoardSelect = (board: Board) => {
    // Validate player's board is playable
    if (!isBoardPlayable(board)) {
      alert('Invalid board! Board must have at least one move in sequence.');
      return;
    }

    selectPlayerBoard(board);

    // Opponent selects a board (CPU chooses random, human would choose via URL)
    const boards = savedBoards || [];
    let opponentBoard: Board = board; // Fallback to same board

    if (state.opponent?.type === 'cpu') {
      // CPU selects random board
      if (boards.length > 1) {
        opponentBoard = boards[Math.floor(Math.random() * boards.length)] || board;
      } else if (boards.length === 1) {
        opponentBoard = boards[0] || board;
      }

      // Ensure opponent board is playable
      if (!isBoardPlayable(opponentBoard)) {
        // Find first playable board or use player's board
        const playableBoard = boards.find(b => isBoardPlayable(b));
        opponentBoard = playableBoard || board;
      }
    } else {
      // Human opponent - would normally choose via URL sharing
      // For now, select random board as placeholder
      if (boards.length > 1) {
        opponentBoard = boards[Math.floor(Math.random() * boards.length)] || board;
      }
    }

    selectOpponentBoard(opponentBoard);

    // Run actual game simulation
    setTimeout(() => {
      const result = simulateRound(state.currentRound, board, opponentBoard);
      completeRound(result);
    }, 500); // Shorter delay for better UX
  };

  // Handle continuing to next round
  const handleContinue = () => {
    advanceToNextRound();
  };

  // Handle play again
  const handlePlayAgain = () => {
    resetGame();
    setPhase({ type: 'opponent-selection' });
  };

  // Render phase-specific content
  const renderPhase = () => {
    switch (state.phase.type) {
      case 'user-setup':
        return (
          <UserProfile
            onUserCreated={handleUserCreate}
            existingUser={savedUser}
          />
        );

      case 'opponent-selection':
        return (
          <OpponentManager
            onOpponentSelected={handleOpponentSelect}
            userName={state.user.name}
          />
        );

      case 'board-selection':
        return (
          <div>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Round {state.phase.round} of 8</h2>
                <p>
                  Score: {state.user.name} {state.playerScore} - {state.opponent?.name}{' '}
                  {state.opponentScore}
                </p>
              </div>
              <button
                className={styles.button}
                onClick={async () => {
                  const success = await copyShareUrl();
                  if (success) {
                    alert('Game URL copied to clipboard!');
                  } else {
                    alert('Failed to copy URL. URL: ' + getShareUrl());
                  }
                }}
                style={{ height: 'fit-content' }}
              >
                Share Game
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3>Create Board</h3>
                <BoardCreator
                  onBoardSaved={handleBoardSave}
                  onCancel={handleBoardCancel}
                />
              </div>
              <div>
                <h3>Saved Boards</h3>
                <SavedBoards
                  boards={savedBoards || []}
                  onBoardSelected={handleBoardSelect}
                  onBoardSaved={handleBoardSave}
                  onBoardDeleted={handleBoardDelete}
                  currentRound={state.currentRound}
                  userName={state.user.name}
                  opponentName={state.opponent?.name || 'Opponent'}
                />
              </div>
            </div>
          </div>
        );

      case 'round-results':
        if (!state.phase.result) return null;
        return (
          <RoundResults
            result={state.phase.result}
            playerName={state.user.name}
            opponentName={state.opponent?.name || 'Opponent'}
            playerScore={state.playerScore}
            opponentScore={state.opponentScore}
            onContinue={handleContinue}
          />
        );

      case 'game-over':
        return (
          <GameOver
            winner={state.phase.winner}
            playerName={state.user.name}
            opponentName={state.opponent?.name || 'Opponent'}
            playerScore={state.playerScore}
            opponentScore={state.opponentScore}
            roundHistory={state.roundHistory}
            playerStats={state.user.stats}
            onNewGame={handlePlayAgain}
          />
        );

      default:
        return <p>Unknown phase</p>;
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Spaces Game</h1>
        <p>A turn-based strategy board game</p>
      </header>
      <main className={styles.main}>{renderPhase()}</main>
    </div>
  );
}

export default App;
