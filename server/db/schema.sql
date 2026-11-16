-- Schema do painel administrativo de sites.
-- Regras centrais de isolamento:
--   * templates guardam apenas o MODELO (config imutavel apos publicado, versionado)
--   * sites guardam uma COPIA PROFUNDA e independente do config do template
--   * nenhuma rota de cliente escreve em templates
--   * imagens da biblioteca (owner_client_id NULL) sao compartilhadas e somente leitura
--   * imagens de cliente (owner_client_id preenchido) sao privadas daquele cliente

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','editor')),
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS segments (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS templates (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  segment_slug   TEXT NOT NULL REFERENCES segments(slug),
  category       TEXT NOT NULL DEFAULT 'geral',
  summary        TEXT NOT NULL DEFAULT '',
  description    TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  version        INTEGER NOT NULL DEFAULT 1,
  cover_image_id     TEXT,
  thumbnail_image_id TEXT,
  accent         TEXT NOT NULL DEFAULT '#2563eb',
  config         TEXT NOT NULL,
  sections_count INTEGER NOT NULL DEFAULT 0,
  created_by     TEXT REFERENCES users(id),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_templates_segment ON templates(segment_slug, category, status);

CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  segment_slug  TEXT NOT NULL REFERENCES segments(slug),
  contact_name  TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  notes         TEXT NOT NULL DEFAULT '',
  created_by    TEXT REFERENCES users(id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Um site por cliente. template_id + template_version documentam a origem,
-- mas o config abaixo e um snapshot independente (nunca uma referencia viva).
CREATE TABLE IF NOT EXISTS sites (
  id               TEXT PRIMARY KEY,
  client_id        TEXT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  template_id      TEXT REFERENCES templates(id) ON DELETE SET NULL,
  template_name    TEXT NOT NULL DEFAULT '',
  template_version INTEGER NOT NULL DEFAULT 1,
  config           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','offline')),
  subdomain        TEXT NOT NULL UNIQUE,
  published_at     TEXT,
  updated_at       TEXT NOT NULL,
  updated_by       TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS site_revisions (
  id         TEXT PRIMARY KEY,
  site_id    TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  version    INTEGER NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  config     TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revisions_site ON site_revisions(site_id, version DESC);

CREATE TABLE IF NOT EXISTS image_categories (
  id          TEXT PRIMARY KEY,
  segment_slug TEXT NOT NULL REFERENCES segments(slug),
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (segment_slug, slug)
);

CREATE TABLE IF NOT EXISTS images (
  id               TEXT PRIMARY KEY,
  segment_slug     TEXT NOT NULL REFERENCES segments(slug),
  category_slug    TEXT NOT NULL,
  title            TEXT NOT NULL,
  alt              TEXT NOT NULL DEFAULT '',
  tags             TEXT NOT NULL DEFAULT '[]',
  width            INTEGER NOT NULL DEFAULT 1200,
  height           INTEGER NOT NULL DEFAULT 800,
  source           TEXT NOT NULL DEFAULT 'library' CHECK (source IN ('library','upload')),
  license          TEXT NOT NULL DEFAULT 'illustrative' CHECK (license IN ('illustrative','own','authorized')),
  license_note     TEXT NOT NULL DEFAULT '',
  owner_client_id  TEXT REFERENCES clients(id) ON DELETE CASCADE,
  is_cover         INTEGER NOT NULL DEFAULT 0,
  file_ext         TEXT NOT NULL DEFAULT 'svg',
  file_size        INTEGER NOT NULL DEFAULT 0,
  replaced_at      TEXT,
  created_by       TEXT REFERENCES users(id),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_images_scope ON images(segment_slug, category_slug, owner_client_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id),
  actor      TEXT NOT NULL DEFAULT '',
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT NOT NULL DEFAULT '',
  summary    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
