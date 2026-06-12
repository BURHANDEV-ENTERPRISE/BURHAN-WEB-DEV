#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..', '..');
const colorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};
const installEntries = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.MOP',
  '.agents',
  '.claude',
  '.claude-flow',
  '.codex',
  '.gemini',
  '.mcp.json'
];
const doctorEntries = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.MOP/STATE.json',
  '.MOP/PROTOCOL.md',
  '.MOP/scripts/mop-core.mjs',
  '.MOP/scripts/mop-workflow.mjs',
  '.agents/skills/mop-help/SKILL.md'
];

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

function paint(name, value) {
  if (!colorEnabled) return value;
  return `${colors[name]}${value}${colors.reset}`;
}

function rule() {
  console.log(paint('gray', '-'.repeat(66)));
}

function header(title, subtitle) {
  console.log('');
  rule();
  console.log(paint('bold', title));
  console.log(paint('cyan', subtitle));
  rule();
}

function asJson(args) {
  return args.json === true || args.format === 'json';
}

function statusBadge(status) {
  if (status === 'installed') return paint('green', '[OK]');
  if (status === 'skipped-existing') return paint('yellow', '[SKIP]');
  if (status === 'missing-source') return paint('red', '[MISS]');
  return paint('gray', '[INFO]');
}

function statusLabel(status) {
  if (status === 'installed') return 'installed';
  if (status === 'skipped-existing') return 'already exists';
  if (status === 'missing-source') return 'template missing';
  return status;
}

function summarize(results) {
  return results.reduce((summary, item) => {
    if (item.status === 'installed') summary.installed += 1;
    else if (item.status === 'skipped-existing') summary.skipped += 1;
    else if (item.status === 'missing-source') summary.missing += 1;
    else summary.other += 1;
    return summary;
  }, { installed: 0, skipped: 0, missing: 0, other: 0 });
}

function copyPath(entry, source, target, force = false) {
  if (!existsSync(source)) return { entry, source, target, status: 'missing-source' };
  if (existsSync(target) && !force) return { entry, source, target, status: 'skipped-existing' };
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
  return { entry, source, target, status: 'installed' };
}

function buildInstallReport(args) {
  const targetRoot = resolve(String(args.target || process.cwd()));
  const force = args.force === true;
  const results = installEntries.map((entry) => copyPath(
    entry,
    join(packageRoot, entry),
    join(targetRoot, entry),
    force
  ));
  const summary = summarize(results);
  return {
    ok: summary.missing === 0,
    command: 'npx burhan-mop install',
    target: targetRoot,
    force,
    results,
    summary,
    next: [
      'Run /mop-setup in the target project.',
      'For team mode, initialize autosycn after setup.',
      'Use: node .MOP/scripts/mop-workflow.mjs help --actor <codename> --task "lepas ni buat apa?"'
    ]
  };
}

function renderInstall(report) {
  header('BURHAN-MOP installer', 'Portable AI MemoryCore for Claude, Codex / ChatGPT, Gemini, and Antigravity');
  console.log(`${paint('bold', 'Target')} : ${report.target}`);
  console.log(`${paint('bold', 'Mode')}   : ${report.force ? 'force overwrite' : 'safe install'}`);
  rule();
  for (const item of report.results) {
    console.log(`${statusBadge(item.status)} ${item.entry.padEnd(28)} ${statusLabel(item.status)}`);
  }
  rule();
  console.log(`${paint('bold', 'Summary')}: ${report.summary.installed} installed, ${report.summary.skipped} skipped, ${report.summary.missing} missing`);
  if (report.summary.skipped > 0) {
    console.log(paint('yellow', 'Tip: existing files were kept. Use --force only when you want to overwrite them.'));
  }
  if (report.summary.missing > 0) {
    console.log(paint('red', 'Some package templates are missing. Reinstall or report this package build.'));
  }
  console.log('');
  console.log(paint('bold', 'Next'));
  report.next.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item}`);
  });
  console.log('');
  console.log(paint('dim', 'Automation JSON: npx burhan-mop install --json'));
}

function install(args) {
  const report = buildInstallReport(args);
  if (asJson(args)) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  renderInstall(report);
}

function buildDoctorReport() {
  const results = doctorEntries.map((entry) => {
    const path = join(process.cwd(), entry);
    const exists = existsSync(path);
    return {
      entry,
      exists,
      type: exists ? (statSync(path).isDirectory() ? 'dir' : 'file') : 'missing'
    };
  });
  return {
    ok: results.every((item) => item.exists),
    cwd: process.cwd(),
    results
  };
}

function renderDoctor(report) {
  header('BURHAN-MOP doctor', 'Workspace health check');
  console.log(`${paint('bold', 'Project')}: ${report.cwd}`);
  rule();
  for (const item of report.results) {
    const badge = item.exists ? paint('green', '[OK]') : paint('red', '[MISS]');
    console.log(`${badge} ${item.entry.padEnd(38)} ${item.type}`);
  }
  rule();
  console.log(`${paint('bold', 'Status')}: ${report.ok ? paint('green', 'ready') : paint('red', 'missing files')}`);
  console.log('');
  console.log(paint('dim', 'Automation JSON: npx burhan-mop doctor --json'));
}

function doctor(args) {
  const report = buildDoctorReport();
  if (asJson(args)) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  renderDoctor(report);
}

function listPackage(args) {
  const report = {
    packageRoot,
    entries: readdirSync(packageRoot, { withFileTypes: true }).map((item) => ({
      name: item.name,
      type: item.isDirectory() ? 'dir' : 'file'
    }))
  };
  if (asJson(args)) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  header('BURHAN-MOP package', 'Published package contents');
  console.log(`${paint('bold', 'Root')}: ${report.packageRoot}`);
  rule();
  for (const item of report.entries) {
    console.log(`${item.type.padEnd(4)} ${item.name}`);
  }
  console.log('');
  console.log(paint('dim', 'Automation JSON: npx burhan-mop package --json'));
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === 'install') return install(args);
  if (command === 'doctor') return doctor(args);
  if (command === 'package') return listPackage(args);
  console.log(`Usage:
  npx burhan-mop install [--target PATH] [--force] [--json]
  npx burhan-mop doctor [--json]
  npx burhan-mop package [--json]`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
