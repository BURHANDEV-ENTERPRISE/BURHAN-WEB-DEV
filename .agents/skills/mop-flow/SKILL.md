---
name: mop-flow
description: Use this when work involves MOP Flow, provider parity, skill bridging, MCP runtime setup, swarm/runtime orchestration, or translating Claude-native skills for Codex, Gemini, Antigravity, or Claude.
---

# MOP Flow

MOP Flow is the provider-neutral orchestration layer owned by MOP. Ruflo and
Claude Flow are upstream runtime compatibility names only; user-facing work
should identify the system as MOP Flow.

## When To Use

- The task mentions MOP Flow, Claude Flow, Ruflo, swarm, MCP, hooks, skills, or
  provider parity.
- A non-Claude provider needs access to skills stored under `.claude/skills/`.
- The agent is deciding which skill, provider entrypoint, or runtime tool to use.

## Required Flow

1. Read `.MOP/STATE.json` and `.MOP/PROTOCOL.md` first.
2. Use MOP auth, Agent Router, memory, readiness, and autosycn rules before any
   provider-specific runtime behavior.
3. Run the MOP Flow status helper when skill/provider routing matters:

```bash
node .MOP/scripts/mop-flow.mjs status --json
```

4. Prefer portable skills in `.agents/skills/`.
5. If a needed skill exists only in `.claude/skills/`, bridge it through MOP Flow:
   read the skill file as reference, translate Claude-only tools into the
   current provider's tools, and keep MOP policy as the top authority.
6. Prefer MCP server name `mop-flow`. Keep `CLAUDE_FLOW_*` env vars only because
   the upstream runtime still expects them.

## Useful Commands

```bash
node .MOP/scripts/mop-flow.mjs providers
node .MOP/scripts/mop-flow.mjs skills list
node .MOP/scripts/mop-flow.mjs manifest refresh
```

## Rules

- Do not call the user-facing system Claude Flow when MOP is the installed core.
- Do not assume Claude hooks or slash commands exist in Codex, Gemini, or
  Antigravity.
- Do not let runtime suggestions bypass MOP auth, agent role, memory, readiness,
  autosycn, or project-root rules.
- If MCP is unavailable, continue with filesystem and shell inspection, then
  report which provider runtime could not be verified.
