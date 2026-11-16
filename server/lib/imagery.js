/**
 * Gerador de ilustracoes locais.
 *
 * As imagens da biblioteca demonstrativa sao ILUSTRACOES vetoriais geradas
 * pelo proprio sistema (gradientes + formas), sem marcas, pessoas ou fotos de
 * terceiros. Por isso entram como `license = 'illustrative'` e a interface
 * sempre exibe o selo "Ilustrativa". Nenhum arquivo de banco de imagens externo
 * e baixado: o sistema nunca assume direito de uso.
 */

const PALETTES = {
  restaurante: [['#f97316', '#dc2626'], ['#f59e0b', '#b45309'], ['#ef4444', '#7f1d1d'], ['#fbbf24', '#ea580c']],
  barbearia: [['#1f2937', '#0f172a'], ['#b45309', '#78350f'], ['#334155', '#0b1220'], ['#0ea5e9', '#075985']],
  oficina: [['#1d4ed8', '#0f172a'], ['#0f766e', '#134e4a'], ['#475569', '#111827'], ['#f59e0b', '#1f2937']],
  loja: [['#db2777', '#831843'], ['#a855f7', '#4c1d95'], ['#0d9488', '#134e4a'], ['#e11d48', '#500724']],
  mercado: [['#16a34a', '#14532d'], ['#65a30d', '#3f6212'], ['#f59e0b', '#92400e'], ['#0ea5e9', '#0c4a6e']],
  clinica: [['#0ea5e9', '#0c4a6e'], ['#14b8a6', '#134e4a'], ['#6366f1', '#312e81'], ['#38bdf8', '#1e3a8a']],
  portfolio: [['#6366f1', '#1e1b4b'], ['#f43f5e', '#4c0519'], ['#0f172a', '#334155'], ['#8b5cf6', '#2e1065']],
  geral: [['#2563eb', '#0f172a'], ['#0ea5e9', '#164e63'], ['#64748b', '#111827'], ['#f59e0b', '#7c2d12']],
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

function motifMarkup(kind, seed, w, h) {
  const r = (n) => (hash(`${seed}-m-${n}`) % 1000) / 1000;
  const light = 'rgba(255,255,255,0.16)';
  const lighter = 'rgba(255,255,255,0.09)';
  const dark = 'rgba(0,0,0,0.14)';

  switch (kind) {
    case 'circles': {
      let out = '';
      for (let i = 0; i < 7; i += 1) {
        const cx = Math.round(r(i) * w);
        const cy = Math.round(r(i + 20) * h);
        const rad = Math.round(30 + r(i + 40) * 150);
        out += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${i % 2 ? lighter : light}"/>`;
      }
      return out;
    }
    case 'arcs': {
      let out = '';
      for (let i = 0; i < 5; i += 1) {
        const cx = Math.round(w * (i / 5) + 40);
        out += `<path d="M ${cx} ${h} a ${Math.round(90 + i * 26)} ${Math.round(90 + i * 26)} 0 0 1 ${Math.round(
          180 + i * 52,
        )} 0" fill="${i % 2 ? light : lighter}"/>`;
      }
      return out;
    }
    case 'grid': {
      let out = '';
      const step = 72;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          if (r(x + y) > 0.55) out += `<rect x="${x}" y="${y}" width="${step - 12}" height="${step - 12}" rx="14" fill="${light}"/>`;
        }
      }
      return out;
    }
    case 'waves': {
      let out = '';
      for (let i = 0; i < 4; i += 1) {
        const y = Math.round(h * (0.45 + i * 0.14));
        out += `<path d="M0 ${y} Q ${w * 0.25} ${y - 90} ${w * 0.5} ${y} T ${w} ${y} V ${h} H 0 Z" fill="${
          i % 2 ? lighter : light
        }"/>`;
      }
      return out;
    }
    case 'diagonal': {
      return `<path d="M0 ${h} L ${w * 0.55} 0 L ${w} 0 L ${w * 0.35} ${h} Z" fill="${light}"/>
              <path d="M ${w * 0.45} ${h} L ${w} ${h * 0.15} L ${w} ${h} Z" fill="${lighter}"/>`;
    }
    case 'blobs': {
      let out = '';
      for (let i = 0; i < 3; i += 1) {
        const cx = Math.round(r(i) * w);
        const cy = Math.round(r(i + 30) * h);
        out += `<ellipse cx="${cx}" cy="${cy}" rx="${Math.round(160 + r(i + 50) * 180)}" ry="${Math.round(
          110 + r(i + 70) * 140,
        )}" fill="${i % 2 ? light : dark}" transform="rotate(${Math.round(r(i + 90) * 60 - 30)} ${cx} ${cy})"/>`;
      }
      return out;
    }
    case 'rings': {
      let out = '';
      const cx = Math.round(w * (0.25 + r(1) * 0.5));
      const cy = Math.round(h * (0.3 + r(2) * 0.4));
      for (let i = 6; i > 0; i -= 1) {
        out += `<circle cx="${cx}" cy="${cy}" r="${i * 62}" fill="none" stroke="${
          i % 2 ? light : lighter
        }" stroke-width="18"/>`;
      }
      return out;
    }
    case 'stripes':
    default: {
      let out = '';
      const gap = 58;
      for (let x = -h; x < w; x += gap) {
        out += `<rect x="${x}" y="0" width="24" height="${h * 2}" fill="${lighter}" transform="rotate(24 ${x} 0)"/>`;
      }
      return out;
    }
  }
}

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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(
    title,
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${(angleSeed / 100).toFixed(2)}" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="20%" r="80%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  ${motifMarkup(motif, id, width, height)}
  <rect x="0" y="${height - 96}" width="${width}" height="96" fill="rgba(0,0,0,0.22)"/>
  <text x="44" y="${height - 52}" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="rgba(255,255,255,0.96)">${escapeXml(
    title,
  )}</text>
  <text x="44" y="${height - 22}" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.75)">${escapeXml(
    caption || 'Ilustracao gerada pelo sistema - meramente ilustrativa',
  )}</text>
</svg>`;
  return svg;
}
