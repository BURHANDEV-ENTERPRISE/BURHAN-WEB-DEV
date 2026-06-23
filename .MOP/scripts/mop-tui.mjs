#!/usr/bin/env node
import * as readline from 'node:readline';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const coreDir = resolve(here, '..');
const packageRoot = resolve(coreDir, '..');
const cwd = process.cwd();

function readPackageVersion() {
  if (process.env.MOP_FLOW_PACKAGE_VERSION) return process.env.MOP_FLOW_PACKAGE_VERSION;
  try {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    if (pkg.name === 'mop-flow' && pkg.version) return pkg.version;
  } catch {
    // Fall through to installed-core or release fallback below.
  }
  try {
    return readFileSync(join(coreDir, 'VERSION.txt'), 'utf8').trim();
  } catch {
    return '1.4.4';
  }
}

function readInstalledVersion() {
  if (!existsSync(join(cwd, '.MOP'))) return null;
  try {
    return readFileSync(join(cwd, '.MOP', 'VERSION.txt'), 'utf8').trim();
  } catch {
    return '< 0.2.0';
  }
}

let packageVersion = readPackageVersion();
let installedVersion = readInstalledVersion();
let selectedIndex = 0;
let busy = false;

const colorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgCyan: '\x1b[46m',
  black: '\x1b[30m'
};

function paint(name, value) {
  if (!colorEnabled) return value;
  return `${colors[name]}${value}${colors.reset}`;
}

const actions = [
  {
    id: 'install',
    group: 'Core',
    label: 'Install',
    description: 'Copy MOP files into this project.',
    bin: 'installer',
    args: ['install'],
    disabled: () => Boolean(installedVersion),
    disabledReason: 'already installed'
  },
  {
    id: 'update',
    group: 'Core',
    label: 'Update',
    description: 'Refresh scripts and configs while preserving project state.',
    bin: 'installer',
    args: ['install', '--force'],
    disabled: () => !installedVersion || installedVersion === packageVersion,
    disabledReason: () => !installedVersion ? 'install first' : 'already latest'
  },
  {
    id: 'doctor',
    group: 'Core',
    label: 'Doctor',
    description: 'Run workspace health checks.',
    bin: 'installer',
    args: ['doctor']
  },
  {
    id: 'status',
    group: 'Core',
    label: 'Status',
    description: 'Show provider bridge and skill status.',
    bin: 'flow',
    args: ['status']
  },
  {
    id: 'link',
    group: 'Brain',
    label: 'Link',
    description: 'Paste Brain URL, link this project, then install/start background relay.',
    bin: 'flow',
    args: async () => {
      const url = await askLine('Paste Brain link URL');
      return url ? [['link', url], ['service', 'install', '--start']] : null;
    },
    disabled: () => !installedVersion,
    disabledReason: 'install first'
  },
  {
    id: 'delete',
    group: 'Tools',
    label: 'Delete',
    description: 'Remove installed MOP files from this project.',
    bin: 'installer',
    args: ['delete'],
    disabled: () => !installedVersion,
    disabledReason: 'not installed'
  },
  {
    id: 'skills',
    group: 'Tools',
    label: 'Skills',
    description: 'List portable and runtime-bridged skills.',
    bin: 'flow',
    args: ['skills', 'list']
  },
  {
    id: 'exit',
    group: 'Tools',
    label: 'Exit',
    description: 'Close this menu.',
    bin: null,
    args: []
  }
];

function selectedAction() {
  return visibleActions()[selectedIndex];
}

function isDisabled(action) {
  return typeof action.disabled === 'function' && action.disabled();
}

function disabledReason(action) {
  if (!isDisabled(action)) return null;
  if (typeof action.disabledReason === 'function') return action.disabledReason();
  return action.disabledReason || 'disabled';
}

function visibleActions() {
  return actions;
}

function ensureSelectableIndex() {
  const visible = visibleActions();
  if (selectedIndex >= visible.length) selectedIndex = Math.max(0, visible.length - 1);
}

function moveSelection(direction) {
  const visible = visibleActions();
  if (!visible.length) return;
  selectedIndex = (selectedIndex + direction + visible.length) % visible.length;
}

function refreshState() {
  packageVersion = readPackageVersion();
  installedVersion = readInstalledVersion();
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0f');
}

function visibleLength(value) {
  return String(value).replace(/\x1b\[[0-9;]*m/g, '').length;
}

function padRight(value, width) {
  const text = String(value);
  const len = visibleLength(text);
  return len >= width ? text : `${text}${' '.repeat(width - len)}`;
}

function line(width = 74) {
  return `+${'-'.repeat(width - 2)}+`;
}

function row(left = '', right = '', width = 74) {
  const bodyWidth = width - 4;
  const rightText = right ? ` ${right}` : '';
  const leftWidth = Math.max(0, bodyWidth - visibleLength(rightText));
  return `| ${padRight(left, leftWidth)}${rightText} |`;
}

function statusPill(label, value, color = 'green') {
  return `${paint('dim', label)} ${paint(color, value)}`;
}

function renderHeader() {
  const width = 70;
  console.log(paint('cyan', line(width)));
  console.log(row(paint('bold', 'MOP FLOW'), statusPill('Package', packageVersion, 'green'), width));
  console.log(row('MemoryCore + Brain Relay', installedVersion
    ? statusPill('Installed', installedVersion, installedVersion === packageVersion ? 'green' : 'yellow')
    : statusPill('Installed', 'Not installed', 'gray'), width));
  console.log(paint('cyan', line(width)));
  console.log('');
}

function renderMenu() {
  clearScreen();
  refreshState();
  const visible = visibleActions();
  ensureSelectableIndex();
  renderHeader();

  console.log(paint('dim', 'Up/Down: move   Enter: run   q: quit'));
  console.log('');

  let currentGroup = '';
  visible.forEach((action, index) => {
    if (action.group !== currentGroup) {
      currentGroup = action.group;
      if (index > 0) console.log('');
      console.log(paint('magenta', currentGroup));
    }

    const cursor = index === selectedIndex ? paint('cyan', '>') : ' ';
    const indexText = String(index + 1).padStart(2, '0');
    const disabled = isDisabled(action);
    const disabledText = disabled ? paint('dim', ` [${disabledReason(action)}]`) : '';
    const label = index === selectedIndex
      ? paint('black', paint('bgCyan', paint('bold', ` ${action.label} `)))
      : disabled
      ? paint('dim', action.label)
      : action.label;
    console.log(` ${cursor} ${paint('dim', indexText)}  ${label}${disabledText}`);
  });

  console.log('');
  const action = selectedAction();
  console.log(paint('cyan', line(70)));
  console.log(row(paint('bold', action.label), action.group, 70));
  console.log(row(action.description, '', 70));
  console.log(paint('cyan', line(70)));
}

function resolveBin(kind) {
  if (kind === 'installer') return join(here, 'burhan-mop.mjs');
  if (kind === 'dashboard') return join(here, 'mop-dashboard.mjs');
  return join(here, 'mop-flow.mjs');
}

async function askLine(label) {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  unbindMenuKeypress();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolveAnswer) => {
    rl.question(`${paint('cyan', label)}: `, resolveAnswer);
  });
  rl.close();
  return answer.trim();
}

async function runAction(action) {
  if (action.id === 'exit') return exitTui();
  if (isDisabled(action) || busy) return;
  busy = true;

  clearScreen();
  console.log(paint('cyan', line()));
  console.log(row(paint('bold', action.label), action.group));
  console.log(row(action.description));
  console.log(paint('cyan', line()));
  console.log('');

  let args = typeof action.args === 'function' ? await action.args() : action.args;
  if (!args) {
    console.log(paint('yellow', 'Cancelled. Press Enter to return to menu...'));
    return waitForReturn();
  }

  const bin = resolveBin(action.bin);
  const commands = Array.isArray(args[0]) ? args : [args];
  let result = { status: 0 };
  console.log(paint('gray', '-'.repeat(74)));
  for (const commandArgs of commands) {
    console.log(paint('cyan', `Running: mop-flow ${commandArgs.join(' ')}`));
    result = spawnSync('node', [bin, ...commandArgs], {
      cwd,
      stdio: 'inherit',
      windowsHide: false
    });
    if (result.status !== 0) break;
    if (commands.length > 1) console.log(paint('gray', '-'.repeat(74)));
  }
  console.log(paint('gray', '-'.repeat(74)));
  if (result.status === 0) console.log(paint('green', 'Task completed. Press Enter to return to menu...'));
  else console.log(paint('red', `Task exited with code ${result.status}. Press Enter to return to menu...`));
  waitForReturn();
}

function waitForReturn() {
  unbindMenuKeypress();
  const returnListener = (str, key) => {
    if (key.name !== 'return') return;
    process.stdin.removeListener('keypress', returnListener);
    busy = false;
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    bindMenuKeypress();
    renderMenu();
  };
  readline.emitKeypressEvents(process.stdin);
  process.stdin.on('keypress', returnListener);
}

function exitTui() {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.removeListener('keypress', handleKeypress);
  console.log('Exiting MOP Flow.');
  process.exit(0);
}

function handleKeypress(str, key = {}) {
  if (busy) return;
  if (key.name === 'up') {
    moveSelection(-1);
    renderMenu();
  } else if (key.name === 'down') {
    moveSelection(1);
    renderMenu();
  } else if (key.name === 'return') {
    runAction(selectedAction());
  } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
    exitTui();
  }
}

function unbindMenuKeypress() {
  while (process.stdin.listenerCount('keypress', handleKeypress) > 0) {
    process.stdin.removeListener('keypress', handleKeypress);
  }
}

function bindMenuKeypress() {
  unbindMenuKeypress();
  process.stdin.on('keypress', handleKeypress);
}

export function startTui() {
  if (process.argv.includes('--menu-json')) {
    console.log(JSON.stringify({
      packageVersion,
      installedVersion,
      actions: visibleActions().map((action) => ({
        id: action.id,
        group: action.group,
        label: action.label,
        description: action.description,
        disabled: isDisabled(action),
        disabledReason: disabledReason(action)
      }))
    }, null, 2));
    return;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('MOP Flow Control Center requires an interactive terminal.');
    console.log('Use `npx mop-flow --menu-json` to inspect available actions.');
    return;
  }

  renderMenu();
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  bindMenuKeypress();
}

if (resolve(process.argv[1] || '') === resolve(fileURLToPath(import.meta.url))) {
  startTui();
}
