# Python Port Plan

## Overview
Port the Spaces Game engine from TypeScript to Python to enable native integration with ML/RL frameworks (PyTorch, TensorFlow, Gymnasium).

## Motivation
- **Native Python integration**: ML frameworks are Python-first
- **Better performance**: Python with numpy/numba for vectorized operations
- **Simpler data pipelines**: No Node.js subprocess communication
- **Standard RL interfaces**: Implement Gym/Gymnasium environment directly
- **Easier debugging**: All code in one language for ML researchers

## Key Design Decisions

### 1. Skip Board Generator Port (Save ~2-3 days)
**Decision**: Use TypeScript CLI to pre-generate boards, load in Python

**Rationale**:
- Board generator is 540 lines of complex DFS with backtracking
- High risk of subtle bugs in port
- Only needs to run once before training (not during training)
- TypeScript version is tested and working
- Reduces port complexity by ~50%

**Trade-off**: Need TypeScript to generate new board sizes later

### 2. Frozen Dataclasses for Immutability
**Decision**: Use `@dataclass(frozen=True)` for board definitions

**Rationale**:
- Prevents accidental board mutations during simulation
- Catches bugs early (mypy will error on mutation attempts)
- Makes code more predictable and testable
- Common pattern in functional programming

**Implementation**:
```python
@dataclass(frozen=True)
class Position:
    row: int
    col: int

@dataclass(frozen=True)
class Board:
    boardSize: int
    grid: tuple[tuple[str, ...], ...]  # Immutable nested tuples
    sequence: tuple[BoardMove, ...]     # Immutable tuple
```

### 3. Partial Observability in Gymnasium Environment
**Decision**: Agent does NOT observe opponent's current board selection

**Rationale**:
- Game is simultaneous selection (like poker, not chess)
- Both players commit boards before revealing
- Agent must learn from opponent's historical patterns
- More realistic and challenging RL problem

**Observation Space**:
- ✅ Round history (what boards opponent used before)
- ✅ Score differential
- ✅ Who picks first this round
- ❌ Opponent's current board selection (hidden)

### 4. Pre-generate Boards Before Training
**Decision**: Generate all boards once, cache, sample during training

**Rationale**:
- Fast sampling (no generation overhead during training)
- Reproducible experiments (same board pool)
- Enables curriculum learning (sort by difficulty)
- Small memory footprint (~50MB for 50K boards)

**Training Curriculum**:
1. Size 3: ~500 boards (learn fundamentals)
2. Size 4: ~5000 boards (intermediate)
3. Size 5: ~50000 boards (advanced)
4. Size 6+: Sampled (transfer learning)

### 5. Test Parity Infrastructure First
**Decision**: Build cross-validation framework before porting logic

**Rationale**:
- Fast feedback loop (test each function immediately after porting)
- Catch subtle differences early
- 52 real test cases from TypeScript session
- Property-based testing with 1000+ random boards
- Confidence that Python matches TypeScript exactly

## Project Structure

```
spaces-game-python/
├── spaces_game/
│   ├── __init__.py
│   ├── simulation.py          # Port of src/simulation.ts (~310 lines)
│   ├── board_loader.py        # Load pre-generated boards from JSON
│   ├── validation.py          # Port of cli/utils/validation.ts (~200 lines)
│   ├── types.py               # Board, RoundResult dataclasses (frozen)
│   └── gym_env.py             # Gymnasium environment wrapper
├── data/
│   ├── boards_size_2.json     # Pre-generated with TypeScript CLI
│   ├── boards_size_3.json
│   ├── boards_size_4.json
│   └── boards_size_5.json
├── tests/
│   ├── test_simulation.py     # Unit tests
│   ├── test_validation.py
│   ├── test_board_loader.py
│   └── test_parity.py         # Cross-validation with TypeScript
├── tools/
│   └── generate_boards.sh     # Script to generate boards with TS CLI
├── setup.py
├── requirements.txt
└── README.md
```

## Implementation Phases

### Phase 0: Infrastructure & Test Harness (~1 day)

**0.1 Pre-generate Boards with TypeScript** (~2 hours)
- [ ] Generate board pools using existing TypeScript CLI:
  ```bash
  npm run cli -- generate-boards --size 2 --limit 500 --output data/boards_size_2.json
  npm run cli -- generate-boards --size 3 --limit 500 --output data/boards_size_3.json
  npm run cli -- generate-boards --size 4 --limit 5000 --output data/boards_size_4.json
  npm run cli -- generate-boards --size 5 --limit 50000 --output data/boards_size_5.json
  ```
- [ ] Verify JSON format and board counts
- [ ] Document generation process in `tools/generate_boards.sh`

**0.2 Export Test Cases** (~2 hours)
- [ ] Export TypeScript test session to JSON
  - Export from `test-sessions/session-2026-01-30T13-28-47-534Z.json`
  - Include all 52 test cases
  - Format: `{playerBoard, opponentBoard, expectedResult}`
- [ ] Export individual test boards from `my-boards.json`

**0.3 Python Test Infrastructure** (~2 hours)
- [ ] Set up pytest structure
- [ ] Create `test_parity.py` skeleton
- [ ] Implement JSON board loader (minimal)
- [ ] Verify can load TypeScript data

### Phase 1: Core Engine Port (~2 days)

**1.1 Data Structures** (~2 hours)
- [ ] Port `src/types/board.ts` → `types.py`
  - `Position` dataclass (**frozen=True**)
  - `BoardMove` dataclass (**frozen=True**)
  - `Board` dataclass (**frozen=True** with immutable grid/sequence)
- [ ] Port `src/types/game.ts` → `types.py`
  - `RoundResult` dataclass
  - `SimulationDetails` dataclass
- [ ] Add type hints throughout (mypy strict mode)

**1.2 Validation Logic** (~4 hours)
- [ ] Port `cli/utils/validation.ts` → `validation.py`
  - `validate_board()` function
  - `validate_board_or_throw()` function
  - `is_adjacent_orthogonal()` helper
  - `is_position_in_bounds()` helper
- [ ] Write unit tests for validation
- [ ] **Parity test**: Validate all 52 test boards, compare with TS results

**1.3 Core Simulation Engine** (~8 hours)
- [ ] Port `src/simulation.ts` → `simulation.py`
  - `simulate_round()` function
  - `rotate_position()` helper
  - Position tracking and collision detection
  - Trap placement and hit detection
  - Scoring logic
  - Round ending conditions
- [ ] Write comprehensive unit tests
- [ ] Test edge cases (collisions, traps, simultaneous moves)
- [ ] **Parity test**: Run all 52 test cases, assert identical results

**1.4 Board Loader & Utilities** (~2 hours)
- [ ] Implement `board_loader.py`
  - Load pre-generated JSON boards
  - Convert to frozen dataclasses
  - Efficient caching (pickle for fast loading)
  - Random sampling utilities
- [ ] Write unit tests
- [ ] Verify can load all pre-generated board pools

### Phase 2: Comprehensive Testing (~1 day)

**2.1 Parity Testing** (~4 hours)
- [ ] Implement comprehensive `test_parity.py`
  - Load TypeScript test session (52 test cases)
  - Run same boards through Python engine
  - Compare field-by-field:
    - Winner (player/opponent/tie)
    - Player points
    - Opponent points
    - Final positions
    - Collision detection
    - Trap hits
    - Step-by-step simulation details (if available)
- [ ] All 52 tests must pass with identical results

**2.2 Property-Based Testing** (~2 hours)
- [ ] Use Hypothesis for property-based tests
  - Run 1000+ random board combinations
  - Assert deterministic results (same inputs → same outputs)
  - Test edge cases automatically
  - Verify no crashes or exceptions

**2.3 Board Pool Validation** (~2 hours)
- [ ] Verify all pre-generated boards are legal
  - Load each board pool (sizes 2-5)
  - Run validation on every board
  - Assert 100% valid
- [ ] Verify board counts match expectations
  - Size 2: ~16 boards
  - Size 3: ~500 boards
  - Size 4: ~5000 boards
  - Size 5: ~50000 boards

### Phase 3: Gymnasium Environment (~1-2 days)

**3.1 Observation Space Design** (~2 hours)
- [ ] Design partial observability structure
  - Agent observes: round history, score, who picks first
  - Agent does NOT observe: opponent's current board selection
  - Similar to poker/simultaneous games (hidden information)
- [ ] Define observation space:
  ```python
  observation_space = gym.spaces.Dict({
      'round': gym.spaces.Discrete(5),           # Round 1-5
      'score_diff': gym.spaces.Box(-100, 100),   # Score differential
      'my_board_history': gym.spaces.MultiDiscrete([10] * 5),
      'opp_board_history': gym.spaces.MultiDiscrete([10] * 5),
      'who_picks_first': gym.spaces.Discrete(2), # 0=me, 1=opponent
  })
  ```

**3.2 Environment Implementation** (~4 hours)
- [ ] Create `gym_env.py`
  - Implement `SpacesGameEnv(gym.Env)`
  - Action space: Select board from deck (Discrete(10))
  - Step function: Both select, then simulate, return reward
  - Reset function: New 5-round match
  - Reward shaping: Score differential
- [ ] Integration with board loader
  - Sample opponent boards from pre-generated pool
  - Opponent strategy (random, pattern-based, or learned)

**3.3 Testing & Examples** (~2 hours)
- [ ] Test environment with random agent
- [ ] Create example training script (PPO)
- [ ] Document environment API
- [ ] Verify environment passes Gymnasium checks

**3.4 Visualization (Optional)** (~2 hours)
- [ ] Port `cli/interactive/visualizer.ts` → `visualizer.py`
  - Simple ASCII board rendering
  - Color-coded pieces and traps
  - Side-by-side board display

## Testing Strategy

### Unit Tests
- All core functions have unit tests
- Edge cases covered (empty boards, collisions, etc.)
- Test coverage > 90%

### Integration Tests
- Full game simulations
- Multi-round scenarios
- Board generation + simulation pipeline

### Cross-Validation Tests
- **Critical**: Python results must match TypeScript exactly
- Use exported test sessions (52 test cases)
- Property-based testing with random boards
- Automated CI/CD checks

### Performance Tests
- Board generation speed (should be comparable or faster)
- Simulation speed (vectorization with numpy)
- Memory usage (caching efficiency)

## Dependencies

```txt
# Core
numpy>=1.24.0
typing-extensions>=4.5.0

# Testing
pytest>=7.4.0
hypothesis>=6.80.0

# RL/ML
gymnasium>=0.29.0
torch>=2.0.0  # Optional, for training

# Development
black>=23.0.0
mypy>=1.4.0
pytest-cov>=4.1.0
```

## Success Criteria

- [ ] All TypeScript test sessions replay identically in Python
- [ ] 1000+ random boards produce identical results in both engines
- [ ] Board generator produces same boards for same inputs
- [ ] Gymnasium environment works with standard RL algorithms
- [ ] Test coverage > 90%
- [ ] Type hints throughout (mypy strict mode)
- [ ] Performance equal to or better than TypeScript

## Timeline

- **Phase 0**: 1 day (Infrastructure & Pre-generation)
- **Phase 1**: 2 days (Core Engine Port)
- **Phase 2**: 1 day (Comprehensive Testing)
- **Phase 3**: 1-2 days (Gymnasium Environment)
- **Total**: 5-6 dev days (~3 weeks at 13 hours/week)

## Files to Port (Priority Order)

### Essential (~510 lines)
1. `src/types/board.ts` → `types.py` (with frozen dataclasses)
2. `src/types/game.ts` → `types.py`
3. `cli/utils/validation.ts` → `validation.py` (~200 lines)
4. `src/simulation.ts` → `simulation.py` (~310 lines)
5. New: `board_loader.py` - Load pre-generated JSON boards

### Optional (~200 lines)
6. `cli/interactive/visualizer.ts` → `visualizer.py` (~200 lines)

### Not Porting
- ✅ **`cli/utils/board-generator.ts`** - Use TypeScript CLI to pre-generate boards
  - Rationale: 540 lines of complex DFS, high bug risk, only run once
  - Use existing tested implementation
  - Generate boards before training, load in Python
- `cli/interactive/builder.ts` - Interactive board builder (use TS version)
- `cli/commands/session.ts` - Session management (use TS version)
- `cli/commands/test.ts` - Test runner (use TS version)

## Risk Mitigation

### Risk: Subtle differences between TypeScript and Python implementations
- **Mitigation**: Comprehensive cross-validation with 52+ test cases
- **Mitigation**: Property-based testing with 1000+ random boards
- **Mitigation**: Side-by-side comparison of all outputs

### Risk: Performance issues with Python
- **Mitigation**: Use numpy for vectorization
- **Mitigation**: Profile and optimize hot paths
- **Mitigation**: Consider Numba JIT compilation if needed

### Risk: Maintenance burden (keeping TS and Python in sync)
- **Mitigation**: Automated parity tests in CI/CD
- **Mitigation**: Document which version is "source of truth"
- **Mitigation**: Lock game rules (no changes without updating both)

## Future Enhancements

- [ ] Parallel board generation (multiprocessing)
- [ ] GPU-accelerated simulation (CuPy)
- [ ] Pre-trained RL agents
- [ ] Benchmarking suite
- [ ] Web API wrapper (FastAPI)

## Notes

- TypeScript version remains authoritative for game rules
- Python port must produce identical results
- Use existing test session: `session-2026-01-30T13-28-47-534Z.json` (52 tests)
- Board caches can be shared between TS and Python (JSON format)
