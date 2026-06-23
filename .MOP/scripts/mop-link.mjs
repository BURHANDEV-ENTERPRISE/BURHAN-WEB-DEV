#!/usr/bin/env node
/**
 * mop-flow → mop-agent DIRECT link handshake.
 *
 * The user pastes the command shown by the Brain's "Add Project":
 *
 *   npx mop-flow link https://<agent-domain>/v1/api/link/<key>
 *   npx mop-flow link http://<ip>:<port>/v1/api/link/<key>
 *
 * We POST the project manifest to that URL, receive the bearer link token + the
 * WebSocket URL, and store them in .MOP/link.json (gitignored, chmod 600). Then
 * we push one snapshot so the project shows up in the Brain immediately. Keep it
 * live afterwards with `npx mop-flow service install --start`. NO gateway, NO Supabase.
 *
 *   node .MOP/scripts/mop-flow.mjs link <url> [--name N] [--no-push] [--json]
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, chmodSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';
import { resolveCoreDir, pushSnapshotOnce } from './mop-relay.mjs';
import { registerProject } from './mop-service.mjs';

const LINK_SCHEMA = '1.0';
const DEFAULT_CAPABILITIES = {
  readMemory: true,
  writeMemory: true,
  readArtifacts: true,
  writeArtifacts: true,
  runWorkflow: true,
  runShell: false,
  editCode: false,
};

const coreDir = resolveCoreDir();
const statePath = join(coreDir, 'STATE.json');
const linkPath = join(coreDir, 'link.json');

function readJson(path, fallback = {}) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

function resolveMopFlowVersion(state) {
  if (state.mopFlow?.version) return String(state.mopFlow.version);
  try {
    return readFileSync(join(coreDir, 'VERSION.txt'), 'utf8').trim();
  } catch {
    return '1.4.4';
  }
}

function writeLinkFile(link) {
  mkdirSync(dirname(linkPath), { recursive: true });
  const tmp = `${linkPath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(link, null, 2)}\n`, 'utf8');
  renameSync(tmp, linkPath);
  try { chmodSync(linkPath, 0o600); } catch { /* gitignored regardless */ }
}

/** Parse `https://host/v1/api/link/<key>` → { base, key }. */
function parseLinkUrl(input) {
  let u;
  try { u = new URL(input); } catch { throw new Error(`bad_url: ${input}`); }
  const parts = u.pathname.split('/').filter(Boolean);
  const key = parts[parts.length - 1];
  if (!key || !u.pathname.includes('/link/')) {
    throw new Error('bad_url: expected https://<agent>/v1/api/link/<key>');
  }
  return { base: `${u.protocol}//${u.host}`, key, url: u.toString() };
}

/** Stable project id: reuse the one in link.json, else mint prj_xxxx. */
function resolveProjectId() {
  const prev = readJson(linkPath, null);
  if (prev && typeof prev.projectId === 'string' && prev.projectId) return prev.projectId;
  return `prj_${randomBytes(4).toString('hex')}`;
}

export async function runLink(args = {}) {
  const asJson = args.json === true || args.format === 'json';
  const input = String(args.url || args._?.[0] || '').trim();

  try {
    if (!input) throw new Error('usage: npx mop-flow link <https://agent/v1/api/link/key> [--name N] [--no-push]');
    const { base, key, url } = parseLinkUrl(input);

    const state = readJson(statePath);
    const projectId = resolveProjectId();
    const manifest = {
      projectId,
      name: String(args.name || state.projectName || 'project'),
      mopFlowVersion: resolveMopFlowVersion(state),
      platform: platform(),
      capabilities: DEFAULT_CAPABILITIES,
    };

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ manifest }),
      });
    } catch (err) {
      throw new Error(`agent_unreachable: ${base} (${err.message})`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`link_failed:${res.status}:${text}`);
    }
    const out = await res.json(); // { projectId, linkToken, wsUrl }

    const link = {
      schemaVersion: LINK_SCHEMA,
      agentUrl: base,
      wsUrl: out.wsUrl,
      projectId: out.projectId || projectId,
      linkToken: out.linkToken,
      capabilities: manifest.capabilities,
      linkedAt: new Date().toISOString(),
      lastSyncAt: null,
      autoSync: true,
    };
    writeLinkFile(link);
    let registered = false;
    try { registerProject(coreDir, link, { name: manifest.name }); registered = true; } catch { /* service registry is best-effort */ }

    // Push one snapshot so the project appears in the Brain right away.
    let pushed = false;
    if (args.push !== false && args['no-push'] !== true) {
      try { await pushSnapshotOnce(coreDir, link); pushed = true; } catch { /* best-effort */ }
    }

    return report(link, asJson, 'linked', pushed, registered);
  } catch (err) {
    if (asJson) console.log(JSON.stringify({ ok: false, error: err.message }, null, 2));
    else console.error(`✗ ${err.message}`);
    process.exitCode = 1;
  }
}

function report(link, asJson, verb, pushed, registered = false) {
  if (asJson) {
    const { linkToken, ...safe } = link;
    console.log(JSON.stringify({ ok: true, verb, pushed, registered, link: { ...safe, hasToken: !!linkToken } }, null, 2));
    return;
  }
  console.log(`🔗 ${verb}: ${link.projectId} → ${link.agentUrl}`);
  console.log(`   ws: ${link.wsUrl}`);
  console.log(`   snapshot: ${pushed ? 'pushed ✓ (project now visible in the Brain)' : 'not pushed — run `npx mop-flow relay --once`'}`);
  console.log(`   saved: .MOP/link.json (gitignored)`);
  console.log(`   background: ${registered ? 'registered for MOP Flow service' : 'not registered'}`);
  console.log(`   autostart: npx mop-flow service install --start  (run once per PC)`);
}

// Direct invocation
if (resolve(process.argv[1] || '') === resolve(fileURLToPath(import.meta.url))) {
  const args = { _: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) { args._.push(item); continue; }
    const [k, inline] = item.slice(2).split('=', 2);
    if (inline !== undefined) args[k] = inline;
    else if (!argv[i + 1] || argv[i + 1].startsWith('--')) args[k] = true;
    else args[k] = argv[(i += 1)];
  }
  runLink(args);
}
