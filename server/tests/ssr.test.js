/**
 * Renderiza o SiteRenderer (React) no servidor para cada template e valida o HTML.
 * Detecta erros de runtime, secoes ausentes e referencias de imagem quebradas.
 *
 * Usa esbuild (ja presente via Vite) para transpilar o TSX sem browser.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// o bundle precisa ficar dentro do projeto para resolver react/react-dom
const tempDir = mkdtempSync(path.join(process.cwd(), '.ssr-test-'));
process.env.DATA_DIR = tempDir;
process.env.DB_PATH = path.join(tempDir, 'ssr.db');

const { TEMPLATES, buildLibraryRecords } = await import('../seed/catalog.js');
const { normalizeConfig } = await import('../lib/config.js');

let SiteRenderer;
let assets = [];

before(async () => {
  const entry = path.join(tempDir, 'entry.tsx');
  writeFileSync(
    entry,
    `import { SiteRenderer } from ${JSON.stringify(path.resolve('client/src/site/SiteRenderer.tsx'))};\nexport { SiteRenderer };\n`,
    'utf8',
  );
  const outfile = path.join(tempDir, 'bundle.mjs');
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    logLevel: 'silent',
  });
  const mod = await import(outfile);
  SiteRenderer = mod.SiteRenderer;

  // resolve as imagens como o painel faz (url + metadados)
  const { buildIllustration } = await import('../lib/imagery.js');
  assets = buildLibraryRecords().map((record) => ({
    id: record.id,
    url: `/media/${record.id}.svg`,
    title: record.title,
    alt: record.title,
    license: 'illustrative',
  }));
  void buildIllustration;
});

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const imagesFor = (segment) =>
  Object.fromEntries(
    assets
      .filter((a) => a.id.startsWith(segment.slice(0, 4)))
      .map((a) => [a.id, { id: a.id, url: a.url, title: a.title, alt: a.alt, license: a.license }]),
  );

const escapeHtml = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const render = (config, segment) =>
  renderToStaticMarkup(
    createElement(SiteRenderer, { config, images: imagesFor(segment) }),
  );

describe('renderizacao dos templates', () => {
  test('todos os templates renderizam sem erro', () => {
    for (const tpl of TEMPLATES) {
      const config = normalizeConfig(tpl.config, tpl.name);
      const html = render(config, tpl.segment_slug);
      assert.ok(html.length > 3000, `${tpl.slug} gerou HTML muito curto`);
      assert.ok(html.includes('<header'), `${tpl.slug} sem cabecalho`);
      assert.ok(html.includes('</footer>'), `${tpl.slug} sem rodape`);
    }
  });

  /** Texto mais distintivo de uma secao, para provar que ela foi renderizada. */
  function markerFor(section) {
    const p = section.props ?? {};
    if (p.title) return p.title;
    if (Array.isArray(p.items) && p.items[0]) {
      return p.items[0].title || p.items[0].value || p.items[0].name || p.items[0].question || '';
    }
    if (Array.isArray(p.days) && p.days[0]) return p.days[0].label;
    if (Array.isArray(p.members) && p.members[0]) return p.members[0].name;
    if (Array.isArray(p.channels) && p.channels[0]) return p.channels[0];
    return '';
  }

  test('secoes habilitadas aparecem no HTML', () => {
    for (const tpl of TEMPLATES) {
      const config = normalizeConfig(tpl.config, tpl.name);
      const html = render(config, tpl.segment_slug);
      for (const section of config.sections.filter((s) => s.enabled)) {
        const marker = markerFor(section);
        if (!marker) continue;
        assert.ok(
          html.includes(escapeHtml(marker)),
          `${tpl.slug}: secao ${section.type} (marcador "${marker}") nao renderizada`,
        );
      }
    }
  });

  test('secao desativada nao aparece', () => {
    const tpl = TEMPLATES[0];
    const config = normalizeConfig(tpl.config, tpl.name);
    const hero = config.sections.find((s) => s.type === 'hero');
    hero.enabled = false;
    const html = render(config, tpl.segment_slug);
    assert.ok(!html.includes('class="hero"'));
  });

  test('cores e tipografia do tema entram como variaveis CSS', () => {
    for (const tpl of TEMPLATES) {
      const config = normalizeConfig(tpl.config, tpl.name);
      const html = render(config, tpl.segment_slug);
      assert.ok(html.includes(config.theme.primary), `${tpl.slug} sem cor primaria`);
      assert.ok(html.includes(config.theme.accent), `${tpl.slug} sem cor de destaque`);
      assert.ok(html.includes('--font-heading'), `${tpl.slug} sem fonte de titulo`);
    }
  });

  test('catalogo lista os itens e precos formatados', () => {
    const tpl = TEMPLATES.find((t) => t.slug === 'forno-italiano');
    const config = normalizeConfig(tpl.config, tpl.name);
    const html = render(config, tpl.segment_slug);
    for (const item of config.products.items.slice(0, 5)) {
      assert.ok(html.includes(item.name), `item ${item.name} nao renderizado`);
    }
    assert.ok(html.includes('R$'), 'precos nao formatados');
  });

  test('galeria marca imagens ilustrativas', () => {
    const tpl = TEMPLATES.find((t) => t.slug === 'burger-street');
    const config = normalizeConfig(tpl.config, tpl.name);
    const html = render(config, tpl.segment_slug);
    assert.ok(html.toLowerCase().includes('ilustrativ'));
  });

  test('imagem ausente nao quebra o render', () => {
    const tpl = TEMPLATES[0];
    const config = normalizeConfig(tpl.config, tpl.name);
    config.sections.forEach((s) => {
      s.props.imageId = 'nao-existe';
      if (Array.isArray(s.props.imageIds)) s.props.imageIds = ['nao-existe'];
    });
    const html = renderToStaticMarkup(createElement(SiteRenderer, { config, images: {} }));
    assert.ok(html.includes('imagem indisponivel'));
    assert.ok(!html.includes('<img src="undefined"'));
  });

  test('conteudo de cliente aparece no site renderizado', () => {
    const tpl = TEMPLATES.find((t) => t.slug === 'clinica-vitalis');
    const config = normalizeConfig(tpl.config, tpl.name);
    config.identity.name = 'Clinica Bela Vida';
    config.identity.logoText = 'Clinica Bela Vida';
    config.contact.whatsapp = '5534999990000';
    const html = render(config, tpl.segment_slug);
    assert.ok(html.includes('Clinica Bela Vida'));
    assert.ok(html.includes('wa.me/5534999990000'));
  });

  test('HTML de site nao injeta script arbitrario do conteudo', () => {
    const tpl = TEMPLATES[0];
    const config = normalizeConfig(tpl.config, tpl.name);
    const hero = config.sections.find((s) => s.type === 'hero');
    hero.props.title = '<script>alert(1)</script>';
    const html = render(config, tpl.segment_slug);
    assert.ok(!html.includes('<script>alert(1)</script>'), 'script nao escapado');
    assert.ok(html.includes('&lt;script&gt;'));
  });
});
