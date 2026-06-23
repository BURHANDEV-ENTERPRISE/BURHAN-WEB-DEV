#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
  if (!value || value === true) throw new Error(`Missing --${key}`);
  return String(value);
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    const detail = `${result.stderr || result.stdout}`.trim();
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return (result.stdout || '').trim();
}

function runGitAllowFailure(args, options = {}) {
  return spawnSync('git', args, {
    cwd: rootDir,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8'
  });
}

function runOptional(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8'
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim()
  };
}

function activeAgentFor(state, actor) {
  const activeId = state.activeAgents?.[actor];
  if (!activeId) return null;
  const agent = (state.agentRoster || []).find((item) => item.id === activeId || item.name === activeId);
  if (!agent || !(agent.owners || []).includes(actor)) return null;
  return agent;
}

function requireActiveAgent(state, actor, role = 'core', title = 'Core Agent') {
  const agent = activeAgentFor(state, actor);
  if (agent) return agent;
  throw new Error([
    `Agent diperlukan sebelum autosycn untuk ${actor}.`,
    `Task ini perlukan ${title}. Agent ini belum ada nama lagi atau belum dipilih.`,
    `Jalankan: node .MOP/scripts/mop-core.mjs agent activate --actor ${actor} --role ${role} --title "${title}" --name "<agent-name>"`
  ].join(' '));
}

// Refuse identity-bound git work unless `actor` holds a valid, non-expired
// session. This stops a new person in a new chat from pushing under a previous
// member's carried-over identity. Mirrors mop-core session rules (read-only).
function requireValidSession(state, actor) {
  if (state.sessionPolicy?.enabled === false) return;
  const session = state.session || {};
  const lastActive = session.lastActiveAt || state.lastActiveAt;
  const minutes = Number(state.sessionPolicy?.idleTimeoutMinutes || 60);
  const idleMs = (Number.isFinite(minutes) && minutes > 0 ? minutes : 60) * 60 * 1000;
  if (!session.actor || !lastActive) {
    throw new Error(`No authenticated session for autosycn. ${actor} must login first: node .MOP/scripts/mop-core.mjs login --codename ${actor} --password <pass>`);
  }
  if (session.actor !== actor) {
    throw new Error(`Session belongs to ${session.actor}, not ${actor}. Refusing to push under another member's identity. The active member must logout, then ${actor} must login.`);
  }
  if (Date.now() - new Date(lastActive).getTime() > idleMs) {
    throw new Error(`Session expired (idle > ${minutes} min). ${actor} must login again before autosycn.`);
  }
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
    visibleAgentFormat: 'agent: <agent-name> (<agent-role>) to <user>'
  };
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
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

function answerLineFor(state, actor, agent = activeAgentFor(state, actor)) {
  if (!agent) return 'agent: <name> (<role>) to <user>';
  return (answerPolicy(state).visibleAgentFormat || 'agent: <agent-name> (<agent-role>) to <user>')
    .replace('<agent-name>', agent.name)
    .replace('<agent-role>', agent.role)
    .replace('<agent-title>', agent.title || agent.role)
    .replace('<user>', actor || 'user');
}

function appendMonthlyMemory(state, actor, kind, summary, agent = activeAgentFor(state, actor)) {
  if (memoryPolicy(state).enabled === false) return;
  const entry = { at: now(), actor, ...agentLedgerFields(agent), kind, summary };
  const monthlyPath = monthlyMemoryPath(state);
  mkdirSync(dirname(monthlyPath), { recursive: true });
  writeFileSync(monthlyPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', flag: 'a' });
  writeSessionBrief(state, actor);
}

function writeSessionBrief(state, actor) {
  const path = sessionBriefPath(state);
  const agent = activeAgentFor(state, actor);
  const entries = latestMemoryEntries(state, memoryPolicy(state).recentLimit || 20);
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
    '2. Restore memory with `node .MOP/scripts/mop-core.mjs memory brief --actor <codename>`.',
    '3. Run `agent route` for the user task before answering.',
    `4. Start every authenticated answer with: \`${answerLineFor(state, actor, agent)}\``,
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

function appendLedger(state, actor, kind, summary, agent = activeAgentFor(state, actor)) {
  state.ledger ||= [];
  state.ledger.push({ at: now(), actor, ...agentLedgerFields(agent), kind, summary });
}

function guardianConfig(state) {
  return state.autosync?.mergeGuardian || {
    enabled: true,
    name: 'BURHAN-MOP',
    autoReviewAfterPush: true,
    decision: 'required',
    checks: {}
  };
}

function getMember(state, actor) {
  const member = state.members?.[actor];
  if (!member) throw new Error(`Unknown actor: ${actor}`);
  return member;
}

function githubIdentityPolicy(state) {
  return state.autosync?.githubIdentity || {
    requireMatchedGhUser: true,
    useNoreplyForMemberCommits: true,
    noreplyFormat: 'id-plus-login'
  };
}

function currentGhUser() {
  const result = runOptional('gh', ['api', 'user', '--jq', '{login:.login,id:.id,email:.email}']);
  if (!result.ok) return null;
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

function identityFor(state, actor) {
  const member = getMember(state, actor);
  const identity = member.gitIdentity || {};
  const policy = githubIdentityPolicy(state);
  const gh = currentGhUser();
  const name = identity.name || member.displayName || actor;
  const githubUsername = identity.githubUsername || member.github?.username || gh?.login || '';
  if (gh?.login && githubUsername && policy.requireMatchedGhUser !== false && gh.login.toLowerCase() !== githubUsername.toLowerCase()) {
    throw new Error(`GitHub CLI authenticated as ${gh.login}, expected ${githubUsername}. Refusing to commit or push as the wrong user.`);
  }
  let email = identity.email || member.github?.noreplyEmail || '';
  if (policy.useNoreplyForMemberCommits !== false) {
    email = githubNoreplyEmail(gh);
    if (!email) {
      throw new Error('GitHub noreply identity is required for member commits. Run gh auth login as the real user, or set autosync.githubIdentity.useNoreplyForMemberCommits=false.');
    }
  }
  if (!email && state.autosync?.requireUserGitEmail !== false) {
    throw new Error([
      `Missing git email for ${actor}.`,
      'Set a GitHub-verified email or let MOP derive GitHub noreply from gh:',
      `node .MOP/scripts/mop-core.mjs member git-identity --actor ${actor} --name "${name}" --email github-noreply [--github-username "<username>"]`
    ].join(' '));
  }
  return {
    name,
    email,
    githubUsername,
    githubUserId: gh?.login?.toLowerCase() === githubUsername.toLowerCase() ? gh.id : identity.githubUserId,
    emailSource: policy.useNoreplyForMemberCommits !== false ? 'github-noreply' : (identity.emailSource || 'manual')
  };
}

function identityEnv(identity) {
  return {
    GIT_AUTHOR_NAME: identity.name,
    GIT_AUTHOR_EMAIL: identity.email,
    GIT_COMMITTER_NAME: identity.name,
    GIT_COMMITTER_EMAIL: identity.email
  };
}

function mergeIdentityFor(state, actorIdentity) {
  const guardian = guardianConfig(state);
  const guardianIdentity = guardian.gitIdentity || {};
  return {
    name: guardianIdentity.name || guardian.name || 'BURHAN-MOP',
    email: guardianIdentity.email || 'burhan-mop@users.noreply.github.com',
    githubUsername: guardianIdentity.githubUsername || 'BURHAN-MOP'
  };
}

function ensureGitRepo() {
  if (!existsSync(join(rootDir, '.git'))) {
    throw new Error(`Not a git repository: ${rootDir}`);
  }
  runGit(['rev-parse', '--show-toplevel']);
}

function ensureGitRepoForInit() {
  if (!existsSync(join(rootDir, '.git'))) {
    const init = runGitAllowFailure(['init', '-b', 'main']);
    if (init.status !== 0) {
      runGit(['init']);
      runGit(['branch', '-M', 'main']);
    }
  }
  runGit(['rev-parse', '--show-toplevel']);
}

function remoteBranchExists(branch) {
  const result = runOptional('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch]);
  return result.ok;
}

function localBranchExists(branch) {
  return runOptional('git', ['rev-parse', '--verify', branch]).ok;
}

function configureLocalIdentity(identity) {
  runGit(['config', '--local', 'user.name', identity.name]);
  runGit(['config', '--local', 'user.email', identity.email]);
}

function configureRemote(url, replaceRemote = false) {
  const existing = runOptional('git', ['remote', 'get-url', 'origin']);
  if (existing.ok) {
    if (url && existing.stdout !== url) {
      if (!replaceRemote) {
        throw new Error(`origin already points to ${existing.stdout}. Re-run with --replace-remote to set ${url}.`);
      }
      runGit(['remote', 'set-url', 'origin', url]);
      return url;
    }
    return existing.stdout;
  }
  if (!url) throw new Error('Missing --url and no origin remote is configured.');
  runGit(['remote', 'add', 'origin', url]);
  return url;
}

function verifyGhUser(identity, state) {
  const policy = githubIdentityPolicy(state);
  if (state.autosync?.verifyGhUserWhenConfigured === false && policy.requireMatchedGhUser === false) return 'skipped';
  const gh = currentGhUser();
  if (!gh?.login) {
    throw new Error('GitHub username is configured, but gh could not verify the active account. Run gh auth login as the real user or set autosync.verifyGhUserWhenConfigured=false for SSH-only workflows.');
  }
  if (identity.githubUsername && gh.login.toLowerCase() !== identity.githubUsername.toLowerCase()) {
    throw new Error(`GitHub CLI authenticated as ${gh.login}, expected ${identity.githubUsername}. Refusing to push as the wrong account.`);
  }
  return `verified:${gh.login}:${githubNoreplyEmail(gh) || 'email-unavailable'}`;
}

function runProjectCommand(command, env) {
  if (!command) return 'skipped';
  const result = spawnSync(command, {
    cwd: rootDir,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: true
  });
  if (result.status !== 0) {
    const detail = `${result.stderr || result.stdout}`.trim();
    throw new Error(`Command failed: ${command}${detail ? `: ${detail}` : ''}`);
  }
  return 'passed';
}

function highConfidenceSecretPattern() {
  return /(AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z_]{20,}|github_pat_[0-9A-Za-z_]{20,}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[0-9A-Za-z-]{20,})/;
}

function scanDiffForHighConfidenceSecrets(diffArgs, label) {
  // Exclude .MOP/scripts/ — those files contain the pattern definitions and test fixtures
  // that self-referentially match the secret regex (false positives).
  const diff = runOptional('git', ['diff', '--no-ext-diff', ...diffArgs, '--', '.', ':!.MOP/scripts/']);
  if (!diff.ok || !diff.stdout) return 'passed';
  if (!highConfidenceSecretPattern().test(diff.stdout)) return 'passed';
  const names = runOptional('git', ['diff', '--name-only', ...diffArgs, '--', '.', ':!.MOP/scripts/']);
  const changedFiles = names.stdout || 'changed files unavailable';
  throw new Error(`Possible high-confidence secret found in ${label}:\n${changedFiles}`);
}

function validateStateIfPresent() {
  if (!existsSync(join(rootDir, '.MOP', 'STATE.json'))) return 'skipped';
  const result = spawnSync('node', ['.MOP/scripts/mop-core.mjs', 'validate'], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    const detail = `${result.stderr || result.stdout}`.trim();
    throw new Error(`State validation failed${detail ? `: ${detail}` : ''}`);
  }
  return 'passed';
}

function guardianReject(message) {
  throw new Error(`BURHAN-MOP rejected merge: ${message}`);
}

function guardianReview(state, sourceRef, env) {
  const guardian = guardianConfig(state);
  const checks = guardian.checks || {};
  const mainBranch = state.autosync?.targetMainBranch || 'main';
  const report = {
    guardian: guardian.name || 'BURHAN-MOP',
    source: sourceRef,
    main: mainBranch,
    checks: {}
  };

  if (checks.workingTreeCleanAfterCommit !== false) {
    const dirty = runGit(['status', '--porcelain']);
    if (dirty) guardianReject('working tree is not clean before merge review');
    report.checks.workingTreeCleanAfterCommit = 'passed';
  }

  runGit(['fetch', 'origin']);
  if (checks.branchUpToDateWithMain !== false) {
    const ancestor = runOptional('git', ['merge-base', '--is-ancestor', `origin/${mainBranch}`, sourceRef]);
    if (!ancestor.ok) {
      guardianReject(`${sourceRef} is not up to date with origin/${mainBranch}. Run preflight first.`);
    }
    report.checks.branchUpToDateWithMain = 'passed';
  }

  if (checks.secretScan !== false) {
    const pattern = '(AIza|ghp_|github_pat_|sk-[A-Za-z0-9]|xox[baprs]-|password\\s*[:=]|secret\\s*[:=]|api[_-]?key\\s*[:=]|token\\s*[:=])';
    const scan = runOptional('git', ['diff', '--name-only', '-G', pattern, `origin/${mainBranch}..${sourceRef}`, '--', '.']);
    if (scan.ok && scan.stdout) {
      guardianReject(`possible secret pattern found in changed files:\n${scan.stdout}`);
    }
    report.checks.secretScan = 'passed';
  }

  report.checks.stateValid = checks.stateValid === false ? 'skipped-before-merge' : 'pending-after-merge';
  report.checks.testCommand = checks.testCommand ? 'pending-after-merge' : 'skipped';
  report.checks.buildCommand = checks.buildCommand ? 'pending-after-merge' : 'skipped';
  return report;
}

function commitIfNeeded(reason, env, state) {
  runGit(['add', '-A']);
  const status = runGit(['status', '--porcelain']);
  if (!status) return 'nothing-to-commit';
  if (state?.autosync?.secretScanBeforeCommit !== false) {
    scanDiffForHighConfidenceSecrets(['--cached'], 'staged changes');
  }
  runGit(['commit', '-m', reason], { env });
  return runGit(['rev-parse', '--short', 'HEAD']);
}

function currentBranch() {
  return runGit(['branch', '--show-current']);
}

function workBranchFor(state, actor) {
  const mainBranch = state.autosync?.targetMainBranch || 'main';
  const prefix = state.autosync?.workBranchPrefix || 'dev';
  return state.mode === 'team' ? `${prefix}/${actor}` : mainBranch;
}

function ensureBranch(branch) {
  runGit(['fetch', 'origin']);
  if (localBranchExists(branch)) {
    runGit(['checkout', branch]);
  } else if (remoteBranchExists(branch)) {
    runGit(['checkout', '-B', branch, `origin/${branch}`]);
  } else {
    runGit(['checkout', '-B', branch]);
  }
}

function syncMainFromOrigin(state, env) {
  const mainBranch = state.autosync?.targetMainBranch || 'main';
  runGit(['fetch', 'origin']);
  if (localBranchExists(mainBranch)) {
    runGit(['checkout', mainBranch]);
  } else if (remoteBranchExists(mainBranch)) {
    runGit(['checkout', '-B', mainBranch, `origin/${mainBranch}`]);
  } else {
    runGit(['checkout', '-B', mainBranch]);
  }
  if (remoteBranchExists(mainBranch)) {
    runGit(['pull', '--ff-only', 'origin', mainBranch], { env });
  }
  return mainBranch;
}

function preflight(args) {
  ensureGitRepo();
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = requireArg(args, 'actor');
  const agent = requireActiveAgent(state, actor);
  requireValidSession(state, actor);
  const identity = identityFor(state, actor);
  const env = identityEnv(identity);
  const ghStatus = verifyGhUser(identity, state);
  configureLocalIdentity(identity);

  const dirty = runGit(['status', '--porcelain']);
  if (dirty) {
    throw new Error('Working tree has uncommitted changes. Run autosycn or commit/stash before preflight.');
  }

  const mainBranch = syncMainFromOrigin(state, env);
  const workBranch = workBranchFor(state, actor);
  if (workBranch !== mainBranch) {
    if (localBranchExists(workBranch)) {
      runGit(['checkout', workBranch]);
    } else if (remoteBranchExists(workBranch)) {
      runGit(['checkout', '-B', workBranch, `origin/${workBranch}`]);
    } else {
      runGit(['checkout', '-B', workBranch, mainBranch]);
    }
    const merge = runGitAllowFailure(['merge', '--no-edit', mainBranch], { env });
    if (merge.status !== 0) {
      runOptional('git', ['merge', '--abort']);
      const detail = `${merge.stderr || merge.stdout}`.trim();
      throw new Error(`Could not sync ${workBranch} with ${mainBranch}. Merge aborted.${detail ? ` ${detail}` : ''}`);
    }
  }

  console.log(JSON.stringify({
    ok: true,
    actor,
    agent: agent.name,
    ghStatus,
    mainBranch,
    workBranch,
    head: runGit(['rev-parse', '--short', 'HEAD'])
  }, null, 2));
}

function saveMemory(actor, summary, kind = 'conversation') {
  const state = readState();
  const agent = requireActiveAgent(state, actor);
  requireValidSession(state, actor);
  appendLedger(state, actor, 'memory', summary, agent);
  appendMonthlyMemory(state, actor, kind, summary, agent);
  writeState(state);
  return state;
}

function push(args) {
  ensureGitRepo();
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = requireArg(args, 'actor');
  const agent = requireActiveAgent(state, actor);
  requireValidSession(state, actor);
  const reason = String(args.reason || 'MOP autosycn');
  const identity = identityFor(state, actor);
  const env = identityEnv(identity);
  const ghStatus = verifyGhUser(identity, state);
  configureLocalIdentity(identity);

  const target = workBranchFor(state, actor);
  const before = currentBranch();
  const dirty = runGit(['status', '--porcelain']);
  if (state.mode === 'team' && before !== target && dirty) {
    throw new Error(`Team autosycn must commit from ${target}. Run preflight before starting work: node .MOP/scripts/mop-autosycn.mjs preflight --actor ${actor}`);
  }
  ensureBranch(target);
  const commit = commitIfNeeded(reason, env, state);
  runGit(['push', '-u', 'origin', target], { env });

  console.log(JSON.stringify({
    ok: true,
    actor,
    agent: agent.name,
    author: `${identity.name} <${identity.email}>`,
    ghStatus,
    branch: target,
    previousBranch: before,
    commit
  }, null, 2));
}

function init(args) {
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = requireArg(args, 'actor');
  const agent = requireActiveAgent(state, actor);
  requireValidSession(state, actor);
  if (actor !== state.ownerCodename) throw new Error('Only the owner can initialize autosycn.');
  const identity = identityFor(state, actor);
  const env = identityEnv(identity);
  const url = String(args.url || state.githubUrl || '');
  const ghStatus = verifyGhUser(identity, state);

  ensureGitRepoForInit();
  configureLocalIdentity(identity);
  const remote = configureRemote(url, args['replace-remote'] === true);
  runGit(['checkout', '-B', state.autosync?.targetMainBranch || 'main']);

  appendLedger(state, actor, 'autosycn-init', `Initialized autosycn remote ${remote}.`, agent);
  if (url) state.githubUrl = url;
  writeState(state);
  const commit = commitIfNeeded('Initialize MOP autosycn baseline', env, state);
  runGit(['push', '-u', 'origin', state.autosync?.targetMainBranch || 'main'], { env });

  console.log(JSON.stringify({
    ok: true,
    actor,
    agent: agent.name,
    author: `${identity.name} <${identity.email}>`,
    ghStatus,
    remote,
    branch: state.autosync?.targetMainBranch || 'main',
    commit
  }, null, 2));
}

function mergeMain(args) {
  ensureGitRepo();
  const state = readState();
  if (!state.initialized) throw new Error('MOP is not initialized.');
  const actor = requireArg(args, 'actor');
  const agent = requireActiveAgent(state, actor);
  requireValidSession(state, actor);

  // Enforce BURHAN-MOP handling all merges to main in team mode
  // Notice: The requireOwnerForMerge restriction has been explicitly removed 
  // so that all team members' code is safely merged by BURHAN-MOP.
  const from = String(args.from || actor);
  const prefix = state.autosync?.workBranchPrefix || 'dev';
  const reason = String(args.reason || `Merge ${prefix}/${from}`);
  const identity = identityFor(state, actor);
  const mergeIdentity = mergeIdentityFor(state, identity);
  const env = identityEnv(mergeIdentity);
  const ghStatus = verifyGhUser(identity, state);
  configureLocalIdentity(mergeIdentity);

  const mainBranch = state.autosync?.targetMainBranch || 'main';
  const source = `origin/${prefix}/${from}`;
  const guardian = guardianConfig(state);
  const review = guardian.enabled === false ? { guardian: 'disabled', checks: {} } : guardianReview(state, source, env);
  runGit(['checkout', mainBranch]);
  runGit(['pull', 'origin', mainBranch], { env });
  runGit(['fetch', 'origin']);
  const merge = runGitAllowFailure(['merge', '--no-ff', '--no-commit', source], { env });
  if (merge.status !== 0) {
    const conflicted = runOptional('git', ['diff', '--name-only', '--diff-filter=U']);
    const files = conflicted.stdout.split(/\r?\n/).filter(Boolean);
    if (files.length === 1 && files[0].replaceAll('\\', '/') === '.MOP/STATE.json') {
      runGit(['checkout', '--ours', '--', '.MOP/STATE.json']);
      runGit(['add', '.MOP/STATE.json']);
    } else {
      runOptional('git', ['merge', '--abort']);
      const detail = `${merge.stderr || merge.stdout}`.trim();
      guardianReject(`merge conflict outside STATE.json. Merge aborted.${detail ? ` ${detail}` : ''}`);
    }
  }
  try {
    if (guardian.checks?.stateValid !== false) review.checks.stateValid = validateStateIfPresent();
    review.checks.testCommand = runProjectCommand(guardian.checks?.testCommand || '', env);
    review.checks.buildCommand = runProjectCommand(guardian.checks?.buildCommand || '', env);

    if (existsSync(statePath)) {
      const mergedState = readState();
      appendLedger(mergedState, guardian.name || 'BURHAN-MOP', 'merge-approved', `${source} approved and merged to ${mainBranch}.`);
      writeState(mergedState);
      runGit(['add', '.MOP/STATE.json']);
    }
    runGit(['commit', '-m', reason], { env });
  } catch (error) {
    runOptional('git', ['merge', '--abort']);
    guardianReject(error.message);
  }
  runGit(['push', 'origin', mainBranch], { env });

  console.log(JSON.stringify({
    ok: true,
    actor,
    agent: agent.name,
    guardian: review.guardian,
    author: `${mergeIdentity.name} <${mergeIdentity.email}>`,
    ghStatus,
    merged: source,
    branch: mainBranch,
    review: review.checks,
    head: runGit(['rev-parse', '--short', 'HEAD'])
  }, null, 2));
}

function runAll(args) {
  const actor = requireArg(args, 'actor');
  const reason = String(args.reason || 'MOP autosycn');
  saveMemory(actor, reason);
  push({ ...args, actor, reason });
  const state = readState();
  const guardian = guardianConfig(state);
  if (state.mode === 'team' && state.autosync?.autoMergeToMain !== false && guardian.autoReviewAfterPush !== false) {
    const prefix = state.autosync?.workBranchPrefix || 'dev';
    console.log(`\nTeam member ${actor} pushed to ${prefix}/${actor} branch.`);
    console.log(`BURHAN-MOP will now review and merge to main.`);
    mergeMain({ actor, from: actor, reason: `${guardian.name || 'BURHAN-MOP'} approved merge ${prefix}/${actor}: ${reason}` });
  }
}

function status() {
  const state = readState();
  console.log(JSON.stringify({
    enabled: state.autosync?.enabled !== false,
    main: state.autosync?.targetMainBranch || 'main',
    workBranchPrefix: state.autosync?.workBranchPrefix || 'dev',
    autoMergeToMain: state.autosync?.autoMergeToMain !== false,
    secretScanBeforeCommit: state.autosync?.secretScanBeforeCommit !== false,
    mergeGuardian: guardianConfig(state),
    githubIdentity: githubIdentityPolicy(state),
    preflightBeforeWork: state.autosync?.preflightBeforeWork !== false,
    requireUserGitEmail: state.autosync?.requireUserGitEmail !== false,
    initialized: state.initialized,
    activeMember: state.activeMember,
    activeAgents: Object.fromEntries(Object.entries(state.activeAgents || {}).map(([codename, agentId]) => {
      const agent = (state.agentRoster || []).find((item) => item.id === agentId || item.name === agentId);
      return [codename, agent ? { name: agent.name, role: agent.role, id: agent.id } : { id: agentId, missing: true }];
    })),
    members: Object.fromEntries(Object.entries(state.members || {}).map(([key, member]) => [
      key,
      {
        displayName: member.displayName,
        gitIdentityConfigured: Boolean(member.gitIdentity?.email || member.github?.noreplyEmail),
        gitName: member.gitIdentity?.name || member.displayName || key,
        gitEmail: member.gitIdentity?.email || member.github?.noreplyEmail || '',
        githubUsername: member.gitIdentity?.githubUsername || member.github?.username || ''
      }
    ]))
  }, null, 2));
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === 'status') return status();
  if (command === 'preflight' || command === 'start') return preflight(args);
  if (command === 'init') return init(args);
  if (command === 'memory') {
    const actor = requireArg(args, 'actor');
    const summary = String(args.summary || args.reason || 'MOP conversation');
    const kind = String(args.kind || 'conversation');
    saveMemory(actor, summary, kind);
    console.log(`Memory saved for ${actor}.`);
    return;
  }
  if (command === 'push') return push(args);
  if (command === 'merge') return mergeMain(args);
  if (command === 'run') return runAll(args);

  console.log(`Usage:
  node .MOP/scripts/mop-autosycn.mjs status
  node .MOP/scripts/mop-autosycn.mjs preflight --actor <codename>
  node .MOP/scripts/mop-autosycn.mjs init --actor <owner-codename> --url <github-url>
  node .MOP/scripts/mop-autosycn.mjs memory --actor <codename> --summary "what happened"
  node .MOP/scripts/mop-autosycn.mjs push --actor <codename> --reason "what changed"
  node .MOP/scripts/mop-autosycn.mjs merge --actor <owner> --from <codename> --reason "merge reason"
  node .MOP/scripts/mop-autosycn.mjs run --actor <codename> --reason "what changed"`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
