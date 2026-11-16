/**
 * Modelo de configuracao de site.
 *
 * Um config e SEMPRE autocontido: nao contem referencias mutaveis a templates.
 * Ao criar um site a partir de um template fazemos structuredClone do config do
 * template, gravamos como JSON proprio na linha de `sites`. A partir dai, o
 * template e o site seguem caminhos independentes.
 */

export const SECTION_TYPES = [
  'hero',
  'about',
  'features',
  'catalog',
  'gallery',
  'team',
  'testimonials',
  'hours',
  'contact',
  'cta',
  'faq',
  'stats',
  'steps',
  'brands',
  'menu-highlights',
  'booking',
];

export const FONT_OPTIONS = [
  { id: 'geometric', name: 'Geometrica (modererna)' },
  { id: 'serif', name: 'Serifada (classica)' },
  { id: 'condensed', name: 'Condensada (impacto)' },
  { id: 'humanist', name: 'Humanista (amigavel)' },
  { id: 'script', name: 'Manuscrita (delicada)' },
];

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function slugify(input = '') {
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'site';
}

export function deepClone(value) {
  return structuredClone(value);
}

function str(value, max = 2000) {
  if (value == null) return '';
  return String(value).slice(0, max);
}

function color(value, fallback) {
  const candidate = String(value ?? '').trim();
  return HEX.test(candidate) ? candidate : fallback;
}

function num(value, fallback, min = 0, max = 999) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function imageId(value) {
  if (value == null) return null;
  const id = String(value).trim();
  return id && /^[a-zA-Z0-9_-]{1,64}$/.test(id) ? id : null;
}

function list(value, max = 40) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

/* ------------------------------------------------------------------ */
/* Valor padrao de um config (usado para normalizar e para testes)     */
/* ------------------------------------------------------------------ */

export function emptyConfig(name = 'Novo site') {
  return {
    schemaVersion: 1,
    identity: {
      name,
      tagline: '',
      description: '',
      logoImageId: null,
      logoText: name,
      showLogoText: true,
    },
    theme: {
      primary: '#111827',
      secondary: '#374151',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f4f4f5',
      text: '#111827',
      muted: '#6b7280',
      radius: 12,
      fontHeading: 'geometric',
      fontBody: 'humanist',
      density: 'comfortable',
    },
    navigation: [],
    sections: [],
    products: { categories: [], items: [] },
    contact: {
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      mapUrl: '',
      hours: [],
      noteHours: '',
    },
    links: [],
    media: { coverImageId: null, thumbnailImageId: null },
    seo: { title: name, description: '', keywords: '' },
    footer: { text: '', note: '' },
  };
}

/* ------------------------------------------------------------------ */
/* Normalizacao / validacao                                            */
/* ------------------------------------------------------------------ */

function normalizeSection(section, index) {
  const type = SECTION_TYPES.includes(section?.type) ? section.type : 'about';
  const props = section?.props && typeof section.props === 'object' ? section.props : {};
  return {
    id: str(section?.id || `sec-${index + 1}`, 64),
    type,
    label: str(section?.label || type, 80),
    enabled: section?.enabled !== false,
    variant: str(section?.variant || 'default', 40),
    props: normalizeProps(type, props),
  };
}

function normalizeProps(type, props) {
  switch (type) {
    case 'hero':
      return {
        eyebrow: str(props.eyebrow, 80),
        title: str(props.title, 160),
        subtitle: str(props.subtitle, 400),
        imageId: imageId(props.imageId),
        align: ['left', 'center', 'right'].includes(props.align) ? props.align : 'left',
        overlay: num(props.overlay, 45, 0, 90),
        primaryLabel: str(props.primaryLabel, 40),
        primaryHref: str(props.primaryHref, 200),
        secondaryLabel: str(props.secondaryLabel, 40),
        secondaryHref: str(props.secondaryHref, 200),
        badges: list(props.badges, 6).map((b) => str(b, 40)),
      };
    case 'about':
      return {
        title: str(props.title, 160),
        body: str(props.body, 4000),
        imageId: imageId(props.imageId),
        highlights: list(props.highlights, 8).map((b) => str(b, 160)),
        layout: ['image-left', 'image-right', 'stacked'].includes(props.layout) ? props.layout : 'image-right',
      };
    case 'features':
      return {
        title: str(props.title, 160),
        subtitle: str(props.subtitle, 300),
        items: list(props.items, 12).map((item) => ({
          icon: str(item?.icon || 'star', 24),
          title: str(item?.title, 80),
          body: str(item?.body, 300),
        })),
      };
    case 'catalog':
      return {
        title: str(props.title, 160),
        subtitle: str(props.subtitle, 300),
        mode: ['cards', 'compact', 'gallery'].includes(props.mode) ? props.mode : 'cards',
        showPrices: props.showPrices !== false,
        columns: num(props.columns, 3, 1, 4),
        categoryFilter: props.categoryFilter !== false,
        ctaLabel: str(props.ctaLabel, 40),
      };
    case 'gallery':
      return {
        title: str(props.title, 160),
        subtitle: str(props.subtitle, 300),
        imageIds: list(props.imageIds, 24).map(imageId).filter(Boolean),
        columns: num(props.columns, 3, 1, 4),
        layout: ['grid', 'masonry', 'carousel'].includes(props.layout) ? props.layout : 'grid',
      };
    case 'team':
      return {
        title: str(props.title, 160),
        subtitle: str(props.subtitle, 300),
        members: list(props.members, 12).map((m) => ({
          name: str(m?.name, 80),
          role: str(m?.role, 80),
          imageId: imageId(m?.imageId),
          bio: str(m?.bio, 300),
        })),
      };
    case 'testimonials':
      return {
        title: str(props.title, 160),
        subtitle: str(props.subtitle, 300),
        items: list(props.items, 12).map((t) => ({
          quote: str(t?.quote, 400),
          author: str(t?.author, 80),
          detail: str(t?.detail, 80),
          rating: num(t?.rating, 5, 1, 5),
        })),
      };
    case 'hours':
      return {
        title: str(props.title, 120),
        subtitle: str(props.subtitle, 200),
        days: list(props.days, 7).map((d) => ({
          label: str(d?.label, 40),
          open: str(d?.open, 10),
          close: str(d?.close, 10),
          closed: d?.closed === true,
        })),
        note: str(props.note, 200),
      };
    case 'contact':
      return {
        title: str(props.title, 120),
        subtitle: str(props.subtitle, 300),
        showMap: props.showMap !== false,
        showForm: props.showForm !== false,
        formCta: str(props.formCta || 'Enviar mensagem', 40),
      };
    case 'cta':
      return {
        title: str(props.title, 140),
        body: str(props.body, 400),
        label: str(props.label, 40),
        href: str(props.href, 200),
        imageId: imageId(props.imageId),
      };
    case 'faq':
      return {
        title: str(props.title, 140),
        subtitle: str(props.subtitle, 300),
        items: list(props.items, 14).map((q) => ({
          question: str(q?.question, 200),
          answer: str(q?.answer, 1000),
        })),
      };
    case 'stats':
      return {
        title: str(props.title, 120),
        items: list(props.items, 6).map((s) => ({
          value: str(s?.value, 16),
          label: str(s?.label, 60),
        })),
      };
    case 'steps':
      return {
        title: str(props.title, 140),
        subtitle: str(props.subtitle, 300),
        items: list(props.items, 8).map((s) => ({
          title: str(s?.title, 80),
          body: str(s?.body, 300),
        })),
      };
    case 'brands':
      return {
        title: str(props.title, 120),
        items: list(props.items, 12).map((b) => ({ name: str(b?.name, 60), imageId: imageId(b?.imageId) })),
      };
    case 'menu-highlights':
      return {
        title: str(props.title, 140),
        subtitle: str(props.subtitle, 300),
        itemIds: list(props.itemIds, 12).map((id) => str(id, 64)),
        layout: ['feature', 'grid'].includes(props.layout) ? props.layout : 'feature',
      };
    case 'booking':
      return {
        title: str(props.title, 140),
        body: str(props.body, 500),
        label: str(props.label || 'Agendar', 40),
        href: str(props.href, 200),
        channels: list(props.channels, 4).map((c) => str(c, 40)),
      };
    default:
      return {};
  }
}

function normalizeTheme(theme, base) {
  const source = theme && typeof theme === 'object' ? theme : {};
  return {
    primary: color(source.primary, base.primary),
    secondary: color(source.secondary, base.secondary),
    accent: color(source.accent, base.accent),
    background: color(source.background, base.background),
    surface: color(source.surface, base.surface),
    text: color(source.text, base.text),
    muted: color(source.muted, base.muted),
    radius: num(source.radius, base.radius, 0, 40),
    fontHeading: FONT_OPTIONS.some((f) => f.id === source.fontHeading) ? source.fontHeading : base.fontHeading,
    fontBody: FONT_OPTIONS.some((f) => f.id === source.fontBody) ? source.fontBody : base.fontBody,
    density: ['compact', 'comfortable', 'spacious'].includes(source.density) ? source.density : base.density,
  };
}

export function normalizeConfig(input = {}, fallbackName = 'Novo site') {
  const base = emptyConfig(fallbackName);
  const source = input && typeof input === 'object' ? input : {};
  const identity = source.identity && typeof source.identity === 'object' ? source.identity : {};
  const contact = source.contact && typeof source.contact === 'object' ? source.contact : {};
  const products = source.products && typeof source.products === 'object' ? source.products : {};
  const seo = source.seo && typeof source.seo === 'object' ? source.seo : {};
  const footer = source.footer && typeof source.footer === 'object' ? source.footer : {};

  const name = str(identity.name, 120).trim() || fallbackName;

  const categories = list(products.categories, 30).map((c, i) => ({
    id: str(c?.id || `cat-${i + 1}`, 64),
    name: str(c?.name, 60),
    description: str(c?.description, 200),
    order: num(c?.order, i, 0, 99),
  }));

  const categoryIds = new Set(categories.map((c) => c.id));
  const items = list(products.items, 200).map((item, i) => ({
    id: str(item?.id || `item-${i + 1}`, 64),
    name: str(item?.name, 100),
    description: str(item?.description, 400),
    price: item?.price == null || item?.price === '' ? null : num(item.price, 0, 0, 1_000_000),
    priceNote: str(item?.priceNote, 60),
    categoryId: categoryIds.has(item?.categoryId) ? item.categoryId : null,
    imageId: imageId(item?.imageId),
    badge: str(item?.badge, 24),
    featured: item?.featured === true,
    active: item?.active !== false,
    order: num(item?.order, i, 0, 999),
  }));

  return {
    schemaVersion: 1,
    identity: {
      name,
      tagline: str(identity.tagline, 160),
      description: str(identity.description, 600),
      logoImageId: imageId(identity.logoImageId),
      logoText: str(identity.logoText || name, 60),
      showLogoText: identity.showLogoText !== false,
    },
    theme: normalizeTheme(source.theme, base.theme),
    navigation: list(source.navigation, 10).map((n) => ({
      label: str(n?.label, 40),
      href: str(n?.href || '#', 200),
    })),
    sections: list(source.sections, 24).map(normalizeSection),
    products: { categories, items },
    contact: {
      phone: str(contact.phone, 40),
      whatsapp: str(contact.whatsapp, 40),
      email: str(contact.email, 120),
      address: str(contact.address, 240),
      city: str(contact.city, 120),
      mapUrl: str(contact.mapUrl, 400),
      hours: list(contact.hours, 7).map((h) => ({
        label: str(h?.label, 40),
        open: str(h?.open, 10),
        close: str(h?.close, 10),
        closed: h?.closed === true,
      })),
      noteHours: str(contact.noteHours, 200),
    },
    media: {
      coverImageId: imageId(source.media?.coverImageId),
      thumbnailImageId: imageId(source.media?.thumbnailImageId),
    },
    links: list(source.links, 10).map((l) => ({
      label: str(l?.label, 40),
      type: str(l?.type || 'link', 24),
      value: str(l?.value, 300),
    })),
    seo: {
      title: str(seo.title || name, 120),
      description: str(seo.description, 300),
      keywords: str(seo.keywords, 300),
    },
    footer: { text: str(footer.text, 300), note: str(footer.note, 300) },
  };
}

/* ------------------------------------------------------------------ */
/* Stamping de placeholders                                            */
/* ------------------------------------------------------------------ */

/**
 * Preenche marcadores {{clientName}}, {{city}} etc. no config do site.
 * Usado tanto na criacao quanto em "atualizar dados basicos".
 */
export function applyPlaceholders(config, data = {}) {
  const map = {
    clientName: data.name ?? '',
    city: data.city ?? '',
    phone: data.phone ?? '',
    whatsapp: data.whatsapp ?? '',
    email: data.email ?? '',
    address: data.address ?? '',
  };
  const replace = (value) =>
    typeof value === 'string'
      ? value.replace(/\{\{(\w+)\}\}/g, (match, key) => (map[key] !== undefined ? map[key] : match))
      : value;

  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v)]));
    }
    return replace(node);
  };
  const result = walk(config);
  if (!result || typeof result !== 'object') return result;
  result.identity = result.identity && typeof result.identity === 'object' ? result.identity : {};
  result.seo = result.seo && typeof result.seo === 'object' ? result.seo : {};
  result.contact = result.contact && typeof result.contact === 'object' ? result.contact : {};
  if (data.name) {
    result.identity.name = data.name;
    result.identity.logoText = data.name;
    result.seo.title = result.seo.title
      ? String(result.seo.title).replace(/\{\{clientName\}\}/g, data.name)
      : data.name;
    if (!result.seo.title) result.seo.title = data.name;
  }
  if (data.city && typeof result.contact.city === 'string') {
    result.contact.city = result.contact.city.replace(/\{\{city\}\}/g, data.city);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Diff de config (usado para versionamento e resumo de alteracoes)    */
/* ------------------------------------------------------------------ */

export function configStatus(config) {
  const sections = config.sections.filter((s) => s.enabled).length;
  const images = new Set();
  for (const s of config.sections) {
    if (s.props?.imageId) images.add(s.props.imageId);
    for (const key of ['imageIds']) if (Array.isArray(s.props?.[key])) s.props[key].forEach((i) => images.add(i));
    for (const m of s.props?.members ?? []) if (m.imageId) images.add(m.imageId);
  }
  return {
    sections: sections,
    products: config.products.items.length,
    categories: config.products.categories.length,
    images: images.size,
  };
}

/** Resume alteracoes entre dois configs, sem expor dados sensiveis. */
export function summarizeChanges(before, after) {
  const label = (s) => (s?.label ? String(s.label) : s?.type);
  const changes = [];
  if (before.identity.name !== after.identity.name) changes.push('nome do site');
  if (JSON.stringify(before.theme) !== JSON.stringify(after.theme)) changes.push('tema visual');
  if (JSON.stringify(before.identity) !== JSON.stringify(after.identity)) changes.push('identidade/logotipo');
  const beforeLabels = before.sections.map(label);
  const afterLabels = after.sections.map(label);
  for (const l of afterLabels) if (!beforeLabels.includes(l)) changes.push(`secao "${l}" criada`);
  for (const l of beforeLabels) if (!afterLabels.includes(l)) changes.push(`secao "${l}" removida`);
  for (const s of after.sections) {
    const prev = before.sections.find((p) => p.id === s.id);
    if (prev && JSON.stringify(prev) !== JSON.stringify(s)) changes.push(`secao "${label(s)}" atualizada`);
  }
  if (JSON.stringify(before.products) !== JSON.stringify(after.products)) {
    const delta = after.products.items.length - before.products.items.length;
    changes.push(delta === 0 ? 'catalogo atualizado' : `catalogo (${delta > 0 ? '+' : ''}${delta} itens)`);
  }
  if (JSON.stringify(before.contact) !== JSON.stringify(after.contact)) changes.push('contatos/horarios');
  if (JSON.stringify(before.links) !== JSON.stringify(after.links)) changes.push('links');
  if (JSON.stringify(before.media) !== JSON.stringify(after.media)) changes.push('imagens de capa/miniatura');
  if (JSON.stringify(before.seo) !== JSON.stringify(after.seo)) changes.push('SEO');
  if (JSON.stringify(before.footer) !== JSON.stringify(after.footer)) changes.push('rodape');
  if (JSON.stringify(before.navigation) !== JSON.stringify(after.navigation)) changes.push('menu');
  return changes.length ? changes : ['ajustes gerais'];
}

/* ------------------------------------------------------------------ */
/* Referencias de imagem                                              */
/* ------------------------------------------------------------------ */

/** Coleta todos os ids de imagem referenciados em qualquer ponto do config. */
export function collectImageIds(config) {
  const ids = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if ((key === 'imageId' || key === 'imageIds' || key === 'logoImageId' || key === 'coverImageId' || key === 'thumbnailImageId')) {
          if (typeof value === 'string') ids.add(value);
          else if (Array.isArray(value)) value.forEach((v) => typeof v === 'string' && ids.add(v));
          else if (value && typeof value === 'object' && typeof value.id === 'string') ids.add(value.id);
        } else {
          walk(value);
        }
      }
    }
  };
  walk(config);
  return [...ids];
}
