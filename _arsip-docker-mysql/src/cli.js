import fs from 'node:fs/promises';
import readline from 'node:readline';
import { pool, q, tx, migrate, waitForDb } from './db.js';
import { hashPassword } from './auth.js';
import { cleanLead, cleanEvents, putSetting } from './leads.js';

const [, , command, ...args] = process.argv;

function ask(question, hidden = false) {
  if (hidden && process.env.BL_PASSWORD) return Promise.resolve(process.env.BL_PASSWORD);
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(question); };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function askPassword() {
  const pw = await ask('Password (min. 10 karakter): ', true);
  if (pw.length < 10) throw new Error('Password terlalu pendek, minimal 10 karakter.');
  if (!process.env.BL_PASSWORD) {
    const again = await ask('Ulangi password: ', true);
    if (again !== pw) throw new Error('Password tidak sama.');
  }
  return pw;
}

const commands = {
  async migrate() {
    await migrate();
    console.log('Migrasi selesai.');
  },

  async 'user:add'() {
    const username = String(args[0] || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,60}$/.test(username)) throw new Error('Pakai: user:add <username> [nama tampilan]. Username huruf kecil/angka, tanpa spasi.');
    const name = args.slice(1).join(' ').trim() || username[0].toUpperCase() + username.slice(1);
    const exists = await q('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length) throw new Error(`User ${username} sudah ada. Pakai user:password untuk ganti password.`);
    const hash = await hashPassword(await askPassword());
    await q('INSERT INTO users (username, name, password_hash) VALUES (?, ?, ?)', [username, name, hash]);
    console.log(`User ${username} (${name}) dibuat.`);
  },

  async 'user:password'() {
    const username = String(args[0] || '').trim().toLowerCase();
    const [user] = await q('SELECT id FROM users WHERE username = ?', [username]);
    if (!user) throw new Error(`User ${username || '(kosong)'} tidak ditemukan.`);
    const hash = await hashPassword(await askPassword());
    await q('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    await q('DELETE FROM sessions WHERE user_id = ?', [user.id]);
    console.log(`Password ${username} diganti. Semua sesi lama dikeluarkan.`);
  },

  async 'user:list'() {
    const rows = await q('SELECT username, name, created_at FROM users ORDER BY id');
    if (!rows.length) return console.log('Belum ada user. Buat dengan: user:add <username> [nama]');
    rows.forEach((r) => console.log(`${r.username.padEnd(16)} ${r.name.padEnd(20)} dibuat ${r.created_at}`));
  },

  /** Import a Bilder Leads JSON export (leads, settings, meta). Keeps lead IDs and activity history. */
  async seed() {
    const file = args.find((a) => !a.startsWith('--'));
    const force = args.includes('--force');
    if (!file) throw new Error('Pakai: seed <file.json> [--force]');
    const data = JSON.parse(await fs.readFile(file, 'utf8'));
    if (!Array.isArray(data.leads)) throw new Error('File tidak berisi daftar leads.');
    const [{ n }] = await q('SELECT COUNT(*) AS n FROM leads');
    if (n > 0 && !force) throw new Error(`Tabel leads sudah berisi ${n} lead. Tambahkan --force untuk tetap mengimpor (lead dengan ID sama dilewati).`);
    let added = 0;
    let skipped = 0;
    await tx(async (conn) => {
      for (const raw of data.leads) {
        const lead = cleanLead(raw);
        const [res] = await conn.query(
          'INSERT IGNORE INTO leads (id, business, country, city, niche, phone, email, stage, score, dnc, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [raw.id || null, lead.business, lead.country, lead.city, lead.niche, lead.phone, lead.email, lead.stage, lead.score, lead.dnc, lead.data]
        );
        if (!res.affectedRows) { skipped++; continue; }
        for (const e of cleanEvents(raw.log)) {
          await conn.query('INSERT INTO lead_events (lead_id, kind, text, local_time) VALUES (?, ?, ?, ?)', [res.insertId, e.k, e.t, e.d]);
        }
        added++;
      }
    });
    if (data.settings) await putSetting('main', data.settings);
    if (data.meta) await putSetting('meta', data.meta);
    console.log(`Seed selesai: ${added} lead ditambahkan${skipped ? `, ${skipped} dilewati (ID sudah ada)` : ''}.`);
  },
};

async function main() {
  const fn = commands[command];
  if (!fn) {
    console.log(`Perintah yang tersedia:
  migrate                         Buat/ubah tabel database
  seed <file.json> [--force]      Impor data awal (data/seed.json)
  user:add <username> [nama]      Tambah user login
  user:password <username>        Ganti password user
  user:list                       Lihat daftar user`);
    process.exitCode = command ? 1 : 0;
    return;
  }
  await waitForDb(5);
  if (command !== 'migrate') await migrate();
  await fn();
}

main()
  .catch((err) => {
    console.error(`Gagal: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
