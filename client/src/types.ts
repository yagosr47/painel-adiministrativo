export type Role = 'admin' | 'editor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ImageRef {
  id: string;
  url: string;
  title: string;
  alt?: string;
  license?: 'illustrative' | 'own' | 'authorized';
  owner_client_id?: string | null;
}

export interface ImageAsset {
  id: string;
  segment_slug: string;
  category_slug: string;
  title: string;
  alt: string;
  tags: string[];
  width: number;
  height: number;
  source: 'library' | 'upload';
  license: 'illustrative' | 'own' | 'authorized';
  license_note: string;
  illustrative: boolean;
  owner_client_id: string | null;
  scope: 'library' | 'client';
  is_cover: boolean;
  url: string;
  file_ext: string;
  file_size: number;
  replaced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type SectionType =
  | 'hero'
  | 'about'
  | 'features'
  | 'catalog'
  | 'gallery'
  | 'team'
  | 'testimonials'
  | 'hours'
  | 'contact'
  | 'cta'
  | 'faq'
  | 'stats'
  | 'steps'
  | 'brands'
  | 'menu-highlights'
  | 'booking';

export interface Section {
  id: string;
  type: SectionType;
  label: string;
  enabled: boolean;
  variant: string;
  props: Record<string, any>;
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  radius: number;
  fontHeading: string;
  fontBody: string;
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number | null;
  priceNote: string;
  categoryId: string | null;
  imageId: string | null;
  badge: string;
  featured: boolean;
  active: boolean;
  order: number;
}

export interface SiteConfig {
  schemaVersion: number;
  identity: {
    name: string;
    tagline: string;
    description: string;
    logoImageId: string | null;
    logoText: string;
    showLogoText: boolean;
  };
  theme: Theme;
  navigation: { label: string; href: string }[];
  sections: Section[];
  products: { categories: ProductCategory[]; items: Product[] };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    city: string;
    mapUrl: string;
    hours: { label: string; open: string; close: string; closed: boolean }[];
    noteHours: string;
  };
  links: { label: string; type: string; value: string }[];
  media: { coverImageId: string | null; thumbnailImageId: string | null };
  seo: { title: string; description: string; keywords: string };
  footer: { text: string; note: string };
}

export interface TemplateStats {
  sections: number;
  products: number;
  categories: number;
  images: number;
}

export interface Template {
  id: string;
  slug: string;
  name: string;
  segment_slug: string;
  segment_name: string;
  category: string;
  summary: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  accent: string;
  cover_image_id: string | null;
  thumbnail_image_id: string | null;
  cover: ImageRef | null;
  thumbnail: ImageRef | null;
  stats: TemplateStats;
  sites_using: number;
  created_at: string;
  updated_at: string;
  config?: SiteConfig;
}

/** Ponto de partida pre-pronto que o servidor oferece para cada segmento. */
export interface TemplatePreset {
  segment_slug: string;
  segment_name: string;
  category: string;
  accent: string;
  sections: string[];
  sections_count: number;
  products_count: number;
  categories_count: number;
  density: string;
  font_heading: string;
}

export interface SegmentCategory {
  id: string;
  segment_slug: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  images: number;
}

export interface Segment {
  slug: string;
  name: string;
  description: string;
  icon: string;
  position: number;
  templates: number;
  clients: number;
  images: number;
  categories: SegmentCategory[];
}

export interface ClientSiteSummary {
  id: string;
  status: 'draft' | 'published' | 'offline';
  subdomain: string;
  template_id: string | null;
  template_name: string;
  template_version: number;
  published_at: string | null;
  updated_at: string;
  stats: TemplateStats | null;
  accent: string;
  cover: string | null;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  segment_slug: string;
  segment_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'active' | 'paused' | 'archived';
  notes: string;
  created_at: string;
  updated_at: string;
  site: ClientSiteSummary | null;
}

export interface ClientDetail {
  client: Client;
  site: {
    id: string;
    status: 'draft' | 'published' | 'offline';
    subdomain: string;
    template_id: string | null;
    template_name: string;
    template_version: number;
    published_at: string | null;
    updated_at: string;
    config: SiteConfig;
  } | null;
  images: Record<string, ImageRef>;
  template: { id: string; name: string; version_now: number; origin_version: number } | null;
}

export interface Revision {
  id: string;
  version: number;
  label: string;
  created_at: string;
  author: string | null;
}

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
  created_at: string;
}
