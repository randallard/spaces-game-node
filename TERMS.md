# Terms & Technical Reference

A glossary of technical terms, tools, and concepts relevant to the Spaces Game project.

---

## SB3 (Stable Baselines 3)

**Stable Baselines 3** is a set of reliable, well-tested implementations of reinforcement learning (RL) algorithms built on top of PyTorch. It is the successor to the original Stable Baselines library (which was TensorFlow-based).

In the Spaces Game, SB3 is used to train AI opponents. Specifically:

- **PPO (Proximal Policy Optimization)** — the primary algorithm used. PPO is a policy-gradient method that constrains policy updates to prevent catastrophically large changes, making training more stable.
- **MaskablePPO** — an extension from `sb3-contrib` that supports action masking. This lets the agent know which actions are *invalid* at each step (e.g., placing a piece on an already-occupied cell), preventing it from wasting training time on illegal moves.

When we say "SB3-trained models," we mean `.zip` files containing a saved PPO or MaskablePPO policy that was trained using the SB3 framework against our Gymnasium environment. These `.zip` files contain:

1. The neural network weights (the learned policy)
2. Optimizer state
3. Training metadata

These are serialized using Python's `pickle` module internally, which has security implications (see below).

### References

- [Stable Baselines 3 Documentation](https://stable-baselines3.readthedocs.io/) — official docs, API reference, examples
- [SB3 GitHub Repository](https://github.com/DLR-RM/stable-baselines3) — source code, issues, releases
- [SB3 Contrib (MaskablePPO, etc.)](https://stable-baselines3.readthedocs.io/en/master/guide/sb3_contrib.html) — experimental algorithms including MaskablePPO
- [JMLR Paper: "Stable-Baselines3: Reliable Reinforcement Learning Implementations"](https://jmlr.org/papers/volume22/20-1364/20-1364.pdf) — the academic paper describing SB3's design philosophy
- [PettingZoo SB3 Tutorial](https://pettingzoo.farama.org/tutorials/sb3/index.html) — multi-agent RL with SB3

---

## Pickle Deserialization Attacks

**Python's `pickle` module** is the default serialization format used by PyTorch, SB3, and most Python ML frameworks to save and load models. Pickle is powerful but inherently unsafe: it can execute arbitrary Python code during deserialization (unpickling).

### How the Attack Works

When you call `pickle.load()` (or `torch.load()`, or `SB3.load()`), pickle processes a stream of bytecode-like opcodes. Some of these opcodes can:

1. **Import any Python module** (e.g., `os`, `subprocess`, `shutil`)
2. **Call any function** with arbitrary arguments (e.g., `os.system("rm -rf /")`)
3. **Chain operations** to build complex attack payloads

This means a malicious `.zip` model file could, when loaded, execute shell commands, exfiltrate data, install backdoors, or destroy files — all silently during what looks like a normal `model.load()` call.

### Real-World Impact

- **44.9% of popular models on Hugging Face** still use the insecure pickle format
- Pickle-only models are downloaded **400M+ times per month** across the ML ecosystem
- Numerous malicious pickle models have been discovered on Hugging Face and other model hubs
- CVE-2025-1716 demonstrated bypasses of scanning tools like PickleScan

### Why This Matters for Spaces Game

If we ever allow users to upload trained models, we would be loading untrusted pickle files on our server. Without mitigation, a malicious user could gain full server access by uploading a crafted model file. Mitigation strategies include:

- **Sandboxed loading** — load models in isolated containers with no network access
- **SafeTensors format** — an alternative serialization that only stores tensor data, no executable code
- **PickleScan / PickleBall** — static analysis tools that scan pickle files for dangerous opcodes before loading
- **Standardized API interface** — avoid loading models entirely; instead, define an HTTP contract and let users host their own inference servers (our preferred approach)

### References

- [PickleBall: Secure Deserialization of Pickle-based ML Models (CCS 2025)](https://arxiv.org/abs/2508.15987) — academic paper on safe pickle loading, correctly loads 79.8% of benign models while rejecting 100% of malicious ones
- [PickleBall Paper (Brown/Columbia)](https://cs.brown.edu/~vpk/papers/pickleball.ccs25.pdf) — full PDF
- [JFrog: Unveiling 3 Zero-Day PickleScan Vulnerabilities](https://jfrog.com/blog/unveiling-3-zero-day-vulnerabilities-in-picklescan/) — demonstrates real bypasses of the most popular scanning tool
- [Sonatype: Exposing 4 Critical Vulnerabilities in Python PickleScan](https://www.sonatype.com/blog/bypassing-picklescan-sonatype-discovers-four-vulnerabilities)
- [Python `pickle` module documentation](https://docs.python.org/3/library/pickle.html) — see the red warning box at the top: *"Warning: The pickle module is not secure. Only unpickle data you trust."*
- Sutton & Barto, *Reinforcement Learning: An Introduction* (2nd ed., 2018) — foundational RL textbook for understanding the training side of things

---

## MCP (Model Context Protocol)

**Model Context Protocol** is an open standard introduced by Anthropic (November 2024) for connecting LLMs to external tools and data sources. It uses a client-server architecture over JSON-RPC 2.0.

**Important clarification:** MCP is a *communication protocol* for LLM tool use, not a training framework. It does not train models — it lets an LLM call functions (tools) exposed by MCP servers.

### Architecture

- **MCP Client** — the AI application (e.g., Claude Desktop, a custom agent). Sends requests to servers.
- **MCP Server** — exposes tools, resources, and prompts. A server might provide access to a database, an API, a file system, or a game.
- **Transport** — communication happens over JSON-RPC 2.0, typically via stdio (local) or HTTP/SSE (remote).

### Relevance to Spaces Game

An MCP server could expose the Spaces Game as a set of tools (e.g., `get_game_state`, `place_piece`, `place_trap`), allowing an LLM to play the game by making tool calls. This is fundamentally different from our RL-trained agents: the LLM reasons about the game through its general intelligence rather than through specialized training.

### References

- [MCP Specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25) — latest protocol spec
- [Anthropic: Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) — original announcement
- [MCP GitHub Repository](https://github.com/modelcontextprotocol/modelcontextprotocol) — specification source and docs
- [MCP Wikipedia Article](https://en.wikipedia.org/wiki/Model_Context_Protocol) — good overview of history and adoption
- [One Year of MCP: November 2025 Spec Release](http://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/) — anniversary retrospective with 2025 spec features

---

## Gymnasium (formerly OpenAI Gym)

The standard Python API for RL environments. Our `SimultaneousPlayEnv` implements the Gymnasium interface, defining observation spaces, action spaces, and step/reset methods that SB3 algorithms interact with during training.

### References

- [Gymnasium Documentation](https://gymnasium.farama.org/) — maintained by the Farama Foundation

---

## Fog of War (Stage 4)

Our Stage 4 environment variant where the agent cannot see the opponent's full board from previous rounds. Instead, it receives partial information:

- Only opponent piece moves up to the point where the agent's piece stopped
- Only the trap that was triggered (if one was)
- All other traps and future moves are hidden

This is more realistic — in a real game, you wouldn't know your opponent's full strategy, only what you observed during play.

---

## SafeTensors

A secure serialization format for storing tensor data (model weights) without pickle. Created by Hugging Face as a direct response to pickle security concerns. Only stores numerical data — no arbitrary code execution possible.

### References

- [SafeTensors GitHub](https://github.com/huggingface/safetensors)
