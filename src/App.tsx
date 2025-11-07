import React, { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useGameState } from '@/hooks/useGameState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { simulateRound, simulateAllRounds, isBoardPlayable } from '@/utils/game-simulation';
import {
  UserProfile,
  OpponentManager,
  SavedBoards,
  RoundResults,
  GameOver,
  ProfileModal,
  DeckCreator,
  DeckManager,
  AllRoundsResults,
} from '@/components';
import type { UserProfile as UserProfileType, Board, Opponent, GameState, Deck, GameMode } from '@/types';
import { UserProfileSchema, BoardSchema, OpponentSchema, DeckSchema } from '@/schemas';

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
    gameMode: null,
    currentRound: 1,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    playerSelectedDeck: null,
    opponentSelectedDeck: null,
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

  const [savedDecks, setSavedDecks] = useLocalStorage<Deck[] | null>(
    'spaces-game-decks',
    DeckSchema.array(),
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
    setGameMode,
    selectPlayerBoard,
    selectOpponentBoard,
    selectPlayerDeck,
    selectOpponentDeck,
    completeRound,
    completeAllRounds,
    advanceToNextRound,
    resetGame,
    loadState,
  } = useGameState(initialState);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Deck creator state
  const [showDeckCreator, setShowDeckCreator] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

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

  // Handle game mode selection
  const handleGameModeSelect = (mode: GameMode) => {
    // If we already have an opponent selected, go directly to next phase
    if (state.opponent) {
      loadState({
        ...state,
        gameMode: mode,
        phase: mode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 },
        currentRound: 1,
      });
    } else {
      // No opponent yet, go to opponent selection
      setGameMode(mode);
      setPhase({ type: 'opponent-selection', gameMode: mode });
    }
  };

  // Handle opponent selection (for play button)
  const handleOpponentSelect = (opponent: Opponent, gameMode: GameMode) => {
    // Save opponent to localStorage if not already saved
    const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
    if (existingIndex >= 0) {
      const updated = [...(savedOpponents || [])];
      updated[existingIndex] = opponent;
      setSavedOpponents(updated);
    } else {
      setSavedOpponents([...(savedOpponents || []), opponent]);
    }

    // Select opponent with game mode
    loadState({
      ...state,
      opponent,
      gameMode,
      phase: gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 },
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

  // Handle deck CRUD operations
  const handleDeckSave = (deck: Deck) => {
    const decks = savedDecks || [];
    const existingIndex = decks.findIndex((d) => d.id === deck.id);
    if (existingIndex >= 0) {
      const updated = [...decks];
      updated[existingIndex] = deck;
      setSavedDecks(updated);
    } else {
      setSavedDecks([...decks, deck]);
    }
    setShowDeckCreator(false);
    setEditingDeck(null);
  };

  const handleDeckDelete = (deckId: string) => {
    setSavedDecks((savedDecks || []).filter((d) => d.id !== deckId));
  };

  const handleDeckEdit = (deck: Deck) => {
    setEditingDeck(deck);
    setShowDeckCreator(true);
  };

  // Handle deck selection for gameplay
  const handleDeckSelect = (deck: Deck) => {
    selectPlayerDeck(deck);

    // Opponent selects a deck
    const boards = savedBoards || [];
    let opponentDeck: Deck;

    if (state.opponent?.type === 'cpu') {
      // CPU creates a random deck from available boards
      const opponentBoards: Board[] = [];

      if (boards.length === 0) {
        // No boards available - use player's deck
        opponentDeck = deck;
      } else {
        // Randomly select 10 boards (with possible reuse)
        for (let i = 0; i < 10; i++) {
          const randomBoard = boards[Math.floor(Math.random() * boards.length)]!;
          opponentBoards.push(randomBoard);
        }

        opponentDeck = {
          id: `cpu-deck-${Date.now()}`,
          name: `${state.opponent.name}'s Deck`,
          boards: opponentBoards,
          createdAt: Date.now(),
        };
      }
    } else {
      // Human opponent - would normally choose via URL sharing
      // For now, create random deck from available boards
      const opponentBoards: Board[] = [];

      if (boards.length === 0) {
        opponentDeck = deck;
      } else {
        for (let i = 0; i < 10; i++) {
          const randomBoard = boards[Math.floor(Math.random() * boards.length)]!;
          opponentBoards.push(randomBoard);
        }

        opponentDeck = {
          id: `opponent-deck-${Date.now()}`,
          name: `${state.opponent?.name || 'Opponent'}'s Deck`,
          boards: opponentBoards,
          createdAt: Date.now(),
        };
      }
    }

    selectOpponentDeck(opponentDeck);

    // Run all 10 rounds at once
    setTimeout(() => {
      const results = simulateAllRounds(
        deck.boards,
        opponentDeck.boards,
        savedUser?.playerCreature,
        savedUser?.opponentCreature
      );
      completeAllRounds(results);
    }, 500);
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

      // Add creature data to result if available
      if (savedUser?.playerCreature) {
        result.playerCreature = savedUser.playerCreature;
      }
      if (savedUser?.opponentCreature) {
        result.opponentCreature = savedUser.opponentCreature;
      }

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
                          onClick={() => {
                            // Save the selected opponent and go to game mode selection
                            loadState({
                              ...state,
                              opponent,
                              phase: { type: 'game-mode-selection' },
                            });
                          }}
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
                        onClick={() => {
                          // Clear any selected opponent when adding new one
                          loadState({
                            ...state,
                            opponent: null,
                            phase: { type: 'game-mode-selection' },
                          });
                        }}
                        className={styles.addOpponentButton}
                      >
                        + Add Opponent
                      </button>
                    </div>
                  )}
                  {savedOpponents && savedOpponents.length > 0 && (
                    <button
                      onClick={() => {
                        // Clear any selected opponent when adding new one
                        loadState({
                          ...state,
                          opponent: null,
                          phase: { type: 'game-mode-selection' },
                        });
                      }}
                      className={styles.addOpponentButton}
                    >
                      + Add Opponent
                    </button>
                  )}
                </div>
              </div>

              {/* Right Panel - Boards and Decks */}
              <div className={styles.boardsPanel}>
                <div style={{ marginBottom: '2rem' }}>
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 className={styles.panelTitle}>Decks</h2>
                    <button
                      onClick={() => setPhase({ type: 'deck-management' })}
                      className={styles.addOpponentButton}
                    >
                      Manage Decks
                    </button>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    {savedDecks?.length || 0} deck(s) created
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'game-mode-selection':
        return (
          <div className={styles.gameModeSelection}>
            {state.opponent && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
                Playing against: <strong>{state.opponent.name}</strong>
              </div>
            )}
            <h2>Choose Game Mode</h2>
            <div className={styles.modeGrid}>
              <button
                onClick={() => handleGameModeSelect('round-by-round')}
                className={styles.modeCard}
              >
                <h3>Round by Round</h3>
                <p>Classic mode - Select a board each round (8 rounds)</p>
              </button>
              <button
                onClick={() => handleGameModeSelect('deck')}
                className={styles.modeCard}
              >
                <h3>Deck Mode</h3>
                <p>Fast mode - Create a deck of 10 boards and play all at once</p>
              </button>
            </div>
            <button
              onClick={() => setPhase({ type: 'board-management' })}
              className={styles.backButton}
            >
              Back
            </button>
          </div>
        );

      case 'opponent-selection':
        return (
          <OpponentManager
            onOpponentSelected={(opponent) =>
              handleOpponentSelect(opponent, state.phase.type === 'opponent-selection' ? state.phase.gameMode : 'round-by-round')
            }
            userName={state.user.name}
          />
        );

      case 'deck-management':
        if (showDeckCreator) {
          return (
            <DeckCreator
              availableBoards={savedBoards || []}
              onDeckSaved={handleDeckSave}
              onCancel={() => {
                setShowDeckCreator(false);
                setEditingDeck(null);
              }}
              existingDeck={editingDeck ?? undefined}
            />
          );
        }
        return (
          <DeckManager
            decks={savedDecks || []}
            onDeckSelected={handleDeckSelect}
            onCreateDeck={() => setShowDeckCreator(true)}
            onEditDeck={handleDeckEdit}
            onDeleteDeck={handleDeckDelete}
            userName={state.user.name}
          />
        );

      case 'deck-selection':
        if (showDeckCreator) {
          return (
            <DeckCreator
              availableBoards={savedBoards || []}
              onDeckSaved={handleDeckSave}
              onCancel={() => {
                setShowDeckCreator(false);
                setEditingDeck(null);
              }}
              existingDeck={editingDeck ?? undefined}
            />
          );
        }
        return (
          <DeckManager
            decks={savedDecks || []}
            onDeckSelected={handleDeckSelect}
            onCreateDeck={() => setShowDeckCreator(true)}
            onEditDeck={handleDeckEdit}
            onDeleteDeck={handleDeckDelete}
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

      case 'all-rounds-results':
        if (!state.phase.results || state.phase.results.length === 0) return null;

        // Calculate winner
        let winner: 'player' | 'opponent' | 'tie';
        if (state.playerScore > state.opponentScore) {
          winner = 'player';
        } else if (state.opponentScore > state.playerScore) {
          winner = 'opponent';
        } else {
          winner = 'tie';
        }

        return (
          <AllRoundsResults
            results={state.phase.results}
            playerName={state.user.name}
            opponentName={state.opponent?.name || 'Opponent'}
            playerScore={state.playerScore}
            opponentScore={state.opponentScore}
            winner={winner}
            onPlayAgain={handlePlayAgain}
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
