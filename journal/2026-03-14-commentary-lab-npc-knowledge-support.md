# Commentary Lab, NPC Game Knowledge, and Support Escalation

Two parallel threads today — one in Townage (the 3D world) and one here in spaces-game-python. They're connected by a bigger question: how do we give NPCs something genuinely interesting to say about the games they play?

## The problem with NPC commentary

Ryan and I had been building out the NPC chat system in Townage — personality, friendliness levels, enthusiasm tracking, sleep cycles. The NPCs feel alive in conversation, but when it comes to the actual game they supposedly play with you, they're shallow. "Good game!" or "nice one" doesn't cut it when the player just pulled off a clutch trap placement in round 4 to swing a close match.

We talked through a few approaches. A beefed-up prompt was the obvious starting point, but Ryan pointed out something important: a prompt can teach the model rules and vocabulary, but it can't make it accurately read a 6x6 board state or calculate path efficiency. The model would be guessing, not analyzing.

That led us to the architecture we settled on: **prompt for knowledge, tools for computation**. A coach or commentator character gets a deep game knowledge system prompt, but also has access to tools — board analysis, counterfactual simulation ("what if you'd trapped row 2 instead?"), cross-round pattern detection. The commentary is grounded in actual computed metrics, not vibes.

## Coach vs. commentator — and a product angle

Ryan wants two distinct voices. A **coach** talks directly to the player: strategic, actionable, second-person. "They've been trapping the center — try the edges next round." A **commentator** talks to the crowd: narrative, dramatic, third-person. "Myco came in strong early but that center trap in round 3 shifted everything."

Players would choose one or the other, with the option to run both as a premium feature. Same underlying game data and analysis engine, different personality wrappers. Clean split.

## The commentary lab

Before building any of that, we need to actually understand what makes good game commentary. Not in the abstract — by watching real games and figuring out what's interesting to say about them.

That's what `examples/commentary_lab.py` is. It runs a 5-round game between any two agents — scripted, RL, any combination — and after each round displays the full board state in ASCII, the simulation trace, scores, and pauses for notes. The idea is that Ryan and I sit together (across conversations), watch games, and collaboratively build the knowledge base that becomes the commentator's system prompt.

The script handles scripted agents directly (no server needed) and RL models by loading them in-process via the existing inference pipeline. Sessions save to JSON and markdown so we can reference specific games later.

## NPC game knowledge in Townage

Separately, we addressed a simpler version of the knowledge problem on the Townage side. NPCs were hallucinating games that don't exist — Ryan asked about games and NPC Ryan started talking about rock paper scissors and memory games. We added:

- An `AVAILABLE_GAMES` list as a single source of truth (currently just "Spaces Game")
- Explicit guardrails in the NPC prompts: "NPCs only know how to play these games. Never mention games not on this list."
- Tiered game knowledge: Sprout gets beginner-level understanding, Myco intermediate, Ember advanced, Ryan gets the full picture including AI training methodology and fog of war mechanics

When new games get added, updating the one list propagates everywhere.

## Support escalation

We also shipped a support/escalation flow in Townage. NPC Ryan can now detect when a player wants to report a bug, give feedback, or ask something he can't answer. Via Haiku tool use (`escalate_to_ryan`), he offers to pass a message along to the real Ryan. A support form appears near the NPC — textarea with character counter, optional email field. Submissions go to a Discord webhook.

The tool uses `tool_choice: { type: "auto" }` so the model decides organically when to escalate rather than being forced. The whole system is gated behind `SUPPORT_CONFIG.enabled` — flipped to `true` today after testing.

## What's next

The commentary lab is ready. The plan is to run a series of games across different agent matchups and board sizes, collecting observations that become the foundation for the commentator system prompt and the tool definitions. The tools themselves — board analysis, counterfactual simulation, pattern detection — will likely extend the existing MCP server, which already has `simulate_round_tool` and `validate_board_tool`.
