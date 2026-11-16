import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { restoreUrl } from '../../api/index.js';

let server;
let base;

before(async () => {
  const { default: handler } = await import('../../api/index.js');
  server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

const get = (path, headers = {}) => fetch(`${base}${path}`, { headers, redirect: 'manual' });

/**
 * O painel quebrou em producao com "The page could not be found NOT_FOUND".
 * A causa era o provedor tratar o projeto como estatico; o segundo risco e o
 * rewrite entregar a URL de destino. Estes testes fixam o contrato.
 */
test('restoreUrl aceita URL original preservada', () => {
  assert.equal(restoreUrl('/api/dashboard?x=1'), '/api/dashboard?x=1');
});

test('restoreUrl reconstroi a partir de __path e mantem a query do cliente', () => {
  const url = restoreUrl('/api/index?__path=%2Fapi%2Fclients%2F7&tab=fotos');
  assert.equal(url, '/api/clients/7?tab=fotos');
});

test('restoreUrl remove o prefixo /api/index quando o caminho vem anexado', () => {
  assert.equal(restoreUrl('/api/index/dashboard'), '/api/dashboard');
});

test('restoreUrl confia no cabecalho x-original-url', () => {
  assert.equal(restoreUrl('/api/index', { 'x-original-url': '/api/health' }), '/api/health');
});

test('rebuild do pedido: rota aninhada responde JSON, nunca 404 HTML', async () => {
  const res = await get('/api/index?__path=%2Fapi%2Fdashboard');
  assert.equal(res.status, 401, 'sem sessao a API responde 401 JSON');
  assert.match(res.headers.get('content-type') ?? '', /json/);
});

test('rewrite preservado: /api/health responde 200 com ui reportada', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(['build', 'dev-vite', 'none'].includes(body.ui));
});

test('login funciona pela entrada serverless (com cookie e token)', async () => {
  const res = await fetch(`${base}/api/index?__path=%2Fapi%2Fauth%2Flogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@painel.local', password: 'admin123' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.token, 'login precisa devolver token (fallback do cookie)');
  const session = await fetch(`${base}/api/auth/session`, {
    headers: { Authorization: `Bearer ${body.token}` },
  }).then((r) => r.json());
  assert.ok(session.user, 'token deve autenticar');
});

test('vercel.json tem rewrite de /api antes do fallback da SPA', async () => {
  const { readFileSync } = await import('node:fs');
  const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const sources = config.rewrites.map((r) => r.source);
  const apiIndex = sources.findIndex((s) => s.startsWith('/api/'));
  const mediaIndex = sources.findIndex((s) => s.startsWith('/media/'));
  const spaIndex = sources.findIndex((s) => s.includes('assets/'));
  assert.ok(apiIndex >= 0, 'falta rewrite de /api');
  assert.ok(apiIndex < spaIndex, 'rewrite de /api precisa vir antes da SPA');
  assert.ok(mediaIndex >= 0 && mediaIndex < spaIndex, 'rewrite de /media precisa vir antes da SPA');
  assert.equal(config.outputDirectory, 'dist');
});
