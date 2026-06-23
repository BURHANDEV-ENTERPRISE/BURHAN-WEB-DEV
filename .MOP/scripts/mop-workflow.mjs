#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const coreDir = resolve(here, '..');
const rootDir = resolve(coreDir, '..');
const statePath = join(coreDir, 'STATE.json');

function now() {
  return new Date().toISOString();
}

function readJson(path, fallback = {}) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readState() {
  return readJson(statePath);
}

// ─── Fasa 1.4: Memory integration for relatedDecisions ──────────────────────

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

const STOP_WORDS_WF = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'ini', 'itu', 'ada',
  'dengan', 'oleh', 'akan', 'juga', 'sudah', 'saya', 'awak', 'kita', 'dia',
  'the', 'a', 'an', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of', 'and',
  'or', 'but', 'not', 'this', 'that', 'was', 'are', 'be', 'been', 'has'
]);

function tokenizeWF(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS_WF.has(t));
}

function simpleRelevance(entry, queryTokens) {
  const tokens = tokenizeWF(entry.summary || '');
  return queryTokens.reduce((score, qt) => {
    return tokens.includes(qt) ? score + 1 : score;
  }, 0);
}

function relatedDecisionsFor(state, task, limit = 3) {
  if (!task) return [];
  const queryTokens = tokenizeWF(task);
  if (!queryTokens.length) return [];
  const memDir = join(rootDir, state.memoryPolicy?.directory || '.MOP/memory');
  if (!existsSync(memDir)) return [];

  // Read working.jsonl (current session) + facts.json (promoted) + last 2 episodic months
  const working = readJsonl(join(memDir, 'working.jsonl'));
  const facts = (() => { try { return JSON.parse(readFileSync(join(memDir, 'facts.json'), 'utf8') || '[]'); } catch { return []; } })();
  const monthFiles = readdirSync(memDir)
    .filter((n) => /^\d{4}-\d{2}\.jsonl$/.test(n))
    .sort()
    .slice(-2);
  const episodic = monthFiles.flatMap((f) => readJsonl(join(memDir, f)));
  const allEntries = [...facts, ...working, ...episodic];

  return allEntries
    .map((e) => ({ ...e, _rel: simpleRelevance(e, queryTokens) }))
    .filter((e) => e._rel > 0)
    .sort((a, b) => b._rel - a._rel)
    .slice(0, limit)
    .map(({ _rel, ...e }) => e);
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

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return base;
  const result = { ...(base || {}) };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function mergedConfig(state, actor = '') {
  const files = state.customization?.files || {};
  const defaults = readJson(join(rootDir, files.defaults || '.MOP/config/defaults.json'));
  const team = readJson(join(rootDir, files.team || '.MOP/config/team.json'));
  const memberPattern = files.memberPattern || '.MOP/config/members/<codename>.json';
  const memberPath = actor ? join(rootDir, memberPattern.replace('<codename>', slug(actor))) : '';
  const member = memberPath ? readJson(memberPath) : {};
  return deepMerge(deepMerge(defaults, team), member);
}

function actorAllowed(state, actor) {
  if (!state.initialized) return true;
  if (!actor) throw new Error('Missing --actor');
  if (!state.members?.[actor]) throw new Error(`Unknown actor: ${actor}`);
  return true;
}

function phaseById(state, id) {
  return (state.workflow?.phases || []).find((phase) => phase.id === id) || null;
}

function getPhaseOrder(state, profileName) {
  if (profileName && state.workflow?.profiles?.[profileName]?.phaseOrder) {
    return state.workflow.profiles[profileName].phaseOrder;
  }
  return state.workflow?.phaseOrder || [];
}

function inferPhase(state, task) {
  const text = task.toLowerCase();
  if (/\b(deploy|release|vercel|docker|publish)\b/.test(text)) return 'release';
  if (/\b(review|semak|audit|bug|risk|risiko)\b/.test(text)) return 'review';
  if (/\b(code|implement|fix|build|buat file|ubah file)\b/.test(text)) return 'readiness';
  if (/\b(architecture|database|api|backend|security|infra)\b/.test(text)) return 'architecture';
  if (/\b(ui|ux|design|screen|layout|animation|scroll)\b/.test(text)) return 'ux-spec';
  if (/\b(prd|requirement|acceptance|user story)\b/.test(text)) return 'prd';
  if (/\b(plan|idea|konsep|scope|roadmap)\b/.test(text)) return 'brief';
  return state.workflow?.currentPhase || state.workflow?.phaseOrder?.[0] || 'idea';
}

function currentAndNext(state, task = '', profileName = '') {
  const order = getPhaseOrder(state, profileName);
  let phaseId = task ? inferPhase(state, task) : (state.workflow?.currentPhase || order[0] || 'idea');
  if (!order.includes(phaseId)) {
    if (phaseId === 'prd' || phaseId === 'ux-spec') {
      if (order.includes('brief')) phaseId = 'brief';
      else if (order.includes('architecture')) phaseId = 'architecture';
    }
  }
  const phase = phaseById(state, phaseId) || phaseById(state, 'idea');
  const index = Math.max(0, order.indexOf(phase?.id));
  const nextPhase = phaseById(state, order[index + 1]) || null;
  return { phase, nextPhase };
}

function status(args) {
  const state = readState();
  const actor = args.actor ? slug(args.actor) : '';
  const config = mergedConfig(state, actor);
  const task = String(args.task || '');
  const profileName = args.profile || '';
  const { phase, nextPhase } = currentAndNext(state, task, profileName);
  const relatedDecisions = relatedDecisionsFor(state, task);
  console.log(JSON.stringify({
    workflow: state.workflow?.name || 'MOP Workflow',
    enabled: state.workflow?.enabled !== false,
    currentPhase: state.workflow?.currentPhase,
    profile: profileName || 'default',
    suggestedPhase: phase,
    nextPhase,
    relatedDecisions,
    customization: config.workflow || {},
    artifacts: {
      directory: state.artifacts?.directory || '.MOP/artifacts',
      layout: state.artifacts?.layout || 'category/artifact-slug/type.md',
      folderByType: state.artifacts?.folderByType || {}
    },
    projectRootPolicy: state.projectRootPolicy || config.projectRootPolicy || {},
    readinessGate: state.readinessGate || {},
    adversarialReview: state.adversarialReview || {}
  }, null, 2));
}

function help(args) {
  const state = readState();
  const actor = args.actor ? slug(args.actor) : '';
  if (actor) actorAllowed(state, actor);
  const task = String(args.task || args._?.join(' ') || '');
  const profileName = args.profile || '';
  const { phase, nextPhase } = currentAndNext(state, task, profileName);
  const profileObj = profileName ? state.workflow?.profiles?.[profileName] : null;
  const readinessRequired = (profileObj?.mandatoryReadiness === true) || 
                            ['readiness', 'implementation'].includes(phase?.id) || 
                            /\b(code|implement|build|fix)\b/i.test(task);
  const nextArtifact = phase?.artifact || 'product-brief';
  const nextCategory = artifactCategoryFor(state, args, nextArtifact);
  const relatedDecisions = relatedDecisionsFor(state, task);
  console.log(JSON.stringify({
    question: task || 'lepas ni buat apa?',
    answer: phase ? `Next best step: ${phase.title}.` : 'Next best step: capture the idea.',
    profile: profileName || 'default',
    phase: phase?.id || 'idea',
    leadAgentRole: phase?.primaryRole || 'planner',
    partyRoles: phase?.partyRoles || [],
    nextArtifact,
    nextArtifactCategory: nextCategory,
    nextArtifactPathPattern: `${state.artifacts?.directory || '.MOP/artifacts'}/${nextCategory}/<artifact-slug>/${nextArtifact}.md`,
    nextCommand: `node .MOP/scripts/mop-workflow.mjs artifact create --actor ${actor || '<codename>'} --type ${nextArtifact} --title "<title>"`,
    readinessRequired,
    readinessCommand: `node .MOP/scripts/mop-workflow.mjs gate readiness --actor ${actor || '<codename>'} --task "<task>"${profileName ? ` --profile ${profileName}` : ''}`,
    nextPhase: nextPhase?.id || null,
    relatedDecisions
  }, null, 2));
}

function setPhase(args) {
  const state = readState();
  const actor = slug(requireArg(args, 'actor'));
  actorAllowed(state, actor);
  const phase = requireArg(args, 'phase');
  if (!phaseById(state, phase)) throw new Error(`Unknown phase: ${phase}`);
  state.workflow.currentPhase = phase;
  state.ledger ||= [];
  state.ledger.push({ at: now(), actor, kind: 'workflow-phase', summary: `Set MOP workflow phase to ${phase}.` });
  writeState(state);
  console.log(`Workflow phase set: ${phase}`);
}

function renderTemplate(template, values) {
  return template.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => values[key] || '');
}

function artifactCategoryFor(state, args, type) {
  const folderByType = state.artifacts?.folderByType || {};
  const selected = args.category || args.folder || folderByType[type] || state.artifacts?.defaultCategory || 'general';
  return slug(selected) || 'general';
}

function artifactCreate(args) {
  const state = readState();
  const actor = slug(requireArg(args, 'actor'));
  actorAllowed(state, actor);
  const type = slug(requireArg(args, 'type'));
  if (!(state.artifacts?.types || []).includes(type)) throw new Error(`Unknown artifact type: ${type}`);
  const title = String(args.title || type);
  const artifactSlug = slug(args.slug || title || type);
  const category = artifactCategoryFor(state, args, type);
  const artifactRoot = join(rootDir, state.artifacts?.directory || '.MOP/artifacts', category, artifactSlug);
  const templatePath = join(rootDir, state.artifacts?.templateDirectory || '.MOP/templates/artifacts', `${type}.md`);
  const template = existsSync(templatePath)
    ? readFileSync(templatePath, 'utf8')
    : `# {{title}}\n\n## Notes\n\n`;
  const outputPath = join(artifactRoot, `${type}.md`);
  const relativePath = outputPath.replace(rootDir, '').replace(/^[\\/]/, '');
  if (args['dry-run'] === true) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      actor,
      type,
      category,
      layout: state.artifacts?.layout || 'category/artifact-slug/type.md',
      path: relativePath
    }, null, 2));
    return;
  }
  mkdirSync(artifactRoot, { recursive: true });
  if (existsSync(outputPath) && args.force !== true) {
    throw new Error(`Artifact already exists: ${outputPath}. Re-run with --force to overwrite.`);
  }
  const content = renderTemplate(template, {
    title,
    intent: String(args.intent || ''),
    user: String(args.user || ''),
    problem: String(args.problem || ''),
    outcome: String(args.outcome || ''),
    goal: String(args.goal || ''),
    context: String(args.context || ''),
    summary: String(args.summary || ''),
    state: String(args.state || ''),
    decision: String(args.decision || ''),
    date: now()
  });
  writeFileSync(outputPath, content, 'utf8');
  console.log(JSON.stringify({
    ok: true,
    actor,
    type,
    category,
    layout: state.artifacts?.layout || 'category/artifact-slug/type.md',
    path: relativePath
  }, null, 2));
}

// Semak artifact freshness — return senarai yang STALE
function checkArtifactStaleness(artifactDir = '.MOP/artifacts') {
  const stale = [];
  const absArtifactDir = join(rootDir, artifactDir);
  if (!existsSync(absArtifactDir)) return stale;

  const STALE_DAYS = 7;
  const now = Date.now();

  for (const type of ['prd', 'architecture', 'story']) {
    const dir = join(absArtifactDir, type);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const fullPath = join(dir, file);
      try {
        const mtime = statSync(fullPath).mtimeMs;
        const ageDays = (now - mtime) / (1000 * 60 * 60 * 24);
        if (ageDays > STALE_DAYS) {
          stale.push({ file: fullPath.replace(rootDir, '').replace(/^[\\/]/, ''), ageDays: Math.round(ageDays) });
        }
      } catch {
        // ignore
      }
    }
  }
  return stale;
}

// Semak workflow drift — adakah implementation tanpa readiness?
function checkWorkflowDrift(state) {
  const ledger = state.ledger ?? [];
  const now = Date.now();
  const window48h = 48 * 60 * 60 * 1000;

  const recentImpl = ledger.find(e =>
    e.kind === 'implementation' && (now - new Date(e.at || e.timestamp).getTime()) < window48h
  );
  const recentReadiness = ledger.find(e =>
    e.kind === 'readiness' && (now - new Date(e.at || e.timestamp).getTime()) < window48h
  );

  if (recentImpl && !recentReadiness) {
    return { drift: true, reason: 'skipped-readiness-gate', since: recentImpl.at || recentImpl.timestamp };
  }
  return { drift: false };
}

// Start workflow dengan profile tertentu
function workflowStart(profileName, state) {
  const profiles = state.workflow?.profiles ?? {};
  if (!profiles[profileName]) {
    throw new Error(`Profile tidak dijumpai: ${profileName}. Pilih: ${Object.keys(profiles).join(', ')}`);
  }
  state.workflow.activeProfile = profileName;
  state.workflow.phaseOrder = profiles[profileName].phaseOrder || profiles[profileName];
  state.workflow.currentPhase = state.workflow.phaseOrder[0];
  return state;
}

function readiness(args) {
  const state = readState();
  const actor = slug(requireArg(args, 'actor'));
  actorAllowed(state, actor);
  const task = String(args.task || args._?.join(' ') || '');
  const artifact = String(args.artifact || '');
  const profileName = args.profile || '';
  const { phase } = currentAndNext(state, task, profileName);
  const text = `${task}\n${artifact && existsSync(join(rootDir, artifact)) ? readFileSync(join(rootDir, artifact), 'utf8') : ''}`.toLowerCase();
  
  let isStale = false;
  if (artifact) {
    const artPath = resolve(rootDir, artifact);
    if (existsSync(artPath)) {
      try {
        const stat = statSync(artPath);
        const mtimeSec = stat.mtimeMs / 1000;
        const gitLog = spawnSync('git', ['log', '-1', '--format=%ct'], { cwd: rootDir, encoding: 'utf8' });
        if (gitLog.status === 0 && gitLog.stdout) {
          const lastCommitSec = parseInt(gitLog.stdout.trim(), 10);
          if (!isNaN(lastCommitSec) && (lastCommitSec - mtimeSec) > 7 * 24 * 3600) {
            isStale = true;
          }
        }
      } catch (err) {
        // Ignore
      }
    }
  }

  const checks = state.readinessGate?.checks || [];
  const missing = [];
  const passed = [];
  for (const check of checks) {
    let ok = false;
    if (check === 'intent-clear') ok = task.length > 20;
    else if (check === 'user-and-success-defined') ok = /\b(user|pengguna|owner|customer|success|berjaya|goal|outcome)\b/.test(text);
    else if (check === 'scope-bounded') ok = /\b(scope|in:|out:|mvp|phase|limit|batas)\b/.test(text);
    else if (check === 'artifacts-current') ok = Boolean(artifact) || /\b(prd|brief|architecture|story|spec)\b/.test(text);
    else if (check === 'data-contract-clear') ok = /\b(api|data|schema|contract|interface|field|endpoint|storage)\b/.test(text);
    else if (check === 'acceptance-criteria-present') ok = /\b(acceptance|criteria|done|siap|test|expected)\b/.test(text);
    else if (check === 'risks-reviewed') ok = /\b(risk|risiko|tradeoff|edge|failure|fallback)\b/.test(text);
    else if (check === 'tests-planned') ok = /\b(test|testing|qa|validate|verification|playwright|unit)\b/.test(text);
    else if (check === 'rollback-or-undo-known') ok = /\b(rollback|undo|backup|revert|restore)\b/.test(text);
    if (ok) passed.push(check);
    else missing.push(check);
  }

  if (isStale) {
    missing.push('artifact-freshness');
  }

  let status = missing.length === 0 ? 'ready' : missing.length <= 3 ? 'needs-clarity' : 'blocked';
  if (phase?.id === 'implementation' && isStale) {
    status = 'blocked';
  }

  const gateResult = {
    status,
    canCode: status === 'ready',
    stale: isStale,
    profile: profileName || 'default',
    passed,
    missing,
    questions: missing.map((check) => `Clarify ${check.replaceAll('-', ' ')}.`),
    next: status === 'ready'
      ? 'Proceed to implementation with autosycn.'
      : 'Ask clarification or create/update the required artifact before coding.'
  };

  // Fasa 2 check staleness
  const stale = checkArtifactStaleness();
  if (stale.length > 0) {
    const isImplementation = phase?.id === 'implementation';
    gateResult.artifactStaleness = {
      status: isImplementation ? 'blocked' : 'warning',
      staleFiles: stale
    };
    if (isImplementation) {
      gateResult.canCode = false;
      gateResult.status = 'blocked';
      gateResult.reason = `${stale.length} artifact STALE (>7 hari). Kemaskini sebelum implementation.`;
    }
  }

  // Fasa 2 check workflow drift
  const drift = checkWorkflowDrift(state);
  if (drift.drift) {
    gateResult.driftWarning = drift;
  }

  console.log(JSON.stringify(gateResult, null, 2));
}

function driftCheck(args) {
  const state = readState();
  const actor = slug(requireArg(args, 'actor'));
  actorAllowed(state, actor);
  
  const profileName = args.profile || '';
  const phaseOrder = getPhaseOrder(state, profileName);
  
  const ledger = state.ledger || [];
  const visited = [];
  for (const entry of ledger) {
    if (entry.kind === 'workflow-phase') {
      const match = String(entry.summary || '').match(/Set MOP workflow phase to (\w+)\.?/);
      if (match && match[1]) {
        visited.push(match[1]);
      }
    }
  }
  
  const currentPhase = state.workflow?.currentPhase || phaseOrder[0] || 'idea';
  const currIdx = phaseOrder.indexOf(currentPhase);
  
  const skippedPhases = [];
  if (currIdx > 0) {
    for (let i = 0; i < currIdx; i++) {
      const p = phaseOrder[i];
      if (!visited.includes(p)) {
        skippedPhases.push(p);
      }
    }
  }
  
  const drifted = skippedPhases.length > 0;
  console.log(JSON.stringify({
    drifted,
    skippedPhases,
    ledgerPath: statePath
  }, null, 2));
}

function adversarialReview(args) {
  const state = readState();
  const actor = slug(requireArg(args, 'actor'));
  actorAllowed(state, actor);
  const target = String(args.target || args.task || args._?.join(' ') || '');
  const mode = String(args.mode || state.adversarialReview?.defaultMode || 'constructive-red-team');
  const result = {
    mode,
    target,
    reviewRoles: state.adversarialReview?.reviewRoles || [],
    prompts: [
      'What assumption could be false?',
      'Where could user intent be misunderstood?',
      'What breaks on mobile, slow devices, or bad network?',
      'What security/privacy issue could appear?',
      'What test would catch the most expensive failure?',
      'What is the smallest safer version?'
    ],
    verdictOptions: ['proceed', 'proceed-with-changes', 'block']
  };
  if (args.write === true) {
    artifactCreate({
      actor,
      type: 'adversarial-review',
      title: String(args.title || 'Adversarial Review'),
      context: target,
      force: args.force
    });
  }
  console.log(JSON.stringify(result, null, 2));
}

function configShow(args) {
  const state = readState();
  const actor = args.actor ? slug(args.actor) : '';
  console.log(JSON.stringify(mergedConfig(state, actor), null, 2));
}

function main() {
  const [command, subcommand, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === 'status') return status(args);
  if (command === 'help' || command === 'next') return help(parseArgs([subcommand, ...rest].filter(Boolean)));
  if (command === 'phase' && subcommand === 'set') return setPhase(args);
  if (command === 'artifact' && subcommand === 'create') return artifactCreate(args);
  if (command === 'gate' && subcommand === 'readiness') return readiness(args);
  if (command === 'review' && subcommand === 'adversarial') return adversarialReview(args);
  if (command === 'config' && subcommand === 'show') return configShow(args);
  if (command === 'drift' && subcommand === 'check') return driftCheck(args);

  console.log(`Usage:
  node .MOP/scripts/mop-workflow.mjs status [--actor CODE] [--task TEXT] [--profile NAME]
  node .MOP/scripts/mop-workflow.mjs help --actor CODE --task "what user asked" [--profile NAME]
  node .MOP/scripts/mop-workflow.mjs next --actor CODE --task "what user asked" [--profile NAME]
  node .MOP/scripts/mop-workflow.mjs phase set --actor CODE --phase prd
  node .MOP/scripts/mop-workflow.mjs artifact create --actor CODE --type prd --title "Title" [--category plan] [--dry-run]
  node .MOP/scripts/mop-workflow.mjs gate readiness --actor CODE --task "task" [--artifact path] [--profile NAME]
  node .MOP/scripts/mop-workflow.mjs review adversarial --actor CODE --target "plan or file" [--write]
  node .MOP/scripts/mop-workflow.mjs config show [--actor CODE]
  node .MOP/scripts/mop-workflow.mjs drift check --actor CODE [--profile NAME]`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
