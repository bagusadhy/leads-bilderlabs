// Password hashing and session tokens with the Web Crypto API (available in Cloudflare Workers).
// Cloudflare caps PBKDF2 at 100,000 iterations.
export const ITERATIONS = 100_000;

const enc = new TextEncoder();
const toB64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password, salt, iterations, length = 32) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, length * 8);
  return new Uint8Array(bits);
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(a, b);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Format: pbkdf2$sha256$<iterations>$<salt base64>$<hash base64> (same as scripts/user.mjs). */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$sha256$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [alg, digest, iterations, salt, hash] = String(stored).split('$');
    if (alg !== 'pbkdf2' || digest !== 'sha256') return false;
    const expected = fromB64(hash);
    const actual = await derive(password, fromB64(salt), Math.min(Number(iterations) || ITERATIONS, ITERATIONS), expected.length);
    return equalBytes(expected, actual);
  } catch {
    return false;
  }
}

// Checked when the username does not exist, so a failed login takes the same time either way.
export const DUMMY_HASH = `pbkdf2$sha256$${ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA==$${'A'.repeat(43)}=`;

export async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newToken() {
  return toB64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function safeEqual(a, b) {
  return equalBytes(enc.encode(String(a)), enc.encode(String(b)));
}
