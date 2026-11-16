import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import { MEDIA_DIR } from '../db/index.js';

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']);
const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

/**
 * Cada imagem tem armazenamento individualizado:
 *   data/media/library/<segmento>/<arquivo>   -> biblioteca compartilhada (somente leitura via app)
 *   data/media/clients/<clientId>/<arquivo>   -> uploads privados do cliente
 * O nome do arquivo e sempre gerado pelo servidor (nunca vem do cliente),
 * evitando path traversal.
 */
export function imagePath(image) {
  if (!image) return null;
  if (image.owner_client_id) {
    return path.join(MEDIA_DIR, 'clients', image.owner_client_id, `${image.id}.${image.file_ext}`);
  }
  return path.join(MEDIA_DIR, 'library', image.segment_slug, `${image.id}.${image.file_ext}`);
}

export function imageUrl(image) {
  if (!image) return null;
  return `/media/${image.id}.${image.file_ext}`;
}

/**
 * SVG e um formato ativo (pode conter script). Rejeitamos marcadores de risco
 * no upload e servimos sempre com CSP restritiva — nunca executamos o arquivo
 * no contexto do painel.
 */
const SVG_THREATS = [/<script/i, /<foreignObject/i, /\son\w+\s*=/i, /javascript:/i, /<iframe/i, /<embed/i, /<object/i, /<!ENTITY/i];

export function assertSafeSvg(buffer) {
  const text = buffer.toString('utf8');
  for (const pattern of SVG_THREATS) {
    if (pattern.test(text)) {
      throw Object.assign(new Error('SVG rejeitado: conteudo ativo (script/evento) nao e permitido'), { status: 400 });
    }
  }
}

export function saveUpload({ clientId = null, segmentSlug = 'geral', id, ext, buffer }) {
  if (!IMAGE_EXT.has(ext)) {
    throw Object.assign(new Error('Formato de imagem nao suportado'), { status: 400 });
  }
  if (ext === '.svg') assertSafeSvg(buffer);
  const target = clientId
    ? path.join(MEDIA_DIR, 'clients', clientId)
    : path.join(MEDIA_DIR, 'library', segmentSlug);
  mkdirSync(target, { recursive: true });
  const file = path.join(target, `${id}${ext}`);
  writeFileSync(file, buffer);
  return { path: file, size: buffer.length };
}

export function removeImageFile(image) {
  const file = imagePath(image);
  if (file && existsSync(file)) {
    try {
      unlinkSync(file);
    } catch {
      /* arquivo pode estar em uso */
    }
  }
}

export function mimeForExt(ext) {
  return MIME[ext] ?? 'application/octet-stream';
}

export function extFromName(name = '') {
  return path.extname(String(name)).toLowerCase();
}
