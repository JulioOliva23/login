import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './db.js';

const scryptAsync = promisify(scrypt);
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
export const COOKIE_NAME = 'sid';

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [salt, keyHex] = stored.split(':');
  const key = await scryptAsync(password, salt, 64);
  return timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, expiresAt);
  return { token, expiresAt };
}

export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function cookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt),
    path: '/',
  };
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// Middleware: carga req.user si hay una sesión válida
export function loadUser(req, _res, next) {
  const token = readCookie(req, COOKIE_NAME);
  req.sessionToken = token;
  req.user = null;
  if (token) {
    const row = db.prepare(`
      SELECT u.id, u.name, u.email, u.created_at, s.expires_at
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `).get(token);
    if (row && row.expires_at > Date.now()) {
      const { expires_at, ...user } = row;
      req.user = user;
    } else if (row) {
      deleteSession(token);
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  next();
}
