#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const coreDir = resolve(here, '..');
const rootDir = resolve(coreDir, '..');
const statePath = join(coreDir, 'STATE.json');

function now() {
  return new Date().toISOString();
}

function readState() {
  return JSON.parse(readFileSync(statePath, 'utf8'));
}

function writeState(state) {
  mkdirSync(coreDir, { recursive: true });
  const tmp = `${statePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tmp, statePath);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      out._.push(item);
      continue;
    }
    const key = item.slice(2);
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

function requireArg(args, key) {
  const value = args[key];
  if (!value || value === true) {
    throw new Error(`Missing --${key}`);
  }
  return String(value);
}

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, passwordSalt: salt };
}

function verifyPassword(password, salt, expectedHex) {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function activeAgentFor(state, actor) {
  const activeId = state.activeAgents?.[actor];
  if (!activeId) return null;
  const agent = (state.agentRoster || []).find((item) => item.id === activeId || item.name === activeId);
  if (!agent || !(agent.owners || []).includes(actor)) return null;
  return agent;
}

function agentLedgerFields(agent) {
  return agent ? {
    agent: agent.name,
    agentRole: agent.role,
    agentId: agent.id
  } : {};
}

function requireActiveAgent(state, actor, role = 'core', title = 'Core Agent') {
  const agent = activeAgentFor(state, actor);
  if (agent) return agent;
  throw new Error([
    `Agent diperlukan sebelum sambung kerja untuk ${actor}.`,
    `Task ini perlukan ${title}. Agent ini belum ada nama lagi atau belum dipilih.`,
    `Jalankan: node .MOP/scripts/mop-core.mjs agent activate --actor ${actor} --role ${role} --title "${title}" --name "<agent-name>"`
  ].join(' '));
}

function appendLedger(state, actor, kind, summary, agent = activeAgentFor(state, actor)) {
  state.ledger ||= [];
  state.ledger.push({ at: now(), actor, ...agentLedgerFields(agent), kind, summary });
}

const routeRules = [
  {
    role: 'memory',
    support: ['researcher'],
    keywords: ['memory', 'memori', 'ingat', 'recall', 'search', 'cari semula', 'journal', 'ledger', 'history', 'sejarah']
  },
  {
    role: 'github',
    support: ['reviewer'],
    keywords: ['github', 'git', 'branch', 'merge', 'megre', 'commit', 'push', 'pull', 'pr', 'repo', 'repository', 'autosycn', 'autosync']
  },
  {
    role: 'deploy',
    support: ['devops', 'github'],
    keywords: ['deploy', 'deployment', 'vercel', 'docker', 'github pages', 'github actions', 'hosting', 'release']
  },
  {
    role: 'security',
    support: ['architect', 'reviewer'],
    keywords: ['security', 'secure', 'auth', 'login', 'password', 'token', 'secret', 'permission', 'role', 'akses', 'encrypt', 'api key']
  },
  {
    role: 'performance',
    support: ['architect', 'coder'],
    keywords: ['performance', 'slow', 'lambat', 'speed', 'optimize', 'latency', 'memory leak', 'bundle', 'cache']
  },
  {
    role: 'database',
    support: ['backend', 'architect'],
    keywords: ['database', 'db', 'schema', 'migration', 'sql', 'postgres', 'mysql', 'sqlite', 'prisma', 'query']
  },
  {
    role: 'backend',
    support: ['database', 'security', 'tester'],
    keywords: ['backend', 'api', 'server', 'endpoint', 'route', 'auth api', 'middleware', 'webhook', 'integration']
  },
  {
    role: 'frontend',
    support: ['design', 'ux', 'tester'],
    keywords: ['frontend', 'ui', 'react', 'next', 'vue', 'css', 'tailwind', 'component', 'page', 'browser', 'dashboard']
  },
  {
    role: 'mobile',
    support: ['ux', 'backend'],
    keywords: ['mobile', 'android', 'ios', 'react native', 'flutter', 'pwa']
  },
  {
    role: 'design',
    support: ['ux', 'frontend'],
    keywords: ['design', 'ui/ux', 'layout', 'figma', 'wireframe', 'visual', 'color', 'theme', 'responsive']
  },
  {
    role: 'ux',
    support: ['planner', 'design'],
    keywords: ['ux', 'user flow', 'persona', 'journey', 'usability', 'pengguna', 'flow']
  },
  {
    role: 'tester',
    support: ['reviewer'],
    keywords: ['test', 'testing', 'bug', 'error', 'fix', 'regression', 'playwright', 'vitest', 'jest', 'qa']
  },
  {
    role: 'reviewer',
    support: ['security', 'tester'],
    keywords: ['review', 'semak', 'audit', 'check', 'validate', 'risk', 'risiko', 'quality']
  },
  {
    role: 'docs',
    support: ['prompt'],
    keywords: ['docs', 'documentation', 'readme', 'guide', 'manual', 'changelog', 'spec', 'tulis']
  },
  {
    role: 'prompt',
    support: ['architect', 'docs'],
    keywords: ['prompt', 'prompts', 'copy to prompts', 'ai prompt', 'system prompt', 'agent prompt', 'chatgpt', 'claude', 'gemini']
  },
  {
    role: 'architect',
    support: ['planner', 'researcher', 'coder', 'reviewer'],
    keywords: ['system', 'architecture', 'architect', 'platform', 'workflow', 'engine', 'core', 'framework', 'template', 'buat sebuah system', 'bina system']
  },
  {
    role: 'planner',
    support: ['architect', 'researcher'],
    keywords: ['plan', 'roadmap', 'scope', 'idea', 'konsep', 'feature', 'requirement', 'mvp', 'project']
  },
  {
    role: 'coder',
    support: ['tester', 'reviewer'],
    keywords: ['code', 'coding', 'implement', 'buat file', 'ubah file', 'fix code', 'script', 'function']
  },
  {
    role: 'researcher',
    support: ['planner'],
    keywords: ['research', 'kaji', 'compare', 'pilih', 'cari info', 'best practice']
  }
];

function catalogForRole(state, role) {
  return (state.agentCatalog || []).find((item) => item.role === role) || {
    role,
    title: role.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  };
}

function ownedAgentForRole(state, actor, role) {
  return (state.agentRoster || []).find((agent) => agent.role === role && (agent.owners || []).includes(actor)) || null;
}

function routeScore(task, rule) {
  return rule.keywords.reduce((score, keyword) => task.includes(keyword) ? score + Math.max(1, keyword.split(/\s+/).length) : score, 0);
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function maybeLimit(values, limit) {
  if (limit === null || limit === undefined || limit === '' || limit === 'unlimited') return values;
  const numeric = Number(limit);
  if (!Number.isFinite(numeric) || numeric < 1) return values;
  return values.slice(0, numeric);
}

function shouldActivatePartyMode(state, task, primaryRole, supportRoles, newSystemIntent) {
  if (state.partyMode?.enabled === false || state.partyMode?.autoActivateWhenNeeded === false) return false;
  const multiDomainIntent = [
    ['ui', 'backend'],
    ['frontend', 'backend'],
    ['design', 'api'],
    ['database', 'api'],
    ['deploy', 'github'],
    ['security', 'auth'],
    ['prompt', 'system']
  ].some(([first, second]) => task.includes(first) && task.includes(second));
  const connectiveIntent = /\b(connect|connected|integrate|integration|bersambung|sambung|hubung|flow|workflow)\b/.test(task);
  const broadBuild = newSystemIntent && supportRoles.length >= 2;
  const specialistStack = supportRoles.length >= 3 && ['architect', 'planner', 'core'].includes(primaryRole);
  return multiDomainIntent || connectiveIntent || broadBuild || specialistStack;
}

function partyFormat(state) {
  const format = state.partyMode?.format || {};
  return {
    banner: format.banner || state.partyMode?.banner || 'PARTY MODE',
    agentToAgent: format.agentToAgent || 'agent: <from-name> (<from-role>) to agent: <to-name> (<to-role>)',
    agentToUser: format.agentToUser || 'agent: <from-name> (<from-role>) to <user>',
    explanation: format.explanation || 'agent: <from-name> (<from-role>)',
    messageIndent: format.messageIndent || '          ',
    blankLineBeforeMessage: format.blankLineBeforeMessage !== false
  };
}

function partyParticipantsFor(state, primaryRole, supportRoles, scored, partyActive) {
  if (!partyActive) return [];
  const preferredMinimum = Number(state.partyMode?.preferredMinimumParticipants || 4);
  const minimum = Number(state.partyMode?.minimumParticipants || 3);
  const floor = Number.isFinite(preferredMinimum) ? Math.max(minimum, preferredMinimum) : minimum;
  const fallbackRoles = ['planner', 'researcher', 'reviewer', 'coder', 'architect', 'prompt', 'tester'];
  const participants = uniqueValues([
    primaryRole,
    ...supportRoles,
    ...scored.map((rule) => rule.role),
    ...fallbackRoles
  ]);
  const catalogRoles = new Set((state.agentCatalog || []).map((item) => item.role));
  const filtered = participants.filter((role) => catalogRoles.has(role));
  const enough = filtered.length >= floor ? filtered : participants;
  return maybeLimit(enough, state.partyMode?.participantLimit);
}

function inferAgentRoute(state, taskText) {
  const task = taskText.toLowerCase();
  const words = task.split(/\s+/).filter(Boolean);
  const scored = routeRules
    .map((rule) => ({ ...rule, score: routeScore(task, rule) }))
    .filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score);

  const newSystemIntent = /\b(system|sistem|app|tool|platform|website|dashboard|engine|core)\b/.test(task)
    || /buat sebuah|bina sebuah|create a|build a/.test(task);
  const implementationIntent = /\b(code|coding|implement|fix|ubah file|buat file)\b/.test(task);
  const top = scored[0];
  let primaryRole = top?.role || state.agentPolicy?.defaultRole || 'core';

  if (newSystemIntent && !implementationIntent && state.agentRouter?.preferHighReasoningForNewSystems !== false) {
    primaryRole = state.agentRouter?.defaultHighReasoningRole || 'architect';
  }

  const primary = catalogForRole(state, primaryRole);
  const baseSupport = newSystemIntent
    ? ['planner', 'researcher', 'prompt', 'coder', 'reviewer']
    : (top?.support || []);
  const supportRoles = maybeLimit(uniqueValues([
    ...baseSupport,
    ...scored.slice(1).map((rule) => rule.role)
  ])
    .filter((role) => role !== primaryRole), state.agentRouter?.supportAgentLimit);
  const partyActive = shouldActivatePartyMode(state, task, primaryRole, supportRoles, newSystemIntent);
  const partyParticipants = partyParticipantsFor(state, primaryRole, supportRoles, scored, partyActive);

  const ambiguousNewSystem = newSystemIntent && words.length < 18;
  const noClearMatch = scored.length === 0 && words.length > 3;
  const needsClarification = state.agentRouter?.clarifyBeforeActionWhenAmbiguous !== false
    && (ambiguousNewSystem || noClearMatch || /\b(maybe|mungkin|lebih kurang|macam)\b/.test(task));

  const questions = needsClarification ? [
    'Apa tujuan utama system ini dan masalah apa yang dia selesaikan?',
    'Siapa pengguna utama system ini?',
    'Output wajib apa yang awak nak lihat dulu: plan, UI, repo/file, atau prompt template?'
  ] : [];

  return {
    task: taskText,
    primaryRole,
    primaryTitle: primary.title,
    supportRoles,
    partyMode: {
      active: partyActive,
      banner: partyActive && state.partyMode?.bannerRequired !== false ? (state.partyMode?.banner || 'PARTY MODE') : '',
      participants: partyActive ? partyParticipants : [],
      minimumParticipants: state.partyMode?.minimumParticipants || 3,
      preferredMinimumParticipants: state.partyMode?.preferredMinimumParticipants || 4,
      visibleToUser: state.partyMode?.showAgentDialogueToUser !== false,
      format: partyFormat(state),
      reason: partyActive
        ? 'Task needs several specialist agents to reason together before the primary agent answers the user.'
        : 'Single-agent route is enough for this task.'
    },
    confidence: top ? Math.min(0.95, 0.45 + (top.score * 0.08)) : 0.35,
    needsClarification,
    questions,
    reason: newSystemIntent
      ? `New or broad system task routed to ${primary.title} for high-reasoning planning before implementation.`
      : top
        ? `Matched keywords for ${primary.title}: ${top.keywords.filter((keyword) => task.includes(keyword)).join(', ')}.`
        : `No strong specialist match; using ${primary.title}.`
  };
}

function setup(args) {
  const state = readState();
  if (state.initialized) {
    throw new Error('MOP already initialized.');
  }

  const folderDefault = rootDir.split(/[\\/]/).filter(Boolean).pop() || 'MOP';
  const projectName = String(args['project-name'] || folderDefault);
  const displayName = requireArg(args, 'name');
  const codename = slug(requireArg(args, 'codename'));
  const password = requireArg(args, 'password');
  const mode = requireArg(args, 'mode').toLowerCase();
  const conversationLanguage = String(args['conversation-language'] || 'Melayu');
  const codingLanguage = String(args['coding-language'] || 'English');
  const githubUrl = String(args['github-url'] || '');
  const gitName = String(args['git-name'] || displayName);
  const gitEmail = String(args['git-email'] || '');
  const githubUsername = String(args['github-username'] || '');
  const joinMode = String(args['join-mode'] || 'owner-approved');

  if (codename.length < 2) throw new Error('Codename too short.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (!['solo', 'team'].includes(mode)) throw new Error('Mode must be solo or team.');
  if (mode === 'team' && !githubUrl) throw new Error('Team mode requires --github-url.');
  if (state.autosync?.requireUserGitEmail !== false && !gitEmail) {
    throw new Error('Git email is required so commits are attributed to the real user, not the AI tool.');
  }
  if (!['open', 'owner-approved', 'invite'].includes(joinMode)) {
    throw new Error('Join mode must be open, owner-approved, or invite.');
  }

  const { passwordHash, passwordSalt } = hashPassword(password);
  state.initialized = true;
  state.projectName = projectName;
  state.projectNameDefault = folderDefault;
  state.ownerCodename = codename;
  state.activeMember = codename;
  state.activeAgents ||= {};
  state.agentPolicy ||= {
    requiredAfterAuth: true,
    requireForEveryConversation: true,
    defaultRole: 'core',
    defaultTitle: 'Core Agent',
    gateOrder: 'AUTH_GATE_THEN_AGENT_ROUTER_THEN_AGENT_GATE_THEN_ACTION'
  };
  state.mode = mode;
  state.joinMode = mode === 'team' ? joinMode : 'owner-approved';
  state.githubUrl = githubUrl;
  state.members = {
    [codename]: {
      codename,
      displayName,
      role: 'owner',
      passwordHash,
      passwordSalt,
      languagePreferences: {
        conversation: conversationLanguage,
        coding: codingLanguage
      },
      gitIdentity: {
        name: gitName,
        email: gitEmail,
        githubUsername
      },
      joinedAt: now()
    }
  };
  appendLedger(state, codename, 'setup', `Initialized ${projectName} in ${mode} mode.`);
  writeState(state);
  console.log(`MOP initialized. Owner ${displayName} (${codename}) is active.`);
}

function login(args) {
  const state = readState();
  const codename = slug(requireArg(args, 'codename'));
  const password = requireArg(args, 'password');
  const member = state.members?.[codename];
  if (!member || !verifyPassword(password, member.passwordSalt, member.passwordHash)) {
    console.log('Credentials tidak sah.');
    process.exitCode = 1;
    return;
  }
  state.activeMember = codename;
  appendLedger(state, codename, 'login', 'Member authenticated.');
  writeState(state);
  console.log(`Active member: ${codename}`);
  if (!activeAgentFor(state, codename) && state.agentPolicy?.requiredAfterAuth !== false) {
    console.log(`Agent diperlukan. Jalankan: node .MOP/scripts/mop-core.mjs agent activate --actor ${codename} --role ${state.agentPolicy?.defaultRole || 'core'} --title "${state.agentPolicy?.defaultTitle || 'Core Agent'}" --name "<agent-name>"`);
  }
}

function agentActivate(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = slug(requireArg(args, 'actor'));
  if (!state.members?.[actor]) throw new Error('Unknown actor.');

  const role = slug(requireArg(args, 'role'));
  const title = String(args.title || role);
  const name = requireArg(args, 'name').trim();
  const key = name.toLowerCase();
  state.agentRoster ||= [];
  state.activeAgents ||= {};

  let agent = state.agentRoster.find((item) => item.name.toLowerCase() === key);
  if (agent) {
    agent.owners ||= [];
    if (!agent.owners.includes(actor)) agent.owners.push(actor);
    appendLedger(state, actor, 'agent-share', `${actor} joined agent ${agent.name}.`);
  } else {
    agent = {
      id: `agent-${slug(name)}`,
      role,
      title,
      name,
      owners: [actor],
      createdBy: actor,
      createdAt: now()
    };
    state.agentRoster.push(agent);
    appendLedger(state, actor, 'agent-activate', `Named ${title} as ${name}.`);
  }
  state.activeAgents[actor] = agent.id;
  appendLedger(state, actor, 'agent-use', `Set active agent to ${agent.name}.`, agent);
  writeState(state);
  console.log(`Agent active: ${agent.name} (${agent.role}) owners=${agent.owners.join(',')}`);
}

function agentUse(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = slug(requireArg(args, 'actor'));
  if (!state.members?.[actor]) throw new Error('Unknown actor.');
  const name = requireArg(args, 'name').trim();
  const agent = (state.agentRoster || []).find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!agent) throw new Error(`Unknown agent: ${name}`);
  if (!(agent.owners || []).includes(actor)) throw new Error(`${actor} does not own agent ${agent.name}.`);
  state.activeAgents ||= {};
  state.activeAgents[actor] = agent.id;
  appendLedger(state, actor, 'agent-use', `Set active agent to ${agent.name}.`, agent);
  writeState(state);
  console.log(`Active agent for ${actor}: ${agent.name} (${agent.role})`);
}

function agentCurrent(args) {
  const state = readState();
  const actor = slug(requireArg(args, 'actor'));
  const agent = activeAgentFor(state, actor);
  if (!agent) {
    console.log(`No active agent for ${actor}.`);
    process.exitCode = 2;
    return;
  }
  console.log(JSON.stringify({
    actor,
    agent: agent.name,
    role: agent.role,
    title: agent.title,
    id: agent.id
  }, null, 2));
}

function agentRequire(args) {
  const state = readState();
  const actor = slug(requireArg(args, 'actor'));
  const role = slug(String(args.role || state.agentPolicy?.defaultRole || 'core'));
  const title = String(args.title || state.agentPolicy?.defaultTitle || 'Core Agent');
  const agent = requireActiveAgent(state, actor, role, title);
  console.log(JSON.stringify({
    actor,
    agent: agent.name,
    role: agent.role,
    title: agent.title,
    id: agent.id
  }, null, 2));
}

function agentRoute(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  if (state.agentRouter?.enabled === false) throw new Error('Agent Router is disabled.');
  const actor = slug(requireArg(args, 'actor'));
  if (!state.members?.[actor]) throw new Error('Unknown actor.');
  const task = String(args.task || args._?.join(' ') || '').trim();
  if (!task) throw new Error('Missing --task');

  const route = inferAgentRoute(state, task);
  const agent = ownedAgentForRole(state, actor, route.primaryRole);
  const partyAgents = route.partyMode.active ? route.partyMode.participants.map((role) => {
    const catalog = catalogForRole(state, role);
    const owned = ownedAgentForRole(state, actor, role);
    return {
      role,
      title: catalog.title,
      name: owned?.name || null,
      id: owned?.id || null,
      missing: !owned
    };
  }) : [];
  const missingPartyAgents = partyAgents.filter((item) => item.missing);
  const response = {
    ok: Boolean(agent),
    actor,
    route,
    partyAgents,
    activeAgent: null,
    nextAction: null
  };

  if (agent) {
    state.activeAgents ||= {};
    state.activeAgents[actor] = agent.id;
    appendLedger(state, actor, 'agent-route', `Routed task to ${agent.name}: ${route.reason}`, agent);
    writeState(state);
    response.activeAgent = {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      title: agent.title
    };
    if (route.partyMode.active && missingPartyAgents.length) {
      response.ok = false;
      response.nextAction = 'name-required-party-agents';
      response.message = 'Party mode diperlukan, tetapi ada agent terlibat yang belum dinamakan.';
      response.missingAgentCommands = missingPartyAgents.map((item) => (
        `node .MOP/scripts/mop-core.mjs agent activate --actor ${actor} --role ${item.role} --title "${item.title}" --name "<agent-name>"`
      ));
    } else {
      response.nextAction = route.needsClarification ? 'ask-clarifying-questions' : 'proceed-with-agent';
    }
  } else {
    response.nextAction = 'name-required-agent';
    response.message = `Task ini perlukan ${route.primaryTitle}. Agent ini belum ada nama lagi atau belum dipilih.`;
    response.ask = `Beri nama untuk ${route.primaryTitle} kamu:`;
    response.command = `node .MOP/scripts/mop-core.mjs agent activate --actor ${actor} --role ${route.primaryRole} --title "${route.primaryTitle}" --name "<agent-name>"`;
    if (route.needsClarification) response.afterNaming = route.questions;
  }

  console.log(JSON.stringify(response, null, 2));
}

function agentList() {
  const state = readState();
  console.log(JSON.stringify({
    activeAgents: state.activeAgents || {},
    agents: state.agentRoster || []
  }, null, 2));
}

function memberGitIdentity(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = slug(requireArg(args, 'actor'));
  const member = state.members?.[actor];
  if (!member) throw new Error('Unknown actor.');
  const agent = requireActiveAgent(state, actor);
  const name = String(args.name || member.displayName || actor);
  const email = requireArg(args, 'email');
  const githubUsername = String(args['github-username'] || member.gitIdentity?.githubUsername || '');
  member.gitIdentity = { name, email, githubUsername };
  appendLedger(state, actor, 'git-identity', `Updated git identity for ${actor}.`, agent);
  writeState(state);
  console.log(`Git identity set for ${actor}: ${name} <${email}>${githubUsername ? ` github=${githubUsername}` : ''}`);
}

function validate() {
  const state = readState();
  const errors = [];
  if (typeof state.initialized !== 'boolean') errors.push('initialized must be boolean');
  if (!state.projectName) errors.push('projectName is required');
  if (!Array.isArray(state.agentRoster)) errors.push('agentRoster must be array');
  if (!Array.isArray(state.agentCatalog)) errors.push('agentCatalog must be array');
  if (state.activeAgents && typeof state.activeAgents !== 'object') errors.push('activeAgents must be object');
  if (state.agentPolicy && typeof state.agentPolicy !== 'object') errors.push('agentPolicy must be object');
  if (state.agentRouter && typeof state.agentRouter !== 'object') errors.push('agentRouter must be object');
  if (state.partyMode && typeof state.partyMode !== 'object') errors.push('partyMode must be object');
  if (state.projectRootPolicy && typeof state.projectRootPolicy !== 'object') errors.push('projectRootPolicy must be object');
  if (state.projectRootPolicy?.rules && !Array.isArray(state.projectRootPolicy.rules)) {
    errors.push('projectRootPolicy.rules must be array');
  }
  if (!Array.isArray(state.ledger)) errors.push('ledger must be array');
  const catalogRoles = new Set();
  for (const item of state.agentCatalog || []) {
    if (!item.role) errors.push('agentCatalog entry missing role');
    if (!item.title) errors.push(`agentCatalog ${item.role || '<unknown>'} missing title`);
    if (item.role && catalogRoles.has(item.role)) errors.push(`duplicate agentCatalog role: ${item.role}`);
    if (item.role) catalogRoles.add(item.role);
  }
  const routerRole = state.agentRouter?.defaultHighReasoningRole;
  if (routerRole && !catalogRoles.has(routerRole)) {
    errors.push(`agentRouter.defaultHighReasoningRole missing from agentCatalog: ${routerRole}`);
  }
  const defaultRole = state.agentPolicy?.defaultRole;
  if (defaultRole && !catalogRoles.has(defaultRole)) {
    errors.push(`agentPolicy.defaultRole missing from agentCatalog: ${defaultRole}`);
  }
  for (const phase of state.workflow?.phases || []) {
    if (!phase.id) errors.push('workflow phase missing id');
    if (phase.primaryRole && !catalogRoles.has(phase.primaryRole)) {
      errors.push(`workflow phase ${phase.id} primaryRole missing from agentCatalog: ${phase.primaryRole}`);
    }
    for (const role of phase.partyRoles || []) {
      if (!catalogRoles.has(role)) errors.push(`workflow phase ${phase.id} partyRole missing from agentCatalog: ${role}`);
    }
    if (phase.artifact && !(state.artifacts?.types || []).includes(phase.artifact)) {
      errors.push(`workflow phase ${phase.id} artifact missing from artifact types: ${phase.artifact}`);
    }
  }
  for (const type of state.artifacts?.types || []) {
    const templatePath = join(rootDir, state.artifacts?.templateDirectory || '.MOP/templates/artifacts', `${type}.md`);
    if (!existsSync(templatePath)) errors.push(`artifact template missing: ${templatePath}`);
    const folder = state.artifacts?.folderByType?.[type];
    if (state.artifacts?.folderByType && (!folder || typeof folder !== 'string')) {
      errors.push(`artifact folder missing for type: ${type}`);
    }
  }
  if (state.installer?.entrypoint && !existsSync(join(rootDir, state.installer.entrypoint))) {
    errors.push(`installer entrypoint missing: ${state.installer.entrypoint}`);
  }
  if (state.initialized) {
    if (!state.ownerCodename) errors.push('ownerCodename is required after setup');
    if (!state.members?.[state.ownerCodename]) errors.push('owner member missing');
    if (!['solo', 'team'].includes(state.mode)) errors.push('mode must be solo or team');
    if (state.mode === 'team' && !state.githubUrl) errors.push('team mode requires githubUrl');
    if (state.autosync?.requireUserGitEmail !== false) {
      for (const [codename, member] of Object.entries(state.members || {})) {
        if (!member.gitIdentity?.email && !member.github?.noreplyEmail) {
          errors.push(`member ${codename} is missing git identity email`);
        }
      }
    }
    for (const [codename, agentId] of Object.entries(state.activeAgents || {})) {
      const agent = (state.agentRoster || []).find((item) => item.id === agentId || item.name === agentId);
      if (!agent) errors.push(`active agent for ${codename} is missing from agentRoster`);
      if (agent && !(agent.owners || []).includes(codename)) errors.push(`active agent ${agent.name} does not include owner ${codename}`);
    }
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log('MOP state OK.');
}

function status() {
  const state = readState();
  console.log(JSON.stringify({
    initialized: state.initialized,
    projectName: state.projectName,
    activeMember: state.activeMember,
    activeAgents: Object.fromEntries(Object.entries(state.activeAgents || {}).map(([codename, agentId]) => {
      const agent = (state.agentRoster || []).find((item) => item.id === agentId || item.name === agentId);
      return [codename, agent ? { name: agent.name, role: agent.role, id: agent.id } : { id: agentId, missing: true }];
    })),
    agentPolicy: state.agentPolicy || {},
    agentRouter: state.agentRouter || {},
    partyMode: state.partyMode || {},
    workflow: {
      enabled: state.workflow?.enabled !== false,
      currentPhase: state.workflow?.currentPhase || null,
      phases: state.workflow?.phaseOrder || []
    },
    artifacts: state.artifacts || {},
    projectRootPolicy: state.projectRootPolicy || {},
    readinessGate: state.readinessGate || {},
    adversarialReview: state.adversarialReview || {},
    installer: state.installer || {},
    mode: state.mode,
    githubUrl: state.githubUrl,
    members: Object.keys(state.members || {}),
    agents: (state.agentRoster || []).map((agent) => ({
      name: agent.name,
      role: agent.role,
      owners: agent.owners
    })),
    autosync: {
      enabled: state.autosync?.enabled !== false,
      requireUserGitEmail: state.autosync?.requireUserGitEmail !== false
    },
    gitIdentities: Object.fromEntries(Object.entries(state.members || {}).map(([codename, member]) => [
      codename,
      {
        name: member.gitIdentity?.name || member.displayName || codename,
        email: member.gitIdentity?.email || member.github?.noreplyEmail || '',
        githubUsername: member.gitIdentity?.githubUsername || member.github?.username || ''
      }
    ]))
  }, null, 2));
}

function main() {
  if (!existsSync(statePath)) {
    throw new Error(`Missing state file: ${statePath}`);
  }
  const [command, subcommand, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (command === 'setup') return setup(parseArgs([subcommand, ...rest].filter(Boolean)));
  if (command === 'login') return login(parseArgs([subcommand, ...rest].filter(Boolean)));
  if (command === 'validate') return validate();
  if (command === 'status') return status();
  if (command === 'member' && subcommand === 'git-identity') return memberGitIdentity(args);
  if (command === 'agent' && subcommand === 'activate') return agentActivate(args);
  if (command === 'agent' && subcommand === 'use') return agentUse(args);
  if (command === 'agent' && subcommand === 'current') return agentCurrent(args);
  if (command === 'agent' && subcommand === 'require') return agentRequire(args);
  if (command === 'agent' && subcommand === 'route') return agentRoute(args);
  if (command === 'agent' && subcommand === 'list') return agentList();

  console.log(`Usage:
  node .MOP/scripts/mop-core.mjs status
  node .MOP/scripts/mop-core.mjs validate
  node .MOP/scripts/mop-core.mjs setup --project-name NAME --name DISPLAY --codename CODE --password PASS --mode solo|team --conversation-language LANG --coding-language LANG --git-email EMAIL [--git-name NAME] [--github-username USER] [--github-url URL]
  node .MOP/scripts/mop-core.mjs login --codename CODE --password PASS
  node .MOP/scripts/mop-core.mjs member git-identity --actor CODE --name NAME --email EMAIL [--github-username USER]
  node .MOP/scripts/mop-core.mjs agent activate --actor CODE --role ROLE --title TITLE --name NAME
  node .MOP/scripts/mop-core.mjs agent use --actor CODE --name NAME
  node .MOP/scripts/mop-core.mjs agent current --actor CODE
  node .MOP/scripts/mop-core.mjs agent require --actor CODE [--role ROLE] [--title TITLE]
  node .MOP/scripts/mop-core.mjs agent route --actor CODE --task "task text"
  node .MOP/scripts/mop-core.mjs agent list`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
