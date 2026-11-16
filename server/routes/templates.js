import { Router } from 'express';
import { all, get, run, parseJson } from '../db/index.js';
import { badRequest, conflict, notFound, requireString } from '../lib/http.js';
import { wrapAsyncRouter } from '../lib/http.js';
import { newId } from '../lib/auth.js';
import { normalizeConfig, configStatus, slugify, collectImageIds, deepClone } from '../lib/config.js';
import { logActivity } from '../lib/activity.js';
import { requireRole } from './auth.js';
import { imageUrl } from '../lib/storage.js';
import { buildPresetConfig, attachPreviewImages, listPresets } from '../lib/presets.js';

const now = () => new Date().toISOString();

function mapImage(id) {
  if (!id) return null;
  const img = get('SELECT * FROM images WHERE id = ?', [id]);
  if (!img) return null;
  return { id: img.id, url: imageUrl(img), title: img.title, license: img.license };
}

function serialize(row) {
  const config = parseJson(row.config, {});
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    segment_slug: row.segment_slug,
    segment_name: row.segment_name,
    category: row.category,
    summary: row.summary,
    description: row.description,
    status: row.status,
    version: row.version,
    accent: row.accent,
    cover_image_id: row.cover_image_id,
    thumbnail_image_id: row.thumbnail_image_id,
    cover: mapImage(row.cover_image_id),
    thumbnail: mapImage(row.thumbnail_image_id),
    stats: configStatus(config),
    sites_using: row.sites_using ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function templatesRouter() {
  const router = Router();

  /* ------------------------------ Segmentos ------------------------------ */
  router.get('/segments', (_req, res) => {
    const segments = all(
      `SELECT s.*,
              (SELECT COUNT(*) FROM templates t WHERE t.segment_slug = s.slug) AS templates,
              (SELECT COUNT(*) FROM clients c WHERE c.segment_slug = s.slug) AS clients,
              (SELECT COUNT(*) FROM images i WHERE i.segment_slug = s.slug AND i.owner_client_id IS NULL) AS images
         FROM segments s ORDER BY s.position`,
    ).map((s) => ({
      ...s,
      categories: all(
        `SELECT c.*,
                (SELECT COUNT(*) FROM images i
                  WHERE i.segment_slug = c.segment_slug AND i.category_slug = c.slug AND i.owner_client_id IS NULL) AS images
           FROM image_categories c WHERE c.segment_slug = ? ORDER BY c.position`,
        [s.slug],
      ),
    }));
    res.json({ segments });
  });

  /* ------------------------------ Templates ------------------------------ */
  router.get('/templates', (req, res) => {
    const { segment, category, status, q } = req.query;
    const where = [];
    const params = [];
    if (segment) {
      where.push('t.segment_slug = ?');
      params.push(String(segment));
    }
    if (category) {
      where.push('t.category = ?');
      params.push(String(category));
    }
    if (status) {
      where.push('t.status = ?');
      params.push(String(status));
    }
    if (q) {
      where.push('(t.name LIKE ? OR t.summary LIKE ? OR t.category LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const rows = all(
      `SELECT t.*, s.name AS segment_name,
              (SELECT COUNT(*) FROM sites si WHERE si.template_id = t.id) AS sites_using
         FROM templates t JOIN segments s ON s.slug = t.segment_slug
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY s.position, t.name`,
      params,
    );
    res.json({ templates: rows.map(serialize) });
  });

  /* ------------------------ Pontos de partida ---------------------------- */
  router.get('/template-presets', (req, res) => {
    const segments = all('SELECT slug, name FROM segments ORDER BY position');
    res.json({ presets: listPresets(segments) });
  });

  router.get('/templates/:id', (req, res) => {
    const row = get(
      `SELECT t.*, s.name AS segment_name,
              (SELECT COUNT(*) FROM sites si WHERE si.template_id = t.id) AS sites_using
         FROM templates t JOIN segments s ON s.slug = t.segment_slug WHERE t.id = ? OR t.slug = ?`,
      [req.params.id, req.params.id],
    );
    if (!row) throw notFound('Template nao encontrado');
    res.json({
      template: { ...serialize(row), config: parseJson(row.config, {}) },
      clients: all(
        `SELECT c.id, c.name, si.status, si.id AS site_id
           FROM sites si JOIN clients c ON c.id = si.client_id
          WHERE si.template_id = ? ORDER BY c.name`,
        [row.id],
      ),
    });
  });

  router.post('/templates', requireRole('admin', 'editor'), (req, res) => {
    const body = req.body ?? {};
    const name = requireString(body.name, 'nome', { max: 120 });
    const segment = String(body.segment_slug ?? '');
    if (!get('SELECT slug FROM segments WHERE slug = ?', [segment])) throw badRequest('Segmento invalido');

    // Ordem de precedencia: config explicito > ponto de partida do segmento >
    // config vazio. Sem isso, "novo template" nascia sem secoes nem catalogo.
    let source = body.config;
    if (!source && body.preset) {
      const presetConfig = buildPresetConfig(segment, name);
      if (!presetConfig) throw badRequest('Ponto de partida indisponivel para este segmento');
      source = presetConfig;
    }
    const baseConfig = normalizeConfig(source ?? {}, name);
    const stats = configStatus(baseConfig);
    let slug = slugify(body.slug || name);
    if (get('SELECT id FROM templates WHERE slug = ?', [slug])) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const id = newId('tpl');
    run(
      `INSERT INTO templates (id, slug, name, segment_slug, category, summary, description, status, version,
         cover_image_id, thumbnail_image_id, accent, config, sections_count, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        name,
        segment,
        String(body.category ?? 'geral').slice(0, 60),
        String(body.summary ?? '').slice(0, 300),
        String(body.description ?? '').slice(0, 2000),
        ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft',
        body.cover_image_id ?? baseConfig.media?.coverImageId ?? null,
        body.thumbnail_image_id ?? baseConfig.media?.thumbnailImageId ?? null,
        body.accent ?? baseConfig.theme.primary,
        JSON.stringify(baseConfig),
        stats.sections,
        req.user.id,
        now(),
        now(),
      ],
    );
    logActivity(req.user, 'template.created', 'template', id, `Template "${name}" criado`);
    res.status(201).json({ template: serialize(get(`SELECT t.*, s.name AS segment_name FROM templates t JOIN segments s ON s.slug=t.segment_slug WHERE t.id = ?`, [id])) });
  });

  /**
   * Preenche o template com imagens ilustrativas do proprio segmento.
   * Serve para sair da previa cinza sem obrigar o usuario a escolher 12 imagens.
   */
  router.post('/templates/:id/preview-images', requireRole('admin', 'editor'), (req, res) => {
    const row = get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Template nao encontrado');
    const config = parseJson(row.config, {});
    const images = all(
      `SELECT * FROM images
        WHERE segment_slug = ? AND owner_client_id IS NULL
        ORDER BY is_cover DESC, created_at ASC`,
      [row.segment_slug],
    );
    if (!images.length) throw badRequest('Nenhuma imagem na biblioteca deste segmento');
    const next = attachPreviewImages(config, images);
    const stats = configStatus(next);
    run(
      `UPDATE templates SET config = ?, cover_image_id = ?, thumbnail_image_id = ?, sections_count = ?, version = version + 1, updated_at = ? WHERE id = ?`,
      [
        JSON.stringify(next),
        next.media.coverImageId,
        next.media.thumbnailImageId,
        stats.sections,
        now(),
        row.id,
      ],
    );
    logActivity(req.user, 'template.preview_images', 'template', row.id, `Imagens ilustrativas aplicadas em "${row.name}"`);
    res.json({
      template: serialize(
        get(`SELECT t.*, s.name AS segment_name FROM templates t JOIN segments s ON s.slug=t.segment_slug WHERE t.id = ?`, [row.id]),
      ),
      applied: images.length,
    });
  });

  router.patch('/templates/:id', requireRole('admin', 'editor'), (req, res) => {
    const row = get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Template nao encontrado');
    const body = req.body ?? {};
    const fields = [];
    const params = [];

    if (body.name !== undefined) {
      fields.push('name = ?');
      params.push(requireString(body.name, 'nome', { max: 120 }));
    }
    for (const key of ['category', 'summary', 'description', 'accent', 'status']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(String(body[key]).slice(0, key === 'description' ? 2000 : 300));
      }
    }
    for (const key of ['cover_image_id', 'thumbnail_image_id']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(body[key] || null);
      }
    }
    if (body.segment_slug !== undefined) {
      if (!get('SELECT slug FROM segments WHERE slug = ?', [String(body.segment_slug)])) throw badRequest('Segmento invalido');
      fields.push('segment_slug = ?');
      params.push(String(body.segment_slug));
    }
    if (body.config !== undefined) {
      const config = normalizeConfig(body.config, row.name);
      fields.push('config = ?', 'version = version + 1', 'sections_count = ?');
      params.push(JSON.stringify(config), configStatus(config).sections);
    }
    if (!fields.length) throw badRequest('Nenhum campo para atualizar');
    fields.push('updated_at = ?');
    params.push(now(), req.params.id);
    run(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`, params);
    logActivity(req.user, 'template.updated', 'template', row.id, `Template "${row.name}" atualizado (modelo independente dos sites)`);
    res.json({
      template: serialize(
        get(`SELECT t.*, s.name AS segment_name FROM templates t JOIN segments s ON s.slug=t.segment_slug WHERE t.id = ?`, [row.id]),
      ),
    });
  });

  router.post('/templates/:id/duplicate', requireRole('admin', 'editor'), (req, res) => {
    const row = get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Template nao encontrado');
    const name = String(req.body?.name ?? `${row.name} (copia)`).slice(0, 120);
    let slug = slugify(name);
    if (get('SELECT id FROM templates WHERE slug = ?', [slug])) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const id = newId('tpl');
    run(
      `INSERT INTO templates (id, slug, name, segment_slug, category, summary, description, status, version,
         cover_image_id, thumbnail_image_id, accent, config, sections_count, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        name,
        row.segment_slug,
        row.category,
        row.summary,
        row.description,
        row.cover_image_id,
        row.thumbnail_image_id,
        row.accent,
        row.config,
        row.sections_count,
        req.user.id,
        now(),
        now(),
      ],
    );
    logActivity(req.user, 'template.duplicated', 'template', id, `Template "${row.name}" duplicado como "${name}"`);
    res.status(201).json({
      template: serialize(get(`SELECT t.*, s.name AS segment_name FROM templates t JOIN segments s ON s.slug=t.segment_slug WHERE t.id = ?`, [id])),
    });
  });

  router.delete('/templates/:id', requireRole('admin'), (req, res) => {
    const row = get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Template nao encontrado');
    const using = get('SELECT COUNT(*) AS total FROM sites WHERE template_id = ?', [row.id]).total;
    if (using > 0 && req.query.force !== 'true') {
      throw conflict(
        `Este template e a origem de ${using} site(s). Os sites continuam funcionando porque guardam copia propria, mas a remocao apaga o modelo.`,
        { sites_using: using },
      );
    }
    run('DELETE FROM templates WHERE id = ?', [row.id]);
    logActivity(req.user, 'template.deleted', 'template', row.id, `Template "${row.name}" removido`);
    res.json({ ok: true });
  });

  /* Cria um template novo a partir de um site existente (promocao de modelo). */
  router.post('/templates/from-site/:siteId', requireRole('admin'), (req, res) => {
    const site = get('SELECT * FROM sites WHERE id = ?', [req.params.siteId]);
    if (!site) throw notFound('Site nao encontrado');
    const client = get('SELECT * FROM clients WHERE id = ?', [site.client_id]);
    const name = String(req.body?.name ?? `${client?.name ?? 'Site'} - modelo`).slice(0, 120);
    let slug = slugify(name);
    if (get('SELECT id FROM templates WHERE slug = ?', [slug])) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const config = normalizeConfig(parseJson(site.config, {}), name);
    const id = newId('tpl');
    run(
      `INSERT INTO templates (id, slug, name, segment_slug, category, summary, description, status, version,
         cover_image_id, thumbnail_image_id, accent, config, sections_count, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 1, NULL, NULL, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        name,
        client?.segment_slug ?? 'portfolio',
        'Derivado',
        `Modelo criado a partir do site de ${client?.name ?? 'cliente'}.`,
        String(req.body?.description ?? '').slice(0, 2000),
        config.theme.primary,
        JSON.stringify(config),
        configStatus(config).sections,
        req.user.id,
        now(),
        now(),
      ],
    );
    logActivity(req.user, 'template.created_from_site', 'template', id, `Template "${name}" criado a partir do site de ${client?.name ?? 'cliente'}`);
    res.status(201).json({
      template: serialize(get(`SELECT t.*, s.name AS segment_name FROM templates t JOIN segments s ON s.slug=t.segment_slug WHERE t.id = ?`, [id])),
    });
  });

  return wrapAsyncRouter(router);
}
