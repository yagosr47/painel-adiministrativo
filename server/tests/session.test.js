/**
 * Regressao do erro "estou logado mas a pagina pede login".
 *
 * Causa encontrada: o servidor escolhia UM canal de sessao
 * (`bearer || cookie`) e, se o bearer nao existisse mais naquele servidor
 * (token de outra instancia, sessao revogada, banco recriado), fazia
 * `req.user = null` mesmo com cookie valido. Resultado: visao geral e criacao de
 * template respondiam 401 para um usuario autenticado.
 *
 * Estes testes travam o contrato:
 *  - Bearer invalido NAO anula cookie valido (e vice-versa);
 *  - token valido continua funcionando sem cookie;
 *  - a resposta marca `X-Session-Stale` para o cliente limpar o token morto;
 *  - `/api/auth/revalidate` responde sem senha;
 *  - preflight OPTIONS nao cai no requireAuth.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const tempDir = mkdtempSync(path.join(tmpdir(), 'painel-session-'));
process.env.DATA_DIR = tempDir;
process.env.DB_PATH = path.join(tempDir, 'session.db');

const { app } = await import('../app.js');
const { seedDatabase } = await import('../seed/seed.js');
const { resetDb } = await import('../db/index.js');

let server;
let base;

before(async () => {
  seedDatabase({ force: true });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  resetDb();
  rmSync(tempDir, { recursive: true, force: true });
});

const credentials = { email: 'admin@painel.local', password: 'admin123' };

async function login() {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  const cookies = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie')];
  const sessionCookie = cookies
    .filter(Boolean)
    .map((item) => item.split(';')[0])
    .filter((item) => item.startsWith('panel_session='))[0];
  return { token: body.token, cookie: sessionCookie, cookies };
}

/** Resposta HTTP nao garante caixa do nome do header no fetch do Node. */
function expectHeaderCaseInsensitive(res, expected, { allowMissing = false } = {}) {
  const value = res.headers.get('x-session-stale');
  if (allowMissing && value === null) return;
  assert.equal(value, expected, `X-Session-Stale esperado "${expected}", recebido "${value}"`);
}

const call = (url, headers = {}) =>
  fetch(`${base}${url}`, { headers, redirect: 'manual' });

describe('duas camadas de sessao (cookie + bearer)', () => {
  test('cookie valido sobrevive a um Bearer invalido', async () => {
    const { cookie } = await login();
    const res = await call('/api/dashboard', {
      Cookie: cookie,
      Authorization: 'Bearer token-que-nao-existe-neste-servidor',
    });
    assert.equal(res.status, 200, 'bearer invalido nao pode derrubar o cookie');
    expectHeaderCaseInsensitive(res, 'bearer');
  });

  test('bearer valido sobrevive a um cookie invalido', async () => {
    const { token } = await login();
    const res = await call('/api/dashboard', {
      Cookie: 'panel_session=cookie-invalido',
      Authorization: `Bearer ${token}`,
    });
    assert.equal(res.status, 200, 'cookie invalido nao pode derrubar o bearer');
    expectHeaderCaseInsensitive(res, 'cookie');
  });

  test('token valido funciona sem nenhum cookie', async () => {
    const { token } = await login();
    const res = await call('/api/templates', { Authorization: `Bearer ${token}` });
    assert.equal(res.status, 200);
  });

  test('cookie valido funciona sem bearer', async () => {
    const { cookie } = await login();
    const res = await call('/api/templates', { Cookie: cookie });
    assert.equal(res.status, 200);
  });

  test('criar template funciona com qualquer um dos dois canais', async () => {
    const { token, cookie } = await login();
    for (const headers of [
      { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      { Cookie: cookie, 'Content-Type': 'application/json' },
    ]) {
      const res = await fetch(`${base}/api/templates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: `Modelo ${Math.random().toString(36).slice(2, 6)}`, segment_slug: 'lojas', preset: true }),
      });
      assert.equal(res.status, 201, `criacao falhou para ${Object.keys(headers).join('+')}`);
    }
  });

  test('sem sessao nenhuma continua 401', async () => {
    const res = await call('/api/dashboard');
    assert.equal(res.status, 401);
  });

  test('logout revoga a sessao nos dois canais', async () => {
    const { token, cookie } = await login();
    const out = await fetch(`${base}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
    });
    assert.equal(out.status, 200);
    assert.equal((await call('/api/dashboard', { Cookie: cookie })).status, 401);
    assert.equal((await call('/api/dashboard', { Authorization: `Bearer ${token}` })).status, 401);
  });
});

describe('diagnostico da sessao', () => {
  test('/api/auth/session diz por qual canal a sessao foi aceita', async () => {
    const { token, cookie } = await login();

    const viaCookie = await (await call('/api/auth/session', { Cookie: cookie })).json();
    assert.equal(viaCookie.sessionSource, 'cookie');
    assert.equal(viaCookie.cookieAuth, true);
    assert.equal(viaCookie.cookiePresent, true);

    const viaToken = await (await call('/api/auth/session', { Authorization: `Bearer ${token}` })).json();
    assert.equal(viaToken.sessionSource, 'bearer');
    assert.equal(viaToken.cookieAuth, false);
  });

  test('/api/auth/revalidate responde 200 para sessao valida e 401 para morta', async () => {
    const { token } = await login();
    const ok = await call('/api/auth/revalidate', { Authorization: `Bearer ${token}` });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).valid, true);

    const dead = await call('/api/auth/revalidate', { Authorization: 'Bearer nao-existe' });
    assert.equal(dead.status, 401);
    assert.equal((await dead.json()).valid, false);
  });

  test('login grava o ponteiro de sessao nao sensivel', async () => {
    const { cookies } = await login();
    const sid = cookies.find((item) => item?.startsWith('panel_sid='));
    assert.ok(sid, 'cookie panel_sid ausente');
    assert.ok(!/HttpOnly/i.test(sid), 'panel_sid precisa ser legivel pelo JS');
  });
});

describe('preflight CORS', () => {
  test('OPTIONS de mesma origem responde 204 e libera Authorization', async () => {
    const res = await fetch(`${base}/api/templates`, {
      method: 'OPTIONS',
      headers: {
        // origem igual ao host que esta atendendo o teste
        Origin: base,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    assert.equal(res.status, 204, 'preflight nunca pode exigir sessao');
    assert.ok(
      String(res.headers.get('access-control-allow-headers') ?? '').toLowerCase().includes('authorization'),
      'preflight precisa liberar o header Authorization',
    );
    assert.ok(
      String(res.headers.get('access-control-allow-methods') ?? '').includes('POST'),
      'preflight precisa listar POST',
    );
  });

  test('hostname do proxy de preview (porta diferente) e aceito', async () => {
    const res = await fetch(`${base}/api/templates`, {
      method: 'OPTIONS',
      headers: {
        // O preview chega como https://<porta>-<sandbox>.e2b.app mas o Host
        // interno e localhost:4000 — comparar porta quebraria o login.
        Origin: 'https://4000-sandbox-de-teste.e2b.app',
        'X-Forwarded-Host': '4000-sandbox-de-teste.e2b.app',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://4000-sandbox-de-teste.e2b.app');
  });

  test('origem nao permitida nao recebe cabecalho de liberacao', async () => {
    const res = await fetch(`${base}/api/templates`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://site-qualquer.example', 'Access-Control-Request-Method': 'GET' },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });

  test('origem na lista PANEL_ALLOWED_ORIGINS e liberada', async () => {
    process.env.PANEL_ALLOWED_ORIGINS = 'https://painel.exemplo.com';
    try {
      const res = await fetch(`${base}/api/templates`, {
        method: 'OPTIONS',
        headers: { Origin: 'https://painel.exemplo.com', 'Access-Control-Request-Method': 'GET' },
      });
      assert.equal(res.headers.get('access-control-allow-origin'), 'https://painel.exemplo.com');
    } finally {
      delete process.env.PANEL_ALLOWED_ORIGINS;
    }
  });
});
