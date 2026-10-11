import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { getConnInfo } from '@hono/node-server/conninfo';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { config } from './config.js';
import { pool, q, tx, waitForDb, migrate } from './db.js';
import { verifyPassword, DUMMY_HASH, sha256, newToken, safeEqual } from './auth.js';
import {
  HttpError, STAGES, cleanLead, cleanEvents, loadLeads, changedLeadIds,
  getSetting, putSetting, getSettings, getMeta,
} from './leads.js';

const COOKIE = 'bl_session';
const app = new Hono();

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
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'same-origin');
  c.header('X-Frame-Options', 'DENY');
  c.header('Content-Security-Policy', CSP);
  if (c.req.path.startsWith('/api/')) c.header('Cache-Control', 'no-store');
  else c.header('Cache-Control', 'no-cache');
});

app.onError((err, c) => {
  const status = err instanceof HttpError ? err.status : err.status || 500;
  if (status >= 500) console.error(err);
  return c.json({ error: status >= 500 ? 'Terjadi kesalahan di server. Cek log container.' : err.message }, status);
});

app.use('/api/*', bodyLimit({ maxSize: 5 * 1024 * 1024, onError: (c) => c.json({ error: 'Data terlalu besar (maks 5 MB)' }, 413) }));

async function readJson(c) {
  try {
    return await c.req.json();
  } catch {
    throw new HttpError(400, 'Format JSON tidak valid');
  }
}

function clientIp(c) {
  if (config.trustProxy) {
    const fwd = c.req.header('cf-connecting-ip') || (c.req.header('x-forwarded-for') || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  try { return getConnInfo(c).remote.address || 'unknown'; } catch { return 'unknown'; }
}

/* ---------- login rate limit: 10 failed attempts per 15 minutes per IP ---------- */
const attempts = new Map();
function tooMany(ip) {
  const a = attempts.get(ip);
  return a && a.until > Date.now() && a.count >= 10;
}
function failed(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.until < now) attempts.set(ip, { count: 1, until: now + 15 * 60_000 });
  else a.count++;
}

/* ---------- public routes ---------- */
app.get('/api/health', async (c) => {
  await q('SELECT 1');
  return c.json({ ok: true });
});

app.post('/api/login', async (c) => {
  const ip = clientIp(c);
  if (tooMany(ip)) return c.json({ error: 'Terlalu banyak percobaan. Tunggu 15 menit.' }, 429);
  const body = await readJson(c);
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const [user] = await q('SELECT id, username, name, password_hash FROM users WHERE username = ?', [username]);
  const ok = await verifyPassword(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    failed(ip);
    return c.json({ error: 'Username atau password salah' }, 401);
  }
  attempts.delete(ip);
  const token = newToken();
  await q('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))', [sha256(token), user.id, config.sessionDays]);
  setCookie(c, COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: config.cookieSecure, path: '/', maxAge: config.sessionDays * 86400 });
  return c.json({ user: { id: user.id, username: user.username, name: user.name } });
});

/* ---------- auth for everything else under /api ---------- */
const TOKEN_ROUTES = new Set(['GET /api/leads', 'POST /api/leads/import']);

app.use('/api/*', async (c, next) => {
  const route = `${c.req.method} ${c.req.path}`;
  if (route === 'GET /api/health' || route === 'POST /api/login') return next();

  const auth = c.req.header('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    if (!config.apiToken || !safeEqual(auth.slice(7), config.apiToken)) return c.json({ error: 'API token tidak valid' }, 401);
    if (!TOKEN_ROUTES.has(route)) return c.json({ error: 'API token hanya untuk GET /api/leads dan POST /api/leads/import' }, 403);
    c.set('user', { id: null, username: 'api', name: 'API' });
    return next();
  }

  const token = getCookie(c, COOKIE);
  if (!token) return c.json({ error: 'Belum login' }, 401);
  const hash = sha256(token);
  const [s] = await q(
    'SELECT s.user_id, u.username, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > NOW()',
    [hash]
  );
  if (!s) {
    deleteCookie(c, COOKIE, { path: '/' });
    return c.json({ error: 'Sesi berakhir, silakan login lagi' }, 401);
  }
  // Requests that change data must come from the dashboard itself (blocks cross-site form posts).
  if (c.req.method !== 'GET' && c.req.header('x-requested-with') !== 'bilder') return c.json({ error: 'Permintaan ditolak' }, 403);
  // Sliding session: extend when less than half of the lifetime is left.
  await q(
    'UPDATE sessions SET expires_at = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE token_hash = ? AND expires_at < DATE_ADD(NOW(), INTERVAL ? DAY)',
    [config.sessionDays, hash, Math.floor(config.sessionDays / 2)]
  );
  c.set('user', { id: s.user_id, username: s.username, name: s.name });
  c.set('token', hash);
  return next();
});

app.post('/api/logout', async (c) => {
  const hash = c.get('token');
  if (hash) await q('DELETE FROM sessions WHERE token_hash = ?', [hash]);
  deleteCookie(c, COOKIE, { path: '/' });
  return c.json({ ok: true });
});

app.get('/api/me', (c) => c.json({ user: c.get('user') }));

const cursorNow = async () => (await q("SELECT DATE_FORMAT(NOW(3), '%Y-%m-%d %H:%i:%s.%f') AS now"))[0].now;

app.get('/api/bootstrap', async (c) => {
  const cursor = await cursorNow();
  const [leads, settings, meta] = await Promise.all([loadLeads(), getSettings(), getMeta()]);
  return c.json({ user: c.get('user'), leads, settings, meta, cursor });
});

app.get('/api/leads', async (c) => c.json({ leads: await loadLeads() }));

/** Everything that changed since the cursor, so other devices and teammates stay in sync. */
app.get('/api/changes', async (c) => {
  const since = c.req.query('since') || '1970-01-01 00:00:00';
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(since)) throw new HttpError(400, 'Parameter since tidak valid');
  const cursor = await cursorNow();
  const ids = await changedLeadIds(since);
  const leads = await loadLeads(ids);
  const [settingsRow, metaRow] = await Promise.all([getSetting('main'), getSetting('meta')]);
  const out = { leads, cursor };
  if (settingsRow && settingsRow.updatedAt > since) out.settings = await getSettings();
  if (metaRow && metaRow.updatedAt > since) out.meta = metaRow.value;
  return c.json(out);
});

/** Save one lead. The browser sends the whole lead plus the new activity entries. */
app.put('/api/leads/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'ID lead tidak valid');
  const body = await readJson(c);
  const lead = cleanLead(body.lead);
  const events = cleanEvents(body.events);
  const version = Number(body.version) || 0;
  const user = c.get('user');

  const conflict = await tx(async (conn) => {
    const [res] = await conn.query(
      `UPDATE leads SET business = ?, country = ?, city = ?, niche = ?, phone = ?, email = ?, stage = ?, score = ?, dnc = ?, data = ?,
              version = version + 1, updated_by = ?
        WHERE id = ? AND version = ?`,
      [lead.business, lead.country, lead.city, lead.niche, lead.phone, lead.email, lead.stage, lead.score, lead.dnc, lead.data, user.id, id, version]
    );
    if (res.affectedRows === 0) return true;
    for (const e of events) {
      await conn.query('INSERT INTO lead_events (lead_id, user_id, kind, text, local_time) VALUES (?, ?, ?, ?, ?)', [id, user.id, e.k, e.t, e.d]);
    }
    return false;
  });

  const [current] = await loadLeads([id]);
  if (!current) throw new HttpError(404, 'Lead tidak ditemukan');
  if (conflict) return c.json({ error: 'Lead ini baru saja diubah di perangkat lain', lead: current }, 409);
  return c.json({ lead: current });
});

/** Add new leads (CSV import in the dashboard, or automations with API_TOKEN). Skips duplicates and do-not-contact. */
app.post('/api/leads/import', async (c) => {
  const body = await readJson(c);
  const list = Array.isArray(body.leads) ? body.leads : [];
  if (!list.length) throw new HttpError(400, 'Tidak ada lead untuk diimpor');
  if (list.length > 2000) throw new HttpError(413, 'Maksimal 2000 lead per import');
  const user = c.get('user');

  const existing = await q('SELECT business, city, email, phone, dnc FROM leads');
  const settings = await getSettings();
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
  existing.forEach(remember);

  const skipped = { duplicate: 0, doNotContact: 0, invalid: 0 };
  const created = [];
  await tx(async (conn) => {
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
      const [res] = await conn.query(
        'INSERT INTO leads (business, country, city, niche, phone, email, stage, score, dnc, data, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [lead.business, lead.country, lead.city, lead.niche, lead.phone, lead.email, lead.stage, lead.score, lead.dnc, lead.data, user.id]
      );
      let events = cleanEvents(raw.log);
      if (!events.length) events = [{ k: 'add', t: user.id ? 'Diimpor dari CSV' : 'Ditambahkan lewat API', d: '' }];
      for (const e of events) {
        await conn.query('INSERT INTO lead_events (lead_id, user_id, kind, text, local_time) VALUES (?, ?, ?, ?, ?)', [res.insertId, user.id, e.k, e.t, e.d]);
      }
      remember(lead);
      created.push(res.insertId);
    }
  });
  return c.json({ created: await loadLeads(created), skipped });
});

app.put('/api/settings', async (c) => {
  const body = await readJson(c);
  if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) throw new HttpError(400, 'Pengaturan tidak valid');
  await putSetting('main', body.settings);
  return c.json({ ok: true });
});

app.put('/api/meta', async (c) => {
  const body = await readJson(c);
  const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};
  await putSetting('meta', { inboxChecked: String(meta.inboxChecked || '').slice(0, 10) });
  return c.json({ ok: true });
});

app.get('/api/export.json', async (c) => {
  const [leads, settings, meta] = await Promise.all([loadLeads(), getSettings(), getMeta()]);
  c.header('Content-Disposition', `attachment; filename="bilder-leads-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  return c.json({ v: 1, exportedAt: new Date().toISOString(), leads, settings, meta });
});

app.all('/api/*', (c) => c.json({ error: 'Endpoint tidak ditemukan' }, 404));

/* ---------- static frontend ---------- */
app.use('/*', serveStatic({ root: './public' }));
app.notFound((c) => c.text('Halaman tidak ditemukan', 404));

/* ---------- start ---------- */
await waitForDb();
await migrate();
setInterval(() => q('DELETE FROM sessions WHERE expires_at < NOW()').catch(() => {}), 60 * 60_000).unref();

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Bilder Leads berjalan di http://localhost:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    pool.end().finally(() => process.exit(0));
  });
}
