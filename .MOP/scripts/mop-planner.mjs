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

function goalAction(args) {
  const actor = args.actor;
  const objective = args.objective;
  if (!actor || !objective) {
    console.log('Usage: node .MOP/scripts/mop-planner.mjs goal --actor <codename> --objective "<high-level goal>"');
    return;
  }
  
  const statePath = join(rootDir, '.MOP', 'STATE.json');
  const state = readJson(statePath, { goals: [], activePlans: [] });
  if (!state.goals) state.goals = [];
  if (!state.activePlans) state.activePlans = [];
  
  const newGoal = {
    id: `goal-${Date.now()}`,
    objective,
    actor,
    status: 'planned',
    createdAt: new Date().toISOString()
  };
  
  state.goals.push(newGoal);
  writeJson(statePath, state);
  
  console.log(`[MOP GOAP] Goal logged: "${objective}" by ${actor}.`);
  console.log(`[MOP GOAP] Decomposing goal into preconditions... (Run \`mop-planner.mjs status\` to view)`);
}

function statusAction() {
  const statePath = join(rootDir, '.MOP', 'STATE.json');
  const state = readJson(statePath, { goals: [] });
  if (!state.goals || state.goals.length === 0) {
    console.log('No active MOP GOAP plans.');
    return;
  }
  console.log('Active Goals:');
  state.goals.forEach(g => {
    console.log(`- [${g.status}] ${g.objective} (Actor: ${g.actor})`);
  });
}

function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs[0] : 'status';
  const afterCommand = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs.slice(1) : rawArgs;
  const args = parseArgs(afterCommand);

  if (command === 'goal') return goalAction(args);
  if (command === 'status') return statusAction(args);

  console.log(`Usage:
  node .MOP/scripts/mop-planner.mjs goal --actor <codename> --objective "<high-level goal>"
  node .MOP/scripts/mop-planner.mjs status`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
