-- Bilder Leads schema for Cloudflare D1 (SQLite).
-- Timestamps are UTC text in the form 'YYYY-MM-DD HH:MM:SS.SSS' so they sort and compare as strings.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at TEXT NOT NULL
);

-- Searchable fields live in columns; everything else (contact, hook, email sequence,
-- send dates, outcome dates) lives in the `data` JSON text.
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'need',
  score INTEGER,
  dnc INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
  updated_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads (updated_at);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads (stage);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);

CREATE TABLE IF NOT EXISTS lead_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  user_id INTEGER,
  kind TEXT NOT NULL DEFAULT 'note',
  text TEXT NOT NULL,
  local_time TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_events_lead ON lead_events (lead_id);

CREATE TABLE IF NOT EXISTS app_settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);
