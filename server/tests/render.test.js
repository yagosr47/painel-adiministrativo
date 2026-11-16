/**
 * Verifica que o motor de renderizacao do site produz HTML util para todos os
 * templates e que nao existem referencias de imagem quebradas.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const tempDir = mkdtempSync(path.join(tmpdir(), 'painel-render-'));
process.env.DATA_DIR = tempDir;
process.env.DB_PATH = path.join(tempDir, 'render.db');

const { seedDatabase } = await import('../seed/seed.js');
const { TEMPLATES, buildLibraryRecords } = await import('../seed/catalog.js');
const { normalizeConfig, collectImageIds, applyPlaceholders } = await import('../lib/config.js');

before(() => {
  seedDatabase({ force: true });
});

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const libraryIds = () => new Set(buildLibraryRecords().map((record) => record.id));

describe('catalogo de templates', () => {
  test('existe ao menos um template por segmento e nenhum slug duplicado', () => {
    const slugs = TEMPLATES.map((t) => t.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'slug de template duplicado');
    const segments = new Set(TEMPLATES.map((t) => t.segment_slug));
    assert.equal(segments.size, 7);
  });

  test('todo template tem secoes, catalogo e tema proprios', () => {
    for (const tpl of TEMPLATES) {
      const config = normalizeConfig(tpl.config, tpl.name);
      assert.ok(config.sections.length >= 6, `${tpl.slug} tem poucas secoes`);
      assert.ok(config.products.items.length >= 3, `${tpl.slug} tem poucos itens`);
      assert.ok(config.products.categories.length >= 2, `${tpl.slug} tem poucas categorias`);
      assert.ok(config.theme.primary.startsWith('#'));
      assert.ok(['geometric', 'serif', 'condensed', 'humanist', 'script'].includes(config.theme.fontHeading));
      const hasHero = config.sections.some((s) => s.type === 'hero');
      assert.ok(hasHero, `${tpl.slug} sem hero`);
    }
  });

  test('todas as imagens referenciadas existem na biblioteca', () => {
    const ids = libraryIds();
    for (const tpl of TEMPLATES) {
      const config = normalizeConfig(tpl.config, tpl.name);
      for (const id of collectImageIds(config)) {
        assert.ok(ids.has(id), `template ${tpl.slug} referencia imagem inexistente ${id}`);
      }
    }
  });

  test('cada template cobre apenas imagens do proprio segmento', () => {
    const records = buildLibraryRecords();
    const byId = new Map(records.map((r) => [r.id, r]));
    for (const tpl of TEMPLATES) {
      const config = normalizeConfig(tpl.config, tpl.name);
      for (const id of collectImageIds(config)) {
        const record = byId.get(id);
        assert.ok(record, `imagem ${id} inexistente`);
        assert.equal(
          record.segment_slug,
          tpl.segment_slug,
          `template ${tpl.slug} (${tpl.segment_slug}) usa imagem ${id} do segmento ${record.segment_slug}`,
        );
      }
    }
  });

  test('imagens sao marcadas como ilustrativas e nunca como foto de banco externo', () => {
    for (const record of buildLibraryRecords()) {
      assert.equal(record.license, 'illustrative');
      assert.ok(record.license_note.toLowerCase().includes('ilustra'));
    }
  });

  test('ids de imagem sao unicos e prefixados por segmento', () => {
    const records = buildLibraryRecords();
    const ids = records.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const record of records) {
      assert.ok(record.id.startsWith(record.segment_slug.slice(0, 4)), `${record.id} nao e prefixado`);
    }
  });
});

describe('normalizacao de configuracao', () => {
  test('normaliza cores invalidas e valores ausentes sem quebrar', () => {
    const config = normalizeConfig(
      { theme: { primary: 'javascript:alert(1)', radius: 999 }, identity: { name: '  ' } },
      'Fallback',
    );
    assert.ok(config.theme.primary.startsWith('#'));
    assert.ok(config.theme.radius <= 40);
    assert.equal(config.identity.name, 'Fallback');
    assert.deepEqual(config.sections, []);
  });

  test('remove secao de tipo desconhecido para tipo seguro', () => {
    const config = normalizeConfig({ sections: [{ id: 'x', type: 'script-tag', props: {} }] }, 'X');
    assert.equal(config.sections[0].type, 'about');
  });

  test('limita quantidade de itens e sanitiza ids de imagem', () => {
    const config = normalizeConfig(
      {
        products: {
          items: Array.from({ length: 400 }, (_, i) => ({
            id: `i${i}`,
            name: 'Item',
            imageId: i === 0 ? '<script>' : null,
          })),
        },
        sections: [{ id: 'hero', type: 'hero', props: { imageId: '../../etc/passwd' } }],
      },
      'X',
    );
    assert.ok(config.products.items.length <= 200);
    assert.equal(config.products.items[0].imageId, null);
    assert.equal(config.sections[0].props.imageId, null);
  });

  test('placeholders sao resolvidos e desconhecidos preservados', () => {
    const config = normalizeConfig(
      { identity: { name: '{{clientName}}' }, footer: { text: '{{clientName}} - {{desconhecido}}' } },
      'X',
    );
    const applied = applyPlaceholders(config, { name: 'Pizzaria Teste', city: 'Uberlandia' });
    assert.equal(applied.identity.name, 'Pizzaria Teste');
    assert.equal(applied.footer.text, 'Pizzaria Teste - {{desconhecido}}');
  });

  test('catalogo de config e deep-clone-safe (JSON puro)', () => {
    for (const tpl of TEMPLATES) {
      const config = normalizeConfig(tpl.config, tpl.name);
      assert.deepEqual(JSON.parse(JSON.stringify(config)), config, `${tpl.slug} tem valor nao serializavel`);
    }
  });
});
