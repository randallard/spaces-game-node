# Board Size 4 Implementation Plan

## Overview
This document outlines the plan to add 4x4 board support to the Spaces Game. Currently, the game supports 2x2 and 3x3 boards. This plan identifies all areas that need updates to support 4x4 boards.

## Current State Analysis

### Board Size Definition
- **Location**: `src/types/board.ts:18`
- **Current**: `export type BoardSize = 2 | 3;`
- **Change Required**: Add `4` to the union type

### Game Rules Constant
- **Location**: `src/constants/game-rules.ts:6`
- **Current**: `BOARD_SIZE: 2` (default/minimum)
- **Note**: This constant is not widely used, most components use the BoardSize type or props

### Board Creation
- Tutorial uses fixed 2x2 size (`src/components/TutorialBoardCreator.tsx:27`)
- Regular board creation accepts size as prop (already flexible)

## Implementation Plan

### Phase 1: Type System Updates
**Priority: High | Estimated Time: 15 minutes**

#### 1.1 Update BoardSize Type
- **File**: `src/types/board.ts:18`
- **Change**: `export type BoardSize = 2 | 3 | 4;`
- **Impact**: TypeScript will catch all places needing updates

#### 1.2 Update Type Exports
- **File**: `src/types/board.ts`
- **Verify**: All type exports are correct for the new size

### Phase 2: UI Components Updates
**Priority: High | Estimated Time: 2-3 hours**

#### 2.1 BoardSizeSelector Component
- **File**: `src/components/BoardSizeSelector.tsx`
- **Changes**:
  - Update `onSizeSelected` prop type to accept `2 | 3 | 4` (line 11)
  - Add new button for 4x4 size (after line 57)
  - Suggested label: "4×4"
  - Suggested description: "Expert level - Maximum strategic complexity"
  - Suggested badge: "Expert" or "Master"

#### 2.2 DeckCreator Filter Buttons
- **File**: `src/components/DeckCreator.tsx`
- **Changes**:
  - Add filter button for 4x4 boards (around line 135-142)
  - Update `sizeFilter` state type to include 4
  - Add button: `4x4 ({availableBoards.filter(b => b.boardSize === 4).length})`

#### 2.3 SavedBoards Filter Buttons
- **File**: `src/components/SavedBoards.tsx`
- **Changes**:
  - Add filter button for 4x4 boards (around line 188-194)
  - Update state type to include 4
  - Add button matching DeckCreator pattern

#### 2.4 BoardCreator Component
- **File**: `src/components/BoardCreator.tsx`
- **Status**: Already flexible - accepts `boardSize` prop
- **Testing Required**: Verify all grid operations work with size 4
  - `getAdjacentPositions` (line 57-75) - should work
  - Grid rendering - should scale automatically
  - Position calculations - verify no hardcoded assumptions

### Phase 3: Default CPU Data
**Priority: Medium | Estimated Time: 2-3 hours**

#### 3.1 Create 4x4 Default Boards
- **File**: `src/utils/default-cpu-data.ts`
- **Action**: Add new function `createDefault4x4Boards()`
- **Boards to Create**: Minimum 5-10 boards for CPU Sam
  - Simple straight-line paths (4 boards - one per column)
  - Diagonal patterns (2-3 boards)
  - L-shaped patterns (2-3 boards)
  - Boards with traps (3-4 boards)

#### 3.2 CPU Tougher 4x4 Boards
- **File**: `src/utils/default-cpu-data.ts`
- **Action**: Create more complex 4x4 boards for CPU Tougher
- **Considerations**: More strategic trap placements, longer paths

#### 3.3 Update Deck Creation Functions
- **Files**:
  - `src/utils/default-cpu-data.ts` - Update deck creation
  - `src/App.tsx:562` - Update CPU board filtering
- **Changes**: Include 4x4 boards in default decks

### Phase 4: Data Migrations
**Priority: Medium | Estimated Time: 1-2 hours**

#### 4.1 Review Existing Migrations
- **File**: `src/utils/data-migrations.ts`
- **Current**: Has migration for `boardSize` property (line 16)
- **Action**: Verify migration handles 4x4 correctly
- **Update**: Migration validation to accept 4 as valid size

#### 4.2 Update Migration Tests
- **File**: `src/utils/data-migrations.test.ts`
- **Action**: Add test cases for 4x4 boards in migrations

### Phase 5: SVG and Visual Rendering
**Priority: Medium | Estimated Time: 1-2 hours**

#### 5.1 Thumbnail Generation
- **File**: `src/utils/svg-thumbnail.ts`
- **Status**: Already flexible - uses `gridSize` parameter
- **Testing Required**: Verify 4x4 boards render correctly
- **Potential Issues**:
  - Cell size calculations (may need adjustment for readability)
  - Viewbox sizing
  - Stroke widths (may appear too thick/thin on 4x4)

#### 5.2 Combined Board SVG
- **File**: `src/utils/combined-board-svg.ts`
- **Status**: Should be flexible
- **Testing Required**: Verify rotation and combined view works

#### 5.3 Creature Graphics
- **Files**: `src/utils/creature-graphics.ts`
- **Status**: Size-agnostic
- **Testing**: Verify graphics scale appropriately

### Phase 6: Game Simulation
**Priority: High | Estimated Time: 1 hour**

#### 6.1 Verify Simulation Logic
- **File**: `src/utils/game-simulation.ts`
- **Testing Required**:
  - Collision detection works on 4x4
  - Trap detection works on 4x4
  - Score calculations are correct
  - Forward movement detection (row comparisons)

#### 6.2 Update Simulation Tests
- **File**: `src/utils/game-simulation.test.ts`
- **Action**: Add test cases for 4x4 boards

### Phase 7: CSS and Styling
**Priority: Medium | Estimated Time: 1-2 hours**

#### 7.1 Grid Layouts
- **Files**: Various `*.module.css` files
- **Areas to Check**:
  - `BoardCreator.module.css` - Grid template calculations
  - `TutorialBoardCreator.module.css` - Grid template calculations
  - Board display containers - May need max-width adjustments
  - Cell sizing - Ensure cells don't become too small

#### 7.2 Responsive Design
- **Consideration**: 4x4 boards are larger
- **Actions**:
  - Test on mobile viewports
  - May need to reduce cell size on small screens
  - Verify board fits within reasonable viewport sizes

### Phase 8: Tutorial System
**Priority: Low | Estimated Time: 30 minutes**

#### 8.1 Tutorial Board Creator
- **File**: `src/components/TutorialBoardCreator.tsx:27`
- **Current**: `const boardSize = 2; // Tutorial always uses 2x2`
- **Decision**: Keep tutorial at 2x2 for simplicity
- **Rationale**: Tutorial should be simple and quick
- **Alternative**: Add optional advanced tutorial for 3x3 or 4x4 later

### Phase 9: App Integration
**Priority: High | Estimated Time: 1 hour**

#### 9.1 Game State Management
- **File**: `src/App.tsx`
- **Areas to Update**:
  - Line 363: Deck name generation includes size
  - Line 378: Error logging includes size
  - Line 384: Board filtering by size
  - Line 940-947: Deck filtering by board size
- **Testing**: Verify state transitions work with 4x4

#### 9.2 Board Size Selection Flow
- **File**: `src/App.tsx`
- **Verify**: Size selection state properly handles 4
- **Test**: Game flow from size selection through board creation

### Phase 10: Testing
**Priority: High | Estimated Time: 3-4 hours**

#### 10.1 Unit Tests
- **Files**: All `*.test.ts` and `*.test.tsx` files
- **Actions**:
  - Add 4x4 test cases to existing tests
  - Update test data to include 4x4 boards
  - Verify all assertions still pass

**Key Test Files**:
- `src/components/BoardCreator.test.tsx`
- `src/components/DeckCreator.test.tsx`
- `src/components/SavedBoards.test.tsx`
- `src/utils/game-simulation.test.ts`
- `src/utils/combined-board-svg.test.ts`
- `src/utils/default-cpu-data.test.ts`

#### 10.2 Integration Tests
- **Manual Testing Required**:
  1. Create 4x4 board via BoardCreator
  2. Save 4x4 board
  3. Create deck with 4x4 boards
  4. Play game with 4x4 boards
  5. Verify scoring works correctly
  6. Test replay functionality
  7. Verify creature graphics appear correctly
  8. Test on mobile devices

#### 10.3 Edge Cases
- Mixed size boards in saved boards list
- Filtering by size in various views
- Deck validation with size mismatches
- Migration from old data without boardSize property

### Phase 11: Documentation
**Priority: Low | Estimated Time: 1 hour**

#### 11.1 Update User-Facing Docs
- Update any documentation about board sizes
- Add 4x4 to game rules if documented
- Update any screenshots/examples

#### 11.2 Update Code Comments
- Review and update comments mentioning "2x2 or 3x3"
- Update JSDoc comments for affected functions

#### 11.3 Update MINIMAL_BOARD_ENCODING.md
- **File**: `docs/MINIMAL_BOARD_ENCODING.md`
- **Action**: Verify encoding supports 4x4 boards
- Add examples if needed

## Implementation Sequence

### Recommended Order:

1. **Phase 1**: Type System Updates (Foundation)
2. **Phase 2**: UI Components (User-facing changes)
3. **Phase 6**: Game Simulation Testing (Core logic verification)
4. **Phase 5**: SVG and Visual Rendering (Display)
5. **Phase 3**: Default CPU Data (Content)
6. **Phase 9**: App Integration (Wiring)
7. **Phase 7**: CSS and Styling (Polish)
8. **Phase 4**: Data Migrations (Backward compatibility)
9. **Phase 10**: Testing (Quality assurance)
10. **Phase 8**: Tutorial System (Optional enhancement)
11. **Phase 11**: Documentation (Final step)

## Risk Assessment

### High Risk Areas:
1. **Game Simulation**: Must ensure scoring logic works correctly on larger board
2. **Performance**: 4x4 boards have 16 cells (vs 4 or 9) - may impact rendering performance
3. **Mobile UX**: Smaller screens may struggle with 4x4 board visibility
4. **Data Migration**: Existing users must not experience issues

### Medium Risk Areas:
1. **SVG Rendering**: Cell sizes may need adjustment for readability
2. **CSS Grid Layouts**: Some hardcoded grid calculations may exist
3. **Default Board Quality**: CPU boards must be well-designed and challenging

### Low Risk Areas:
1. **Type System**: TypeScript will catch most issues
2. **Board Creation**: Already size-agnostic
3. **Tutorial**: Can remain 2x2 without issues

## Testing Checklist

### Pre-Implementation Testing:
- [ ] Run all existing tests to establish baseline
- [ ] Document current test coverage

### Post-Phase Testing:
- [ ] Phase 1: Verify TypeScript compilation passes
- [ ] Phase 2: Test UI components with size 4 in isolation
- [ ] Phase 3: Verify CPU boards are valid and playable
- [ ] Phase 5: Verify SVG renders correctly at different viewport sizes
- [ ] Phase 6: Run game simulation with 4x4 boards
- [ ] Phase 9: Test complete game flow with 4x4
- [ ] Phase 10: Run full test suite

### Final Testing:
- [ ] Fresh install test (new user flow)
- [ ] Migration test (existing user with 2x2 and 3x3 data)
- [ ] Cross-browser testing
- [ ] Mobile device testing (iOS and Android)
- [ ] Performance testing (board rendering, game simulation)
- [ ] Accessibility testing (keyboard navigation, screen readers)

## Performance Considerations

### Rendering Performance:
- 4x4 board has 16 cells (vs 4 for 2x2, 9 for 3x3)
- SVG complexity increases with more cells
- May need to optimize combined board SVG generation

### Memory Considerations:
- Larger boards mean larger data structures
- More cells to track during simulation
- More positions in sequence arrays

### Recommendations:
1. Profile rendering performance with 4x4 boards
2. Consider memoization for expensive calculations
3. Optimize SVG generation if needed
4. Monitor bundle size impact

## Future Enhancements

### Beyond This Plan:
1. **5x5 and larger boards**: Framework should support easy addition
2. **Dynamic board sizes**: Allow custom sizes (within limits)
3. **Advanced tutorial**: Optional 4x4 tutorial mode
4. **Board complexity rating**: Help users understand difficulty
5. **Size-specific strategies**: UI hints for different sizes
6. **Tournament mode**: Size-restricted competitions

## Success Criteria

Implementation is successful when:
1. All TypeScript compilation passes without errors
2. All existing tests pass
3. New test coverage for 4x4 boards exists
4. Users can create 4x4 boards via BoardCreator
5. Users can save and manage 4x4 boards
6. Users can create decks with 4x4 boards
7. Users can play games with 4x4 boards
8. Scoring works correctly on 4x4 boards
9. Replay functionality works with 4x4 boards
10. Creature graphics display correctly
11. Mobile experience is acceptable
12. No regressions in 2x2 or 3x3 functionality
13. Data migration handles all edge cases
14. Build size impact is reasonable

## Estimated Total Time

- **Development**: 12-16 hours
- **Testing**: 4-6 hours
- **Documentation**: 1-2 hours
- **Total**: 17-24 hours

## Dependencies

### External Dependencies:
- None - all changes are internal

### Internal Dependencies:
- Phase 1 must complete before Phase 2
- Phase 6 should complete before Phase 9
- Phase 10 should be last (except Phase 11)

## Rollout Strategy

### Recommended Approach:
1. **Feature Flag** (Optional): Add config to enable/disable 4x4
2. **Gradual Rollout**: Enable for subset of users first
3. **Monitor**: Watch for performance issues or bugs
4. **Full Release**: Enable for all users

### Rollback Plan:
- Keep feature flag to disable 4x4 if issues arise
- Ensure existing 2x2 and 3x3 functionality unaffected
- Have data migration rollback ready

## Notes and Considerations

1. **Backward Compatibility**: Critical - existing users must not break
2. **Board Quality**: CPU boards for 4x4 need careful design
3. **UX Design**: Larger boards may need UI/UX adjustments
4. **Performance**: Monitor carefully on mobile devices
5. **Testing**: Comprehensive testing is essential
6. **Documentation**: Keep docs updated as changes are made

## Open Questions

1. Should tutorial include 4x4 option or remain 2x2 only?
2. What difficulty rating should 4x4 boards have?
3. Should there be size-specific scoring adjustments?
4. Are there any performance budgets to consider?
5. Should we add tooltips explaining 4x4 complexity?
6. How many default 4x4 boards should CPU Sam have?
7. Should deck size limits change for 4x4 boards?

---

**Document Version**: 1.0
**Created**: 2025-01-09
**Last Updated**: 2025-01-09
**Status**: Draft - Ready for Review
