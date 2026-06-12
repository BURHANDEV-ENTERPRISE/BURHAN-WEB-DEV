---
name: autosycn
description: Use this after every meaningful MOP state or file change to save memory, commit as the real active user, push to the correct branch, and merge to main when allowed.
---

# Autosycn

Autosycn is MOP's identity-safe autosync skill. Use:

```bash
node .MOP/scripts/mop-autosycn.mjs init --actor <owner-codename> --url "<github-url>"
node .MOP/scripts/mop-autosycn.mjs preflight --actor <codename>
node .MOP/scripts/mop-autosycn.mjs run --actor <codename> --reason "<what changed>"
```

Before first use, configure the user's real Git identity:

```bash
node .MOP/scripts/mop-core.mjs member git-identity --actor <codename> --name "<display name>" --email "<github-verified-email>" --github-username "<github-login>"
```

The helper sets Git author and committer environment variables and local git
config from MOP state. It refuses to push without a configured email.
If a GitHub username is configured, it also refuses to push unless `gh api user`
matches that username. The branch name does not control GitHub attribution;
commit email and push credentials do.

In team mode, `main` is trunk and work happens in `dev/<codename>`. Every small
or large change is pushed to that branch first. BURHAN-MOP reviews the branch
and merges it back to `main` only when checks pass.
