import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const PARAMS = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [alg, N, r, p, salt, hash] = String(stored).split('$');
    if (alg !== 'scrypt') return false;
    const expected = Buffer.from(hash, 'base64');
    const key = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p });
    return crypto.timingSafeEqual(expected, key);
  } catch {
    return false;
  }
}

// Used when the username does not exist, so a failed login takes the same time either way.
export const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

export const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
export const newToken = () => crypto.randomBytes(32).toString('base64url');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
