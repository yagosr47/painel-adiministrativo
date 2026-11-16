import express from 'express';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getDb, get, MEDIA_DIR } from './db/index.js';
import { userFromToken, parseCookies, SESSION_COOKIE } from './lib/session.js';
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
app.use(express.json({ limit: '4mb' }));

/* Sessao: popula req.user a partir do cookie httpOnly. */
app.use((req, _res, next) => {
  try {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    req.user = userFromToken(token) ?? null;
  } catch {
    req.user = null;
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'painel-administrativo', time: new Date().toISOString() });
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

/* Build de producao do painel (se existir). */
const distDir = path.join(APP_ROOT, 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir, { index: false }));
  app.get(/^(?!\/api|\/media).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

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
