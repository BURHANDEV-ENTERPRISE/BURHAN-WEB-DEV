#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const serverName = 'mop-flow';
const serverVersion = '1.1.0';

const tools = [
  {
    name: 'mop_status',
    description: 'Get the current MOP state, active member, agents, and workflow config.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'mop_memory_brief',
    description: 'Retrieve the active session memory brief.',
    inputSchema: { 
      type: 'object', 
      properties: {
        actor: { type: 'string', description: 'The active codename.' },
        query: { type: 'string', description: 'Optional semantic search query.' },
        role: { type: 'string', description: 'Optional agent role to filter by.' }
      },
      required: ['actor']
    }
  },
  {
    name: 'mop_memory_add',
    description: 'Add a new entry to the MOP memory.',
    inputSchema: { 
      type: 'object', 
      properties: {
        actor: { type: 'string' },
        summary: { type: 'string' },
        kind: { type: 'string' }
      },
      required: ['actor', 'summary']
    }
  },
  {
    name: 'mop_agent_route',
    description: 'Infer the correct agent and route a task.',
    inputSchema: { 
      type: 'object', 
      properties: {
        actor: { type: 'string' },
        task: { type: 'string' }
      },
      required: ['actor', 'task']
    }
  },
  {
    name: 'mop_workflow_status',
    description: 'Get current workflow phase and readiness.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'mop_workflow_advance',
    description: 'Advance the workflow to the next phase.',
    inputSchema: { 
      type: 'object', 
      properties: {
        actor: { type: 'string' },
        phase: { type: 'string' }
      },
      required: ['actor']
    }
  }
];

function runMopCommand(script, args) {
  const result = spawnSync('node', ['.MOP/scripts/' + script, ...args], {
    encoding: 'utf8'
  });
  return result.stdout + (result.stderr ? '\n' + result.stderr : '');
}

function handleCall(name, args) {
  try {
    if (name === 'mop_status') {
      return runMopCommand('mop-core.mjs', ['status']);
    } else if (name === 'mop_memory_brief') {
      const cmdArgs = ['memory', 'brief', '--actor', args.actor];
      if (args.query) cmdArgs.push('--query', args.query);
      if (args.role) cmdArgs.push('--role', args.role);
      return runMopCommand('mop-core.mjs', cmdArgs);
    } else if (name === 'mop_memory_add') {
      const cmdArgs = ['memory', 'add', '--actor', args.actor, '--summary', args.summary];
      if (args.kind) cmdArgs.push('--kind', args.kind);
      return runMopCommand('mop-core.mjs', cmdArgs);
    } else if (name === 'mop_agent_route') {
      return runMopCommand('mop-core.mjs', ['agent', 'route', '--actor', args.actor, '--task', args.task]);
    } else if (name === 'mop_workflow_status') {
      return runMopCommand('mop-workflow.mjs', ['status']);
    } else if (name === 'mop_workflow_advance') {
      const cmdArgs = ['advance', '--actor', args.actor];
      if (args.phase) cmdArgs.push('--phase', args.phase);
      return runMopCommand('mop-workflow.mjs', cmdArgs);
    }
    return `Unknown tool: ${name}`;
  } catch (err) {
    return err.message;
  }
}

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0',
    id,
    result
  }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code, message }
  }) + '\n');
}

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    if (req.method === 'initialize') {
      sendResponse(req.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: serverName, version: serverVersion }
      });
    } else if (req.method === 'notifications/initialized') {
      // Ignored
    } else if (req.method === 'tools/list') {
      sendResponse(req.id, { tools });
    } else if (req.method === 'tools/call') {
      const resultText = handleCall(req.params.name, req.params.arguments || {});
      sendResponse(req.id, {
        content: [{ type: 'text', text: resultText }]
      });
    } else {
      sendError(req.id, -32601, 'Method not found');
    }
  } catch (err) {
    // Ignore JSON parse errors for robust stdio handling
  }
});
