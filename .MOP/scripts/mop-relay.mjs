#!/usr/bin/env node
/**
 * mop-flow relay — keeps a live link OPEN to the public mop-agent (Brain).
 *
 * FLOW dials OUT (so it traverses NAT/firewall), authenticates with the bearer
 * link token from `.MOP/link.json`, pushes a project snapshot, and stays
 * connected with auto-reconnect. Ported from the pre-gateway @mop/flow-connector
 * (serve.ts + snapshot.ts). NO gateway, NO Supabase — direct to the agent.
 *
 *   node .MOP/scripts/mop-flow.mjs relay          # long-running publisher
 *   node .MOP/scripts/mop-flow.mjs relay --once    # push one snapshot and exit
 *
 * WebSocket: uses Node's built-in global WebSocket (Node 21+); falls back to the
 * `ws` package if present. mop-flow stays dependency-free for everyone else.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, renameSync, mkdirSync, chmodSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scriptCoreDir = resolve(here, '..');

/** Find the project's `.MOP/` (walk up from CWD; fall back to script-relative). */
export function resolveCoreDir() {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, '.MOP', 'STATE.json'))) return join(dir, '.MOP');
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return scriptCoreDir;
}

function readJson(path, fallback = {}) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

export function readLink(coreDir) {
  const p = join(coreDir, 'link.json');
  if (!existsSync(p)) throw new Error('not_linked: run `npx mop-flow link <url>` first');
  return readJson(p);
}

function writeLink(coreDir, link) {
  const p = join(coreDir, 'link.json');
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(link, null, 2)}\n`, 'utf8');
  renameSync(tmp, p);
  try { chmodSync(p, 0o600); } catch { /* gitignored regardless */ }
}

// ── snapshot builder (port of snapshot.ts) ──────────────────────────────────
// Keys whose NAME implies a secret — the whole field is dropped.
const SENSITIVE_KEY =
  /(token|secret|passphrase|password|passwordhash|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key|credential|bearer|cookie|webhook)/i;

// Values that LOOK like secrets even under an innocuous key (e.g. pasted into a
// memory note) — the matching substring is masked. Catches the common shapes.
const SECRET_VALUE = [
  /sk-[A-Za-z0-9_-]{16,}/g,                                   // OpenAI / Anthropic style
  /ghp_[A-Za-z0-9]{20,}/g,                                    // GitHub PAT
  /github_pat_[A-Za-z0-9_]{20,}/g,                            // GitHub fine-grained PAT
  /xox[baprs]-[A-Za-z0-9-]{10,}/g,                            // Slack
  /AKIA[0-9A-Z]{16}/g,                                        // AWS access key id
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, // PEM
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, // JWT
];
const REDACTED = '[redacted]';

function redactValueString(s) {
  let out = s;
  for (const re of SECRET_VALUE) out = out.replace(re, REDACTED);
  return out;
}

export function redactSensitive(value) {
  if (typeof value === 'string') return redactValueString(value);
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(k)) continue; // drop secret-named fields entirely
      out[k] = redactSensitive(v);
    }
    return out;
  }
  return value;
}

function readMemory(coreDir, limit = 200) {
  const dir = join(coreDir, 'memory');
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort().reverse();
  const entries = [];
  for (const f of files) {
    const raw = readFileSync(join(dir, f), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try { entries.push(JSON.parse(t)); } catch { /* skip */ }
    }
    if (entries.length >= limit) break;
  }
  return entries.slice(0, limit);
}

function listArtifacts(coreDir) {
  const dir = join(coreDir, 'artifacts');
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d, base) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      const s = statSync(full);
      if (s.isDirectory()) walk(full, join(base, name));
      else out.push({ path: join(base, name), updatedAt: s.mtimeMs });
    }
  };
  walk(dir, '');
  return out;
}

export function buildSnapshot(coreDir, projectId) {
  const state = readJson(join(coreDir, 'STATE.json'));
  return {
    t: 'snapshot.push',
    projectId,
    state: redactSensitive(state),
    // Memory summaries/bodies can contain pasted secrets — scan values too.
    memory: redactSensitive(readMemory(coreDir)),
    artifacts: listArtifacts(coreDir),
  };
}

// ── WebSocket resolution (global first, then `ws`) ──────────────────────────
async function getWebSocket() {
  if (typeof globalThis.WebSocket !== 'undefined') return globalThis.WebSocket;
  try { return (await import('ws')).default; } catch { return null; }
}

/**
 * Open a socket to the agent, authenticating with the link token.
 * The browser/undici global WebSocket can't set headers, so we always carry the
 * token in the query (`?token=`); the `ws` package additionally sends the header.
 */
function openSocket(WS, wsUrl, token) {
  const isWsPkg = WS !== globalThis.WebSocket;
  // The `ws` package can set headers → keep the token OUT of the URL (it would
  // otherwise leak into nginx/proxy access logs). Only the header-less global
  // WebSocket falls back to a `?token=` query param.
  if (isWsPkg) return new WS(wsUrl, { headers: { Authorization: `Bearer ${token}` } });
  const url = wsUrl + (wsUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
  return new WS(url);
}

/** Open the link, push one snapshot, resolve when sent (or reject on failure). */
export async function pushSnapshotOnce(coreDir, link, timeoutMs = 10_000) {
  const WS = await getWebSocket();
  if (!WS) throw new Error('no_websocket: upgrade to Node 21+ or run `npm i ws` in this project');
  const snap = buildSnapshot(coreDir, link.projectId);

  return new Promise((resolveP, rejectP) => {
    const ws = openSocket(WS, link.wsUrl, link.linkToken);
    const timer = setTimeout(() => { try { ws.close(); } catch {} rejectP(new Error('push_timeout')); }, timeoutMs);
    let sent = false;
    ws.addEventListener?.('open', onOpen);
    ws.on?.('open', onOpen);
    function onOpen() {
      if (sent) return; // ws pkg fires both addEventListener AND .on
      sent = true;
      ws.send(JSON.stringify(snap));
      link.lastSyncAt = new Date().toISOString();
      try { writeLink(coreDir, link); } catch {}
      clearTimeout(timer);
      setTimeout(() => { try { ws.close(); } catch {} resolveP(snap); }, 250);
    }
    const onErr = (e) => { clearTimeout(timer); rejectP(new Error(`ws_error: ${e?.message ?? e}`)); };
    ws.addEventListener?.('error', onErr);
    ws.on?.('error', onErr);
  });
}

/** Long-running publisher: connect, push, handle ping/req, reconnect with backoff. */
export async function startRelay(coreDir, args = {}) {
  const absoluteCoreDir = resolve(coreDir);
  let link;
  try { link = readLink(absoluteCoreDir); }
  catch (e) { throw e; }
  const label = args.label ? `[${args.label}] ` : '';
  const log = args.logger || ((s) => console.log(`[mop-flow] ${label}${s}`));

  if (args.once) {
    try {
      const snap = await pushSnapshotOnce(absoluteCoreDir, link);
      log(`snapshot pushed → ${link.wsUrl} (${snap.memory.length} memories, ${snap.artifacts.length} artifacts)`);
    } catch (e) {
      console.error(`✗ ${e.message}`);
      process.exitCode = 1;
    }
    return { stop() {}, projectId: link.projectId, coreDir: absoluteCoreDir };
  }

  const WS = await getWebSocket();
  if (!WS) throw new Error('no_websocket: upgrade to Node 21+ or run `npm i ws`');

  let backoff = 1_000;
  let stopped = false;
  let activeSocket = null;
  let reconnectTimer = null;
  const MAX_BACKOFF = 30_000;

  const connect = () => {
    if (stopped) return;
    const ws = openSocket(WS, link.wsUrl, link.linkToken);
    activeSocket = ws;
    const send = (o) => { try { ws.send(JSON.stringify(o)); } catch {} };

    let opened = false;
    const onOpen = () => {
      if (opened) return; // ws pkg fires both addEventListener AND .on
      opened = true;
      backoff = 1_000;
      const snap = buildSnapshot(absoluteCoreDir, link.projectId);
      send(snap);
      link.lastSyncAt = new Date().toISOString();
      try { writeLink(absoluteCoreDir, link); } catch {}
      log(`linked → ${link.wsUrl} · snapshot pushed (${snap.memory.length} memories)`);
    };
    const onMessage = (data) => {
      let msg; try { msg = JSON.parse(typeof data === 'string' ? data : data.toString()); } catch { return; }
      if (msg.t === 'ping') send({ t: 'pong' });
      else if (msg.t === 'hello') log('hello from AGENT');
      else if (msg.t === 'req') send({ t: 'res', id: msg.id, ok: false, error: 'tool_exec_not_enabled' });
    };
    const onClose = () => {
      if (stopped) return;
      log(`link closed · retry in ${backoff}ms`);
      reconnectTimer = setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, MAX_BACKOFF);
    };

    ws.addEventListener?.('open', onOpen); ws.on?.('open', onOpen);
    ws.addEventListener?.('message', (e) => onMessage(e.data ?? e)); ws.on?.('message', onMessage);
    ws.addEventListener?.('close', onClose); ws.on?.('close', onClose);
    ws.addEventListener?.('error', () => { try { ws.close(); } catch {} }); ws.on?.('error', () => { try { ws.close(); } catch {} });
  };

  log(`relay starting for ${link.projectId} → ${link.wsUrl}`);
  connect();
  return {
    projectId: link.projectId,
    coreDir: absoluteCoreDir,
    stop() {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { activeSocket?.close(); } catch {}
    }
  };
}

export async function runRelay(args = {}) {
  const coreDir = args['core-dir'] || args.project || resolveCoreDir();
  try {
    const handle = await startRelay(coreDir, args);
    if (handle && !args.once) {
      process.on('SIGINT', () => { handle.stop(); process.exit(0); });
    }
  } catch (e) {
    console.error(`âœ— ${e.message}`);
    process.exitCode = 1;
  }
}

// Direct invocation
if (resolve(process.argv[1] || '') === resolve(fileURLToPath(import.meta.url))) {
  const args = { _: [] };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--')) { const [k, v] = a.slice(2).split('=', 2); args[k] = v ?? true; }
    else args._.push(a);
  }
  runRelay(args);
}
