# Model-Based Opponent Selection — Verification Checklist

## Prerequisites
- [ ] Python inference server running with at least one trained model
- [ ] Node dev server running
- [ ] Fresh game state (or start a new game)

## Python Inference Server
- [ ] `GET /models` returns models with `model_id` field (8-char hex string)
- [ ] `POST /construct-board` with `model_id` param returns a valid board
- [ ] `POST /construct-board` with unknown `model_id` returns 404
- [ ] `POST /construct-board` with `model_id` + mismatched `board_size` returns 400
- [ ] `model_id` takes priority over `model_index` when both are provided
- [ ] `model_id` takes priority over `skill_level` when both are provided

## Frontend — Opponent Creation Flow
- [ ] AI Agent card → skill level picker shows "Or browse all available models" link
- [ ] Clicking the link opens the ModelBrowser
- [ ] ModelBrowser loads and displays models from the inference server
- [ ] Board size filter works (dropdown filters model list)
- [ ] Standard/Fog filter works (dropdown filters model list)
- [ ] Models are sorted alphabetically by label
- [ ] Each row shows: label, board size badge, fog/standard badge, info icon
- [ ] Clicking info icon (?) opens Fog of War info modal
- [ ] Fog of War modal explains standard vs fog modes, closes with "Got It!"
- [ ] Clicking a model row navigates to the name form
- [ ] Name form is pre-populated with model label
- [ ] Name form shows board size and volatility notice
- [ ] Back from name form returns to ModelBrowser
- [ ] Back from ModelBrowser returns to skill level picker
- [ ] Submitting name form creates opponent and proceeds to board size selection

## Frontend — Board Size Lock
- [ ] Model-backed opponent shows locked board size selector (single option)
- [ ] Locked view shows "This model was trained on NxN boards" message
- [ ] Locked view shows "Model locked" badge
- [ ] No custom size input is shown in locked view
- [ ] Clicking the locked size proceeds normally to game

## Frontend — Gameplay
- [ ] Playing a round with model-backed opponent sends `model_id` in `/construct-board` request
- [ ] Board construction succeeds and round plays normally
- [ ] On retry (failed board), `model_id` is preserved (not converted to stochastic)
- [ ] Forfeit modal still works if retry also fails

## Error Handling
- [ ] ModelBrowser shows error + retry button when inference server is unreachable
- [ ] ModelBrowser shows "No models available" when server returns empty list
- [ ] Stale `modelId` (deleted from server) triggers existing retry/forfeit modal gracefully

## Backward Compatibility
- [ ] Existing skill-level AI agents still work (no `modelId` field)
- [ ] `model_index` still works in API
- [ ] CPU, Remote CPU, and Human opponent flows unchanged
- [ ] Saved opponents without `modelId`/`modelBoardSize` load without errors
