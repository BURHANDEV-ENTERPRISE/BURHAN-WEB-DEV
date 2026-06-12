import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const coreDir = resolve(join(dirname(fileURLToPath(import.meta.url)), '..', '.MOP'));
const statePath = join(coreDir, 'STATE.json');

function now() {
  return new Date().toISOString();
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, passwordSalt: salt };
}

function triggerArgumentParser(argv) {
  const parsed = { _: [] };
  for (let position = 0; position < argv.length; position += 1) {
    const argument = argv[position];
    if (typeof argument !== 'string' || !argument.startsWith('--')) {
      parsed._.push(argument);
      continue;
    }
    const key = argument.slice(2);
    const value = argv[position + 1];
    if (!value || typeof value !== 'string' || value.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = value;
    position += 1;
  }
  return parsed;
}

const arguments_ = triggerArgumentParser(process.argv.slice(2));
const codename = String((arguments_.codename || '').trim()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const displayName = String(arguments_['display-name'] || arguments_.name || '').trim();
const password = String(arguments_.password || '');
const githubUsername = String(arguments_['github-username'] || '').trim();
const email = String(arguments_.email || '').trim();

if (!codename || !displayName || !password || !email) {
  console.log('Keperluan: --codename <codename> --display-name "<nama>" --password "<password>" --email "<email>" [--github-username "<username>"]');
  process.exit(1);
}

const state = JSON.parse(readFileSync(statePath, 'utf8'));

if (!state.initialized) {
  console.log('MOP belum di-setup.');
  process.exit(1);
}

if (state.members?.[codename]) {
  console.log(`Ahli ${codename} sudah wujud.`);
  process.exit(1);
}

const { passwordHash, passwordSalt } = hashPassword(password);

state.members ||= {};
state.members[codename] = {
  codename,
  displayName,
  role: 'member',
  passwordHash,
  passwordSalt,
  languagePreferences: {
    conversation: state.members[state.ownerCodename]?.languagePreferences?.conversation || 'Melayu',
    coding: state.members[state.ownerCodename]?.languagePreferences?.coding || 'Nest.js'
  },
  gitIdentity: {
    name: displayName,
    email,
    githubUsername
  },
  joinedAt: now()
};

if (state.mode === 'team') {
  state.autosync.workBranchPrefix = state.autosync?.workBranchPrefix || 'dev';
}

mkdirSync(dirname(statePath), { recursive: true });
const temporaryPath = `${statePath}.tmp-${Date.now()}`;
writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
renameSync(temporaryPath, statePath);

console.log(`Ahli ditambah: ${displayName} (${codename})`);