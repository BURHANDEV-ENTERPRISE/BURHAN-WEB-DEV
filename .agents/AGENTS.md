# MOP Core - Antigravity Instructions

This is the Antigravity managed-agent entry point. The provider-neutral project
rules are in the root `AGENTS.md`; apply those rules first when the root is
available in the environment.

## Authentication Gate

Before doing anything, read `.MOP/STATE.json` and follow
`.MOP/PROTOCOL.md`.

- If setup is pending, run only the setup wizard.
- If login is required, ask only for codename and password.
- After login, run the Agent Router: every conversation and action must route
  to one primary named agent. Check with `mop-core.mjs agent route --actor
  <codename> --task "<user task>"`.
- If the router says clarification is needed, ask the clarifying questions
  before implementation.
- If the router activates Party Mode, show visible agent-to-agent dialogue using
  the exact format in `.MOP/PROTOCOL.md`, with `PARTY MODE` shown in
  large uppercase before the dialogue. Party Mode normally uses at least 3
  agents and prefers 4 when relevant roles exist.
- For complex work or "what next?" questions, use MOP Workflow:
  `mop-workflow.mjs help --actor <codename> --task "<user task>"`.
- Before implementation, run the readiness gate. If it is not `ready`, ask
  clarification or update the needed artifact before coding.
- For risky changes, run adversarial review before implementation or merge.
- When a role agent first appears, ask the user to name it before using it as a
  personal agent.

## Operating Rules

- Treat this workspace as a Ruflo / Claude Flow portable agent core.
- Use `.agents/skills/` for Antigravity-native skills.
- Use `.claude/skills/` as reference material only; do not assume Claude Code
  tools are available in Antigravity.
- Treat the current workspace root as the project root. Do not create a nested
  project wrapper like `portfolio/`, `my-app/`, or `<project-name>/`; scaffold
  app files directly in root using normal app folders.
- Do not read or expose `.env` or `.env.*`.
- Run validation after configuration edits.
- Stop once the requested task is complete; do not keep expanding scope.

## Useful Local Paths

- Root instructions: `AGENTS.md`
- Claude instructions: `CLAUDE.md`
- Gemini instructions: `GEMINI.md`
- MCP server map: `.mcp.json`
- Ruflo runtime config: `.claude-flow/config.yaml`
- Antigravity skills: `.agents/skills/`

Installer command: `npx burhan-mop install`.
GitHub source fallback for development builds:
`npx --yes github:BURHANDEV-ENTERPRISE/BURHAN-MOP install`.
