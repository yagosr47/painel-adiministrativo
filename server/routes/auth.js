import { Router } from 'express';
import {
  authenticate,
  createSession,
  destroySession,
  parseCookies,
  SESSION_COOKIE,
  SESSION_ID_COOKIE,
  sessionIdFromToken,
  countUsers,
} from '../lib/session.js';
import { logActivity } from '../lib/activity.js';
import { badRequest, unauthorized, HttpError } from '../lib/http.js';
import { wrapAsyncRouter } from '../lib/http.js';

export function authRouter() {
  const router = Router();

  router.get('/session', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    // cookieAuth = a sessao veio do cookie. Se veio do Bearer, o cookie pode
    // estar bloqueado OU apenas ausente: quem decide avisar o usuario e o
    // cliente, testando se `panel_session` voltou no login.
    res.json({
      user: req.user,
      needsSetup: countUsers() === 0,
      cookieAuth: req.sessionSource === 'cookie',
      sessionSource: req.sessionSource,
      hasBearer: Boolean(String(req.headers.authorization ?? '').startsWith('Bearer ')),
      cookiePresent: Boolean(cookies[SESSION_COOKIE]),
    });
  });

  /**
   * Revalida a sessao sem senha. Chamado pela UI no boot quando o servidor
   * respondeu 401 mas existe token local: se o token nao vale mais, a UI sabe
   * que precisa pedir login (e limpa o token); se vale, segue autenticado.
   */
  router.get('/revalidate', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ user: null, valid: false, stale: true });
    }
    res.json({ user: req.user, valid: true, sessionSource: req.sessionSource });
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw badRequest('Informe e-mail e senha');
    const user = authenticate(email, password);
    if (!user) throw new HttpError(401, 'E-mail ou senha invalidos');
    const session = createSession(user.id);
    res.cookie(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: 14 * 86400 * 1000,
      path: '/',
    });
    // Ponteiro nao sensivel para o token local: permite que a UI detecte "sessao
    // morta no servidor" sem guardar o token em cookie legivel.
    res.cookie(SESSION_ID_COOKIE, sessionIdFromToken(session.token), {
      httpOnly: false,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: 14 * 86400 * 1000,
      path: '/',
    });
    logActivity(user, 'auth.login', 'user', user.id, 'Login realizado');
    // O token tambem volta no corpo para o cliente poder usa-lo via header
    // quando o cookie for descartado (iframe / cookies de terceiros).
    res.json({ user, token: session.token, expires_at: session.expires_at });
  });

  router.post('/logout', (req, res) => {
    destroySession(req.sessionToken || parseCookies(req.headers.cookie)[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.clearCookie(SESSION_ID_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  return wrapAsyncRouter(router);
}

/** Middleware de protecao: exige sessao valida. */
export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

/** Middleware de permissao por papel. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Seu perfil nao tem permissao para esta acao'));
    }
    next();
  };
}
