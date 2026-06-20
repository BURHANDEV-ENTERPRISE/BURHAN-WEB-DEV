#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, '..', '..');

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
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

function startDashboard(args) {
  const actor = args.actor;
  const port = parseInt(args.port || '3000', 10);
  
  if (!actor) {
    console.log('Usage: node .MOP/scripts/mop-dashboard.mjs start --actor <codename> [--port 3000]');
    return;
  }

  const server = createServer((req, res) => {
    if (req.url === '/api/state') {
      const statePath = join(rootDir, '.MOP', 'STATE.json');
      const state = readJson(statePath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state, null, 2));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MOP Flow Dashboard</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; background: #0f172a; color: #e2e8f0; }
          h1 { color: #38bdf8; }
          .card { background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          pre { background: #000; padding: 15px; border-radius: 4px; overflow-x: auto; color: #a5b4fc; }
        </style>
      </head>
      <body>
        <h1>MOP Flow Dashboard</h1>
        <p>Active Actor: <strong>${actor}</strong></p>
        <div class="card">
          <h2>Live State</h2>
          <pre id="state">Loading...</pre>
        </div>
        <script>
          async function fetchState() {
            try {
              const res = await fetch('/api/state');
              const json = await res.json();
              document.getElementById('state').textContent = JSON.stringify(json, null, 2);
            } catch (err) {
              document.getElementById('state').textContent = 'Error fetching state: ' + err.message;
            }
          }
          fetchState();
          setInterval(fetchState, 5000);
        </script>
      </body>
      </html>
    `);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[MOP Dashboard] Started by ${actor}.`);
    console.log(`[MOP Dashboard] Listening at http://127.0.0.1:${port}`);
  });
}

function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs[0] : 'start';
  const afterCommand = rawArgs[0] && !rawArgs[0].startsWith('--') ? rawArgs.slice(1) : rawArgs;
  const args = parseArgs(afterCommand);

  if (command === 'start') return startDashboard(args);

  console.log(`Usage:
  node .MOP/scripts/mop-dashboard.mjs start --actor <codename> [--port 3000]`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
