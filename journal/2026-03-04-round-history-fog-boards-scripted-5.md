# Round History, Fog Boards, and Scripted Agent Level 5

This session implemented the frontend changes needed to support the Python inference server's new `round_history` field and `scripted_5` agent.

**Fog-of-war board filtering.** Added `buildFogBoard()` to `board-encoding.ts`. This function filters a board's sequence down to what the AI agent could actually see during simulation — piece and final moves up to the step it reached, plus the trap only if it hit one at the matching position. This mirrors the fog-of-war visibility rules used in training.

**Round history payload.** The `requestAiAgentBoard()` function now builds a `round_history` array alongside the existing `round_scores`. Each entry includes the agent's own board (encoded), a fog-filtered view of the opponent's board (encoded), simulation details (last step, trap hits), and scores — all flipped from the game's player-centric perspective to the agent's perspective. The `round_scores` field is preserved for backward compatibility with scripted agents 1–4.

**Scripted agent level 5.** Added `scripted_5` to the `AiAgentSkillLevel` type, the `AI_AGENT_SKILL_LEVELS` constants (emoji: mushroom, name: Myco, label: Supermove), and the Edit AI Agent modal's scripted agents list. All five scripted levels now appear when selecting a model for 2x2 boards.

All 75 test suites pass (1,977 tests total, 10 new). TypeScript compiles cleanly and the production build succeeds.
