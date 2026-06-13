# MOP Core - Gemini CLI Instructions

Gemini CLI should load this file as project context. The main provider-neutral
rules are imported below.

@./AGENTS.md

## Gemini-Specific Notes

- First action still applies: read `.MOP/STATE.json` and follow
  `.MOP/PROTOCOL.md`.
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
  report the failed server name clearly.
