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

// Fetch versions
let packageVersion = 'Unknown';
try {
  const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  packageVersion = pkg.version;
} catch (e) {}

let installedVersion = null;
const isInstalled = existsSync(join(cwd, '.MOP'));
if (isInstalled) {
  try {
    installedVersion = readFileSync(join(cwd, '.MOP', 'VERSION.txt'), 'utf8').trim();
  } catch (e) {
    installedVersion = '< 0.2.0';
  }
}

const colorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m'
};

function paint(name, value) {
  if (!colorEnabled) return value;
  return `${colors[name]}${value}${colors.reset}`;
}

const options = [
  { id: 'install', label: 'Install', cmd: 'install' },
  { id: 'update', label: 'Update', cmd: 'install --force' },
  { id: 'delete', label: 'Delete', cmd: 'delete' },
  { id: 'status', label: 'Status', cmd: 'status' },
  { id: 'doctor', label: 'Doctor', cmd: 'doctor' },
  { id: 'skills', label: 'Skills List', cmd: 'skills list' },
  { id: 'exit', label: 'Exit', cmd: 'exit' }
];

let selectedIndex = 0;

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0f');
}

function renderMenu() {
  clearScreen();
  console.log(paint('bold', paint('cyan', '=== MOP Flow Dashboard ===')));
  console.log('');
  console.log(`Package Version   : ${paint('green', packageVersion)}`);
  if (isInstalled) {
    console.log(`Installed Version : ${paint('yellow', installedVersion)}`);
  } else {
    console.log(`Installed Version : ${paint('gray', 'Not Installed')}`);
  }
  console.log('');
  console.log(paint('dim', 'Use Arrow Keys to navigate, Enter to select.'));
  console.log('');

  options.forEach((opt, index) => {
    let disabled = false;
    if (opt.id === 'install' && isInstalled) disabled = true;
    if (opt.id === 'update' && (!isInstalled || installedVersion === packageVersion)) disabled = true;
    if (opt.id === 'delete' && !isInstalled) disabled = true;

    const cursor = index === selectedIndex ? paint('cyan', '>') : ' ';
    const isSelected = index === selectedIndex;
    
    let text = opt.label;
    if (disabled) {
      text = paint('dim', opt.label + ' (Disabled)');
    } else if (isSelected) {
      text = paint('bgBlue', paint('bold', opt.label));
    }
    
    console.log(` ${cursor} ${text}`);
  });
  console.log('');
}

function runCommand(cmd) {
  clearScreen();
  console.log(paint('cyan', `Running: mop-flow ${cmd}...`));
  console.log(paint('gray', '-'.repeat(40)));
  
  let bin = join(packageRoot, 'bin', 'mop-flow.mjs');
  
  if (cmd === 'install' || cmd === 'install --force' || cmd === 'delete' || cmd === 'doctor') {
    bin = join(here, 'burhan-mop.mjs');
  } else if (cmd === 'status' || cmd === 'skills list') {
    bin = join(here, 'mop-flow.mjs');
  }

  const args = cmd.split(' ').filter(Boolean);
  spawnSync('node', [bin, ...args], {
    cwd,
    stdio: 'inherit'
  });
  
  console.log(paint('gray', '-'.repeat(40)));
  console.log(paint('green', 'Task completed. Press Enter to return to menu...'));
}

export function startTui() {
  renderMenu();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const handleKeypress = (str, key) => {
    if (key.name === 'up') {
      selectedIndex = (selectedIndex > 0) ? selectedIndex - 1 : options.length - 1;
      renderMenu();
    } else if (key.name === 'down') {
      selectedIndex = (selectedIndex < options.length - 1) ? selectedIndex + 1 : 0;
      renderMenu();
    } else if (key.name === 'return') {
      const selected = options[selectedIndex];
      
      let disabled = false;
      if (selected.id === 'install' && isInstalled) disabled = true;
      if (selected.id === 'update' && (!isInstalled || installedVersion === packageVersion)) disabled = true;
      if (selected.id === 'delete' && !isInstalled) disabled = true;

      if (disabled) return;

      if (selected.id === 'exit') {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        rl.close();
        process.stdin.removeListener('keypress', handleKeypress);
        console.log('Exiting MOP Flow.');
        process.exit(0);
      } else {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', handleKeypress);
        
        runCommand(selected.cmd);
        
        const returnListener = (s, k) => {
          if (k.name === 'return') {
            process.stdin.removeListener('keypress', returnListener);
            if (process.stdin.isTTY) process.stdin.setRawMode(true);
            process.stdin.on('keypress', handleKeypress);
            // Refresh installation state
            installedVersion = null;
            if (existsSync(join(cwd, '.MOP'))) {
              try {
                installedVersion = readFileSync(join(cwd, '.MOP', 'VERSION.txt'), 'utf8').trim();
              } catch (e) {
                installedVersion = '< 0.2.0';
              }
            }
            renderMenu();
          }
        };
        process.stdin.on('keypress', returnListener);
      }
    } else if (key.ctrl && key.name === 'c') {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      rl.close();
      process.exit(0);
    }
  };

  process.stdin.on('keypress', handleKeypress);
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  startTui();
}
