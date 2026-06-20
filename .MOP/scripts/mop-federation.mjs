#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs[0] : 'status';
  const afterCommand = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs.slice(1) : rawArgs;
  const args = parseArgs(afterCommand);

  if (command === 'join') return joinAction(args);
  if (command === 'status') return statusAction(args);

  console.log(`Usage:
  node .MOP/scripts/mop-federation.mjs join --actor <codename> --target "<other-project-path>"
  node .MOP/scripts/mop-federation.mjs status`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
