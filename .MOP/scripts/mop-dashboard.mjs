#!/usr/bin/env node
// mop-dashboard.mjs — MOP Pixel Office Dashboard v2
// Inspired by pixel-agents-hq/pixel-agents (MIT)
// Adapted for MOP: reads STATE.json, supports 4 providers

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';
import { spawn } from 'node:child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = resolve(__dir, '..', 'STATE.json');
const DASHBOARD_DIR = resolve(__dir, '..', 'dashboard');
const PORT = 3131;
const shouldOpen = process.argv.includes('--open');

function openBrowser(url) {
  let command = 'xdg-open';
  let args = [url];
  if (platform() === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else if (platform() === 'darwin') {
    command = 'open';
  }
  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
  } catch {
    // Opening the browser is best-effort; the URL is printed either way.
  }
}

// ─── State Reader ─────────────────────────────────────────────────────────────
function readState() {
  if (!existsSync(STATE_PATH)) return null;
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf8')); }
  catch { return null; }
}

// ─── Agent Status dari Ledger ─────────────────────────────────────────────────
function getAgentStatus(state) {
  const catalog = state?.agentCatalog ?? [];
  const ledger  = state?.memory?.entries ?? [];
  const now     = Date.now();

  return catalog.map(agent => {
    // Cari aktiviti terkini agent ini (dalam 30 minit)
    const recent = ledger
      .filter(e => e.actor === agent.role || e.role === agent.role)
      .filter(e => (now - new Date(e.timestamp || e.at).getTime()) < 30 * 60 * 1000)
      .sort((a, b) => new Date(b.timestamp || b.at) - new Date(a.timestamp || a.at));

    const lastEntry = recent[0];
    let animation = 'idle';
    let activity  = 'Menunggu...';

    if (lastEntry) {
      const kind = lastEntry.kind ?? '';
      if (['implementation', 'coding', 'writing'].includes(kind)) {
        animation = 'typing'; activity = `Sedang coding...`;
      } else if (['review', 'readiness', 'adversarial'].includes(kind)) {
        animation = 'thinking'; activity = `Sedang review...`;
      } else if (['release', 'deploy', 'done'].includes(kind)) {
        animation = 'done'; activity = `Selesai: ${kind}`;
      } else {
        animation = 'thinking'; activity = lastEntry.summary?.slice(0, 40) ?? 'Aktif';
      }
    }

    return {
      role:       agent.role,
      title:      agent.title ?? agent.role,
      tier:       agent.tier ?? 9,
      provider:   'mop',
      animation,
      activity,
      lastSeen:   lastEntry?.timestamp ?? lastEntry?.at ?? null,
      phase:      lastEntry?.kind ?? null,
      superpower: agent.superpower ?? ''
    };
  });
}

// ─── API Endpoint ─────────────────────────────────────────────────────────────
function handleAPI(req, res) {
  const state = readState();
  if (!state) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'STATE.json tidak dijumpai' }));
  }

  const agents = getAgentStatus(state);
  const payload = {
    project:     state.project?.name ?? state.projectName ?? 'MOP Project',
    phase:       state.workflow?.currentPhase ?? 'unknown',
    profile:     state.workflow?.activeProfile ?? 'product',
    memberCount: Object.keys(state.members ?? {}).length,
    agentCount:  agents.length,
    memoryCount: (state.ledger ?? []).length,
    lastUpdate:  new Date().toISOString(),
    agents,
    phases: {
      order:     state.workflow?.phaseOrder ?? [],
      current:   state.workflow?.currentPhase ?? 'unknown',
      completed: state.workflow?.completedPhases ?? []
    },
    federation: {
      enabled:   state.federation?.enabled ?? false,
      syncCount: state.federation?.syncLog?.length ?? 0
    }
  };

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': `http://127.0.0.1:${PORT}`
  });
  res.end(JSON.stringify(payload));
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = createServer((req, res) => {
  const url = req.url ?? '/';

  if (url === '/api/state') return handleAPI(req, res);

  // Serve dashboard HTML
  const htmlPath = join(DASHBOARD_DIR, 'pixel-office.html');
  if (existsSync(htmlPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(htmlPath));
  } else {
    // Fallback: inline dashboard kalau fail HTML tak ada lagi
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateFallbackDashboard());
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`\n🟣 MOP Pixel Office berjalan: ${url}`);
  console.log(`   API: http://127.0.0.1:${PORT}/api/state`);
  console.log(`   Tekan Ctrl+C untuk henti\n`);
  if (shouldOpen) openBrowser(url);
});

// ─── Fallback Dashboard (inline HTML) ────────────────────────────────────────
function generateFallbackDashboard() {
  return `<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MOP Pixel Office</title>
<style>
  :root {
    --bg: #1a1a2e; --surface: #16213e; --accent: #e94560;
    --text: #eaeaea; --muted: #8892b0; --green: #64ffda;
    --amber: #ffd700; --purple: #c77dff; --pixel: 'Courier New', monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: var(--pixel); }

  /* ── Header ── */
  .header { background: var(--surface); border-bottom: 2px solid var(--accent);
    padding: 12px 20px; display: flex; align-items: center; gap: 16px; }
  .logo { font-size: 20px; font-weight: bold; color: var(--accent); letter-spacing: 2px; }
  .phase-badge { background: var(--accent); color: white; padding: 4px 12px;
    font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
  .stats { display: flex; gap: 16px; margin-left: auto; }
  .stat { text-align: center; }
  .stat-num { font-size: 20px; font-weight: bold; color: var(--green); }
  .stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; }

  /* ── Office Grid ── */
  .office { padding: 20px; }
  .office-title { font-size: 11px; color: var(--muted); text-transform: uppercase;
    letter-spacing: 2px; margin-bottom: 12px; }
  .agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px; }

  /* ── Agent Card ── */
  .agent-card { background: var(--surface); border: 1px solid #2d3561;
    padding: 12px; position: relative; cursor: pointer; transition: border-color 0.2s; }
  .agent-card:hover { border-color: var(--accent); }
  .agent-card.active { border-color: var(--green); }
  .agent-card.thinking { border-color: var(--purple); }
  .agent-card.done { border-color: var(--amber); }

  /* Pixel character */
  .pixel-char { width: 48px; height: 48px; margin: 0 auto 8px;
    image-rendering: pixelated; display: flex; align-items: center;
    justify-content: center; font-size: 32px; }
  .agent-name { font-size: 12px; font-weight: bold; text-align: center;
    color: var(--text); margin-bottom: 4px; }
  .agent-title { font-size: 10px; color: var(--muted); text-align: center;
    margin-bottom: 8px; }

  /* Status indicator */
  .status-dot { width: 8px; height: 8px; border-radius: 50%;
    display: inline-block; margin-right: 6px; }
  .dot-idle { background: var(--muted); }
  .dot-typing { background: var(--green); animation: pulse 1s infinite; }
  .dot-thinking { background: var(--purple); animation: pulse 1.5s infinite; }
  .dot-done { background: var(--amber); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .agent-activity { font-size: 10px; color: var(--muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tier-badge { position: absolute; top: 6px; right: 6px;
    font-size: 9px; color: var(--muted); }

  /* ── Workflow Bar ── */
  .workflow-bar { background: var(--surface); border-top: 1px solid #2d3561;
    padding: 12px 20px; position: fixed; bottom: 0; width: 100%; }
  .phases { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 4px; }
  .phase { padding: 4px 10px; font-size: 10px; text-transform: uppercase;
    letter-spacing: 1px; border: 1px solid #2d3561; white-space: nowrap; }
  .phase.current { background: var(--accent); border-color: var(--accent); color: white; }
  .phase.completed { border-color: var(--green); color: var(--green); }
  .phase.pending { color: var(--muted); }

  /* ── Speech Bubble ── */
  .bubble { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    background: var(--bg); border: 1px solid var(--green); padding: 4px 8px;
    font-size: 9px; white-space: nowrap; display: none; z-index: 10; }
  .bubble::after { content: ''; position: absolute; top: 100%; left: 50%;
    transform: translateX(-50%); border: 4px solid transparent;
    border-top-color: var(--green); }
  .agent-card:hover .bubble { display: block; }

  .refresh-hint { font-size: 10px; color: var(--muted); margin-left: auto; }
</style>
</head>
<body>

<div class="header">
  <span class="logo">⬛ MOP PIXEL OFFICE</span>
  <span class="phase-badge" id="current-phase">loading...</span>
  <div class="stats">
    <div class="stat"><div class="stat-num" id="stat-agents">0</div><div class="stat-label">Agents</div></div>
    <div class="stat"><div class="stat-num" id="stat-memory">0</div><div class="stat-label">Memory</div></div>
    <div class="stat"><div class="stat-num" id="stat-members">0</div><div class="stat-label">Members</div></div>
  </div>
  <span class="refresh-hint" id="last-update">—</span>
</div>

<div class="office" style="margin-bottom: 60px;">
  <div class="office-title">🏢 Agent Office Floor — MOP v2</div>
  <div class="agent-grid" id="agent-grid">
    <div style="color: var(--muted); font-size: 12px; padding: 20px;">
      Memuatkan state MOP...
    </div>
  </div>
</div>

<div class="workflow-bar">
  <div class="phases" id="phases-bar"></div>
</div>

<script>
// ── Pixel Art Characters (emoji fallback) ──────────────────────────────────────
const CHAR_EMOJI = {
  // Tier 1 — Strategi
  planner: '🧑‍💼', researcher: '🔬', orchestrator: '🎯', prompt: '✍️', seo: '📈',
  // Tier 2 — Reka bentuk
  ux: '🎨', accessibility: '♿', content: '📝', mobile: '📱',
  // Tier 3 — Arkitektur
  architect: '🏗️', database: '🗄️', 'data-ml': '🤖', migration: '🔄',
  // Tier 4 — Pembangunan
  coder: '💻', frontend: '🖥️', backend: '⚙️', devops: '🔧', deploy: '🚀',
  // Tier 5 — Kualiti
  reviewer: '🔍', tester: '🧪', security: '🔒', performance: '⚡', sandbox: '📦',
  // Tier 6 — Operasi
  github: '🐙', browser: '🌐', memory: '🧠', core: '💎', 'workflow-ci': '🔁',
  docs: '📄', design: '🖌️'
};

function renderAgent(agent) {
  const emoji = CHAR_EMOJI[agent.role] ?? '🤖';
  const dotClass = \`dot-\${agent.animation}\`;
  const cardClass = agent.animation !== 'idle' ? \`agent-card \${agent.animation}\` : 'agent-card';

  return \`
    <div class="\${cardClass}" data-role="\${agent.role}">
      <span class="tier-badge">T\${agent.tier}</span>
      <div class="bubble">\${agent.superpower?.slice(0,50) ?? agent.role}</div>
      <div class="pixel-char">\${emoji}</div>
      <div class="agent-name">\${agent.role.toUpperCase()}</div>
      <div class="agent-title">\${agent.title}</div>
      <div class="agent-activity">
        <span class="status-dot \${dotClass}"></span>
        \${agent.activity}
      </div>
    </div>
  \`;
}

function renderPhases(phases) {
  return (phases.order ?? []).map(p => {
    const isCurrent = p === phases.current;
    const isDone = (phases.completed ?? []).includes(p);
    const cls = isCurrent ? 'phase current' : isDone ? 'phase completed' : 'phase pending';
    return \`<span class="\${cls}">\${p}</span>\`;
  }).join('');
}

async function fetchAndRender() {
  try {
    const res = await fetch('/api/state');
    const data = await res.json();

    document.getElementById('current-phase').textContent = data.phase ?? '—';
    document.getElementById('stat-agents').textContent = data.agentCount;
    document.getElementById('stat-memory').textContent = data.memoryCount;
    document.getElementById('stat-members').textContent = data.memberCount;
    document.getElementById('last-update').textContent =
      'Kemaskini: ' + new Date(data.lastUpdate).toLocaleTimeString('ms-MY');

    // Sort agents by tier, then by activity (active first)
    const sorted = [...data.agents].sort((a, b) => {
      const aActive = a.animation !== 'idle' ? 0 : 1;
      const bActive = b.animation !== 'idle' ? 0 : 1;
      return aActive - bActive || a.tier - b.tier;
    });

    document.getElementById('agent-grid').innerHTML = sorted.map(renderAgent).join('');
    document.getElementById('phases-bar').innerHTML = renderPhases(data.phases);

    document.title = \`MOP — \${data.project} [\${data.phase}]\`;
  } catch (e) {
    document.getElementById('agent-grid').innerHTML =
      \`<div style="color:#e94560;padding:20px">Ralat: \${e.message}</div>\`;
  }
}

// Poll setiap 5 saat
fetchAndRender();
setInterval(fetchAndRender, 5000);
</script>

</body>
</html>`;
}
