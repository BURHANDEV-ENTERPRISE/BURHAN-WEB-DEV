#!/usr/bin/env node
/**
 * mop-flow service - per-machine background relay manager.
 *
 * Each linked project keeps its private token in that project's gitignored
 * `.MOP/link.json`. The per-user registry stores only paths and public link
 * metadata, then the service opens every registered relay on login.
 */
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir, platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { readLink, resolveCoreDir, startRelay } from './mop-relay.mjs';

const REGISTRY_SCHEMA = '1.0';
const here = dirname(fileURLToPath(import.meta.url));

function now() {
  return new Date().toISOString();
}

function asJson(args) {
  return args.json === true || args.format === 'json';
}

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(tmp, path);
  try { chmodSync(path, 0o600); } catch {}
}

export function serviceHome() {
  if (process.env.MOP_FLOW_HOME) return resolve(process.env.MOP_FLOW_HOME);
  if (platform() === 'win32' && process.env.APPDATA) return join(process.env.APPDATA, 'mop-flow');
  if (process.env.XDG_CONFIG_HOME) return join(process.env.XDG_CONFIG_HOME, 'mop-flow');
  return join(homedir(), '.config', 'mop-flow');
}

function registryPath() {
  return join(serviceHome(), 'projects.json');
}

function logPath() {
  return join(serviceHome(), 'relay.log');
}

function readRegistry() {
  const registry = readJson(registryPath(), null);
  if (!registry || !Array.isArray(registry.projects)) {
    return { schemaVersion: REGISTRY_SCHEMA, updatedAt: now(), projects: [] };
  }
  registry.schemaVersion ||= REGISTRY_SCHEMA;
  registry.updatedAt ||= now();
  return registry;
}

function writeRegistry(registry) {
  registry.schemaVersion = REGISTRY_SCHEMA;
  registry.updatedAt = now();
  writeJson(registryPath(), registry);
}

function projectNameFromCore(coreDir, fallback) {
  const state = readJson(join(coreDir, 'STATE.json'), {});
  return String(state.projectName || state.project || fallback || dirname(coreDir).split(/[\\/]/).pop() || 'project');
}

export function registerProject(coreDir = resolveCoreDir(), linkArg = null, options = {}) {
  const absoluteCoreDir = resolve(coreDir);
  const projectRoot = dirname(absoluteCoreDir);
  const link = linkArg || readLink(absoluteCoreDir);
  const registry = readRegistry();
  const existing = registry.projects.find((project) => resolve(project.coreDir) === absoluteCoreDir);
  const previous = existing || {};
  const entry = {
    id: previous.id || link.projectId,
    projectId: link.projectId,
    name: projectNameFromCore(absoluteCoreDir, options.name),
    rootDir: projectRoot,
    coreDir: absoluteCoreDir,
    agentUrl: link.agentUrl,
    wsUrl: link.wsUrl,
    enabled: options.enabled !== false,
    registeredAt: previous.registeredAt || now(),
    updatedAt: now(),
    lastStartedAt: previous.lastStartedAt || null
  };

  if (existing) Object.assign(existing, entry);
  else registry.projects.push(entry);
  registry.projects.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  writeRegistry(registry);
  return { registryPath: registryPath(), entry };
}

function unregisterProject(args) {
  const coreDir = resolve(args['core-dir'] || args.project || resolveCoreDir());
  const registry = readRegistry();
  const before = registry.projects.length;
  registry.projects = registry.projects.filter((project) => resolve(project.coreDir) !== coreDir);
  writeRegistry(registry);
  return { removed: before - registry.projects.length, registryPath: registryPath() };
}

function setProjectEnabled(args, enabled) {
  const coreDir = resolve(args['core-dir'] || args.project || resolveCoreDir());
  const registry = readRegistry();
  const entry = registry.projects.find((project) => resolve(project.coreDir) === coreDir);
  if (!entry) throw new Error('not_registered: run `npx mop-flow service register` from the project first');
  entry.enabled = enabled;
  entry.updatedAt = now();
  writeRegistry(registry);
  return { entry, registryPath: registryPath() };
}

function startupDir() {
  if (platform() !== 'win32') return null;
  if (!process.env.APPDATA) return null;
  return join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
}

function systemdUserDir() {
  if (platform() !== 'linux') return null;
  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(configHome, 'systemd', 'user');
}

function startupCmdPath() {
  const dir = startupDir();
  return dir ? join(dir, 'mop-flow-relay.cmd') : null;
}

function launcherPath() {
  return join(serviceHome(), 'mop-flow-relay.ps1');
}

function systemdUnitPath() {
  const dir = systemdUserDir();
  return dir ? join(dir, 'mop-flow-relay.service') : null;
}

function installWindowsAutostart() {
  const dir = startupDir();
  if (!dir) throw new Error('windows_startup_unavailable');
  mkdirSync(serviceHome(), { recursive: true });
  mkdirSync(dir, { recursive: true });

  const ps1 = [
    "$homeDir = Join-Path $env:APPDATA 'mop-flow'",
    'New-Item -ItemType Directory -Force -Path $homeDir | Out-Null',
    "$log = Join-Path $homeDir 'relay.log'",
    '$cmd = "npx --yes mop-flow service run >> `"$log`" 2>&1"',
    "Start-Process -WindowStyle Hidden -FilePath 'cmd.exe' -ArgumentList @('/d','/c',$cmd)",
    ''
  ].join('\n');
  writeFileSync(launcherPath(), ps1, 'utf8');

  const cmd = [
    '@echo off',
    `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${launcherPath()}"`,
    ''
  ].join('\r\n');
  writeFileSync(startupCmdPath(), cmd, 'utf8');
  return { installed: true, startupPath: startupCmdPath(), launcherPath: launcherPath(), logPath: logPath() };
}

function uninstallWindowsAutostart() {
  const removed = [];
  for (const path of [startupCmdPath(), launcherPath()].filter(Boolean)) {
    if (existsSync(path)) {
      rmSync(path, { force: true });
      removed.push(path);
    }
  }
  return { removed };
}

function isAutostartInstalled() {
  if (platform() === 'win32') return !!startupCmdPath() && existsSync(startupCmdPath());
  if (platform() === 'linux') return !!systemdUnitPath() && existsSync(systemdUnitPath());
  return false;
}

function runSystemctl(args) {
  return spawnSync('systemctl', ['--user', ...args], {
    encoding: 'utf8',
    windowsHide: true
  });
}

function installLinuxAutostart() {
  const dir = systemdUserDir();
  if (!dir) throw new Error('linux_systemd_user_unavailable');
  mkdirSync(serviceHome(), { recursive: true });
  mkdirSync(dir, { recursive: true });

  const unitPath = systemdUnitPath();
  const unit = [
    '[Unit]',
    'Description=MOP Flow background relay service',
    'After=network-online.target',
    'Wants=network-online.target',
    '',
    '[Service]',
    'Type=simple',
    `Environment=MOP_FLOW_HOME=${serviceHome()}`,
    'WorkingDirectory=%h',
    'ExecStart=/usr/bin/env npx --yes mop-flow service run',
    'Restart=always',
    'RestartSec=5',
    '',
    '[Install]',
    'WantedBy=default.target',
    ''
  ].join('\n');
  writeFileSync(unitPath, unit, 'utf8');

  const daemonReload = runSystemctl(['daemon-reload']);
  const enable = runSystemctl(['enable', '--now', 'mop-flow-relay.service']);
  const systemctlOk = daemonReload.status === 0 && enable.status === 0;
  return {
    installed: true,
    unitPath,
    logPath: logPath(),
    systemctlOk,
    note: systemctlOk ? null : 'systemctl --user failed; service file was written, run `systemctl --user enable --now mop-flow-relay.service` manually'
  };
}

function uninstallLinuxAutostart() {
  const removed = [];
  const unitPath = systemdUnitPath();
  if (unitPath && existsSync(unitPath)) {
    runSystemctl(['disable', '--now', 'mop-flow-relay.service']);
    rmSync(unitPath, { force: true });
    runSystemctl(['daemon-reload']);
    removed.push(unitPath);
  }
  return { removed };
}

function installAutostart() {
  if (platform() === 'win32') return installWindowsAutostart();
  if (platform() === 'linux') return installLinuxAutostart();
  return {
    installed: false,
    note: 'autostart_install_supported_on_windows_and_linux; run `npx mop-flow service run` under your OS service manager'
  };
}

function uninstallAutostart() {
  if (platform() === 'win32') return uninstallWindowsAutostart();
  if (platform() === 'linux') return uninstallLinuxAutostart();
  return { removed: [] };
}

function startDetachedService() {
  const child = spawn(process.execPath, [resolve(here, 'mop-flow.mjs'), 'service', 'run'], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
  return { started: true, pid: child.pid };
}

function renderList(registry, args) {
  const installed = isAutostartInstalled();
  if (asJson(args)) {
    console.log(JSON.stringify({
      ok: true,
      installed,
      registryPath: registryPath(),
      logPath: logPath(),
      projects: registry.projects
    }, null, 2));
    return;
  }
  console.log(`MOP Flow service: ${installed ? 'autostart installed' : 'autostart not installed'}`);
  console.log(`Registry: ${registryPath()}`);
  if (!registry.projects.length) {
    console.log('No projects registered yet.');
    return;
  }
  for (const project of registry.projects) {
    const state = project.enabled === false ? 'disabled' : 'enabled';
    console.log(`- ${project.name} (${project.projectId}) ${state}`);
    console.log(`  ${project.rootDir}`);
  }
}

async function runDaemon(args) {
  const active = new Map();
  const intervalMs = Number(args.interval || args['interval-ms'] || 30_000);
  const log = (message) => {
    if (args.quiet === true) return;
    console.log(`[mop-flow service] ${message}`);
  };

  const sync = async () => {
    const registry = readRegistry();
    const wanted = new Set();
    for (const project of registry.projects) {
      const coreDir = resolve(project.coreDir);
      if (project.enabled === false) continue;
      wanted.add(coreDir);
      if (active.has(coreDir)) continue;
      if (!existsSync(join(coreDir, 'link.json'))) {
        log(`skip ${project.name}: missing .MOP/link.json`);
        continue;
      }
      try {
        project.lastStartedAt = now();
        project.updatedAt = now();
        writeRegistry(registry);
        const handle = await startRelay(coreDir, {
          label: project.name || project.projectId,
          logger: (line) => log(`[${project.name || project.projectId}] ${line}`)
        });
        active.set(coreDir, handle);
      } catch (error) {
        log(`failed ${project.name}: ${error.message}`);
      }
    }
    for (const [coreDir, handle] of active) {
      if (!wanted.has(coreDir)) {
        handle.stop();
        active.delete(coreDir);
      }
    }
  };

  process.on('SIGINT', () => {
    for (const handle of active.values()) handle.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    for (const handle of active.values()) handle.stop();
    process.exit(0);
  });

  log(`started; registry=${registryPath()}`);
  await sync();
  setInterval(() => { sync().catch((error) => log(`sync_error: ${error.message}`)); }, intervalMs);
}

function outputResult(result, args, human) {
  if (asJson(args)) console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  else console.log(human(result));
}

export async function runService(args = {}) {
  const action = String(args._?.[0] || 'list');
  try {
    if (action === 'run') return runDaemon(args);
    if (action === 'register') {
      const result = registerProject(args['core-dir'] || args.project || resolveCoreDir());
      return outputResult(result, args, (r) => `registered: ${r.entry.name} (${r.entry.projectId})\nregistry: ${r.registryPath}`);
    }
    if (action === 'unregister') {
      const result = unregisterProject(args);
      return outputResult(result, args, (r) => `unregistered projects: ${r.removed}`);
    }
    if (action === 'enable') {
      const result = setProjectEnabled(args, true);
      return outputResult(result, args, (r) => `enabled: ${r.entry.name}`);
    }
    if (action === 'disable') {
      const result = setProjectEnabled(args, false);
      return outputResult(result, args, (r) => `disabled: ${r.entry.name}`);
    }
    if (action === 'install') {
      let registered = null;
      try { registered = registerProject(args['core-dir'] || args.project || resolveCoreDir()); } catch {}
      const installed = installAutostart();
      const started = args.start ? startDetachedService() : null;
      return outputResult({ ...installed, registered: registered?.entry || null, started }, args, (r) => {
        const lines = ['MOP Flow relay autostart installed.'];
        if (r.registered) lines.push(`registered: ${r.registered.name} (${r.registered.projectId})`);
        if (r.startupPath) lines.push(`startup: ${r.startupPath}`);
        if (r.unitPath) lines.push(`systemd: ${r.unitPath}`);
        if (r.logPath) lines.push(`log: ${r.logPath}`);
        if (r.started) lines.push(`started now: pid ${r.started.pid}`);
        if (r.note) lines.push(r.note);
        return lines.join('\n');
      });
    }
    if (action === 'uninstall') {
      const result = uninstallAutostart();
      return outputResult(result, args, (r) => `removed autostart files: ${r.removed.length}`);
    }
    if (action === 'start') {
      const result = startDetachedService();
      return outputResult(result, args, (r) => `MOP Flow service started in background: pid ${r.pid}`);
    }
    if (action === 'status' || action === 'list') {
      return renderList(readRegistry(), args);
    }

    console.log(`Usage:
  npx mop-flow service install [--start]
  npx mop-flow service start
  npx mop-flow service run
  npx mop-flow service list [--json]
  npx mop-flow service register [--json]
  npx mop-flow service enable|disable
  npx mop-flow service unregister
  npx mop-flow service uninstall`);
  } catch (error) {
    if (asJson(args)) console.log(JSON.stringify({ ok: false, error: error.message }, null, 2));
    else console.error(`x ${error.message}`);
    process.exitCode = 1;
  }
}

if (resolve(process.argv[1] || '') === resolve(fileURLToPath(import.meta.url))) {
  const args = { _: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) { args._.push(item); continue; }
    const [key, inline] = item.slice(2).split('=', 2);
    if (inline !== undefined) args[key] = inline;
    else if (!argv[i + 1] || argv[i + 1].startsWith('--')) args[key] = true;
    else args[key] = argv[(i += 1)];
  }
  runService(args);
}
