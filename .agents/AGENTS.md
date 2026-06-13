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
- Before answering, restore monthly memory with
  `mop-core.mjs memory brief --actor <codename>`.
- Every authenticated user-facing answer must start with the routed
  `answerContract.firstLine`, for example:
  `agent: <agent-name> (<agent-role>) to <user>`.
- After meaningful work, save memory with
  `mop-core.mjs memory add --actor <codename> --kind conversation --summary "<outcome>"`.
- If the router says clarification is needed, ask the clarifying questions
  before implementation.
- If the router returns `nextAction: "name-required-party-agents"`, ask every
  question in `missingAgentQuestions` and stop until those agents are named.
- Before browser, scraping, extraction, click automation, login flow,
  bot-detection, or form-filling work, run `mop-core.mjs browser preflight`. If
  it reports Edge, Brave, or Opera, use browser-act `chrome-direct` mode and
  guide the user to start remote debugging (`--remote-debugging-port`). If it
  cannot detect a supported browser, ask which browser they use before doing
  browser work.
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
- Autosycn member commits must use the active member GitHub account. By default,
  MOP derives `ID+USERNAME@users.noreply.github.com` from `gh api user` and
  refuses mismatched GitHub accounts. `BURHAN-MOP` identity is reserved for
  merge guardian commits only.

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
