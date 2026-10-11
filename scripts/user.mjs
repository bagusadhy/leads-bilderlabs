// Add a login or change a password in the D1 database.
//   npm run user:add -- bagus "Bagus"
//   npm run user:password -- bagus
// Add --local to target the local development database instead of Cloudflare.
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline';

const ITERATIONS = 100_000; // must match src/auth.js
const [, , command, rawUser, ...rest] = process.argv;
const local = rest.includes('--local');
const username = String(rawUser || '').trim().toLowerCase();
const name = rest.filter((a) => a !== '--local').join(' ').trim() || (username ? username[0].toUpperCase() + username.slice(1) : '');

function ask(question, hidden) {
  if (process.env.BL_PASSWORD) return Promise.resolve(process.env.BL_PASSWORD);
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(question); };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

function fail(msg) {
  console.error(`Gagal: ${msg}`);
  process.exit(1);
}

if (!['add', 'password'].includes(command)) fail('Pakai: node scripts/user.mjs add <username> [nama] | password <username>');
if (!/^[a-z0-9._-]{2,60}$/.test(username)) fail('Username huruf kecil/angka tanpa spasi, misalnya bagus');

const password = await ask('Password (min. 10 karakter): ', true);
if (password.length < 10) fail('Password terlalu pendek, minimal 10 karakter.');
if (!process.env.BL_PASSWORD && (await ask('Ulangi password: ', true)) !== password) fail('Password tidak sama.');

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const stored = `pbkdf2$sha256$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const sql = command === 'add'
  ? `INSERT INTO users (username, name, password_hash) VALUES (${q(username)}, ${q(name)}, ${q(stored)});`
  : `UPDATE users SET password_hash = ${q(stored)} WHERE username = ${q(username)}; DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username = ${q(username)});`;

const res = spawnSync('npx', ['wrangler', 'd1', 'execute', 'bilder-leads', local ? '--local' : '--remote', '--command', sql], { stdio: 'inherit' });
if (res.status !== 0) fail('perintah wrangler gagal (lihat pesan di atas).');
console.log(command === 'add' ? `User ${username} (${name}) dibuat.` : `Password ${username} diganti. Sesi lama dikeluarkan.`);
