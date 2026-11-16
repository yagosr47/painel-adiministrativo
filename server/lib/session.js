import { all, get, run } from '../db/index.js';
import { newToken, verifyPassword } from './auth.js';

const SESSION_DAYS = 14;
export const SESSION_COOKIE = 'panel_session';
/**
 * Cookies com o id da sessao do bearer. O token em si NUNCA vai para cookie
 * (fica so no localStorage); o que sai aqui e apenas um ponteiro para a linha de
 * `sessions`, usado para manter a sessao sincronizada entre os dois canais.
 */
export const SESSION_ID_COOKIE = 'panel_sid';

export function createSession(userId) {
  const token = newToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400 * 1000);
  run('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)', [
    token,
    userId,
    now.toISOString(),
    expires.toISOString(),
  ]);
  return { token, expires_at: expires.toISOString() };
}

export function destroySession(token) {
  if (token) run('DELETE FROM sessions WHERE token = ?', [token]);
}

export function userFromToken(token) {
  if (!token) return null;
  const row = get(
    `SELECT s.token, s.expires_at, u.id, u.name, u.email, u.role, u.active
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
    [token],
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now() || !row.active) {
    destroySession(token);
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function authenticate(email, password) {
  const row = get('SELECT * FROM users WHERE lower(email) = lower(?)', [String(email ?? '').trim()]);
  if (!row || !row.active) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

/**
 * Escolhe a sessao valida entre as duas origens possiveis.
 *
 * `Authorization: Bearer` e o cookie `panel_session` sao caminhos alternativos,
 * nao concorrentes: se um deles estiver invalido (token de outro servidor, cookie
 * expirado, sessao revogada), o outro ainda vale. Antes, um token invalido fazia
 * `req.user = null` mesmo com cookie bom, e o painel pedia login de novo.
 */
export function resolveSession({ bearer = '', cookie = '' } = {}) {
  const bearerUser = bearer ? userFromToken(bearer) : null;
  const cookieUser = cookie ? userFromToken(cookie) : null;

  // Preferencia: o token (mais recente quando o cookie foi bloqueado no login).
  const user = bearerUser ?? cookieUser;
  const source = bearerUser ? 'bearer' : cookieUser ? 'cookie' : null;

  return {
    user,
    token: source === 'bearer' ? bearer : source === 'cookie' ? cookie : null,
    source,
    // Canal apresentado e rejeitado. Reportado sempre — inclusive quando o outro
    // canal autenticou — para o cliente limpar o token morto e nao reenviar lixo
    // em toda requisicao.
    staleBearer: Boolean(bearer) && !bearerUser,
    staleCookie: Boolean(cookie) && !cookieUser,
  };
}

/** Extrai o id da sessao (o proprio token) para o cookie ponteiro. */
export function sessionIdFromToken(token) {
  return token ? String(token).slice(0, 32) : null;
}

export function countUsers() {
  return get('SELECT COUNT(*) AS total FROM users')?.total ?? 0;
}

export function listUsers() {
  return all('SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at');
}
