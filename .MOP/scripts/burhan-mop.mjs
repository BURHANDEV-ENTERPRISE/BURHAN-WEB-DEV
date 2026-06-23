#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, readFileSync, writeFileSync } from 'node:fs';
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
  '.codex',
  '.gemini',
  '.mcp.json',
  'bin/mop-detect-run.mjs'
];
const doctorEntries = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.mcp.json',
  '.MOP/STATE.json',
  '.MOP/PROTOCOL.md',
  '.MOP/flow/ROADMAP.md',
  '.MOP/flow/skill-manifest.json',
  '.MOP/scripts/mop-core.mjs',
  '.MOP/scripts/mop-flow.mjs',
  '.MOP/scripts/mop-workflow.mjs',
  '.MOP/scripts/mop-autosycn.mjs',
  '.MOP/scripts/mop-auto-deploy.mjs',
  '.MOP/scripts/mop-service.mjs',
  '.MOP/scripts/mop-smoke-test.mjs',
  'bin/mop-detect-run.mjs',
  '.agents/AGENTS.md',
  '.agents/skills/mop-help/SKILL.md',
  '.agents/skills/mop-flow/SKILL.md',
  '.agents/skills/autosycn/SKILL.md',
  '.agents/skills/auto-deploy/SKILL.md',
  '.claude/settings.json',
  '.claude/skills/mop-help/SKILL.md',
  '.claude/skills/mop-flow/SKILL.md',
  '.claude/skills/autosycn/SKILL.md',
  '.claude/skills/auto-deploy/SKILL.md',
  '.codex/config.toml',
  '.gemini/settings.json'
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
  
  const filterFn = (src, dest) => {
    const s = src.replaceAll('\\', '/');
    // Never overwrite user data/customization during --force.
    // STATE.json is config-migrated separately (see migrateState).
    if (existsSync(dest)) {
      if (s.endsWith('/STATE.json') || s.endsWith('STATE.json')) return false;
      if (s.endsWith('/.MOP/config/team.json')) return false;
      if (s.includes('/.MOP/config/members/')) return false;
      if (s.includes('/.MOP/memory/')) return false;
    }
    return true;
  };

  cpSync(source, target, { recursive: true, force: true, filter: filterFn });
  return { entry, source, target, status: 'installed' };
}

// Keys that hold USER data and must survive an update untouched.
const PRESERVE_USER_KEYS = [
  'initialized', 'projectName', 'projectNameDefault', 'ownerCodename',
  'activeMember', 'activeAgents', 'session',
  'mode', 'joinMode', 'githubUrl',
  'members', 'agentRoster', 'ledger',
  'federation', 'deployment'
];

// On update, refresh system config from the new template while preserving all
// user data. Without this, config baked into STATE.json (agentCatalog, workflow
// phases, policies, sessionPolicy) would stay frozen at the version first
// installed — the "some things don't update" problem.
function migrateState(targetRoot) {
  const templatePath = join(packageRoot, '.MOP', 'STATE.json');
  const userPath = join(targetRoot, '.MOP', 'STATE.json');
  if (!existsSync(templatePath) || !existsSync(userPath)) return { migrated: false, reason: 'no-state' };
  let template;
  let user;
  try {
    template = JSON.parse(readFileSync(templatePath, 'utf8'));
    user = JSON.parse(readFileSync(userPath, 'utf8'));
  } catch {
    return { migrated: false, reason: 'state-parse-failed' };
  }
  if (!user.initialized) return { migrated: false, reason: 'not-initialized' };

  const fromSchema = user.schemaVersion ?? 'unknown';
  const toSchema = template.schemaVersion ?? 'unknown';

  // Back up the user's current state before rewriting.
  writeFileSync(join(targetRoot, '.MOP', 'STATE.json.bak'), `${JSON.stringify(user, null, 2)}\n`, 'utf8');

  const merged = JSON.parse(JSON.stringify(template)); // new system config baseline
  for (const key of PRESERVE_USER_KEYS) {
    if (key in user) merged[key] = user[key];
  }
  // Preserve workflow progress inside the refreshed workflow block.
  if (user.workflow && merged.workflow && typeof merged.workflow === 'object') {
    if ('currentPhase' in user.workflow) merged.workflow.currentPhase = user.workflow.currentPhase;
    if ('activeProfile' in user.workflow) merged.workflow.activeProfile = user.workflow.activeProfile;
  }
  // Forward-compat: keep any extra user keys the new template does not define.
  for (const key of Object.keys(user)) {
    if (!(key in merged)) merged[key] = user[key];
  }

  const tmp = `${userPath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  renameSync(tmp, userPath);
  return {
    migrated: true,
    fromSchema,
    toSchema,
    preservedKeys: PRESERVE_USER_KEYS.filter((key) => key in user),
    backup: '.MOP/STATE.json.bak'
  };
}

function buildInstallReport(args) {
  const targetRoot = resolve(String(args.target || process.cwd()));
  const force = args.force === true;
  const stateExisted = existsSync(join(targetRoot, '.MOP', 'STATE.json'));
  const results = installEntries.map((entry) => copyPath(
    entry,
    join(packageRoot, entry),
    join(targetRoot, entry),
    force
  ));

  // On a forced update over an existing install, migrate STATE.json config
  // (user data preserved, system config refreshed). The copy filter above keeps
  // the user's STATE.json from being clobbered so this merge is the source of truth.
  let migration = null;
  if (force && stateExisted) {
    migration = migrateState(targetRoot);
  }

  // Save VERSION.txt locally
  try {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    mkdirSync(join(targetRoot, '.MOP'), { recursive: true });
    writeFileSync(join(targetRoot, '.MOP', 'VERSION.txt'), pkg.version, 'utf8');
  } catch (err) {
    // ignore
  }

  const summary = summarize(results);
  return {
    ok: summary.missing === 0,
    command: 'npx mop-flow install',
    legacyCommand: 'npx burhan-mop install',
    target: targetRoot,
    force,
    results,
    migration,
    summary,
    next: [
      'Run /mop-setup in the target project.',
      'For team mode, initialize autosycn after setup.',
      'Use: node .MOP/scripts/mop-workflow.mjs help --actor <codename> --task "lepas ni buat apa?"'
    ]
  };
}

function renderInstall(report) {
  header('MOP Flow installer', 'Portable AI MemoryCore for Claude, Codex / ChatGPT, Gemini, and Antigravity');
  console.log(`${paint('bold', 'Target')} : ${report.target}`);
  console.log(`${paint('bold', 'Mode')}   : ${report.force ? 'force overwrite' : 'safe install'}`);
  rule();
  for (const item of report.results) {
    console.log(`${statusBadge(item.status)} ${item.entry.padEnd(28)} ${statusLabel(item.status)}`);
  }
  rule();
  console.log(`${paint('bold', 'Summary')}: ${report.summary.installed} installed, ${report.summary.skipped} skipped, ${report.summary.missing} missing`);
  if (report.migration && report.migration.migrated) {
    rule();
    console.log(`${paint('green', '[STATE]')} config migrated ${report.migration.fromSchema} -> ${report.migration.toSchema} (user data preserved, system config refreshed)`);
    console.log(paint('dim', `Backup saved at ${report.migration.backup}. Preserved: ${report.migration.preservedKeys.join(', ')}`));
  } else if (report.migration && !report.migration.migrated && report.migration.reason !== 'not-initialized') {
    console.log(paint('yellow', `[STATE] config not migrated: ${report.migration.reason}. Your STATE.json was left unchanged.`));
  }
  if (report.summary.skipped > 0) {
    console.log(paint('yellow', 'Tip: existing files were kept. Use --force to update them (your STATE.json, team config, and memory are preserved).'));
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
  console.log(paint('dim', 'Automation JSON: npx mop-flow install --json'));
  console.log(paint('dim', 'Legacy alias: npx burhan-mop install'));
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
  header('MOP Flow doctor', 'Workspace health check');
  console.log(`${paint('bold', 'Project')}: ${report.cwd}`);
  rule();
  for (const item of report.results) {
    const badge = item.exists ? paint('green', '[OK]') : paint('red', '[MISS]');
    console.log(`${badge} ${item.entry.padEnd(38)} ${item.type}`);
  }
  rule();
  console.log(`${paint('bold', 'Status')}: ${report.ok ? paint('green', 'ready') : paint('red', 'missing files')}`);
  console.log('');
  console.log(paint('dim', 'Automation JSON: npx mop-flow doctor --json'));
}

function doctor(args) {
  const report = buildDoctorReport();
  if (asJson(args)) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  renderDoctor(report);
}

function uninstall(args) {
  const targetRoot = process.cwd();
  let deleted = 0;
  for (const entry of installEntries) {
    const p = join(targetRoot, entry);
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
      deleted++;
    }
  }
  if (asJson(args)) {
    console.log(JSON.stringify({ ok: true, deleted, target: targetRoot }, null, 2));
    return;
  }
  header('MOP Flow uninstaller', 'Removed MOP from project');
  console.log(`${paint('bold', 'Target')} : ${targetRoot}`);
  console.log(`${paint('bold', 'Status')} : ${deleted} items deleted.`);
  console.log('');
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
  header('MOP Flow package', 'Published package contents');
  console.log(`${paint('bold', 'Root')}: ${report.packageRoot}`);
  rule();
  for (const item of report.entries) {
    console.log(`${item.type.padEnd(4)} ${item.name}`);
  }
  console.log('');
  console.log(paint('dim', 'Automation JSON: npx mop-flow package --json'));
}

function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs[0] : 'install';
  const rest = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs.slice(1) : rawArgs;
  const args = parseArgs(rest);
  if (command === 'doctor') return doctor(args);
  if (command === 'package') return listPackage(args);
  if (command === 'delete' || command === 'uninstall') return uninstall(args);
  return install(args);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
