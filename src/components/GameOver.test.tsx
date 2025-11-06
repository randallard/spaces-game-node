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

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
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

      expect(screen.getByText('Round-by-Round Results')).toBeInTheDocument();
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

      expect(screen.getByText('Round-by-Round Results')).toBeInTheDocument();
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
      expect(screen.getByText('10')).toBeInTheDocument(); // totalGames
      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument(); // wins
      expect(screen.getByText('Losses')).toBeInTheDocument();
      // playerScore is also 3, so use getAllByText
      const threes = screen.getAllByText('3');
      expect(threes.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Ties')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // ties
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
});
