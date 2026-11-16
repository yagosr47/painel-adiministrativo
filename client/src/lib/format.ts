export const currency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const dateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

export const relative = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return '—';
  const diff = Date.now() - date;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `ha ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `ha ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `ha ${days} d`;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso));
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const bytes = (value: number) => {
  if (!value) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const STATUS_LABEL: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  offline: 'Fora do ar',
  archived: 'Arquivado',
  active: 'Ativo',
  paused: 'Pausado',
};

export const SECTION_LABEL: Record<string, string> = {
  hero: 'Destaque principal',
  about: 'Sobre / historia',
  features: 'Diferenciais',
  catalog: 'Catalogo',
  gallery: 'Galeria',
  team: 'Equipe',
  testimonials: 'Depoimentos',
  hours: 'Horarios',
  contact: 'Contato',
  cta: 'Chamada para acao',
  faq: 'Perguntas frequentes',
  stats: 'Numeros',
  steps: 'Passo a passo',
  brands: 'Marcas / convenios',
  'menu-highlights': 'Destaques do menu',
  booking: 'Agendamento',
};

export const FONTS: { id: string; name: string; sample: string; stack: string }[] = [
  { id: 'geometric', name: 'Geometrica', sample: 'Aa Bb Cc', stack: "'Archivo', 'Inter', sans-serif" },
  { id: 'serif', name: 'Serifada', sample: 'Aa Bb Cc', stack: "'Playfair Display', Georgia, serif" },
  { id: 'condensed', name: 'Condensada', sample: 'Aa Bb Cc', stack: "'Bebas Neue', 'Archivo', sans-serif" },
  { id: 'humanist', name: 'Humanista', sample: 'Aa Bb Cc', stack: "'DM Sans', 'Inter', sans-serif" },
  { id: 'script', name: 'Manuscrita', sample: 'Aa Bb Cc', stack: "'Caveat', cursive" },
];

export const fontStack = (id: string) => FONTS.find((f) => f.id === id)?.stack ?? FONTS[0].stack;
