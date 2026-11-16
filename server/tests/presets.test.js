/**
 * Modelos pre-prontos ("pontos de partida") por segmento.
 *
 * O que estes testes protegem:
 *  - todo segmento tem um ponto de partida completo (nada de template vazio);
 *  - o config gerado e aceito pelo normalizador e nao perde secao;
 *  - imagens ilustrativas so entram da biblioteca do proprio segmento;
 *  - criar template com `preset` isola os dados (sem referencia compartilhada).
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const tempDir = mkdtempSync(path.join(tmpdir(), 'painel-presets-'));
process.env.DATA_DIR = tempDir;
process.env.DB_PATH = path.join(tempDir, 'presets.db');

const { seedDatabase } = await import('../seed/seed.js');
const { buildLibraryRecords } = await import('../seed/catalog.js');
const { normalizeConfig, configStatus, collectImageIds } = await import('../lib/config.js');
const { buildPresetConfig, attachPreviewImages, listPresets, PRESET_SEGMENTS } = await import('../lib/presets.js');

before(() => {
  seedDatabase({ force: true });
});

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const library = buildLibraryRecords();
const imagesOf = (segment) => library.filter((record) => record.segment_slug === segment);

describe('pontos de partida por segmento', () => {
  test('os sete segmentos do painel tem modelo pre-pronto', () => {
    const presets = listPresets();
    assert.equal(presets.length, 7);
    assert.deepEqual(
      presets.map((p) => p.segment_slug).sort(),
      [...PRESET_SEGMENTS].sort(),
    );
  });

  test('cada modelo tem secoes suficientes, catalogo e tema proprio', () => {
    for (const segment of PRESET_SEGMENTS) {
      const preset = listPresets().find((p) => p.segment_slug === segment);
      assert.ok(preset.sections_count >= 7, `${segment} tem poucas secoes`);
      assert.ok(preset.products_count >= 3, `${segment} tem poucos itens`);
      assert.ok(preset.categories_count >= 2, `${segment} tem poucas categorias`);
      assert.match(preset.accent, /^#[0-9a-f]{6}$/i, `${segment} sem cor de destaque`);
    }
  });

  test('o config do modelo passa pelo normalizador sem perder conteudo', () => {
    for (const segment of PRESET_SEGMENTS) {
      const raw = buildPresetConfig(segment, 'Modelo de teste');
      assert.ok(raw, `${segment} sem config`);
      const config = normalizeConfig(raw, 'Modelo de teste');

      assert.equal(config.sections.length, raw.sections.length, `${segment} perdeu secao`);
      assert.equal(config.products.items.length, raw.products.items.length, `${segment} perdeu item`);
      assert.equal(config.identity.name, 'Modelo de teste');
      for (const section of config.sections) {
        assert.ok(section.props && typeof section.props === 'object', `${segment}/${section.type} sem props`);
      }
      const stats = configStatus(config);
      assert.equal(stats.sections, raw.sections.length);
    }
  });

  test('segmento sem modelo devolve null em vez de config quebrado', () => {
    assert.equal(buildPresetConfig('segmento-inexistente', 'x'), null);
  });

  test('configs de segmentos diferentes nao sao a mesma referencia', () => {
    const a = buildPresetConfig('restaurantes', 'A');
    const b = buildPresetConfig('restaurantes', 'B');
    a.sections[0].props.title = 'alterado';
    assert.notEqual(b.sections[0].props.title, 'alterado');
  });
});

describe('imagens ilustrativas de previa', () => {
  test('aplica capa, galeria, hero e imagens de itens', () => {
    const segment = 'restaurantes';
    const config = attachPreviewImages(buildPresetConfig(segment, 'Modelo'), imagesOf(segment));

    assert.ok(config.media.coverImageId, 'sem capa');
    assert.ok(config.media.thumbnailImageId, 'sem miniatura');

    const gallery = config.sections.find((section) => section.type === 'gallery');
    assert.ok(gallery.props.imageIds.length >= 6, 'galeria curta');
    const hero = config.sections.find((section) => section.type === 'hero');
    assert.ok(hero.props.imageId, 'hero sem imagem');
    assert.ok(config.products.items.every((item) => item.imageId), 'item sem imagem');
  });

  test('usa somente imagens do proprio segmento', () => {
    for (const segment of PRESET_SEGMENTS) {
      const allowed = new Set(imagesOf(segment).map((record) => record.id));
      const config = attachPreviewImages(buildPresetConfig(segment, 'Modelo'), imagesOf(segment));
      const used = collectImageIds(config);
      assert.ok(used.length > 0, `${segment} nao usou imagem`);
      for (const id of used) {
        assert.ok(allowed.has(id), `${segment} usou imagem de outro segmento: ${id}`);
      }
    }
  });

  test('sem imagens na biblioteca o config continua valido', () => {
    const config = attachPreviewImages(buildPresetConfig('portfolio', 'Modelo'), []);
    assert.equal(config.media.coverImageId, null);
  });

  test('nao muta o config original', () => {
    const original = buildPresetConfig('lojas', 'Modelo');
    const copy = structuredClone(original);
    attachPreviewImages(original, imagesOf('lojas'));
    assert.deepEqual(original, copy);
  });
});
