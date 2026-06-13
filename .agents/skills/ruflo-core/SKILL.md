---
name: ruflo-core
description: Use this when working with the MOP Ruflo core, Claude Flow configuration, MCP server setup, swarm routing, hooks, or cross-provider agent instructions.
---

# Ruflo Core Skill

## Goal

Keep the MOP Ruflo core portable across Claude Code, Codex,
ChatGPT coding surfaces, Gemini CLI, and Antigravity.

## Instructions

1. Read the active provider entry point first:
   - Codex / ChatGPT coding agents: `AGENTS.md`
   - Gemini CLI: `GEMINI.md`
   - Antigravity: `.agents/AGENTS.md`
   - Claude Code: `CLAUDE.md`
2. Inspect `.mcp.json`, `.claude-flow/config.yaml`, and provider-specific config
   before changing integration behavior.
3. Keep Claude-only hooks in `.claude/`; do not copy them blindly into other
   providers.
4. For Antigravity, put portable skills in `.agents/skills/<skill-name>/SKILL.md`.
5. Validate JSON/TOML/YAML after edits and report any tool or auth requirement
   that cannot be verified locally.

## Constraints

- Do not create or expose secrets.
- Do not start background daemons unless explicitly requested.
- Do not assume MCP is available; degrade to filesystem and shell inspection.
- Do not modify runtime state, logs, sessions, or memory data unless the user
  specifically asks.
