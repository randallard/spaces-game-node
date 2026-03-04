# Scripted Agents, Model Assignments, and the Edit AI Agent Modal

Today's session brought three related improvements together into one cohesive update.

**Scripted agent support.** The Python inference server had already added scripted agents (`scripted_1` through `scripted_4`) for 2x2 boards, but the Node frontend's Zod schema hadn't caught up. We closed that gap — the schema, types, and tests all now recognize scripted levels as valid skill levels.

**Per-board-size model assignments.** Previously, a model-backed AI agent was locked to a single board size (the one it was trained on). We introduced a `modelAssignments` record on the `Opponent` type, keyed by board size. This means a single AI agent can now have different models assigned for different board sizes — play a scripted agent at 2x2 and an RL model at 5x5, all under one opponent entry. The old `modelId`/`modelBoardSize` fields are kept for backward compatibility with existing localStorage data, and the game logic falls back to them gracefully.

**Edit AI Agent modal.** A new modal accessible from the opponent list lets players view and customize their AI agent's model assignments across all preset board sizes (2x2 through 10x10). Each size shows its current assignment, with options to change or clear it. When changing, the modal fetches available models from the inference server and filters them to the selected board size. For 2x2, scripted agents also appear as options. There's also a "Create Copy" feature for duplicating an agent with a new name and fresh win/loss record while preserving all model assignments.

**BoardSizeSelector update.** Model-backed opponents with the new `modelAssignments` field are no longer locked to a single board size. The lock behavior only applies to legacy opponents that still use the old `modelId`/`modelBoardSize` fields without assignments.

All 75 test suites pass (1,967 tests total, 46 new). TypeScript compiles cleanly with no errors.
