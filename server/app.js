import express from 'express';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getDb, get, MEDIA_DIR } from './db/index.js';
import { parseCookies, SESSION_COOKIE, resolveSession } from './lib/session.js';
import { HttpError, notFound } from './lib/http.js';
import { mimeForExt } from './lib/storage.js';
import { authRouter, requireAuth } from './routes/auth.js';
import { templatesRouter } from './routes/templates.js';
import { imagesRouter } from './routes/images.js';
import { clientsRouter, publicRouter } from './routes/clients.js';
import { dashboardRouter } from './routes/dashboard.js';
import { usersRouter } from './routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
export const app = express();
app.disable('x-powered-by');
// Atras de proxy reverso (Render, Railway, Nginx, Vercel) o TLS termina antes
// do app: sem isso req.secure e sempre false e o cookie nunca sai Secure.
app.set('trust proxy', 1);
app.use(express.json({ limit: '4mb' }));

/**
 * Sessao: cookie httpOnly e o caminho principal. O token tambem pode vir no
 * header `Authorization: Bearer <token>`, o que mantem o login funcional quando
 * o navegador bloqueia cookies de terceiros (ex.: preview dentro de iframe).
 */
app.use((req, res, next) => {
  try {
    const header = String(req.headers.authorization ?? '');
    const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const cookies = parseCookies(req.headers.cookie);
    const resolved = resolveSession({ bearer, cookie: cookies[SESSION_COOKIE] });
    req.sessionToken = resolved.token;
    req.user = resolved.user;
    req.sessionSource = resolved.source;

    // O cliente precisa saber que o token dele morreu para nao reenviar um
    // Bearer invalido em toda requisicao (e para cair no cookie, se houver).
    if (resolved.staleBearer) res.setHeader('X-Session-Stale', 'bearer');
    if (resolved.staleCookie) res.setHeader('X-Session-Stale', 'cookie');
  } catch {
    req.user = null;
  }
  next();
});

/**
 * Preflight CORS. O painel e a API normalmente sao a mesma origem, mas em
 * hospedagem separada (UI estatica + API em outro dominio) o navegador manda
 * OPTIONS antes de qualquer requisicao com Authorization. Sem responder aqui, o
 * preflight caia no requireAuth e voltava 401, o que o navegador reporta como
 * falha de rede no login.
 *
 * Seguranca: nao liberamos origem arbitraria. Mesma origem sempre passa; outras
 * origens so quando listadas em PANEL_ALLOWED_ORIGINS (separadas por virgula).
 * Um preflight negado recebe 204 sem os cabecalhos de liberacao — o navegador
 * bloqueia sozinho, sem que a API exponha dados.
 */
function allowedOrigins() {
  return String(process.env.PANEL_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function hostnameOf(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return String(value ?? '').split(':')[0];
  }
}

function isSameOrigin(req) {
  const origin = String(req.headers.origin ?? '');
  if (!origin) return true;

  const originHost = hostnameOf(origin);
  const requestHost = hostnameOf(String(req.headers.host ?? ''));
  const forwardedHost = hostnameOf(String(req.headers['x-forwarded-host'] ?? ''));

  // O proxy do preview reescreve porta e esquema (a requisicao chega como
  // localhost:4000, mas o navegador fala https://4000-<sandbox>.e2b.app). Por
  // isso comparamos somente o HOSTNAME — a porta muda no caminho e nao e um
  // limite de seguranca relevante aqui (o cookie nao depende dela).
  if (!originHost) return false;
  if (originHost === requestHost || (forwardedHost && originHost === forwardedHost)) return true;

  // Hostnames do mesmo site (app.exemplo.com x preview.exemplo.com) nao passam
  // automaticamente: so a lista explicita libera.
  return allowedOrigins().some((item) => hostnameOf(item) === originHost);
}

app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') return next();
  const origin = String(req.headers.origin ?? '');
  const allowed = isSameOrigin(req) || allowedOrigins().includes(origin);

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'X-Session-Stale');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  return res.status(204).end();
});

/* Diagnostico publico: nao exige sessao (usado por monitores e pela UI). */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'painel-administrativo',
    ui: existsSync(path.join(APP_ROOT, 'dist', 'index.html')) ? 'build' : 'dev-vite',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter());

/* Area publica: sites publicados e arquivos de midia. */
app.get('/media/:file', (req, res, next) => {
  const clean = path.basename(String(req.params.file));
  const id = clean.replace(/\.[a-z0-9]+$/i, '');
  const ext = path.extname(clean).toLowerCase();
  const row = get('SELECT * FROM images WHERE id = ?', [id]);
  if (!row) return next(notFound('Imagem nao encontrada'));
  // Uma imagem de cliente so e servida se o site dela estiver publicado ou
  // se a requisicao vier de um usuario autenticado (preview do painel).
  if (row.owner_client_id && !req.user) {
    const published = get(
      `SELECT 1 AS ok FROM sites WHERE client_id = ? AND status = 'published' LIMIT 1`,
      [row.owner_client_id],
    );
    if (!published) return next(notFound('Imagem nao encontrada'));
  }
  const sub = row.owner_client_id ? path.join('clients', row.owner_client_id) : path.join('library', row.segment_slug);
  const file = path.join(MEDIA_DIR, sub, `${row.id}.${row.file_ext}`);
  if (!existsSync(file)) return next(notFound('Arquivo nao encontrado'));
  const mime = mimeForExt(`.${row.file_ext || ext}`);
  res.setHeader('Content-Type', mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  if (mime === 'image/svg+xml') {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:");
  }
  res.send(readFileSync(file));
});

app.use('/api/public', publicRouter());

/* Area administrativa protegida. */
app.use('/api', requireAuth);
app.use('/api', dashboardRouter());
app.use('/api', templatesRouter());
app.use('/api', imagesRouter());
app.use('/api', clientsRouter());
app.use('/api', usersRouter());

/*
 * Painel servido pela API.
 *
 * A decisao e tomada por requisicao (nao no boot): assim `npm start` (build +
 * servidor) e `npm run dev` (Vite separado) funcionam sem depender da ordem em
 * que dist/ apareceu. Havendo build, a interface fica na MESMA origem da API.
 */
const distDir = path.join(APP_ROOT, 'dist');
const distIndex = path.join(distDir, 'index.html');
const hasBuild = () => existsSync(distIndex);

app.use((req, res, next) => {
  if (!hasBuild()) return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/media')) return next();
  express.static(distDir, { index: false })(req, res, next);
});

/* Fallback de SPA + aviso quando a interface ainda nao foi compilada. */
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/media')) return next();
  if (hasBuild()) return res.sendFile(distIndex);
  res
    .status(503)
    .type('html')
    .send(
      `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Painel indisponivel</title>
       <body style="font-family:system-ui;padding:40px;max-width:640px;margin:0 auto;line-height:1.6">
       <h1 style="font-size:20px">Interface nao compilada</h1>
       <p>A API esta no ar, mas o painel ainda nao foi buildado nesta porta.</p>
       <p><strong>Desenvolvimento:</strong> rode <code>npm run dev</code> e acesse a porta do Vite (5173).<br>
          <strong>Producao:</strong> rode <code>npm start</code> (compila o painel e sobe API + UI juntas).</p>
       <p style="color:#666">Diagnostico: <a href="/api/health">/api/health</a></p></body></html>`,
    );
});

/* Handler de erros central. */
app.use((error, _req, res, _next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message, details: error.details ?? null });
  }
  if (error?.status) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('[erro]', error);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});


export default app;
