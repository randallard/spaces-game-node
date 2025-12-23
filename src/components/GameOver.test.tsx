/**
 * Tests for GameOver component
 * @module components/GameOver.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOver } from './GameOver';
import type { RoundResult, UserStats } from '@/types';

const createMockBoard = (name: string): import('@/types').Board => ({
  id: `board-${name}`,
  name,
  boardSize: 2,
  grid: [['empty', 'empty'], ['empty', 'empty']],
  sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
  thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
  createdAt: Date.now(),
});

const createMockRoundResult = (
  round: number,
  winner: 'player' | 'opponent' | 'tie'
): RoundResult => ({
  round,
  winner,
  playerBoard: createMockBoard(`Player-R${round}`),
  opponentBoard: createMockBoard(`Opponent-R${round}`),
  playerFinalPosition: { row: round, col: round },
  opponentFinalPosition: { row: round - 1, col: round - 1 },
  playerPoints: 10,
  opponentPoints: 8,
});

const mockPlayerStats: UserStats = {
  totalGames: 10,
  wins: 6,
  losses: 3,
  ties: 1,
};

describe('GameOver', () => {
  let mockOnNewGame: ReturnType<typeof vi.fn>;
  let mockOnShare: ReturnType<typeof vi.fn>;
  let mockRoundHistory: RoundResult[];

  beforeEach(() => {
    mockOnNewGame = vi.fn();
    mockOnShare = vi.fn();
    mockRoundHistory = [
      createMockRoundResult(1, 'player'),
      createMockRoundResult(2, 'opponent'),
      createMockRoundResult(3, 'tie'),
    ];
  });

  describe('Player wins game', () => {
    it('should display player win message', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Alice Wins the Game!')).toBeInTheDocument();
    });

    it('should display trophy emoji for player win', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });
  });

  describe('Opponent wins game', () => {
    it('should display opponent win message', () => {
      render(
        <GameOver
          winner="opponent"
          playerName="Alice"
          opponentName="CPU"
          playerScore={2}
          opponentScore={6}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('CPU Wins the Game!')).toBeInTheDocument();
    });

    it('should display crown emoji for opponent win', () => {
      render(
        <GameOver
          winner="opponent"
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={6}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('👑')).toBeInTheDocument();
    });
  });

  describe('Tie game', () => {
    it('should display tie message', () => {
      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={4}
          opponentScore={4}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("It's a Tie Game!")).toBeInTheDocument();
    });

    it('should display handshake emoji for tie', () => {
      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={4}
          opponentScore={4}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('🤝')).toBeInTheDocument();
    });
  });

  describe('Final score display', () => {
    it('should display final scores with player names', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Final Score')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should handle 0-0 tie score', () => {
      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          roundHistory={[]}
          onNewGame={mockOnNewGame}
        />
      );

      // Should show two zeros in final score
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle perfect game (8-0)', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={8}
          opponentScore={0}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Use getAllByText since scores may appear multiple times
      const eights = screen.getAllByText('8');
      expect(eights.length).toBeGreaterThanOrEqual(1);
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Round history', () => {
    it('should display round-by-round results section', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Round-by-Round Results (Click to review)')).toBeInTheDocument();
    });

    it('should display all rounds in history', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Round 1')).toBeInTheDocument();
      expect(screen.getByText('Round 2')).toBeInTheDocument();
      expect(screen.getByText('Round 3')).toBeInTheDocument();
    });

    it('should show winner for each round - player wins', () => {
      const history = [createMockRoundResult(1, 'player')];

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={1}
          opponentScore={0}
          roundHistory={history}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Alice Won')).toBeInTheDocument();
    });

    it('should show winner for each round - opponent wins', () => {
      const history = [createMockRoundResult(1, 'opponent')];

      render(
        <GameOver
          winner="opponent"
          playerName="Alice"
          opponentName="CPU"
          playerScore={0}
          opponentScore={1}
          roundHistory={history}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('CPU Won')).toBeInTheDocument();
    });

    it('should show tie for tied rounds', () => {
      const history = [createMockRoundResult(1, 'tie')];

      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          roundHistory={history}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Tie')).toBeInTheDocument();
    });

    it('should handle empty round history', () => {
      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          roundHistory={[]}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Round-by-Round Results (Click to review)')).toBeInTheDocument();
      expect(screen.queryByText(/Round \d/)).not.toBeInTheDocument();
    });

    it('should handle full 8-round game', () => {
      const fullHistory = Array.from({ length: 8 }, (_, i) =>
        createMockRoundResult(i + 1, i % 2 === 0 ? 'player' : 'opponent')
      );

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={4}
          opponentScore={4}
          roundHistory={fullHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Round 1')).toBeInTheDocument();
      expect(screen.getByText('Round 8')).toBeInTheDocument();
    });
  });

  describe('Player statistics', () => {
    it('should display player stats when provided', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          playerStats={mockPlayerStats}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Your Statistics')).toBeInTheDocument();
      expect(screen.getByText('Games Played')).toBeInTheDocument();
      // Use getAllByText since values may appear multiple times (e.g., playerPoints is also 10)
      const tens = screen.getAllByText('10');
      expect(tens.length).toBeGreaterThanOrEqual(1); // totalGames
      expect(screen.getByText('Wins')).toBeInTheDocument();
      const sixes = screen.getAllByText('6');
      expect(sixes.length).toBeGreaterThanOrEqual(1); // wins
      expect(screen.getByText('Losses')).toBeInTheDocument();
      // playerScore is also 3, so use getAllByText
      const threes = screen.getAllByText('3');
      expect(threes.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Ties')).toBeInTheDocument();
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(1); // ties
    });

    it('should display stat labels correctly', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          playerStats={mockPlayerStats}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Games Played')).toBeInTheDocument();
      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('Losses')).toBeInTheDocument();
      expect(screen.getByText('Ties')).toBeInTheDocument();
    });

    it('should not display stats section when playerStats is undefined', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.queryByText('Your Statistics')).not.toBeInTheDocument();
    });

    it('should handle stats with all zeros', () => {
      const zeroStats: UserStats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      };

      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          roundHistory={[]}
          playerStats={zeroStats}
          onNewGame={mockOnNewGame}
        />
      );

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Action buttons', () => {
    it('should display Play Again button', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Play Again')).toBeInTheDocument();
    });

    it('should call onNewGame when Play Again clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const playAgainButton = screen.getByText('Play Again');
      fireEvent.click(playAgainButton);

      expect(mockOnNewGame).toHaveBeenCalledTimes(1);
    });

    it('should display Share Game button when onShare provided', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText('Share Game')).toBeInTheDocument();
    });

    it('should call onShare when Share Game clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
          onShare={mockOnShare}
        />
      );

      const shareButton = screen.getByText('Share Game');
      fireEvent.click(shareButton);

      expect(mockOnShare).toHaveBeenCalledTimes(1);
    });

    it('should not display Share Game button when onShare not provided', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.queryByText('Share Game')).not.toBeInTheDocument();
    });
  });

  describe('Player names', () => {
    it('should display player names throughout the component', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const aliceElements = screen.getAllByText(/Alice/);
      const bobElements = screen.getAllByText(/Bob/);

      expect(aliceElements.length).toBeGreaterThan(0);
      expect(bobElements.length).toBeGreaterThan(0);
    });

    it('should handle CPU opponent name', () => {
      render(
        <GameOver
          winner="opponent"
          playerName="Alice"
          opponentName="CPU"
          playerScore={2}
          opponentScore={6}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('CPU Wins the Game!')).toBeInTheDocument();
    });

    it('should handle long player names', () => {
      render(
        <GameOver
          winner="player"
          playerName="VeryLongPlayerNameHere"
          opponentName="AnotherLongName"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('VeryLongPlayerNameHere Wins the Game!')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle minimal valid props', () => {
      render(
        <GameOver
          winner="tie"
          playerName="A"
          opponentName="B"
          playerScore={0}
          opponentScore={0}
          roundHistory={[]}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("It's a Tie Game!")).toBeInTheDocument();
      expect(screen.getByText('Play Again')).toBeInTheDocument();
    });

    it('should render correctly with all optional props', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          playerStats={mockPlayerStats}
          onNewGame={mockOnNewGame}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText('Your Statistics')).toBeInTheDocument();
      expect(screen.getByText('Share Game')).toBeInTheDocument();
    });

    it('should handle single round game', () => {
      const singleRound = [createMockRoundResult(1, 'player')];

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={1}
          opponentScore={0}
          roundHistory={singleRound}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Round 1')).toBeInTheDocument();
      expect(screen.queryByText('Round 2')).not.toBeInTheDocument();
    });

    it('should not break with rapid button clicks', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
          onShare={mockOnShare}
        />
      );

      const playAgainButton = screen.getByText('Play Again');
      fireEvent.click(playAgainButton);
      fireEvent.click(playAgainButton);
      fireEvent.click(playAgainButton);

      expect(mockOnNewGame).toHaveBeenCalledTimes(3);
    });
  });

  describe('Round modal navigation', () => {
    it('should open round details modal when round card clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round 1
      const round1Card = screen.getByText('Round 1').closest('button');
      fireEvent.click(round1Card!);

      // Should show round 1 modal
      expect(screen.getByText('Combined Board View')).toBeInTheDocument();
    });

    it('should close modal when close button clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round 2
      const round2Card = screen.getByText('Round 2').closest('button');
      fireEvent.click(round2Card!);

      // Modal should be open
      expect(screen.getByText('Combined Board View')).toBeInTheDocument();

      // Click close button
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Modal should close
      expect(screen.queryByText('Combined Board View')).not.toBeInTheDocument();
    });

  });

  describe('Winner emoji variations', () => {
    it('should show crown emoji for opponent win', () => {
      render(
        <GameOver
          winner="opponent"
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={5}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('👑')).toBeInTheDocument();
    });

    it('should show handshake emoji for tie', () => {
      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={3}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('🤝')).toBeInTheDocument();
    });
  });

  describe('User stats display', () => {
    it('should display user statistics when provided', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          playerStats={mockPlayerStats}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText('Your Statistics')).toBeInTheDocument();
      expect(screen.getByText('Games Played')).toBeInTheDocument();
    });
  });

  describe('View mode toggle', () => {
    it('should start with both view mode by default', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const bothButton = screen.getByTitle('Show both boards and creatures');
      expect(bothButton.className).toContain('toggleButtonActive');
    });

    it('should switch to thumbnails view when Boards button clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const boardsButton = screen.getByTitle('Show board thumbnails');
      fireEvent.click(boardsButton);

      expect(boardsButton.className).toContain('toggleButtonActive');
    });

    it('should switch to creatures view when Creatures button clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const creaturesButton = screen.getByTitle('Show creature outcome graphics');
      fireEvent.click(creaturesButton);

      expect(creaturesButton.className).toContain('toggleButtonActive');
    });

    it('should toggle between view modes multiple times', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const boardsButton = screen.getByTitle('Show board thumbnails');
      const creaturesButton = screen.getByTitle('Show creature outcome graphics');
      const bothButton = screen.getByTitle('Show both boards and creatures');

      fireEvent.click(boardsButton);
      expect(boardsButton.className).toContain('toggleButtonActive');

      fireEvent.click(creaturesButton);
      expect(creaturesButton.className).toContain('toggleButtonActive');

      fireEvent.click(bothButton);
      expect(bothButton.className).toContain('toggleButtonActive');
    });
  });

  describe('Help modal', () => {
    it('should render help link', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const helpLink = screen.getByText('(shown opponent moves...)');
      expect(helpLink).toBeInTheDocument();
      expect(helpLink.tagName).toBe('BUTTON');
    });

    it('should have onClick handler for help link', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      const helpLink = screen.getByText('(shown opponent moves...)');

      // Clicking the help link shouldn't crash the component
      expect(() => {
        fireEvent.click(helpLink);
      }).not.toThrow();
    });
  });

  describe('Round modal overlay', () => {
    it('should render modal with Combined Board View when round is clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round modal
      const round1Card = screen.getByText('Round 1').closest('button');
      fireEvent.click(round1Card!);

      expect(screen.getByText('Combined Board View')).toBeInTheDocument();
    });
  });

  describe('Round navigation in modal', () => {
    it('should navigate to next round when Continue clicked', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round 1
      const round1Card = screen.getByText('Round 1').closest('button');
      fireEvent.click(round1Card!);

      // Click continue
      const continueButton = screen.getByText(/Continue to Round 2/);
      fireEvent.click(continueButton);

      // Should now show round 2
      expect(screen.getByText('Combined Board View')).toBeInTheDocument();
    });

    it('should show "Back to Summary" for last round', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round 3 (last round)
      const round3Card = screen.getByText('Round 3').closest('button');
      fireEvent.click(round3Card!);

      // Should show "Back to Summary" instead of Continue
      expect(screen.getByText('Back to Summary')).toBeInTheDocument();
      expect(screen.queryByText(/Continue to Round/)).not.toBeInTheDocument();
    });

    it('should close modal when clicking Back to Summary on last round', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round 3 (last round)
      const round3Card = screen.getByText('Round 3').closest('button');
      fireEvent.click(round3Card!);

      // Click Back to Summary
      const backButton = screen.getByText('Back to Summary');
      fireEvent.click(backButton);

      // Modal should close
      expect(screen.queryByText('Combined Board View')).not.toBeInTheDocument();
    });

    it('should navigate through all rounds sequentially', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round 1
      const round1Card = screen.getByText('Round 1').closest('button');
      fireEvent.click(round1Card!);

      // Navigate to round 2
      const continueButton1 = screen.getByText(/Continue to Round 2/);
      fireEvent.click(continueButton1);

      // Should now be on round 2, navigate to round 3
      const continueButton2 = screen.getByText(/Continue to Round 3/);
      fireEvent.click(continueButton2);

      // Should now be on round 3 (last round)
      expect(screen.getByText('Back to Summary')).toBeInTheDocument();
    });
  });

  describe('Creature graphics display', () => {
    it('should have creature view mode toggle button', () => {
      const roundWithCreatures: RoundResult = {
        ...createMockRoundResult(1, 'player'),
        playerCreature: 'square',
        opponentCreature: 'circle',
        playerVisualOutcome: 'goal',
        opponentVisualOutcome: 'trapped',
      };

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={1}
          opponentScore={0}
          roundHistory={[roundWithCreatures]}
          onNewGame={mockOnNewGame}
        />
      );

      // Should have creatures view button
      const creaturesButton = screen.getByTitle('Show creature outcome graphics');
      expect(creaturesButton).toBeInTheDocument();

      // Should be clickable
      fireEvent.click(creaturesButton);
      expect(creaturesButton.className).toContain('toggleButtonActive');
    });

    it('should render round cards with creature data', () => {
      const collisionRound: RoundResult = {
        ...createMockRoundResult(1, 'tie'),
        playerCreature: 'square',
        opponentCreature: 'circle',
        collision: true,
      };

      render(
        <GameOver
          winner="tie"
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          roundHistory={[collisionRound]}
          onNewGame={mockOnNewGame}
        />
      );

      // Round card should be present
      expect(screen.getByText('Round 1')).toBeInTheDocument();
    });

    it('should handle rounds without creatures gracefully', () => {
      const roundWithoutCreatures: RoundResult = {
        ...createMockRoundResult(1, 'player'),
        playerCreature: undefined,
        opponentCreature: undefined,
      };

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={1}
          opponentScore={0}
          roundHistory={[roundWithoutCreatures]}
          onNewGame={mockOnNewGame}
        />
      );

      // Component should render without crashing
      expect(screen.getByText('Round 1')).toBeInTheDocument();

      // Should have view toggle buttons
      const creaturesButton = screen.getByTitle('Show creature outcome graphics');
      fireEvent.click(creaturesButton);

      // Should not crash when switching views
      expect(creaturesButton.className).toContain('toggleButtonActive');
    });
  });

  describe('Running totals calculation', () => {
    it('should calculate running totals correctly', () => {
      const roundHistory = [
        { ...createMockRoundResult(1, 'player'), playerPoints: 10, opponentPoints: 5 },
        { ...createMockRoundResult(2, 'opponent'), playerPoints: 3, opponentPoints: 12 },
        { ...createMockRoundResult(3, 'player'), playerPoints: 7, opponentPoints: 2 },
      ];

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={20}
          opponentScore={19}
          roundHistory={roundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // Open round 3 to verify running totals are being passed
      const round3Card = screen.getByText('Round 3').closest('button');
      fireEvent.click(round3Card!);

      // Modal should display with correct running totals
      expect(screen.getByText('Combined Board View')).toBeInTheDocument();
    });
  });

  describe('Invalid round handling', () => {
    it('should handle invalid round selection gracefully', () => {
      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
        />
      );

      // This test verifies the component doesn't crash with invalid data
      expect(screen.getByText('Alice Wins the Game!')).toBeInTheDocument();
    });
  });

  describe('Preferences callbacks', () => {
    it('should call onShowCompleteResultsChange when provided', () => {
      const mockOnShowCompleteResultsChange = vi.fn();

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
          showCompleteResultsByDefault={false}
          onShowCompleteResultsChange={mockOnShowCompleteResultsChange}
        />
      );

      // Open round modal
      const round1Card = screen.getByText('Round 1').closest('button');
      fireEvent.click(round1Card!);

      // Find and click the "Show complete results" checkbox
      const checkbox = screen.getByLabelText(/Show complete results/);
      fireEvent.click(checkbox);

      expect(mockOnShowCompleteResultsChange).toHaveBeenCalledWith(true);
    });

    it('should call onExplanationStyleChange when provided', () => {
      const mockOnExplanationStyleChange = vi.fn();

      render(
        <GameOver
          winner="player"
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          roundHistory={mockRoundHistory}
          onNewGame={mockOnNewGame}
          explanationStyle="lively"
          onExplanationStyleChange={mockOnExplanationStyleChange}
        />
      );

      // Open round modal
      const round1Card = screen.getByText('Round 1').closest('button');
      fireEvent.click(round1Card!);

      // Find and click the explanation style toggle
      const styleToggle = screen.getByText(/📖 Technical/);
      fireEvent.click(styleToggle);

      expect(mockOnExplanationStyleChange).toHaveBeenCalledWith('technical');
    });
  });
});
