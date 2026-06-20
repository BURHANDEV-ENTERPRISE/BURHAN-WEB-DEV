#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const coreDir = resolve(here, '..');
const rootDir = resolve(coreDir, '..');
const manifestPath = join(coreDir, 'flow', 'skill-manifest.json');

function now() {
  return new Date().toISOString();
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

function asJson(args) {
  return args.json === true || args.format === 'json';
}

function readText(path, fallback = '') {
  if (!existsSync(path)) return fallback;
  return readFileSync(path, 'utf8');
}

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readText(path, ''));
  } catch {
    return fallback;
  }
}

function rel(path) {
  return path.replace(rootDir, '').replace(/^[\\/]/, '').replaceAll('\\', '/');
}

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripQuotes(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end < 0) return {};
  const block = text.slice(3, end).trim();
  const data = {};
  const lines = block.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const match = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (value === '|' || value === '>' || value === '|-' || value === '>-') {
      const parts = [];
      while (lines[i + 1] && (/^\s+/.test(lines[i + 1]) || !lines[i + 1].trim())) {
        i += 1;
        const part = lines[i].trim();
        if (part) parts.push(part);
      }
      data[key] = parts.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      data[key] = stripQuotes(value);
    }
  }
  return data;
}

function firstHeading(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function listSkillFiles(directory, source) {
  const dir = join(rootDir, directory);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillPath = join(dir, entry.name, 'SKILL.md');
      if (!existsSync(skillPath)) return null;
      const text = readText(skillPath);
      const frontmatter = parseFrontmatter(text);
      const title = stripQuotes(frontmatter.name) || firstHeading(text) || entry.name;
      const id = slug(frontmatter.name || entry.name);
      return {
        id,
        folder: entry.name,
        title,
        description: stripQuotes(frontmatter.description) || '',
        source,
        path: rel(skillPath)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function fileStatus(path) {
  const absolute = join(rootDir, path);
  if (!existsSync(absolute)) return { exists: false, type: 'missing' };
  return {
    exists: true,
    type: statSync(absolute).isDirectory() ? 'dir' : 'file'
  };
}

function configMentions(path, pattern) {
  const text = readText(join(rootDir, path));
  return pattern.test(text);
}

function providerMatrix(portableSkills, runtimeSkills) {
  const bridgedSkillCount = new Set([...portableSkills, ...runtimeSkills].map((skill) => skill.id)).size;
  return [
    {
      id: 'claude',
      entrypoint: 'CLAUDE.md',
      config: '.claude/settings.json',
      nativeSkillDir: '.claude/skills',
      portableSkillDir: '.agents/skills',
      mcpServer: 'mop-flow',
      runtimeCommand: 'npx -y ruflo@latest mcp start',
      skillAccess: {
        native: runtimeSkills.length,
        portable: portableSkills.length,
        bridged: bridgedSkillCount
      },
      status: {
        entrypoint: fileStatus('CLAUDE.md'),
        config: fileStatus('.claude/settings.json'),
        mcpRegistered: configMentions('.mcp.json', /"mop-flow"/)
      }
    },
    {
      id: 'codex',
      entrypoint: 'AGENTS.md',
      config: '.codex/config.toml',
      nativeSkillDir: '.agents/skills',
      bridgedFrom: '.claude/skills',
      mcpServer: 'mop-flow',
      runtimeCommand: 'npx -y ruflo@latest mcp start',
      skillAccess: {
        native: portableSkills.length,
        portable: portableSkills.length,
        bridged: bridgedSkillCount
      },
      status: {
        entrypoint: fileStatus('AGENTS.md'),
        config: fileStatus('.codex/config.toml'),
        mcpRegistered: configMentions('.codex/config.toml', /\[mcp_servers\."mop-flow"\]/)
      }
    },
    {
      id: 'gemini',
      entrypoint: 'GEMINI.md',
      config: '.gemini/settings.json',
      nativeSkillDir: '.agents/skills',
      bridgedFrom: '.claude/skills',
      mcpServer: 'mop-flow',
      runtimeCommand: 'npx -y ruflo@latest mcp start',
      skillAccess: {
        native: portableSkills.length,
        portable: portableSkills.length,
        bridged: bridgedSkillCount
      },
      status: {
        entrypoint: fileStatus('GEMINI.md'),
        config: fileStatus('.gemini/settings.json'),
        mcpRegistered: configMentions('.gemini/settings.json', /"mop-flow"/)
      }
    },
    {
      id: 'antigravity',
      entrypoint: '.agents/AGENTS.md',
      config: '.agents/AGENTS.md',
      nativeSkillDir: '.agents/skills',
      bridgedFrom: '.claude/skills',
      mcpServer: 'mop-flow',
      runtimeCommand: 'npx -y ruflo@latest mcp start',
      skillAccess: {
        native: portableSkills.length,
        portable: portableSkills.length,
        bridged: bridgedSkillCount
      },
      status: {
        entrypoint: fileStatus('.agents/AGENTS.md'),
        config: fileStatus('.agents/AGENTS.md'),
        mcpRegistered: configMentions('AGENTS.md', /mop-flow/)
      }
    }
  ];
}

function mergeSkills(portableSkills, runtimeSkills) {
  const byId = new Map();
  for (const skill of [...portableSkills, ...runtimeSkills]) {
    const current = byId.get(skill.id);
    if (!current) {
      byId.set(skill.id, {
        id: skill.id,
        title: skill.title,
        description: skill.description,
        sources: [skill.source],
        paths: [skill.path],
        portable: skill.source === 'portable',
        runtimeNative: skill.source === 'claude-native'
      });
      continue;
    }
    if (!current.sources.includes(skill.source)) current.sources.push(skill.source);
    if (!current.paths.includes(skill.path)) current.paths.push(skill.path);
    current.portable ||= skill.source === 'portable';
    current.runtimeNative ||= skill.source === 'claude-native';
    if (!current.description && skill.description) current.description = skill.description;
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function buildManifest() {
  const portableSkills = listSkillFiles('.agents/skills', 'portable');
  const runtimeSkills = listSkillFiles('.claude/skills', 'claude-native');
  const skills = mergeSkills(portableSkills, runtimeSkills);
  const state = readJson(join(coreDir, 'STATE.json'), {});
  return {
    schemaVersion: '0.1.0',
    generatedAt: now(),
    brand: {
      name: 'MOP Flow',
      ownerSystem: 'MOP',
      canonicalRule: 'Use MOP Flow as the user-facing name. Treat Ruflo and Claude Flow as upstream runtime compatibility names only.'
    },
    runtime: {
      canonicalMcpServer: 'mop-flow',
      upstreamPackage: 'ruflo@latest',
      compatibilityEnvPrefix: 'CLAUDE_FLOW_',
      command: 'npx -y ruflo@latest mcp start',
      notes: [
        'MOP Flow owns provider routing, memory gates, skills, and workflow policy.',
        'Ruflo/Claude Flow powers selected runtime capabilities underneath MOP Flow.'
      ]
    },
    providers: providerMatrix(portableSkills, runtimeSkills),
    skillCatalog: {
      total: skills.length,
      portableCount: portableSkills.length,
      runtimeNativeCount: runtimeSkills.length,
      bridgedCount: skills.length,
      portableDirectory: '.agents/skills',
      runtimeNativeDirectory: '.claude/skills',
      skills
    },
    operatingRules: [
      'Read .MOP/STATE.json and .MOP/PROTOCOL.md before provider-specific behavior.',
      'Use .agents/skills as the canonical portable skill surface.',
      'When a skill exists only in .claude/skills, bridge it through this manifest and translate Claude-only tools into the current provider surface.',
      'Prefer the mop-flow MCP server name; keep CLAUDE_FLOW_* env vars only for upstream runtime compatibility.',
      'Do not let provider-specific instructions override MOP auth, agent routing, memory, readiness, or autosycn rules.'
    ],
    stateSummary: {
      initialized: Boolean(state.initialized),
      projectName: state.projectName || null,
      activeMember: state.activeMember || null
    }
  };
}

function renderStatus(manifest) {
  console.log('MOP Flow status');
  console.log(`Brand: ${manifest.brand.name}`);
  console.log(`MCP server: ${manifest.runtime.canonicalMcpServer}`);
  console.log(`Skills: ${manifest.skillCatalog.bridgedCount} bridged (${manifest.skillCatalog.portableCount} portable, ${manifest.skillCatalog.runtimeNativeCount} runtime-native)`);
  console.log('');
  console.log('Providers');
  for (const provider of manifest.providers) {
    const ready = provider.status.entrypoint.exists && provider.status.config.exists && provider.status.mcpRegistered;
    console.log(`- ${provider.id}: ${ready ? 'ready' : 'needs-check'}; bridged skills=${provider.skillAccess.bridged}; mcp=${provider.mcpServer}`);
  }
}

function status(args) {
  const manifest = buildManifest();
  if (asJson(args)) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }
  renderStatus(manifest);
}

function manifestPrint(args) {
  const manifest = existsSync(manifestPath) ? readJson(manifestPath, buildManifest()) : buildManifest();
  if (asJson(args)) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }
  renderStatus(manifest);
}

function manifestRefresh(args) {
  const manifest = buildManifest();
  mkdirSync(dirname(manifestPath), { recursive: true });
  const tmp = `${manifestPath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  renameSync(tmp, manifestPath);
  if (asJson(args)) {
    console.log(JSON.stringify({ ok: true, path: rel(manifestPath), manifest }, null, 2));
    return;
  }
  console.log(`MOP Flow manifest refreshed: ${rel(manifestPath)}`);
  renderStatus(manifest);
}

function skillsList(args) {
  const manifest = buildManifest();
  if (asJson(args)) {
    console.log(JSON.stringify(manifest.skillCatalog, null, 2));
    return;
  }
  for (const skill of manifest.skillCatalog.skills) {
    console.log(`${skill.id} [${skill.sources.join(', ')}] - ${skill.title}`);
  }
}

function providers(args) {
  const manifest = buildManifest();
  if (asJson(args)) {
    console.log(JSON.stringify(manifest.providers, null, 2));
    return;
  }
  for (const provider of manifest.providers) {
    console.log(`${provider.id}: entry=${provider.entrypoint}; config=${provider.config}; mcp=${provider.mcpServer}; bridgedSkills=${provider.skillAccess.bridged}`);
  }
}

function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs[0] : 'tui';
  if (command === 'tui') {
    import('./mop-tui.mjs').then(m => m.startTui());
    return;
  }
  if (['install', 'doctor', 'package'].includes(command)) {
    import('./burhan-mop.mjs');
    return;
  }
  const afterCommand = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs.slice(1) : rawArgs;
  const subcommand = afterCommand[0] && !afterCommand[0].startsWith('--') ? afterCommand[0] : undefined;
  const rest = subcommand ? afterCommand.slice(1) : afterCommand;
  const args = parseArgs(rest);
  if (command === 'status') return status(args);
  if (command === 'providers') return providers(args);
  if (command === 'skills' && (!subcommand || subcommand === 'list')) return skillsList(args);
  if (command === 'manifest' && (!subcommand || subcommand === 'print')) return manifestPrint(args);
  if (command === 'manifest' && subcommand === 'refresh') return manifestRefresh(args);
  if (command === 'bridge' && (!subcommand || subcommand === 'status')) return status(args);
  if (command === 'bridge' && subcommand === 'refresh') return manifestRefresh(args);

  console.log(`Usage:
  node .MOP/scripts/mop-flow.mjs [tui]
  node .MOP/scripts/mop-flow.mjs status [--json]
  node .MOP/scripts/mop-flow.mjs providers [--json]
  node .MOP/scripts/mop-flow.mjs skills list [--json]
  node .MOP/scripts/mop-flow.mjs manifest print [--json]
  node .MOP/scripts/mop-flow.mjs manifest refresh [--json]
  node .MOP/scripts/mop-flow.mjs bridge status [--json]
  node .MOP/scripts/mop-flow.mjs bridge refresh [--json]`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
