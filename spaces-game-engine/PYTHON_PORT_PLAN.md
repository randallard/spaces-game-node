# Python Port Plan

## Overview
Port the Spaces Game engine from TypeScript to Python to enable native integration with ML/RL frameworks (PyTorch, TensorFlow, Gymnasium).

## Motivation
- **Native Python integration**: ML frameworks are Python-first
- **Better performance**: Python with numpy/numba for vectorized operations
- **Simpler data pipelines**: No Node.js subprocess communication
- **Standard RL interfaces**: Implement Gym/Gymnasium environment directly
- **Easier debugging**: All code in one language for ML researchers

## Project Structure

```
spaces-game-python/
├── spaces_game/
│   ├── __init__.py
│   ├── simulation.py          # Port of src/simulation.ts (~310 lines)
│   ├── board_generator.py     # Port of cli/utils/board-generator.ts (~540 lines)
│   ├── validation.py          # Port of cli/utils/validation.ts (~200 lines)
│   ├── types.py               # Board, RoundResult dataclasses
│   └── gym_env.py             # Gymnasium environment wrapper
├── tests/
│   ├── test_simulation.py     # Unit tests
│   ├── test_board_generator.py
│   ├── test_validation.py
│   └── test_parity.py         # Cross-validation with TypeScript
├── tools/
│   └── export_test_cases.py   # Export TS test sessions to JSON
├── setup.py
├── requirements.txt
└── README.md
```

## Implementation Phases

### Phase 1: Core Engine Port (~2-3 days)

**1.1 Data Structures** (~2 hours)
- [ ] Port `src/types/board.ts` → `types.py`
  - `Board` dataclass (boardSize, grid, sequence)
  - `BoardMove` dataclass (position, type, order)
  - `Position` dataclass (row, col)
- [ ] Port `src/types/game.ts` → `types.py`
  - `RoundResult` dataclass
  - `SimulationDetails` dataclass

**1.2 Validation Logic** (~4 hours)
- [ ] Port `cli/utils/validation.ts` → `validation.py`
  - `validate_board()` function
  - `validate_board_or_throw()` function
  - `is_adjacent_orthogonal()` helper
  - `is_position_in_bounds()` helper
- [ ] Write unit tests for validation
- [ ] Verify validation matches TypeScript behavior

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

**1.4 Board Generator** (~8 hours)
- [ ] Port `cli/utils/board-generator.ts` → `board_generator.py`
  - `generate_all_boards()` - Exhaustive generation (sizes 2-5)
  - `generate_boards_with_sampling()` - Smart sampling (size 6+)
  - Depth-first search with backtracking
  - Duplicate trap prevention
  - No backward movement enforcement
  - Caching system (use pickle or JSON)
- [ ] Multi-layer validation guardrails
- [ ] Write unit tests for generator
- [ ] Verify generated boards match TypeScript output

### Phase 2: Cross-Validation & Testing (~1 day)

**2.1 Export TypeScript Test Cases** (~2 hours)
- [ ] Create tool to export test sessions to JSON
  - Export from `test-sessions/session-2026-01-30T13-28-47-534Z.json`
  - Include all 52 test cases
  - Format: `{playerBoard, opponentBoard, expectedResult}`
- [ ] Export board generator outputs for comparison
  - Size 2-5 exhaustive generation
  - Random sampling for larger sizes

**2.2 Parity Testing** (~4 hours)
- [ ] Implement `test_parity.py`
  - Load TypeScript test session
  - Run same boards through Python engine
  - Compare field-by-field:
    - Winner (player/opponent/tie)
    - Player points
    - Opponent points
    - Final positions
    - Collision detection
    - Trap hits
    - Step-by-step simulation details
- [ ] Automated regression test suite
  - Run 1000+ random boards through both engines
  - Assert identical results
  - Property-based testing with Hypothesis

**2.3 Board Generator Verification** (~2 hours)
- [ ] Compare board generation outputs
  - Same seed → same boards
  - Same board count for each size
  - Validate all generated boards
  - No duplicate boards
  - All boards are legal (validation passes)

### Phase 3: Gymnasium Environment (~1 day)

**3.1 Environment Implementation** (~4 hours)
- [ ] Create `gym_env.py`
  - Implement `SpacesGameEnv(gym.Env)`
  - Observation space (board state)
  - Action space (move/trap placements)
  - Step function (apply action, get reward)
  - Reset function (new episode)
  - Render function (optional visualization)
- [ ] Integration with board generator
  - Sample opponent boards from cache
  - Ensure legal boards only

**3.2 Testing & Examples** (~2 hours)
- [ ] Test environment with random agent
- [ ] Create example training script
- [ ] Document environment API

**3.3 Visualization (Optional)** (~2 hours)
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

- **Phase 1**: 2-3 days (Core Engine Port)
- **Phase 2**: 1 day (Cross-Validation)
- **Phase 3**: 1 day (Gymnasium Environment)
- **Total**: 4-5 days

## Files to Port (Priority Order)

### Essential (~1050 lines)
1. `src/types/board.ts` → `types.py`
2. `src/types/game.ts` → `types.py`
3. `cli/utils/validation.ts` → `validation.py` (~200 lines)
4. `src/simulation.ts` → `simulation.py` (~310 lines)
5. `cli/utils/board-generator.ts` → `board_generator.py` (~540 lines)

### Optional (~680 lines)
6. `cli/interactive/visualizer.ts` → `visualizer.py` (~200 lines)
7. Basic CLI tools for testing

### Not Porting (Use TypeScript CLI)
- `cli/interactive/builder.ts` - Interactive board builder
- `cli/commands/session.ts` - Session management
- `cli/commands/test.ts` - Test runner

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
