import React, { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useGameState } from '@/hooks/useGameState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { simulateRound, isBoardPlayable } from '@/utils/game-simulation';
import {
  UserProfile,
  OpponentManager,
  SavedBoards,
  RoundResults,
  GameOver,
  ProfileModal,
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
const createInitialState = (user: UserProfileType | null): GameState => {
  // If we have a saved user with a name, go to board management
  const phase: GameState['phase'] = user && user.name
    ? { type: 'board-management' }
    : { type: 'user-setup' };

  return {
    phase,
    user: user || createEmptyUser(),
    opponent: null,
    currentRound: 1,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
    checksum: '',
  };
};

function App(): React.ReactElement {
  // LocalStorage for persistence
  const [savedUser, setSavedUser] = useLocalStorage<UserProfileType | null>(
    'spaces-game-user',
    UserProfileSchema.nullable(),
    null
  );

  // Debug: log initial user
  useEffect(() => {
    console.log('[APP] savedUser changed:', savedUser?.name || 'null');
  }, [savedUser]);

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

  // Initialize game state with saved user or null
  const [initialState] = useState<GameState>(() =>
    createInitialState(savedUser)
  );

  // Initialize game state hook
  const {
    state,
    setPhase,
    selectPlayerBoard,
    selectOpponentBoard,
    completeRound,
    advanceToNextRound,
    resetGame,
    loadState,
  } = useGameState(initialState);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (state.user.name) {
      console.log('[APP] Saving user to localStorage:', state.user.name);
      setSavedUser(state.user);
    }
  }, [state.user, setSavedUser]);

  // Handle user creation
  const handleUserCreate = (newUser: UserProfileType) => {
    // Save user to localStorage
    setSavedUser(newUser);

    // Update game state with new user and transition to board management
    loadState({
      ...state,
      user: newUser,
      phase: { type: 'board-management' },
    });
  };

  // Handle opponent selection (for play button)
  const handleOpponentSelect = (opponent: Opponent) => {
    // Save opponent to localStorage if not already saved
    const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
    if (existingIndex >= 0) {
      const updated = [...(savedOpponents || [])];
      updated[existingIndex] = opponent;
      setSavedOpponents(updated);
    } else {
      setSavedOpponents([...(savedOpponents || []), opponent]);
    }

    // Select opponent and start game (go to board-selection for round 1)
    loadState({
      ...state,
      opponent,
      phase: { type: 'board-selection', round: 1 },
      currentRound: 1,
    });
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
    setPhase({ type: 'board-management' });
  };

  // Handle profile update
  const handleProfileUpdate = (updatedUser: UserProfileType) => {
    // Save to localStorage
    setSavedUser(updatedUser);

    // Update game state
    loadState({
      ...state,
      user: updatedUser,
    });
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

      case 'board-management':
        return (
          <div className={styles.boardManagement}>
            <div className={styles.managementHeader}>
              <h1>Hello, {state.user.name}!</h1>
              <button
                className={styles.editProfileLink}
                onClick={() => setIsProfileModalOpen(true)}
              >
                Edit Profile
              </button>
            </div>
            <div className={styles.managementGrid}>
              {/* Left Panel - Opponents */}
              <div className={styles.opponentsPanel}>
                <h2 className={styles.panelTitle}>Opponents</h2>
                <div className={styles.opponentsList}>
                  {savedOpponents && savedOpponents.length > 0 ? (
                    savedOpponents.map((opponent) => (
                      <div key={opponent.id} className={styles.opponentItem}>
                        <div className={styles.opponentInfo}>
                          <span className={styles.opponentIcon}>
                            {opponent.type === 'cpu' ? '🤖' : '👤'}
                          </span>
                          <div className={styles.opponentDetails}>
                            <span className={styles.opponentName}>{opponent.name}</span>
                            <span className={styles.opponentRecord}>
                              ({opponent.wins}-{opponent.losses})
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpponentSelect(opponent)}
                          className={styles.playButton}
                        >
                          Play
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyOpponents}>
                      <p>No opponents yet</p>
                      <button
                        onClick={() => setPhase({ type: 'opponent-selection' })}
                        className={styles.addOpponentButton}
                      >
                        + Add Opponent
                      </button>
                    </div>
                  )}
                  {savedOpponents && savedOpponents.length > 0 && (
                    <button
                      onClick={() => setPhase({ type: 'opponent-selection' })}
                      className={styles.addOpponentButton}
                    >
                      + Add Opponent
                    </button>
                  )}
                </div>
              </div>

              {/* Right Panel - Boards */}
              <div className={styles.boardsPanel}>
                <h2 className={styles.panelTitle}>Boards</h2>
                <div className={styles.boardsContent}>
                  <SavedBoards
                    boards={savedBoards || []}
                    onBoardSelected={() => {}} // No selection in management mode
                    onBoardSaved={handleBoardSave}
                    onBoardDeleted={handleBoardDelete}
                    currentRound={0} // Not in a round
                    userName={state.user.name}
                    opponentName=""
                  />
                </div>
              </div>
            </div>
          </div>
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
            <div style={{ marginBottom: '2rem' }}>
              <h2>Round {state.phase.round} of 8</h2>
              <p>
                Score: {state.user.name} {state.playerScore} - {state.opponent?.name}{' '}
                {state.opponentScore}
              </p>
            </div>
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
        <div>
          <h1>Spaces Game</h1>
          <p>A turn-based strategy board game</p>
        </div>
        {state.user.name && (
          <button
            className={styles.profileButton}
            onClick={() => setIsProfileModalOpen(true)}
            aria-label="Open profile"
          >
            <span className={styles.profileIcon}>👤</span>
            <span className={styles.profileName}>{state.user.name}</span>
          </button>
        )}
      </header>
      <main className={styles.main}>{renderPhase()}</main>

      {/* Profile Modal */}
      {isProfileModalOpen && state.user.name && (
        <ProfileModal
          user={state.user}
          onUpdate={handleProfileUpdate}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
