# Machine Learning Training Scenarios

## Overview

This document outlines key training scenarios for the Spaces Game RL agent, with special focus on **deck mode learning** where the agent plays against the same opponent deck multiple times.

## Training Scenario Hierarchy

### 1. Round-by-Round Mode (5 rounds)
Agent selects 5 boards sequentially, one per round, learning from previous round results.

### 2. Deck Mode (10 rounds)
Agent has pre-selected 10 boards (a "deck"). The challenge: **Can the agent build better decks over time?**

### 3. Meta-Learning: Playing Same Opponent Deck Repeatedly 🎯

**This is the key insight you raised!**

## Scenario: Deck Mode Meta-Learning

### Setup
```python
# Opponent has a fixed deck of 10 boards
opponent_deck = [board1, board2, ..., board10]

# Agent trains by playing this deck many times
for episode in range(1000):
    my_deck = agent.build_deck()  # Agent creates 10 boards

    results = simulate_deck_game(my_deck, opponent_deck)

    # Agent learns:
    # - Which boards counter opponent's specific boards?
    # - What patterns does this opponent use?
    # - How to optimize deck composition against THIS opponent

    agent.learn_from_deck_results(results)
```

### Learning Objectives

#### Episode 1-10: Discovery
- "Opponent's board 3 always has a trap at (1,1)"
- "Opponent's board 7 is aggressive (lots of forward moves)"
- "Opponent's boards 4-6 are defensive (many traps)"

#### Episode 11-50: Pattern Recognition
- "Opponent alternates aggressive/defensive boards"
- "Opponent's odd-numbered boards favor left side"
- "Opponent has weak coverage in bottom-right quadrant"

#### Episode 51-100: Counter-Strategy Development
- "I should use trap-avoiding boards against boards 4-6"
- "I should use aggressive boards to counter their defensive boards"
- "I should place traps where opponent's paths converge"

#### Episode 100+: Optimal Deck Composition
- Agent converges on near-optimal 10-board deck
- Win rate improves from ~50% to 70-80%
- Agent "memorizes" counter-strategy for this specific opponent

## Implementation: Opponent Memory System

### Basic Memory (Phase 4)
```python
class OpponentMemory:
    def __init__(self):
        self.opponent_decks = {}  # opponent_id -> deck history
        self.performance = {}      # opponent_id -> win rate history

    def observe_opponent_deck(self, opponent_id, deck, game_result):
        """Record opponent's deck and result"""
        if opponent_id not in self.opponent_decks:
            self.opponent_decks[opponent_id] = []

        self.opponent_decks[opponent_id].append({
            'deck': deck,
            'result': game_result,
            'timestamp': time.time()
        })

    def get_opponent_deck(self, opponent_id):
        """Retrieve known deck for this opponent"""
        if opponent_id in self.opponent_decks:
            # Return most recent deck
            return self.opponent_decks[opponent_id][-1]['deck']
        return None

    def calculate_win_rate(self, opponent_id):
        """Track improvement against this opponent"""
        history = self.opponent_decks.get(opponent_id, [])
        if not history:
            return 0.0

        wins = sum(1 for h in history if h['result'] == 'win')
        return wins / len(history)
```

### Advanced: Board-Level Counter Learning
```python
class BoardCounterLearning:
    def __init__(self):
        # Learn which of MY boards counter which OPPONENT boards
        self.counter_matrix = {}  # (my_board_id, opp_board_id) -> avg_point_diff

    def update_counter_effectiveness(self, my_board, opp_board, point_diff):
        """Learn effectiveness of my_board vs opp_board"""
        key = (my_board.id, opp_board.id)

        if key not in self.counter_matrix:
            self.counter_matrix[key] = []

        self.counter_matrix[key].append(point_diff)

    def get_best_counter(self, opp_board, my_available_boards):
        """Given opponent's board, select best counter from my deck"""
        best_board = None
        best_score = float('-inf')

        for my_board in my_available_boards:
            key = (my_board.id, opp_board.id)
            if key in self.counter_matrix:
                avg_diff = np.mean(self.counter_matrix[key])
                if avg_diff > best_score:
                    best_score = avg_diff
                    best_board = my_board

        return best_board or random.choice(my_available_boards)
```

## Training Curriculum

### Stage 1: Single Deck Mastery (Week 6)
```python
# Agent plays ONE opponent deck 1000 times
opponent_deck = generate_random_deck()

for episode in range(1000):
    my_deck = agent.build_deck()
    results = play_deck_game(my_deck, opponent_deck)
    agent.learn(results)

    # Track improvement
    if episode % 100 == 0:
        print(f"Episode {episode}: Win rate = {agent.win_rate}")
```

**Success Criteria:**
- Win rate > 70% by episode 500
- Agent can explain why each board was chosen
- Convergence to stable deck composition

### Stage 2: Multi-Deck Generalization (Week 7)
```python
# Agent encounters 10 different opponent decks
opponent_decks = [generate_random_deck() for _ in range(10)]

for epoch in range(100):
    # Rotate through all opponent decks
    for opp_deck in opponent_decks:
        my_deck = agent.build_deck()
        results = play_deck_game(my_deck, opp_deck)
        agent.learn(results)
```

**Success Criteria:**
- Average win rate > 60% across all opponents
- Agent adapts deck composition per opponent
- Transfer learning between similar opponents

### Stage 3: Online Adaptation (Week 8)
```python
# Agent faces NEW opponent decks it's never seen
for episode in range(100):
    new_opponent_deck = generate_random_deck()

    # First game: exploration
    my_deck_v1 = agent.build_deck(exploration=0.3)
    results_v1 = play_deck_game(my_deck_v1, new_opponent_deck)

    # Second game: exploitation
    agent.update_opponent_model(new_opponent_deck, results_v1)
    my_deck_v2 = agent.build_deck(exploration=0.1)
    results_v2 = play_deck_game(my_deck_v2, new_opponent_deck)

    # Measure adaptation
    improvement = results_v2.win_rate - results_v1.win_rate
    print(f"Adaptation improvement: {improvement}")
```

**Success Criteria:**
- Positive improvement in 2nd game > 70% of the time
- Average improvement > 10 percentage points
- Agent identifies opponent patterns within 1 game

## Key Metrics to Track

### 1. Learning Speed
- Episodes to 70% win rate against fixed opponent
- Episodes to converge to stable strategy

### 2. Generalization
- Win rate on never-seen opponent decks
- Performance degradation vs training opponents

### 3. Adaptation
- Improvement from game 1 to game 2 against new opponent
- Speed of counter-strategy development

### 4. Memory Efficiency
- How many episodes to "remember" an opponent
- Accuracy of opponent deck recall

## Research Questions

1. **How many games does the agent need to "memorize" an opponent deck?**
   - Hypothesis: 10-50 games for basic patterns, 100+ for optimal counters

2. **Can the agent generalize patterns across opponents?**
   - Example: "All aggressive decks are weak to trap-heavy counters"

3. **What's the trade-off between specialist (per-opponent) and generalist strategies?**
   - Specialist deck: 80% win rate vs specific opponent
   - Generalist deck: 60% win rate vs all opponents

4. **How does observation mode affect meta-learning?**
   - Perfect info: Agent sees full opponent boards → faster learning
   - Fog of war: Agent must infer patterns → slower but more robust?

## Implementation Phases

### Phase 4A: Basic Deck Mode (Week 6)
- ✅ Agent can build 10-board decks
- ✅ Agent plays full 10-round games
- ✅ Agent learns from aggregate results

### Phase 4B: Opponent Memory (Week 7)
- ✅ Agent tracks opponent deck history
- ✅ Agent measures win rate per opponent
- ✅ Agent adapts deck composition based on opponent

### Phase 4C: Board-Level Counters (Week 8)
- ✅ Agent learns board-vs-board matchups
- ✅ Agent builds counter-decks dynamically
- ✅ Agent optimizes deck ordering

### Phase 4D: Meta-Learning Evaluation (Week 9)
- ✅ Measure learning curves per opponent
- ✅ Test generalization to new opponents
- ✅ Evaluate adaptation speed
- ✅ Compare specialist vs generalist strategies

## Example: Full Training Loop

```python
class DeckModeAgent:
    def __init__(self):
        self.opponent_memory = OpponentMemory()
        self.board_counter_learning = BoardCounterLearning()
        self.deck_builder = NeuralDeckBuilder()

    def train_against_opponent(self, opponent_id, opponent_deck, num_episodes=100):
        """Train against same opponent deck multiple times"""

        for episode in range(num_episodes):
            # Build deck (exploration decreases over time)
            exploration = max(0.1, 1.0 - episode / num_episodes)
            my_deck = self.deck_builder.build_deck(
                opponent_context=self.opponent_memory.get_opponent_deck(opponent_id),
                exploration=exploration
            )

            # Play game
            results = play_deck_game(my_deck, opponent_deck)

            # Learn from each round
            for round_num, result in enumerate(results):
                my_board = my_deck[round_num]
                opp_board = opponent_deck[round_num]
                point_diff = result.player_points - result.opponent_points

                # Update board-level counters
                self.board_counter_learning.update_counter_effectiveness(
                    my_board, opp_board, point_diff
                )

            # Update opponent memory
            self.opponent_memory.observe_opponent_deck(
                opponent_id,
                opponent_deck,
                'win' if results.winner == 'player' else 'loss'
            )

            # Train deck builder
            self.deck_builder.learn(my_deck, results)

            # Log progress
            if episode % 10 == 0:
                win_rate = self.opponent_memory.calculate_win_rate(opponent_id)
                print(f"Episode {episode}: Win rate vs {opponent_id} = {win_rate:.2%}")
```

## Success Metrics

### Quantitative
- **Learning Speed**: < 50 episodes to 70% win rate
- **Final Performance**: > 75% win rate by episode 100
- **Generalization**: > 55% win rate on unseen opponents
- **Adaptation**: > +15% win rate from game 1 to game 2

### Qualitative
- Agent can articulate counter-strategies ("I use trap-heavy boards vs opponent's boards 3-5")
- Deck composition shows clear adaptation per opponent
- Agent discovers non-obvious counters humans wouldn't find

---

**This is a critical training scenario!** Thanks for raising it. Should we prioritize this in Phase 4, or would you rather focus on round-by-round mode first and add deck mode later?
