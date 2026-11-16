import { Router } from 'express';
import { all, get, parseJson } from '../db/index.js';
import { recentActivity } from '../lib/activity.js';
import { imageUrl } from '../lib/storage.js';
import { wrapAsyncRouter } from '../lib/http.js';

export function dashboardRouter() {
  const router = Router();

  router.get('/dashboard', (_req, res) => {
    const totals = {
      templates: get('SELECT COUNT(*) AS total FROM templates').total,
      published_templates: get("SELECT COUNT(*) AS total FROM templates WHERE status = 'published'").total,
      clients: get('SELECT COUNT(*) AS total FROM clients').total,
      published_sites: get("SELECT COUNT(*) AS total FROM sites WHERE status = 'published'").total,
      draft_sites: get("SELECT COUNT(*) AS total FROM sites WHERE status = 'draft'").total,
      images: get('SELECT COUNT(*) AS total FROM images WHERE owner_client_id IS NULL').total,
      own_images: get('SELECT COUNT(*) AS total FROM images WHERE owner_client_id IS NOT NULL').total,
      segments: get('SELECT COUNT(*) AS total FROM segments').total,
    };

    const bySegment = all(
      `SELECT s.slug, s.name,
              (SELECT COUNT(*) FROM templates t WHERE t.segment_slug = s.slug) AS templates,
              (SELECT COUNT(*) FROM clients c WHERE c.segment_slug = s.slug) AS clients,
              (SELECT COUNT(*) FROM images i WHERE i.segment_slug = s.slug AND i.owner_client_id IS NULL) AS images
         FROM segments s ORDER BY s.position`,
    );

    const templates = all(
      `SELECT t.id, t.name, t.slug, t.segment_slug, t.category, t.status, t.version, t.cover_image_id,
              t.thumbnail_image_id, t.sections_count, t.updated_at,
              s.name AS segment_name,
              (SELECT COUNT(*) FROM sites si WHERE si.template_id = t.id) AS sites_using
         FROM templates t JOIN segments s ON s.slug = t.segment_slug
        ORDER BY t.updated_at DESC LIMIT 6`,
    ).map((t) => ({
      ...t,
      cover: t.cover_image_id
        ? (() => {
            const img = get('SELECT * FROM images WHERE id = ?', [t.cover_image_id]);
            return img ? { id: img.id, url: imageUrl(img) } : null;
          })()
        : null,
    }));

    const clients = all(
      `SELECT c.id, c.name, c.slug, c.segment_slug, c.updated_at, s.status AS site_status, s.template_name,
              s.config
         FROM clients c LEFT JOIN sites s ON s.client_id = c.id
        ORDER BY c.updated_at DESC LIMIT 6`,
    ).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      segment_slug: c.segment_slug,
      updated_at: c.updated_at,
      site_status: c.site_status,
      template_name: c.template_name,
      accent: parseJson(c.config, {})?.theme?.primary ?? '#2563eb',
    }));

    res.json({ totals, bySegment, templates, clients, activity: recentActivity(12) });
  });

  router.get('/activity', (req, res) => {
    res.json({ activity: recentActivity(Number(req.query.limit) || 40) });
  });

  return wrapAsyncRouter(router);
}
