/**
 * Testes de contrato e de isolamento.
 *
 * Rodam contra uma instancia real do app Express, com banco e diretorio de
 * midia temporarios (nunca tocam em data/). Cada teste e independente.
 *
 *   npm test
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const tempDir = mkdtempSync(path.join(tmpdir(), 'painel-test-'));
process.env.DATA_DIR = tempDir;
process.env.DB_PATH = path.join(tempDir, 'test.db');

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

/* ------------------------------- helpers -------------------------------- */

let cookie = '';

async function request(method, url, body, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (cookie && !options.noAuth) headers.Cookie = cookie;
  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${base}${url}`, { method, headers, body: payload, redirect: 'manual' });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie && !options.keepCookie) cookie = setCookie.split(';')[0];
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

const asAdmin = async () => {
  cookie = '';
  const res = await request('POST', '/api/auth/login', {
    email: 'admin@painel.local',
    password: 'admin123',
  });
  assert.equal(res.status, 200);
  return res.body.user;
};

async function createClient(name, segment, templateSlug = null) {
  const templates = await request('GET', '/api/templates');
  const tpl = templateSlug ? templates.body.templates.find((t) => t.slug === templateSlug) : null;
  const res = await request('POST', '/api/clients', {
    name,
    segment_slug: segment,
    template_id: tpl?.id ?? null,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.client;
}

const siteOf = async (clientId) => (await request('GET', `/api/clients/${clientId}`)).body;

/* -------------------------------- testes -------------------------------- */

describe('autenticacao e permissoes', () => {
  test('rotas administrativas exigem sessao', async () => {
    cookie = '';
    for (const url of ['/api/templates', '/api/clients', '/api/images', '/api/dashboard']) {
      const res = await request('GET', url, undefined, { noAuth: true });
      assert.equal(res.status, 401, `${url} deveria exigir login`);
    }
  });

  test('login invalido e rejeitado', async () => {
    cookie = '';
    const res = await request('POST', '/api/auth/login', { email: 'admin@painel.local', password: 'errada' });
    assert.equal(res.status, 401);
  });

  test('login valido cria sessao e devolve usuario', async () => {
    const user = await asAdmin();
    assert.equal(user.role, 'admin');
    const session = await request('GET', '/api/auth/session');
    assert.equal(session.body.user.email, 'admin@painel.local');
  });

  test('login devolve token e o token funciona sem cookie (iframe/cookies bloqueados)', async () => {
    await asAdmin();
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@painel.local',
      password: 'admin123',
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token, 'login deve devolver token alem do cookie');

    // sem cookie, somente com Authorization: Bearer
    const session = await fetch(`${base}/api/auth/session`, {
      headers: { Authorization: `Bearer ${res.body.token}` },
    }).then((r) => r.json());
    assert.equal(session.user.email, 'admin@painel.local');

    const dashboard = await fetch(`${base}/api/dashboard`, {
      headers: { Authorization: `Bearer ${res.body.token}` },
    });
    assert.equal(dashboard.status, 200);
  });

  test('token invalido nao autentica', async () => {
    const res = await fetch(`${base}/api/dashboard`, {
      headers: { Authorization: 'Bearer token-falso' },
    });
    assert.equal(res.status, 401);
  });

  test('logout invalida o token usado', async () => {
    const login = await request('POST', '/api/auth/login', {
      email: 'admin@painel.local',
      password: 'admin123',
    });
    const token = login.body.token;
    const out = await fetch(`${base}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(out.status, 200);
    const after = await fetch(`${base}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    assert.equal(after.user, null);
  });

  test('senha nunca e exposta nas respostas', async () => {
    await asAdmin();
    const res = await request('GET', '/api/users');
    assert.ok(!JSON.stringify(res.body).includes('scrypt'));
  });
});

describe('biblioteca de templates', () => {
  test('todos os segmentos solicitados existem', async () => {
    await asAdmin();
    const res = await request('GET', '/api/segments');
    const slugs = res.body.segments.map((s) => s.slug);
    for (const slug of ['restaurantes', 'barbearias', 'oficinas', 'lojas', 'mercados', 'clinicas', 'portfolio']) {
      assert.ok(slugs.includes(slug), `segmento ${slug} ausente`);
    }
  });

  test('cada segmento tem ao menos um template publicado', async () => {
    await asAdmin();
    const res = await request('GET', '/api/templates?status=published');
    const segments = new Set(res.body.templates.map((t) => t.segment_slug));
    for (const slug of ['restaurantes', 'barbearias', 'oficinas', 'lojas', 'mercados', 'clinicas', 'portfolio']) {
      assert.ok(segments.has(slug), `segmento ${slug} sem template publicado`);
    }
  });

  test('templates de segmentos distintos tem estruturas distintas', async () => {
    await asAdmin();
    const res = await request('GET', '/api/templates');
    const signatures = new Set(
      res.body.templates.map((t) => `${t.segment_slug}:${t.stats.sections}:${t.stats.products}`),
    );
    assert.ok(signatures.size >= 7, 'templates parecem copias entre si');
  });

  test('duplicar cria rascunho independente', async () => {
    await asAdmin();
    const list = await request('GET', '/api/templates');
    const original = list.body.templates.find((t) => t.slug === 'forno-italiano');
    const dup = await request('POST', `/api/templates/${original.id}/duplicate`, { name: 'Copia de teste' });
    assert.equal(dup.status, 201);
    assert.equal(dup.body.template.status, 'draft');
    assert.notEqual(dup.body.template.id, original.id);

    const detail = await request('GET', `/api/templates/${dup.body.template.id}`);
    assert.equal(detail.body.template.config.sections.length > 0, true);
  });

  test('toda referencia de imagem do template pertence ao seu segmento', async () => {
    await asAdmin();
    const list = await request('GET', '/api/templates');
    for (const tpl of list.body.templates) {
      const detail = await request('GET', `/api/templates/${tpl.id}`);
      const config = detail.body.template.config;
      const ids = [...JSON.stringify(config).matchAll(/"imageId":"([^"]+)"/g)].map((m) => m[1]);
      const images = await request('GET', `/api/images?segment=${tpl.segment_slug}`);
      const available = new Set(images.body.images.map((i) => i.id));
      for (const id of ids) {
        assert.ok(available.has(id), `template ${tpl.slug} usa imagem ${id} fora do segmento ${tpl.segment_slug}`);
      }
    }
  });
});

describe('isolamento entre template e sites', () => {
  test('editar template NAO altera site existente', async () => {
    await asAdmin();
    const client = await createClient('Cliente Isolamento A', 'restaurantes', 'forno-italiano');
    const before = await siteOf(client.id);

    const tpl = await request('GET', `/api/templates/${before.template.id}`);
    const config = tpl.body.template.config;
    config.theme.primary = '#00ff00';
    config.identity.name = 'MODELO ALTERADO';
    const patched = await request('PATCH', `/api/templates/${tpl.body.template.id}`, { config });
    assert.equal(patched.status, 200);

    const afterSite = await siteOf(client.id);
    assert.equal(afterSite.site.config.identity.name, before.site.config.identity.name);
    assert.equal(afterSite.site.config.theme.primary, before.site.config.theme.primary);
    assert.deepEqual(afterSite.site.config.sections, before.site.config.sections);
    // o site sabe que o modelo avancou, mas nao herdou nada
    assert.equal(afterSite.template.version_now > afterSite.template.origin_version, true);
  });

  test('personalizar um cliente NAO altera outro cliente do mesmo template', async () => {
    await asAdmin();
    const a = await createClient('Cliente A', 'lojas', 'vitrine-urbana');
    const b = await createClient('Cliente B', 'lojas', 'vitrine-urbana');

    const siteA = await siteOf(a.id);
    const configA = structuredClone(siteA.site.config);
    configA.theme.primary = '#ff00aa';
    configA.products.items[0].price = 12345;
    configA.identity.name = 'So o Cliente A';
    const saved = await request('PUT', `/api/clients/${a.id}/site`, { config: configA });
    assert.equal(saved.status, 200);

    const siteB = await siteOf(b.id);
    assert.notEqual(siteB.site.config.theme.primary, '#ff00aa');
    assert.notEqual(siteB.site.config.products.items[0].price, 12345);
    assert.equal(siteB.site.config.identity.name, 'Cliente B');

    // e o template segue intacto
    const tpl = await request('GET', `/api/templates/${siteB.template.id}`);
    assert.notEqual(tpl.body.template.config.theme.primary, '#ff00aa');
  });

  test('config do site e copia profunda (sem referencia compartilhada)', async () => {
    await asAdmin();
    const c = await createClient('Cliente Copia Profunda', 'clinicas', 'clinica-vitalis');
    const site = await siteOf(c.id);
    const config = structuredClone(site.site.config);
    config.sections[0].props.badges = ['novo selo'];
    config.sections[0].props.title = 'Titulo customizado';
    await request('PUT', `/api/clients/${c.id}/site`, { config });

    const again = await siteOf(c.id);
    assert.equal(again.site.config.sections[0].props.title, 'Titulo customizado');

    const tpl = await request('GET', `/api/templates/${again.template.id}`);
    const templateHero = tpl.body.template.config.sections.find((s) => s.type === 'hero');
    assert.notEqual(templateHero.props.title, 'Titulo customizado');
  });

  test('salvar site cria revisao versionada', async () => {
    await asAdmin();
    const c = await createClient('Cliente Revisao', 'mercados', 'mercado-do-bairro');
    const site = await siteOf(c.id);
    const config = structuredClone(site.site.config);
    config.identity.tagline = 'Alterado 1';
    await request('PUT', `/api/clients/${c.id}/site`, { config });
    config.identity.tagline = 'Alterado 2';
    await request('PUT', `/api/clients/${c.id}/site`, { config });

    const revisions = await request('GET', `/api/clients/${c.id}/site/revisions`);
    assert.ok(revisions.body.revisions.length >= 3);

    const target = revisions.body.revisions.find((r) => r.version === 1);
    const restored = await request('POST', `/api/clients/${c.id}/site/revisions/${target.id}/restore`);
    assert.equal(restored.status, 200);

    const after = await siteOf(c.id);
    assert.notEqual(after.site.config.identity.tagline, 'Alterado 2');
    const revisionsAfter = await request('GET', `/api/clients/${c.id}/site/revisions`);
    assert.ok(revisionsAfter.body.revisions.length > revisions.body.revisions.length, 'restauracao deve versionar');
  });
});

describe('isolamento da biblioteca de imagens', () => {
  test('imagem de um cliente nao pode ser usada por outro', async () => {
    await asAdmin();
    const owner = await createClient('Dono da Imagem', 'barbearias', 'navalha-de-ouro');
    const other = await createClient('Outro Cliente', 'barbearias', 'studio-lumiere');

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
      'base64',
    );
    const form = new FormData();
    form.append('file', new Blob([png], { type: 'image/png' }), 'logo.png');
    form.append('client_id', owner.id);
    form.append('category_slug', 'proprias');
    form.append('title', 'Logo proprio');
    form.append('license', 'own');
    const upload = await request('POST', '/api/images', form);
    assert.equal(upload.status, 201, JSON.stringify(upload.body));
    assert.equal(upload.body.image.scope, 'client');
    assert.equal(upload.body.image.owner_client_id, owner.id);

    const otherSite = await siteOf(other.id);
    const config = structuredClone(otherSite.site.config);
    config.sections[0].props.imageId = upload.body.image.id;
    const attempt = await request('PUT', `/api/clients/${other.id}/site`, { config });
    assert.equal(attempt.status, 400);
    assert.ok(JSON.stringify(attempt.body).includes('outro cliente'));

    // o dono pode usar
    const ownerSite = await siteOf(owner.id);
    const ownerConfig = structuredClone(ownerSite.site.config);
    ownerConfig.sections[0].props.imageId = upload.body.image.id;
    const ok = await request('PUT', `/api/clients/${owner.id}/site`, { config: ownerConfig });
    assert.equal(ok.status, 200);
  });

  test('imagem privada de um cliente nao aparece na biblioteca de outro', async () => {
    await asAdmin();
    const owner = await createClient('Dono B', 'oficinas', 'torque-auto-center');
    const other = await createClient('Outro B', 'oficinas', 'torque-auto-center');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
      'base64',
    );
    const form = new FormData();
    form.append('file', new Blob([png], { type: 'image/png' }), 'peca.png');
    form.append('client_id', owner.id);
    form.append('title', 'Peca propria');
    form.append('category_slug', 'proprias');
    const upload = await request('POST', '/api/images', form);
    assert.equal(upload.status, 201);

    const listing = await request('GET', `/api/images?clientId=${other.id}`);
    const ids = listing.body.images.map((i) => i.id);
    assert.ok(!ids.includes(upload.body.image.id), 'imagem privada vazou para outro cliente');
  });

  test('imagem de biblioteca de outro segmento e bloqueada', async () => {
    await asAdmin();
    const c = await createClient('Cliente Segmento', 'restaurantes', 'burger-street');
    const site = await siteOf(c.id);
    const config = structuredClone(site.site.config);
    const otherSegmentImages = await request('GET', '/api/images?segment=barbearias');
    config.sections[0].props.imageId = otherSegmentImages.body.images[0].id;
    const res = await request('PUT', `/api/clients/${c.id}/site`, { config });
    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body).includes('outro segmento'));
  });

  test('imagens ilustrativas sao identificadas e possuem nota de licenca', async () => {
    await asAdmin();
    const res = await request('GET', '/api/images?segment=restaurantes');
    assert.ok(res.body.images.length > 0);
    for (const img of res.body.images.slice(0, 10)) {
      assert.equal(img.illustrative, true);
      assert.ok(img.license_note.length > 0);
    }
  });

  test('upload valida formato e rejeita arquivo invalido', async () => {
    await asAdmin();
    const form = new FormData();
    form.append('file', new Blob([Buffer.from('isto nao e imagem')], { type: 'text/plain' }), 'x.txt');
    form.append('title', 'Invalida');
    form.append('category_slug', 'proprias');
    const res = await request('POST', '/api/images', form);
    assert.equal(res.status, 400);
  });

  test('SVG com conteudo ativo e rejeitado', async () => {
    await asAdmin();
    const evil = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const form = new FormData();
    form.append('file', new Blob([evil], { type: 'image/svg+xml' }), 'evil.svg');
    form.append('title', 'SVG malicioso');
    form.append('category_slug', 'proprias');
    const res = await request('POST', '/api/images', form);
    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body).toLowerCase().includes('svg'));
  });

  test('SVG limpo e aceito e servido com CSP restritiva', async () => {
    await asAdmin();
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#333"/></svg>',
    );
    const form = new FormData();
    form.append('file', new Blob([svg], { type: 'image/svg+xml' }), 'ok.svg');
    form.append('title', 'SVG limpo');
    form.append('category_slug', 'proprias');
    form.append('segment_slug', 'lojas');
    const res = await request('POST', '/api/images', form);
    assert.equal(res.status, 201, JSON.stringify(res.body));

    const raw = await fetch(`${base}${res.body.image.url}`);
    assert.equal(raw.status, 200);
    assert.match(raw.headers.get('content-type') ?? '', /image\/svg\+xml/);
    assert.match(raw.headers.get('content-security-policy') ?? '', /default-src 'none'/);
    assert.equal(raw.headers.get('x-content-type-options'), 'nosniff');
  });

  test('substituir arquivo mantem o mesmo id (referencias preservadas)', async () => {
    await asAdmin();
    const list = await request('GET', '/api/images?segment=lojas');
    const image = list.body.images[0];
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
      'base64',
    );
    const form = new FormData();
    form.append('file', new Blob([png], { type: 'image/png' }), 'nova.png');
    const res = await request('PUT', `/api/images/${image.id}/file`, form);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.image.id, image.id);
    assert.equal(res.body.image.file_ext, 'png');
    assert.ok(res.body.image.replaced_at);
  });
});

describe('publicacao e acesso publico', () => {
  test('rascunho nao e acessivel publicamente, publicado e', async () => {
    await asAdmin();
    const c = await createClient('Cliente Publicacao', 'portfolio', 'ateliere-portfolio');
    const draft = await request('GET', `/api/public/sites/${c.slug}`, undefined, { noAuth: true });
    assert.equal(draft.status, 404);

    const published = await request('POST', `/api/clients/${c.id}/site/publish`);
    assert.equal(published.status, 200);

    const res = await request('GET', `/api/public/sites/${c.slug}`, undefined, { noAuth: true });
    assert.equal(res.status, 200);
    assert.ok(res.body.site.config.sections.length > 0);
    assert.ok(Object.keys(res.body.images).length > 0, 'site publico precisa das imagens resolvidas');
  });

  test('despublicar volta a bloquear o acesso', async () => {
    await asAdmin();
    const c = await createClient('Cliente Offline', 'portfolio', 'instituto-horizonte');
    await request('POST', `/api/clients/${c.id}/site/publish`);
    await request('POST', `/api/clients/${c.id}/site/unpublish`);
    const res = await request('GET', `/api/public/sites/${c.slug}`, undefined, { noAuth: true });
    assert.equal(res.status, 404);
  });

  test('imagem propria de site publicado e servida; de site em rascunho nao', async () => {
    await asAdmin();
    const c = await createClient('Cliente Midia', 'clinicas', 'clinica-vitalis');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
      'base64',
    );
    const form = new FormData();
    form.append('file', new Blob([png], { type: 'image/png' }), 'foto.png');
    form.append('client_id', c.id);
    form.append('title', 'Foto do cliente');
    form.append('category_slug', 'proprias');
    const upload = await request('POST', '/api/images', form);
    const url = upload.body.image.url;

    const blocked = await request('GET', url, undefined, { noAuth: true, keepCookie: true });
    assert.equal(blocked.status, 404, 'imagem de site nao publicado deve ser privada');

    await request('POST', `/api/clients/${c.id}/site/publish`);
    const allowed = await request('GET', url, undefined, { noAuth: true, keepCookie: true });
    assert.equal(allowed.status, 200);
  });
});

describe('validacao de entrada', () => {
  test('cliente exige nome e segmento valido', async () => {
    await asAdmin();
    assert.equal((await request('POST', '/api/clients', { segment_slug: 'lojas' })).status, 400);
    assert.equal((await request('POST', '/api/clients', { name: 'X', segment_slug: 'inexistente' })).status, 400);
  });

  test('identificador de site duplicado e rejeitado', async () => {
    await asAdmin();
    const first = await createClient('Loja Unica', 'lojas');
    const res = await request('POST', '/api/clients', { name: 'Loja Unica', segment_slug: 'lojas' });
    assert.equal(res.status, 409);
    assert.ok(first.slug);
  });

  test('remover template em uso exige confirmacao explicita', async () => {
    await asAdmin();
    const c = await createClient('Cliente Template Remocao', 'restaurantes', 'burger-street');
    const site = await siteOf(c.id);
    const res = await request('DELETE', `/api/templates/${site.template.id}`);
    assert.equal(res.status, 409);
    assert.equal(res.body.details.sites_using >= 1, true);

    const forced = await request('DELETE', `/api/templates/${site.template.id}?force=true`);
    assert.equal(forced.status, 200);

    // o site continua funcionando sem o template
    const afterSite = await siteOf(c.id);
    assert.ok(afterSite.site.config.sections.length > 0);
    assert.equal(afterSite.site.status, 'draft');
  });

  test('reaplicar template de outro segmento e bloqueado', async () => {
    await asAdmin();
    const c = await createClient('Cliente Cross Segmento', 'mercados');
    const tpls = await request('GET', '/api/templates?segment=barbearias');
    const res = await request('POST', `/api/clients/${c.id}/site/apply-template`, {
      template_id: tpls.body.templates[0].id,
      mode: 'theme',
    });
    assert.equal(res.status, 400);
  });

  test('reaplicar tema nao sobrescreve conteudo do cliente', async () => {
    await asAdmin();
    const c = await createClient('Cliente Reaplicar', 'oficinas', 'torque-auto-center');
    const site = await siteOf(c.id);
    const config = structuredClone(site.site.config);
    config.products.items[0].price = 777;
    config.identity.name = 'Nome do Cliente';
    await request('PUT', `/api/clients/${c.id}/site`, { config });

    const tpls = await request('GET', '/api/templates?segment=oficinas');
    const apply = await request('POST', `/api/clients/${c.id}/site/apply-template`, {
      template_id: tpls.body.templates[0].id,
      mode: 'theme',
    });
    assert.equal(apply.status, 200);
    const after = await siteOf(c.id);
    assert.equal(after.site.config.products.items[0].price, 777);
    assert.equal(after.site.config.identity.name, 'Nome do Cliente');
  });
});

describe('usuarios e permissoes', () => {
  test('administrador cria editor e editor tem acesso limitado', async () => {
    await asAdmin();
    const created = await request('POST', '/api/users', {
      name: 'Editor de Teste',
      email: 'editor.teste@painel.local',
      password: 'senhaSegura123',
      role: 'editor',
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));

    const editor = await request('POST', '/api/auth/login', {
      email: 'editor.teste@painel.local',
      password: 'senhaSegura123',
    });
    assert.equal(editor.status, 200);
    assert.equal(editor.body.user.role, 'editor');

    // editor pode editar conteudo
    const clients = await request('GET', '/api/clients');
    const clientId = clients.body.clients[0].id;
    const site = await siteOf(clientId);
    const config = structuredClone(site.site.config);
    config.identity.tagline = 'Editado pelo editor';
    assert.equal((await request('PUT', `/api/clients/${clientId}/site`, { config })).status, 200);

    // editor nao pode excluir template nem gerenciar usuarios
    const templates = await request('GET', '/api/templates');
    const tpl = templates.body.templates.find((t) => t.status === 'draft') ?? templates.body.templates[0];
    const deleteAttempt = await request('DELETE', `/api/templates/${tpl.id}?force=true`);
    assert.equal(deleteAttempt.status, 403);

    const userAttempt = await request('POST', '/api/users', {
      name: 'Outro',
      email: 'outro@painel.local',
      password: 'senhaSegura123',
      role: 'admin',
    });
    assert.equal(userAttempt.status, 403);

    const listUsers = await request('GET', '/api/users');
    assert.equal(listUsers.status, 200);
    assert.equal(listUsers.body.canManage, false);
  });

  test('senha curta e rejeitada e e-mail duplicado tambem', async () => {
    await asAdmin();
    assert.equal(
      (await request('POST', '/api/users', { name: 'X', email: 'x@painel.local', password: '123', role: 'editor' })).status,
      400,
    );
    assert.equal(
      (
        await request('POST', '/api/users', {
          name: 'X',
          email: 'admin@painel.local',
          password: 'senhaSegura123',
          role: 'editor',
        })
      ).status,
      409,
    );
  });

  test('usuario desativado perde acesso imediatamente', async () => {
    await asAdmin();
    const created = await request('POST', '/api/users', {
      name: 'Temporario',
      email: 'temp@painel.local',
      password: 'senhaSegura123',
      role: 'editor',
    });
    assert.equal(created.status, 201);
    const login = await request('POST', '/api/auth/login', {
      email: 'temp@painel.local',
      password: 'senhaSegura123',
    });
    assert.equal(login.status, 200);
    assert.equal((await request('GET', '/api/dashboard')).status, 200);

    await asAdmin();
    const off = await request('PATCH', `/api/users/${created.body.user.id}`, { active: false });
    assert.equal(off.status, 200);

    const again = await request('POST', '/api/auth/login', {
      email: 'temp@painel.local',
      password: 'senhaSegura123',
    });
    assert.equal(again.status, 401);
  });

  test('admin nao pode se auto-bloquear', async () => {
    const admin = await asAdmin();
    const res = await request('PATCH', `/api/users/${admin.id}`, { active: false });
    assert.equal(res.status, 400);
    const role = await request('PATCH', `/api/users/${admin.id}`, { role: 'editor' });
    assert.equal(role.status, 400);
  });
});

describe('auditoria', () => {
  test('acoes relevantes geram registro de atividade', async () => {
    await asAdmin();
    const c = await createClient('Cliente Auditoria', 'lojas');
    const site = await siteOf(c.id);
    await request('POST', `/api/clients/${c.id}/site/publish`);
    const activity = await request('GET', '/api/activity?limit=50');
    const actions = activity.body.activity.map((a) => a.action);
    assert.ok(actions.includes('client.created'));
    assert.ok(actions.includes('site.published'));
    assert.ok(site.site.id);
  });
});
