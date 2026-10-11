import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyPassword, DUMMY_HASH, sha256, newToken, safeEqual } from './auth.js';
import {
  HttpError, STAGES, NOW, cleanLead, cleanEvents, loadLeads, changedLeads,
  getSetting, putSetting, getSettings, getMeta,
} from './leads.js';

const COOKIE = 'bl_session';
const IMPORT_MAX = 25; // leads per request (keeps each request well inside D1 query limits)
const app = new Hono();

const days = (env) => Math.max(1, Number(env.SESSION_DAYS || 30));
const isHttps = (c) => new URL(c.req.url).protocol === 'https:';

/* ---------- security headers ---------- */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

app.use('*', async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'same-origin');
  h.set('X-Frame-Options', 'DENY');
  h.set('Content-Security-Policy', CSP);
  if (isHttps(c)) h.set('Strict-Transport-Security', 'max-age=31536000');
  h.set('Cache-Control', c.req.path.startsWith('/api/') ? 'no-store' : 'no-cache');
});

app.onError((err, c) => {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error(err);
  return c.json({ error: status >= 500 ? 'Terjadi kesalahan di server. Cek log di dashboard Cloudflare.' : err.message }, status);
});

app.use('/api/*', bodyLimit({ maxSize: 2 * 1024 * 1024, onError: (c) => c.json({ error: 'Data terlalu besar (maks 2 MB)' }, 413) }));

async function readJson(c) {
  try {
    return await c.req.json();
  } catch {
    throw new HttpError(400, 'Format JSON tidak valid');
  }
}

/* ---------- public routes ---------- */
app.get('/api/health', async (c) => {
  await c.env.DB.prepare('SELECT 1').first();
  return c.json({ ok: true });
});

app.post('/api/login', async (c) => {
  const db = c.env.DB;
  const ip = c.req.header('cf-connecting-ip') || 'local';
  const blocked = await db.prepare(`SELECT count FROM login_attempts WHERE ip = ? AND reset_at > ${NOW}`).bind(ip).first();
  if (blocked && blocked.count >= 10) return c.json({ error: 'Terlalu banyak percobaan. Tunggu 15 menit.' }, 429);

  const body = await readJson(c);
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = await db.prepare('SELECT id, username, name, password_hash FROM users WHERE username = ?').bind(username).first();
  const ok = await verifyPassword(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    await db.prepare(
      `INSERT INTO login_attempts (ip, count, reset_at) VALUES (?, 1, strftime('%Y-%m-%d %H:%M:%f', 'now', '+15 minutes'))
       ON CONFLICT (ip) DO UPDATE SET
         count = CASE WHEN reset_at > ${NOW} THEN count + 1 ELSE 1 END,
         reset_at = CASE WHEN reset_at > ${NOW} THEN reset_at ELSE excluded.reset_at END`
    ).bind(ip).run();
    return c.json({ error: 'Username atau password salah' }, 401);
  }

  const token = newToken();
  await db.batch([
    db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip),
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', ?))")
      .bind(await sha256(token), user.id, `+${days(c.env)} days`),
  ]);
  setCookie(c, COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: isHttps(c), path: '/', maxAge: days(c.env) * 86400 });
  return c.json({ user: { id: user.id, username: user.username, name: user.name } });
});

/* ---------- auth for everything else under /api ---------- */
const TOKEN_ROUTES = new Set(['GET /api/leads', 'POST /api/leads/import']);

app.use('/api/*', async (c, next) => {
  const route = `${c.req.method} ${c.req.path}`;
  if (route === 'GET /api/health' || route === 'POST /api/login') return next();

  const auth = c.req.header('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    if (!c.env.API_TOKEN || !safeEqual(auth.slice(7), c.env.API_TOKEN)) return c.json({ error: 'API token tidak valid' }, 401);
    if (!TOKEN_ROUTES.has(route)) return c.json({ error: 'API token hanya untuk GET /api/leads dan POST /api/leads/import' }, 403);
    c.set('user', { id: null, username: 'api', name: 'API' });
    return next();
  }

  const token = getCookie(c, COOKIE);
  if (!token) return c.json({ error: 'Belum login' }, 401);
  const hash = await sha256(token);
  const db = c.env.DB;
  const s = await db.prepare(
    `SELECT s.user_id, u.username, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ${NOW}`
  ).bind(hash).first();
  if (!s) {
    deleteCookie(c, COOKIE, { path: '/' });
    return c.json({ error: 'Sesi berakhir, silakan login lagi' }, 401);
  }
  // Requests that change data must come from the dashboard itself (blocks cross-site form posts).
  if (c.req.method !== 'GET' && c.req.header('x-requested-with') !== 'bilder') return c.json({ error: 'Permintaan ditolak' }, 403);
  // Sliding session: extend when less than half of the lifetime is left.
  const d = days(c.env);
  c.executionCtx.waitUntil(
    db.prepare(
      "UPDATE sessions SET expires_at = strftime('%Y-%m-%d %H:%M:%f', 'now', ?) WHERE token_hash = ? AND expires_at < strftime('%Y-%m-%d %H:%M:%f', 'now', ?)"
    ).bind(`+${d} days`, hash, `+${Math.floor(d / 2)} days`).run()
  );
  c.set('user', { id: s.user_id, username: s.username, name: s.name });
  c.set('token', hash);
  return next();
});

app.post('/api/logout', async (c) => {
  const hash = c.get('token');
  if (hash) await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(hash).run();
  deleteCookie(c, COOKIE, { path: '/' });
  return c.json({ ok: true });
});

app.get('/api/me', (c) => c.json({ user: c.get('user') }));

const cursorNow = async (db) => (await db.prepare(`SELECT ${NOW} AS now`).first()).now;

app.get('/api/bootstrap', async (c) => {
  const db = c.env.DB;
  const cursor = await cursorNow(db);
  const [leads, settings, meta, users] = await Promise.all([
    loadLeads(db), getSettings(db), getMeta(db),
    db.prepare('SELECT id, username, name FROM users ORDER BY id').all(),
  ]);
  return c.json({ user: c.get('user'), users: users.results, leads, settings, meta, cursor });
});

app.get('/api/leads', async (c) => c.json({ leads: await loadLeads(c.env.DB) }));

/** Everything that changed since the cursor, so other devices and teammates stay in sync. */
app.get('/api/changes', async (c) => {
  const db = c.env.DB;
  const since = c.req.query('since') || '1970-01-01 00:00:00';
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(since)) throw new HttpError(400, 'Parameter since tidak valid');
  const cursor = await cursorNow(db);
  const [leads, settingsRow, metaRow] = await Promise.all([changedLeads(db, since), getSetting(db, 'main'), getSetting(db, 'meta')]);
  const out = { leads, cursor };
  if (settingsRow && settingsRow.updatedAt > since) out.settings = await getSettings(db);
  if (metaRow && metaRow.updatedAt > since) out.meta = metaRow.value;
  return c.json(out);
});

/** Save one lead. The browser sends the whole lead plus the new activity entries. */
app.put('/api/leads/:id', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'ID lead tidak valid');
  const body = await readJson(c);
  const lead = cleanLead(body.lead);
  const events = cleanEvents(body.events, 20);
  const version = Number(body.version) || 0;
  const user = c.get('user');

  // One transaction: the update only applies when the version still matches, and the
  // activity rows are only written when that update actually changed a row.
  const statements = [
    db.prepare(
      `UPDATE leads SET business = ?, country = ?, city = ?, niche = ?, phone = ?, email = ?, stage = ?, score = ?, dnc = ?, data = ?,
              version = version + 1, updated_by = ?, updated_at = ${NOW}
        WHERE id = ? AND version = ?`
    ).bind(lead.business, lead.country, lead.city, lead.niche, lead.phone, lead.email, lead.stage, lead.score, lead.dnc, lead.data, user.id, id, version),
    ...events.map((e) =>
      db.prepare('INSERT INTO lead_events (lead_id, user_id, kind, text, local_time) SELECT ?, ?, ?, ?, ? WHERE changes() > 0')
        .bind(id, user.id, e.k, e.t, e.d)
    ),
  ];
  const results = await db.batch(statements);
  const conflict = results[0].meta.changes === 0;

  const [current] = await loadLeads(db, [id]);
  if (!current) throw new HttpError(404, 'Lead tidak ditemukan');
  if (conflict) return c.json({ error: 'Lead ini baru saja diubah di perangkat lain', lead: current }, 409);
  return c.json({ lead: current });
});

/** Add new leads (CSV import in the dashboard, or automations with API_TOKEN). Skips duplicates and do-not-contact. */
app.post('/api/leads/import', async (c) => {
  const db = c.env.DB;
  const body = await readJson(c);
  const list = Array.isArray(body.leads) ? body.leads : [];
  if (!list.length) throw new HttpError(400, 'Tidak ada lead untuk diimpor');
  if (list.length > IMPORT_MAX) throw new HttpError(413, `Maksimal ${IMPORT_MAX} lead per permintaan. Kirim bertahap.`);
  const user = c.get('user');

  const [existing, settings] = await Promise.all([
    db.prepare('SELECT business, city, email, phone, dnc FROM leads').all(),
    getSettings(db),
  ]);
  const emails = new Set();
  const phones = new Set();
  const names = new Set();
  const blocked = new Set(String(settings.dnc || '').split(/\s+/).map((x) => x.trim().toLowerCase()).filter(Boolean));
  const remember = (l) => {
    if (l.email) emails.add(l.email.toLowerCase());
    const p = String(l.phone || '').replace(/\D/g, '');
    if (p.length > 5) phones.add(p);
    names.add(`${l.business}|${l.city}`.toLowerCase());
    if (l.dnc && l.email) blocked.add(l.email.toLowerCase());
  };
  existing.results.forEach(remember);

  const skipped = { duplicate: 0, doNotContact: 0, invalid: 0 };
  const statements = [];
  const leadStatementIndex = [];
  for (const raw of list) {
    let lead;
    try {
      const input = { ...raw };
      if (!STAGES.includes(input.stage)) input.stage = input.email ? 'ready' : 'need';
      lead = cleanLead(input);
    } catch {
      skipped.invalid++;
      continue;
    }
    const email = lead.email.toLowerCase();
    const phone = lead.phone.replace(/\D/g, '');
    if ((email && emails.has(email)) || (phone.length > 5 && phones.has(phone)) || names.has(`${lead.business}|${lead.city}`.toLowerCase())) {
      skipped.duplicate++;
      continue;
    }
    if (email && (blocked.has(email) || blocked.has(email.split('@')[1] || ''))) {
      skipped.doNotContact++;
      continue;
    }
    leadStatementIndex.push(statements.length);
    statements.push(
      db.prepare('INSERT INTO leads (business, country, city, niche, phone, email, stage, score, dnc, data, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
        .bind(lead.business, lead.country, lead.city, lead.niche, lead.phone, lead.email, lead.stage, lead.score, lead.dnc, lead.data, user.id)
    );
    let events = cleanEvents(raw.log, 3);
    if (!events.length) events = [{ k: 'add', t: user.id ? 'Diimpor dari CSV' : 'Ditambahkan lewat API', d: '' }];
    for (const e of events) {
      // The lead inserted just before in this same transaction has the highest id.
      statements.push(
        db.prepare('INSERT INTO lead_events (lead_id, user_id, kind, text, local_time) VALUES ((SELECT MAX(id) FROM leads), ?, ?, ?, ?)')
          .bind(user.id, e.k, e.t, e.d)
      );
    }
    remember(lead);
  }

  let created = [];
  if (statements.length) {
    const results = await db.batch(statements);
    created = leadStatementIndex.map((i) => results[i].results[0].id);
  }
  return c.json({ created: await loadLeads(db, created), skipped });
});

app.put('/api/settings', async (c) => {
  const body = await readJson(c);
  if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) throw new HttpError(400, 'Pengaturan tidak valid');
  await putSetting(c.env.DB, 'main', body.settings);
  return c.json({ ok: true });
});

/** "Inbox sudah dicek" is stored per person, so each teammate only marks their own inbox. */
app.put('/api/meta', async (c) => {
  const db = c.env.DB;
  const body = await readJson(c);
  const day = String(body.inboxChecked || '').slice(0, 10);
  if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new HttpError(400, 'Tanggal tidak valid');
  const user = c.get('user');
  const meta = await getMeta(db);
  const inbox = meta.inbox && typeof meta.inbox === 'object' ? meta.inbox : {};
  inbox[user.username] = day;
  await putSetting(db, 'meta', { inbox });
  return c.json({ ok: true, meta: { inbox } });
});

app.get('/api/export.json', async (c) => {
  const db = c.env.DB;
  const [leads, settings, meta] = await Promise.all([loadLeads(db), getSettings(db), getMeta(db)]);
  c.header('Content-Disposition', `attachment; filename="bilder-leads-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  return c.json({ v: 1, exportedAt: new Date().toISOString(), leads, settings, meta });
});

app.all('/api/*', (c) => c.json({ error: 'Endpoint tidak ditemukan' }, 404));

/* ---------- static dashboard files ---------- */
app.all('*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  return new Response(res.body, res); // copy so the header middleware can add security headers
});

export default {
  fetch: app.fetch,
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare(`DELETE FROM sessions WHERE expires_at < ${NOW}`),
      env.DB.prepare(`DELETE FROM login_attempts WHERE reset_at < ${NOW}`),
    ]));
  },
};
