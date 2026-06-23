#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, '..', '..');

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      out._.push(item);
      continue;
    }
    const [key, inlineValue] = item.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      out[key] = inlineValue;
      continue;
    }
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

export function piiScrub(text) {
  if (typeof text !== 'string') return text;
  let scrubbed = text;
  // 1. Email
  scrubbed = scrubbed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL_REDACTED]');
  // 2. MY Phone Number
  scrubbed = scrubbed.replace(/\+?6?01[0-9]{1}-?[0-9]{7,8}\b|\+?6?0[3-9]{1}-?[0-9]{7,8}\b/g, '[PHONE_REDACTED]');
  // 3. API Keys/Tokens
  scrubbed = scrubbed.replace(/\b(?:sk-[a-zA-Z0-9]{40,}|AIzaSy[a-zA-Z0-9-_]{33}|ghp_[a-zA-Z0-9]{36,}|[a-f0-9]{32,64})\b/g, '[API_KEY_REDACTED]');
  // 4. MY IC Number
  scrubbed = scrubbed.replace(/\b\d{6}-\d{2}-\d{4}\b|\b\d{12}\b/g, '[IC_REDACTED]');
  // 5. Credit Cards
  scrubbed = scrubbed.replace(/\b(?:\d[ -]?){13,16}\d\b/g, '[CREDIT_CARD_REDACTED]');
  return scrubbed;
}

export function calculateHash(entry, prevHash) {
  const data = JSON.stringify({
    at: entry.at,
    actor: entry.actor,
    kind: entry.kind,
    summary: entry.summary,
    prev: prevHash
  });
  return createHash('sha256').update(data).digest('hex');
}

export function outbound(entry) {
  const sharedDir = join(rootDir, '.MOP/memory/shared-ledger');
  mkdirSync(sharedDir, { recursive: true });
  const ledgerFilePath = join(sharedDir, 'ledger.jsonl');

  const scrubbedSummary = piiScrub(entry.summary || '');
  const scrubbedEntry = {
    at: entry.at || new Date().toISOString(),
    actor: entry.actor || 'system',
    kind: entry.kind || 'generic',
    summary: scrubbedSummary
  };

  let prevHash = '0'.repeat(64);
  if (existsSync(ledgerFilePath)) {
    const lines = readFileSync(ledgerFilePath, 'utf8').split(/\r?\n/).filter(Boolean);
    if (lines.length > 0) {
      try {
        const lastObj = JSON.parse(lines[lines.length - 1]);
        if (lastObj.hash) {
          prevHash = lastObj.hash;
        }
      } catch {
        // Fallback
      }
    }
  }

  scrubbedEntry.prev = prevHash;
  scrubbedEntry.hash = calculateHash(scrubbedEntry, prevHash);

  writeFileSync(ledgerFilePath, `${JSON.stringify(scrubbedEntry)}\n`, { flag: 'a', encoding: 'utf8' });
  return scrubbedEntry;
}

function joinAction(args) {
  const actor = args.actor;
  const target = args.target;
  if (!actor || !target) {
    console.log('Usage: node .MOP/scripts/mop-federation.mjs join --actor <codename> --target "<other-project-path>"');
    return;
  }
  
  const statePath = join(rootDir, '.MOP', 'STATE.json');
  const state = readJson(statePath, { federations: [] });
  if (!state.federations) state.federations = [];
  
  if (!existsSync(target)) {
    console.error(`[MOP Federation] Target path does not exist: ${target}`);
    return;
  }

  const newFederation = {
    id: `fed-${Date.now()}`,
    targetPath: target,
    actor,
    status: 'joined',
    joinedAt: new Date().toISOString()
  };
  
  state.federations.push(newFederation);
  writeJson(statePath, state);
  
  console.log(`[MOP Federation] Successfully joined network at ${target} by ${actor}.`);
}

function statusAction() {
  const statePath = join(rootDir, '.MOP', 'STATE.json');
  const state = readJson(statePath, { federations: [] });
  if (!state.federations || state.federations.length === 0) {
    console.log('No active MOP Federations.');
    return;
  }
  console.log('Active Federations:');
  state.federations.forEach(f => {
    console.log(`- [${f.status}] ${f.targetPath} (Actor: ${f.actor})`);
  });
}

function verifyAction() {
  const sharedDir = join(rootDir, '.MOP/memory/shared-ledger');
  const ledgerFilePath = join(sharedDir, 'ledger.jsonl');
  
  if (!existsSync(ledgerFilePath)) {
    console.log(JSON.stringify({ ok: true, verified: true, message: 'Shared ledger does not exist yet.' }, null, 2));
    return;
  }

  const lines = readFileSync(ledgerFilePath, 'utf8').split(/\r?\n/).filter(Boolean);
  let prevHash = '0'.repeat(64);
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const entry = JSON.parse(lines[i]);
      if (entry.prev !== prevHash) {
        errors.push(`Entry ${i} prev hash mismatch: expected ${prevHash}, got ${entry.prev}`);
      }
      const calculated = calculateHash(entry, entry.prev);
      if (entry.hash !== calculated) {
        errors.push(`Entry ${i} hash mismatch: calculated ${calculated}, got ${entry.hash}`);
      }
      prevHash = entry.hash;
    } catch (err) {
      errors.push(`Entry ${i} is not valid JSON: ${err.message}`);
    }
  }

  const verified = errors.length === 0;
  console.log(JSON.stringify({
    ok: true,
    verified,
    totalEntries: lines.length,
    errors
  }, null, 2));
}

function pushAction(args) {
  const remote = args.remote || 'origin';
  const branch = args.branch || 'mop-shared';

  console.log(`[MOP Federation] Pushing shared ledger to ${remote}/${branch}...`);
  const gitAdd = spawnSync('git', ['add', '.MOP/memory/shared-ledger'], { cwd: rootDir, encoding: 'utf8' });
  const gitCommit = spawnSync('git', ['commit', '-m', 'chore(federation): sync shared ledger'], { cwd: rootDir, encoding: 'utf8' });
  const gitPush = spawnSync('git', ['push', remote, `HEAD:${branch}`], { cwd: rootDir, encoding: 'utf8' });

  console.log(JSON.stringify({
    ok: gitPush.status === 0,
    addStatus: gitAdd.status,
    commitStatus: gitCommit.status,
    pushStatus: gitPush.status,
    stdout: gitPush.stdout,
    stderr: gitPush.stderr
  }, null, 2));
}

function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs[0] : 'status';
  const afterCommand = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs.slice(1) : rawArgs;
  const args = parseArgs(afterCommand);

  if (command === 'join') return joinAction(args);
  if (command === 'status') return statusAction(args);
  if (command === 'verify') return verifyAction();
  if (command === 'push') return pushAction(args);

  console.log(`Usage:
  node .MOP/scripts/mop-federation.mjs join --actor <codename> --target "<other-project-path>"
  node .MOP/scripts/mop-federation.mjs status
  node .MOP/scripts/mop-federation.mjs verify
  node .MOP/scripts/mop-federation.mjs push [--remote <remote>] [--branch <branch>]`);
}

const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === resolve(process.argv[1]) ||
  (existsSync(process.argv[1]) && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]))
);
if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
