import { Router } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { all, get, run, parseJson, tx } from '../db/index.js';
import { badRequest, conflict, notFound, requireString } from '../lib/http.js';
import { wrapAsyncRouter } from '../lib/http.js';
import { newId } from '../lib/auth.js';
import { logActivity } from '../lib/activity.js';
import { requireRole } from './auth.js';
import { readMultipartImage } from '../lib/upload.js';
import { saveUpload, removeImageFile, imagePath, mimeForExt } from '../lib/storage.js';
import { buildIllustration } from '../lib/imagery.js';

const now = () => new Date().toISOString();
const ALWAYS_CLIENT_CATEGORIES = new Set(['logo', 'proprias']);

function serialize(row) {
  return {
    id: row.id,
    segment_slug: row.segment_slug,
    category_slug: row.category_slug,
    title: row.title,
    alt: row.alt,
    tags: parseJson(row.tags, []),
    width: row.width,
    height: row.height,
    source: row.source,
    license: row.license,
    license_note: row.license_note,
    illustrative: row.license === 'illustrative',
    owner_client_id: row.owner_client_id,
    scope: row.owner_client_id ? 'client' : 'library',
    is_cover: Boolean(row.is_cover),
    url: `/media/${row.id}.${row.file_ext}`,
    file_ext: row.file_ext,
    file_size: row.file_size,
    replaced_at: row.replaced_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function ensureCategory(segmentSlug, categorySlug, name) {
  const exists = get('SELECT id FROM image_categories WHERE segment_slug = ? AND slug = ?', [segmentSlug, categorySlug]);
  if (!exists) {
    run(
      `INSERT INTO image_categories (id, segment_slug, slug, name, description, position) VALUES (?, ?, ?, ?, '', 95)`,
      [`cat_${segmentSlug}_${categorySlug}`, segmentSlug, categorySlug, name ?? categorySlug],
    );
  }
}

export function imagesRouter() {
  const router = Router();

  /**
   * Lista imagens.
   * Padrao: biblioteca compartilhada (owner_client_id IS NULL).
   * ?clientId=xyz -> inclui SOMENTE imagens privadas daquele cliente + biblioteca
   * (nunca imagens privadas de outro cliente).
   */
  router.get('/images', (req, res) => {
    const { segment, category, q, clientId, scope } = req.query;
    const where = [];
    const params = [];

    if (clientId) {
      const client = get('SELECT id, segment_slug FROM clients WHERE id = ?', [String(clientId)]);
      if (!client) throw notFound('Cliente nao encontrado');
      if (scope === 'client') {
        where.push('i.owner_client_id = ?');
        params.push(client.id);
      } else {
        where.push('(i.owner_client_id IS NULL OR i.owner_client_id = ?)');
        params.push(client.id);
        where.push('(i.owner_client_id IS NOT NULL OR i.segment_slug = ?)');
        params.push(segment ? String(segment) : client.segment_slug);
      }
    } else {
      where.push('i.owner_client_id IS NULL');
      if (segment) {
        where.push('i.segment_slug = ?');
        params.push(String(segment));
      }
    }

    if (category) {
      where.push('i.category_slug = ?');
      params.push(String(category));
    }
    if (q) {
      where.push('(i.title LIKE ? OR i.alt LIKE ? OR i.tags LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const rows = all(
      `SELECT i.* FROM images i
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY i.owner_client_id IS NOT NULL DESC, i.segment_slug, i.category_slug, i.title`,
      params,
    );

    const categoryRows = clientId
      ? all(
          `SELECT c.slug, c.name, c.segment_slug,
                  (SELECT COUNT(*) FROM images i WHERE i.segment_slug = c.segment_slug AND i.category_slug = c.slug
                    AND (i.owner_client_id IS NULL OR i.owner_client_id = ?)) AS images
             FROM image_categories c
            WHERE c.segment_slug = (SELECT segment_slug FROM clients WHERE id = ?)
            ORDER BY c.position`,
          [String(clientId), String(clientId)],
        )
      : all(
          `SELECT c.slug, c.name, c.segment_slug,
                  (SELECT COUNT(*) FROM images i WHERE i.segment_slug = c.segment_slug AND i.category_slug = c.slug
                    AND i.owner_client_id IS NULL) AS images
             FROM image_categories c
            ${segment ? 'WHERE c.segment_slug = ?' : ''}
            ORDER BY c.segment_slug, c.position`,
          segment ? [String(segment)] : [],
        );

    const ownCount = clientId
      ? get('SELECT COUNT(*) AS total FROM images WHERE owner_client_id = ?', [String(clientId)]).total
      : 0;

    res.json({ images: rows.map(serialize), categories: categoryRows, own_count: ownCount });
  });

  /* ------------------------------ Upload ------------------------------ */
  router.post('/images', requireRole('admin', 'editor'), async (req, res) => {
    const { file, fields } = await readMultipartImage(req);
    if (!file || !file.size) throw badRequest('Envie um arquivo de imagem no campo "file"');

    const ext = detectExt(file.buffer, file.filename);
    const clientId = fields.client_id?.trim() || null;
    let client = null;

    if (clientId) {
      client = get('SELECT * FROM clients WHERE id = ?', [clientId]);
      if (!client) throw notFound('Cliente nao encontrado');
    }

    const segmentSlug = client?.segment_slug ?? (fields.segment_slug || 'portfolio');
    if (!get('SELECT slug FROM segments WHERE slug = ?', [segmentSlug])) throw badRequest('Segmento invalido');

    const categorySlug = String(fields.category_slug || (client ? 'proprias' : 'proprias')).slice(0, 40);
    ensureCategory(segmentSlug, categorySlug, fields.category_name);

    const title = requireString(fields.title, 'titulo', { max: 120 });
    const alt = String(fields.alt || title).slice(0, 200);
    const license = ['own', 'authorized', 'illustrative'].includes(fields.license) ? fields.license : client ? 'own' : 'illustrative';

    const id = newId('img');
    saveUpload({ clientId, segmentSlug, id, ext, buffer: file.buffer });

    // Uma unica capa por segmento/cliente
    const wantsCover = fields.is_cover === 'true' || fields.is_cover === '1';

    run(
      `INSERT INTO images (id, segment_slug, category_slug, title, alt, tags, width, height, source, license,
         license_note, owner_client_id, is_cover, file_ext, file_size, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upload', ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [
        id,
        segmentSlug,
        categorySlug,
        title,
        alt,
        JSON.stringify(String(fields.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)),
        Number(fields.width) || 0,
        Number(fields.height) || 0,
        license,
        String(fields.license_note || (license === 'own'
          ? 'Imagem propria enviada pelo estabelecimento.'
          : license === 'authorized'
            ? 'Imagem com autorizacao de uso registrada pelo administrador.'
            : 'Imagem ilustrativa.')).slice(0, 300),
        clientId,
        ext.replace('.', ''),
        file.size,
        req.user.id,
        now(),
        now(),
      ],
    );

    if (wantsCover) {
      tx(() => {
        if (clientId) run('UPDATE images SET is_cover = 0 WHERE owner_client_id = ?', [clientId]);
        else run('UPDATE images SET is_cover = 0 WHERE segment_slug = ? AND owner_client_id IS NULL', [segmentSlug]);
        run('UPDATE images SET is_cover = 1 WHERE id = ?', [id]);
      });
    }

    logActivity(
      req.user,
      'image.uploaded',
      'image',
      id,
      clientId ? `Imagem "${title}" enviada para o cliente ${client.name}` : `Imagem "${title}" adicionada a biblioteca do segmento ${segmentSlug}`,
    );
    res.status(201).json({ image: serialize(get('SELECT * FROM images WHERE id = ?', [id])) });
  });

  /* --------------------------- Gerar ilustracao --------------------------- */
  router.post('/images/illustration', requireRole('admin', 'editor'), (req, res) => {
    const body = req.body ?? {};
    const title = requireString(body.title, 'titulo', { max: 120 });
    const segmentSlug = String(body.segment_slug ?? 'portfolio');
    if (!get('SELECT slug FROM segments WHERE slug = ?', [segmentSlug])) throw badRequest('Segmento invalido');
    const categorySlug = String(body.category_slug ?? 'proprias').slice(0, 40);
    ensureCategory(segmentSlug, categorySlug, body.category_name);

    const id = newId('img');
    const svg = buildIllustration({
      id,
      title,
      segment: segmentSlug,
      caption: `${title} - ilustracao gerada pelo sistema`,
      width: 1200,
      height: 800,
    });
    saveUpload({ clientId: null, segmentSlug, id, ext: '.svg', buffer: Buffer.from(svg) });

    run(
      `INSERT INTO images (id, segment_slug, category_slug, title, alt, tags, width, height, source, license,
         license_note, owner_client_id, is_cover, file_ext, file_size, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, '[]', 1200, 800, 'library', 'illustrative', ?, NULL, 0, 'svg', ?, ?, ?, ?)`,
      [
        id,
        segmentSlug,
        categorySlug,
        title,
        title,
        'Ilustracao gerada pelo sistema. Substitua por imagem propria do estabelecimento.',
        Buffer.byteLength(svg),
        req.user.id,
        now(),
        now(),
      ],
    );
    logActivity(req.user, 'image.generated', 'image', id, `Ilustracao "${title}" gerada para o segmento ${segmentSlug}`);
    res.status(201).json({ image: serialize(get('SELECT * FROM images WHERE id = ?', [id])) });
  });

  /* ---------------------------- Substituir ---------------------------- */
  router.put('/images/:id/file', requireRole('admin', 'editor'), async (req, res) => {
    const row = get('SELECT * FROM images WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Imagem nao encontrada');

    const { file, fields } = await readMultipartImage(req);
    if (!file || !file.size) throw badRequest('Envie o novo arquivo no campo "file"');
    const ext = detectExt(file.buffer, file.filename);

    if (fields.client_id && row.owner_client_id === null) {
      throw badRequest('Imagens da biblioteca compartilhada devem ser substituidas no proprio escopo da biblioteca. Envie uma imagem propria para o cliente.');
    }

    saveUpload({ clientId: row.owner_client_id, segmentSlug: row.segment_slug, id: row.id, ext, buffer: file.buffer });

    const license = fields.license && ['own', 'authorized', 'illustrative'].includes(fields.license) ? fields.license : row.license;
    run(
      `UPDATE images SET file_ext = ?, file_size = ?, width = ?, height = ?, license = ?, license_note = ?,
         replaced_at = ?, updated_at = ? WHERE id = ?`,
      [
        ext.replace('.', ''),
        file.size,
        Number(fields.width) || row.width,
        Number(fields.height) || row.height,
        license,
        String(fields.license_note || row.license_note).slice(0, 300),
        now(),
        now(),
        row.id,
      ],
    );
    logActivity(req.user, 'image.replaced', 'image', row.id, `Arquivo da imagem "${row.title}" substituido`);
    res.json({ image: serialize(get('SELECT * FROM images WHERE id = ?', [row.id])) });
  });

  router.patch('/images/:id', requireRole('admin', 'editor'), (req, res) => {
    const row = get('SELECT * FROM images WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Imagem nao encontrada');
    const body = req.body ?? {};
    const fields = [];
    const params = [];
    for (const key of ['title', 'alt', 'category_slug']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(String(body[key]).slice(0, key === 'alt' ? 200 : 120));
      }
    }
    if (body.tags !== undefined) {
      fields.push('tags = ?');
      params.push(JSON.stringify((Array.isArray(body.tags) ? body.tags : String(body.tags).split(',')).map((t) => String(t).trim()).filter(Boolean).slice(0, 10)));
    }
    if (body.license !== undefined) {
      if (!['own', 'authorized', 'illustrative'].includes(body.license)) throw badRequest('Licenca invalida');
      fields.push('license = ?');
      params.push(body.license);
    }
    if (body.license_note !== undefined) {
      fields.push('license_note = ?');
      params.push(String(body.license_note).slice(0, 300));
    }
    if (body.is_cover !== undefined) {
      if (body.is_cover) {
        tx(() => {
          if (row.owner_client_id) run('UPDATE images SET is_cover = 0 WHERE owner_client_id = ?', [row.owner_client_id]);
          else run('UPDATE images SET is_cover = 0 WHERE segment_slug = ? AND owner_client_id IS NULL', [row.segment_slug]);
          run('UPDATE images SET is_cover = 1 WHERE id = ?', [row.id]);
        });
      } else {
        run('UPDATE images SET is_cover = 0 WHERE id = ?', [row.id]);
      }
    }
    if (!fields.length) throw badRequest('Nenhum campo para atualizar');
    fields.push('updated_at = ?');
    params.push(now(), row.id);
    run(`UPDATE images SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ image: serialize(get('SELECT * FROM images WHERE id = ?', [row.id])) });
  });

  /* ----------------------------- Excluir ----------------------------- */
  router.delete('/images/:id', requireRole('admin', 'editor'), (req, res) => {
    const row = get('SELECT * FROM images WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Imagem nao encontrada');
    if (!row.owner_client_id && row.source === 'library' && req.user.role !== 'admin') {
      throw conflict('Somente administradores podem remover imagens da biblioteca compartilhada');
    }
    if (!row.owner_client_id) {
      const using = countUsages(row.id);
      if (using.length && req.query.force !== 'true') {
        throw conflict('Imagem em uso por templates. Confirme para remover mesmo assim.', { in_use_by: using });
      }
    }
    removeImageFile(row);
    run('DELETE FROM images WHERE id = ?', [row.id]);
    logActivity(req.user, 'image.deleted', 'image', row.id, `Imagem "${row.title}" removida`);
    res.json({ ok: true });
  });

  router.get('/images/:id/usages', (req, res) => {
    const row = get('SELECT * FROM images WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Imagem nao encontrada');
    res.json({ usages: countUsages(row.id) });
  });

  /* Download direto (util para abrir a imagem em nova aba) */
  router.get('/images/:id/file', (req, res) => {
    const row = get('SELECT * FROM images WHERE id = ?', [req.params.id]);
    if (!row) throw notFound('Imagem nao encontrada');
    const file = imagePath(row);
    if (!file || !existsSync(file)) throw notFound('Arquivo da imagem nao encontrado');
    const mime = mimeForExt(`.${row.file_ext}`);
    res.setHeader('Content-Type', mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (mime === 'image/svg+xml') {
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:");
    }
    res.send(readFileSync(file));
  });

  return wrapAsyncRouter(router);
}

function countUsages(imageId) {
  const usages = [];
  for (const tpl of all('SELECT id, name, config FROM templates')) {
    if (JSON.stringify(parseJson(tpl.config, {})).includes(`"${imageId}"`)) {
      usages.push({ type: 'template', id: tpl.id, name: tpl.name });
    }
  }
  for (const site of all('SELECT s.id, s.config, c.name FROM sites s JOIN clients c ON c.id = s.client_id')) {
    if (JSON.stringify(parseJson(site.config, {})).includes(`"${imageId}"`)) {
      usages.push({ type: 'site', id: site.id, name: site.name });
    }
  }
  return usages;
}

/** Detecta extensao real pelo magic number, ignorando o nome enviado. */
function detectExt(buffer, filename = '') {
  if (buffer.length > 8) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return '.png';
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return '.jpg';
    if (buffer.slice(0, 4).toString('ascii') === 'GIF8') return '.gif';
    if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return '.webp';
    if (buffer.slice(4, 8).toString('ascii') === 'ftyp') return '.avif';
    const head = buffer.slice(0, 400).toString('utf8').trim();
    if (head.startsWith('<svg') || head.startsWith('<?xml')) return '.svg';
  }
  const ext = String(filename).toLowerCase().match(/\.(png|jpe?g|webp|gif|avif|svg)$/)?.[0];
  if (!ext) throw badRequest('Formato nao suportado. Use PNG, JPG, WEBP, GIF, AVIF ou SVG.');
  return ext === '.jpeg' ? '.jpg' : ext;
}
