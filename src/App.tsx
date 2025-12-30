import React, { useEffect, useState, useRef } from 'react';
import styles from './App.module.css';
import { useGameState } from '@/hooks/useGameState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { simulateRound, simulateAllRounds, isBoardPlayable } from '@/utils/game-simulation';
import { initializeDefaultCpuData, initializeCpuTougherData, generateCpuBoardsForSize, generateCpuDeckForSize } from '@/utils/default-cpu-data';
import { getOpponentIcon, createInitialState } from '@/utils/app-helpers';
import { updateOpponentStats, createHumanOpponent } from '@/utils/opponent-helpers';
import { getNextUnlock, isDeckModeUnlocked, getFeatureUnlocks } from '@/utils/feature-unlocks';
import { generateChallengeUrl, generateFinalResultsUrl, getChallengeFromUrl, clearChallengeFromUrl } from '@/utils/challenge-url';
import { decodeMinimalBoard } from '@/utils/board-encoding';
import { fetchRemoteCpuBoards, fetchRemoteCpuDeck } from '@/utils/remote-cpu-boards';
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
  GeneratingModal,
  FeatureUnlockModal,
  ShareChallenge,
} from '@/components';
import type { UserProfile as UserProfileType, Board, Opponent, GameState, Deck, GameMode, CreatureId, RoundResult } from '@/types';
import { UserProfileSchema, BoardSchema, OpponentSchema, DeckSchema } from '@/schemas';
import { CPU_OPPONENT_ID, CPU_TOUGHER_OPPONENT_ID, CPU_OPPONENT_NAME } from '@/constants/game-rules';
import { z } from 'zod';

// Type for storing round results with metadata for retrieval
type StoredRoundResult = RoundResult & {
  gameId: string; // Unique game session ID
  opponentId: string;
  opponentName: string;
  boardSize: number;
  timestamp: number;
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

  // Handle Discord OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordId = params.get('discord_id');
    const discordUsername = params.get('discord_username');
    const discordAvatar = params.get('discord_avatar');

    if (discordId && discordUsername && savedUser) {
      console.log('[APP] Discord OAuth callback detected, updating user profile:', {
        discordId,
        discordUsername,
        discordAvatar,
      });

      // Update user profile with Discord info
      const updatedUser: UserProfileType = {
        ...savedUser,
        discordId,
        discordUsername,
        discordAvatar: discordAvatar || undefined,
      };

      setSavedUser(updatedUser);

      // Clean URL by removing Discord params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('discord_id');
      newUrl.searchParams.delete('discord_username');
      newUrl.searchParams.delete('discord_avatar');
      window.history.replaceState({}, '', newUrl.toString());

      // Check where user was before OAuth
      const returnTo = sessionStorage.getItem('discord-oauth-return');
      sessionStorage.removeItem('discord-oauth-return');

      console.log('[APP] Discord connection successful! User updated.', { returnTo });

      // Reload page to refresh game state with updated user
      window.location.reload();
    }
  }, [savedUser, setSavedUser]);

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

  // Storage for remote CPU boards (fetched from GitHub Pages)
  const [remoteCpuBoards, setRemoteCpuBoards] = useLocalStorage<Board[] | null>(
    'spaces-game-remote-cpu-boards',
    BoardSchema.array(),
    []
  );

  // LocalStorage for round results (keep last 100 rounds across all games)
  const [savedRoundResults, setSavedRoundResults] = useLocalStorage<StoredRoundResult[]>(
    'spaces-game-round-results',
    z.any().array(), // Use any for now since we don't have a StoredRoundResult schema
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

    // Check if CPU boards exist (at least 3 for each size)
    const cpuBoards2x2 = (cpuBoards || []).filter(b => b.boardSize === 2 && b.name.startsWith(CPU_OPPONENT_NAME));
    const cpuBoards3x3 = (cpuBoards || []).filter(b => b.boardSize === 3 && b.name.startsWith(CPU_OPPONENT_NAME));
    const cpuTougherBoards2x2 = (cpuBoards || []).filter(b => b.boardSize === 2 && b.name.startsWith('CPU Tougher'));
    const cpuTougherBoards3x3 = (cpuBoards || []).filter(b => b.boardSize === 3 && b.name.startsWith('CPU Tougher'));

    // Check if CPU decks exist with proper names
    const cpuDeck2x2Exists = cpuDecks?.some(d => d.name === 'CPU Sam 2×2 Deck');
    const cpuDeck3x3Exists = cpuDecks?.some(d => d.name === 'CPU Sam 3×3 Deck');
    const cpuTougherDeck2x2Exists = cpuDecks?.some(d => d.name === 'CPU Tougher 2×2 Deck');
    const cpuTougherDeck3x3Exists = cpuDecks?.some(d => d.name === 'CPU Tougher 3×3 Deck');

    const newOpponents: Opponent[] = [];
    const newCpuBoards: Board[] = [];
    let updatedCpuDecks = cpuDecks || [];

    // Initialize regular CPU opponent if it doesn't exist OR if boards/decks are missing
    if (!cpuExists || cpuBoards2x2.length < 3 || cpuBoards3x3.length < 3 || !cpuDeck2x2Exists || !cpuDeck3x3Exists) {
      console.log('[APP] Initializing default CPU opponent, boards, and decks');
      const defaultData = initializeDefaultCpuData();

      if (!cpuExists) {
        newOpponents.push(defaultData.opponent);
      }

      // Only add boards if they don't exist (at least 3)
      if (cpuBoards2x2.length < 3) {
        newCpuBoards.push(...defaultData.boards2x2);
      }
      if (cpuBoards3x3.length < 3) {
        newCpuBoards.push(...defaultData.boards3x3);
      }

      // Remove old CPU decks and add new ones
      if (!cpuDeck2x2Exists || !cpuDeck3x3Exists) {
        console.log('[APP] Adding CPU decks:', defaultData.deck2x2.name, defaultData.deck3x3.name);
        updatedCpuDecks = updatedCpuDecks.filter(
          d => d.name !== 'CPU Sam 2×2 Deck' && d.name !== 'CPU 3×3 Deck' && d.name !== 'CPU 2×2 Deck'
        );
        updatedCpuDecks.push(defaultData.deck2x2, defaultData.deck3x3);
      }
    }

    // Initialize CPU Tougher opponent if it doesn't exist OR if boards/decks are missing
    if (!cpuTougherExists || cpuTougherBoards2x2.length < 3 || cpuTougherBoards3x3.length < 3 || !cpuTougherDeck2x2Exists || !cpuTougherDeck3x3Exists) {
      console.log('[APP] Initializing CPU Tougher opponent, boards, and decks');
      const tougherData = initializeCpuTougherData();

      if (!cpuTougherExists) {
        newOpponents.push(tougherData.opponent);
      }

      // Only add boards if they don't exist (at least 3)
      if (cpuTougherBoards2x2.length < 3) {
        console.log('[APP] Adding CPU Tougher 2x2 boards:', tougherData.boards2x2.map(b => b.name));
        newCpuBoards.push(...tougherData.boards2x2);
      }
      if (cpuTougherBoards3x3.length < 3) {
        console.log('[APP] Adding CPU Tougher 3x3 boards:', tougherData.boards3x3.map(b => b.name));
        newCpuBoards.push(...tougherData.boards3x3);
      }

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

  // CPU generation state
  const [isGeneratingCpuBoards, setIsGeneratingCpuBoards] = useState(false);
  const [generatingSize, setGeneratingSize] = useState<number>(2);

  // Feature unlock modal state
  const [showFeatureUnlockModal, setShowFeatureUnlockModal] = useState(false);
  const [unlockedBoardSizes, setUnlockedBoardSizes] = useState<number[]>([]);
  const [deckModeJustUnlocked, setDeckModeJustUnlocked] = useState(false);

  // Track which game counts we've already shown unlock notifications for
  const shownUnlocksRef = useRef<Set<number>>(new Set());

  // Incoming challenge state (preserved through tutorial if user is new)
  const [incomingChallenge, setIncomingChallenge] = useState<ReturnType<typeof getChallengeFromUrl>>(null);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (state.user.name) {
      // Only save if user has actually changed (deep equality check)
      const userChanged = JSON.stringify(savedUser) !== JSON.stringify(state.user);
      if (userChanged) {
        console.log('[APP] Saving user to localStorage:', state.user.name);
        setSavedUser(state.user);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user]);

  // Detect feature unlocks when totalGames changes
  useEffect(() => {
    const currentGames = state.user.stats.totalGames;

    // Only check for unlocks if we're in game-over or all-rounds-results phase
    // This ensures we show the modal right after a game completes
    if (currentGames === 0 || (state.phase.type !== 'game-over' && state.phase.type !== 'all-rounds-results')) {
      return;
    }

    // Skip if we've already shown unlocks for this game count
    if (shownUnlocksRef.current.has(currentGames)) {
      return;
    }

    const previousGames = currentGames - 1;

    // Get unlocks before and after
    const previousUnlocks = getFeatureUnlocks({ ...state.user, stats: { ...state.user.stats, totalGames: previousGames } });
    const currentUnlocks = getFeatureUnlocks(state.user);

    // Find newly unlocked board sizes
    const newBoardSizes = currentUnlocks.boardSizes.filter(
      size => !previousUnlocks.boardSizes.includes(size)
    );

    // Check if deck mode was just unlocked
    const newDeckMode = currentUnlocks.deckMode && !previousUnlocks.deckMode;

    // Show modal if anything was unlocked
    if (newBoardSizes.length > 0 || newDeckMode) {
      setUnlockedBoardSizes(newBoardSizes);
      setDeckModeJustUnlocked(newDeckMode);
      setShowFeatureUnlockModal(true);
      // Mark this game count as shown
      shownUnlocksRef.current.add(currentGames);
    }
  }, [state.user.stats.totalGames, state.user, state.phase.type]);

  // Helper function to save a round result to localStorage
  const saveRoundResult = (result: RoundResult, gameId: string | null, opponent: Opponent | null, boardSize: number) => {
    if (!opponent || !gameId) {
      console.warn('[saveRoundResult] Missing opponent or gameId, not saving');
      return;
    }

    const storedResult: StoredRoundResult = {
      ...result,
      gameId,
      opponentId: opponent.id,
      opponentName: opponent.name,
      boardSize,
      timestamp: Date.now(),
    };

    console.log('[saveRoundResult] Saving round', result.round, 'for gameId:', gameId);

    // Add to saved results and keep only last 100
    const updatedResults = [storedResult, ...(savedRoundResults || [])].slice(0, 100);
    setSavedRoundResults(updatedResults);

    console.log('[saveRoundResult] Total saved results now:', updatedResults.filter(r => r.gameId === gameId).length, 'for this game');
  };

  // Helper function to load round results for a specific game session
  const loadRoundResults = (gameId: string | null): RoundResult[] => {
    if (!gameId || !savedRoundResults) return [];

    // Filter results for this game session, sorted by round
    return savedRoundResults
      .filter(r => r.gameId === gameId)
      .sort((a, b) => a.round - b.round)
      .map(({ gameId, opponentId, opponentName, boardSize, timestamp, ...roundResult }) => roundResult);
  };

  // Function to handle incoming challenges
  const handleIncomingChallenge = (challengeData: ReturnType<typeof getChallengeFromUrl>) => {
    if (!challengeData) return;

    // Store the challenge data
    setIncomingChallenge(challengeData);

    // If user already exists, show them the challenge immediately
    if (state.user.name) {
      try {
        console.log('[APP] Received challenge:', challengeData);

        // Clear URL
        clearChallengeFromUrl();

        // Check if this is final results
        if (challengeData.isFinalResults) {
          // This is final results share - go directly to game-over screen
          const currentOpponent = state.opponent;

          // Determine winner (note: scores are flipped because they're from opponent's perspective)
          const opponentFinalScore = challengeData.playerScore || 0;
          const playerFinalScore = challengeData.opponentScore || 0;

          let winner: 'player' | 'opponent' | 'tie';
          if (playerFinalScore > opponentFinalScore) {
            winner = 'player';
          } else if (opponentFinalScore > playerFinalScore) {
            winner = 'opponent';
          } else {
            winner = 'tie';
          }

          // Load round history from localStorage (optimistically)
          const roundHistory = loadRoundResults(challengeData.gameId);

          loadState({
            ...state,
            opponent: currentOpponent || null,
            playerScore: playerFinalScore,
            opponentScore: opponentFinalScore,
            roundHistory,
            phase: { type: 'game-over', winner },
          });

          setIncomingChallenge(null);
          return;
        }

        // Decode the opponent's board
        const opponentBoard = decodeMinimalBoard(challengeData.playerBoard);

        // Find or create opponent using playerId from challenge
        let opponent = (savedOpponents || []).find(o => o.id === challengeData.playerId);

        if (!opponent) {
          // Create new opponent from challenge data
          // Note: Use the playerId from the challenge as the ID to maintain consistency
          opponent = {
            ...createHumanOpponent(challengeData.playerName),
            id: challengeData.playerId, // Override with the ID from challenge to ensure consistency
          };
          // Save to localStorage
          setSavedOpponents([...(savedOpponents || []), opponent]);
        }

        // Check if we're continuing an ongoing game (same gameId)
        const isOngoingGame = state.gameId === challengeData.gameId;

        // Get scores from URL or use current scores
        const playerScore = challengeData.opponentScore !== undefined ? challengeData.opponentScore :
                           (isOngoingGame ? state.playerScore : 0);
        const opponentScore = challengeData.playerScore !== undefined ? challengeData.playerScore :
                             (isOngoingGame ? state.opponentScore : 0);

        console.log('[handleIncomingChallenge] Ongoing game?', isOngoingGame);
        console.log('[handleIncomingChallenge] Current roundHistory length:', state.roundHistory.length);
        console.log('[handleIncomingChallenge] Loading from localStorage for gameId:', challengeData.gameId);

        // Show alert
        const message = isOngoingGame
          ? `${opponent.name} has responded! Ready for Round ${challengeData.round}?`
          : `You've received a challenge from ${opponent.name} for a ${challengeData.boardSize}×${challengeData.boardSize} board! Would you like to respond?`;

        if (window.confirm(message)) {
          // Load round history from localStorage using gameId
          const roundHistory = loadRoundResults(challengeData.gameId);
          console.log('[handleIncomingChallenge] Loaded roundHistory from localStorage:', roundHistory.length, 'rounds');
          console.log('[handleIncomingChallenge] Rounds:', roundHistory.map(r => `R${r.round}: ${r.winner}`));

          // Set up game state to respond to challenge
          loadState({
            ...state,
            opponent,
            gameId: challengeData.gameId, // Use gameId from challenge
            boardSize: challengeData.boardSize,
            gameMode: challengeData.gameMode,
            currentRound: challengeData.round,
            opponentSelectedBoard: opponentBoard,
            playerSelectedBoard: null, // Clear previous board selection
            playerScore,
            opponentScore,
            roundHistory,
            phase: { type: 'board-selection', round: challengeData.round },
          });
        }

        // Clear the challenge from state
        setIncomingChallenge(null);
      } catch (error) {
        console.error('[APP] Failed to parse challenge:', error);
        clearChallengeFromUrl();
        setIncomingChallenge(null);
      }
    }
    // If user doesn't exist yet, they'll go through tutorial first
    // The challenge will be preserved in state and handled after tutorial
  };

  // Check for incoming challenge in URL on mount and when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const challengeData = getChallengeFromUrl();
      if (challengeData) {
        handleIncomingChallenge(challengeData);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes (when user pastes new URL or navigates)
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user.name]); // Re-run when user changes (in case they complete tutorial)

  // Update opponent record when game ends
  useEffect(() => {
    if (!state.opponent) return;

    // Check if we're in an end-game phase
    if (state.phase.type === 'game-over' || state.phase.type === 'all-rounds-results') {
      // Determine if opponent won (ties don't count as wins or losses)
      const opponentWon = state.opponentScore > state.playerScore;
      const isTie = state.opponentScore === state.playerScore;

      // Only update opponent stats if there was a winner (not a tie)
      if (isTie) {
        return; // Don't update stats for ties
      }

      // Update opponent stats
      const updatedOpponent = updateOpponentStats(state.opponent, opponentWon);

      // Only update if the record actually changed (to avoid infinite loops)
      if (updatedOpponent.wins !== state.opponent.wins || updatedOpponent.losses !== state.opponent.losses) {
        // Save updated opponent to localStorage
        const existingIndex = (savedOpponents || []).findIndex((o) => o.id === updatedOpponent.id);
        if (existingIndex >= 0) {
          const updated = [...(savedOpponents || [])];
          updated[existingIndex] = updatedOpponent;
          setSavedOpponents(updated);
          console.log('[APP] Updated opponent record:', updatedOpponent.name, `(${updatedOpponent.wins}-${updatedOpponent.losses})`);
        }

        // Update opponent in game state
        loadState({
          ...state,
          opponent: updatedOpponent,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase.type, state.opponent?.id, state.playerScore, state.opponentScore]);

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

  // Check if CPU has boards/decks for a given size
  const cpuHasBoardsForSize = (opponentName: string, size: number): boolean => {
    if (!state.opponent || state.opponent.type !== 'cpu') return true;

    // Check if CPU has boards for this size (minimum 3 boards required)
    const cpuBoardsForSize = (cpuBoards || []).filter(
      b => b.boardSize === size && b.name.startsWith(opponentName)
    );

    // Check if CPU has deck for this size
    const expectedDeckName = `${opponentName} ${size}×${size} Deck`;
    const cpuDeckForSize = (cpuDecks || []).find(d => d.name === expectedDeckName);

    return cpuBoardsForSize.length >= 3 && cpuDeckForSize !== undefined;
  };

  // Handle board size selection
  const handleBoardSizeSelect = async (size: number) => {
    setBoardSize(size);
    // After selecting board size, check if opponent is already selected
    if (state.phase.type === 'board-size-selection') {
      const gameMode = state.phase.gameMode;

      // If opponent already selected, check if we need to generate CPU boards
      if (state.opponent && state.opponent.type === 'cpu') {
        // Check if CPU has boards/decks for this size
        if (!cpuHasBoardsForSize(state.opponent.name, size)) {
          // Show generating modal
          setGeneratingSize(size);
          setIsGeneratingCpuBoards(true);

          // Generate CPU boards/decks
          await handleGenerateCpuBoards(size);

          // Hide generating modal after a brief delay
          setTimeout(() => {
            setIsGeneratingCpuBoards(false);
            // Proceed to next phase
            setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
          }, 500);
        } else {
          // CPU already has boards, proceed to next phase
          setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
        }
      } else if (state.opponent && state.opponent.type === 'remote-cpu') {
        // Fetch boards from remote server for remote CPU
        // Show generating modal
        setGeneratingSize(size);
        setIsGeneratingCpuBoards(true);

        try {
          // Fetch boards for this size
          const boards = await fetchRemoteCpuBoards(size);

          if (boards.length > 0) {
            // Filter out boards already in storage to avoid duplicates
            const existingBoardIds = new Set((remoteCpuBoards || []).map(b => b.id));
            const newBoards = boards.filter(b => !existingBoardIds.has(b.id));

            if (newBoards.length > 0) {
              setRemoteCpuBoards([...(remoteCpuBoards || []), ...newBoards]);
            }

            console.log(`[handleBoardSizeSelect] Fetched ${boards.length} remote CPU boards for ${size}×${size}`);
          } else {
            console.warn(`[handleBoardSizeSelect] No remote CPU boards fetched for ${size}×${size}`);
            alert(`Could not fetch boards from remote server. Please check your connection and try again.`);
            setIsGeneratingCpuBoards(false);
            return;
          }
        } catch (error) {
          console.error('[handleBoardSizeSelect] Error fetching remote CPU boards:', error);
          alert(`Failed to fetch boards from remote server. Please try again.`);
          setIsGeneratingCpuBoards(false);
          return;
        }

        // Hide generating modal after a brief delay
        setTimeout(() => {
          setIsGeneratingCpuBoards(false);
          // Proceed to next phase based on game mode
          setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
        }, 500);
      } else if (state.opponent) {
        // Non-CPU opponent, skip opponent selection and go to next phase
        setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
      } else {
        // No opponent selected yet, go to opponent selection
        setPhase({ type: 'opponent-selection', gameMode });
      }
    }
  };

  // Handle generating CPU boards for a specific size
  const handleGenerateCpuBoards = async (size: number, opponentName?: string): Promise<Deck | undefined> => {
    const opponent = state.opponent;
    if (!opponent && !opponentName) return undefined;

    const name = opponentName || opponent?.name;
    if (!name) return undefined;

    // Check if boards already exist for this size (defensive check)
    if (opponent && cpuHasBoardsForSize(name, size)) {
      console.log(`[handleGenerateCpuBoards] Boards already exist for ${name} ${size}x${size}, skipping generation`);

      // Return existing deck
      const expectedDeckName = `${name} ${size}×${size} Deck`;
      const existingDeck = (cpuDecks || []).find(d => d.name === expectedDeckName && d.boards.length === 10);
      return existingDeck;
    }

    console.log(`[handleGenerateCpuBoards] Generating ${size}x${size} boards for ${name}`);

    // Determine if this is CPU Tougher (includes traps)
    const isTougher = opponent?.id === 'cpu-tougher-opponent' || name.includes('Tougher');

    // Generate boards for this size
    const newBoards = generateCpuBoardsForSize(name, size, isTougher);

    // Generate deck for this size
    const newDeck = generateCpuDeckForSize(name, size, newBoards);

    // Add boards to CPU boards (check for duplicates first)
    const existingBoardIds = new Set((cpuBoards || []).map((b) => b.id));
    const uniqueNewBoards = newBoards.filter((b) => !existingBoardIds.has(b.id));

    if (uniqueNewBoards.length > 0) {
      setCpuBoards([...(cpuBoards || []), ...uniqueNewBoards]);
    }

    // Add deck to CPU decks (check for duplicates first)
    const existingDeckIds = new Set((cpuDecks || []).map((d) => d.id));
    if (!existingDeckIds.has(newDeck.id)) {
      setCpuDecks([...(cpuDecks || []), newDeck]);
    }

    console.log(`[handleGenerateCpuBoards] Added ${uniqueNewBoards.length} boards and 1 deck`);

    // Return the newly generated deck
    return newDeck;
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

    // Generate game ID for human opponents (for tracking across challenges)
    const gameId = opponent.type === 'human' ? `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;

    // Select opponent with game mode and reset game state for new game
    loadState({
      ...state,
      opponent,
      gameId,
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
  const handleDeckSelect = async (deck: Deck, opponent?: Opponent) => {
    // If opponent is provided, update it in game state
    const selectedOpponent = opponent || state.opponent;

    if (opponent) {
      // Save opponent to localStorage if not already saved
      const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
      if (existingIndex >= 0) {
        const updated = [...(savedOpponents || [])];
        updated[existingIndex] = opponent;
        setSavedOpponents(updated);
      } else {
        setSavedOpponents([...(savedOpponents || []), opponent]);
      }

      // Update state with the selected opponent
      loadState({
        ...state,
        opponent,
        gameMode: 'deck',
        boardSize: deck.boards.length > 0 ? deck.boards[0]?.boardSize ?? 2 : 2,
        phase: { type: 'all-rounds-results', results: [] }, // Will be overwritten below
      });
    }

    // Determine board size from the deck
    const deckSize = deck.boards.length > 0 ? deck.boards[0]?.boardSize : state.boardSize;

    selectPlayerDeck(deck);

    // Opponent selects a deck
    let opponentDeck: Deck;

    if (selectedOpponent?.type === 'cpu') {
      // Match deck to specific CPU opponent by name
      // Deck names are like "CPU 2×2 Deck" or "CPU Tougher 2×2 Deck"
      const expectedDeckName = `${selectedOpponent.name} ${deckSize}×${deckSize} Deck`;

      console.log(`[handleDeckSelect] Looking for deck: "${expectedDeckName}"`);

      // First try to find existing deck
      let cpuDefaultDeck = (cpuDecks || []).find(
        d => d.name === expectedDeckName && d.boards.length === 10
      );

      // If not found, generate it
      if (!cpuDefaultDeck) {
        console.log(`[handleDeckSelect] CPU deck not found for ${selectedOpponent.name} ${deckSize}×${deckSize}, generating...`);

        // Show generating modal
        setGeneratingSize(deckSize ?? 2);
        setIsGeneratingCpuBoards(true);

        // Generate CPU boards/decks and get the new deck
        cpuDefaultDeck = await handleGenerateCpuBoards(deckSize ?? 2, selectedOpponent.name);

        // Hide generating modal after a brief delay
        setTimeout(() => {
          setIsGeneratingCpuBoards(false);
        }, 500);
      }

      if (cpuDefaultDeck) {
        // Use the opponent-specific CPU deck (from hidden storage or just generated)
        console.log(`[handleDeckSelect] Using ${selectedOpponent.name} deck with ${cpuDefaultDeck.boards.length} boards`);
        opponentDeck = cpuDefaultDeck;
      } else {
        // Fallback: log error and use player's deck
        console.error(`[handleDeckSelect] ${selectedOpponent.name} deck not found or could not be generated for size ${deckSize}×${deckSize}`);
        opponentDeck = deck;
      }
    } else if (selectedOpponent?.type === 'remote-cpu') {
      // Remote CPU - fetch pre-made deck from remote server
      console.log(`[handleDeckSelect] Fetching Remote CPU deck from server`);

      // Show generating modal
      setGeneratingSize(deckSize ?? 2);
      setIsGeneratingCpuBoards(true);

      try {
        const remoteDeck = await fetchRemoteCpuDeck(deckSize ?? 2);

        if (remoteDeck) {
          opponentDeck = remoteDeck;
          console.log(`[handleDeckSelect] Fetched Remote CPU deck with ${opponentDeck.boards.length} boards`);
        } else {
          console.error(`[handleDeckSelect] Failed to fetch Remote CPU deck for ${deckSize}×${deckSize}`);
          alert('Failed to fetch Remote CPU deck from server. Please try again.');
          setIsGeneratingCpuBoards(false);
          return;
        }
      } catch (error) {
        console.error('[handleDeckSelect] Error fetching Remote CPU deck:', error);
        alert('Failed to fetch Remote CPU deck from server. Please try again.');
        setIsGeneratingCpuBoards(false);
        return;
      } finally {
        // Hide generating modal
        setTimeout(() => {
          setIsGeneratingCpuBoards(false);
        }, 500);
      }
    } else {
      // Human opponent - would normally choose via URL sharing
      // For now, create random deck from available player boards of same size
      const boards = (savedBoards || []).filter(b => b.boardSize === deckSize);
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
          name: `${selectedOpponent?.name || 'Opponent'}'s Deck`,
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

    // Check if we're responding to a challenge (opponent board already selected)
    if (state.opponentSelectedBoard) {
      // Responding to challenge - simulate immediately with the received board
      setIsSimulatingRound(true);

      setTimeout(() => {
        const result = simulateRound(state.currentRound, board, state.opponentSelectedBoard!);

        // Add creature data to result if available
        if (savedUser?.playerCreature) {
          result.playerCreature = savedUser.playerCreature;
        }
        if (savedUser?.opponentCreature) {
          result.opponentCreature = savedUser.opponentCreature;
        }

        completeRound(result);
        saveRoundResult(result, state.gameId, state.opponent, state.boardSize!);
        setIsSimulatingRound(false);
      }, 500);
      return;
    }

    // Check if opponent is human OR if we don't have an opponent (challenge response round 2+)
    // In both cases, go to share screen
    if (state.opponent?.type === 'human' || !state.opponent) {
      // For human opponents or challenge responses, go to share-challenge phase
      setPhase({ type: 'share-challenge', round: state.currentRound });
      return;
    }

    // CPU opponent flow - proceed with automatic simulation
    // Show loading state immediately
    setIsSimulatingRound(true);

    // Opponent selects a board (CPU chooses random)
    let opponentBoard: Board = board; // Fallback to same board

    // Determine which board pool to use based on opponent type
    const isRemoteCpu = state.opponent.type === 'remote-cpu';
    const boardPool = isRemoteCpu ? (remoteCpuBoards || []) : (cpuBoards || []);

    // Filter boards by opponent name and size
    // For remote CPU, just filter by size (boards are generic)
    // For local CPU, filter by name prefix (e.g., "CPU Left Column" or "CPU Tougher Board 1")
    const opponentBoardsForSize = isRemoteCpu
      ? boardPool.filter(b => b.boardSize === state.boardSize)
      : boardPool.filter(b => b.boardSize === state.boardSize && b.name.startsWith(state.opponent!.name));

    console.log(`[handleBoardSelect] Opponent: ${state.opponent!.name}, Type: ${state.opponent!.type}, Board size: ${state.boardSize}x${state.boardSize}`);
    console.log(`[handleBoardSelect] Found ${opponentBoardsForSize.length} boards for ${state.opponent!.name}:`, opponentBoardsForSize.map(b => b.name));

    // CPU selects random board from its own boards
    if (opponentBoardsForSize.length > 0) {
      const randomIndex = Math.floor(Math.random() * opponentBoardsForSize.length);
      opponentBoard = opponentBoardsForSize[randomIndex] || board;
      console.log(`[handleBoardSelect] Selected board #${randomIndex + 1}: ${opponentBoard.name}`);
    } else {
      // Fallback: log error and use player's board
      console.error(`[handleBoardSelect] ${state.opponent?.name ?? 'CPU'} boards not found for size ${state.boardSize}×${state.boardSize}`);
      console.error(`[handleBoardSelect] All boards in pool:`, boardPool.map(b => `${b.name} (${b.boardSize}x${b.boardSize})`));
      opponentBoard = board;
    }

    // Ensure opponent board is playable
    if (!isBoardPlayable(opponentBoard)) {
      // Try to find another playable board from this opponent
      const playableBoard = opponentBoardsForSize.find(b => isBoardPlayable(b));
      opponentBoard = playableBoard || board;
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
      saveRoundResult(result, state.gameId, state.opponent, state.boardSize!);
      setIsSimulatingRound(false);
    }, 500); // Shorter delay for better UX
  };

  // Handle continuing to next round
  const handleContinue = () => {
    console.log('[handleContinue] Current round:', state.currentRound);
    console.log('[handleContinue] Round history length:', state.roundHistory.length);
    console.log('[handleContinue] Round history:', state.roundHistory.map(r => `R${r.round}: ${r.winner}`));

    // Check if we're responding to a challenge and need to add opponent
    // Note: With the new ID system, opponent should already be created when accepting challenge
    // This is just a fallback for edge cases
    if (!state.opponent && state.currentRound === 1) {
      console.warn('[APP] Missing opponent after round 1 - this should not happen with ID system');

      // Advance to next round for board selection (to send back)
      advanceToNextRound();
      return;
    }

    // Check if this was the final round (round 5)
    if (state.currentRound === 5) {
      // If opponent is human:
      if (state.opponent?.type === 'human') {
        // Check if we INITIATED the game (no opponentSelectedBoard means we went first)
        // In that case, wait for their response - don't share yet, just advance to game-over
        if (!state.opponentSelectedBoard) {
          // Player 1 (initiator) - advance to game-over and wait for player 2's final URL
          advanceToNextRound();
          return;
        }

        // Player 2 (responder) - advance to game-over to show all results
        // They should NOT see the share screen - player 1 is waiting for the full results URL
        advanceToNextRound();
        return;
      }

      // CPU opponent - just advance to game-over
      advanceToNextRound();
      return;
    }

    // Not final round yet - advance to next round to select board
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
    // Merge preferences from current user (set during tutorial) into new user
    const userWithPreferences: UserProfileType = {
      ...newUser,
      preferences: {
        ...newUser.preferences,
        ...state.user.preferences,
      },
    };

    // Save user to localStorage
    setSavedUser(userWithPreferences);

    // Update game state and transition to board management
    loadState({
      ...state,
      user: userWithPreferences,
      phase: { type: 'board-management' },
    });

    // Check if there was an incoming challenge
    if (incomingChallenge) {
      try {
        // Decode the opponent's board
        const opponentBoard = decodeMinimalBoard(incomingChallenge.playerBoard);

        console.log('[APP] Processing challenge after tutorial:', incomingChallenge);

        // Clear URL
        clearChallengeFromUrl();

        // Show alert for now (will be replaced with proper UI)
        if (window.confirm(`Welcome! You've received a challenge for a ${incomingChallenge.boardSize}×${incomingChallenge.boardSize} board! Would you like to respond?`)) {
          // Find or create opponent using playerId from challenge
          let opponent = (savedOpponents || []).find(o => o.id === incomingChallenge.playerId);

          if (!opponent) {
            // Create new opponent from challenge data
            // Note: Use the playerId from the challenge as the ID to maintain consistency
            opponent = {
              ...createHumanOpponent(incomingChallenge.playerName),
              id: incomingChallenge.playerId, // Override with the ID from challenge to ensure consistency
            };
            // Save to localStorage
            setSavedOpponents([...(savedOpponents || []), opponent]);
          }

          // Set up game state to respond to challenge
          loadState({
            ...state,
            user: newUser,
            opponent,
            gameId: incomingChallenge.gameId,
            boardSize: incomingChallenge.boardSize,
            gameMode: incomingChallenge.gameMode,
            currentRound: incomingChallenge.round,
            opponentSelectedBoard: opponentBoard,
            playerScore: incomingChallenge.opponentScore || 0,
            opponentScore: incomingChallenge.playerScore || 0,
            roundHistory: [],
            phase: { type: 'board-selection', round: incomingChallenge.round },
          });
        } else {
          // User declined, show welcome modal
          setShowWelcomeModal(true);
        }

        // Clear the challenge from state
        setIncomingChallenge(null);
      } catch (error) {
        console.error('[APP] Failed to parse challenge after tutorial:', error);
        setIncomingChallenge(null);
        // Show welcome modal on error
        setShowWelcomeModal(true);
      }
    } else {
      // No challenge, show welcome modal as usual
      setShowWelcomeModal(true);
    }
  };

  // Render phase-specific content
  const renderPhase = () => {
    switch (state.phase.type) {
      case 'tutorial-intro':
        return (
          <TutorialIntro
            onNext={handleTutorialIntroNext}
            onSkip={handleTutorialSkip}
            hasIncomingChallenge={!!incomingChallenge}
          />
        );

      case 'tutorial-board-creation':
        return (
          <TutorialBoardCreator
            cpuSamData={state.phase.cpuSamData}
            onBoardComplete={handleTutorialBoardComplete}
            onSkip={handleTutorialSkip}
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
            isTutorial={true}
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
            onSkip={handleTutorialSkip}
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
                            // Generate game ID for human opponents (for tracking across challenges)
                            const gameId = opponent.type === 'human' ? `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;

                            // Reset game state and save the selected opponent
                            loadState({
                              ...state,
                              opponent,
                              gameId,
                              phase: { type: 'game-mode-selection' },
                              currentRound: 1,
                              playerScore: 0,
                              opponentScore: 0,
                              roundHistory: [],
                              playerSelectedBoard: null,
                              opponentSelectedBoard: null,
                              playerSelectedDeck: null,
                              opponentSelectedDeck: null,
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
                          // Go to add-opponent phase to add a new opponent to the list
                          loadState({
                            ...state,
                            phase: { type: 'add-opponent' },
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
                        // Go to add-opponent phase to add a new opponent to the list
                        loadState({
                          ...state,
                          phase: { type: 'add-opponent' },
                        });
                      }}
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
                    onBoardSelected={() => { }} // No selection in management mode
                    onBoardSaved={handleBoardSave}
                    onBoardDeleted={handleBoardDelete}
                    currentRound={0} // Not in a round
                    userName={state.user.name}
                    opponentName=""
                    user={savedUser}
                    onCreateDeck={() => setShowDeckCreator(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'add-opponent':
        return (
          <OpponentManager
            userName={state.user.name}
            discordId={state.user.discordId}
            discordUsername={state.user.discordUsername}
            onOpponentSelected={(opponent) => {
              // Save opponent to localStorage
              const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
              if (existingIndex >= 0) {
                const updated = [...(savedOpponents || [])];
                updated[existingIndex] = opponent;
                setSavedOpponents(updated);
              } else {
                setSavedOpponents([...(savedOpponents || []), opponent]);
              }

              // Return to board management screen
              loadState({
                ...state,
                phase: { type: 'board-management' },
              });
            }}
          />
        );

      case 'game-mode-selection': {
        const deckModeUnlocked = isDeckModeUnlocked(savedUser);
        const nextUnlock = getNextUnlock(savedUser);

        // Check if playing against human opponent who hasn't completed a game yet
        const isFirstTimeHumanOpponent = state.opponent?.type === 'human' && !state.opponent?.hasCompletedGame;
        const deckModeAllowed = deckModeUnlocked && !isFirstTimeHumanOpponent;

        return (
          <div className={styles.gameModeSelection}>
            {state.opponent && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
                Playing against: <strong>{state.opponent.name}</strong>
              </div>
            )}
            <h2>Choose Game Mode</h2>
            {isFirstTimeHumanOpponent && state.opponent && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                👥 First game with {state.opponent.name}! Only Round by Round mode is available. Deck mode will unlock after your first game together.
              </div>
            )}
            {nextUnlock && !isFirstTimeHumanOpponent && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                🎯 Next unlock: <strong>{nextUnlock.description}</strong> ({nextUnlock.gamesRemaining} {nextUnlock.gamesRemaining === 1 ? 'game' : 'games'} remaining)
              </div>
            )}
            <div className={styles.modeGrid}>
              <button
                onClick={() => handleGameModeSelect('round-by-round')}
                className={styles.modeCard}
              >
                <h3>Round by Round</h3>
                <p>Classic mode - Select a board each round (5 rounds)</p>
              </button>
              <button
                onClick={deckModeAllowed ? () => handleGameModeSelect('deck') : undefined}
                className={`${styles.modeCard} ${!deckModeAllowed ? styles.lockedCard : ''}`}
                disabled={!deckModeAllowed}
              >
                <h3>Deck Mode {!deckModeAllowed && '🔒'}</h3>
                <p>Fast mode - Create a deck of 10 boards and play all at once</p>
                {!deckModeUnlocked && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Complete {3 - (savedUser?.stats.totalGames ?? 0)} more {3 - (savedUser?.stats.totalGames ?? 0) === 1 ? 'game' : 'games'} to unlock
                  </p>
                )}
                {deckModeUnlocked && isFirstTimeHumanOpponent && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Complete your first game with {state.opponent?.name} to unlock
                  </p>
                )}
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
      }

      case 'board-size-selection':
        return (
          <BoardSizeSelector
            onSizeSelected={handleBoardSizeSelect}
            onBack={() => setPhase({ type: 'game-mode-selection' })}
            playerBoards={savedBoards || []}
            cpuBoards={cpuBoards || []}
            opponent={state.opponent}
            onGenerateCpuBoards={handleGenerateCpuBoards}
            user={savedUser}
          />
        );

      case 'opponent-selection':
        return (
          <OpponentManager
            userName={state.user.name}
            discordId={state.user.discordId}
            discordUsername={state.user.discordUsername}
            onOpponentSelected={(opponent) =>
              handleOpponentSelect(opponent, state.phase.type === 'opponent-selection' ? state.phase.gameMode : 'round-by-round')
            }
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
            opponents={savedOpponents || []}
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
            opponents={savedOpponents || []}
            onDeckSelected={handleDeckSelect}
            onCreateDeck={() => setShowDeckCreator(true)}
            onEditDeck={handleDeckEdit}
            onDeleteDeck={handleDeckDelete}
            userName={state.user.name}
            selectedOpponent={state.opponent}
          />
        );
      }

      case 'board-selection': {
        // Filter boards by selected board size
        const filteredBoards = state.boardSize
          ? (savedBoards || []).filter(board => board.boardSize === state.boardSize)
          : (savedBoards || []);

        // Check if responding to a challenge
        const isRespondingToChallenge = !!state.opponentSelectedBoard;

        return (
          <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: '2rem' }}>
              {isRespondingToChallenge ? (
                <>
                  <h2>Respond to Challenge - Round {state.phase.round}</h2>
                  <p style={{ marginBottom: '0.5rem' }}>
                    Select your board to compete against the challenge!
                  </p>
                  {state.boardSize && (
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      Board Size: {state.boardSize}×{state.boardSize}
                    </p>
                  )}
                </>
              ) : (
                <>
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
                </>
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
              user={savedUser}
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

      case 'share-challenge': {
        // Generate challenge URL for the selected board
        if (!state.playerSelectedBoard || !state.boardSize || !state.gameId) {
          return null;
        }

        const challengeUrl = generateChallengeUrl(
          state.playerSelectedBoard,
          state.phase.round,
          state.gameMode || 'round-by-round',
          state.gameId,
          state.user.id,
          state.user.name,
          state.playerScore,
          state.opponentScore
        );

        return (
          <ShareChallenge
            challengeUrl={challengeUrl}
            opponentName={state.opponent?.name || 'Your Friend'}
            boardSize={state.boardSize}
            round={state.phase.round}
            onCancel={handleGoHome}
          />
        );
      }

      case 'share-final-results': {
        // Generate final results URL after round 5
        if (!state.boardSize || !state.gameId) {
          return null;
        }

        const finalResultsUrl = generateFinalResultsUrl(
          state.boardSize,
          state.playerScore,
          state.opponentScore,
          state.gameMode || 'round-by-round',
          state.gameId,
          state.user.id,
          state.user.name
        );

        return (
          <ShareChallenge
            challengeUrl={finalResultsUrl}
            opponentName={state.opponent?.name || 'Your Friend'}
            boardSize={state.boardSize}
            round={5}
            onCancel={() => {
              // After sharing final results, go to game-over
              advanceToNextRound();
            }}
          />
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

      case 'game-over': {
        // Check if player should share final results with opponent
        // Player 2 (responder) should share results after game ends
        const shouldShareResults = state.opponent?.type === 'human' && state.opponentSelectedBoard && state.gameId && state.boardSize;

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
            {...(shouldShareResults && { onShare: () => setPhase({ type: 'share-final-results' }) })}
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
          />
        );
      }

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

      {/* Generating Modal (CPU boards/decks generation) */}
      {isGeneratingCpuBoards && state.opponent && (
        <GeneratingModal
          opponentName={state.opponent.name}
          boardSize={generatingSize}
        />
      )}

      {/* Feature Unlock Modal */}
      {showFeatureUnlockModal && (
        <FeatureUnlockModal
          unlockedBoardSizes={unlockedBoardSizes}
          deckModeUnlocked={deckModeJustUnlocked}
          onContinue={() => setShowFeatureUnlockModal(false)}
        />
      )}
    </div>
  );
}

export default App;
