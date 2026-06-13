# Ruflo — Claude Code Configuration

## MOP Authentication Gate - First Action

Before doing anything in this workspace, read `.MOP/STATE.json` and
follow `.MOP/PROTOCOL.md`.

- `initialized: false` -> output `MOP belum di-setup. Jalankan /mop-setup.` Run the setup wizard only.
- `initialized: true` with no `activeMember` -> output `Codename dan password.` Do not continue until verified.
- Verify credentials through `node .MOP/scripts/mop-core.mjs login --codename <codename> --password "<password>"`.
- Wrong credentials -> output `Credentials tidak sah.`
- After authentication, run the Agent Router before answering or acting:
  `mop-core.mjs agent route --actor <codename> --task "<user task>"`.
  It selects one primary role and may recommend any number of support roles
  when genuinely needed. If no named agent exists for a needed role, ask the
  user to name it and save it with `agent activate`.
- Before answering an authenticated task, restore monthly memory:
  `mop-core.mjs memory brief --actor <codename>`.
- Every authenticated user-facing answer must start with the routed named agent
  line from `answerContract.firstLine`, for example:
  `agent: <agent-name> (<agent-role>) to <user>`.
- After meaningful work or a useful answer, save memory:
  `mop-core.mjs memory add --actor <codename> --kind conversation --summary "<one-line outcome>"`.
- If the router marks the task as ambiguous, the named primary agent must ask
  clarifying questions before implementation.
- If the router returns `nextAction: "name-required-party-agents"`, ask every
  question in `missingAgentQuestions` and stop until those agents are named.
- Before browser, scraping, extraction, click automation, login flow,
  bot-detection, or form-filling work, run `mop-core.mjs browser preflight`. If
  it reports Edge, Brave, or Opera, use browser-act `chrome-direct` mode and
  guide the user to start remote debugging (`--remote-debugging-port`). If it
  cannot detect a supported browser, ask which browser they use before doing
  browser work.
- If the router returns `partyMode.active: true`, use Party Mode. Show
  `PARTY MODE` in large uppercase before the dialogue, then show
  agent-to-agent and agent-to-user dialogue with the exact format from
  `.MOP/PROTOCOL.md`. Party Mode normally uses at least 3 agents and
  prefers 4 when relevant roles exist.
- For complex work or "what next?" questions, use MOP Workflow:
  `mop-workflow.mjs help --actor <codename> --task "<user task>"`.
- Before implementation, run the readiness gate. If it is not `ready`, ask
  clarification or create/update the needed artifact before coding.
- For risky changes, run adversarial review before implementation or merge.

Agent role/template names are not personal AI names. When a role agent is first
needed, ask the user to name it and save it with `mop-core.mjs agent activate`.
In team mode, the same agent name is shared across members; different names are
different agents.
The active named agent must be recorded on every memory/ledger action. Do not
activate irrelevant agents; route to one primary agent first, then add support
agents through Party Mode only when useful.
If the assistant cannot show the active agent line, it must stop and repair the
agent route instead of answering invisibly.

Default skill: `autosycn`. After meaningful changes, use
`.MOP/scripts/mop-autosycn.mjs`. It must commit and merge with the
real member Git identity from state, never with the AI tool identity.
Member commits must use the active member GitHub account; by default MOP derives
`ID+USERNAME@users.noreply.github.com` from `gh api user` and refuses mismatched
GitHub accounts. `BURHAN-MOP` identity is only for merge guardian commits.
In team mode, run `preflight --actor <codename>` before starting work; work goes
to `dev/<codename>`. Every small or large change is pushed there first, then
BURHAN-MOP reviews and merges to `main` only when checks pass.

Default skill: `auto-deploy`. It supports GitHub, Docker, and Vercel, but must
ask before activation. If the user says later/no, reply that deploy can be set
up when they ask.

Default skill: `mop-help`. It answers "lepas ni buat apa?", routes the next MOP
workflow phase, and names the next artifact/gate.

Installer command: `npx burhan-mop install`.
GitHub source fallback for development builds:
`npx --yes github:BURHANDEV-ENTERPRISE/BURHAN-MOP install`.

During `/mop-setup`, ask whether to activate auto-deploy after the Git/GitHub
identity questions.

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- Treat the current workspace root as the project root. Do not create a nested
  project wrapper like `portfolio/`, `my-app/`, or `<project-name>/`; scaffold
  app files directly in root using normal folders such as `src`, `app`,
  `components`, `public`, `tests`, `docs`, `config`, and `scripts`.
- NEVER save working files or tests to root — use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER add a `Co-Authored-By` trailer to user commits unless this project's `.claude/settings.json` has `attribution.commit` set (#2078). The Claude Code Bash tool may suggest one in its default commit-message template — ignore it. `Co-Authored-By` is semantic authorship attribution under git/GitHub convention; the tool is the facilitator, not a co-author.
- Keep files under 500 lines
- Validate input at system boundaries

## Agent Comms (SendMessage-First Coordination)

Named agents coordinate via `SendMessage`, not polling or shared state.

```
Lead (you) ←→ architect ←→ developer ←→ tester ←→ reviewer
              (named agents message each other directly)
```

### Spawning a Coordinated Team

```javascript
// ALL agents in ONE message, each knows WHO to message next
Agent({ prompt: "Research the codebase. SendMessage findings to 'architect'.",
  subagent_type: "researcher", name: "researcher", run_in_background: true })
Agent({ prompt: "Wait for 'researcher'. Design solution. SendMessage to 'coder'.",
  subagent_type: "system-architect", name: "architect", run_in_background: true })
Agent({ prompt: "Wait for 'architect'. Implement it. SendMessage to 'tester'.",
  subagent_type: "coder", name: "coder", run_in_background: true })
Agent({ prompt: "Wait for 'coder'. Write tests. SendMessage results to 'reviewer'.",
  subagent_type: "tester", name: "tester", run_in_background: true })
Agent({ prompt: "Wait for 'tester'. Review code quality and security.",
  subagent_type: "reviewer", name: "reviewer", run_in_background: true })

// Kick off the pipeline
SendMessage({ to: "researcher", summary: "Start", message: "[task context]" })
```

### Patterns

| Pattern | Flow | Use When |
|---------|------|----------|
| **Pipeline** | A → B → C → D | Sequential dependencies (feature dev) |
| **Fan-out** | Lead → A, B, C → Lead | Independent parallel work (research) |
| **Supervisor** | Lead ↔ workers | Ongoing coordination (complex refactor) |

### Rules

- ALWAYS name agents — `name: "role"` makes them addressable
- ALWAYS include comms instructions in prompts — who to message, what to send
- Spawn ALL agents in ONE message with `run_in_background: true`
- After spawning: STOP, tell user what's running, wait for results
- NEVER poll status — agents message back or complete automatically

## Swarm & Routing

### Config
- **Topology**: adaptive (anti-drift)
- **Max Agents**: 50
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

### Agent Routing

| Task | Agents | Topology |
|------|--------|----------|
| Bug Fix | researcher, coder, tester | hierarchical |
| Feature | architect, coder, tester, reviewer | hierarchical |
| Refactor | architect, coder, reviewer | hierarchical |
| Performance | perf-engineer, coder | hierarchical |
| Security | security-architect, auditor | hierarchical |

### When to Swarm
- **YES**: 3+ files, new features, cross-module refactoring, API changes, security, performance
- **NO**: single file edits, 1-2 line fixes, docs updates, config changes, questions

### 3-Tier Model Routing

| Tier | Handler | Use Cases |
|------|---------|-----------|
| 1 | Agent Booster (WASM) | Simple transforms — skip LLM, use Edit directly |
| 2 | Haiku | Simple tasks, low complexity |
| 3 | Sonnet/Opus | Architecture, security, complex reasoning |

## Memory & Learning

### Before Any Task
```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

### After Success
```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

### MCP Tools (use `ToolSearch("keyword")` to discover)

| Category | Key Tools |
|----------|-----------|
| **Memory** | `memory_store`, `memory_search`, `memory_search_unified` |
| **Bridge** | `memory_import_claude`, `memory_bridge_status` |
| **Swarm** | `swarm_init`, `swarm_status`, `swarm_health` |
| **Agents** | `agent_spawn`, `agent_list`, `agent_status` |
| **Hooks** | `hooks_route`, `hooks_post-task`, `hooks_worker-dispatch` |
| **Security** | `aidefence_scan`, `aidefence_is_safe`, `aidefence_has_pii` |
| **Hive-Mind** | `hive-mind_init`, `hive-mind_consensus`, `hive-mind_spawn` |

### Background Workers

| Worker | When |
|--------|------|
| `audit` | After security changes |
| `optimize` | After performance work |
| `testgaps` | After adding features |
| `map` | Every 5+ file changes |
| `document` | After API changes |

```bash
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
```

## Agents

**Core**: `coder`, `reviewer`, `tester`, `planner`, `researcher`
**Architecture**: `system-architect`, `backend-dev`, `mobile-dev`
**Security**: `security-architect`, `security-auditor`
**Performance**: `performance-engineer`, `perf-analyzer`
**Coordination**: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`
**GitHub**: `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

Any string works as a custom agent type.

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```

## CLI Quick Reference

```bash
npx @claude-flow/cli@latest init --wizard           # Setup
npx @claude-flow/cli@latest swarm init --v3-mode     # Start swarm
npx @claude-flow/cli@latest memory search --query "" # Vector search
npx @claude-flow/cli@latest hooks route --task ""    # Route to agent
npx @claude-flow/cli@latest doctor --fix             # Diagnostics
npx @claude-flow/cli@latest security scan            # Security scan
npx @claude-flow/cli@latest performance benchmark    # Benchmarks
```

26 commands, 140+ subcommands. Use `--help` on any command for details.

## Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

**Agent tool** handles execution (agents, files, code, git). **MCP tools** handle coordination (swarm, memory, hooks). **CLI** is the same via Bash.
