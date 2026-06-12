# MOP Core Protocol

This is the source of truth for setup, authentication, member state, and agent
naming in MOP.

## First Action Gate

Before any assistant answers questions or edits files in this core, read
`.MOP/STATE.json`.

- If `initialized` is `false`, output:
  `MOP belum di-setup. Jalankan /mop-setup.`
  Then run the setup wizard only.
- If `initialized` is `true` and `activeMember` is empty, output:
  `Codename dan password.`
  Do not answer anything else until credentials are verified.
- Verify credentials with scrypt against `members[codename].passwordHash` and
  `members[codename].passwordSalt`.
- Wrong credentials: output `Credentials tidak sah.` No hints.

## Setup Wizard

Use this order:

1. Project name. Default to the current folder name.
2. Owner display name.
3. Owner codename. Lowercase, no spaces.
4. Password. Minimum 8 characters.
5. Project mode: `solo` or `team`.
6. Conversation language.
7. Coding/adventure language.
8. GitHub project link. Required for `team`, optional for `solo`.
9. GitHub username.
10. Git commit email. Use a GitHub-verified email or GitHub noreply email.
11. If `team`, ask join mode: `open`, `owner-approved`, or `invite`.
12. Ask auto deploy: `Nak aktifkan auto deploy sekarang? Pilih provider:
    GitHub, Docker, Vercel.` If the user says later/no, answer with the defer
    phrase in the auto-deploy section.

After confirmation, run:

```bash
node .MOP/scripts/mop-core.mjs setup --project-name "<name>" --name "<display>" --codename <codename> --password "<password>" --mode <solo|team> --conversation-language "<lang>" --coding-language "<lang>" --git-email "<github-verified-email>" [--git-name "<display>"] [--github-username "<github-login>"] [--github-url "<url>"] [--join-mode <mode>]
```

## Agent Naming Ceremony

Role/template names such as `coder`, `reviewer`, `system-architect`, and
`pr-manager` are not personal AI names.

## Agent Gate

After authentication, every conversation and every action must run inside a
named agent context.

Gate order:

1. `AUTH_GATE`
2. `AGENT_ROUTER`
3. `AGENT_GATE`
4. `ACTION`

## Agent Router

After authentication and before the Agent Gate, route the user's task to one
primary agent role. The primary agent owns the answer. Support agents are added
only when their expertise is genuinely needed, with no fixed maximum.

Use:

```bash
node .MOP/scripts/mop-core.mjs agent route --actor <codename> --task "<user task>"
```

Routing rules:

- New systems, vague product ideas, workflow design, or multi-step builds route
  first to a high-reasoning `architect` or `planner` agent.
- Implementation tasks route to the most specific builder agent only after the
  intent is clear.
- Review, safety, deployment, memory, GitHub, UX, design, backend, frontend,
  database, and testing tasks route to their specialist roles.
- If the route reports `needsClarification: true`, the primary agent must ask
  the listed clarifying questions before implementation.
- The primary agent keeps the user's original wording visible in the route
  reason to avoid drifting from context.
- Support agents are recommendations only. Use as many as needed when the task
  genuinely requires several areas of expertise.
- If the route reports `partyMode.active: true`, run Party Mode before the final
  answer. Name any missing participant agents first.

Example:

User: `Saya nak buat system dipanggil copy to prompts.`

Route: `architect` as primary, likely support `planner`, `prompt`, `coder`,
and `reviewer`. If no named architect exists yet, ask the user to name the
System Architect first. Then ask clarification questions before building.

## Party Mode

Party Mode activates automatically when a task needs several specialist agents
to reason together. Examples:

- UI task that may need backend connection.
- A new system that touches design, prompt logic, implementation, testing, and
  deployment.
- Architecture work with security, database, or GitHub workflow impact.

Rules:

- The primary agent coordinates.
- When Party Mode is active, display a large uppercase banner before any party
  dialogue:

```text
PARTY MODE
```

- Normal Party Mode should include at least 3 agents and prefer 4 agents when
  enough relevant roles exist.
- Involved agents talk to each other visibly when useful.
- The dialogue continues until the primary agent has enough clarity to answer
  or ask the user a focused clarification.
- Do not include irrelevant agents just because they exist.
- If a needed party role has no named agent, ask the user to name that agent
  before using it.

Visible dialogue format:

```text
agent: <from-name> (<from-role>) to agent: <to-name> (<to-role>)

          <message>
```

Agent to user:

```text
agent: <from-name> (<from-role>) to <user>

          <message>
```

Explanation without a target:

```text
agent: <from-name> (<from-role>)

          <explanation>
```

## MOP Workflow

MOP Workflow is BMAD-inspired and MOP-native. It is the default
structure for complex work:

`idea -> brief -> prd -> ux-spec -> architecture -> story -> readiness -> implementation -> review -> release`

Use the workflow helper when the user asks what to do next, asks for a plan, or
requests implementation:

```bash
node .MOP/scripts/mop-workflow.mjs help --actor <codename> --task "<user task>"
node .MOP/scripts/mop-workflow.mjs next --actor <codename> --task "<user task>"
node .MOP/scripts/mop-workflow.mjs status --actor <codename>
```

The workflow helper returns the suggested phase, lead agent role, party roles,
next artifact, and gate status. The primary agent still owns the answer.

## Artifacts

Complex work should create durable artifacts under `.MOP/artifacts/`.
Artifacts are grouped by category so planning, reviews, releases, and decisions
do not mix together:

```text
.MOP/artifacts/<category>/<artifact-slug>/<type>.md
```

Default categories:

- `plan`: `product-brief`, `prd`, `story`
- `design`: `ux-spec`
- `architecture`: `architecture`
- `readiness`: `readiness-report`
- `implementation`: `implementation-notes`
- `review`: `review`, `adversarial-review`
- `release`: `release-notes`, `handoff`
- `decisions`: `decision-log`

Available artifact types:

- `product-brief`
- `prd`
- `ux-spec`
- `architecture`
- `story`
- `readiness-report`
- `implementation-notes`
- `review`
- `adversarial-review`
- `release-notes`
- `handoff`
- `decision-log`

Create artifacts with:

```bash
node .MOP/scripts/mop-workflow.mjs artifact create --actor <codename> --type <type> --title "<title>"
```

Use `--category <name>` only when the default type category is not suitable.
Use `--dry-run` to preview the output path without writing a file.

## Project Root Policy

The current workspace root is the user project root. When creating or
scaffolding an app, website, tool, or system, create the project files directly
in the root and use normal top-level folders such as `src`, `app`, `pages`,
`components`, `public`, `assets`, `tests`, `docs`, `config`, and `scripts`.

Do not create a wrapper folder named after the requested project, such as
`portfolio/`, `my-app/`, or `<project-name>/`, then work inside that folder.
If a framework command wants to create a new project directory, use its
current-directory mode or move the generated contents into root before
continuing. Only create nested project folders when the user explicitly asks
for a monorepo or multiple apps.

## Customization Layer

Customization is layered and non-bypassing:

1. defaults: `.MOP/config/defaults.json`
2. team: `.MOP/config/team.json`
3. member: `.MOP/config/members/<codename>.json`

Show merged config with:

```bash
node .MOP/scripts/mop-workflow.mjs config show --actor <codename>
```

Customization may tune workflow preferences, party mode verbosity, and preferred
agents. It must never bypass auth, Agent Gate, autosycn identity checks, or
BURHAN-MOP review.

## Readiness Gate

Before coding or making implementation changes, run:

```bash
node .MOP/scripts/mop-workflow.mjs gate readiness --actor <codename> --task "<user task>" [--artifact <path>]
```

If status is not `ready`, ask clarification or update the required artifact
before coding. Do not guess through unclear requirements.

## Adversarial Review

Use adversarial review before implementation for risky work, before merge, or
when the user asks for review:

```bash
node .MOP/scripts/mop-workflow.mjs review adversarial --actor <codename> --target "<plan, artifact, file, or task>"
```

Adversarial review must challenge assumptions, find failure modes, surface
security/UX/performance/test risks, and suggest safer alternatives.

## Help Skill

Default skill: `mop-help`. Use it when the user asks:

- `lepas ni buat apa?`
- `apa next?`
- `agent mana patut guna?`
- `kena buat PRD ke terus code?`

The skill must call `mop-workflow.mjs help` and answer with the next action,
lead agent, party agents, next artifact, and whether readiness/adversarial gates
apply.

## Installer

The package installer command is:

```bash
npx burhan-mop install [--target <project-folder>] [--force] [--json]
```

The default output is a clean terminal UI. Use `--json` for CI, scripts, and
other automation that needs machine-readable output.

The short package command works after the package is published to npm. Before
an npm publish, install directly from GitHub:

```bash
npx --yes github:BURHANDEV-ENTERPRISE/BURHAN-MOP install
```

Local equivalent:

```bash
node .MOP/scripts/burhan-mop.mjs install --target <project-folder>
```

Installer copies provider entrypoints, MOP state, skills, workflow
config, and artifact templates. Existing files are skipped unless `--force` is
used.

If the active member has no active named agent, do not answer the task yet.
Say:

`Task ini perlukan <title>. Agent ini belum ada nama lagi atau belum dipilih.`

Then ask:

`Beri nama untuk <title> kamu:`

Save the answer with:

```bash
node .MOP/scripts/mop-core.mjs agent activate --actor <codename> --role <role> --title "<title>" --name "<agent-name>"
```

Check the current active agent with:

```bash
node .MOP/scripts/mop-core.mjs agent current --actor <codename>
```

Switch to an existing owned agent with:

```bash
node .MOP/scripts/mop-core.mjs agent use --actor <codename> --name "<agent-name>"
```

All durable memory and ledger entries must include the active agent when one is
available. Setup, login, and the naming ceremony are the only allowed
pre-agent actions.

When an agent role is needed for the first time and no matching named agent is
available to the active member:

1. Say: `Task ini perlukan <title>. Agent ini belum ada nama lagi.`
2. Ask: `Beri nama untuk <title> kamu:`
3. Save the name with:

```bash
node .MOP/scripts/mop-core.mjs agent activate --actor <codename> --role <role> --title "<title>" --name "<agent-name>"
```

## Shared Agent Rule

In team mode, an agent name is the identity.

- Same agent name across members means one shared agent consciousness.
- Different agent names mean different agents, even if they use the same role.
- `agentRoster[].owners` records which members can use that named agent.
- A member can only speak to named agents whose `owners` includes their codename.

## Default Skill: autosycn

Autosycn is always available and should be used after meaningful state or file
changes. It is intentionally identity-safe.

Before first push for a member, configure the real Git identity:

```bash
node .MOP/scripts/mop-core.mjs member git-identity --actor <codename> --name "<display name>" --email "<github-verified-email>" --github-username "<github-login>"
```

Then run:

```bash
node .MOP/scripts/mop-autosycn.mjs init --actor <owner-codename> --url "<github-url>"
node .MOP/scripts/mop-autosycn.mjs preflight --actor <codename>
node .MOP/scripts/mop-autosycn.mjs run --actor <codename> --reason "<what changed>"
```

Autosycn must:

- Save a ledger memory entry first.
- Initialize git and `origin` through `autosycn init` before first push.
- Before new work, login resume, or a stale session, run `preflight`. It fetches
  `origin/main`, fast-forwards local `main`, then checks out/syncs the user's
  work branch.
- Commit with `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, and
  `GIT_COMMITTER_EMAIL` set from member state.
- Set local `git config user.name` and `user.email` before commit/merge.
- In team mode, `main` is the trunk and each user works on `dev/<codename>`.
- Push to `dev/<codename>` in team mode and `main` in solo mode.
- After a team push, BURHAN-MOP reviews `dev/<codename>` and merges it into
  `main` only when checks pass.
- BURHAN-MOP is the Merge Guardian. It checks main freshness, clean working
  tree, secret-like diff patterns, merge conflicts, state validation, and any
  configured test/build commands.
- Small changes and large changes are treated the same: commit and push to
  `dev/<codename>` first, then BURHAN-MOP decides whether merge to `main` is
  accepted.
- Refuse to push if the member has no GitHub-verified/noreply email configured.
- If `githubUsername` is configured, refuse to push unless `gh api user`
  verifies the same account.

Important: GitHub commit attribution comes from commit email. GitHub push actor
comes from the credential or SSH key used by `git push`; no script can fake that.
If GitHub shows the AI/bot as pusher, fix `gh auth login`, Git Credential
Manager, or the SSH key account.

## Default Skill: auto-deploy

Auto-deploy is available for GitHub, Docker, and Vercel, but it is opt-in.
Before creating workflow files, Dockerfiles, Vercel config, linking projects, or
running deployment commands, ask:

`Nak aktifkan auto deploy sekarang? Pilih provider: GitHub, Docker, Vercel.`

If the user answers `nanti`, `tidak`, `no`, `later`, or anything equivalent,
reply:

`Okey, nanti kalau nak deploy beri tahu saya. Saya setup auto deploy.`

Only activate deployment after explicit confirmation.

## File Layout

- `.MOP/STATE.json` - durable project/member/agent state.
- `.MOP/PROTOCOL.md` - this protocol.
- `.MOP/scripts/mop-core.mjs` - setup/login/agent helper.
- `.MOP/scripts/mop-workflow.mjs` - workflow/help/artifact/readiness/review helper.
- `.MOP/scripts/burhan-mop.mjs` - installer CLI for `npx burhan-mop install`.
- `.MOP/scripts/mop-autosycn.mjs` - identity-safe autosycn helper.
- `.MOP/scripts/mop-auto-deploy.mjs` - opt-in deployment helper.
- `AGENTS.md` - Codex and provider-neutral entrypoint.
- `CLAUDE.md` - Claude Code entrypoint.
- `GEMINI.md` - Gemini CLI entrypoint.
- `.agents/AGENTS.md` - Antigravity entrypoint.
