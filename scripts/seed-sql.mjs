// Turns data/seed.json into .wrangler/seed.sql for `wrangler d1 execute --file`.
// Safe to run twice: existing leads (same id) and existing settings are left alone.
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] || 'data/seed.json';
const out = '.wrangler/seed.sql';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(data.leads)) throw new Error(`${file} tidak berisi daftar leads`);

const STAGES = ['need', 'check', 'ready', 'e1', 'e2', 'e3', 'replied', 'brief', 'mockup', 'paused', 'won', 'lost', 'bounced'];
const COLUMNS = ['business', 'country', 'city', 'niche', 'phone', 'email', 'stage', 'score', 'dnc'];
const SKIP = new Set(['id', 'version', 'log', 'updatedAt', 'createdAt']);
const q = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const int = (v) => (v == null || v === '' || Number.isNaN(+v) ? 'NULL' : String(Math.round(+v)));

const lines = [];
for (const l of data.leads) {
  const rest = {};
  for (const [k, v] of Object.entries(l)) if (!COLUMNS.includes(k) && !SKIP.has(k)) rest[k] = v;
  const stage = STAGES.includes(l.stage) ? l.stage : 'need';
  lines.push(
    `INSERT OR IGNORE INTO leads (id, business, country, city, niche, phone, email, stage, score, dnc, data) VALUES (${int(l.id)}, ${q(l.business)}, ${q(String(l.country || '').toUpperCase())}, ${q(l.city || '')}, ${q(l.niche || '')}, ${q(l.phone || '')}, ${q(l.email || '')}, ${q(stage)}, ${int(l.score)}, ${l.dnc ? 1 : 0}, ${q(JSON.stringify(rest))});`
  );
  for (const e of l.log || []) {
    const kind = ['add', 'send', 'stage', 'note'].includes(e.k) ? e.k : 'note';
    lines.push(
      `INSERT INTO lead_events (lead_id, kind, text, local_time) SELECT ${int(l.id)}, ${q(kind)}, ${q(e.t)}, ${q(e.d || '')} WHERE NOT EXISTS (SELECT 1 FROM lead_events WHERE lead_id = ${int(l.id)} AND text = ${q(e.t)} AND local_time = ${q(e.d || '')});`
    );
  }
}
if (data.settings) lines.push(`INSERT INTO app_settings (k, v) VALUES ('main', ${q(JSON.stringify(data.settings))}) ON CONFLICT (k) DO NOTHING;`);
if (data.meta) lines.push(`INSERT INTO app_settings (k, v) VALUES ('meta', ${q(JSON.stringify(data.meta))}) ON CONFLICT (k) DO NOTHING;`);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`${data.leads.length} lead ditulis ke ${out}`);
