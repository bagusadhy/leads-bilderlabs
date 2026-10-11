const env = process.env;

export const config = {
  port: Number(env.PORT || 3000),
  db: {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'bilder',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'bilder_dashboard',
  },
  // Set to true when the dashboard is served over HTTPS (reverse proxy / tunnel).
  cookieSecure: env.COOKIE_SECURE === 'true',
  // Set to true when running behind Nginx, Caddy or Cloudflare Tunnel so the real client IP is used.
  trustProxy: env.TRUST_PROXY === 'true',
  sessionDays: Number(env.SESSION_DAYS || 30),
  // Optional bearer token for automations (POST /api/leads/import, GET /api/leads).
  apiToken: env.API_TOKEN || '',
};
