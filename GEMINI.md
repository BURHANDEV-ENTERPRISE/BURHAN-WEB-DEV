# MOP Core - Gemini CLI Instructions
*(Versi Dwibahasa / Bilingual Version)*

Gemini CLI should load this file as project context. The main provider-neutral
rules are imported below. (Gemini CLI harus memuatkan fail ini sebagai konteks projek. Peraturan utama diimport di bawah)

@./AGENTS.md

## MOP Flow Notes / Nota MOP Flow

- Use MOP Flow as the canonical system name. (Gunakan MOP Flow sebagai nama sistem utama)
- Use `.agents/skills/` as the portable skill surface.
- When a capability exists only in `.claude/skills/`, read it as a MOP Flow
  bridged skill and translate Claude-only hooks/slash commands into Gemini CLI
  tools or local shell/MCP equivalents.
- Check provider parity with:

```bash
node .MOP/scripts/mop-flow.mjs status --json
```

## Gemini-Specific Notes / Nota Khusus Gemini

- First action still applies: read `.MOP/STATE.json` and follow
  `.MOP/PROTOCOL.md`. (Tindakan pertama masih terpakai: baca STATE.json dan ikuti PROTOCOL.md)
- **Every new chat starts UNAUTHENTICATED.** Demand `Codename dan password.` and
  run `login` this chat. `activeMember` is only a hint, never proof of auth.
  Session expires after 60 min idle; re-login when commands report
  "Session expired" / "Not authenticated".
- After authentication, run `mop-core.mjs memory brief --actor <codename>` and
  `mop-core.mjs agent route --actor <codename> --task "<user task>"` before
  answering.
- Every authenticated answer must start with `answerContract.firstLine`, for
  example: `agent: <agent-name> (<agent-role>) to <user>`.
- Save a one-line memory after meaningful work with
  `mop-core.mjs memory add --actor <codename> --kind conversation --summary "<outcome>"`.
- If `agent route` returns `nextAction: "name-required-party-agents"`, ask every
  question in `missingAgentQuestions` and stop until those agents are named.
- Before browser, scraping, extraction, click automation, login flow,
  bot-detection, or form-filling work, run `mop-core.mjs browser preflight` and
  follow its mode/question before doing browser work.
- Autosycn member commits must use the active member GitHub account. MOP derives
  `ID+USERNAME@users.noreply.github.com` from `gh api user` by default and
  refuses mismatched GitHub accounts.
- Treat the current workspace root as the project root; do not create a nested
  project wrapper folder for app work unless the user explicitly asks for it.
- Use `.gemini/settings.json` for context filenames and MCP server setup.
- Use `/memory show` to verify which context files Gemini loaded.
- Use `/memory refresh` after editing `AGENTS.md`, `GEMINI.md`, or nested context
  files.
- If MCP servers fail to start, continue with local filesystem inspection and
  report the failed server name clearly. Prefer the `mop-flow` server name when
  referring to the Ruflo-backed runtime.
