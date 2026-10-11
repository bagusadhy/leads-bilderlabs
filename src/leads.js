import DEFAULT_SETTINGS from '../data/default-settings.json';

export const STAGES = ['need', 'check', 'ready', 'e1', 'e2', 'e3', 'replied', 'brief', 'mockup', 'paused', 'won', 'lost', 'bounced'];
const KINDS = ['add', 'send', 'stage', 'note'];
const COLUMNS = ['business', 'country', 'city', 'niche', 'phone', 'email', 'stage', 'score', 'dnc'];
const SERVER_FIELDS = new Set(['id', 'version', 'log', 'updatedAt', 'createdAt']);

/** SQL expression for "now" in the same text format as the table defaults. */
export const NOW = "strftime('%Y-%m-%d %H:%M:%f', 'now')";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const text = (v, max) => String(v ?? '').slice(0, max);
const parse = (s, fallback) => {
  try { return JSON.parse(s); } catch { return fallback; }
};

/** Validate a lead sent by the browser and split it into table columns + JSON data. */
export function cleanLead(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Data lead tidak valid');
  const business = text(input.business, 255).trim();
  if (!business) throw new HttpError(400, 'Nama bisnis wajib diisi');
  const country = text(input.country, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new HttpError(400, 'Kode negara harus 2 huruf, misalnya AU atau US');
  const stage = STAGES.includes(input.stage) ? input.stage : 'need';
  const raw = input.score;
  const score = raw == null || raw === '' || Number.isNaN(+raw) ? null : Math.max(0, Math.min(10, Math.round(+raw)));
  const data = {};
  for (const [k, v] of Object.entries(input)) {
    if (COLUMNS.includes(k) || SERVER_FIELDS.has(k)) continue;
    data[k] = v;
  }
  const json = JSON.stringify(data);
  // D1 statements are limited to 100 KB.
  if (json.length > 90_000) throw new HttpError(413, 'Data lead terlalu besar');
  return {
    business,
    country,
    city: text(input.city, 120).trim(),
    niche: text(input.niche, 120).trim(),
    phone: text(input.phone, 60).trim(),
    email: text(input.email, 255).trim(),
    stage,
    score,
    dnc: input.dnc ? 1 : 0,
    data: json,
  };
}

export function cleanEvents(list, max = 50) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, max).map((e) => ({
    k: KINDS.includes(e?.k) ? e.k : 'note',
    t: text(e?.t, 1000),
    d: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(e?.d) ? e.d : '',
  })).filter((e) => e.t);
}

const EVENTS_SQL = 'SELECT e.lead_id, e.kind, e.text, e.local_time, e.created_at, u.name AS user_name FROM lead_events e LEFT JOIN users u ON u.id = e.user_id';

function toLeads(rows, events) {
  const log = new Map();
  for (const e of events) {
    if (!log.has(e.lead_id)) log.set(e.lead_id, []);
    log.get(e.lead_id).push({ d: e.local_time || String(e.created_at).slice(0, 16), t: e.text, k: e.kind, by: e.user_name || '' });
  }
  return rows.map((r) => ({
    ...parse(r.data, {}),
    id: r.id,
    business: r.business,
    country: r.country,
    city: r.city,
    niche: r.niche,
    phone: r.phone,
    email: r.email,
    stage: r.stage,
    score: r.score,
    dnc: !!r.dnc,
    version: r.version,
    updatedAt: r.updated_at,
    log: log.get(r.id) || [],
  }));
}

/** Load leads (all when ids is omitted) with their activity log. */
export async function loadLeads(db, ids) {
  if (!ids) {
    const [leads, events] = await db.batch([
      db.prepare('SELECT * FROM leads ORDER BY id'),
      db.prepare(`${EVENTS_SQL} ORDER BY e.id`),
    ]);
    return toLeads(leads.results, events.results);
  }
  const rows = [];
  const events = [];
  // D1 allows at most 100 bound parameters per statement.
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90);
    const ph = chunk.map(() => '?').join(',');
    const [leads, ev] = await db.batch([
      db.prepare(`SELECT * FROM leads WHERE id IN (${ph}) ORDER BY id`).bind(...chunk),
      db.prepare(`${EVENTS_SQL} WHERE e.lead_id IN (${ph}) ORDER BY e.id`).bind(...chunk),
    ]);
    rows.push(...leads.results);
    events.push(...ev.results);
  }
  return toLeads(rows, events);
}

/** Leads changed after the cursor, with their full activity log. */
export async function changedLeads(db, since) {
  const [leads, events] = await db.batch([
    db.prepare('SELECT * FROM leads WHERE updated_at > ? ORDER BY id').bind(since),
    db.prepare(`${EVENTS_SQL} WHERE e.lead_id IN (SELECT id FROM leads WHERE updated_at > ?) ORDER BY e.id`).bind(since),
  ]);
  return toLeads(leads.results, events.results);
}

/* ---------- settings ---------- */
export async function getSetting(db, key) {
  const row = await db.prepare('SELECT v, updated_at FROM app_settings WHERE k = ?').bind(key).first();
  return row ? { value: parse(row.v, null), updatedAt: row.updated_at } : null;
}

export async function putSetting(db, key, value) {
  const json = JSON.stringify(value);
  if (json.length > 90_000) throw new HttpError(413, 'Pengaturan terlalu besar');
  await db.prepare(`INSERT INTO app_settings (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v, updated_at = ${NOW}`).bind(key, json).run();
}

export async function getSettings(db) {
  const row = await getSetting(db, 'main');
  return { ...DEFAULT_SETTINGS, ...(row?.value || {}) };
}

export async function getMeta(db) {
  const row = await getSetting(db, 'meta');
  return row?.value || {};
}
