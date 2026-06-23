#!/usr/bin/env node
/**
 * mop-detect-run.mjs
 * Cross-platform launch helper for MOP Flow.
 *
 * Usage:
 *   node bin/mop-detect-run.mjs <script> [...args]
 *   import { detectRun, detectNode } from './bin/mop-detect-run.mjs'
 *
 * Replaces all hardcoded `cmd /c` patterns in provider config files.
 * Works on Windows, macOS, and Linux without modification.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const isWindows = process.platform === 'win32';

/**
 * Returns the correct `node` executable path for the current OS.
 * On Windows, `node` is always resolvable; no `cmd /c` needed.
 */
export function detectNode() {
  return 'node';
}

/**
 * Returns spawn options appropriate for the current OS.
 * On Windows, shell must be true for npx to work correctly.
 * On POSIX, shell: false is safer and faster.
 */
export function detectSpawnOptions(extra = {}) {
  return {
    shell: isWindows,
    stdio: 'inherit',
    ...extra,
  };
}

/**
 * Returns the npx command appropriate for the current OS.
 * No cmd.exe wrapper needed on any platform.
 */
export function detectNpx() {
  return isWindows ? 'npx.cmd' : 'npx';
}

/**
 * Runs a MOP script cross-platform.
 * @param {string} scriptPath - absolute or relative path to .mjs file
 * @param {string[]} args - arguments to pass to the script
 * @returns {{ status: number }}
 */
export function runScript(scriptPath, args = []) {
  const result = spawnSync('node', [scriptPath, ...args], detectSpawnOptions());
  return { status: result.status ?? 1 };
}

// CLI mode — when called directly: node bin/mop-detect-run.mjs <script> [...args]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , scriptArg, ...rest] = process.argv;
  if (!scriptArg) {
    console.error('Usage: mop-detect-run <script> [...args]');
    process.exit(1);
  }
  const resolved = path.resolve(scriptArg);
  const { status } = runScript(resolved, rest);
  process.exit(status);
}
