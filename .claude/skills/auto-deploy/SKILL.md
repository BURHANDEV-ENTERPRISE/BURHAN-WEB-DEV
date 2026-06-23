---
name: auto-deploy
description: Use when the user asks to prepare, activate, or discuss deployment for GitHub, Docker, or Vercel. Must ask for confirmation before making deployment files or running deploy commands.
---

# Auto Deploy

Auto-deploy supports GitHub, Docker, and Vercel, but it is opt-in.

## Confirmation Gate

Before creating deployment files, linking services, or running deployment
commands, ask:

```text
Nak aktifkan auto deploy sekarang? Pilih provider: GitHub, Docker, Vercel.
```

If the user says `nanti`, `tidak`, `tak`, `x`, `no`, `later`, or equivalent,
reply exactly:

```text
Okey, nanti kalau nak deploy beri tahu saya. Saya setup auto deploy.
```

Then record the defer action:

```bash
node .MOP/scripts/mop-auto-deploy.mjs defer --actor <codename> --answer nanti
```

## Activation

Only after explicit confirmation:

```bash
node .MOP/scripts/mop-auto-deploy.mjs enable --actor <codename> --provider github|docker|vercel|all --confirm yes
```

## Provider Intent

- `github`: GitHub Pages or GitHub Actions deployment.
- `docker`: Dockerfile, compose file, and container build/run flow.
- `vercel`: Vercel project link and framework-aware deploy settings.

Do not guess provider details. Inspect the project framework first, then create
the smallest provider-specific config needed.

