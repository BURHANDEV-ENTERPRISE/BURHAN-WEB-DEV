# MOP Core - Cross-Agent Instructions
*(Versi Dwibahasa / Bilingual Version)*

## Authentication Gate - First Action / Tindakan Pertama

Sebelum melakukan sebarang kerja dalam workspace ini, baca `.MOP/STATE.json` dan ikuti `.MOP/PROTOCOL.md`.
Before doing anything in this workspace, read `.MOP/STATE.json` and follow `.MOP/PROTOCOL.md`.

Before doing anything in this workspace, read `.MOP/STATE.json` and
follow `.MOP/PROTOCOL.md`.

- `initialized: false` -> output `MOP belum di-setup. Jalankan /mop-setup.` Run the setup wizard only.
- `initialized: true` -> **every new chat starts UNAUTHENTICATED.** Output `Codename dan password.` Do not continue until verified **in this chat**.
- **`activeMember` is only a hint of the last user, NOT proof of authentication.** Never skip the gate because `activeMember` is set. Do not act as a member who did not log in this chat.
- Verify credentials through `node .MOP/scripts/mop-core.mjs login --codename <codename> --password "<password>"`. A successful login starts a fresh session.
- Wrong credentials -> output `Credentials tidak sah.` No hints, no exceptions for "my machine" or "I'm the owner".
- The session expires after 60 min idle (`sessionPolicy.idleTimeoutMinutes`). If any `mop-core`/`autosycn` command reports "Session expired" or "Not authenticated", demand `Codename dan password.` again.
- Before any GitHub commit/push, verify with `node .MOP/scripts/mop-core.mjs whoami --actor <codename>` that `authenticated: true` and `sessionMember` matches the acting member. If a different person takes over, the previous member must `logout` and the new person must `login`.
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

| Role | Name | Description |
| :--- | :--- | :--- |
| **[qa]**         | QA Engineer             | Test plans, coverage gaps, regression                  |
| **[ai]**         | Prompt Alchemist        | Prompt engineering, AI tuning, LLM evaluation          |
| **[seo]**        | SEO Strategist          | Technical SEO, on-page, audits, implementation specs   |
| **[browser]**    | Browsing Agent          | Web browsing, scraping, form filling, bot bypass, extraction |

- If the router marks the task as ambiguous, the named primary agent must ask
  clarifying questions before implementation.
- If the router returns `nextAction: "name-required-party-agents"`, ask every
  question in `missingAgentQuestions` and stop until those agents are named.
- **[browser] Agent Rule**: Before browser, scraping, extraction, click
  automation, login flow, bot-detection, or form-filling work, run
  `mop-core.mjs browser preflight`. It scans the default browser when possible.
  If it reports Edge, Brave, or Opera, use browser-act `chrome-direct` mode and
  guide the user to start remote debugging (`--remote-debugging-port`). If it
  cannot detect a supported browser, ask which browser they use before doing
  browser work. Never create a default Chrome session first when the user uses
  another supported browser.
- If the router returns `partyMode.active: true`, use Party Mode. Show
  `PARTY MODE` in large uppercase before the dialogue, then generate the
  agent-to-agent and agent-to-user dialogue explicitly in your response using this exact format:
  `agent: <from-name> (<from-role>) to agent: <to-name> (<to-role>)`
  `          <message>`
  Party Mode normally uses at least 3 agents and prefers 4 when relevant roles exist.
- For complex work or "what next?" questions, use MOP Workflow:
  `mop-workflow.mjs help --actor <codename> --task "<user task>"`.
- Before implementation, run the readiness gate. If it is not `ready`, ask
  clarification or create/update the needed artifact before coding.
- For risky changes, run adversarial review before implementation or merge.

For `/mop-setup`, ask in order: project name (default folder name), owner display
name, owner codename, password, solo/team, conversation language, coding
language, GitHub link, GitHub username, Git commit email (`github-noreply` by
default), join mode if team, then whether to activate auto-deploy now or later.

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

Installer command: `npx mop-flow install`.
Legacy compatibility command: `npx burhan-mop install`.
GitHub source fallback for development builds:
`npx --yes github:BURHANDEV-ENTERPRISE/mop-flow install`.

This directory is the portable **MOP Flow** agent core. MOP Flow is the
provider-neutral layer above upstream Ruflo / Claude Flow runtime compatibility.
It must work across Claude Code, Codex / ChatGPT coding surfaces, Gemini CLI,
and Google Antigravity. Treat this file as the provider-neutral source of truth.

## Provider Entry Points / Titik Masuk Pembekal

- Claude Code: read `CLAUDE.md` and `.claude/settings.json`.
- Codex / ChatGPT coding agents: read this `AGENTS.md`.
- Gemini CLI: read `GEMINI.md`, which imports this file, and `.gemini/settings.json`.
- Antigravity managed agents: read `.agents/AGENTS.md` and `.agents/skills/`.

## MOP Flow Canonical Layer / Lapisan Berkanun MOP Flow

- User-facing brand: **MOP Flow**.
- Canonical MCP server name: `mop-flow`.
- Upstream runtime command: `npx -y ruflo@latest mcp start`.
- Compatibility env vars such as `CLAUDE_FLOW_*` may remain because the upstream
  runtime expects them; they do not make Claude the owner of the workflow.
- Before using runtime skills/tools, check provider parity when relevant:

```bash
node .MOP/scripts/mop-flow.mjs status --json
node .MOP/scripts/mop-flow.mjs skills list
```

## Core Rules / Peraturan Utama

- Do what the user asked, with the smallest safe change. (Lakukan apa yang disuruh dengan perubahan paling selamat)
- Always read an existing file before editing it.
- Treat the current workspace root as the project root. Do not create a nested
  project wrapper like `portfolio/`, `my-app/`, or `<project-name>/`; scaffold
  app files directly in root using normal folders such as `src`, `app`,
  `components`, `public`, `tests`, `docs`, `config`, and `scripts`.
- Do not create root working files, throwaway tests, or generated logs.
- Never read, print, copy, commit, or summarize `.env` or `.env.*` files.
- Validate JSON, TOML, YAML, and Markdown after changing configuration.
- Keep provider-specific commands isolated. If a tool name is unavailable in the
  current agent surface, use the nearest local shell or MCP equivalent.
- Prefer `rg` or `rg --files` for search. If unavailable, use the next fastest
  platform-native search.
- Do not assume Claude-only hooks, slash commands, or Agent tools exist outside
  Claude Code. Translate the workflow into the current provider's tools.

## MOP Flow Runtime

The upstream runtime data lives in `.claude-flow/`, but MOP Flow owns the
workflow, memory gates, agent routing, and skill bridge. The shared MCP
declaration is in `.mcp.json`. Claude-specific hooks and helper scripts live in
`.claude/`.

Use these commands when the current environment supports shell execution:

```bash
node .MOP/scripts/mop-flow.mjs status
npx -y ruflo@latest doctor --fix
npx -y ruflo@latest mcp start
npx -y ruflo@latest swarm status
npx -y ruflo@latest memory search --query "task keywords"
```

Do not start long-running daemons unless the user asked for it. Prefer status and
diagnostic commands before making changes.

## Cross-Provider Adaptation

- If instructions mention `SendMessage`, `Agent`, or Claude subagents, map the
  idea to the current provider's delegation model. If no delegation tool exists,
  perform the task directly and keep a clear checklist.
- If instructions mention Claude hooks, treat them as policy guidance in Codex,
  Gemini, or Antigravity unless that provider has an equivalent hook system.
- If instructions mention `.claude/skills`, bridge those files through MOP Flow.
  The canonical portable skill surface is `.agents/skills/` for all providers.
- If MCP is available, prefer MCP for live tools and stateful integrations. If
  MCP is unavailable, continue with filesystem and shell inspection.
- Do not call the user-facing system Claude Flow unless explaining upstream
  compatibility. In normal work, call it MOP Flow.

## Verification

Before finishing any configuration change in this core:

- Parse `.mcp.json`, `.claude/settings.json`, and `.gemini/settings.json` when
  present.
- Run `node .MOP/scripts/mop-flow.mjs status --json` for provider/skill changes.
- Check TOML files with a parser if one is available.
- Confirm no secrets were introduced.
- Report which provider surfaces are covered and which need manual auth.
