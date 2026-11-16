/**
 * Garante que a biblioteca de imagens ilustra de verdade o que o titulo diz.
 *
 * Historico: a primeira versao gerava apenas gradiente + anel/ondas, ou seja,
 * um card de pizza e um de carro eram indistinguiveis. Estes testes travam o
 * comportamento: cada titulo precisa cair num assunto conhecido e o SVG
 * precisa conter o desenho daquele assunto, nao apenas o texto.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { buildIllustration, subjectFor } = await import('../lib/imagery.js');
const { buildLibraryRecords } = await import('../seed/catalog.js');

const svgFor = (title, segment, id = 'id-teste') =>
  buildIllustration({ id, title, segment, caption: `${title} - ilustrativa` });

describe('classificacao de assunto', () => {
  test('cada titulo da biblioteca cai em um assunto reconhecido', () => {
    const records = buildLibraryRecords();
    assert.ok(records.length >= 100, 'biblioteca menor que o esperado');
    const semAssunto = records
      .filter((record) => subjectFor(record.title, record.segment_slug) === 'abstract')
      .map((record) => `${record.segment_slug}/${record.title}`);
    assert.deepEqual(semAssunto, [], 'titulos sem assunto definido');
  });

  test('acentos e plurais nao quebram a classificacao', () => {
    assert.equal(subjectFor('Pão francês', 'mercados'), 'bread');
    assert.equal(subjectFor('Pizzas', 'restaurantes'), 'pizza');
    assert.equal(subjectFor('Filtros', 'oficinas'), 'filter');
  });

  test('ambiente generico usa a cena do segmento', () => {
    assert.equal(subjectFor('Vista da oficina', 'oficinas'), 'garage');
    assert.equal(subjectFor('Salao do restaurante', 'restaurantes'), 'bar');
    assert.equal(subjectFor('Interior da barbearia', 'barbearias'), 'barbershop');
    assert.equal(subjectFor('Vitrine da loja', 'lojas'), 'storefront');
  });

  test('regras especificas vencem as genericas', () => {
    assert.equal(subjectFor('Oleo para barba', 'barbearias'), 'bottle');
    assert.equal(subjectFor('Troca de oleo', 'oficinas'), 'oil');
    assert.equal(subjectFor('Navalha e tesoura', 'barbearias'), 'tools');
    assert.equal(subjectFor('Estacao de barba', 'barbearias'), 'haircut');
    assert.equal(subjectFor('Sala de exames', 'clinicas'), 'room');
  });
});

describe('desenho das ilustracoes', () => {
  test('assuntos diferentes produzem desenhos diferentes', () => {
    const pizza = svgFor('Pizza margherita', 'restaurantes');
    const carro = svgFor('Carro no elevador', 'oficinas');
    const corte = svgFor('Corte degradê', 'barbearias');
    assert.notEqual(pizza, carro);
    assert.notEqual(pizza, corte);
    assert.notEqual(carro, corte);
  });

  test('o SVG tem marcas do assunto, nao so o titulo', () => {
    // pizza: queijo/massa; carro: rodas; corte: pele/olhos
    const pizza = svgFor('Pizza de calabresa', 'restaurantes');
    assert.match(pizza, /#c2410c/, 'pizza precisa do molho');
    assert.match(pizza, /#fde68a/, 'pizza precisa do queijo');

    const carro = svgFor('Carro finalizado', 'oficinas');
    assert.match(carro, /circle/, 'carro precisa de rodas');

    const corte = svgFor('Corte social', 'barbearias');
    assert.match(corte, /#111827/, 'corte precisa de olhos/cabelo');
  });

  test('deterministico: mesmo id e titulo geram o mesmo SVG', () => {
    assert.equal(svgFor('Burger classic', 'restaurantes', 'rest-a'), svgFor('Burger classic', 'restaurantes', 'rest-a'));
  });

  test('titulo com caractere especial e escapado', () => {
    const svg = svgFor('Pão & <script>', 'mercados');
    assert.ok(!svg.includes('<script>'), 'SVG nao pode conter tag crua');
    assert.match(svg, /&amp;/);
  });

  test('todo o catalogo gera SVG valido dentro do viewBox', () => {
    for (const record of buildLibraryRecords()) {
      const svg = svgFor(record.title, record.segment_slug, record.id);
      assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `${record.id} sem <svg>`);
      assert.ok(svg.includes('viewBox="0 0 1200 800"'), `${record.id} sem viewBox`);
      assert.ok(svg.length > 1500, `${record.id} parece vazio`);
      assert.ok(svg.length < 60000, `${record.id} grande demais`);
    }
  });
});
