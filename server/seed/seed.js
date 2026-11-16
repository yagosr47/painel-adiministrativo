import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getDb, run, get, all, MEDIA_DIR, tx } from '../db/index.js';
import { hashPassword, newId } from '../lib/auth.js';
import { logActivity } from '../lib/activity.js';
import { normalizeConfig, configStatus, slugify } from '../lib/config.js';
import { buildIllustration } from '../lib/imagery.js';
import { SEGMENTS, TEMPLATES, buildLibraryRecords } from './catalog.js';

const now = () => new Date().toISOString();

function insertSegments() {
  SEGMENTS.forEach((segment, index) => {
    run(
      `INSERT INTO segments (slug, name, description, icon, position) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET name=excluded.name, description=excluded.description,
         icon=excluded.icon, position=excluded.position`,
      [segment.slug, segment.name, segment.description, segment.icon, index],
    );
    segment.categories.forEach((cat, i) => {
      run(
        `INSERT INTO image_categories (id, segment_slug, slug, name, description, position)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(segment_slug, slug) DO UPDATE SET name=excluded.name, position=excluded.position`,
        [`cat_${segment.slug}_${cat.slug}`, segment.slug, cat.slug, cat.name, '', i],
      );
    });
  });
}

function insertUsers() {
  const email = process.env.PANEL_ADMIN_EMAIL || 'admin@painel.local';
  const password = process.env.PANEL_ADMIN_PASSWORD || 'admin123';
  const existing = get('SELECT id FROM users WHERE lower(email) = lower(?)', [email]);
  if (existing) return existing.id;
  const id = newId('usr');
  run(
    `INSERT INTO users (id, name, email, password_hash, role, active, created_at)
     VALUES (?, ?, ?, ?, 'admin', 1, ?)`,
    [id, 'Administrador', email, hashPassword(password), now()],
  );
  return id;
}

function insertLibraryImages(userId) {
  const records = buildLibraryRecords();
  const catalogCats = new Map();
  for (const segment of SEGMENTS) {
    catalogCats.set(segment.slug, new Set(segment.categories.map((c) => c.slug)));
  }

  for (const record of records) {
    const exists = get('SELECT id, source, owner_client_id, license, file_ext FROM images WHERE id = ?', [record.id]);

    // Imagem de biblioteca ja existente: reescreve o arquivo demonstrativo com o
    // gerador atual. Isso mantem bancos antigos atualizados quando o desenho
    // melhora. Nunca toca em uploads do cliente nem em imagens substituidas.
    const isLibraryDefault =
      exists && exists.source === 'library' && !exists.owner_client_id && exists.license === 'illustrative' && exists.file_ext === 'svg';
    if (exists && !isLibraryDefault) continue;

    if (!catalogCats.get(record.segment_slug)?.has(record.category_slug)) {
      run(
        `INSERT INTO image_categories (id, segment_slug, slug, name, description, position)
         VALUES (?, ?, ?, ?, '', 90)
         ON CONFLICT(segment_slug, slug) DO NOTHING`,
        [`cat_${record.segment_slug}_${record.category_slug}`, record.segment_slug, record.category_slug, prettify(record.category_slug)],
      );
    }

    const svg = buildIllustration({
      id: record.id,
      title: record.title,
      segment: record.segment_slug,
      caption: `${record.title} - imagem ilustrativa gerada pelo sistema`,
      width: record.width,
      height: record.height,
    });
    const dir = path.join(MEDIA_DIR, 'library', record.segment_slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${record.id}.svg`), svg, 'utf8');

    if (exists) {
      run('UPDATE images SET file_size = ?, updated_at = ? WHERE id = ?', [Buffer.byteLength(svg), now(), record.id]);
      continue;
    }

    run(
      `INSERT INTO images (id, segment_slug, category_slug, title, alt, tags, width, height, source,
         license, license_note, owner_client_id, is_cover, file_ext, file_size, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'library', ?, ?, NULL, ?, 'svg', ?, ?, ?, ?)`,
      [
        record.id,
        record.segment_slug,
        record.category_slug,
        record.title,
        record.alt,
        JSON.stringify(record.tags),
        record.width,
        record.height,
        record.license,
        record.license_note,
        record.is_cover ? 1 : 0,
        Buffer.byteLength(svg),
        userId,
        now(),
        now(),
      ],
    );
  }
}

function prettify(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function insertTemplates(userId) {
  for (const tpl of TEMPLATES) {
    const config = normalizeConfig(tpl.config, tpl.name);
    const stats = configStatus(config);
    run(
      `INSERT INTO templates (id, slug, name, segment_slug, category, summary, description, status, version,
         cover_image_id, thumbnail_image_id, accent, config, sections_count, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         name=excluded.name, segment_slug=excluded.segment_slug, category=excluded.category,
         summary=excluded.summary, description=excluded.description, cover_image_id=excluded.cover_image_id,
         thumbnail_image_id=excluded.thumbnail_image_id, accent=excluded.accent,
         config=excluded.config, sections_count=excluded.sections_count, updated_at=excluded.updated_at`,
      [
        newId('tpl'),
        tpl.slug,
        tpl.name,
        tpl.segment_slug,
        tpl.category,
        tpl.summary,
        tpl.description,
        tpl.cover,
        tpl.thumbnail,
        tpl.accent,
        JSON.stringify(config),
        stats.sections,
        userId,
        now(),
        now(),
      ],
    );
    const tplRow = get('SELECT id FROM templates WHERE slug = ?', [tpl.slug]);
    const already = get('SELECT COUNT(*) AS total FROM activity_log WHERE entity = ? AND entity_id = ?', ['template', tplRow.id]);
    if (!already.total) {
      logActivity({ id: userId, name: 'Administrador' }, 'template.created', 'template', tplRow.id, `Template "${tpl.name}" publicado como modelo inicial`);
    }
  }
}

const DEMO_CLIENTS = [
  {
    name: 'Pizzaria Bella Massa',
    templateSlug: 'forno-italiano',
    segment: 'restaurantes',
    city: 'Uberlandia',
    contact_name: 'Marcelo Bianchi',
    contact_email: 'contato@bellamassa.com.br',
    contact_phone: '(34) 99812-4477',
    subdomain: 'bella-massa',
    status: 'published',
    overrides: (config) => {
      config.theme.primary = '#7f1d1d';
      config.theme.accent = '#fbbf24';
      config.identity.tagline = 'Pizza de fermentacao lenta no coracao de Uberlandia';
      config.contact.address = 'Rua Rio Branco, 480 - Centro';
      config.sections.find((s) => s.id === 'hero').props.title = 'A pizza que virou tradicao na Rio Branco';
      return config;
    },
  },
  {
    name: 'Barbearia Dom Corte',
    templateSlug: 'navalha-de-ouro',
    segment: 'barbearias',
    city: 'Uberlandia',
    contact_name: 'Wellington Prado',
    contact_email: 'contato@domcorte.com.br',
    contact_phone: '(34) 99145-3320',
    subdomain: 'dom-corte',
    status: 'published',
    overrides: (config) => {
      config.theme.accent = '#0ea5e9';
      config.identity.tagline = 'Corte, barba e cafe coado';
      config.contact.address = 'Av. Joao Naves de Avila, 1200 - Loja 4';
      return config;
    },
  },
  {
    name: 'Clinica Bela Vida',
    templateSlug: 'clinica-vitalis',
    segment: 'clinicas',
    city: 'Uberlandia',
    contact_name: 'Dra. Renata Aguiar',
    contact_email: 'contato@belavida.com.br',
    contact_phone: '(34) 3232-1188',
    subdomain: 'bela-vida',
    status: 'draft',
    overrides: (config) => {
      config.theme.primary = '#134e4a';
      config.theme.accent = '#0d9488';
      config.identity.tagline = 'Cuidado integral para a sua familia';
      return config;
    },
  },
];

function applyPlaceholdersForDemo(config, client) {
  const map = {
    clientName: client.name,
    city: client.city,
    phone: client.contact_phone,
    whatsapp: client.contact_phone.replace(/\D/g, ''),
    email: client.contact_email,
    address: client.contact_address ?? '',
  };
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v)]));
    }
    if (typeof node !== 'string') return node;
    return node.replace(/\{\{(\w+)\}\}/g, (match, key) => (map[key] !== undefined ? map[key] : match));
  };
  const result = walk(config);
  result.identity.name = client.name;
  result.identity.logoText = client.name;
  result.seo.title = `${client.name} | ${client.city}`;
  return result;
}

function insertDemoClients(userId) {
  for (const demo of DEMO_CLIENTS) {
    const existing = get('SELECT id FROM clients WHERE slug = ?', [demo.subdomain]);
    if (existing) continue;

    const clientId = newId('cli');
    run(
      `INSERT INTO clients (id, name, slug, segment_slug, contact_name, contact_email, contact_phone,
         status, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', '', ?, ?, ?)`,
      [
        clientId,
        demo.name,
        demo.subdomain,
        demo.segment,
        demo.contact_name,
        demo.contact_email,
        demo.contact_phone,
        userId,
        now(),
        now(),
      ],
    );

    const tpl = get('SELECT * FROM templates WHERE slug = ?', [demo.templateSlug]);
    if (!tpl) continue;

    let config = structuredClone(JSON.parse(tpl.config));
    config = applyPlaceholdersForDemo(config, { ...demo, address: '' });
    config = demo.overrides ? demo.overrides(config) : config;
    config = normalizeConfig(config, demo.name);

    const siteId = newId('site');
    run(
      `INSERT INTO sites (id, client_id, template_id, template_name, template_version, config, status,
         subdomain, published_at, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        siteId,
        clientId,
        tpl.id,
        tpl.name,
        tpl.version,
        JSON.stringify(config),
        demo.status,
        demo.subdomain,
        demo.status === 'published' ? now() : null,
        now(),
        userId,
      ],
    );
    run(
      `INSERT INTO site_revisions (id, site_id, version, label, config, created_by, created_at)
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      [newId('rev'), siteId, 'Criado a partir do template', JSON.stringify(config), userId, now()],
    );
    logActivity(
      { id: userId, name: 'Administrador' },
      'site.created',
      'site',
      siteId,
      `Site de ${demo.name} criado a partir do template "${tpl.name}"`,
    );
  }
}

export function seedDatabase({ force = false } = {}) {
  getDb();
  const existingUsers = get('SELECT COUNT(*) AS total FROM users')?.total ?? 0;
  if (existingUsers > 0 && !force) {
    return { skipped: true, reason: 'banco ja inicializado' };
  }

  tx(() => {
    insertSegments();
  });

  const userId = tx(() => insertUsers());
  tx(() => insertLibraryImages(userId));
  tx(() => insertTemplates(userId));
  tx(() => insertDemoClients(userId));

  return {
    skipped: false,
    users: all('SELECT email, role FROM users'),
    segments: get('SELECT COUNT(*) AS total FROM segments').total,
    templates: get('SELECT COUNT(*) AS total FROM templates').total,
    images: get('SELECT COUNT(*) AS total FROM images').total,
    clients: get('SELECT COUNT(*) AS total FROM clients').total,
  };
}
