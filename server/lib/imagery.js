/**
 * Gerador de ilustracoes locais.
 *
 * As imagens da biblioteca demonstrativa sao ILUSTRACOES vetoriais geradas
 * pelo proprio sistema, sem marcas, pessoas ou fotos de terceiros. Por isso
 * entram como `license = 'illustrative'` e a interface sempre exibe o selo
 * "Ilustrativa". Nenhum arquivo de banco de imagens externo e baixado: o
 * sistema nunca assume direito de uso.
 *
 * Desenho: cada titulo e traduzido para um "assunto" (pizza, hamburguer,
 * corte de cabelo, carro, vestido, fruta, dente, projeto...). O assunto define
 * o objeto desenhado no centro do card; o titulo so define a variacao de cor.
 * Antes desta versao todos os cards eram apenas gradiente + anel/ondas, o que
 * nao permitia reconhecer nada na biblioteca.
 */

const PALETTES = {
  restaurante: [['#f97316', '#7f1d1d'], ['#f59e0b', '#78350f'], ['#ef4444', '#4c0519'], ['#fbbf24', '#9a3412']],
  barbearia: [['#1f2937', '#0b1220'], ['#b45309', '#451a03'], ['#334155', '#0b1220'], ['#0ea5e9', '#082f49']],
  oficina: [['#1d4ed8', '#0f172a'], ['#0f766e', '#042f2e'], ['#475569', '#111827'], ['#f59e0b', '#1f2937']],
  loja: [['#db2777', '#500724'], ['#a855f7', '#2e1065'], ['#0d9488', '#042f2e'], ['#e11d48', '#4c0519']],
  mercado: [['#16a34a', '#052e16'], ['#65a30d', '#1a2e05'], ['#f59e0b', '#451a03'], ['#0ea5e9', '#082f49']],
  clinica: [['#0ea5e9', '#082f49'], ['#14b8a6', '#042f2e'], ['#6366f1', '#1e1b4b'], ['#38bdf8', '#0c4a6e']],
  portfolio: [['#6366f1', '#1e1b4b'], ['#f43f5e', '#4c0519'], ['#0f172a', '#1e293b'], ['#8b5cf6', '#2e1065']],
  geral: [['#2563eb', '#0f172a'], ['#0ea5e9', '#083344'], ['#64748b', '#111827'], ['#f59e0b', '#7c2d12']],
};

const MOTIFS = ['circles', 'arcs', 'grid', 'waves', 'diagonal', 'blobs', 'rings', 'stripes'];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function sample(seedStr, index, list) {
  return list[(hash(`${seedStr}:${index}`) >>> 3) % list.length];
}

/**
 * Fundo abstrato. Fica sempre atras do objeto e com opacidade baixa para nao
 * competir com ele.
 */
function motifMarkup(kind, seed, w, h) {
  const r = (n) => (hash(`${seed}-m-${n}`) % 1000) / 1000;
  const light = 'rgba(255,255,255,0.10)';
  const lighter = 'rgba(255,255,255,0.06)';
  const dark = 'rgba(0,0,0,0.12)';

  switch (kind) {
    case 'circles': {
      let out = '';
      for (let i = 0; i < 6; i += 1) {
        const cx = Math.round(r(i) * w);
        const cy = Math.round(r(i + 20) * h);
        const rad = Math.round(40 + r(i + 40) * 130);
        out += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${i % 2 ? lighter : light}"/>`;
      }
      return out;
    }
    case 'arcs': {
      let out = '';
      for (let i = 0; i < 4; i += 1) {
        const cx = Math.round(w * (i / 4) + 60);
        out += `<path d="M ${cx} ${h} a ${Math.round(90 + i * 30)} ${Math.round(90 + i * 30)} 0 0 1 ${Math.round(
          180 + i * 60,
        )} 0" fill="${i % 2 ? light : lighter}"/>`;
      }
      return out;
    }
    case 'grid': {
      let out = '';
      const step = 80;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          if (r(x + y) > 0.6) out += `<rect x="${x}" y="${y}" width="${step - 14}" height="${step - 14}" rx="14" fill="${light}"/>`;
        }
      }
      return out;
    }
    case 'waves': {
      let out = '';
      for (let i = 0; i < 3; i += 1) {
        const y = Math.round(h * (0.55 + i * 0.16));
        out += `<path d="M0 ${y} Q ${w * 0.25} ${y - 80} ${w * 0.5} ${y} T ${w} ${y} V ${h} H 0 Z" fill="${
          i % 2 ? lighter : light
        }"/>`;
      }
      return out;
    }
    case 'diagonal': {
      return `<path d="M0 ${h} L ${w * 0.55} 0 L ${w * 0.75} 0 L ${w * 0.2} ${h} Z" fill="${light}"/>
              <path d="M ${w * 0.5} ${h} L ${w} ${h * 0.25} L ${w} ${h} Z" fill="${lighter}"/>`;
    }
    case 'blobs': {
      let out = '';
      for (let i = 0; i < 3; i += 1) {
        const cx = Math.round(r(i) * w);
        const cy = Math.round(r(i + 30) * h);
        out += `<ellipse cx="${cx}" cy="${cy}" rx="${Math.round(150 + r(i + 50) * 160)}" ry="${Math.round(
          100 + r(i + 70) * 120,
        )}" fill="${i % 2 ? light : dark}" transform="rotate(${Math.round(r(i + 90) * 60 - 30)} ${cx} ${cy})"/>`;
      }
      return out;
    }
    case 'rings': {
      let out = '';
      const cx = Math.round(w * (0.75 + r(1) * 0.15));
      const cy = Math.round(h * (0.25 + r(2) * 0.3));
      for (let i = 4; i > 0; i -= 1) {
        out += `<circle cx="${cx}" cy="${cy}" r="${i * 70}" fill="none" stroke="${i % 2 ? light : lighter}" stroke-width="16"/>`;
      }
      return out;
    }
    case 'stripes':
    default: {
      let out = '';
      const gap = 70;
      for (let x = -h; x < w; x += gap) {
        out += `<rect x="${x}" y="0" width="22" height="${h * 2}" fill="${lighter}" transform="rotate(24 ${x} 0)"/>`;
      }
      return out;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Assuntos: o que cada titulo desenha                                 */
/* ------------------------------------------------------------------ */

/**
 * Ordem importa: a primeira regra que casar vence. As regras mais especificas
 * ficam antes das genericas (ex.: "pizza de burrata" antes de "queijo").
 */
const SUBJECT_RULES = [
  // --- comida -------------------------------------------------------
  ['pizza|margherita|calabresa|burrata|quatro queijos|mussarela', 'pizza'],
  ['burger|hamburguer|x-burger|cheeseburger|smash|bacon|cheddar|blend', 'burger'],
  ['batata|fries|onion|acompanhamento', 'fries'],
  ['calzone|esfiha|focaccia|pao|bruschetta|torrada|frances|baguete|broa', 'bread'],
  ['taca|vinho|cerveja|chopp|drink|coquetel|caipirinha', 'drink'],
  ['cafe|cappuccino|expresso|latte', 'coffee'],
  ['suco|limonada|refrigerante|soda|agua|cha gelado', 'juice'],
  ['tiramisu|bolo|brownie|sobremesa|sorvete|pudim|doce|torta', 'dessert'],
  ['tábua|tabua|frios|queijo|antepasto', 'board'],
  ['salada|verdura|legume|vegetariano|veggie', 'salad'],
  ['sushi|temaki|japa', 'sushi'],
  ['prato|entrada|massa|macarrao|lasanha|risoto|frango|carne|peixe', 'plate'],
  // --- barbearia ----------------------------------------------------
  // "oleo para barba"/"pomada" sao produto, nao corte: vem primeiro.
  ['pomada|oleo para barba|shampoo|condicionador|produto|perfume|locao|balsamo|cera|kit de barba', 'bottle'],
  ['tesoura|navalha|maquina de cortar|kit de acabamento|ferramenta|acabamento|pente', 'tools'],
  ['degrad|fade|corte|social|barba|pigmenta|pezinho|cabelo|penteado|escova|coloracao|mecha', 'haircut'],
  ['barbearia|barber|salao de beleza|luminaria|lavatorio', 'barbershop'],
  ['interior|ambiente|salao|vitrine|fachada|espaco|studio|showroom', 'storefront'],
  ['cadeira|estacao|bancada', 'chair'],
  // --- oficina ------------------------------------------------------
  ['carro|veiculo|moto|caminhonete|suv|motor|elevador', 'car'],
  ['pneu|roda|calota', 'wheel'],
  ['troca de oleo|oleo lubrificante|lubrificante|oleo de motor|oleo 5w30|oleo sintetico', 'oil'],
  ['freio|pastilha|disco', 'brake'],
  ['filtro', 'filter'],
  ['correia|embreagem|peca|kit', 'parts'],
  ['alinhamento|diagnostico|revisao|servico|eletronic|suspensao', 'service'],
  // --- loja ---------------------------------------------------------
  ['vestido', 'dress'],
  ['camisa|camiseta|blusa|oversize|jaqueta|casaco|moletom', 'shirt'],
  ['calca|jeans|wide leg|short|bermuda|saia', 'pants'],
  ['tenis|sapato|sandalia|bota|salto|calcado', 'shoe'],
  ['bolsa|mochila|necessaire|mala', 'bag'],
  ['cinto|acessorio|oculos|relogio|bijuteria|colar|brinco', 'accessory'],
  ['vitrine|provador|loja|arara|manequim', 'storefront'],
  // --- mercado ------------------------------------------------------
  ['fruta|hortifruti|banca|legume|verdura|cesta|banana|maca|manga', 'produce'],
  ['padaria|pao|bolo|confeitaria|doce', 'bakery'],
  ['prateleira|mercearia|graos|cafe|oferta|estoque|gondola', 'shelf'],
  ['bebida|gelada|refrigerante|cerveja|agua|suco', 'drinkshelf'],
  ['caixa|atendimento|corredor|mercado', 'market'],
  // --- clinica ------------------------------------------------------
  ['dente|odont|sorriso|implante|clareamento', 'tooth'],
  ['consultorio|sala de exames|recepcao|sala de espera|corredor|escritorio|sala de reuniao', 'room'],
  ['procedimento|exame|estetica|facial|corporal', 'procedure'],
  ['equipe|retrato|profissional|medico|dentista|doutor', 'portrait'],
  // --- portfolio ----------------------------------------------------
  ['projeto|ensaio|estudo de caso|identidade|embalagem|digital|editorial|fotografia|portfolio', 'artwork'],
  ['estudio|mesa de trabalho|atelier|espaco', 'studio'],
];
const SUBJECT_PATTERNS = SUBJECT_RULES.map(([alts, subject]) => [
  new RegExp(`\\b(?:${alts})(?:s|es)?\\b`),
  subject,
]);


/** Remove acentos: "Pão francês" precisa casar com /pao|frances/. */
function deaccent(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Palavras que indicam "ambiente", onde o segmento decide o tipo de cena. */
const ENVIRONMENT = /\b(?:interior|ambiente|salao|espaco|vista|corredor|balcao|provador|fachada|vitrine|caixa|recepcao|sala|estudio|loja)\b/;

const SEGMENT_AMBIENCE = {
  restaurantes: 'bar',
  barbearias: 'barbershop',
  oficinas: 'garage',
  lojas: 'storefront',
  mercados: 'market',
  clinicas: 'room',
  portfolio: 'studio',
};

/**
 * @param {string} title
 * @param {string} [segment] quando informado, ambientes recebem a cena do
 *   segmento (oficina -> garage, restaurante -> bar) em vez de uma vitrine.
 */
function subjectFor(title = '', segment = '') {
  const text = deaccent(String(title)).toLowerCase();

  // Ambiente generico: a cena correta depende do segmento. "Sala de exames" e
  // "sala de reuniao" nao sao ambientes genericos, entao sao tratados antes.
  if (/\b(?:exames|reuniao|espera)\b/.test(text)) {
    for (const [pattern, subject] of SUBJECT_PATTERNS) {
      if (pattern.test(text)) return subject;
    }
  }
  if (segment && ENVIRONMENT.test(text) && SEGMENT_AMBIENCE[segment]) {
    // "balcao e bar" e "provador"/"caixa" tem cena propria
    if (/\bbar\b|balcao/.test(text) && segment === 'restaurantes') return 'bar';
    return SEGMENT_AMBIENCE[segment];
  }

  for (const [pattern, subject] of SUBJECT_PATTERNS) {
    if (pattern.test(text)) return subject;
  }
  return 'abstract';
}

/* ------------------------------------------------------------------ */
/* Desenho dos objetos                                                 */
/* ------------------------------------------------------------------ */

const SKIN = ['#f2c9a0', '#e0aa7b', '#c98b5e', '#8d5a3b', '#5d3a25'];
const HAIR = ['#1f2937', '#3f2a1d', '#6b4423', '#a16207', '#d6c3a1', '#111827'];

const cx = (w) => w / 2;
const base = (h) => h - 110; // linha de apoio: deixa espaco para a legenda

/** Cilindro/molde de pe em coordenadas cartesianas. */
function disc(cx0, cy0, rx, ry, fill, stroke = 'rgba(0,0,0,0.18)', sw = 3) {
  return `<ellipse cx="${cx0}" cy="${cy0}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

/**
 * Pizzas: massa, molho, queijos e coberturas distribuidas em angulos fixos
 * (deterministicos pelo seed) para a imagem ficar sempre igual.
 */
function drawPizza(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) - 40;
  const R = 250;
  const r = (n) => (hash(`${seed}-pz-${n}`) % 1000) / 1000;
  const crust = variant % 2 ? '#e0a44b' : '#d99540';
  let out = '';
  // sombra no plano
  out += `<ellipse cx="${c}" cy="${y + R * 0.42}" rx="${R * 1.02}" ry="${R * 0.24}" fill="rgba(0,0,0,0.28)"/>`;
  // massa
  out += disc(c, y, R, R * 0.86, crust, 'rgba(120,63,15,0.55)', 4);
  // molho
  out += disc(c, y - 4, R * 0.86, R * 0.72, '#c2410c', 'none', 0);
  // queijo derretido
  out += disc(c, y - 8, R * 0.8, R * 0.66, '#fde68a', 'none', 0);
  out += disc(c, y - 10, R * 0.62, R * 0.5, '#fef3c7', 'none', 0);
  // fatias marcadas
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    out += `<line x1="${c}" y1="${y - 8}" x2="${c + Math.cos(a) * R * 0.78}" y2="${
      y - 8 + Math.sin(a) * R * 0.64
    }" stroke="rgba(180,83,9,0.35)" stroke-width="4"/>`;
  }
  // coberturas
  const toppings = [
    ['#dc2626', 26], // tomate
    ['#166534', 20], // manjericao
    ['#fca5a5', 18], // presunto
    ['#78350f', 14], // calabresa
  ];
  const count = 9;
  for (let i = 0; i < count; i += 1) {
    const a = r(i * 3) * Math.PI * 2;
    const dist = r(i * 3 + 1) * R * 0.6;
    const px = c + Math.cos(a) * dist;
    const py = y - 8 + Math.sin(a) * dist * 0.8;
    const [color, size] = toppings[Math.floor(r(i * 3 + 2) * toppings.length)];
    if (size > 22) {
      out += `<circle cx="${px}" cy="${py}" r="${size * 0.9}" fill="${color}" opacity="0.92"/>`;
      out += `<circle cx="${px - 4}" cy="${py - 4}" r="${size * 0.35}" fill="rgba(255,255,255,0.22)"/>`;
    } else {
      out += `<ellipse cx="${px}" cy="${py}" rx="${size}" ry="${size * 0.62}" transform="rotate(${Math.round(
        r(i) * 180,
      )} ${px} ${py})" fill="${color}" opacity="0.9"/>`;
    }
  }
  // burrata / queijo fresco no centro
  if (/burrata|mussarela|quatro queijos/i.test(seed) || variant % 3 === 2) {
    out += disc(c, y - 10, 58, 44, '#fffbeb', 'rgba(0,0,0,0.12)', 2);
    out += disc(c - 12, y - 18, 18, 12, 'rgba(255,255,255,0.9)', 'none', 0);
  }
  return out;
}

function drawBurger(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-bg-${n}`) % 1000) / 1000;
  const bw = 220;
  const isDouble = /double|bacon|duplo/i.test(seed) || variant % 2 === 1;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 18}" rx="${bw * 1.2}" ry="26" fill="rgba(0,0,0,0.3)"/>`;
  // pao de cima (domo)
  out += `<path d="M ${c - bw} ${y - 104} a ${bw} ${bw * 0.7} 0 0 1 ${bw * 2} 0 Z" fill="#c97b2e"/>`;
  out += `<path d="M ${c - bw * 0.94} ${y - 110} a ${bw * 0.94} ${bw * 0.62} 0 0 1 ${bw * 1.88} 0 Z" fill="#e0a04a"/>`;
  // gergelim
  for (let i = 0; i < 10; i += 1) {
    const a = Math.PI + (i / 9) * Math.PI;
    const dist = (0.25 + r(i) * 0.55) * bw;
    const sx = c + Math.cos(a) * dist;
    const sy = y - 112 + Math.sin(a) * dist * 0.55;
    out += `<ellipse cx="${sx}" cy="${sy}" rx="10" ry="5" fill="#fde68a" transform="rotate(${Math.round(r(i) * 120 - 60)} ${sx} ${sy})"/>`;
  }
  // alface: onda unica, contida dentro da largura do pao
  let lettuce = `M ${c - bw * 0.92} ${y - 100}`;
  const waves = 6;
  for (let i = 0; i < waves; i += 1) {
    const x0 = c - bw * 0.92 + (i * (bw * 1.84)) / waves;
    const x1 = x0 + (bw * 1.84) / waves;
    lettuce += ` q ${(x1 - x0) / 2} ${i % 2 ? 26 : -22} ${x1 - x0} 0`;
  }
  lettuce += ` l 0 26`;
  for (let i = waves - 1; i >= 0; i -= 1) {
    const x0 = c - bw * 0.92 + (i * (bw * 1.84)) / waves;
    const x1 = x0 - (bw * 1.84) / waves;
    lettuce += ` q ${(x1 - x0) / 2} ${i % 2 ? -20 : 22} ${x1 - x0} 0`;
  }
  out += `<path d="${lettuce} Z" fill="#4d9a3a"/>`;
  // queijo escorrendo pelas bordas
  out += `<path d="M ${c - bw * 0.9} ${y - 78} l ${bw * 0.34} 0 l 22 30 l 26 -30 l ${bw * 0.3} 0 l 24 26 l 22 -26 l ${bw * 0.32} 0 l -${bw * 0.04} 24 l -${bw * 1.76} 0 Z" fill="#fbbf24"/>`;
  if (isDouble) {
    // dois hamburgueres com bacon no meio
    out += `<rect x="${c - bw * 0.88}" y="${y - 78}" width="${bw * 1.76}" height="34" rx="17" fill="#6b3410"/>`;
    out += `<path d="M ${c - bw * 0.86} ${y - 44} q ${bw * 0.28} 16 ${bw * 0.56} 0 q ${bw * 0.28} -16 ${bw * 0.56} 0 q ${bw * 0.28} 16 ${bw * 0.56} 0 l 0 16 l -${bw * 1.68} 0 Z" fill="#b91c1c"/>`;
    out += `<rect x="${c - bw * 0.86}" y="${y - 30}" width="${bw * 1.72}" height="30" rx="15" fill="#5b2b0e"/>`;
  } else {
    out += `<rect x="${c - bw * 0.88}" y="${y - 74}" width="${bw * 1.76}" height="42" rx="21" fill="#6b3410"/>`;
    out += `<rect x="${c - bw * 0.84}" y="${y - 68}" width="${bw * 1.68}" height="14" rx="7" fill="#8a4a1d" opacity="0.85"/>`;
  }
  // tomate
  out += `<rect x="${c - bw * 0.82}" y="${y - 24}" width="${bw * 1.64}" height="16" rx="8" fill="#dc2626"/>`;
  // pao de baixo
  out += `<path d="M ${c - bw * 0.96} ${y - 6} q ${bw * 0.96} 34 ${bw * 1.92} 0 l 0 -10 q -${bw * 0.96} 22 -${bw * 1.92} 0 Z" fill="#c97b2e"/>`;
  return out;
}

function drawDrink(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) - 20;
  const r = (n) => (hash(`${seed}-dr-${n}`) % 1000) / 1000;
  const glassH = 230;
  const topW = 96;
  const botW = 70;
  const colors = [
    ['#fde68a', '#f59e0b'], // limonada
    ['#fbbf24', '#b45309'], // cerveja
    ['#dc2626', '#7f1d1d'], // drink vermelho
    ['#4ade80', '#15803d'], // soda verde
  ];
  const [liquid, liquidDark] = colors[variant % colors.length];
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 8}" rx="120" ry="20" fill="rgba(0,0,0,0.28)"/>`;
  // corpo do copo
  out += `<path d="M ${c - topW} ${y - glassH} L ${c + topW} ${y - glassH} L ${c + botW} ${y} L ${c - botW} ${y} Z" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.5)" stroke-width="4"/>`;
  // liquido
  out += `<path d="M ${c - topW + 12} ${y - glassH + 46} L ${c + topW - 12} ${y - glassH + 46} L ${c + botW - 8} ${y - 8} L ${c - botW + 8} ${y - 8} Z" fill="${liquid}" opacity="0.95"/>`;
  out += `<path d="M ${c - topW + 12} ${y - glassH + 46} L ${c + topW - 12} ${y - glassH + 46} L ${c + topW - 16} ${y - glassH + 92} L ${c - topW + 16} ${y - glassH + 92} Z" fill="${liquidDark}" opacity="0.55"/>`;
  // gelo
  for (let i = 0; i < 4; i += 1) {
    const gx = c - 46 + r(i) * 92;
    const gy = y - glassH + 70 + r(i + 5) * 110;
    out += `<rect x="${gx}" y="${gy}" width="34" height="30" rx="8" fill="rgba(255,255,255,0.55)" transform="rotate(${Math.round(
      r(i) * 40 - 20,
    )} ${gx} ${gy})"/>`;
  }
  // bolhas
  for (let i = 0; i < 8; i += 1) {
    out += `<circle cx="${c - 60 + r(i) * 120}" cy="${y - 40 - r(i + 3) * 150}" r="${3 + r(i) * 5}" fill="rgba(255,255,255,0.5)"/>`;
  }
  // canudo + rodela de limao
  out += `<rect x="${c + 20}" y="${y - glassH - 40}" width="13" height="${glassH * 0.7}" rx="6" fill="#f43f5e" transform="rotate(12 ${c + 26} ${y - glassH})"/>`;
  out += `<circle cx="${c - topW + 2}" cy="${y - glassH + 18}" r="40" fill="#fde047" stroke="#a16207" stroke-width="3"/>`;
  out += `<circle cx="${c - topW + 2}" cy="${y - glassH + 18}" r="30" fill="#fef9c3"/>`;
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    out += `<line x1="${c - topW + 2}" y1="${y - glassH + 18}" x2="${c - topW + 2 + Math.cos(a) * 30}" y2="${
      y - glassH + 18 + Math.sin(a) * 30
    }" stroke="#facc15" stroke-width="3"/>`;
  }
  return out;
}

function drawCoffee(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="150" ry="24" fill="rgba(0,0,0,0.28)"/>`;
  // pires
  out += disc(c, y, 150, 30, '#e5e7eb', 'rgba(0,0,0,0.15)', 3);
  // xicara
  out += `<path d="M ${c - 104} ${y - 110} L ${c + 104} ${y - 110} L ${c + 82} ${y - 6} Q ${c} ${y + 44} ${c - 82} ${y - 6} Z" fill="#f8fafc" stroke="rgba(0,0,0,0.14)" stroke-width="3"/>`;
  // alca
  out += `<path d="M ${c + 100} ${y - 92} q 66 6 60 44 q -6 34 -62 26" fill="none" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round"/>`;
  // cafe
  out += `<ellipse cx="${c}" cy="${y - 106}" rx="98" ry="20" fill="#4b2e1b"/>`;
  out += `<ellipse cx="${c}" cy="${y - 108}" rx="72" ry="13" fill="#7c4a28"/>`;
  // crema/latte art
  out += `<path d="M ${c} ${y - 118} q 26 12 0 22 q -26 -10 0 -22 Z" fill="#f7e6d0" opacity="0.9"/>`;
  // vapor
  for (let i = 0; i < 3; i += 1) {
    out += `<path d="M ${c - 40 + i * 40} ${y - 150} q 18 -34 0 -62 q -16 -26 4 -50" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="6" stroke-linecap="round"/>`;
  }
  // graos ao lado
  for (let i = 0; i < 3; i += 1) {
    const gx = c + 150 + i * 26;
    const gy = y - 24 - i * 12;
    out += `<ellipse cx="${gx}" cy="${gy}" rx="16" ry="11" fill="#4b2e1b" transform="rotate(${i * 40} ${gx} ${gy})"/>`;
    out += `<path d="M ${gx - 12} ${gy} q 12 -8 24 0" fill="none" stroke="#8a5a33" stroke-width="3"/>`;
  }
  return out;
}

function drawDessert(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-ds-${n}`) % 1000) / 1000;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 4}" rx="160" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  out += disc(c, y, 158, 30, '#f8fafc', 'rgba(0,0,0,0.12)', 3);
  if (/sorvete|brownie/i.test(seed) || variant % 2 === 0) {
    // brownie
    out += `<path d="M ${c - 118} ${y - 24} L ${c - 96} ${y - 106} L ${c + 96} ${y - 106} L ${c + 118} ${y - 24} Z" fill="#3f220f"/>`;
    out += `<path d="M ${c - 108} ${y - 46} L ${c - 92} ${y - 100} L ${c + 30} ${y - 100} L ${c + 20} ${y - 46} Z" fill="#5b3116"/>`;
    // bolas de sorvete
    out += disc(c + 10, y - 148, 62, 56, '#fef3c7', 'rgba(0,0,0,0.1)', 2);
    out += disc(c - 52, y - 128, 44, 40, '#fde68a', 'rgba(0,0,0,0.1)', 2);
    out += disc(c + 10, y - 148, 26, 22, '#fff7ed', 'none', 0);
    // calda
    out += `<path d="M ${c + 10} ${y - 200} q -16 40 6 56 q 12 -20 6 -56 Z" fill="#7c2d12" opacity="0.9"/>`;
    // folha de hortela
    out += `<ellipse cx="${c + 44}" cy="${y - 190}" rx="22" ry="12" fill="#15803d" transform="rotate(-24 ${c + 44} ${y - 190})"/>`;
  } else {
    // fatia de bolo
    out += `<path d="M ${c - 110} ${y - 30} L ${c - 70} ${y - 190} L ${c + 90} ${y - 190} L ${c + 110} ${y - 30} Z" fill="#fde68a"/>`;
    out += `<rect x="${c - 96}" y="${y - 140}" width="180" height="26" fill="#7c2d12" opacity="0.85"/>`;
    out += `<rect x="${c - 104}" y="${y - 84}" width="196" height="24" fill="#7c2d12" opacity="0.8"/>`;
    out += `<path d="M ${c - 70} ${y - 190} L ${c + 90} ${y - 190} L ${c + 96} ${y - 176} L ${c - 66} ${y - 176} Z" fill="#fffbeb"/>`;
    // morango
    out += `<path d="M ${c + 46} ${y - 208} q 20 22 0 34 q -20 -12 0 -34 Z" fill="#dc2626"/>`;
    out += `<circle cx="${c + 46}" cy="${y - 202}" r="4" fill="#fde68a"/>`;
    for (let i = 0; i < 5; i += 1) {
      out += `<circle cx="${c - 70 + r(i) * 140}" cy="${y - 20 + r(i + 4) * 8}" r="5" fill="rgba(120,53,15,0.5)"/>`;
    }
  }
  return out;
}

function drawHaircut(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) - 10;
  const r = (n) => (hash(`${seed}-hc-${n}`) % 1000) / 1000;
  const skin = SKIN[Math.floor(r(1) * SKIN.length)];
  const hair = HAIR[Math.floor(r(2) * HAIR.length)];
  const isBeard = /barba|navalha|pigmenta/i.test(seed);
  let out = '';
  // ombros
  out += `<path d="M ${c - 210} ${y + 30} q 60 -96 210 -96 q 150 0 210 96 Z" fill="#1f2937"/>`;
  out += `<path d="M ${c - 70} ${y - 56} q 70 -30 140 0 l 0 40 l -140 0 Z" fill="#111827"/>`;
  // pescoco
  out += `<rect x="${c - 44}" y="${y - 96}" width="88" height="70" rx="26" fill="${skin}"/>`;
  // orelhas
  out += disc(c - 116, y - 206, 22, 32, skin, 'rgba(0,0,0,0.12)', 2);
  out += disc(c + 116, y - 206, 22, 32, skin, 'rgba(0,0,0,0.12)', 2);
  // cabeca
  out += `<path d="M ${c - 112} ${y - 250} q 0 -104 112 -104 q 112 0 112 104 q 0 96 -112 112 q -112 -16 -112 -112 Z" fill="${skin}" stroke="rgba(0,0,0,0.12)" stroke-width="3"/>`;
  // cabelo: topo + laterais com fade
  if (/degrad|fade|pezinho|social/i.test(seed) || variant % 2 === 0) {
    out += `<path d="M ${c - 116} ${y - 262} q 10 -104 116 -104 q 106 0 116 104 q -34 -44 -116 -44 q -82 0 -116 44 Z" fill="${hair}"/>`;
    out += `<path d="M ${c - 116} ${y - 258} q 10 -60 40 -76 q -12 46 -14 76 Z" fill="${hair}" opacity="0.92"/>`;
    out += `<path d="M ${c + 116} ${y - 258} q -10 -60 -40 -76 q 12 46 14 76 Z" fill="${hair}" opacity="0.92"/>`;
  } else {
    out += `<path d="M ${c - 124} ${y - 244} q 4 -128 124 -128 q 120 0 124 128 q -30 -70 -124 -70 q -94 0 -124 70 Z" fill="${hair}"/>`;
  }
  // barba
  if (isBeard) {
    out += `<path d="M ${c - 112} ${y - 200} q 8 116 112 128 q 104 -12 112 -128 q -24 76 -112 84 q -88 -8 -112 -84 Z" fill="${hair}"/>`;
    out += `<path d="M ${c - 60} ${y - 178} q 60 -18 120 0 q -60 20 -120 0 Z" fill="${hair}" opacity="0.9"/>`;
  }
  // olhos e sobrancelhas
  out += `<ellipse cx="${c - 46}" cy="${y - 214}" rx="16" ry="10" fill="#fff"/>`;
  out += `<ellipse cx="${c + 46}" cy="${y - 214}" rx="16" ry="10" fill="#fff"/>`;
  out += `<circle cx="${c - 44}" cy="${y - 214}" r="7" fill="#111827"/>`;
  out += `<circle cx="${c + 48}" cy="${y - 214}" r="7" fill="#111827"/>`;
  out += `<path d="M ${c - 66} ${y - 238} q 20 -10 40 -2" fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/>`;
  out += `<path d="M ${c + 26} ${y - 240} q 20 -8 40 2" fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/>`;
  // nariz e boca
  out += `<path d="M ${c} ${y - 206} l 0 26 q 10 6 16 -2" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="5" stroke-linecap="round"/>`;
  out += `<path d="M ${c - 26} ${y - 158} q 26 16 52 0" fill="none" stroke="#9f1239" stroke-width="6" stroke-linecap="round"/>`;
  return out;
}

function drawBottle(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const colors = [['#b45309', '#78350f'], ['#0f766e', '#134e4a'], ['#1d4ed8', '#1e3a8a'], ['#7c3aed', '#4c1d95']];
  const [top, bottom] = colors[variant % colors.length];
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 4}" rx="120" ry="22" fill="rgba(0,0,0,0.28)"/>`;
  // frasco
  out += `<path d="M ${c - 62} ${y - 40} L ${c - 62} ${y - 176} q 0 -26 22 -34 l 0 -34 l 80 0 l 0 34 q 22 8 22 34 L ${c + 62} ${y - 40} q 0 34 -62 34 q -62 0 -62 -34 Z" fill="${bottom}"/>`;
  out += `<path d="M ${c - 50} ${y - 52} L ${c - 50} ${y - 178} q 0 -20 16 -26 l 0 -26 l 68 0 l 0 26 q 16 6 16 26 L ${c + 50} ${y - 52} q 0 26 -50 26 q -50 0 -50 -26 Z" fill="${top}"/>`;
  // tampa
  out += `<rect x="${c - 42}" y="${y - 264}" width="84" height="30" rx="8" fill="#111827"/>`;
  // rotulo
  out += `<rect x="${c - 52}" y="${y - 150}" width="104" height="86" rx="10" fill="rgba(255,255,255,0.94)"/>`;
  out += `<rect x="${c - 40}" y="${y - 136}" width="80" height="10" rx="5" fill="${bottom}" opacity="0.85"/>`;
  out += `<rect x="${c - 40}" y="${y - 116}" width="56" height="7" rx="3.5" fill="rgba(17,24,39,0.35)"/>`;
  out += `<rect x="${c - 40}" y="${y - 102}" width="66" height="7" rx="3.5" fill="rgba(17,24,39,0.22)"/>`;
  // brilho
  out += `<rect x="${c - 40}" y="${y - 244}" width="10" height="180" rx="5" fill="rgba(255,255,255,0.35)"/>`;
  // pincel/navalha ao lado (kit)
  if (/kit|navalha|tesoura|acabamento/i.test(seed)) {
    out += `<rect x="${c + 96}" y="${y - 150}" width="18" height="150" rx="9" fill="#94a3b8"/>`;
    out += `<path d="M ${c + 96} ${y - 150} l 18 -54 l 18 54 Z" fill="#e2e8f0"/>`;
  }
  return out;
}

function drawTools(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const isScissors = /tesoura|scissors/i.test(seed) || variant % 2 === 0;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="200" ry="24" fill="rgba(0,0,0,0.3)"/>`;
  if (isScissors) {
    // tesoura aberta: duas laminas saindo de um pivo
    const pvx = c;
    const pvy = y - 130;
    out += `<path d="M ${pvx} ${pvy} l -140 210" stroke="#e2e8f0" stroke-width="26" stroke-linecap="round"/>`;
    out += `<path d="M ${pvx} ${pvy} l 140 210" stroke="#cbd5e1" stroke-width="26" stroke-linecap="round"/>`;
    out += `<path d="M ${pvx - 12} ${pvy - 10} l -96 150" stroke="rgba(255,255,255,0.6)" stroke-width="8" stroke-linecap="round"/>`;
    // cabos
    out += `<circle cx="${pvx - 148}" cy="${y + 88}" r="40" fill="none" stroke="#111827" stroke-width="20"/>`;
    out += `<circle cx="${pvx + 148}" cy="${y + 88}" r="40" fill="none" stroke="#1f2937" stroke-width="20"/>`;
    // pivo
    out += `<circle cx="${pvx}" cy="${pvy}" r="18" fill="#f59e0b"/>`;
    out += `<circle cx="${pvx}" cy="${pvy}" r="7" fill="#78350f"/>`;
  } else {
    // navalha / maquina
    out += `<rect x="${c - 180}" y="${y - 190}" width="230" height="52" rx="16" fill="#0f172a"/>`;
    out += `<rect x="${c - 168}" y="${y - 180}" width="200" height="14" rx="7" fill="rgba(255,255,255,0.18)"/>`;
    out += `<path d="M ${c + 46} ${y - 186} q 118 -10 150 34 l -24 44 q -56 -40 -128 -28 Z" fill="#e2e8f0"/>`;
    out += `<path d="M ${c + 60} ${y - 172} q 90 0 126 34" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="5"/>`;
    out += `<circle cx="${c - 120}" cy="${y - 200}" r="16" fill="#f59e0b"/>`;
  }
  // pente
  out += `<rect x="${c - 150}" y="${y - 26}" width="300" height="24" rx="8" fill="#f59e0b"/>`;
  out += `<rect x="${c - 150}" y="${y - 26}" width="300" height="10" rx="5" fill="#fbbf24"/>`;
  for (let i = 0; i < 20; i += 1) {
    out += `<rect x="${c - 144 + i * 15}" y="${y - 2}" width="7" height="30" rx="3" fill="#d97706"/>`;
  }
  return out;
}

function drawChair(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const accent = ['#b91c1c', '#1d4ed8', '#0f766e'][variant % 3];
  const dark = ['#7f1d1d', '#1e3a8a', '#134e4a'][variant % 3];
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 10}" rx="190" ry="26" fill="rgba(0,0,0,0.3)"/>`;
  // pe/base em estrela
  out += `<path d="M ${c - 26} ${y - 150} l 52 0 l 8 60 l -68 0 Z" fill="#475569"/>`;
  out += `<path d="M ${c} ${y - 92} l -120 82 q -8 12 4 18 l 92 -60 Z" fill="#334155"/>`;
  out += `<path d="M ${c} ${y - 92} l 120 82 q 8 12 -4 18 l -92 -60 Z" fill="#334155"/>`;
  out += `<path d="M ${c - 20} ${y - 60} l 0 52 l 40 0 l 0 -52 Z" fill="#475569"/>`;
  out += `<path d="M ${c - 96} ${y - 10} l 192 0" stroke="#334155" stroke-width="16" stroke-linecap="round"/>`;
  // assento
  out += `<path d="M ${c - 132} ${y - 214} q 132 -30 264 0 l 0 46 q -132 32 -264 0 Z" fill="${dark}"/>`;
  out += `<path d="M ${c - 132} ${y - 214} q 132 -30 264 0 l 0 14 q -132 28 -264 0 Z" fill="${accent}"/>`;
  // encosto
  out += `<path d="M ${c - 124} ${y - 220} q -6 -150 124 -150 q 130 0 124 150 q -124 -34 -248 0 Z" fill="${dark}"/>`;
  out += `<path d="M ${c - 110} ${y - 226} q -4 -124 110 -124 q 114 0 110 124 q -110 -30 -220 0 Z" fill="${accent}"/>`;
  // capitone
  for (let i = 0; i < 6; i += 1) {
    const bx = c - 72 + (i % 3) * 72;
    const by = y - 300 + Math.floor(i / 3) * 50;
    out += `<circle cx="${bx}" cy="${by}" r="7" fill="${dark}"/>`;
  }
  // bracos
  out += `<path d="M ${c - 124} ${y - 218} q -66 16 -50 84" fill="none" stroke="#1f2937" stroke-width="20" stroke-linecap="round"/>`;
  out += `<path d="M ${c + 124} ${y - 218} q 66 16 50 84" fill="none" stroke="#1f2937" stroke-width="20" stroke-linecap="round"/>`;
  out += `<path d="M ${c - 184} ${y - 132} l 44 0" stroke="#0f172a" stroke-width="18" stroke-linecap="round"/>`;
  out += `<path d="M ${c + 140} ${y - 132} l 44 0" stroke="#0f172a" stroke-width="18" stroke-linecap="round"/>`;
  return out;
}

function drawCar(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const colors = [['#dc2626', '#7f1d1d'], ['#1d4ed8', '#1e3a8a'], ['#0f172a', '#020617'], ['#e5e7eb', '#94a3b8'], ['#0f766e', '#134e4a']];
  const [body, dark] = colors[Math.floor((hash(seed) % 1000) / 1000 * colors.length)];
  const isSuv = /suv|caminhonete|picape/i.test(seed) || variant % 3 === 0;
  const height = isSuv ? 96 : 76;
  let out = '';
  // sombra / chao
  out += `<ellipse cx="${c}" cy="${y + 24}" rx="330" ry="34" fill="rgba(0,0,0,0.32)"/>`;
  out += `<rect x="${c - 430}" y="${y + 10}" width="860" height="12" rx="6" fill="rgba(255,255,255,0.10)"/>`;
  // carroceria
  out += `<path d="M ${c - 330} ${y - 40} q 10 -${height} 90 -${height + 6} l 60 0 q 40 -${isSuv ? 92 : 74} 90 -${isSuv ? 92 : 74} l 110 0 q 56 0 90 ${isSuv ? 92 : 74} l 60 0 q 80 6 90 ${height + 6} l 0 46 q 0 18 -20 18 l -660 0 q -20 0 -20 -18 Z" fill="${body}"/>`;
  // vidros
  out += `<path d="M ${c - 168} ${y - 48} l 40 -${isSuv ? 60 : 48} q 20 -18 52 -18 l 40 0 l 0 ${isSuv ? 78 : 66} Z" fill="#93c5fd" opacity="0.85"/>`;
  out += `<path d="M ${c - 24} ${y - 48} l 0 -${isSuv ? 78 : 66} l 60 0 q 34 0 54 20 l 38 ${isSuv ? 58 : 46} Z" fill="#bfdbfe" opacity="0.85"/>`;
  // faixa lateral
  out += `<rect x="${c - 320}" y="${y - 58}" width="660" height="14" rx="7" fill="${dark}" opacity="0.55"/>`;
  // farol e lanterna
  out += `<path d="M ${c - 322} ${y - 62} q -16 8 -14 26 q 22 -6 34 -18 Z" fill="#fef08a"/>`;
  out += `<rect x="${c + 300}" y="${y - 62}" width="30" height="22" rx="7" fill="#fca5a5"/>`;
  // rodas
  for (const wx of [c - 210, c + 200]) {
    out += `<circle cx="${wx}" cy="${y + 12}" r="66" fill="#111827"/>`;
    out += `<circle cx="${wx}" cy="${y + 12}" r="40" fill="#cbd5e1"/>`;
    out += `<circle cx="${wx}" cy="${y + 12}" r="18" fill="#94a3b8"/>`;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      out += `<circle cx="${wx + Math.cos(a) * 28}" cy="${y + 12 + Math.sin(a) * 28}" r="6" fill="#64748b"/>`;
    }
  }
  // reflexo
  out += `<path d="M ${c - 300} ${y - 92} q 60 -18 120 -6" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="8" stroke-linecap="round"/>`;
  return out;
}

function drawWheel(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) - 30;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 30}" rx="230" ry="40" fill="rgba(0,0,0,0.3)"/>`;
  out += `<circle cx="${c}" cy="${y - 60}" r="200" fill="#111827"/>`;
  out += `<circle cx="${c}" cy="${y - 60}" r="182" fill="#1f2937"/>`;
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    out += `<line x1="${c + Math.cos(a) * 150}" y1="${y - 60 + Math.sin(a) * 150}" x2="${c + Math.cos(a) * 176}" y2="${
      y - 60 + Math.sin(a) * 176
    }" stroke="#374151" stroke-width="9"/>`;
  }
  out += `<circle cx="${c}" cy="${y - 60}" r="112" fill="#e2e8f0"/>`;
  out += `<circle cx="${c}" cy="${y - 60}" r="96" fill="#cbd5e1"/>`;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    out += `<path d="M ${c} ${y - 60} L ${c + Math.cos(a - 0.2) * 92} ${y - 60 + Math.sin(a - 0.2) * 92} L ${
      c + Math.cos(a + 0.2) * 92
    } ${y - 60 + Math.sin(a + 0.2) * 92} Z" fill="#94a3b8"/>`;
  }
  out += `<circle cx="${c}" cy="${y - 60}" r="30" fill="#64748b"/>`;
  out += `<circle cx="${c}" cy="${y - 60}" r="12" fill="#334155"/>`;
  return out;
}

function drawParts(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const shapes = variant % 3;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 4}" rx="170" ry="24" fill="rgba(0,0,0,0.28)"/>`;
  if (shapes === 0) {
    // discos / pastilhas empilhados
    for (let i = 0; i < 3; i += 1) {
      out += disc(c - 60 + i * 24, y - 30 - i * 44, 150, 34, i % 2 ? '#94a3b8' : '#cbd5e1', '#475569', 4);
      out += disc(c - 60 + i * 24, y - 34 - i * 44, 78, 16, '#334155', 'none', 0);
    }
  } else if (shapes === 1) {
    // filtro / correia
    out += `<rect x="${c - 170}" y="${y - 150}" width="340" height="130" rx="24" fill="#e2e8f0"/>`;
    for (let i = 0; i < 12; i += 1) {
      out += `<rect x="${c - 156 + i * 26}" y="${y - 140}" width="12" height="110" rx="6" fill="#94a3b8"/>`;
    }
    out += `<rect x="${c - 190}" y="${y - 30}" width="380" height="22" rx="11" fill="#1f2937"/>`;
  } else {
    // kit de pecas
    out += `<path d="M ${c - 160} ${y - 40} L ${c - 100} ${y - 190} L ${c + 60} ${y - 190} L ${c + 140} ${y - 40} Z" fill="#0f172a"/>`;
    for (let i = 0; i < 4; i += 1) {
      out += `<circle cx="${c - 90 + i * 56}" cy="${y - 160 + (i % 2) * 40}" r="24" fill="#94a3b8"/>`;
      out += `<circle cx="${c - 90 + i * 56}" cy="${y - 160 + (i % 2) * 40}" r="10" fill="#1f2937"/>`;
    }
  }
  return out;
}

function drawService(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  // elevador / plataforma
  out += `<rect x="${c - 300}" y="${y + 4}" width="600" height="16" rx="8" fill="rgba(0,0,0,0.35)"/>`;
  out += `<rect x="${c - 210}" y="${y - 90}" width="26" height="100" fill="#475569"/>`;
  out += `<rect x="${c + 184}" y="${y - 90}" width="26" height="100" fill="#475569"/>`;
  // carro simplificado por cima
  out += `<path d="M ${c - 250} ${y - 96} q 8 -70 70 -74 l 50 0 q 26 -52 66 -52 l 80 0 q 46 0 68 54 l 40 0 q 60 4 66 72 Z" fill="#1d4ed8"/>`;
  out += `<path d="M ${c - 120} ${y - 168} l 26 -38 q 12 -12 34 -12 l 30 0 l 0 50 Z" fill="#bfdbfe" opacity="0.9"/>`;
  out += `<path d="M ${c - 10} ${y - 168} l 0 -50 l 34 0 q 26 0 40 14 l 26 36 Z" fill="#bfdbfe" opacity="0.9"/>`;
  // ferramentas apoiadas
  out += `<path d="M ${c + 190} ${y - 240} l 60 60" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>`;
  out += `<circle cx="${c + 196}" cy="${y - 248}" r="24" fill="none" stroke="#cbd5e1" stroke-width="14"/>`;
  if (/diagnostico|eletronic/i.test(seed)) {
    out += `<rect x="${c - 340}" y="${y - 300}" width="150" height="180" rx="16" fill="#0f172a" stroke="#38bdf8" stroke-width="4"/>`;
    out += `<path d="M ${c - 320} ${y - 200} l 20 -40 l 22 70 l 20 -56 l 20 40 l 22 -30" fill="none" stroke="#4ade80" stroke-width="5"/>`;
  }
  if (/oleo|lubrific/i.test(seed)) {
    out += `<path d="M ${c - 300} ${y - 120} q 0 -40 40 -48 l 0 -40 l 70 0 l 0 40 q 40 8 40 48 l 0 40 l -150 0 Z" fill="#b45309"/>`;
    out += `<path d="M ${c - 250} ${y - 210} q 20 40 0 60" fill="none" stroke="#f59e0b" stroke-width="10" stroke-linecap="round"/>`;
  }
  return out;
}

function drawPlate(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) - 20;
  const r = (n) => (hash(`${seed}-pl-${n}`) % 1000) / 1000;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 20}" rx="250" ry="30" fill="rgba(0,0,0,0.26)"/>`;
  out += disc(c, y, 240, 62, '#f8fafc', 'rgba(0,0,0,0.12)', 4);
  out += disc(c, y - 6, 200, 50, '#ffffff', 'rgba(0,0,0,0.06)', 2);
  if (/tabua|frios|queijo|antepasto/i.test(seed)) {
    out += `<rect x="${c - 220}" y="${y - 90}" width="440" height="90" rx="20" fill="#8a5a33"/>`;
    out += `<rect x="${c - 220}" y="${y - 96}" width="440" height="26" rx="13" fill="#a97142"/>`;
    const items = [['#fbbf24', 46], ['#dc2626', 34], ['#f8fafc', 40], ['#166534', 26], ['#7c2d12', 30]];
    for (let i = 0; i < 9; i += 1) {
      const [color, size] = items[i % items.length];
      const px = c - 170 + r(i) * 340;
      const py = y - 60 + r(i + 7) * 40;
      out += disc(px, py, size, size * 0.7, color, 'rgba(0,0,0,0.12)', 2);
    }
  } else if (/salada|verdura|legume|veggie/i.test(seed)) {
    for (let i = 0; i < 10; i += 1) {
      const px = c - 130 + r(i) * 260;
      const py = y - 30 + r(i + 5) * 44;
      out += `<ellipse cx="${px}" cy="${py}" rx="${34 + r(i) * 20}" ry="${22 + r(i) * 12}" fill="${
        i % 3 ? '#4d9a3a' : '#166534'
      }" transform="rotate(${Math.round(r(i) * 90)} ${px} ${py})"/>`;
    }
    out += `<circle cx="${c + 40}" cy="${y - 30}" r="26" fill="#dc2626"/>`;
  } else if (/sushi|temaki/i.test(seed)) {
    for (let i = 0; i < 6; i += 1) {
      const px = c - 130 + i * 52;
      out += `<rect x="${px}" y="${y - 46}" width="44" height="52" rx="10" fill="#f8fafc"/>`;
      out += `<rect x="${px}" y="${y - 50}" width="44" height="22" rx="8" fill="#f97316"/>`;
      out += `<rect x="${px + 12}" y="${y - 44}" width="20" height="14" rx="4" fill="#dc2626"/>`;
    }
  } else {
    // prato principal: proteina + guarnicao
    out += `<ellipse cx="${c - 40}" cy="${y - 26}" rx="120" ry="46" fill="#7c2d12"/>`;
    out += `<ellipse cx="${c - 40}" cy="${y - 34}" rx="104" ry="34" fill="#9a3412"/>`;
    out += `<path d="M ${c - 150} ${y - 20} q 110 30 220 0" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="6"/>`;
    for (let i = 0; i < 7; i += 1) {
      const px = c + 70 + r(i) * 110;
      const py = y - 20 + r(i + 4) * 30;
      out += `<ellipse cx="${px}" cy="${py}" rx="${18 + r(i) * 12}" ry="${12 + r(i) * 8}" fill="#f59e0b"/>`;
    }
    out += `<ellipse cx="${c - 180}" cy="${y - 30}" rx="40" ry="26" fill="#4d9a3a" transform="rotate(-18 ${c - 180} ${y - 30})"/>`;
  }
  // garfo (dentes + haste) e faca (lamina + cabo)
  const fx = c - 300;
  out += `<rect x="${fx - 5}" y="${y - 40}" width="12" height="150" rx="6" fill="#cbd5e1"/>`;
  out += `<rect x="${fx - 30}" y="${y - 96}" width="62" height="16" rx="8" fill="#cbd5e1"/>`;
  for (let i = 0; i < 4; i += 1) {
    out += `<rect x="${fx - 30 + i * 19}" y="${y - 136}" width="10" height="46" rx="5" fill="#cbd5e1"/>`;
  }
  const kx = c + 300;
  out += `<path d="M ${kx - 10} ${y - 130} q 26 26 22 60 l -6 40 l -12 0 l 0 40 l -12 0 l 0 -140 Z" fill="#cbd5e1"/>`;
  out += `<rect x="${kx - 14}" y="${y - 30}" width="12" height="140" rx="6" fill="#94a3b8"/>`;
  return out;
}

function drawFries(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-fr-${n}`) % 1000) / 1000;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="200" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  if (/onion/i.test(seed)) {
    // aneis de cebola empilhados
    for (let i = 0; i < 5; i += 1) {
      const px = c - 130 + i * 66;
      const py = y - 40 - (i % 2) * 26;
      out += `<circle cx="${px}" cy="${py}" r="46" fill="none" stroke="#d97706" stroke-width="20"/>`;
      out += `<circle cx="${px}" cy="${py}" r="46" fill="none" stroke="#fbbf24" stroke-width="8"/>`;
    }
  } else {
    // batatas saindo da caixa
    for (let i = 0; i < 14; i += 1) {
      const px = c - 110 + r(i) * 220;
      const hgt = 110 + r(i + 3) * 120;
      out += `<rect x="${px}" y="${y - 40 - hgt}" width="26" height="${hgt}" rx="10" fill="${
        i % 3 ? '#fbbf24' : '#f59e0b'
      }" transform="rotate(${Math.round(r(i + 5) * 16 - 8)} ${px} ${y - 40})"/>`;
    }
    // caixa
    out += `<path d="M ${c - 160} ${y - 60} L ${c + 160} ${y - 60} L ${c + 120} ${y + 10} L ${c - 120} ${y + 10} Z" fill="#dc2626"/>`;
    out += `<path d="M ${c - 150} ${y - 60} L ${c + 150} ${y - 60} L ${c + 140} ${y - 34} L ${c - 140} ${y - 34} Z" fill="#ef4444"/>`;
  }
  // molho
  out += disc(c + 190, y - 30, 54, 22, '#f8fafc', 'rgba(0,0,0,0.12)', 2);
  out += disc(c + 190, y - 34, 38, 14, '#fde68a', 'none', 0);
  return out;
}

function drawBread(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 4}" rx="200" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  if (/focaccia|esfiha|calzone/i.test(seed)) {
    out += disc(c, y - 60, 190, 90, '#d97706', 'rgba(120,63,15,0.5)', 4);
    out += disc(c, y - 66, 160, 74, '#f59e0b', 'none', 0);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      out += `<circle cx="${c + Math.cos(a) * 94}" cy="${y - 66 + Math.sin(a) * 42}" r="16" fill="#b91c1c"/>`;
    }
  } else {
    // pao / bruschetta
    out += `<path d="M ${c - 190} ${y - 40} q 0 -120 190 -120 q 190 0 190 120 q -190 40 -380 0 Z" fill="#d97706"/>`;
    out += `<path d="M ${c - 170} ${y - 56} q 0 -96 170 -96 q 170 0 170 96 q -170 34 -340 0 Z" fill="#f59e0b"/>`;
    for (let i = 0; i < 4; i += 1) {
      out += `<path d="M ${c - 130 + i * 88} ${y - 140} q 24 40 4 74" fill="none" stroke="#b45309" stroke-width="9" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 5; i += 1) {
      out += `<circle cx="${c - 120 + i * 60}" cy="${y - 60 + (i % 2) * 20}" r="18" fill="#dc2626"/>`;
    }
    out += `<ellipse cx="${c + 40}" cy="${y - 84}" rx="34" ry="18" fill="#166534" transform="rotate(-20 ${c + 40} ${y - 84})"/>`;
  }
  return out;
}

function drawSalad(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-sl-${n}`) % 1000) / 1000;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="200" ry="26" fill="rgba(0,0,0,0.26)"/>`;
  out += disc(c, y, 190, 50, '#f8fafc', 'rgba(0,0,0,0.12)', 3);
  for (let i = 0; i < 12; i += 1) {
    const px = c - 130 + r(i) * 260;
    const py = y - 30 + r(i + 6) * 30;
    out += `<ellipse cx="${px}" cy="${py}" rx="${36 + r(i) * 22}" ry="${24 + r(i) * 14}" fill="${
      i % 3 ? '#4d9a3a' : '#15803d'
    }" transform="rotate(${Math.round(r(i) * 120)} ${px} ${py})"/>`;
  }
  out += `<circle cx="${c - 50}" cy="${y - 46}" r="28" fill="#dc2626"/>`;
  out += `<circle cx="${c + 60}" cy="${y - 40}" r="22" fill="#f59e0b"/>`;
  return out;
}

function drawSushi(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="210" ry="26" fill="rgba(0,0,0,0.26)"/>`;
  out += `<rect x="${c - 210}" y="${y - 60}" width="420" height="66" rx="18" fill="#7c2d12"/>`;
  out += `<rect x="${c - 210}" y="${y - 66}" width="420" height="18" rx="9" fill="#9a3412"/>`;
  for (let i = 0; i < 5; i += 1) {
    const px = c - 160 + i * 78;
    out += `<rect x="${px}" y="${y - 118}" width="64" height="62" rx="14" fill="#f8fafc"/>`;
    out += `<rect x="${px - 4}" y="${y - 126}" width="72" height="30" rx="10" fill="${i % 2 ? '#f97316' : '#fca5a5'}"/>`;
    out += `<rect x="${px + 18}" y="${y - 112}" width="28" height="20" rx="5" fill="#dc2626"/>`;
    out += `<rect x="${px + 26}" y="${y - 96}" width="12" height="34" rx="3" fill="#166534" opacity="0.8"/>`;
  }
  return out;
}

function drawDress(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const colors = [['#f472b6', '#9d174d'], ['#a78bfa', '#4c1d95'], ['#34d399', '#065f46'], ['#f87171', '#7f1d1d'], ['#fbbf24', '#92400e']];
  const [lightC, darkC] = colors[variant % colors.length];
  const r = (n) => (hash(`${seed}-dr-${n}`) % 1000) / 1000;
  const pleats = /plissad/i.test(seed);
  let out = '';
  // cabide
  out += `<path d="M ${c} ${y - 470} l 0 -16 a 16 16 0 1 1 16 -16" fill="none" stroke="#94a3b8" stroke-width="9"/>`;
  out += `<path d="M ${c - 120} ${y - 430} L ${c} ${y - 470} L ${c + 120} ${y - 430}" fill="none" stroke="#94a3b8" stroke-width="9"/>
`;
  // vestido manga
  out += `<path d="M ${c - 70} ${y - 430} q -90 10 -86 66 l 20 70 q 46 -26 66 -18 l 0 200 q -60 20 -110 130 l 320 0 q -50 -110 -110 -130 l 0 -200 q 20 -8 66 18 l 20 -70 q 4 -56 -86 -66 q -56 22 -130 0 Z" fill="${darkC}"/>`;
  out += `<path d="M ${c - 66} ${y - 424} q -76 12 -70 58 l 14 54 q 40 -22 56 -14 l 0 190 q -52 22 -100 122 l 296 0 q -48 -100 -100 -122 l 0 -190 q 16 -8 56 14 l 14 -54 q 6 -46 -70 -58 q -52 18 -96 0 Z" fill="${lightC}"/>`;
  if (pleats) {
    for (let i = 0; i < 9; i += 1) {
      out += `<path d="M ${c - 100 + i * 24} ${y - 150} q ${Math.round(r(i) * 10 - 5)} 60 ${Math.round(
        r(i + 4) * 20 - 10,
      )} 140" fill="none" stroke="rgba(0,0,0,0.16)" stroke-width="5"/>`;
    }
  }
  // cinto
  out += `<rect x="${c - 74}" y="${y - 230}" width="148" height="18" rx="9" fill="rgba(0,0,0,0.35)"/>`;
  return out;
}

function drawShirt(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const colors = [['#e2e8f0', '#94a3b8'], ['#1f2937', '#0f172a'], ['#3b82f6', '#1e40af'], ['#f59e0b', '#b45309']];
  const [lightC, darkC] = colors[variant % colors.length];
  const isButton = /camisa|social|oversize/i.test(seed);
  let out = '';
  out += `<path d="M ${c} ${y - 450} l 0 -14 a 14 14 0 1 1 14 -14" fill="none" stroke="#94a3b8" stroke-width="8"/>`;
  out += `<path d="M ${c - 120} ${y - 410} L ${c} ${y - 450} L ${c + 120} ${y - 410}" fill="none" stroke="#94a3b8" stroke-width="8"/>`;
  // corpo + mangas
  out += `<path d="M ${c - 90} ${y - 416} q -110 26 -130 130 l 76 44 q 26 -50 54 -66 l 0 250 q 90 26 180 0 l 0 -250 q 28 16 54 66 l 76 -44 q -20 -104 -130 -130 q -60 40 -180 0 Z" fill="${lightC}" stroke="rgba(0,0,0,0.12)" stroke-width="3"/>`;
  // gola
  out += `<path d="M ${c - 90} ${y - 416} q 90 46 180 0 q -26 40 -90 40 q -64 0 -90 -40 Z" fill="${darkC}" opacity="0.9"/>`;
  // botoes
  if (isButton) {
    out += `<line x1="${c}" y1="${y - 380}" x2="${c}" y2="${y - 60}" stroke="rgba(0,0,0,0.18)" stroke-width="4"/>`;
    for (let i = 0; i < 6; i += 1) {
      out += `<circle cx="${c}" cy="${y - 350 + i * 52}" r="6" fill="rgba(0,0,0,0.35)"/>`;
    }
  } else {
    // estampa
    out += `<circle cx="${c}" cy="${y - 210}" r="64" fill="${darkC}" opacity="0.85"/>`;
    out += `<path d="M ${c - 36} ${y - 210} l 24 26 l 48 -56" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="12" stroke-linecap="round"/>`;
  }
  return out;
}

function drawPants(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const colors = [['#1e3a8a', '#1e40af'], ['#111827', '#1f2937'], ['#a16207', '#854d0e']];
  const [darkC, lightC] = colors[variant % colors.length];
  let out = '';
  out += `<path d="M ${c} ${y - 450} l 0 -14 a 14 14 0 1 1 14 -14" fill="none" stroke="#94a3b8" stroke-width="8"/>`;
  out += `<path d="M ${c - 120} ${y - 410} L ${c} ${y - 450} L ${c + 120} ${y - 410}" fill="none" stroke="#94a3b8" stroke-width="8"/>`;
  out += `<path d="M ${c - 110} ${y - 418} l 220 0 l -6 130 l -30 0 l -14 240 l -70 0 l -10 -210 l -10 210 l -70 0 l -14 -240 l -30 0 Z" fill="${darkC}" stroke="rgba(0,0,0,0.14)" stroke-width="3"/>`;
  out += `<rect x="${c - 110}" y="${y - 418}" width="220" height="26" fill="${lightC}"/>`;
  out += `<circle cx="${c}" cy="${y - 400}" r="7" fill="rgba(255,255,255,0.5)"/>`;
  // pesponto
  out += `<path d="M ${c} ${y - 380} l 0 90" stroke="rgba(255,255,255,0.28)" stroke-width="4" stroke-dasharray="8 8"/>`;
  for (let i = 0; i < 5; i += 1) {
    out += `<rect x="${c - 96 + i * 40}" y="${y - 306}" width="30" height="16" rx="6" fill="rgba(255,255,255,0.16)"/>`;
  }
  return out;
}

function drawShoe(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const isHeel = /salto|sandalia/i.test(seed) || variant % 2 === 1;
  const colors = [['#111827', '#374151'], ['#f8fafc', '#cbd5e1'], ['#b45309', '#78350f'], ['#dc2626', '#7f1d1d']];
  const [main, accent] = colors[variant % colors.length];
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 4}" rx="230" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  if (isHeel) {
    // sandalia de salto
    out += `<path d="M ${c - 190} ${y - 20} q 60 -34 150 -40 l 26 -96 q 26 8 22 42 l -16 60 q 60 12 66 40 Z" fill="${main}"/>`;
    out += `<path d="M ${c - 60} ${y - 62} q 40 -96 96 -110" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>`;
    out += `<rect x="${c + 96}" y="${y - 40}" width="22" height="44" rx="8" fill="${main}"/>`;
  } else {
    // tenis
    out += `<path d="M ${c - 200} ${y - 20} q 6 -80 76 -96 q 60 -14 90 -60 q 40 -22 62 10 q 26 40 74 62 q 60 26 66 66 l -368 18 Z" fill="${main}"/>`;
    out += `<path d="M ${c - 200} ${y - 20} q 0 22 26 22 l 320 0 q 20 0 20 -18 l -366 -4 Z" fill="${accent}"/>`;
    // cadarcos
    for (let i = 0; i < 4; i += 1) {
      out += `<path d="M ${c - 60 + i * 44} ${y - 132} l 40 26" stroke="rgba(255,255,255,0.65)" stroke-width="8" stroke-linecap="round"/>`;
    }
    out += `<path d="M ${c - 190} ${y - 26} q 120 -18 250 -6" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="6"/>`;
  }
  return out;
}

function drawBag(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const colors = [['#b45309', '#78350f'], ['#111827', '#1f2937'], ['#9d174d', '#500724'], ['#0f766e', '#134e4a']];
  const [main, accent] = colors[variant % colors.length];
  const isBackpack = /mochila|mala/i.test(seed);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="190" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  if (isBackpack) {
    out += `<rect x="${c - 150}" y="${y - 300}" width="300" height="300" rx="70" fill="${main}"/>`;
    out += `<rect x="${c - 110}" y="${y - 200}" width="220" height="140" rx="40" fill="${accent}"/>`;
    out += `<path d="M ${c - 60} ${y - 300} q 60 -90 120 0" fill="none" stroke="${accent}" stroke-width="16"/>`;
    out += `<rect x="${c - 40}" y="${y - 250}" width="80" height="26" rx="10" fill="#fbbf24"/>`;
  } else {
    // bolsa/mala com alca
    out += `<path d="M ${c - 60} ${y - 220} q 0 -100 60 -100 q 60 0 60 100" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>`;
    out += `<path d="M ${c - 170} ${y - 230} l 340 0 q 30 0 24 30 l -30 190 q -4 22 -28 22 l -272 0 q -24 0 -28 -22 l -30 -190 q -6 -30 24 -30 Z" fill="${main}"/>`;
    out += `<rect x="${c - 170}" y="${y - 230}" width="340" height="34" rx="12" fill="${accent}"/>`;
    out += `<rect x="${c - 34}" y="${y - 176}" width="68" height="40" rx="12" fill="#fbbf24"/>`;
    out += `<path d="M ${c - 150} ${y - 120} q 150 26 300 0" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>`;
  }
  return out;
}

function drawAccessory(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="170" ry="24" fill="rgba(0,0,0,0.26)"/>`;
  if (/oculos/i.test(seed)) {
    out += `<circle cx="${c - 96}" cy="${y - 140}" r="76" fill="rgba(147,197,253,0.55)" stroke="#111827" stroke-width="14"/>`;
    out += `<circle cx="${c + 96}" cy="${y - 140}" r="76" fill="rgba(147,197,253,0.55)" stroke="#111827" stroke-width="14"/>`;
    out += `<path d="M ${c - 20} ${y - 146} q 20 -12 40 0" fill="none" stroke="#111827" stroke-width="14"/>`;
    out += `<path d="M ${c - 172} ${y - 156} l -60 -20" stroke="#111827" stroke-width="12" stroke-linecap="round"/>`;
    out += `<path d="M ${c + 172} ${y - 156} l 60 -20" stroke="#111827" stroke-width="12" stroke-linecap="round"/>`;
  } else if (/relogio/i.test(seed)) {
    out += `<circle cx="${c}" cy="${y - 140}" r="120" fill="#111827"/>`;
    out += `<circle cx="${c}" cy="${y - 140}" r="102" fill="#f8fafc"/>`;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      out += `<line x1="${c + Math.cos(a) * 84}" y1="${y - 140 + Math.sin(a) * 84}" x2="${c + Math.cos(a) * 94}" y2="${
        y - 140 + Math.sin(a) * 94
      }" stroke="#111827" stroke-width="6"/>`;
    }
    out += `<line x1="${c}" y1="${y - 140}" x2="${c}" y2="${y - 200}" stroke="#111827" stroke-width="8" stroke-linecap="round"/>`;
    out += `<line x1="${c}" y1="${y - 140}" x2="${c + 52}" y2="${y - 120}" stroke="#b91c1c" stroke-width="7" stroke-linecap="round"/>`;
  } else if (/colar|brinco|bijuteria/i.test(seed)) {
    out += `<path d="M ${c - 130} ${y - 280} q 130 220 260 0" fill="none" stroke="#fbbf24" stroke-width="10"/>`;
    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const px = c - 130 + t * 260;
      const py = y - 280 + Math.sin(t * Math.PI) * 120;
      out += `<circle cx="${px}" cy="${py}" r="14" fill="#f59e0b"/>`;
    }
    out += `<path d="M ${c} ${y - 148} l 26 30 l -26 34 l -26 -34 Z" fill="#fde68a" stroke="#f59e0b" stroke-width="4"/>`;
  } else {
    // cinto deitado: tira, fivela e furos
    out += `<path d="M ${c - 300} ${y - 70} l 480 0 q 26 0 26 26 l 0 34 q 0 26 -26 26 l -480 0 Z" fill="#7c2d12"/>`;
    out += `<path d="M ${c - 300} ${y - 70} l 480 0 q 26 0 26 26 l 0 12 l -506 0 Z" fill="#9a3412"/>`;
    out += `<rect x="${c + 214}" y="${y - 88}" width="118" height="104" rx="12" fill="none" stroke="#e5e7eb" stroke-width="18"/>`;
    out += `<rect x="${c + 264}" y="${y - 92}" width="16" height="112" rx="8" fill="#cbd5e1"/>`;
    for (let i = 0; i < 5; i += 1) {
      out += `<circle cx="${c - 250 + i * 70}" cy="${y - 14}" r="8" fill="rgba(0,0,0,0.45)"/>`;
    }
    out += `<rect x="${c - 320}" y="${y - 62}" width="70" height="34" rx="10" fill="#57534e"/>`;
  }
  return out;
}

function drawBarbershop(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  // parede com lambri
  out += `<rect x="${c - 420}" y="${y - 330}" width="840" height="240" fill="rgba(255,255,255,0.10)"/>`;
  out += `<rect x="${c - 420}" y="${y - 96}" width="840" height="96" fill="rgba(0,0,0,0.22)"/>`;
  for (let i = 0; i < 12; i += 1) {
    out += `<rect x="${c - 420 + i * 70}" y="${y - 96}" width="4" height="96" fill="rgba(0,0,0,0.14)"/>`;
  }
  // espelho grande com moldura
  out += `<rect x="${c - 210}" y="${y - 310}" width="340" height="200" rx="10" fill="#d6c3a1"/>`;
  out += `<rect x="${c - 198}" y="${y - 298}" width="316" height="176" rx="6" fill="#cbd5e1"/>`;
  out += `<path d="M ${c - 190} ${y - 128} l 120 -158" stroke="rgba(255,255,255,0.75)" stroke-width="26"/>`;
  out += `<path d="M ${c - 40} ${y - 128} l 110 -146" stroke="rgba(255,255,255,0.5)" stroke-width="14"/>`;
  // bancada com utensilios
  out += `<rect x="${c - 230}" y="${y - 110}" width="380" height="22" rx="8" fill="#92400e"/>`;
  out += `<rect x="${c - 200}" y="${y - 148}" width="46" height="38" rx="8" fill="#1f2937"/>`;
  out += `<rect x="${c - 140}" y="${y - 140}" width="16" height="30" rx="6" fill="#e2e8f0"/>`;
  out += `<rect x="${c - 108}" y="${y - 144}" width="40" height="34" rx="6" fill="#b45309"/>`;
  // cadeira de barbeiro
  out += `<rect x="${c + 240}" y="${y - 24}" width="150" height="24" rx="8" fill="rgba(0,0,0,0.28)"/>`;
  out += `<path d="M ${c + 290} ${y - 60} l 50 0 l 6 36 l -62 0 Z" fill="#334155"/>`;
  out += `<path d="M ${c + 290} ${y - 96} l 50 0 l 0 38 l -50 0 Z" fill="#475569"/>`;
  out += `<path d="M ${c + 254} ${y - 104} q 60 -18 122 0 l 0 14 l -122 0 Z" fill="#7f1d1d"/>`;
  out += `<path d="M ${c + 258} ${y - 108} q 58 -96 114 0 q -58 -18 -114 0 Z" fill="#991b1b"/>`;
  out += `<path d="M ${c + 250} ${y - 104} q -28 8 -22 40" fill="none" stroke="#111827" stroke-width="11" stroke-linecap="round"/>`;
  out += `<path d="M ${c + 380} ${y - 104} q 28 8 22 40" fill="none" stroke="#111827" stroke-width="11" stroke-linecap="round"/>`;
  // luminaria pendente
  out += `<line x1="${c + 60}" y1="${y - 330}" x2="${c + 60}" y2="${y - 250}" stroke="rgba(255,255,255,0.35)" stroke-width="5"/>`;
  out += `<path d="M ${c + 8} ${y - 250} l 104 0 l -18 40 l -68 0 Z" fill="rgba(255,255,255,0.7)"/>`;
  out += `<circle cx="${c + 60}" cy="${y - 202}" r="12" fill="#fde68a" opacity="0.9"/>`;
  // poste de barbeiro (sinal classico)
  out += `<rect x="${c - 380}" y="${y - 300}" width="52" height="300" rx="26" fill="rgba(255,255,255,0.85)"/>`;
  for (let i = 0; i < 6; i += 1) {
    out += `<path d="M ${c - 378} ${y - 284 + i * 46} q 26 22 50 0 l 0 20 q -24 22 -50 0 Z" fill="${i % 2 ? '#dc2626' : '#2563eb'}"/>`;
  }
  out += `<circle cx="${c - 354}" cy="${y - 312}" r="28" fill="rgba(255,255,255,0.9)"/>`;
  return out;
}

function drawStorefront(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="330" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  // fachada
  out += `<rect x="${c - 320}" y="${y - 340}" width="640" height="340" fill="#1f2937"/>`;
  // vitrine iluminada
  out += `<rect x="${c - 270}" y="${y - 300}" width="380" height="250" rx="10" fill="#fef3c7" opacity="0.92"/>`;
  // araras com roupas
  for (let i = 0; i < 5; i += 1) {
    const px = c - 240 + i * 72;
    out += `<rect x="${px}" y="${y - 220}" width="52" height="140" rx="10" fill="${['#dc2626', '#2563eb', '#16a34a', '#a855f7', '#f59e0b'][i]}"/>`;
    out += `<rect x="${px + 14}" y="${y - 238}" width="24" height="20" rx="6" fill="rgba(0,0,0,0.25)"/>`;
  }
  out += `<rect x="${c - 268}" y="${y - 246}" width="376" height="10" rx="5" fill="#475569"/>`;
  // porta
  out += `<rect x="${c + 130}" y="${y - 300}" width="150" height="300" rx="8" fill="#0f172a"/>`;
  out += `<rect x="${c + 146}" y="${y - 286}" width="118" height="220" rx="6" fill="rgba(147,197,253,0.35)"/>`;
  out += `<circle cx="${c + 254}" cy="${y - 170}" r="8" fill="#e2e8f0"/>`;
  // toldo
  for (let i = 0; i < 8; i += 1) {
    out += `<path d="M ${c - 330 + i * 82} ${y - 340} l 82 0 l 0 44 q -41 26 -82 0 Z" fill="${i % 2 ? '#dc2626' : '#f8fafc'}"/>`;
  }
  // manequim
  out += `<circle cx="${c - 120}" cy="${y - 250}" r="26" fill="#e2e8f0"/>`;
  out += `<path d="M ${c - 152} ${y - 170} q 32 -60 64 0 l -10 130 l -44 0 Z" fill="#e2e8f0"/>`;
  return out;
}

function drawProduce(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-pr-${n}`) % 1000) / 1000;
  const fruits = [
    ['#dc2626', 46, 'apple'],
    ['#f59e0b', 44, 'orange'],
    ['#65a30d', 40, 'lime'],
    ['#facc15', 52, 'banana'],
    ['#7c3aed', 34, 'grape'],
  ];
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="270" ry="30" fill="rgba(0,0,0,0.28)"/>`;
  if (/banca|corredor|hortifruti/i.test(seed) && variant % 2 === 0) {
    // banca em degraus
    for (let level = 0; level < 3; level += 1) {
      const ly = y - 20 - level * 76;
      out += `<rect x="${c - 280 + level * 26}" y="${ly - 70}" width="${560 - level * 52}" height="76" rx="10" fill="#8a5a33"/>`;
      out += `<rect x="${c - 280 + level * 26}" y="${ly - 76}" width="${560 - level * 52}" height="18" rx="9" fill="#a97142"/>`;
      for (let i = 0; i < 7; i += 1) {
        const fx = c - 230 + level * 26 + i * 70;
        const [color, size] = fruits[Math.floor(r(level * 10 + i) * fruits.length)];
        out += `<circle cx="${fx}" cy="${ly - 30}" r="${size * 0.62}" fill="${color}"/>`;
        out += `<circle cx="${fx - size * 0.2}" cy="${ly - 30 - size * 0.22}" r="${size * 0.2}" fill="rgba(255,255,255,0.3)"/>`;
      }
    }
  } else if (/cesta/i.test(seed)) {
    // cesta de frutas
    for (let i = 0; i < 9; i += 1) {
      const [color, size] = fruits[i % fruits.length];
      const fx = c - 110 + r(i) * 220;
      const fy = y - 110 - r(i + 5) * 90;
      out += `<circle cx="${fx}" cy="${fy}" r="${size * 0.8}" fill="${color}"/>`;
    }
    out += `<path d="M ${c - 200} ${y - 130} l 400 0 l -46 130 l -308 0 Z" fill="#b45309"/>`;
    for (let i = 0; i < 7; i += 1) {
      out += `<line x1="${c - 180 + i * 60}" y1="${y - 130}" x2="${c - 176 + i * 52}" y2="${y}" stroke="rgba(0,0,0,0.2)" stroke-width="5"/>`;
    }
    out += `<path d="M ${c - 190} ${y - 130} q 190 -70 380 0" fill="none" stroke="#78350f" stroke-width="12"/>`;
  } else {
    // frutas avulsas / legumes
    for (let i = 0; i < 6; i += 1) {
      const [color, size] = fruits[i % fruits.length];
      const fx = c - 180 + i * 72;
      const fy = y - 60 - (i % 2) * 34;
      out += `<circle cx="${fx}" cy="${fy}" r="${size * 0.9}" fill="${color}"/>`;
      out += `<circle cx="${fx - 10}" cy="${fy - 14}" r="${size * 0.28}" fill="rgba(255,255,255,0.35)"/>`;
      out += `<path d="M ${fx} ${fy - size * 0.9} q 12 -18 26 -14" fill="none" stroke="#166534" stroke-width="7" stroke-linecap="round"/>`;
    }
  }
  return out;
}

function drawBakery(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 6}" rx="240" ry="28" fill="rgba(0,0,0,0.28)"/>`;
  if (/bolo|confeitaria|doce/i.test(seed)) {
    out += `<rect x="${c - 180}" y="${y - 180}" width="360" height="180" rx="14" fill="#fde68a"/>`;
    out += `<path d="M ${c - 180} ${y - 180} q 40 -46 90 -8 q 50 -46 90 -6 q 46 -40 90 6 q 40 -34 90 8 l 0 34 l -360 0 Z" fill="#fffbeb"/>`;
    out += `<rect x="${c - 180}" y="${y - 122}" width="360" height="24" fill="#dc2626" opacity="0.85"/>`;
    for (let i = 0; i < 5; i += 1) {
      out += `<path d="M ${c - 140 + i * 70} ${y - 172} q 14 30 0 52" fill="none" stroke="#f43f5e" stroke-width="6"/>`;
    }
    out += `<circle cx="${c + 60}" cy="${y - 208}" r="20" fill="#dc2626"/>`;
  } else {
    // paes
    for (let i = 0; i < 5; i += 1) {
      const px = c - 190 + i * 96;
      out += `<ellipse cx="${px}" cy="${y - 60}" rx="62" ry="40" fill="#c2740f"/>`;
      out += `<ellipse cx="${px}" cy="${y - 70}" rx="54" ry="30" fill="#e0a44b"/>`;
      out += `<path d="M ${px - 34} ${y - 76} q 16 -14 34 0 q 18 -14 34 0" fill="none" stroke="#a16207" stroke-width="6"/>`;
    }
    out += `<rect x="${c - 250}" y="${y - 24}" width="500" height="24" rx="10" fill="#8a5a33"/>`;
  }
  return out;
}

function drawShelf(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-sh-${n}`) % 1000) / 1000;
  let out = '';
  // prateleiras
  for (let level = 0; level < 3; level += 1) {
    const ly = y - 20 - level * 130;
    out += `<rect x="${c - 300}" y="${ly}" width="600" height="18" rx="6" fill="#8a5a33"/>`;
    const colors = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0ea5e9'];
    for (let i = 0; i < 7; i += 1) {
      const ph = 60 + r(level * 7 + i) * 50;
      const pw = 42 + r(level * 7 + i + 40) * 26;
      out += `<rect x="${c - 280 + i * 82}" y="${ly - ph}" width="${pw}" height="${ph}" rx="8" fill="${
        colors[Math.floor(r(level * 7 + i + 9) * colors.length)]
      }"/>`;
      out += `<rect x="${c - 280 + i * 82}" y="${ly - ph + 18}" width="${pw}" height="16" fill="rgba(255,255,255,0.75)"/>`;
    }
  }
  out += `<rect x="${c - 320}" y="${y - 20}" width="640" height="20" fill="#6b4423"/>`;
  return out;
}

function drawDrinkshelf(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-ds2-${n}`) % 1000) / 1000;
  let out = '';
  // geladeira
  out += `<rect x="${c - 280}" y="${y - 400}" width="560" height="400" rx="18" fill="#0f172a"/>`;
  out += `<rect x="${c - 264}" y="${y - 384}" width="528" height="368" rx="12" fill="#1e293b"/>`;
  for (let level = 0; level < 3; level += 1) {
    const ly = y - 60 - level * 112;
    out += `<rect x="${c - 250}" y="${ly + 8}" width="500" height="10" rx="5" fill="#475569"/>`;
    for (let i = 0; i < 8; i += 1) {
      const px = c - 240 + i * 62;
      const color = ['#16a34a', '#dc2626', '#f59e0b', '#0ea5e9'][Math.floor(r(level * 8 + i) * 4)];
      out += `<rect x="${px}" y="${ly - 62}" width="36" height="70" rx="8" fill="${color}"/>`;
      out += `<rect x="${px}" y="${ly - 40}" width="36" height="14" fill="rgba(255,255,255,0.8)"/>`;
      out += `<rect x="${px + 6}" y="${ly - 76}" width="10" height="16" fill="#cbd5e1"/>`;
    }
  }
  // reflexo no vidro
  out += `<path d="M ${c - 240} ${y - 380} l 120 360" stroke="rgba(255,255,255,0.10)" stroke-width="46"/>`;
  return out;
}

function drawMarket(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  // corredor em perspectiva
  out += `<path d="M ${c - 340} ${y} L ${c - 120} ${y - 300} L ${c + 120} ${y - 300} L ${c + 340} ${y} Z" fill="#1f2937"/>`;
  out += `<path d="M ${c - 300} ${y} L ${c - 120} ${y - 280} L ${c - 60} ${y - 280} L ${c - 130} ${y} Z" fill="#374151"/>`;
  out += `<path d="M ${c + 300} ${y} L ${c + 120} ${y - 280} L ${c + 60} ${y - 280} L ${c + 130} ${y} Z" fill="#374151"/>`;
  // gondolas
  for (let i = 0; i < 4; i += 1) {
    const t = i / 4;
    const ly = y - 60 - t * 200;
    out += `<rect x="${c - 300 + t * 120}" y="${ly}" width="${180 - t * 60}" height="14" rx="5" fill="#92400e"/>`;
    out += `<rect x="${c + 120 - t * 60}" y="${ly}" width="${180 - t * 60}" height="14" rx="5" fill="#92400e"/>`;
    for (let j = 0; j < 4; j += 1) {
      const pw = 18 - t * 6;
      out += `<rect x="${c - 292 + t * 120 + j * (40 - t * 12)}" y="${ly - 44 + t * 10}" width="${pw}" height="${44 - t * 10}" rx="4" fill="${
        ['#dc2626', '#2563eb', '#16a34a', '#f59e0b'][j]
      }"/>`;
      out += `<rect x="${c + 128 - t * 60 + j * (40 - t * 12)}" y="${ly - 44 + t * 10}" width="${pw}" height="${44 - t * 10}" rx="4" fill="${
        ['#7c3aed', '#0ea5e9', '#65a30d', '#f97316'][j]
      }"/>`;
    }
  }
  if (/caixa|atendimento/i.test(seed)) {
    // caixa
    out += `<rect x="${c - 120}" y="${y - 150}" width="240" height="150" rx="12" fill="#475569"/>`;
    out += `<rect x="${c - 100}" y="${y - 176}" width="200" height="34" rx="8" fill="#111827"/>`;
    out += `<rect x="${c - 84}" y="${y - 170}" width="168" height="22" rx="4" fill="#4ade80" opacity="0.6"/>`;
    out += `<rect x="${c + 40}" y="${y - 240}" width="24" height="80" rx="6" fill="#0f172a"/>`;
    out += `<circle cx="${c + 52}" cy="${y - 250}" r="26" fill="#e2e8f0"/>`;
  }
  return out;
}

function drawTooth(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) - 20;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 20}" rx="200" ry="26" fill="rgba(0,0,0,0.24)"/>`;
  out += `<path d="M ${c - 130} ${y - 300} q -60 40 -40 130 q 14 66 40 96 q 20 24 36 -10 q 14 -50 34 -50 q 20 0 34 50 q 16 34 36 10 q 26 -30 40 -96 q 20 -90 -40 -130 q -60 -34 -90 -6 q -30 -28 -90 6 Z" fill="#f8fafc" stroke="rgba(15,23,42,0.14)" stroke-width="5"/>`;
  out += `<path d="M ${c - 96} ${y - 256} q -34 30 -24 96" fill="none" stroke="rgba(147,197,253,0.75)" stroke-width="14" stroke-linecap="round"/>`;
  // brilho
  out += `<ellipse cx="${c - 30}" cy="${y - 250}" rx="34" ry="18" fill="rgba(255,255,255,0.9)"/>`;
  if (/implante|clareamento/i.test(seed)) {
    out += `<path d="M ${c + 30} ${y - 200} l 46 0 l 0 60 l -46 0 Z" fill="#93c5fd" opacity="0.8"/>`;
  }
  return out;
}

function drawRoom(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const wall = ['#1e293b', '#134e4a', '#1e1b4b'][variant % 3];
  const floor = ['#0f172a', '#042f2e', '#111827'][variant % 3];
  let out = '';
  // parede / piso
  out += `<rect x="${c - 460}" y="${y - 380}" width="920" height="300" fill="${wall}" opacity="0.85"/>`;
  out += `<path d="M ${c - 460} ${y - 80} L ${c + 460} ${y - 80} L ${c + 380} ${y + 40} L ${c - 380} ${y + 40} Z" fill="${floor}"/>`;
  for (let i = 0; i < 7; i += 1) {
    out += `<path d="M ${c - 460 + i * 132} ${y - 80} L ${c - 380 + i * 108} ${y + 40}" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>`;
  }
  if (/recepcao|espera/i.test(seed)) {
    // balcao de recepcao
    out += `<rect x="${c - 330}" y="${y - 170}" width="400" height="170" rx="10" fill="#e2e8f0"/>`;
    out += `<rect x="${c - 330}" y="${y - 186}" width="400" height="24" rx="10" fill="#94a3b8"/>`;
    out += `<rect x="${c - 300}" y="${y - 150}" width="120" height="60" rx="6" fill="#0ea5e9" opacity="0.5"/>`;
    // poltronas de espera
    for (let i = 0; i < 3; i += 1) {
      const px = c + 110 + i * 88;
      out += `<rect x="${px}" y="${y - 96}" width="70" height="96" rx="10" fill="#0ea5e9"/>`;
      out += `<rect x="${px + 6}" y="${y - 168}" width="58" height="78" rx="10" fill="#38bdf8"/>`;
      out += `<rect x="${px + 6}" y="${y - 168}" width="58" height="12" rx="6" fill="rgba(255,255,255,0.6)"/>`;
    }
    // quadro na parede
    out += `<rect x="${c - 300}" y="${y - 330}" width="180" height="120" rx="8" fill="rgba(255,255,255,0.85)"/>`;
    out += `<path d="M ${c - 280} ${y - 250} l 60 -40 l 60 50 l 50 -30" fill="none" stroke="#0ea5e9" stroke-width="8"/>`;
  } else if (/escritorio|reuniao/i.test(seed)) {
    // mesa
    out += `<rect x="${c - 260}" y="${y - 150}" width="520" height="26" rx="10" fill="#a16207"/>`;
    out += `<rect x="${c - 236}" y="${y - 124}" width="22" height="124" fill="#854d0e"/>`;
    out += `<rect x="${c + 214}" y="${y - 124}" width="22" height="124" fill="#854d0e"/>`;
    // notebook aberto
    out += `<path d="M ${c - 90} ${y - 240} l 180 0 l 16 90 l -212 0 Z" fill="#0f172a"/>`;
    out += `<rect x="${c - 84}" y="${y - 234}" width="168" height="76" fill="#38bdf8" opacity="0.55"/>`;
    // cadeiras
    for (let i = 0; i < 2; i += 1) {
      const px = c - 170 + i * 340;
      out += `<rect x="${px - 44}" y="${y - 156}" width="88" height="70" rx="14" fill="#334155"/>`;
      out += `<rect x="${px - 40}" y="${y - 226}" width="80" height="74" rx="14" fill="#475569"/>`;
      out += `<rect x="${px - 10}" y="${y - 86}" width="20" height="60" fill="#1f2937"/>`;
      out += `<rect x="${px - 40}" y="${y - 30}" width="80" height="10" rx="5" fill="#1f2937"/>`;
    }
    // luminaria
    out += `<line x1="${c}" y1="${y - 380}" x2="${c}" y2="${y - 320}" stroke="rgba(255,255,255,0.35)" stroke-width="5"/>`;
    out += `<path d="M ${c - 52} ${y - 320} l 104 0 l -18 40 l -68 0 Z" fill="rgba(255,255,255,0.8)"/>`;
  } else {
    // consultorio: maca + armario + mesa
    out += `<rect x="${c - 300}" y="${y - 170}" width="420" height="26" rx="12" fill="#e2e8f0"/>`;
    out += `<rect x="${c - 300}" y="${y - 196}" width="140" height="30" rx="14" fill="#cbd5e1"/>`;
    out += `<rect x="${c - 286}" y="${y - 144}" width="20" height="144" fill="#94a3b8"/>`;
    out += `<rect x="${c + 96}" y="${y - 144}" width="20" height="144" fill="#94a3b8"/>`;
    // armario com instrumentos
    out += `<rect x="${c + 170}" y="${y - 300}" width="170" height="280" rx="8" fill="rgba(255,255,255,0.9)"/>`;
    out += `<rect x="${c + 180}" y="${y - 288}" width="150" height="120" rx="6" fill="#bae6fd"/>`;
    out += `<rect x="${c + 180}" y="${y - 156}" width="150" height="120" rx="6" fill="#bae6fd"/>`;
    out += `<rect x="${c + 246}" y="${y - 170}" width="14" height="30" rx="7" fill="#64748b"/>`;
    // mesa auxiliar
    out += `<rect x="${c - 420}" y="${y - 130}" width="120" height="16" rx="8" fill="#e2e8f0"/>`;
    out += `<rect x="${c - 400}" y="${y - 114}" width="12" height="114" fill="#94a3b8"/>`;
    out += `<rect x="${c - 330}" y="${y - 114}" width="12" height="114" fill="#94a3b8"/>`;
    out += `<rect x="${c - 400}" y="${y - 158}" width="46" height="28" rx="6" fill="#0ea5e9" opacity="0.8"/>`;
  }
  return out;
}

function drawProcedure(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 10}" rx="250" ry="26" fill="rgba(0,0,0,0.26)"/>`;
  // base da cadeira
  out += `<path d="M ${c - 30} ${y - 120} l 60 0 l 10 100 l -80 0 Z" fill="#94a3b8"/>`;
  out += `<rect x="${c - 90}" y="${y - 24}" width="180" height="18" rx="9" fill="#64748b"/>`;
  // cadeira reclinada
  out += `<path d="M ${c - 250} ${y - 60} l 300 -70 q 30 -6 40 16 l 12 30 q 6 22 -18 26 l -300 70 q -26 6 -34 -16 l -8 -28 q -6 -22 8 -28 Z" fill="#e2e8f0"/>`;
  out += `<path d="M ${c - 244} ${y - 74} l 290 -66 q 20 -4 26 10 l 8 20 q -140 40 -318 74 Z" fill="#f8fafc"/>`;
  // encosto de cabeca
  out += `<rect x="${c - 292}" y="${y - 96}" width="52" height="72" rx="16" fill="#cbd5e1"/>`;
  // refletor
  out += `<path d="M ${c + 210} ${y - 300} l 0 60 q 0 20 -20 26" fill="none" stroke="#64748b" stroke-width="12" stroke-linecap="round"/>`;
  out += `<ellipse cx="${c + 150}" cy="${y - 210}" rx="76" ry="52" fill="#f8fafc" transform="rotate(-24 ${c + 150} ${y - 210})"/>`;
  out += `<ellipse cx="${c + 150}" cy="${y - 206}" rx="58" ry="36" fill="#fde68a" transform="rotate(-24 ${c + 150} ${y - 206})"/>`;
  out += `<path d="M ${c + 130} ${y - 176} l -60 120 l 120 0 Z" fill="rgba(253,230,138,0.22)"/>`;
  // bandeja de instrumentos
  out += `<rect x="${c - 360}" y="${y - 150}" width="130" height="16" rx="8" fill="#e2e8f0"/>`;
  out += `<path d="M ${c - 340} ${y - 134} l 0 90 M ${c - 250} ${y - 134} l 0 90" stroke="#94a3b8" stroke-width="8"/>`;
  for (let i = 0; i < 3; i += 1) {
    out += `<rect x="${c - 340 + i * 34}" y="${y - 176}" width="8" height="30" rx="4" fill="#38bdf8"/>`;
  }
  return out;
}

function drawPortrait(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) + 30;
  const r = (n) => (hash(`${seed}-pt-${n}`) % 1000) / 1000;
  const skin = SKIN[Math.floor(r(1) * SKIN.length)];
  const hair = HAIR[Math.floor(r(2) * HAIR.length)];
  const uniform = ['#0ea5e9', '#f8fafc', '#14b8a6', '#6366f1'][Math.floor(r(3) * 4)];
  let out = '';
  // fundo circular (retrato)
  out += `<circle cx="${c}" cy="${y - 250}" r="290" fill="rgba(255,255,255,0.10)"/>`;
  // ombros / jaleco
  out += `<path d="M ${c - 230} ${y} q 20 -180 230 -180 q 210 0 230 180 Z" fill="${uniform}"/>`;
  out += `<path d="M ${c - 46} ${y - 180} l 0 180 l 92 0 l 0 -180 Z" fill="rgba(255,255,255,0.35)"/>`;
  // gola
  out += `<path d="M ${c - 70} ${y - 190} l 70 96 l 70 -96 q -70 -24 -140 0 Z" fill="rgba(0,0,0,0.18)"/>`;
  // pescoco
  out += `<rect x="${c - 44}" y="${y - 250}" width="88" height="76" rx="26" fill="${skin}"/>`;
  // cabeca
  out += `<ellipse cx="${c}" cy="${y - 330}" rx="112" ry="126" fill="${skin}"/>`;
  out += `<path d="M ${c - 112} ${y - 350} q 4 -140 112 -140 q 108 0 112 140 q -26 -78 -112 -78 q -86 0 -112 78 Z" fill="${hair}"/>`;
  // olhos, sobrancelhas, boca
  out += `<ellipse cx="${c - 42}" cy="${y - 330}" rx="15" ry="10" fill="#fff"/>`;
  out += `<ellipse cx="${c + 42}" cy="${y - 330}" rx="15" ry="10" fill="#fff"/>`;
  out += `<circle cx="${c - 40}" cy="${y - 330}" r="7" fill="#111827"/>`;
  out += `<circle cx="${c + 44}" cy="${y - 330}" r="7" fill="#111827"/>`;
  out += `<path d="M ${c - 64} ${y - 356} q 20 -10 40 -2" fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/>`;
  out += `<path d="M ${c + 24} ${y - 358} q 20 -8 40 2" fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/>`;
  out += `<path d="M ${c - 24} ${y - 274} q 24 18 48 0" fill="none" stroke="#9f1239" stroke-width="7" stroke-linecap="round"/>`;
  out += `<path d="M ${c} ${y - 320} l 0 22 q 8 6 14 -2" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="5" stroke-linecap="round"/>`;
  return out;
}

function drawArtwork(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-aw-${n}`) % 1000) / 1000;
  const kind = Math.floor(r(0) * 4);
  let out = '';
  // mesa
  out += `<rect x="${c - 360}" y="${y - 50}" width="720" height="56" rx="10" fill="rgba(0,0,0,0.26)"/>`;

  if (kind === 0) {
    // identidade visual: cartao + paleta
    out += `<rect x="${c - 300}" y="${y - 330}" width="330" height="210" rx="14" fill="#f8fafc"/>`;
    out += `<circle cx="${c - 220}" cy="${y - 250}" r="46" fill="#111827"/>`;
    out += `<rect x="${c - 156}" y="${y - 280}" width="150" height="18" rx="9" fill="#111827"/>`;
    out += `<rect x="${c - 156}" y="${y - 244}" width="110" height="12" rx="6" fill="rgba(17,24,39,0.4)"/>`;
    out += `<rect x="${c - 156}" y="${y - 214}" width="130" height="12" rx="6" fill="rgba(17,24,39,0.25)"/>`;
    for (let i = 0; i < 5; i += 1) {
      out += `<rect x="${c - 40}" y="${y - 330 + i * 44}" width="120" height="36" rx="8" fill="${
        ['#6366f1', '#f43f5e', '#0ea5e9', '#f59e0b', '#111827'][i]
      }"/>`;
    }
    out += `<rect x="${c + 110}" y="${y - 330}" width="190" height="230" rx="14" fill="#0f172a"/>`;
    out += `<text x="${c + 205}" y="${y - 176}" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="120" font-weight="700" fill="#f8fafc" text-anchor="middle">Aa</text>`;
    // lapis
    out += `<rect x="${c - 320}" y="${y - 92}" width="240" height="20" rx="10" fill="#f59e0b" transform="rotate(-8 ${c - 320} ${y - 92})"/>`;
  } else if (kind === 1) {
    // poster: composicao grafica grande
    out += `<rect x="${c - 250}" y="${y - 400}" width="500" height="350" rx="12" fill="#12121a"/>`;
    out += `<circle cx="${c - 60}" cy="${y - 250}" r="120" fill="#f43f5e"/>`;
    out += `<rect x="${c + 20}" y="${y - 330}" width="180" height="180" rx="90" fill="#6366f1" opacity="0.9"/>`;
    out += `<path d="M ${c - 210} ${y - 90} l 180 0 l 0 26 l -180 0 Z" fill="#f8fafc"/>`;
    out += `<path d="M ${c - 210} ${y - 132} l 120 0 l 0 26 l -120 0 Z" fill="rgba(248,250,252,0.55)"/>`;
  } else if (kind === 2) {
    // embalagem: caixa em perspectiva
    out += `<path d="M ${c - 200} ${y - 110} l 150 -90 l 250 40 l 0 130 l -250 60 l -150 -90 Z" fill="#e2e8f0"/>`;
    out += `<path d="M ${c - 200} ${y - 110} l 150 -90 l 0 170 l -150 60 Z" fill="#cbd5e1"/>`;
    out += `<path d="M ${c - 50} ${y - 200} l 250 40 l 0 130 l -250 60 Z" fill="#f8fafc"/>`;
    out += `<rect x="${c + 30}" y="${y - 130}" width="120" height="70" rx="10" fill="#0ea5e9" opacity="0.85"/>`;
    out += `<rect x="${c + 30}" y="${y - 44}" width="150" height="14" rx="7" fill="rgba(17,24,39,0.3)"/>`;
    out += `<rect x="${c + 30}" y="${y - 22}" width="110" height="12" rx="6" fill="rgba(17,24,39,0.18)"/>`;
  } else {
    // ensaio editorial: revista aberta com foto
    out += `<path d="M ${c - 300} ${y - 340} l 290 20 l 290 -20 l 0 290 l -290 24 l -290 -24 Z" fill="#f8fafc"/>`;
    out += `<rect x="${c - 268}" y="${y - 306}" width="230" height="200" rx="6" fill="#0f172a"/>`;
    out += `<circle cx="${c - 180}" cy="${y - 250}" r="46" fill="#f59e0b" opacity="0.9"/>`;
    out += `<path d="M ${c - 268} ${y - 130} l 80 -60 l 70 44 l 80 -34" fill="none" stroke="#f8fafc" stroke-width="10"/>`;
    out += `<rect x="${c - 268}" y="${y - 76}" width="200" height="14" rx="7" fill="rgba(17,24,39,0.35)"/>`;
    out += `<rect x="${c + 30}" y="${y - 300}" width="200" height="16" rx="8" fill="#111827"/>`;
    for (let i = 0; i < 7; i += 1) {
      out += `<rect x="${c + 30}" y="${y - 264 + i * 30}" width="${170 - r(i + 3) * 60}" height="10" rx="5" fill="rgba(17,24,39,0.22)"/>`;
    }
  }
  return out;
}

function drawStudio(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  // janela grande
  out += `<rect x="${c - 380}" y="${y - 420}" width="360" height="300" rx="10" fill="rgba(255,255,255,0.28)"/>`;
  out += `<line x1="${c - 200}" y1="${y - 420}" x2="${c - 200}" y2="${y - 120}" stroke="rgba(255,255,255,0.5)" stroke-width="10"/>`;
  out += `<line x1="${c - 380}" y1="${y - 270}" x2="${c - 20}" y2="${y - 270}" stroke="rgba(255,255,255,0.5)" stroke-width="10"/>`;
  // mesa de trabalho
  out += `<rect x="${c - 340}" y="${y - 130}" width="600" height="24" rx="8" fill="#a16207"/>`;
  out += `<rect x="${c - 320}" y="${y - 106}" width="20" height="106" fill="#854d0e"/>`;
  out += `<rect x="${c + 240}" y="${y - 106}" width="20" height="106" fill="#854d0e"/>`;
  // notebook e monitor
  out += `<path d="M ${c - 60} ${y - 220} l 190 0 l 16 90 l -222 0 Z" fill="#111827"/>`;
  out += `<rect x="${c - 54}" y="${y - 214}" width="178" height="78" fill="#38bdf8" opacity="0.55"/>`;
  out += `<rect x="${c + 120}" y="${y - 320}" width="180" height="120" rx="10" fill="#1f2937"/>`;
  out += `<rect x="${c + 132}" y="${y - 308}" width="156" height="96" rx="6" fill="#8b5cf6" opacity="0.6"/>`;
  // cadeira
  out += `<rect x="${c - 300}" y="${y - 110}" width="110" height="24" rx="10" fill="#1f2937"/>`;
  out += `<rect x="${c - 290}" y="${y - 200}" width="20" height="100" fill="#334155"/>`;
  out += `<rect x="${c - 300}" y="${y - 210}" width="110" height="30" rx="12" fill="#334155"/>`;
  // luminaria
  out += `<path d="M ${c + 300} ${y - 20} l 0 -300 l -60 -40" fill="none" stroke="#475569" stroke-width="12"/>`;
  out += `<path d="M ${c + 200} ${y - 380} l 60 0 l -20 46 l -20 0 Z" fill="#f8fafc" opacity="0.8"/>`;
  return out;
}

function drawOil(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 4}" rx="190" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  // galoes / latas de oleo
  out += `<path d="M ${c - 190} ${y - 40} l 0 -220 l 60 -30 l 0 -30 l 110 0 l 0 30 l 60 30 l 0 220 Z" fill="#b45309"/>`;
  out += `<path d="M ${c - 176} ${y - 56} l 0 -196 l 54 -26 l 0 -24 l 92 0 l 0 24 l 54 26 l 0 196 Z" fill="#d97706"/>`;
  out += `<rect x="${c - 120}" y="${y - 240}" width="180" height="110" rx="12" fill="#f8fafc"/>`;
  out += `<rect x="${c - 100}" y="${y - 214}" width="140" height="14" rx="7" fill="#1f2937"/>`;
  out += `<path d="M ${c - 90} ${y - 180} q 30 -26 70 0 q 30 22 70 -6" fill="none" stroke="#0f766e" stroke-width="8"/>`;
  // gota
  out += `<path d="M ${c + 180} ${y - 300} q 44 62 0 92 q -44 -30 0 -92 Z" fill="#f59e0b"/>`;
  out += `<ellipse cx="${c + 180}" cy="${y - 232}" rx="22" ry="8" fill="rgba(0,0,0,0.2)"/>`;
  // chave
  out += `<path d="M ${c + 150} ${y - 40} l 40 -90" stroke="#cbd5e1" stroke-width="16" stroke-linecap="round"/>`;
  return out;
}

function drawBrake(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h) - 40;
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 40}" rx="210" ry="26" fill="rgba(0,0,0,0.28)"/>`;
  out += `<circle cx="${c - 70}" cy="${y - 60}" r="150" fill="#475569"/>`;
  out += `<circle cx="${c - 70}" cy="${y - 60}" r="130" fill="#64748b"/>`;
  for (let i = 0; i < 20; i += 1) {
    const a = (i / 20) * Math.PI * 2;
    out += `<line x1="${c - 70 + Math.cos(a) * 60}" y1="${y - 60 + Math.sin(a) * 60}" x2="${c - 70 + Math.cos(a) * 122}" y2="${
      y - 60 + Math.sin(a) * 122
    }" stroke="rgba(17,24,39,0.35)" stroke-width="7"/>`;
  }
  out += `<circle cx="${c - 70}" cy="${y - 60}" r="52" fill="#334155"/>`;
  // pastilha
  out += `<path d="M ${c + 110} ${y - 170} q 70 0 70 70 l 0 80 q 0 40 -46 40 l -24 0 Z" fill="#1f2937"/>`;
  out += `<path d="M ${c + 118} ${y - 158} q 54 0 54 56 l 0 70 q 0 30 -38 30 l -16 0 Z" fill="#b91c1c"/>`;
  return out;
}

function drawFilter(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  out += `<ellipse cx="${c}" cy="${y + 4}" rx="180" ry="24" fill="rgba(0,0,0,0.28)"/>`;
  out += `<rect x="${c - 130}" y="${y - 250}" width="260" height="250" rx="24" fill="#e2e8f0"/>`;
  out += `<rect x="${c - 130}" y="${y - 250}" width="260" height="40" rx="20" fill="#94a3b8"/>`;
  for (let i = 0; i < 9; i += 1) {
    out += `<rect x="${c - 112 + i * 26}" y="${y - 196}" width="12" height="180" rx="6" fill="#cbd5e1"/>`;
  }
  out += `<rect x="${c - 60}" y="${y - 290}" width="120" height="46" rx="12" fill="#1f2937"/>`;
  return out;
}

function drawBar(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-bar-${n}`) % 1000) / 1000;
  let out = '';
  // parede e prateleiras de garrafas
  out += `<rect x="${c - 460}" y="${y - 350}" width="920" height="240" fill="rgba(0,0,0,0.18)"/>`;
  for (let level = 0; level < 2; level += 1) {
    const ly = y - 330 + level * 130;
    out += `<rect x="${c - 330}" y="${ly + 96}" width="660" height="14" rx="6" fill="#92400e"/>`;
    for (let i = 0; i < 14; i += 1) {
      const bh = 54 + r(level * 20 + i) * 34;
      const bw = 20 + r(level * 20 + i + 7) * 12;
      const px = c - 310 + i * 46;
      out += `<rect x="${px}" y="${ly + 96 - bh}" width="${bw}" height="${bh}" rx="6" fill="${
        ['#65a30d', '#b45309', '#0f766e', '#7c3aed', '#dc2626'][Math.floor(r(level * 20 + i + 3) * 5)]
      }"/>`;
      out += `<rect x="${px + 4}" y="${ly + 96 - bh}" width="${bw - 8}" height="16" rx="4" fill="rgba(255,255,255,0.75)"/>`;
    }
  }
  // pendentes
  for (let i = 0; i < 3; i += 1) {
    const px = c - 220 + i * 220;
    out += `<line x1="${px}" y1="${y - 420}" x2="${px}" y2="${y - 300}" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>`;
    out += `<path d="M ${px - 40} ${y - 300} l 80 0 l -14 -34 l -52 0 Z" fill="#111827"/>`;
    out += `<circle cx="${px}" cy="${y - 292}" r="10" fill="#fde68a"/>`;
  }
  // balcao
  out += `<rect x="${c - 400}" y="${y - 120}" width="800" height="34" rx="8" fill="#e2e8f0"/>`;
  out += `<rect x="${c - 400}" y="${y - 92}" width="800" height="92" fill="#7c2d12"/>`;
  for (let i = 0; i < 9; i += 1) {
    out += `<rect x="${c - 400 + i * 90}" y="${y - 92}" width="4" height="92" fill="rgba(0,0,0,0.22)"/>`;
  }
  // banquetas
  for (let i = 0; i < 3; i += 1) {
    const px = c - 250 + i * 250;
    out += `<ellipse cx="${px}" cy="${y - 74}" rx="46" ry="14" fill="#111827"/>`;
    out += `<rect x="${px - 6}" y="${y - 66}" width="12" height="66" fill="#334155"/>`;
    out += `<ellipse cx="${px}" cy="${y}" rx="34" ry="10" fill="#334155"/>`;
  }
  // copos e garrafa sobre o balcao
  out += `<rect x="${c - 150}" y="${y - 168}" width="34" height="48" rx="6" fill="rgba(255,255,255,0.9)"/>`;
  out += `<rect x="${c - 146}" y="${y - 150}" width="26" height="26" fill="#f59e0b"/>`;
  out += `<path d="M ${c + 90} ${y - 190} l 24 0 l 6 70 l -36 0 Z" fill="#166534"/>`;
  out += `<rect x="${c + 100}" y="${y - 214}" width="8" height="26" fill="#166534"/>`;
  return out;
}

function drawDiningroom(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-din-${n}`) % 1000) / 1000;
  let out = '';
  // parede com janelas altas
  out += `<rect x="${c - 460}" y="${y - 380}" width="920" height="300" fill="rgba(255,255,255,0.10)"/>`;
  for (let i = 0; i < 3; i += 1) {
    const px = c - 340 + i * 230;
    out += `<rect x="${px}" y="${y - 350}" width="150" height="200" rx="10" fill="rgba(191,219,254,0.55)"/>`;
    out += `<line x1="${px + 75}" y1="${y - 350}" x2="${px + 75}" y2="${y - 150}" stroke="rgba(255,255,255,0.5)" stroke-width="7"/>`;
    out += `<line x1="${px}" y1="${y - 250}" x2="${px + 150}" y2="${y - 250}" stroke="rgba(255,255,255,0.5)" stroke-width="7"/>`;
  }
  // pendentes
  for (let i = 0; i < 3; i += 1) {
    const px = c - 260 + i * 260;
    out += `<line x1="${px}" y1="${y - 380}" x2="${px}" y2="${y - 280}" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>`;
    out += `<path d="M ${px - 44} ${y - 280} l 88 0 l -18 40 l -52 0 Z" fill="#1f2937"/>`;
    out += `<circle cx="${px}" cy="${y - 236}" r="9" fill="#fde68a"/>`;
  }
  // mesas
  for (let i = 0; i < 2; i += 1) {
    const px = c - 210 + i * 420;
    out += `<rect x="${px - 120}" y="${y - 120}" width="240" height="18" rx="8" fill="#e2e8f0"/>`;
    out += `<rect x="${px - 100}" y="${y - 102}" width="16" height="102" fill="#94a3b8"/>`;
    out += `<rect x="${px + 84}" y="${y - 102}" width="16" height="102" fill="#94a3b8"/>`;
    out += `<circle cx="${px}" cy="${y - 132}" r="22" fill="#f8fafc"/>`;
    out += `<circle cx="${px}" cy="${y - 132}" r="12" fill="#fbbf24"/>`;
  }
  // cadeiras
  for (let i = 0; i < 4; i += 1) {
    const px = c - 190 + i * 128 + (i > 1 ? 250 : 0);
    out += `<rect x="${px - 30}" y="${y - 96}" width="60" height="14" rx="6" fill="#7c2d12"/>`;
    out += `<rect x="${px - 30}" y="${y - 170}" width="60" height="74" rx="8" fill="#92400e"/>`;
    out += `<rect x="${px - 26}" y="${y - 82}" width="10" height="82" fill="#78350f"/>`;
    out += `<rect x="${px + 16}" y="${y - 82}" width="10" height="82" fill="#78350f"/>`;
  }
  return out;
}

function drawGarage(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  let out = '';
  // parede de ferramentas
  out += `<rect x="${c - 460}" y="${y - 360}" width="920" height="280" fill="rgba(0,0,0,0.2)"/>`;
  out += `<rect x="${c - 420}" y="${y - 330}" width="300" height="180" rx="10" fill="rgba(255,255,255,0.12)"/>`;
  for (let i = 0; i < 3; i += 1) {
    out += `<rect x="${c - 400}" y="${y - 310 + i * 56}" width="260" height="6" rx="3" fill="rgba(255,255,255,0.35)"/>`;
    for (let j = 0; j < 6; j += 1) {
      const wx = c - 390 + j * 42;
      out += `<rect x="${wx}" y="${y - 306 + i * 56}" width="10" height="30" rx="4" fill="rgba(226,232,240,0.85)"/>`;
      out += `<circle cx="${wx + 5}" cy="${y - 306 + i * 56}" r="7" fill="rgba(226,232,240,0.85)"/>`;
    }
  }
  // pneus empilhados
  for (let i = 0; i < 3; i += 1) {
    out += `<ellipse cx="${c + 330}" cy="${y - 30 - i * 38}" rx="70" ry="26" fill="#111827"/>`;
    out += `<ellipse cx="${c + 330}" cy="${y - 38 - i * 38}" rx="42" ry="15" fill="#334155"/>`;
  }
  // carro no fundo
  out += `<path d="M ${c - 250} ${y - 40} q 20 -70 90 -80 l 90 0 q 40 -50 90 -50 l 40 0 q 46 0 66 52 l 40 4 q 40 8 44 74 Z" fill="#1d4ed8" opacity="0.85"/>`;
  out += `<path d="M ${c - 30} ${y - 176} l 26 -40 q 8 -10 26 -10 l 30 0 l 0 50 Z" fill="#bfdbfe" opacity="0.85"/>`;
  out += `<path d="M ${c + 66} ${y - 176} l 0 -50 l 30 0 q 26 0 40 16 l 24 34 Z" fill="#bfdbfe" opacity="0.85"/>`;
  // elevador/maca de oficina
  out += `<rect x="${c - 330}" y="${y - 30}" width="300" height="18" rx="6" fill="#475569"/>`;
  out += `<rect x="${c - 310}" y="${y - 12}" width="22" height="12" fill="#334155"/>`;
  out += `<rect x="${c - 90}" y="${y - 12}" width="22" height="12" fill="#334155"/>`;
  // caixa de ferramentas
  out += `<rect x="${c - 420}" y="${y - 70}" width="120" height="70" rx="8" fill="#b91c1c"/>`;
  out += `<rect x="${c - 420}" y="${y - 84}" width="120" height="18" rx="6" fill="#7f1d1d"/>`;
  out += `<path d="M ${c - 386} ${y - 84} q 26 -30 52 0" fill="none" stroke="#e2e8f0" stroke-width="7"/>`;
  // chao
  out += `<rect x="${c - 460}" y="${y - 80}" width="920" height="80" fill="rgba(0,0,0,0.22)"/>`;
  return out;
}

function drawAbstract(w, h, seed, variant) {
  const c = cx(w);
  const y = base(h);
  const r = (n) => (hash(`${seed}-ab-${n}`) % 1000) / 1000;
  let out = '';
  // cartoes empilhados: leitura de "midia"/"item" sem depender de assunto
  for (let i = 0; i < 3; i += 1) {
    const off = i * 26;
    out += `<rect x="${c - 190 + off}" y="${y - 100 - off}" width="380" height="220" rx="20" fill="rgba(255,255,255,${
      0.16 + i * 0.12
    })" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
  }
  out += `<circle cx="${c - 60}" cy="${y - 40}" r="70" fill="rgba(255,255,255,0.35)"/>`;
  out += `<rect x="${c + 20}" y="${y - 80}" width="110" height="80" rx="16" fill="rgba(255,255,255,0.28)"/>`;
  for (let i = 0; i < 3; i += 1) {
    out += `<rect x="${c - 60}" y="${y + 40 + i * 0}" width="${80 + r(i) * 90}" height="12" rx="6" fill="rgba(255,255,255,0.4)"/>`;
  }
  return out;
}

const DRAWERS = {
  pizza: drawPizza,
  burger: drawBurger,
  fries: drawFries,
  bread: drawBread,
  drink: drawDrink,
  coffee: drawCoffee,
  juice: drawDrink,
  dessert: drawDessert,
  board: drawPlate,
  salad: drawSalad,
  sushi: drawSushi,
  plate: drawPlate,
  haircut: drawHaircut,
  chair: drawChair,
  tools: drawTools,
  bottle: drawBottle,
  car: drawCar,
  wheel: drawWheel,
  oil: drawOil,
  brake: drawBrake,
  filter: drawFilter,
  parts: drawParts,
  service: drawService,
  dress: drawDress,
  shirt: drawShirt,
  pants: drawPants,
  shoe: drawShoe,
  bag: drawBag,
  accessory: drawAccessory,
  storefront: drawStorefront,
  barbershop: drawBarbershop,
  produce: drawProduce,
  bakery: drawBakery,
  shelf: drawShelf,
  drinkshelf: drawDrinkshelf,
  market: drawMarket,
  tooth: drawTooth,
  room: drawRoom,
  procedure: drawProcedure,
  portrait: drawPortrait,
  artwork: drawArtwork,
  studio: drawStudio,
  bar: drawBar,
  diningroom: drawDiningroom,
  garage: drawGarage,
  abstract: drawAbstract,
};

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Gera um SVG ilustrativo deterministico (mesmo id -> mesmo desenho).
 */
export function buildIllustration({ id, title, segment, caption, width = 1200, height = 800, variant = 0 }) {
  const palette = sample(id, variant, PALETTES[segment] ?? PALETTES.geral);
  const motif = sample(id, variant + 1, MOTIFS);
  const [c1, c2] = palette;
  const angleSeed = hash(id) % 90;
  const subject = subjectFor(title, segment);
  const draw = DRAWERS[subject] ?? drawAbstract;
  const subjectSvg = draw(width, height, `${id}|${title}`, variant);
  // Os desenhos usam `base(height) = height - 110` como linha de apoio. Aqui a
  // cena e ampliada em torno do centro X e apoiada numa linha fixa, para o
  // objeto ocupar o quadro em vez de ficar pequeno no meio da tela.
  const scale = 1.26;
  const groundY = height - 150;
  const tx = (width / 2) * (1 - scale);
  const ty = groundY - scale * (height - 110);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(
    title,
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${(angleSeed / 100).toFixed(2)}" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="18%" r="80%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.22)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  ${motifMarkup(motif, id, width, height)}
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g transform="matrix(${scale} 0 0 ${scale} ${tx.toFixed(1)} ${ty.toFixed(1)})">${subjectSvg}</g>
  <rect x="0" y="${height - 104}" width="${width}" height="104" fill="url(#shade)"/>
  <text x="44" y="${height - 54}" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="32" font-weight="600" fill="rgba(255,255,255,0.97)">${escapeXml(
    title,
  )}</text>
  <text x="44" y="${height - 22}" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.78)">${escapeXml(
    caption || 'Ilustracao gerada pelo sistema - meramente ilustrativa',
  )}</text>
</svg>`;
  return svg;
}

/** Exportado para testes e para a UI mostrar o assunto detectado. */
export { subjectFor };
