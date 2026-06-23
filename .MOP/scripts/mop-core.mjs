#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { piiScrub, outbound } from './mop-federation.mjs';

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

function sessionPolicy(state) {
  return state.sessionPolicy || {
    enabled: true,
    idleTimeoutMinutes: 60,
    requireLoginEveryNewChat: true,
    requireLoginAfterIdle: true
  };
}

function idleTimeoutMs(state) {
  const minutes = Number(sessionPolicy(state).idleTimeoutMinutes || 60);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 60) * 60 * 1000;
}

function clearSession(state) {
  state.activeMember = null;
  state.lastActiveAt = null;
  state.session = { actor: null, authenticatedAt: null, lastActiveAt: null, expiresAt: null };
  state.activeAgents = {};
}

function startSession(state, actor) {
  const at = now();
  state.activeMember = actor;
  state.lastActiveAt = at;
  state.session = {
    actor,
    authenticatedAt: at,
    lastActiveAt: at,
    expiresAt: new Date(Date.now() + idleTimeoutMs(state)).toISOString()
  };
}

function sessionStatus(state, actor) {
  const session = state.session || {};
  const lastActive = session.lastActiveAt || state.lastActiveAt;
  if (!session.actor || !lastActive) return { authenticated: false, reason: 'no-session', member: session.actor || null };
  if (actor && session.actor !== actor) return { authenticated: false, reason: 'actor-mismatch', member: session.actor };
  const elapsed = Date.now() - new Date(lastActive).getTime();
  if (elapsed > idleTimeoutMs(state)) return { authenticated: false, reason: 'expired', member: session.actor };
  return { authenticated: true, reason: 'valid', member: session.actor, expiresAt: session.expiresAt || null };
}

// Enforce a valid authenticated session for `actor`. Clears stale sessions and
// refuses to proceed when login is required (no session, wrong actor, or idle timeout).
function enforceSession(state, actor) {
  if (!state.initialized || !actor) return;
  if (sessionPolicy(state).enabled === false) return;
  const status = sessionStatus(state, actor);
  if (!status.authenticated) {
    if (status.reason === 'expired') {
      clearSession(state);
      writeState(state);
      throw new Error('Session expired (inactive too long). Please login again with codename and password.');
    }
    if (status.reason === 'actor-mismatch') {
      throw new Error(`Session belongs to ${status.member}, not ${actor}. The previous member must logout, then ${actor} must login.`);
    }
    clearSession(state);
    writeState(state);
    throw new Error('Not authenticated this session. Run login --codename <code> --password <pass> before continuing.');
  }
  // Touch the session to extend the idle window.
  const at = now();
  state.lastActiveAt = at;
  state.session = {
    actor,
    authenticatedAt: (state.session && state.session.authenticatedAt) || at,
    lastActiveAt: at,
    expiresAt: new Date(Date.now() + idleTimeoutMs(state)).toISOString()
  };
  writeState(state);
}

// Backward-compatible alias: older call sites use enforceSessionTimeout.
function enforceSessionTimeout(state, actor) {
  return enforceSession(state, actor);
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

function currentGhUser() {
  const result = spawnSync('gh', ['api', 'user', '--jq', '{login:.login,id:.id,email:.email}'], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout || '{}');
  } catch {
    return null;
  }
}

function githubNoreplyEmail(user) {
  if (!user?.login || !user?.id) return '';
  return `${user.id}+${user.login}@users.noreply.github.com`;
}

function resolveGitIdentityInput(state, actor, name, emailInput, githubUsernameInput) {
  const policy = state.autosync?.githubIdentity || {};
  const preferNoreply = policy.useNoreplyForMemberCommits !== false;
  const gh = currentGhUser();
  const githubUsername = githubUsernameInput || gh?.login || '';
  if (gh?.login && githubUsername && policy.requireMatchedGhUser !== false && gh.login.toLowerCase() !== githubUsername.toLowerCase()) {
    throw new Error(`GitHub CLI authenticated as ${gh.login}, expected ${githubUsername}. Run gh auth login as the real user.`);
  }

  let email = String(emailInput || '').trim();
  const wantsNoreply = !email || ['auto', 'github', 'github-noreply', 'noreply'].includes(email.toLowerCase());
  if (preferNoreply && wantsNoreply) {
    email = githubNoreplyEmail(gh);
    if (!email) {
      throw new Error('Cannot derive GitHub noreply email. Run gh auth login or provide --git-email "<github-verified-email>".');
    }
  }
  if (!email && state.autosync?.requireUserGitEmail !== false) {
    throw new Error('Git email is required. Use --git-email github-noreply after gh auth login, or provide a GitHub-verified email.');
  }
  return {
    name,
    email,
    githubUsername,
    githubUserId: gh?.login?.toLowerCase() === githubUsername.toLowerCase() ? gh.id : undefined,
    emailSource: wantsNoreply && email ? 'github-noreply' : 'manual'
  };
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

function memoryPolicy(state) {
  return state.memoryPolicy || {
    enabled: true,
    directory: '.MOP/memory',
    sessionBrief: '.MOP/memory/SESSION_BRIEF.md',
    monthlyPattern: 'YYYY-MM.jsonl',
    recentLimit: 20
  };
}

function answerPolicy(state) {
  return state.answerPolicy || {
    requireVisibleAgent: true,
    visibleAgentFormat: 'agent: <agent-name> (<agent-role>) to <user>',
    requireMemoryRestore: true,
    requireMemorySave: true
  };
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function relativeFromRoot(path) {
  return path.replace(rootDir, '').replace(/^[\\/]/, '').replaceAll('\\', '/');
}

function memoryDirFor(state) {
  return join(rootDir, memoryPolicy(state).directory || '.MOP/memory');
}

function monthlyMemoryPath(state, month = monthKey()) {
  const policy = memoryPolicy(state);
  const filename = (policy.monthlyPattern || 'YYYY-MM.jsonl').replace('YYYY-MM', month);
  return join(memoryDirFor(state), filename);
}

function sessionBriefPath(state) {
  return join(rootDir, memoryPolicy(state).sessionBrief || '.MOP/memory/SESSION_BRIEF.md');
}

function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function memoryMonths(state) {
  const dir = memoryDirFor(state);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^\d{4}-\d{2}\.jsonl$/.test(name))
    .map((name) => name.replace(/\.jsonl$/, ''))
    .sort();
}

function latestMemoryEntries(state, limit = memoryPolicy(state).recentLimit || 20) {
  const months = memoryMonths(state);
  const selected = months.length ? months.slice(-3) : [monthKey()];
  return selected
    .flatMap((month) => readJsonl(monthlyMemoryPath(state, month)))
    .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
    .slice(-limit);
}

// ─── Fasa 1.1: BM25 Zero-Dep Engine ────────────────────────────────────────

const STOP_WORDS = new Set([
  // Melayu
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'ini', 'itu', 'ada',
  'dengan', 'oleh', 'akan', 'juga', 'sudah', 'saya', 'awak', 'kita', 'dia',
  'bagi', 'boleh', 'tidak', 'tak', 'atau', 'tetapi', 'jika', 'bila',
  // English
  'the', 'a', 'an', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of', 'and',
  'or', 'but', 'not', 'this', 'that', 'was', 'are', 'be', 'been', 'has',
  'have', 'had', 'do', 'did', 'by', 'with', 'as', 'from', 'into', 'via'
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function bm25Score(tf, df, docCount, docLen, avgDocLen, k1 = 1.5, b = 0.75) {
  const idf = Math.log((docCount - df + 0.5) / (df + 0.5) + 1);
  const norm = tf * (k1 + 1) / (tf + k1 * (1 - b + b * (docLen / avgDocLen)));
  return idf * norm;
}

function memoryIndexPath(state) {
  return join(memoryDirFor(state), 'index.json');
}

function workingMemoryPath(state) {
  return join(memoryDirFor(state), 'working.jsonl');
}

function factsPath(state) {
  return join(memoryDirFor(state), 'facts.json');
}

function readIndex(state) {
  const p = memoryIndexPath(state);
  if (!existsSync(p)) return { docs: {}, df: {}, docCount: 0, avgDocLen: 0 };
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return { docs: {}, df: {}, docCount: 0, avgDocLen: 0 }; }
}

function writeIndex(state, index) {
  mkdirSync(memoryDirFor(state), { recursive: true });
  writeFileSync(memoryIndexPath(state), JSON.stringify(index), 'utf8');
}

function addToIndex(state, entryId, text) {
  const index = readIndex(state);
  const tokens = tokenize(text);
  if (!tokens.length) return;
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  index.docs[entryId] = { tf, len: tokens.length };
  for (const t of Object.keys(tf)) index.df[t] = (index.df[t] || 0) + 1;
  index.docCount = Object.keys(index.docs).length;
  const totalLen = Object.values(index.docs).reduce((s, d) => s + d.len, 0);
  index.avgDocLen = index.docCount > 0 ? totalLen / index.docCount : 1;
  writeIndex(state, index);
}

function bm25Search(state, query, limit = 10) {
  const index = readIndex(state);
  if (!index.docCount) return [];
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  const scores = {};
  for (const t of qTokens) {
    const df = index.df[t] || 0;
    if (!df) continue;
    for (const [docId, doc] of Object.entries(index.docs)) {
      const tf = doc.tf[t] || 0;
      if (!tf) continue;
      scores[docId] = (scores[docId] || 0) + bm25Score(tf, df, index.docCount, doc.len, index.avgDocLen);
    }
  }
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([docId, score]) => ({ docId, score: Math.round(score * 1000) / 1000 }));
}

// ─── Fasa 1.2: 3-Tier Memory Helpers ───────────────────────────────────────

function appendWorkingMemory(state, entry) {
  const p = workingMemoryPath(state);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', flag: 'a' });
}

function readFacts(state) {
  const p = factsPath(state);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return []; }
}

function maybepromoteToFacts(state, entry) {
  // Auto-promote: if summary appears in index with docCount refs > 3 in last 30 days
  const facts = readFacts(state);
  const alreadyFact = facts.some((f) => f.summary === entry.summary);
  if (alreadyFact) return;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recent = latestMemoryEntries(state, 200)
    .filter((e) => e.at >= thirtyDaysAgo && e.summary === entry.summary);
  if (recent.length >= 3) {
    facts.push({ ...entry, promotedAt: now(), tier: 'fact' });
    const p = factsPath(state);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(facts, null, 2), 'utf8');
  }
}

// ─── Fasa 1.3: All-tier memory reader for search ───────────────────────────

function allMemoryEntries(state) {
  const episodic = [];
  for (const month of memoryMonths(state)) {
    episodic.push(...readJsonl(monthlyMemoryPath(state, month)));
  }
  const working = readJsonl(workingMemoryPath(state));
  const facts = readFacts(state);
  const seen = new Set();
  const result = [];
  for (const e of [...facts, ...working, ...episodic]) {
    const key = `${e.at}|${e.summary}`;
    if (!seen.has(key)) { seen.add(key); result.push(e); }
  }
  return result.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
}

function answerContractFor(state, actor, agent = activeAgentFor(state, actor)) {
  const policy = answerPolicy(state);
  const format = policy.visibleAgentFormat || 'agent: <agent-name> (<agent-role>) to <user>';
  const firstLine = agent
    ? format
      .replace('<agent-name>', agent.name)
      .replace('<agent-role>', agent.role)
      .replace('<agent-title>', agent.title || agent.role)
      .replace('<user>', actor || 'user')
    : '';
  return {
    required: policy.requireVisibleAgent !== false,
    firstLine,
    beforeAnswer: `node .MOP/scripts/mop-core.mjs memory brief --actor ${actor || '<codename>'}`,
    afterAnswer: `node .MOP/scripts/mop-core.mjs memory add --actor ${actor || '<codename>'} --kind conversation --summary "<one-line outcome>"`,
    rules: [
      'Do not answer authenticated work without an active named agent.',
      'Every user-facing answer must show the active agent line first.',
      'Restore monthly memory before answering and save a one-line memory after meaningful work.'
    ]
  };
}

function browserPolicy(state) {
  return state.browserPolicy || {
    requirePreflightBeforeBrowserWork: true,
    requireDefaultBrowserCheck: true,
    directModeBrowsers: ['brave', 'edge', 'opera'],
    builtinChromeBrowsers: ['chrome', 'chromium'],
    supportedChoices: ['Chrome', 'Edge', 'Brave', 'Opera']
  };
}

function browserFamilyFromValue(raw) {
  const value = String(raw || '').toLowerCase();
  if (/(google-chrome|chromehtml|chrome)/.test(value) && !/chromium/.test(value)) return 'chrome';
  if (/chromium/.test(value)) return 'chromium';
  if (/brave/.test(value)) return 'brave';
  if (/(microsoft-edge|mseedge|edge)/.test(value)) return 'edge';
  if (/opera/.test(value)) return 'opera';
  if (/firefox/.test(value)) return 'firefox';
  return 'unknown';
}

function detectWindowsDefaultBrowser() {
  const script = [
    '$ErrorActionPreference = "SilentlyContinue";',
    '$keys = @(',
    '"HKCU:\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice",',
    '"HKCU:\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice"',
    ');',
    'foreach ($key in $keys) {',
    '  $item = Get-ItemProperty -Path $key -Name ProgId;',
    '  if ($item.ProgId) { Write-Output $item.ProgId; break }',
    '}'
  ].join('\n');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  const raw = result.status === 0 ? (result.stdout || '').trim().split(/\r?\n/)[0] : '';
  return raw ? { raw, source: 'windows-registry' } : null;
}

function detectDefaultBrowser() {
  let detected = process.platform === 'win32' ? detectWindowsDefaultBrowser() : null;
  if (!detected) {
    const xdg = spawnSync('xdg-settings', ['get', 'default-web-browser'], {
      cwd: rootDir,
      encoding: 'utf8'
    });
    const raw = (xdg.status === 0 ? xdg.stdout : '').trim();
    if (raw) detected = { raw, source: 'xdg-settings' };
  }
  if (!detected && process.env.BROWSER) {
    detected = { raw: process.env.BROWSER, source: 'BROWSER' };
  }
  const raw = detected?.raw || '';
  return {
    raw: raw || null,
    family: browserFamilyFromValue(raw),
    source: detected?.source || 'not-detected'
  };
}

function browserPreflightFor(state) {
  const policy = browserPolicy(state);
  const detected = detectDefaultBrowser();
  const direct = (policy.directModeBrowsers || []).includes(detected.family);
  const builtin = (policy.builtinChromeBrowsers || []).includes(detected.family);
  const supported = direct || builtin;
  const mode = builtin ? 'chrome' : direct ? 'chrome-direct' : 'ask-user-browser';
  const needsQuestion = !supported;
  return {
    required: policy.requirePreflightBeforeBrowserWork !== false,
    defaultBrowser: detected,
    mode,
    ready: supported,
    needsQuestion,
    question: needsQuestion
      ? `Saya tak dapat kesan Chrome/Edge/Brave/Opera sebagai browser default. Awak guna browser apa? Pilih: ${(policy.supportedChoices || ['Chrome', 'Edge', 'Brave', 'Opera']).join(', ')}.`
      : '',
    instructions: direct
      ? [
        `Use browser-act chrome-direct for ${detected.family}.`,
        'Guide the user to start that browser with --remote-debugging-port before scraping or form automation.',
        'Do not create a default chrome session first.'
      ]
      : builtin
        ? ['Use normal Chrome-compatible browser automation.', 'Do not ask the user again unless automation fails.']
        : ['Ask the user which browser they use before scraping or browser automation.']
  };
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

function appendMonthlyMemory(state, actor, kind, summary, agent = activeAgentFor(state, actor)) {
  if (memoryPolicy(state).enabled === false) return null;
  const entry = { at: now(), actor, ...agentLedgerFields(agent), kind, summary };
  const monthlyPath = monthlyMemoryPath(state);
  mkdirSync(dirname(monthlyPath), { recursive: true });
  writeFileSync(monthlyPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', flag: 'a' });
  writeSessionBrief(state, actor);
  return { entry, monthlyPath };
}

function writeSessionBrief(state, actor) {
  const path = sessionBriefPath(state);
  const agent = activeAgentFor(state, actor);
  const entries = latestMemoryEntries(state, memoryPolicy(state).recentLimit || 20);
  const contract = answerContractFor(state, actor, agent);
  const lines = [
    '# MOP Session Brief',
    '',
    `Updated: ${now()}`,
    `Actor: ${actor || state.activeMember || 'unknown'}`,
    `Active agent: ${agent ? `${agent.name} (${agent.role})` : 'none'}`,
    `Current month: ${monthKey()}`,
    '',
    '## Required Session Flow',
    '',
    '1. Read `.MOP/STATE.json` and follow `.MOP/PROTOCOL.md`.',
    '2. Authenticate if required.',
    '3. Run `agent route` for the user task before answering.',
    `4. Start every authenticated answer with: \`${contract.firstLine || 'agent: <name> (<role>) to <user>'}\``,
    '5. Save a one-line memory after meaningful work.',
    '',
    '## Recent Memory',
    '',
    ...entries.map((entry) => {
      const who = entry.agent ? `${entry.agent} (${entry.agentRole || 'agent'})` : entry.actor;
      return `- ${entry.at} - ${who}: ${entry.summary}`;
    })
  ];
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
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
    role: 'browser',
    support: ['researcher', 'tester'],
    keywords: ['agent browser', 'browser agent', 'browser automation', 'browser', 'browse', 'scrape', 'scraping', 'web scraping', 'extract', 'click', 'login flow', 'fill form', 'captcha', 'bot detection', 'website', 'url', 'webpage']
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

function hasBrowserWorkIntent(task) {
  return /\b(agent browser|browser agent|browser automation|browse|scrape|scraping|web scraping|extract|click|login flow|fill form|captcha|bot detection|webpage|url)\b/.test(task);
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
  const explicitPartyIntent = /\b(party mode|party|multi[- ]?agent|swarm|semua agent|banyak agent|agent.*bincang|bincang.*agent|agent.*discuss|discuss.*agent)\b/.test(task);
  const multiDomainIntent = [
    ['ui', 'backend'],
    ['frontend', 'backend'],
    ['design', 'api'],
    ['database', 'api'],
    ['deploy', 'github'],
    ['security', 'auth'],
    ['prompt', 'system']
  ].some(([first, second]) => task.includes(first) && task.includes(second));
  const browserRiskIntent = hasBrowserWorkIntent(task);
  const connectiveIntent = /\b(connect|connected|integrate|integration|bersambung|sambung|hubung|flow|workflow)\b/.test(task);
  const broadBuild = newSystemIntent && supportRoles.length >= 2;
  const specialistStack = supportRoles.length >= 3 && ['architect', 'planner', 'core'].includes(primaryRole);
  return explicitPartyIntent || multiDomainIntent || browserRiskIntent || connectiveIntent || broadBuild || specialistStack;
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
  const relevant = uniqueValues([
    primaryRole,
    ...supportRoles,
    ...scored.map((rule) => rule.role)
  ]);
  const participants = relevant.length >= floor
    ? relevant
    : uniqueValues([...relevant, ...fallbackRoles]).slice(0, floor);
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
  const browserWorkIntent = hasBrowserWorkIntent(task);
  const top = scored[0];
  let primaryRole = browserWorkIntent ? 'browser' : (top?.role || state.agentPolicy?.defaultRole || 'core');

  if (newSystemIntent && !implementationIntent && !browserWorkIntent && state.agentRouter?.preferHighReasoningForNewSystems !== false) {
    primaryRole = state.agentRouter?.defaultHighReasoningRole || 'architect';
  }

  const primary = catalogForRole(state, primaryRole);
  const baseSupport = newSystemIntent && !browserWorkIntent
    ? ['planner', 'researcher', 'prompt', 'coder', 'reviewer']
    : (top?.support || []);
  const supportRoles = maybeLimit(uniqueValues([
    ...baseSupport,
    ...scored.slice(1).map((rule) => rule.role)
  ])
    .filter((role) => role !== primaryRole), state.agentRouter?.supportAgentLimit);
  const partyActive = shouldActivatePartyMode(state, task, primaryRole, supportRoles, newSystemIntent);
  const partyParticipants = partyParticipantsFor(state, primaryRole, supportRoles, scored, partyActive);

  const ambiguousNewSystem = newSystemIntent && !browserWorkIntent && words.length < 18;
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
    reason: newSystemIntent && !browserWorkIntent
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
  const gitEmail = String(args['git-email'] || 'github-noreply');
  const githubUsername = String(args['github-username'] || '');
  const joinMode = String(args['join-mode'] || 'owner-approved');

  if (codename.length < 2) throw new Error('Codename too short.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (!['solo', 'team'].includes(mode)) throw new Error('Mode must be solo or team.');
  if (mode === 'team' && !githubUrl) throw new Error('Team mode requires --github-url.');
  if (!['open', 'owner-approved', 'invite'].includes(joinMode)) {
    throw new Error('Join mode must be open, owner-approved, or invite.');
  }
  const gitIdentity = resolveGitIdentityInput(state, codename, gitName, gitEmail, githubUsername);

  const { passwordHash, passwordSalt } = hashPassword(password);
  state.initialized = true;
  state.projectName = projectName;
  state.projectNameDefault = folderDefault;
  state.ownerCodename = codename;
  state.activeAgents ||= {};
  startSession(state, codename);
  state.agentPolicy ||= {
    requiredAfterAuth: true,
    requireForEveryConversation: true,
    defaultRole: 'core',
    defaultTitle: 'Core Agent',
    gateOrder: 'AUTH_GATE_THEN_AGENT_ROUTER_THEN_AGENT_GATE_THEN_ACTION',
    rules: [
      "Agents MUST strictly follow their designated role.",
      "If a task is outside their domain, they must not attempt to guess or perform it.",
      "Instead, they must trigger Party Mode to invite the correct specialist."
    ]
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
      gitIdentity,
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
  // A fresh login starts a new session and supersedes any carried-over member.
  startSession(state, codename);
  appendLedger(state, codename, 'login', 'Member authenticated; new session started.');
  writeState(state);
  
  // F5.1: SessionStart hook -> auto-populate SESSION_BRIEF.md
  writeSessionBrief(state, codename);

  console.log(`Active member: ${codename}`);
  if (!activeAgentFor(state, codename) && state.agentPolicy?.requiredAfterAuth !== false) {
    console.log(`Agent diperlukan. Jalankan: node .MOP/scripts/mop-core.mjs agent activate --actor ${codename} --role ${state.agentPolicy?.defaultRole || 'core'} --title "${state.agentPolicy?.defaultTitle || 'Core Agent'}" --name "<agent-name>"`);
  } else {
    console.log(JSON.stringify({
      next: 'restore-memory-and-route-task',
      memoryRestore: `node .MOP/scripts/mop-core.mjs memory brief --actor ${codename}`,
      answerContract: answerContractFor(state, codename)
    }, null, 2));
  }
}

function logout(args) {
  const state = readState();
  const actor = slug(String(args.codename || args.actor || state.activeMember || ''));
  clearSession(state);
  if (state.initialized) appendLedger(state, actor || 'unknown', 'logout', 'Session ended; login required for next action.');
  writeState(state);
  console.log('Logged out. The next action requires login with codename and password.');
}

// whoami / session verify: report whether the CURRENT persisted session is still
// valid. The AI gate must still demand login on every new chat; this command only
// confirms idle-timeout validity and is used before identity-bound actions.
function whoami(args) {
  const state = readState();
  if (!state.initialized) {
    console.log(JSON.stringify({ initialized: false, authenticated: false, message: 'MOP belum di-setup. Jalankan /mop-setup.' }, null, 2));
    return;
  }
  const actor = args.actor ? slug(String(args.actor)) : undefined;
  const status = sessionStatus(state, actor);
  console.log(JSON.stringify({
    initialized: true,
    authenticated: status.authenticated,
    reason: status.reason,
    sessionMember: status.member,
    activeMemberHint: state.activeMember || null,
    expiresAt: state.session?.expiresAt || null,
    idleTimeoutMinutes: sessionPolicy(state).idleTimeoutMinutes || 60,
    notes: [
      'activeMember is only a hint of the last user, never proof of authentication.',
      'Every new chat must re-login regardless of this status.'
    ],
    next: status.authenticated ? 'session-valid-but-confirm-new-chat-login' : 'demand-codename-and-password'
  }, null, 2));
}

function agentActivate(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = slug(requireArg(args, 'actor'));
  if (!state.members?.[actor]) throw new Error('Unknown actor.');
  enforceSessionTimeout(state, actor);

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
  enforceSessionTimeout(state, actor);
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
  enforceSessionTimeout(state, actor);
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
  const missingAgentCommands = missingPartyAgents.map((item) => (
    `node .MOP/scripts/mop-core.mjs agent activate --actor ${actor} --role ${item.role} --title "${item.title}" --name "<agent-name>"`
  ));
  const missingAgentQuestions = missingPartyAgents.map((item) => (
    `Beri nama untuk ${item.title} (${item.role}) kamu:`
  ));
  const browserPreflight = route.primaryRole === 'browser'
    || route.supportRoles.includes('browser')
    || route.partyMode?.participants?.includes('browser')
    || hasBrowserWorkIntent(route.task || '')
    ? browserPreflightFor(state)
    : null;
  const response = {
    ok: Boolean(agent),
    actor,
    route,
    partyAgents,
    missingAgents: missingPartyAgents,
    activeAgent: null,
    answerContract: null,
    browserPreflight,
    monthlyMemory: {
      restoreCommand: `node .MOP/scripts/mop-core.mjs memory brief --actor ${actor}`,
      saveCommand: `node .MOP/scripts/mop-core.mjs memory add --actor ${actor} --kind conversation --summary "<one-line outcome>"`
    },
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
    response.answerContract = answerContractFor(state, actor, agent);
    if (route.partyMode.active && missingPartyAgents.length) {
      response.ok = false;
      response.nextAction = 'name-required-party-agents';
      response.message = `Party Mode perlukan ${missingPartyAgents.length} agent yang belum ada nama. Minta nama semua agent ini dahulu sebelum sambung kerja.`;
      response.ask = `Kita ada ${missingPartyAgents.length} agent belum ada nama. ${missingAgentQuestions.join(' ')}`;
      response.missingAgentQuestions = missingAgentQuestions;
      response.missingAgentCommands = missingAgentCommands;
    } else if (browserPreflight?.required && browserPreflight.needsQuestion) {
      response.ok = false;
      response.nextAction = 'ask-browser-before-browser-work';
      response.message = 'Browser preflight belum ready. Tanya browser user dahulu sebelum scraping/browser automation.';
      response.ask = browserPreflight.question;
    } else {
      response.nextAction = route.needsClarification ? 'ask-clarifying-questions' : 'proceed-with-agent';
    }
  } else {
    response.nextAction = route.partyMode.active && missingPartyAgents.length
      ? 'name-required-party-agents'
      : 'name-required-agent';
    response.message = route.partyMode.active && missingPartyAgents.length
      ? `Party Mode perlukan ${missingPartyAgents.length} agent yang belum ada nama. Minta nama semua agent ini dahulu sebelum sambung kerja.`
      : `Task ini perlukan ${route.primaryTitle}. Agent ini belum ada nama lagi atau belum dipilih.`;
    response.ask = route.partyMode.active && missingPartyAgents.length
      ? `Kita ada ${missingPartyAgents.length} agent belum ada nama. ${missingAgentQuestions.join(' ')}`
      : `Beri nama untuk ${route.primaryTitle} kamu:`;
    response.command = `node .MOP/scripts/mop-core.mjs agent activate --actor ${actor} --role ${route.primaryRole} --title "${route.primaryTitle}" --name "<agent-name>"`;
    if (route.partyMode.active && missingPartyAgents.length) {
      response.missingAgentQuestions = missingAgentQuestions;
      response.missingAgentCommands = missingAgentCommands;
    }
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

function browserPreflight() {
  const state = readState();
  console.log(JSON.stringify(browserPreflightFor(state), null, 2));
}

function memoryAdd(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = slug(requireArg(args, 'actor'));
  if (!state.members?.[actor]) throw new Error('Unknown actor.');
  enforceSessionTimeout(state, actor);
  const agent = requireActiveAgent(state, actor);
  const summary = String(args.summary || args._?.join(' ') || '').trim();
  const kind = String(args.kind || 'conversation');
  if (!summary) throw new Error('Missing --summary');

  const isFed = state.federation?.enabled === true;
  const finalSummary = isFed ? piiScrub(summary) : summary;

  appendLedger(state, actor, 'memory', finalSummary, agent);
  const saved = appendMonthlyMemory(state, actor, kind, finalSummary, agent);

  // Fasa 1.1: Add to BM25 index
  const entryId = `${now()}|${actor}`;
  addToIndex(state, entryId, finalSummary);

  // Fasa 1.2: Append to working memory tier
  const entry = { at: now(), actor, ...agentLedgerFields(agent), kind, summary: finalSummary };
  appendWorkingMemory(state, entry);

  // Fasa 1.2: Auto-promote to facts if referenced >= 3x in 30 days
  maybepromoteToFacts(state, entry);

  if (isFed) {
    outbound(entry);
  }

  writeState(state);
  console.log(JSON.stringify({
    ok: true,
    actor,
    agent: agent.name,
    kind,
    summary: finalSummary,
    monthlyMemory: saved ? relativeFromRoot(saved.monthlyPath) : 'disabled',
    sessionBrief: relativeFromRoot(sessionBriefPath(state)),
    answerContract: answerContractFor(state, actor, agent)
  }, null, 2));
}

function memoryBrief(args) {
  const state = readState();
  if (!state.initialized) {
    console.log('MOP belum di-setup. Jalankan /mop-setup.');
    return;
  }
  const actor = slug(String(args.actor || state.activeMember || ''));
  if (!actor) throw new Error('Missing --actor');
  if (!state.members?.[actor]) throw new Error('Unknown actor.');
  enforceSessionTimeout(state, actor);
  const agent = activeAgentFor(state, actor);
  const month = String(args.month || monthKey());
  const limit = Number(args.limit || memoryPolicy(state).recentLimit || 20);
  const query = String(args.query || '').trim();
  // Fasa 1.3: role scoping
  const roleFilter = String(args.role || '').trim().toLowerCase();

  let recentEntries;
  if (query) {
    // Fasa 1.1: BM25 ranked search
    const ranked = bm25Search(state, query, limit);
    const allEntries = allMemoryEntries(state);
    // Map docIds (at|actor keys) back to entries — fallback to recency if no index hits
    if (ranked.length > 0) {
      recentEntries = ranked
        .map(({ docId, score }) => {
          const [at, entryActor] = docId.split('|');
          const found = allEntries.find((e) => e.at.startsWith(at.slice(0, 19)) && e.actor === entryActor);
          return found ? { ...found, _score: score } : null;
        })
        .filter(Boolean);
    } else {
      // Fallback to recency if index empty
      recentEntries = latestMemoryEntries(state, limit);
    }
  } else {
    recentEntries = latestMemoryEntries(state, limit);
  }

  // Fasa 1.3: role scoping — filter by agent role or actor, unless 'shared' tag
  if (roleFilter) {
    recentEntries = recentEntries.filter((e) => {
      const matchesRole = e.agentRole?.toLowerCase() === roleFilter;
      const matchesActor = e.actor?.toLowerCase() === roleFilter;
      const isShared = (e.tags || []).includes('shared');
      return matchesRole || matchesActor || isShared;
    });
  }

  const currentEntries = readJsonl(monthlyMemoryPath(state, month)).slice(-limit);
  const facts = readFacts(state);

  if (agent) writeSessionBrief(state, actor);
  console.log(JSON.stringify({
    ok: true,
    actor,
    activeAgent: agent ? {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      title: agent.title
    } : null,
    answerContract: answerContractFor(state, actor, agent),
    memory: {
      tier: query ? 'bm25-ranked' : roleFilter ? 'role-scoped' : 'recency',
      query: query || null,
      roleFilter: roleFilter || null,
      month,
      monthPath: relativeFromRoot(monthlyMemoryPath(state, month)),
      sessionBrief: relativeFromRoot(sessionBriefPath(state)),
      currentMonthEntries: currentEntries,
      recentEntries,
      facts: facts.slice(-5),
      indexSize: readIndex(state).docCount
    },
    next: agent
      ? 'Use answerContract.firstLine before answering, then save memory after meaningful work.'
      : `Agent diperlukan. Jalankan: node .MOP/scripts/mop-core.mjs agent activate --actor ${actor} --role ${state.agentPolicy?.defaultRole || 'core'} --title "${state.agentPolicy?.defaultTitle || 'Core Agent'}" --name "<agent-name>"`
  }, null, 2));
}

function memoryRestore(args) {
  return memoryBrief(args);
}

// Fasa 1.1: memorySearch — standalone BM25 search command
function memorySearch(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = slug(String(args.actor || state.activeMember || ''));
  if (!actor) throw new Error('Missing --actor');
  if (!state.members?.[actor]) throw new Error('Unknown actor.');
  enforceSessionTimeout(state, actor);
  const query = String(args.query || args._?.join(' ') || '').trim();
  if (!query) throw new Error('Missing --query');
  const limit = Number(args.limit || 10);
  const roleFilter = String(args.role || '').trim().toLowerCase();

  const ranked = bm25Search(state, query, limit * 3);
  const allEntries = allMemoryEntries(state);

  let results = ranked
    .map(({ docId, score }) => {
      const [at, entryActor] = docId.split('|');
      const found = allEntries.find((e) => e.at.startsWith(at.slice(0, 19)) && e.actor === entryActor);
      return found ? { ...found, _score: score } : null;
    })
    .filter(Boolean);

  if (roleFilter) {
    results = results.filter((e) => {
      const matchesRole = e.agentRole?.toLowerCase() === roleFilter;
      const matchesActor = e.actor?.toLowerCase() === roleFilter;
      const isShared = (e.tags || []).includes('shared');
      return matchesRole || matchesActor || isShared;
    });
  }

  results = results.slice(0, limit);

  console.log(JSON.stringify({
    ok: true,
    query,
    roleFilter: roleFilter || null,
    count: results.length,
    indexSize: readIndex(state).docCount,
    results
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
  const email = String(args.email || 'github-noreply');
  const githubUsername = String(args['github-username'] || member.gitIdentity?.githubUsername || '');
  member.gitIdentity = resolveGitIdentityInput(state, actor, name, email, githubUsername);
  appendLedger(state, actor, 'git-identity', `Updated git identity for ${actor}.`, agent);
  writeState(state);
  console.log(`Git identity set for ${actor}: ${member.gitIdentity.name} <${member.gitIdentity.email}>${member.gitIdentity.githubUsername ? ` github=${member.gitIdentity.githubUsername}` : ''}`);
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
  if (state.answerPolicy && typeof state.answerPolicy !== 'object') errors.push('answerPolicy must be object');
  if (state.memoryPolicy && typeof state.memoryPolicy !== 'object') errors.push('memoryPolicy must be object');
  if (state.browserPolicy && typeof state.browserPolicy !== 'object') errors.push('browserPolicy must be object');
  if (state.agentRouter && typeof state.agentRouter !== 'object') errors.push('agentRouter must be object');
  if (state.partyMode && typeof state.partyMode !== 'object') errors.push('partyMode must be object');
  if (state.autosync?.githubIdentity && typeof state.autosync.githubIdentity !== 'object') {
    errors.push('autosync.githubIdentity must be object');
  }
  if (state.mopFlow && typeof state.mopFlow !== 'object') errors.push('mopFlow must be object');
  if (state.mopFlow?.enabled !== false) {
    if (state.mopFlow?.brand !== 'MOP Flow') errors.push('mopFlow.brand must be MOP Flow');
    if (state.mopFlow?.canonicalMcpServer !== 'mop-flow') errors.push('mopFlow.canonicalMcpServer must be mop-flow');
    if (state.mopFlow?.providerParity?.enabled === false) errors.push('mopFlow.providerParity must remain enabled');
    for (const path of [
      '.MOP/scripts/mop-flow.mjs',
      '.agents/skills/mop-flow/SKILL.md',
      '.claude/skills/mop-flow/SKILL.md'
    ]) {
      if (!existsSync(join(rootDir, path))) errors.push(`mopFlow required file missing: ${path}`);
    }
    const mcpText = existsSync(join(rootDir, '.mcp.json')) ? readFileSync(join(rootDir, '.mcp.json'), 'utf8') : '';
    if (mcpText && !mcpText.includes('"mop-flow"')) errors.push('.mcp.json must register mop-flow');
  }
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
    answerPolicy: answerPolicy(state),
    memoryPolicy: memoryPolicy(state),
    browserPolicy: browserPolicy(state),
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
    mopFlow: state.mopFlow || {},
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
  if (command === 'logout') return logout(parseArgs([subcommand, ...rest].filter(Boolean)));
  if (command === 'whoami') return whoami(parseArgs([subcommand, ...rest].filter(Boolean)));
  if (command === 'session' && subcommand === 'verify') return whoami(args);
  if (command === 'validate') return validate();
  if (command === 'status') return status();
  if (command === 'member' && subcommand === 'git-identity') return memberGitIdentity(args);
  if (command === 'agent' && subcommand === 'activate') return agentActivate(args);
  if (command === 'agent' && subcommand === 'use') return agentUse(args);
  if (command === 'agent' && subcommand === 'current') return agentCurrent(args);
  if (command === 'agent' && subcommand === 'require') return agentRequire(args);
  if (command === 'agent' && subcommand === 'route') return agentRoute(args);
  if (command === 'agent' && subcommand === 'list') return agentList();
  if (command === 'browser' && subcommand === 'preflight') return browserPreflight();
  if (command === 'memory' && subcommand === 'add') return memoryAdd(args);
  if (command === 'memory' && subcommand === 'brief') return memoryBrief(args);
  if (command === 'memory' && subcommand === 'restore') return memoryRestore(args);
  if (command === 'memory' && subcommand === 'search') return memorySearch(args);

  console.log(`Usage:
  node .MOP/scripts/mop-core.mjs status
  node .MOP/scripts/mop-core.mjs validate
  node .MOP/scripts/mop-core.mjs setup --project-name NAME --name DISPLAY --codename CODE --password PASS --mode solo|team --conversation-language LANG --coding-language LANG [--git-email github-noreply|EMAIL] [--git-name NAME] [--github-username USER] [--github-url URL]
  node .MOP/scripts/mop-core.mjs login --codename CODE --password PASS
  node .MOP/scripts/mop-core.mjs logout [--codename CODE]
  node .MOP/scripts/mop-core.mjs whoami [--actor CODE]
  node .MOP/scripts/mop-core.mjs session verify --actor CODE
  node .MOP/scripts/mop-core.mjs member git-identity --actor CODE --name NAME [--email github-noreply|EMAIL] [--github-username USER]
  node .MOP/scripts/mop-core.mjs agent activate --actor CODE --role ROLE --title TITLE --name NAME
  node .MOP/scripts/mop-core.mjs agent use --actor CODE --name NAME
  node .MOP/scripts/mop-core.mjs agent current --actor CODE
  node .MOP/scripts/mop-core.mjs agent require --actor CODE [--role ROLE] [--title TITLE]
  node .MOP/scripts/mop-core.mjs agent route --actor CODE --task "task text"
  node .MOP/scripts/mop-core.mjs agent list
  node .MOP/scripts/mop-core.mjs browser preflight
  node .MOP/scripts/mop-core.mjs memory brief --actor CODE [--month YYYY-MM] [--query TEXT] [--role ROLE]
  node .MOP/scripts/mop-core.mjs memory add --actor CODE --kind conversation --summary "what happened"
  node .MOP/scripts/mop-core.mjs memory restore --actor CODE
  node .MOP/scripts/mop-core.mjs memory search --actor CODE --query TEXT [--role ROLE] [--limit N]`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
