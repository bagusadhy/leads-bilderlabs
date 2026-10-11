import fs from 'node:fs';
import path from 'node:path';
import { q, parseJson, ROOT } from './db.js';

export const STAGES = ['need', 'check', 'ready', 'e1', 'e2', 'e3', 'replied', 'brief', 'mockup', 'paused', 'won', 'lost', 'bounced'];
const KINDS = ['add', 'send', 'stage', 'note'];
const COLUMNS = ['business', 'country', 'city', 'niche', 'phone', 'email', 'stage', 'score', 'dnc'];
const SERVER_FIELDS = new Set(['id', 'version', 'log', 'updatedAt', 'createdAt']);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const text = (v, max) => String(v ?? '').slice(0, max);

/** Validate a lead sent by the browser and split it into table columns + JSON data. */
export function cleanLead(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Data lead tidak valid');
  const business = text(input.business, 255).trim();
  if (!business) throw new HttpError(400, 'Nama bisnis wajib diisi');
  const country = text(input.country, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new HttpError(400, 'Kode negara harus 2 huruf, misalnya AU atau US');
  const stage = STAGES.includes(input.stage) ? input.stage : 'need';
  const rawScore = input.score;
  const score = rawScore == null || rawScore === '' || Number.isNaN(+rawScore) ? null : Math.max(0, Math.min(10, Math.round(+rawScore)));
  const data = {};
  for (const [k, v] of Object.entries(input)) {
    if (COLUMNS.includes(k) || SERVER_FIELDS.has(k)) continue;
    data[k] = v;
  }
  const json = JSON.stringify(data);
  if (json.length > 200_000) throw new HttpError(413, 'Data lead terlalu besar');
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

export function cleanEvents(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 50).map((e) => ({
    k: KINDS.includes(e?.k) ? e.k : 'note',
    t: text(e?.t, 1000),
    d: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(e?.d) ? e.d : '',
  })).filter((e) => e.t);
}

function rowToLead(row, log) {
  const data = parseJson(row.data, {});
  return {
    ...data,
    id: row.id,
    business: row.business,
    country: row.country,
    city: row.city,
    niche: row.niche,
    phone: row.phone,
    email: row.email,
    stage: row.stage,
    score: row.score,
    dnc: !!row.dnc,
    version: row.version,
    updatedAt: row.updated_at,
    log: log || [],
  };
}

async function eventsFor(ids) {
  const map = new Map();
  if (ids && !ids.length) return map;
  const rows = await q(
    `SELECT e.lead_id, e.kind, e.text, e.local_time, e.created_at, u.name AS user_name
       FROM lead_events e LEFT JOIN users u ON u.id = e.user_id
      ${ids ? 'WHERE e.lead_id IN (?)' : ''}
      ORDER BY e.id`,
    ids ? [ids] : []
  );
  for (const r of rows) {
    if (!map.has(r.lead_id)) map.set(r.lead_id, []);
    map.get(r.lead_id).push({ d: r.local_time || String(r.created_at).slice(0, 16), t: r.text, k: r.kind, by: r.user_name || '' });
  }
  return map;
}

/** Load leads (all when ids is omitted) with their activity log. */
export async function loadLeads(ids) {
  if (ids && !ids.length) return [];
  const rows = await q(`SELECT * FROM leads ${ids ? 'WHERE id IN (?)' : ''} ORDER BY id`, ids ? [ids] : []);
  const events = await eventsFor(ids ? rows.map((r) => r.id) : null);
  return rows.map((r) => rowToLead(r, events.get(r.id)));
}

export async function changedLeadIds(since) {
  const rows = await q('SELECT id FROM leads WHERE updated_at > ?', [since]);
  return rows.map((r) => r.id);
}

/* ---------- settings ---------- */
const DEFAULT_SETTINGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'default-settings.json'), 'utf8'));

export async function getSetting(key) {
  const rows = await q('SELECT v, updated_at FROM app_settings WHERE k = ?', [key]);
  return rows[0] ? { value: parseJson(rows[0].v, null), updatedAt: rows[0].updated_at } : null;
}

export async function putSetting(key, value) {
  const json = JSON.stringify(value);
  if (json.length > 500_000) throw new HttpError(413, 'Pengaturan terlalu besar');
  await q('INSERT INTO app_settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = ?', [key, json, json]);
}

export async function getSettings() {
  const row = await getSetting('main');
  return { ...DEFAULT_SETTINGS, ...(row?.value || {}) };
}

export async function getMeta() {
  const row = await getSetting('meta');
  return row?.value || {};
}
