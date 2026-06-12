---
name: auto-deploy
description: Use when the user asks to prepare, activate, or discuss deployment for GitHub, Docker, or Vercel. Must ask for confirmation before making deployment files or running deploy commands.
---

# Auto Deploy

Ask before activation:

```text
Nak aktifkan auto deploy sekarang? Pilih provider: GitHub, Docker, Vercel.
```

If the user says later/no:

```text
Okey, nanti kalau nak deploy beri tahu saya. Saya setup auto deploy.
```

Record defer:

```bash
node .MOP/scripts/mop-auto-deploy.mjs defer --actor <codename> --answer nanti
```

Activate only with confirmation:

```bash
node .MOP/scripts/mop-auto-deploy.mjs enable --actor <codename> --provider github|docker|vercel|all --confirm yes
```

