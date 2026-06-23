---
name: mop-browseract
version: 1.0.0
description: >
  Cross-browser automation skill untuk MOP agents. Detect default browser
  pengguna (Windows/macOS/Linux), pilih engine terbaik yang tersedia
  (BrowserAct stealth → Playwright → agent-browser), handle login flows,
  CAPTCHA solving, human-in-loop handoff, dan structured data extraction.
  Log setiap session ke MOP ledger. Pause wajib sebelum destructive actions.
sources:
  - browser-act/skills (BrowserAct CLI, MIT, Singapura 2026)
  - ruflo:ruflo-browser (session concept)
  - mop:browser (existing agent)
triggers:
  keywords:
    - browse, open browser, click, fill form, login to
    - scrape, extract from website, solve captcha
    - bypass bot detection, automate website, screenshot
    - navigate to, clone website, human handoff
providers: [claude, codex, gemini, antigravity]
mop_phases: [implementation, review, ux-spec]
---

# mop-browseract — Cross-Browser Automation

## Setup (jalankan sekali)

### Step 1 — Detect default browser

```js
// detect-browser.mjs
import { execSync } from 'node:child_process';
import os from 'node:os';

const platform = os.platform();
let defaultBrowser = 'chrome'; // fallback

if (platform === 'win32') {
  const reg = execSync(
    'reg query HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice /v ProgId',
    { encoding: 'utf8', stdio: ['pipe','pipe','ignore'] }
  ).catch(() => '');
  if (reg.includes('Chrome'))  defaultBrowser = 'chrome';
  else if (reg.includes('Firefox')) defaultBrowser = 'firefox';
  else if (reg.includes('Edge'))    defaultBrowser = 'edge';
  else if (reg.includes('Safari'))  defaultBrowser = 'safari';

} else if (platform === 'darwin') {
  const result = execSync(
    "defaults read ~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist 2>/dev/null || echo 'safari'",
    { encoding: 'utf8', shell: true }
  ).toLowerCase();
  if (result.includes('google.chrome')) defaultBrowser = 'chrome';
  else if (result.includes('firefox'))  defaultBrowser = 'firefox';
  else if (result.includes('edge'))     defaultBrowser = 'edge';
  else defaultBrowser = 'safari';

} else {
  // Linux
  const result = execSync('xdg-settings get default-web-browser 2>/dev/null || echo firefox',
    { encoding: 'utf8' }).toLowerCase();
  if (result.includes('chrome'))  defaultBrowser = 'chrome';
  else if (result.includes('firefox')) defaultBrowser = 'firefox';
  else if (result.includes('edge'))    defaultBrowser = 'edge';
}

console.log(JSON.stringify({ platform, defaultBrowser }));
```

### Step 2 — Detect & install engine

```bash
# Semak engine tersedia
node -e "
const { execSync } = require('child_process');
const check = cmd => { try { execSync(cmd, {stdio:'ignore'}); return true; } catch { return false; } };
const engines = {
  browseract:  check('npx browser-act --version'),
  playwright:  check('npx playwright --version'),
  agentbrowser: check('npx agent-browser --version')
};
console.log(JSON.stringify(engines));
"

# Install browser-act kalau tiada
npx skills add https://github.com/browser-act/skills --skill browser-act \
  || npm install -g browser-act \
  || echo "Gunakan Playwright sebagai fallback"
```

## Engine Priority

| Priority | Engine | Bila guna |
|---|---|---|
| 1 | **browser-act** | Stealth, CAPTCHA, login vault, human-handoff, multi-browser |
| 2 | **Playwright** | Cross-browser, headless/headed, tanpa stealth |
| 3 | **agent-browser** | Simple task, context-efficient (element refs @e1 @e2) |

## Commands

### Navigation & Snapshot
```bash
# browser-act
npx browser-act open <url> [--browser chrome|firefox|safari|edge] [--stealth]
npx browser-act snapshot -i          # interactive elements, indexed
npx browser-act screenshot [--full-page] [--output file.png]
npx browser-act back | forward | reload

# Playwright fallback
npx playwright open <url> --browser chromium|firefox|webkit
```

### Interaksi
```bash
# browser-act — indexed (tiada DOM parse)
npx browser-act click 3              # klik element index 3
npx browser-act input 2 "teks"       # taip ke index 2
npx browser-act select 4 "Option A"
npx browser-act submit

# agent-browser fallback (element refs)
agent-browser click @e3
agent-browser fill @e2 "teks"
```

### Anti-bot & CAPTCHA
```bash
npx browser-act open <url> --stealth              # fingerprint spoof + TLS rotation
npx browser-act solve-captcha                     # hCaptcha, reCAPTCHA, Turnstile
npx browser-act stealth-extract <url> --format json
```

### Login & Session Vault
```bash
npx browser-act login <url> --save-as <profile>  # login sekali, simpan cookies
npx browser-act open <url> --profile <profile>   # reuse session
npx browser-act remote-assist                     # generate URL untuk user ambil alih (2FA dll)
```

### Data Extraction
```bash
npx browser-act extract --fields "title,price,url" --output data.json
npx browser-act extract --template ecommerce-product
npx browser-act stealth-extract <url> --format json > output.json
```

### Multi-browser / Multi-session
```bash
npx browser-act open <url1> --browser chrome   --session kerja
npx browser-act open <url2> --browser firefox  --session peribadi
npx browser-act open <url3> --browser safari   --session test
npx browser-act open <url>  --privacy          # fingerprint baru, zero residue
```

## Protokol MOP Wajib

### Log ke ledger sebelum session
```bash
node .MOP/scripts/mop-core.mjs memory add \
  --actor "$MOP_ACTOR" --kind browser-session \
  --summary "Browser task: $TASK | engine: $ENGINE | url: $URL"
```

### PAUSE wajib sebelum tindakan berikut
```
⏸ PAUSE — Kebenaran Diperlukan
Task    : [terangkan]
Engine  : [browser-act / Playwright / agent-browser]
Target  : [URL]
Tindakan: [login / isi borang / klik / download / star/like]

Teruskan? (ya / tidak)
```

Tindakan yang WAJIB tunggu kebenaran eksplisit:
- Login dengan credential pengguna
- Isi & hantar borang (checkout, daftar, subscribe)
- Star / like / follow / comment bagi pihak pengguna
- Download fail
- Klik yang tidak boleh undo (delete, purchase, confirm)

### Log hasil
```bash
node .MOP/scripts/mop-core.mjs memory add \
  --actor "$MOP_ACTOR" --kind browser-result \
  --summary "Selesai: $OUTCOME | extracted: $COUNT items"
```

## Fallback Chain
```
browser-act tersedia?
  ├─ Ya  → browser-act (stealth + CAPTCHA + session vault)
  └─ Tidak → Playwright tersedia?
                ├─ Ya  → Playwright (cross-browser, tanpa stealth)
                └─ Tidak → agent-browser (basic, element refs)
                              └─ Tiada semua → install browser-act dahulu
```
```
