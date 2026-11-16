import { Router } from 'express';
import { all, get, run, parseJson, tx } from '../db/index.js';
import { badRequest, conflict, notFound, requireString } from '../lib/http.js';
import { wrapAsyncRouter } from '../lib/http.js';
import { newId } from '../lib/auth.js';
import {
  normalizeConfig,
  configStatus,
  slugify,
  applyPlaceholders,
  summarizeChanges,
  collectImageIds,
  deepClone,
} from '../lib/config.js';
import { logActivity } from '../lib/activity.js';
import { requireRole } from './auth.js';
import { imageUrl, removeImageFile } from '../lib/storage.js';

const now = () => new Date().toISOString();

function segmentName(slug) {
  return get('SELECT name FROM segments WHERE slug = ?', [slug])?.name ?? slug;
}

function imageMapFor(ids) {
  if (!ids.length) return {};
  const placeholders = ids.map(() => '?').join(',');
  const rows = all(`SELECT * FROM images WHERE id IN (${placeholders})`, ids);
  return Object.fromEntries(
    rows.map((row) => [
      row.id,
      { id: row.id, url: imageUrl(row), title: row.title, alt: row.alt, license: row.license, owner_client_id: row.owner_client_id },
    ]),
  );
}

/**
 * Verificacao central de isolamento de midia:
 *  - imagem da biblioteca (owner NULL) precisa pertencer ao segmento do site
 *  - imagem de cliente precisa pertencer a ESTE cliente
 * Qualquer referencia cruzada e rejeitada.
 */
function assertImagesAllowed(config, client) {
  const ids = collectImageIds(config);
  const problems = [];
  for (const id of ids) {
    const row = get('SELECT id, segment_slug, owner_client_id, title FROM images WHERE id = ?', [id]);
    if (!row) {
      problems.push({ id, reason: 'nao existe' });
      continue;
    }
    if (row.owner_client_id && row.owner_client_id !== client.id) {
      problems.push({ id, reason: 'pertence a outro cliente', title: row.title });
    }
    if (!row.owner_client_id && row.segment_slug !== client.segment_slug) {
      problems.push({ id, reason: 'imagem de biblioteca de outro segmento', title: row.title });
    }
  }
  if (problems.length) {
    throw badRequest('O site referencia imagens fora do escopo permitido para este cliente', { images: problems });
  }
  return ids;
}

function serializeClient(row) {
  const site = get('SELECT * FROM sites WHERE client_id = ?', [row.id]);
  const config = site ? parseJson(site.config, {}) : null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    segment_slug: row.segment_slug,
    segment_name: segmentName(row.segment_slug),
    contact_name: row.contact_name,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    site: site
      ? {
          id: site.id,
          status: site.status,
          subdomain: site.subdomain,
          template_id: site.template_id,
          template_name: site.template_name,
          template_version: site.template_version,
          published_at: site.published_at,
          updated_at: site.updated_at,
          stats: config ? configStatus(config) : null,
          accent: config?.theme?.primary ?? '#2563eb',
          cover: config?.media?.coverImageId ?? config?.sections?.find((s) => s.type === 'hero')?.props?.imageId ?? null,
        }
      : null,
  };
}

function createSiteForClient(client, templateId, user) {
  let tpl = null;
  if (templateId) {
    tpl = get('SELECT * FROM templates WHERE id = ? OR slug = ?', [templateId, templateId]);
    if (!tpl) throw notFound('Template nao encontrado');
  }

  const templateConfig = tpl ? parseJson(tpl.config, {}) : null;
  let config = templateConfig ? deepClone(templateConfig) : normalizeConfig({}, client.name);

  // Marcadores resolvidos com os dados do cliente (nao ha vinculo com o template).
  config = applyPlaceholders(config, {
    name: client.name,
    city: '',
    phone: client.contact_phone,
    whatsapp: String(client.contact_phone || '').replace(/\D/g, ''),
    email: client.contact_email,
    address: '',
  });
  config = normalizeConfig(config, client.name);
  config.identity.name = client.name;
  config.identity.logoText = client.name;
  config.seo.title = `${client.name} | ${segmentName(client.segment_slug)}`;

  // Remove referencias a imagens que nao pertencem ao segmento do cliente.
  const keep = (id) => {
    if (!id) return null;
    const img = get('SELECT * FROM images WHERE id = ?', [id]);
    return img && img.segment_slug === client.segment_slug && !img.owner_client_id ? id : null;
  };
  for (const section of config.sections) {
    if (section.props?.imageId) section.props.imageId = keep(section.props.imageId);
    if (Array.isArray(section.props?.imageIds)) section.props.imageIds = section.props.imageIds.map(keep).filter(Boolean);
    for (const member of section.props?.members ?? []) if (member.imageId) member.imageId = keep(member.imageId);
  }

  const siteId = newId('site');
  run(
    `INSERT INTO sites (id, client_id, template_id, template_name, template_version, config, status, subdomain,
       published_at, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, NULL, ?, ?)`,
    [
      siteId,
      client.id,
      tpl?.id ?? null,
      tpl?.name ?? 'Modelo em branco',
      tpl?.version ?? 1,
      JSON.stringify(config),
      client.slug,
      now(),
      user?.id ?? null,
    ],
  );
  run(
    `INSERT INTO site_revisions (id, site_id, version, label, config, created_by, created_at)
     VALUES (?, ?, 1, ?, ?, ?, ?)`,
    [
      newId('rev'),
      siteId,
      tpl ? `Criado a partir do template "${tpl.name}"` : 'Criado como modelo em branco',
      JSON.stringify(config),
      user?.id ?? null,
      now(),
    ],
  );
  return { siteId, config, template: tpl };
}

export function clientsRouter() {
  const router = Router();

  /* ------------------------------- Listagem ------------------------------- */
  router.get('/clients', (req, res) => {
    const { q, segment } = req.query;
    const where = [];
    const params = [];
    if (segment) {
      where.push('c.segment_slug = ?');
      params.push(String(segment));
    }
    if (q) {
      where.push('(c.name LIKE ? OR c.contact_name LIKE ? OR c.slug LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const rows = all(
      `SELECT c.* FROM clients c ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.name`,
      params,
    );
    res.json({ clients: rows.map(serializeClient) });
  });

  /* ------------------------------- Criacao ------------------------------- */
  router.post('/clients', requireRole('admin', 'editor'), (req, res) => {
    const body = req.body ?? {};
    const name = requireString(body.name, 'nome do cliente', { max: 120 });
    const segment = String(body.segment_slug ?? '');
    if (!get('SELECT slug FROM segments WHERE slug = ?', [segment])) throw badRequest('Segmento invalido');

    let slug = slugify(body.slug || name);
    if (get('SELECT id FROM clients WHERE slug = ?', [slug])) {
      throw conflict('Ja existe um cliente com esse identificador de site', { slug });
    }

    const result = tx(() => {
      const id = newId('cli');
      run(
        `INSERT INTO clients (id, name, slug, segment_slug, contact_name, contact_email, contact_phone,
           status, notes, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
        [
          id,
          name,
          slug,
          segment,
          String(body.contact_name ?? '').slice(0, 120),
          String(body.contact_email ?? '').slice(0, 160),
          String(body.contact_phone ?? '').slice(0, 40),
          String(body.notes ?? '').slice(0, 1000),
          req.user.id,
          now(),
          now(),
        ],
      );
      const client = get('SELECT * FROM clients WHERE id = ?', [id]);
      const { siteId, template } = createSiteForClient(client, body.template_id ?? null, req.user);
      logActivity(
        req.user,
        'client.created',
        'client',
        id,
        `Cliente "${name}" criado com site proprio${template ? ` a partir de "${template.name}"` : ' (modelo em branco)'}`,
      );
      return { client, siteId };
    });

    res.status(201).json({ client: serializeClient(get('SELECT * FROM clients WHERE id = ?', [result.client.id])) });
  });

  router.get('/clients/:id', (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const site = get('SELECT * FROM sites WHERE client_id = ?', [client.id]);
    const config = site ? parseJson(site.config, {}) : null;
    const imageIds = config ? collectImageIds(config) : [];
    res.json({
      client: serializeClient(client),
      site: site
        ? {
            id: site.id,
            status: site.status,
            subdomain: site.subdomain,
            template_id: site.template_id,
            template_name: site.template_name,
            template_version: site.template_version,
            published_at: site.published_at,
            updated_at: site.updated_at,
            config,
          }
        : null,
      images: imageMapFor(imageIds),
      template: site?.template_id
        ? (() => {
            const tpl = get('SELECT id, name, version, summary, cover_image_id, thumbnail_image_id FROM templates WHERE id = ?', [site.template_id]);
            return tpl ? { ...tpl, version_now: tpl.version, origin_version: site.template_version } : null;
          })()
        : null,
    });
  });

  router.patch('/clients/:id', requireRole('admin', 'editor'), (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const body = req.body ?? {};
    const fields = [];
    const params = [];
    for (const key of ['name', 'contact_name', 'contact_email', 'contact_phone', 'notes', 'status']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(String(body[key]).slice(0, key === 'notes' ? 1000 : 160));
      }
    }
    if (!fields.length) throw badRequest('Nenhum campo para atualizar');
    fields.push('updated_at = ?');
    params.push(now(), client.id);
    run(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, params);
    logActivity(req.user, 'client.updated', 'client', client.id, `Dados do cliente "${client.name}" atualizados`);
    res.json({ client: serializeClient(get('SELECT * FROM clients WHERE id = ?', [client.id])) });
  });

  router.delete('/clients/:id', requireRole('admin'), (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const images = all('SELECT * FROM images WHERE owner_client_id = ?', [client.id]);
    tx(() => {
      run('DELETE FROM clients WHERE id = ?', [client.id]);
    });
    // Remove apenas arquivos privados deste cliente; a biblioteca compartilhada
    // e os demais clientes permanecem intactos.
    images.filter((img) => img.owner_client_id === client.id).forEach(removeImageFile);
    logActivity(req.user, 'client.deleted', 'client', client.id, `Cliente "${client.name}" e site associado removidos`);
    res.json({ ok: true });
  });

  /* --------------------------- Config do site --------------------------- */
  router.put('/clients/:id/site', requireRole('admin', 'editor'), (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const site = get('SELECT * FROM sites WHERE client_id = ?', [client.id]);
    if (!site) throw notFound('Site do cliente nao encontrado');

    const body = req.body ?? {};
    const before = parseJson(site.config, {});
    const config = normalizeConfig(body.config ?? body, client.name);
    config.identity.name = config.identity.name || client.name;

    assertImagesAllowed(config, client);

    const changes = summarizeChanges(before, config);
    const label = String(body.label ?? '').slice(0, 120) || changes.slice(0, 3).join(', ');

    tx(() => {
      run('UPDATE sites SET config = ?, updated_at = ?, updated_by = ? WHERE id = ?', [
        JSON.stringify(config),
        now(),
        req.user.id,
        site.id,
      ]);
      const version = (get('SELECT MAX(version) AS v FROM site_revisions WHERE site_id = ?', [site.id]).v ?? 0) + 1;
      run(
        `INSERT INTO site_revisions (id, site_id, version, label, config, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId('rev'), site.id, version, label, JSON.stringify(config), req.user.id, now()],
      );
    });

    logActivity(req.user, 'site.updated', 'site', site.id, `Site de ${client.name}: ${label}`);
    res.json({
      site: { id: site.id, status: site.status, subdomain: site.subdomain, config, updated_at: now() },
      changes,
    });
  });

  router.post('/clients/:id/site/publish', requireRole('admin', 'editor'), (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const site = get('SELECT * FROM sites WHERE client_id = ?', [client.id]);
    if (!site) throw notFound('Site do cliente nao encontrado');
    const config = parseJson(site.config, {});
    if (!config.identity?.name) throw badRequest('Defina o nome do site antes de publicar');
    if (!config.sections?.some((s) => s.enabled)) throw badRequest('O site precisa de ao menos uma secao ativa');

    assertImagesAllowed(config, client);
    run('UPDATE sites SET status = ?, published_at = ?, updated_at = ? WHERE id = ?', ['published', now(), now(), site.id]);
    logActivity(req.user, 'site.published', 'site', site.id, `Site de ${client.name} publicado em /s/${client.slug}`);
    res.json({ site: serializeClient(get('SELECT * FROM clients WHERE id = ?', [client.id])) });
  });

  router.post('/clients/:id/site/unpublish', requireRole('admin', 'editor'), (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const site = get('SELECT * FROM sites WHERE client_id = ?', [client.id]);
    if (!site) throw notFound('Site do cliente nao encontrado');
    run('UPDATE sites SET status = ?, updated_at = ? WHERE id = ?', ['offline', now(), site.id]);
    logActivity(req.user, 'site.unpublished', 'site', site.id, `Site de ${client.name} retirado do ar`);
    res.json({ site: serializeClient(get('SELECT * FROM clients WHERE id = ?', [client.id])) });
  });

  /**
   * Reaplica o template ao site do cliente. Ação EXPLICITA, nunca automatica:
   * o admin escolhe entre substituir tudo, reaplicar so o tema ou so uma secao.
   */
  router.post('/clients/:id/site/apply-template', requireRole('admin'), (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const site = get('SELECT * FROM sites WHERE client_id = ?', [client.id]);
    if (!site) throw notFound('Site do cliente nao encontrado');

    const body = req.body ?? {};
    const mode = ['config', 'theme', 'section'].includes(body.mode) ? body.mode : 'config';
    const tpl = get('SELECT * FROM templates WHERE id = ?', [body.template_id ?? site.template_id]);
    if (!tpl) throw notFound('Template nao encontrado');
    if (tpl.segment_slug !== client.segment_slug) {
      throw badRequest('O template pertence a outro segmento. Ajuste o segmento do cliente antes de aplicar.');
    }

    const current = parseJson(site.config, {});
    const templateConfig = parseJson(tpl.config, {});
    let next;

    if (mode === 'config') {
      next = applyPlaceholders(deepClone(templateConfig), {
        name: client.name,
        phone: client.contact_phone,
        whatsapp: String(client.contact_phone || '').replace(/\D/g, ''),
        email: client.contact_email,
      });
      next.identity.name = client.name;
      const keep = (id) => {
        const img = id ? get('SELECT * FROM images WHERE id = ?', [id]) : null;
        return img && img.segment_slug === client.segment_slug && !img.owner_client_id ? id : null;
      };
      for (const section of next.sections) {
        if (section.props?.imageId) section.props.imageId = keep(section.props.imageId);
        if (Array.isArray(section.props?.imageIds)) section.props.imageIds = section.props.imageIds.map(keep).filter(Boolean);
        for (const member of section.props?.members ?? []) if (member.imageId) member.imageId = keep(member.imageId);
      }
    } else if (mode === 'theme') {
      next = { ...current, theme: deepClone(templateConfig.theme) };
    } else {
      const sectionId = String(body.section_id ?? '');
      const source = templateConfig.sections.find((s) => s.id === sectionId);
      if (!source) throw notFound('Secao do template nao encontrada');
      next = {
        ...current,
        sections: current.sections.map((s) => (s.id === sectionId ? deepClone(source) : s)),
      };
    }

    next = normalizeConfig(next, client.name);
    assertImagesAllowed(next, client);

    const changes = summarizeChanges(current, next);
    tx(() => {
      run('UPDATE sites SET config = ?, template_id = ?, template_name = ?, template_version = ?, updated_at = ?, updated_by = ? WHERE id = ?', [
        JSON.stringify(next),
        tpl.id,
        tpl.name,
        tpl.version,
        now(),
        req.user.id,
        site.id,
      ]);
      const version = (get('SELECT MAX(version) AS v FROM site_revisions WHERE site_id = ?', [site.id]).v ?? 0) + 1;
      run(
        `INSERT INTO site_revisions (id, site_id, version, label, config, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId('rev'), site.id, version, `Template reaplicado (${mode})`, JSON.stringify(next), req.user.id, now()],
      );
    });
    logActivity(req.user, 'site.template_applied', 'site', site.id, `Template "${tpl.name}" reaplicado (${mode}) no site de ${client.name}`);
    res.json({ config: next, changes, template: { id: tpl.id, name: tpl.name, version: tpl.version } });
  });

  /* ----------------------------- Revisoes ----------------------------- */
  router.get('/clients/:id/site/revisions', (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const site = get('SELECT * FROM sites WHERE client_id = ?', [client.id]);
    if (!site) throw notFound('Site do cliente nao encontrado');
    const revisions = all(
      `SELECT r.id, r.version, r.label, r.created_at, u.name AS author
         FROM site_revisions r LEFT JOIN users u ON u.id = r.created_by
        WHERE r.site_id = ? ORDER BY r.version DESC`,
      [site.id],
    );
    res.json({ revisions });
  });

  router.post('/clients/:id/site/revisions/:revId/restore', requireRole('admin', 'editor'), (req, res) => {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) throw notFound('Cliente nao encontrado');
    const site = get('SELECT * FROM sites WHERE client_id = ?', [client.id]);
    if (!site) throw notFound('Site do cliente nao encontrado');
    const revision = get('SELECT * FROM site_revisions WHERE id = ? AND site_id = ?', [req.params.revId, site.id]);
    if (!revision) throw notFound('Revisao nao encontrada');
    const config = normalizeConfig(parseJson(revision.config, {}), client.name);
    assertImagesAllowed(config, client);
    tx(() => {
      run('UPDATE sites SET config = ?, updated_at = ?, updated_by = ? WHERE id = ?', [
        JSON.stringify(config),
        now(),
        req.user.id,
        site.id,
      ]);
      const version = (get('SELECT MAX(version) AS v FROM site_revisions WHERE site_id = ?', [site.id]).v ?? 0) + 1;
      run(
        `INSERT INTO site_revisions (id, site_id, version, label, config, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId('rev'), site.id, version, `Restaurado da versao ${revision.version}`, JSON.stringify(config), req.user.id, now()],
      );
    });
    logActivity(req.user, 'site.restored', 'site', site.id, `Site de ${client.name} restaurado para a versao ${revision.version}`);
    res.json({ config });
  });

  return wrapAsyncRouter(router);
}

/* ------------------------- Site publico (leitura) ------------------------- */
export function publicRouter() {
  const router = Router();

  router.get('/sites/:slug', (req, res) => {
    const row = get(
      `SELECT s.*, c.name AS client_name, c.segment_slug FROM sites s JOIN clients c ON c.id = s.client_id
        WHERE s.subdomain = ? OR c.slug = ?`,
      [req.params.slug, req.params.slug],
    );
    if (!row) throw notFound('Site nao encontrado');
    const preview = req.query.preview === '1' && req.user;
    if (row.status !== 'published' && !preview) {
      throw notFound('Site nao publicado');
    }
    const config = parseJson(row.config, {});
    res.json({
      site: {
        id: row.id,
        subdomain: row.subdomain,
        status: row.status,
        published_at: row.published_at,
        config,
        segment_slug: row.segment_slug,
        client_name: row.client_name,
      },
      images: imageMapFor(collectImageIds(config)),
      preview: Boolean(preview),
    });
  });

  return wrapAsyncRouter(router);
}
