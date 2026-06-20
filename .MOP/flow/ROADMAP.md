# MOP Flow Roadmap

MOP Flow aims to beat BMAD and Ruflo by combining disciplined product workflow,
provider-neutral skill portability, and runtime orchestration under MOP rules.

## Status

| Area | Status | Notes |
| --- | --- | --- |
| Provider-neutral branding | Shipped | User-facing system is MOP Flow. Ruflo / Claude Flow are upstream compatibility names. |
| Cross-provider MCP name | Shipped | Canonical server is `mop-flow` across Claude, Codex, Gemini, and Antigravity. |
| Skill bridge manifest | Shipped | `.MOP/flow/skill-manifest.json` bridges portable and runtime-native skills. |
| Portable MOP Flow skill | Shipped | `.agents/skills/mop-flow` is the canonical portable skill entry. |
| BMAD-style workflow gates | Partially shipped | Idea to release workflow, artifacts, readiness, and adversarial review exist. Needs richer web bundles and artifact intelligence. |
| Ruflo-style runtime power | Partially shipped | Ruflo-backed MCP/runtime exists. Needs profiles, runtime health scoring, and safer opt-in workers. |
| Provider parity enforcement | Partially shipped | Doctor/smoke tests check MOP Flow files and provider status. Needs deeper generated adapters per provider. |

## Phase 1 - Provider Parity

- Keep `mop-flow` as the canonical npm package and CLI command.
- Keep `burhan-mop` only as a legacy alias during migration.
- Generate and validate skill inventory across `.agents/skills` and `.claude/skills`.
- Make every provider load MOP auth, agent routing, memory, workflow, and skill bridge before provider-specific behavior.

## Phase 2 - Better Than BMAD Workflow

- Add richer artifact templates for PRD, architecture, story, QA, release, and handoff.
- Add workflow profiles: `quick`, `product`, `engineering`, `security`, `release`.
- Add artifact freshness checks so agents know when a PRD/story/architecture is stale.
- Add web bundles for planning in ChatGPT/Gemini web environments without local MCP.

## Phase 3 - Better Than Ruflo Runtime

- Add runtime profiles: `core`, `mop-flow-lite`, `mop-flow-full`.
- Add MCP/runtime health scoring for `mop-flow`, `ruv-swarm`, and `flow-nexus`.
- Add safe worker policy so background audit/optimize/map workers are opt-in and MOP-controlled.
- Add clear fallback rules when MCP is unavailable.

## Phase 4 - Agent Discipline

- Add auto-required-agent loading for each workflow phase.
- Add role-to-skill routing so a task can map to the right MOP agent and skill before implementation.
- Add provider adapter summaries for Claude, Codex, Gemini, and Antigravity.
- Add drift checks that warn when an agent ignores MOP auth, memory, routing, readiness, or autosycn.

## Phase 5 - Release Hardening

- Publish `mop-flow` to npm.
- Keep `burhan-mop` as a migration alias or publish a deprecation notice.
- Add release notes and migration guide from `burhan-mop` to `mop-flow`.
- Add CI checks for validate, doctor, smoke test, package dry-run, and manifest freshness.
