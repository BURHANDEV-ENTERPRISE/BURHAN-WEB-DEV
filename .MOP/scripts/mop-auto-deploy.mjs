#!/usr/bin/env node
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const coreDir = resolve(here, '..');
const statePath = join(coreDir, 'STATE.json');

const PROVIDERS = new Set(['github', 'docker', 'vercel']);
const LATER_WORDS = new Set(['nanti', 'tidak', 'tak', 'x', 'no', 'later', 'skip']);

function now() {
  return new Date().toISOString();
}

function readState() {
  return JSON.parse(readFileSync(statePath, 'utf8'));
}

function writeState(state) {
  const tmp = `${statePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tmp, statePath);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      out._.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function requireArg(args, key) {
  const value = args[key];
  if (!value || value === true) throw new Error(`Missing --${key}`);
  return String(value);
}

function appendLedger(state, actor, kind, summary) {
  state.ledger ||= [];
  state.ledger.push({ at: now(), actor, kind, summary });
}

function ensureDeployment(state) {
  state.deployment ||= {
    enabled: false,
    requireConfirmation: true,
    providers: {}
  };
  for (const provider of PROVIDERS) {
    state.deployment.providers[provider] ||= { enabled: false };
  }
}

function providerList(value) {
  const raw = String(value || '').toLowerCase();
  if (raw === 'all') return [...PROVIDERS];
  const providers = raw.split(',').map((item) => item.trim()).filter(Boolean);
  for (const provider of providers) {
    if (!PROVIDERS.has(provider)) throw new Error(`Unknown provider: ${provider}`);
  }
  if (!providers.length) throw new Error('Missing --provider github|docker|vercel|all');
  return providers;
}

function status() {
  const state = readState();
  ensureDeployment(state);
  console.log(JSON.stringify(state.deployment, null, 2));
}

function ask() {
  console.log('Nak aktifkan auto deploy sekarang? Pilih provider: GitHub, Docker, Vercel.');
  console.log('Kalau belum mahu, jawab nanti/tidak/no/later.');
}

function defer(args) {
  const state = readState();
  const actor = String(args.actor || state.activeMember || 'unknown');
  const answer = String(args.answer || 'nanti').toLowerCase();
  if (!LATER_WORDS.has(answer)) {
    throw new Error('Use enable --confirm yes to activate deploy, or defer with answer nanti/tidak/no/later.');
  }
  appendLedger(state, actor, 'auto-deploy-deferred', 'User deferred auto deploy setup.');
  writeState(state);
  console.log('Okey, nanti kalau nak deploy beri tahu saya. Saya setup auto deploy.');
}

function enable(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = requireArg(args, 'actor');
  if (!state.members?.[actor]) throw new Error(`Unknown actor: ${actor}`);
  const confirm = String(args.confirm || '').toLowerCase();
  if (!['yes', 'y', 'true', 'aktif', 'activate'].includes(confirm)) {
    console.log('Okey, nanti kalau nak deploy beri tahu saya. Saya setup auto deploy.');
    appendLedger(state, actor, 'auto-deploy-deferred', 'Deploy activation was not confirmed.');
    writeState(state);
    return;
  }

  ensureDeployment(state);
  const providers = providerList(args.provider);
  state.deployment.enabled = true;
  state.deployment.updatedAt = now();
  state.deployment.updatedBy = actor;
  for (const provider of providers) {
    state.deployment.providers[provider].enabled = true;
    state.deployment.providers[provider].enabledAt = now();
    state.deployment.providers[provider].enabledBy = actor;
  }
  appendLedger(state, actor, 'auto-deploy-enabled', `Enabled auto deploy for ${providers.join(', ')}.`);
  writeState(state);
  console.log(`Auto deploy enabled for: ${providers.join(', ')}`);
  console.log('Next step: generate provider files only after project framework and target are confirmed.');
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === 'status') return status();
  if (command === 'ask') return ask();
  if (command === 'defer') return defer(args);
  if (command === 'enable') return enable(args);

  console.log(`Usage:
  node .MOP/scripts/mop-auto-deploy.mjs status
  node .MOP/scripts/mop-auto-deploy.mjs ask
  node .MOP/scripts/mop-auto-deploy.mjs defer --actor <codename> --answer nanti
  node .MOP/scripts/mop-auto-deploy.mjs enable --actor <codename> --provider github|docker|vercel|all --confirm yes`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
