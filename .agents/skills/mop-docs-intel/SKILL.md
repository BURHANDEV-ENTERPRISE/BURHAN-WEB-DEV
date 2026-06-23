---
name: mop-docs-intel
version: 1.0.0
description: >
  Context7-style documentation intelligence. Sebelum suggest mana-mana
  library, framework, atau API, auto-fetch versi terkini dan docs dari
  Context7 MCP / ctx7 CLI / npm registry / PyPI / web search. Elak
  hallucinated API, deprecated methods, dan versi tidak compatible.
  Auto-trigger pada: stack suggestion, import statement, package.json context.
sources:
  - upstash/context7 (MIT, 55k stars, 328k API calls/bulan)
  - npm registry API
  - PyPI JSON API
  - crates.io API
triggers:
  keywords:
    - use context7, check docs for, latest version of
    - is this still valid, compatible with, suggest stack
    - how to use [library], setup [framework], install [package]
    - does [method] exist, upgrade from [version] to
  auto_trigger:
    - agent suggest library version
    - agent write import statement
    - package.json dalam context
    - any npm/pip/cargo package mentioned
  file_patterns: [package.json, requirements.txt, Cargo.toml, go.mod, pyproject.toml]
providers: [claude, codex, gemini, antigravity]
mop_phases: [architecture, story, readiness, implementation]
---

# mop-docs-intel — Documentation Intelligence

## Setup

### Option A — Context7 MCP (recommended)
```bash
# Install dan setup
claude mcp add context7 -- npx -y @upstash/context7-mcp

# Get free API key (higher rate limit)
# → https://context7.com/dashboard
# → export CONTEXT7_API_KEY=ctx7_xxx
```

Tambah ke `.mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "type": "url",
      "url": "https://mcp.context7.com/mcp",
      "headers": { "Authorization": "Bearer ${CONTEXT7_API_KEY}" }
    }
  }
}
```

### Option B — ctx7 CLI sahaja (tanpa MCP)
```bash
npm install -g ctx7
ctx7 setup --mode cli
```

### Option C — Zero deps (pure Node, registry API sahaja)
Guna skrip npm-check.mjs di bawah — tanpa install apapun.

## Auto-trigger Rule (tambah ke semua provider files)

Tambah ke `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.agents/AGENTS.md`:
```markdown
## Docs Intelligence Rule
Sebelum suggest mana-mana library, framework, atau versi API:
1. Run mop-docs-intel check SEBELUM suggest
2. Guna versi terkini yang disahkan — BUKAN dari training data
3. Alert jika ada deprecated methods atau breaking changes
4. Jangan assume versi dari training data adalah current
```

## Commands

### Fetch docs
```bash
# Via ctx7 CLI
ctx7 docs <library>                           # latest docs
ctx7 docs <library> --version 14.2.0         # versi spesifik
ctx7 docs <library> --topic "authentication" # topik fokus
ctx7 docs <library> --topic "hooks"

# Via MCP tools (bila MCP configured)
# resolve-library-id → query-docs (2 tools tersedia)
```

### Check npm latest + peer deps + deprecated
```js
// npm-check.mjs (zero deps, pure Node)
import https from 'node:https';

async function checkNpm(pkg) {
  return new Promise((resolve) => {
    https.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          resolve({
            name: j.name,
            version: j.version,
            peerDeps: j.peerDependencies || {},
            deprecated: j.deprecated || false,
            engines: j.engines || {}
          });
        } catch { resolve({ name: pkg, version: 'unknown', error: true }); }
      });
    }).on('error', () => resolve({ name: pkg, version: 'unknown', error: true }));
  });
}

// Guna: node npm-check.mjs react next typescript tailwindcss
const libs = process.argv.slice(2);
const results = await Promise.all(libs.map(checkNpm));

console.log('\n=== Stack Verification ===');
results.forEach(r => {
  if (r.error)      console.log('❓ CHECK MANUALLY:', r.name);
  else if (r.deprecated) console.log('🚨 DEPRECATED:', r.name, '-', r.deprecated);
  else {
    const peers = Object.keys(r.peerDeps);
    console.log('✅', r.name, '@', r.version, peers.length ? `| peers: ${peers.join(', ')}` : '');
  }
});
```

### Check breaking changes (major version jump)
```js
// breaking-check.mjs
import https from 'node:https';

async function checkBreaking(pkg, fromVersion) {
  return new Promise((resolve) => {
    https.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const j = JSON.parse(data);
        const latest = j['dist-tags'].latest;
        const fromMajor = fromVersion ? parseInt(fromVersion) : null;
        const toMajor = parseInt(latest);
        resolve({
          pkg, latest,
          breaking: fromMajor && toMajor > fromMajor,
          changelogHint: `https://github.com/search?q=${pkg}+CHANGELOG`
        });
      });
    });
  });
}

// Guna: STACK='[["react","17"],["next","13"]]' node breaking-check.mjs
const stack = JSON.parse(process.env.STACK || '[]');
const results = await Promise.all(stack.map(([pkg, from]) => checkBreaking(pkg, from)));
results.forEach(r => {
  if (r.breaking) console.log(`🚨 BREAKING: ${r.pkg} → ${r.latest} | ${r.changelogHint}`);
  else            console.log(`✅ ${r.pkg} → ${r.latest}`);
});
```

### PyPI check (Python projects)
```js
// pypi-check.mjs
import https from 'node:https';

async function checkPypi(pkg) {
  return new Promise((resolve) => {
    https.get(`https://pypi.org/pypi/${pkg}/json`, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const j = JSON.parse(data);
        resolve({ name: j.info.name, version: j.info.version, deprecated: j.info.yanked || false });
      });
    }).on('error', () => resolve({ name: pkg, version: 'unknown', error: true }));
  });
}
```

## Auto-trigger Protocol

### Trigger 1 — Architect suggest stack
```
architect: "Guna React 18 dengan Express..."
  ↓
docs-intel: [auto-check]
  📚 react: 19.1.0 (latest) — React 19 ada breaking change pada useFormState
  📚 express: 5.1.0 (latest) — Express 5 kini stable, breaking dari v4
  
architect: "Guna React 19 dengan Express 5..."  ← betul dari mula
```

### Trigger 2 — Coder tulis import yang deprecated
```
coder: import ReactDOM from 'react-dom'; ReactDOM.render(...)
  ↓
docs-intel: ⚠ ReactDOM.render REMOVED dalam React 18+
  Betul: import { createRoot } from 'react-dom/client'
         createRoot(document.getElementById('root')).render(<App />)
```

### Trigger 3 — package.json dikesan dalam context
```
docs-intel: [auto-scan semua dependencies]
  → Flag deprecated, major version gaps, peer dep conflicts
  → Suggest upgrade path
```

## Output Format

### Single library check
```markdown
📚 **docs-intel: [Library]**
- **Versi terkini:** X.Y.Z
- **Sumber:** Context7 / npm / PyPI / web search
- **Status:** ✅ Aktif | ⚠ Maintenance | 🚨 Deprecated

**Relevan dengan task:**
[snippet docs, ≤500 token]

**Breaking changes dari versi lama:**
[kalau applicable]
```

### Stack matrix
```markdown
🔍 **Stack Verification**

| Library | Dicadang | Terkini | Status |
|---|---|---|---|
| next | 14.x | 15.3.2 | ⚠ Bukan latest |
| react | 18.x | 19.1.0 | ⚠ Major update |
| prisma | ^5 | 6.1.0 | ✅ OK |
| tailwindcss | 3.x | 4.1.0 | 🚨 Breaking v4 |

**Isu:**
1. Next 15: `headers()` kini async
2. Tailwind v4: config CSS-based (bukan tailwind.config.js)
3. React 19: `useFormState` → `useActionState`

**Stack yang disyorkan:**
{ "next":"^15.3.2", "react":"^19.1.0", "tailwindcss":"^4.1.0" }
```

## Cache (elak repeat calls)

```js
// cache.mjs — simpan dalam .MOP/cache/docs-intel/
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CACHE_DIR = '.MOP/cache/docs-intel';
const TTL = 24 * 60 * 60 * 1000; // 24 jam

export function getCached(lib, topic = '') {
  const key = createHash('md5').update(lib + topic).digest('hex');
  const file = join(CACHE_DIR, key + '.json');
  if (!existsSync(file)) return null;
  const c = JSON.parse(readFileSync(file, 'utf8'));
  return Date.now() - c.ts < TTL ? c.data : null;
}

export function setCache(lib, topic = '', data) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const key = createHash('md5').update(lib + topic).digest('hex');
  writeFileSync(join(CACHE_DIR, key + '.json'), JSON.stringify({ ts: Date.now(), data }));
}
```

## Fallback Chain

```
Context7 cover library ini?
  ├─ Ya  → ctx7 docs (fast, versioned)
  └─ Tidak
       ├─ npm?   → registry.npmjs.org/[pkg]/latest
       ├─ PyPI?  → pypi.org/pypi/[pkg]/json
       ├─ crates? → crates.io/api/v1/crates/[pkg]
       └─ Semua gagal → web search "[library] docs [year]"
                         + flag: "Verify manual sebelum implement"
```

## MOP Ledger
```bash
node .MOP/scripts/mop-core.mjs memory add \
  --actor "$MOP_ACTOR" --kind docs-intel \
  --summary "Verified: $LIBS | issues: $ISSUES | stack: $SUMMARY"
```

## Precheck config dalam STATE.json

```json
{
  "role": "architect",
  "precheck": [
    { "skill": "mop-docs-intel", "on": "stack_suggestion", "action": "verify_compatibility_matrix" }
  ]
},
{
  "role": "coder",
  "precheck": [
    { "skill": "mop-docs-intel", "on": "import_statement",     "action": "verify_api_exists" },
    { "skill": "mop-docs-intel", "on": "package_json_context", "action": "full_dependency_audit" }
  ]
}
```
```
