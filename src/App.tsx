import React, { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useGameState } from '@/hooks/useGameState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { simulateRound, simulateAllRounds, isBoardPlayable } from '@/utils/game-simulation';
import { initializeDefaultCpuData, initializeCpuTougherData } from '@/utils/default-cpu-data';
import {
  UserProfile,
  OpponentManager,
  SavedBoards,
  BoardSizeSelector,
  RoundResults,
  GameOver,
  ProfileModal,
  DeckCreator,
  DeckManager,
  AllRoundsResults,
  TutorialIntro,
  TutorialBoardCreator,
  TutorialNameEntry,
  WelcomeModal,
} from '@/components';
import type { UserProfile as UserProfileType, Board, Opponent, GameState, Deck, GameMode, CreatureId } from '@/types';
import { UserProfileSchema, BoardSchema, OpponentSchema, DeckSchema } from '@/schemas';
import { CPU_OPPONENT_ID, CPU_TOUGHER_OPPONENT_ID, CPU_OPPONENT_NAME, CPU_TOUGHER_OPPONENT_NAME } from '@/constants/game-rules';

// Get opponent icon based on opponent type and name
const getOpponentIcon = (opponent: Opponent): string => {
  if (opponent.type === 'cpu') {
    // CPU Tougher gets the strong arm emoji
    if (opponent.id === CPU_TOUGHER_OPPONENT_ID || opponent.name === CPU_TOUGHER_OPPONENT_NAME) {
      return '🦾';
    }
    // CPU Sam gets the robot emoji
    return '🤖';
  }
  // Human opponents get the person emoji
  return '👤';
};

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
  // Otherwise start with tutorial
  const phase: GameState['phase'] = user && user.name
    ? { type: 'board-management' }
    : { type: 'tutorial-intro' };

  return {
    phase,
    user: user || createEmptyUser(),
    opponent: null,
    gameMode: null,
    boardSize: null,
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

  // Separate storage for CPU boards and decks (hidden from player)
  const [cpuBoards, setCpuBoards] = useLocalStorage<Board[] | null>(
    'spaces-game-cpu-boards',
    BoardSchema.array(),
    []
  );

  const [cpuDecks, setCpuDecks] = useLocalStorage<Deck[] | null>(
    'spaces-game-cpu-decks',
    DeckSchema.array(),
    []
  );

  // Initialize default CPU data on first load
  useEffect(() => {
    // Check if CPU opponents already exist
    const cpuExists = savedOpponents?.some(o => o.id === CPU_OPPONENT_ID);
    const cpuTougherExists = savedOpponents?.some(o => o.id === CPU_TOUGHER_OPPONENT_ID);

    // Check if CPU decks exist with proper names
    const cpuDeck2x2Exists = cpuDecks?.some(d => d.name === 'CPU Sam 2×2 Deck');
    const cpuDeck3x3Exists = cpuDecks?.some(d => d.name === 'CPU Sam 3×3 Deck');
    const cpuTougherDeck2x2Exists = cpuDecks?.some(d => d.name === 'CPU Tougher 2×2 Deck');
    const cpuTougherDeck3x3Exists = cpuDecks?.some(d => d.name === 'CPU Tougher 3×3 Deck');

    const newOpponents: Opponent[] = [];
    const newCpuBoards: Board[] = [];
    let updatedCpuDecks = cpuDecks || [];

    // Initialize regular CPU opponent if it doesn't exist OR if decks are missing
    if (!cpuExists || !cpuDeck2x2Exists || !cpuDeck3x3Exists) {
      console.log('[APP] Initializing default CPU opponent, boards, and decks');
      const defaultData = initializeDefaultCpuData();

      if (!cpuExists) {
        newOpponents.push(defaultData.opponent);
      }
      newCpuBoards.push(...defaultData.boards2x2, ...defaultData.boards3x3);

      // Remove old CPU decks and add new ones
      if (!cpuDeck2x2Exists || !cpuDeck3x3Exists) {
        console.log('[APP] Adding CPU decks:', defaultData.deck2x2.name, defaultData.deck3x3.name);
        updatedCpuDecks = updatedCpuDecks.filter(
          d => d.name !== 'CPU Sam 2×2 Deck' && d.name !== 'CPU 3×3 Deck' && d.name !== 'CPU 2×2 Deck'
        );
        updatedCpuDecks.push(defaultData.deck2x2, defaultData.deck3x3);
      }
    }

    // Initialize CPU Tougher opponent if it doesn't exist OR if decks are missing
    if (!cpuTougherExists || !cpuTougherDeck2x2Exists || !cpuTougherDeck3x3Exists) {
      console.log('[APP] Initializing CPU Tougher opponent, boards, and decks');
      const tougherData = initializeCpuTougherData();

      if (!cpuTougherExists) {
        newOpponents.push(tougherData.opponent);
      }
      newCpuBoards.push(...tougherData.boards2x2, ...tougherData.boards3x3);

      // Remove old CPU Tougher decks and add new ones
      if (!cpuTougherDeck2x2Exists || !cpuTougherDeck3x3Exists) {
        console.log('[APP] Adding CPU Tougher decks:', tougherData.deck2x2.name, tougherData.deck3x3.name);
        updatedCpuDecks = updatedCpuDecks.filter(
          d => d.name !== 'CPU Tougher 2×2 Deck' && d.name !== 'CPU Tougher 3×3 Deck'
        );
        updatedCpuDecks.push(tougherData.deck2x2, tougherData.deck3x3);
      }
    }

    // Add any new opponents
    if (newOpponents.length > 0) {
      setSavedOpponents([...(savedOpponents || []), ...newOpponents]);
    }

    // Add any new CPU boards (but don't re-add if they already exist)
    if (newCpuBoards.length > 0) {
      const existingBoardIds = new Set((cpuBoards || []).map(b => b.id));
      const uniqueNewBoards = newCpuBoards.filter(b => !existingBoardIds.has(b.id));
      if (uniqueNewBoards.length > 0) {
        setCpuBoards([...(cpuBoards || []), ...uniqueNewBoards]);
      }
    }

    // Update CPU decks if any were added
    if (updatedCpuDecks.length !== (cpuDecks || []).length) {
      console.log('[APP] Updating CPU decks storage with', updatedCpuDecks.length, 'decks');
      setCpuDecks(updatedCpuDecks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - we intentionally don't include savedOpponents/cpuBoards/cpuDecks

  // Initialize game state with saved user or null
  const [initialState] = useState<GameState>(() =>
    createInitialState(savedUser)
  );

  // Initialize game state hook
  const {
    state,
    setPhase,
    setGameMode,
    setBoardSize,
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

  // Welcome modal state (CPU Tougher introduction)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Board selection loading state
  const [isSimulatingRound, setIsSimulatingRound] = useState(false);

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
    // After selecting game mode, go to board size selection
    setGameMode(mode);
    setPhase({ type: 'board-size-selection', gameMode: mode });
  };

  // Handle board size selection
  const handleBoardSizeSelect = (size: number) => {
    setBoardSize(size);
    // After selecting board size, check if opponent is already selected
    if (state.phase.type === 'board-size-selection') {
      const gameMode = state.phase.gameMode;

      // If opponent already selected, skip opponent selection and go to next phase
      if (state.opponent) {
        setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
      } else {
        // No opponent selected yet, go to opponent selection
        setPhase({ type: 'opponent-selection', gameMode });
      }
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

    // Select opponent with game mode and reset game state for new game
    loadState({
      ...state,
      opponent,
      gameMode,
      // boardSize should already be set at this point
      phase: gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 },
      currentRound: 1,
      playerScore: 0,
      opponentScore: 0,
      roundHistory: [],
      playerSelectedBoard: null,
      opponentSelectedBoard: null,
      playerSelectedDeck: null,
      opponentSelectedDeck: null,
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
    let opponentDeck: Deck;

    if (state.opponent?.type === 'cpu') {
      // Match deck to specific CPU opponent by name
      // Deck names are like "CPU 2×2 Deck" or "CPU Tougher 2×2 Deck"
      const expectedDeckName = `${state.opponent.name} ${state.boardSize}×${state.boardSize} Deck`;

      console.log(`[handleDeckSelect] Looking for deck: "${expectedDeckName}"`);
      console.log(`[handleDeckSelect] Available CPU decks:`, (cpuDecks || []).map(d => ({ name: d.name, boards: d.boards.length })));

      const cpuDefaultDeck = (cpuDecks || []).find(
        d => d.name === expectedDeckName && d.boards.length === 10
      );

      if (cpuDefaultDeck) {
        // Use the opponent-specific CPU deck (from hidden storage)
        console.log(`[handleDeckSelect] Found ${state.opponent.name} deck with ${cpuDefaultDeck.boards.length} boards`);
        opponentDeck = cpuDefaultDeck;
      } else {
        // Fallback: log error and use player's deck
        console.error(`[handleDeckSelect] ${state.opponent.name} deck not found for size ${state.boardSize}×${state.boardSize}`);
        console.error(`[handleDeckSelect] cpuDecks is:`, cpuDecks);
        opponentDeck = deck;
      }
    } else {
      // Human opponent - would normally choose via URL sharing
      // For now, create random deck from available player boards of same size
      const boards = (savedBoards || []).filter(b => b.boardSize === state.boardSize);
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

    // Show loading state immediately
    setIsSimulatingRound(true);

    selectPlayerBoard(board);

    // Opponent selects a board (CPU chooses random, human would choose via URL)
    let opponentBoard: Board = board; // Fallback to same board

    if (state.opponent?.type === 'cpu') {
      // Filter boards by opponent name and size
      // Board names start with opponent name (e.g., "CPU Left Column" or "CPU Tougher Board 1")
      const opponentBoardsForSize = (cpuBoards || []).filter(
        b => b.boardSize === state.boardSize && b.name.startsWith(state.opponent!.name)
      );

      // CPU selects random board from its own boards
      if (opponentBoardsForSize.length > 0) {
        const randomIndex = Math.floor(Math.random() * opponentBoardsForSize.length);
        opponentBoard = opponentBoardsForSize[randomIndex] || board;
      } else {
        // Fallback: log error and use player's board
        console.error(`[handleBoardSelect] ${state.opponent.name} boards not found for size ${state.boardSize}×${state.boardSize}`);
        opponentBoard = board;
      }

      // Ensure opponent board is playable
      if (!isBoardPlayable(opponentBoard)) {
        // Try to find another playable board from this opponent
        const playableBoard = opponentBoardsForSize.find(b => isBoardPlayable(b));
        opponentBoard = playableBoard || board;
      }
    } else {
      // Human opponent - would normally choose via URL sharing
      // For now, select random board from player's boards of same size
      const boards = (savedBoards || []).filter(b => b.boardSize === state.boardSize);
      if (boards.length > 0) {
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
      setIsSimulatingRound(false);
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

  // Handle home navigation - resets game if coming from game-over
  const handleGoHome = () => {
    // If in game-over or all-rounds-results, reset the game
    if (state.phase.type === 'game-over' || state.phase.type === 'all-rounds-results') {
      resetGame();
    }
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

  // Handle show complete results preference change
  const handleShowCompleteResultsChange = (value: boolean) => {
    const updatedUser: UserProfileType = {
      ...state.user,
      preferences: {
        ...state.user.preferences,
        showCompleteRoundResults: value,
      },
    };
    handleProfileUpdate(updatedUser);
  };

  // Handle explanation style preference change
  const handleExplanationStyleChange = (value: 'lively' | 'technical') => {
    const updatedUser: UserProfileType = {
      ...state.user,
      preferences: {
        ...state.user.preferences,
        explanationStyle: value,
      },
    };
    handleProfileUpdate(updatedUser);
  };

  // Tutorial Handlers

  // Handle tutorial intro - player selected creature and clicked Next
  const handleTutorialIntroNext = (playerCreature: CreatureId, cpuSamData: { name: string; creature: CreatureId }) => {
    setPhase({
      type: 'tutorial-board-creation',
      playerCreature,
      cpuSamData,
    });
  };

  // Handle tutorial intro skip - go to normal user setup
  const handleTutorialSkip = () => {
    setPhase({ type: 'user-setup' });
  };

  // Handle tutorial board completion
  const handleTutorialBoardComplete = (playerBoard: Board, hasTraps: boolean) => {
    // Get CPU Sam's boards (2x2 only for tutorial)
    const cpuSam2x2Boards = (cpuBoards || []).filter(
      b => b.boardSize === 2 && b.name.startsWith(CPU_OPPONENT_NAME)
    );

    if (cpuSam2x2Boards.length === 0) {
      console.error('[Tutorial] No CPU Sam 2x2 boards found!');
      return;
    }

    // Select appropriate CPU Sam board based on trap usage
    let selectedCpuBoard: Board;

    if (hasTraps) {
      // Player set traps - try to find a CPU board that would hit them
      // IMPORTANT: Opponent's board is rotated 180 degrees during simulation!
      // Position mapping after rotation (2x2 board):
      //   Player trap at (0,0) → Opponent needs (1,1) in unrotated board
      //   Player trap at (0,1) → Opponent needs (1,0) in unrotated board
      //   Player trap at (1,0) → Opponent needs (0,1) in unrotated board
      //   Player trap at (1,1) → Opponent needs (0,0) in unrotated board

      const hasTrapAt_0_0 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 0 && move.position.col === 0
      );
      const hasTrapAt_0_1 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 0 && move.position.col === 1
      );
      const hasTrapAt_1_0 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 1 && move.position.col === 0
      );
      const hasTrapAt_1_1 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 1 && move.position.col === 1
      );

      // Select CPU board based on rotated positions:
      // Unrotated boards:
      //   - "Left Column": (1,0) → (0,0) → goal
      //   - "Right Column": (1,1) → (0,1) → goal
      //   - "Left-Right": (1,0) → (1,1) → (0,1) → goal
      //   - "Right-Left": (1,1) → (1,0) → (0,0) → goal

      if (hasTrapAt_0_0) {
        // Trap at (0,0) → Need (1,1) after rotation → "Left-Right" has (1,1) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name.includes('Left-Right')) || cpuSam2x2Boards[0]!;
      } else if (hasTrapAt_0_1) {
        // Trap at (0,1) → Need (1,0) after rotation → "Right-Left" has (1,0) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name.includes('Right-Left')) || cpuSam2x2Boards[0]!;
      } else if (hasTrapAt_1_0) {
        // Trap at (1,0) → Need (0,1) after rotation → "Right Column" has (0,1) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name === 'CPU Sam Right Column') || cpuSam2x2Boards[0]!;
      } else if (hasTrapAt_1_1) {
        // Trap at (1,1) → Need (0,0) after rotation → "Left Column" has (0,0) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name === 'CPU Sam Left Column') || cpuSam2x2Boards[0]!;
      } else {
        // Trap elsewhere, just pick first one
        selectedCpuBoard = cpuSam2x2Boards[0]!;
      }
    } else {
      // No traps - pick any board (they all reach goal)
      selectedCpuBoard = cpuSam2x2Boards[0]!;
    }

    // Get creatures from current phase
    const phaseData = state.phase.type === 'tutorial-board-creation' ? state.phase : null;
    if (!phaseData) return;

    const playerCreature = phaseData.playerCreature;
    const opponentCreature = phaseData.cpuSamData.creature;

    // Simulate the round
    const result = simulateRound(1, playerBoard, selectedCpuBoard);
    result.playerCreature = playerCreature;
    result.opponentCreature = opponentCreature;

    // Save the board to player's boards
    handleBoardSave(playerBoard);

    // Transition to tutorial results
    setPhase({
      type: 'tutorial-results',
      result,
      playerBoard,
    });
  };

  // Handle tutorial results continue
  const handleTutorialResultsContinue = () => {
    const phaseData = state.phase.type === 'tutorial-results' ? state.phase : null;
    if (!phaseData) return;

    // Get creature data from the result
    const playerCreature = phaseData.result.playerCreature;
    const opponentCreature = phaseData.result.opponentCreature;
    const firstBoard = phaseData.playerBoard;
    const playerWon = phaseData.result.winner === 'player';

    if (!playerCreature || !opponentCreature) return;

    // Get CPU Sam name from the opponent board name (e.g., "CPU Sam Left Column" -> "CPU Sam")
    const cpuSamName = phaseData.result.opponentBoard.name.split(' ').slice(0, 2).join(' ');

    setPhase({
      type: 'tutorial-name-entry',
      playerCreature,
      opponentCreature,
      firstBoard,
      playerWon,
      cpuSamName,
    });
  };

  // Handle tutorial name entry continue
  const handleTutorialNameContinue = (newUser: UserProfileType) => {
    // Save user to localStorage
    setSavedUser(newUser);

    // Update game state and transition to board management
    loadState({
      ...state,
      user: newUser,
      phase: { type: 'board-management' },
    });

    // Show welcome modal
    setShowWelcomeModal(true);
  };

  // Render phase-specific content
  const renderPhase = () => {
    switch (state.phase.type) {
      case 'tutorial-intro':
        return (
          <TutorialIntro
            onNext={handleTutorialIntroNext}
            onSkip={handleTutorialSkip}
          />
        );

      case 'tutorial-board-creation':
        return (
          <TutorialBoardCreator
            cpuSamData={state.phase.cpuSamData}
            onBoardComplete={handleTutorialBoardComplete}
          />
        );

      case 'tutorial-results':
        if (!state.phase.result) return null;
        return (
          <RoundResults
            result={state.phase.result}
            playerName="You"
            opponentName={state.phase.result.opponentBoard?.name.split(' ')[0] + ' ' + state.phase.result.opponentBoard?.name.split(' ')[1] || 'CPU Sam'}
            playerScore={state.phase.result.playerPoints || 0}
            opponentScore={state.phase.result.opponentPoints || 0}
            onContinue={handleTutorialResultsContinue}
            continueButtonText="Continue"
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
          />
        );

      case 'tutorial-name-entry':
        return (
          <TutorialNameEntry
            playerCreature={state.phase.playerCreature}
            opponentCreature={state.phase.opponentCreature}
            firstBoard={state.phase.firstBoard}
            playerWon={state.phase.playerWon}
            cpuSamName={state.phase.cpuSamName}
            onContinue={handleTutorialNameContinue}
          />
        );

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
                            {getOpponentIcon(opponent)}
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
                      onBoardSelected={() => { }} // No selection in management mode
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
                <p>Classic mode - Select a board each round (5 rounds)</p>
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

      case 'board-size-selection':
        return (
          <BoardSizeSelector
            onSizeSelected={handleBoardSizeSelect}
            onBack={() => setPhase({ type: 'game-mode-selection' })}
          />
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

      case 'deck-selection': {
        // Filter boards and decks by selected board size
        const filteredBoards = state.boardSize
          ? (savedBoards || []).filter(board => board.boardSize === state.boardSize)
          : (savedBoards || []);

        const filteredDecks = state.boardSize
          ? (savedDecks || []).filter(deck =>
            deck.boards.length > 0 && deck.boards[0]?.boardSize === state.boardSize
          )
          : (savedDecks || []);

        if (showDeckCreator) {
          return (
            <DeckCreator
              availableBoards={filteredBoards}
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
            decks={filteredDecks}
            onDeckSelected={handleDeckSelect}
            onCreateDeck={() => setShowDeckCreator(true)}
            onEditDeck={handleDeckEdit}
            onDeleteDeck={handleDeckDelete}
            userName={state.user.name}
          />
        );
      }

      case 'board-selection': {
        // Filter boards by selected board size
        const filteredBoards = state.boardSize
          ? (savedBoards || []).filter(board => board.boardSize === state.boardSize)
          : (savedBoards || []);

        return (
          <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2>Round {state.phase.round} of 5</h2>
              <p>
                Score: {state.user.name} {state.playerScore} - {state.opponent?.name}{' '}
                {state.opponentScore}
              </p>
              {state.boardSize && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Board Size: {state.boardSize}×{state.boardSize}
                </p>
              )}
            </div>
            <SavedBoards
              boards={filteredBoards}
              onBoardSelected={handleBoardSelect}
              onBoardSaved={handleBoardSave}
              onBoardDeleted={handleBoardDelete}
              currentRound={state.currentRound}
              userName={state.user.name}
              opponentName={state.opponent?.name || 'Opponent'}
            />

            {/* Loading overlay */}
            {isSimulatingRound && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '2rem 3rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '3rem',
                      marginBottom: '1rem',
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    ⚔️
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a1a' }}>
                    Simulating Round...
                  </h3>
                </div>
              </div>
            )}
          </div>
        );
      }

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
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
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
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
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
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
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
          <div className={styles.headerActions}>
            {/* Home button - show when not on board-management or tutorial */}
            {state.phase.type !== 'board-management' &&
              state.phase.type !== 'user-setup' &&
              !state.phase.type.startsWith('tutorial') && (
                <button
                  className={styles.homeButton}
                  onClick={handleGoHome}
                  aria-label="Go to home"
                >
                  🏠 Home
                </button>
              )}
            <button
              className={styles.profileButton}
              onClick={() => setIsProfileModalOpen(true)}
              aria-label="Open profile"
            >
              <span className={styles.profileIcon}>👤</span>
              <span className={styles.profileName}>{state.user.name}</span>
            </button>
          </div>
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

      {/* Welcome Modal (CPU Tougher introduction) */}
      {showWelcomeModal && state.user.name && (
        <WelcomeModal
          playerName={state.user.name}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
    </div>
  );
}

export default App;
