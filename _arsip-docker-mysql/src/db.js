import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from './config.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true,
  timezone: 'Z',
});

export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function tx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    throw err;
  } finally {
    conn.release();
  }
}

// MySQL 8 returns JSON columns parsed; MariaDB returns them as text. Accept both.
export function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

export async function waitForDb(tries = 30) {
  for (let i = 1; ; i++) {
    try {
      await q('SELECT 1');
      return;
    } catch (err) {
      if (i >= tries) throw err;
      console.log(`Database belum siap (${err.code || err.message}), coba lagi ${i}/${tries}…`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export async function migrate() {
  const conn = await mysql.createConnection({ ...config.db, multipleStatements: true, charset: 'utf8mb4' });
  try {
    await conn.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(190) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    const [done] = await conn.query('SELECT name FROM schema_migrations');
    const applied = new Set(done.map((r) => r.name));
    const dir = path.join(ROOT, 'migrations');
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await fs.readFile(path.join(dir, file), 'utf8');
      console.log(`Menjalankan migrasi ${file}`);
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    }
  } finally {
    await conn.end();
  }
}
