# MOP Core - Gemini CLI Instructions

Gemini CLI should load this file as project context. The main provider-neutral
rules are imported below.

@./AGENTS.md

## Gemini-Specific Notes

- First action still applies: read `.MOP/STATE.json` and follow
  `.MOP/PROTOCOL.md`.
- Treat the current workspace root as the project root; do not create a nested
  project wrapper folder for app work unless the user explicitly asks for it.
- Use `.gemini/settings.json` for context filenames and MCP server setup.
- Use `/memory show` to verify which context files Gemini loaded.
- Use `/memory refresh` after editing `AGENTS.md`, `GEMINI.md`, or nested context
  files.
- If MCP servers fail to start, continue with local filesystem inspection and
  report the failed server name clearly.
