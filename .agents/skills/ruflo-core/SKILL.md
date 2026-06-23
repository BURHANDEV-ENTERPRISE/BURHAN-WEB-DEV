---
name: ruflo-core
description: Legacy alias for MOP Flow runtime compatibility. Use mop-flow first, then this file when inspecting Ruflo or Claude Flow upstream behavior.
---

# Ruflo Core Skill (Legacy Alias)

## Goal

Keep upstream Ruflo / Claude Flow runtime behavior portable under the MOP Flow
brand across Claude Code, Codex, ChatGPT coding surfaces, Gemini CLI, and
Antigravity.

## Instructions

1. Prefer `.agents/skills/mop-flow/SKILL.md` for provider parity and branding.
2. Read the active provider entry point:
   - Codex / ChatGPT coding agents: `AGENTS.md`
   - Gemini CLI: `GEMINI.md`
   - Antigravity: `.agents/AGENTS.md`
   - Claude Code: `CLAUDE.md`
3. Inspect `.mcp.json`, `.claude-flow/config.yaml`, and provider-specific config
   before changing integration behavior.
4. Keep Claude-only hooks in `.claude/`; do not copy them blindly into other
   providers.
5. For Antigravity and cross-provider skills, use `.agents/skills/<skill-name>/SKILL.md`.
6. Validate JSON/TOML/YAML after edits and report any tool or auth requirement
   that cannot be verified locally.

## Constraints

- Do not create or expose secrets.
- Do not start background daemons unless explicitly requested.
- Do not assume MCP is available; degrade to filesystem and shell inspection.
- Do not modify runtime state, logs, sessions, or memory data unless the user
  specifically asks.
