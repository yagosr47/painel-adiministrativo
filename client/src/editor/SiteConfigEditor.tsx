import React, { useState } from 'react';
import type { ImageRef, Section, SiteConfig, Theme } from '../types';
import { ColorField, Field, useToast } from '../components/ui';
import { FONTS, SECTION_LABEL, currency } from '../lib/format';

export interface EditorContext {
  images: Record<string, ImageRef>;
  /** Abre o seletor de imagem. `multiple` permite escolher varias. */
  pickImage: (onPick: (ids: string[]) => void, opts?: { multiple?: boolean }) => void;
  /** true quando o editor opera no escopo de um cliente (uploads proprios permitidos). */
  clientScoped: boolean;
}

export const EDITOR_TABS = [
  { key: 'identity', label: 'Identidade' },
  { key: 'theme', label: 'Cores e tipografia' },
  { key: 'sections', label: 'Secoes' },
  { key: 'catalog', label: 'Produtos e servicos' },
  { key: 'contact', label: 'Contato e links' },
  { key: 'seo', label: 'SEO e rodape' },
] as const;

export type EditorTab = (typeof EDITOR_TABS)[number]['key'];

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/** Clone profundo simples para nao mutar o estado do React. */
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function SiteConfigEditor({
  config,
  onChange,
  context,
  tab,
}: {
  config: SiteConfig;
  onChange: (next: SiteConfig) => void;
  context: EditorContext;
  tab: EditorTab;
}) {
  const set = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  if (tab === 'identity') return <IdentityTab config={config} set={set} context={context} />;
  if (tab === 'theme') return <ThemeTab config={config} set={set} />;
  if (tab === 'sections') return <SectionsTab config={config} onChange={onChange} context={context} />;
  if (tab === 'catalog') return <CatalogTab config={config} onChange={onChange} context={context} />;
  if (tab === 'contact') return <ContactTab config={config} set={set} />;
  return <SeoTab config={config} set={set} />;
}

/* ------------------------------- Identidade ------------------------------- */

function IdentityTab({ config, set, context }: { config: SiteConfig; set: any; context: EditorContext }) {
  const identity = config.identity;
  const logo = identity.logoImageId ? context.images[identity.logoImageId] : null;
  return (
    <div className="stack">
      <div className="grid cols-2">
        <Field label="Nome do estabelecimento" hint="Usado no cabecalho, titulo e SEO">
          <input
            className="input"
            value={identity.name}
            onChange={(e) => set('identity', { ...identity, name: e.target.value })}
          />
        </Field>
        <Field label="Texto do logotipo" hint="Exibido ao lado da marca (se ativado)">
          <input
            className="input"
            value={identity.logoText}
            onChange={(e) => set('identity', { ...identity, logoText: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Slogan / tagline">
        <input
          className="input"
          value={identity.tagline}
          onChange={(e) => set('identity', { ...identity, tagline: e.target.value })}
          placeholder="Ex.: Massa de fermentacao natural"
        />
      </Field>

      <Field label="Descricao curta" hint="Resumo do negocio usado em SEO e na abertura do site">
        <textarea
          className="textarea"
          rows={3}
          value={identity.description}
          onChange={(e) => set('identity', { ...identity, description: e.target.value })}
        />
      </Field>

      <div className="card card-pad">
        <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'var(--panel-2)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {logo ? (
              <img src={logo.url} alt="Logotipo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span className="small muted">sem logo</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">Logotipo</div>
            <div className="hint" style={{ marginBottom: 8 }}>
              Prefira PNG ou SVG com fundo transparente. Envie o logotipo real do estabelecimento —
              {context.clientScoped ? ' o upload fica restrito a este cliente.' : ' em templates use ilustracoes ou imagens autorizadas.'}
            </div>
            <div className="btn-group">
              <button
                className="btn sm"
                onClick={() =>
                  context.pickImage((ids) => set('identity', { ...identity, logoImageId: ids[0] ?? null }))
                }
              >
                {logo ? 'Trocar logotipo' : 'Escolher logotipo'}
              </button>
              {logo ? (
                <button className="btn sm ghost" onClick={() => set('identity', { ...identity, logoImageId: null })}>
                  Remover
                </button>
              ) : null}
            </div>
            <label className="row small" style={{ marginTop: 10, gap: 6 }}>
              <input
                type="checkbox"
                checked={identity.showLogoText}
                onChange={(e) => set('identity', { ...identity, showLogoText: e.target.checked })}
              />
              Exibir nome ao lado do logotipo
            </label>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 4 }}>
          Imagem de capa e miniatura
        </div>
        <div className="hint" style={{ marginBottom: 12 }}>
          Usadas para representar este site/template no painel. A capa nao aparece necessariamente na pagina —
          ela e a vitrine da biblioteca.
        </div>
        <div className="grid cols-2">
          <ImageSlotField
            label="Capa (16:10)"
            imageId={config.media.coverImageId}
            context={context}
            onChange={(id) => set('media', { ...config.media, coverImageId: id })}
          />
          <ImageSlotField
            label="Miniatura (16:10)"
            imageId={config.media.thumbnailImageId}
            context={context}
            onChange={(id) => set('media', { ...config.media, thumbnailImageId: id })}
          />
        </div>
      </div>

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 8 }}>
          Menu de navegacao
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {config.navigation.map((item, index) => (
            <div key={index} className="row">
              <input
                className="input sm"
                style={{ maxWidth: 170 }}
                value={item.label}
                placeholder="Rotulo"
                onChange={(e) => {
                  const nav = clone(config.navigation);
                  nav[index].label = e.target.value;
                  set('navigation', nav);
                }}
              />
              <input
                className="input sm mono"
                value={item.href}
                placeholder="#secao"
                onChange={(e) => {
                  const nav = clone(config.navigation);
                  nav[index].href = e.target.value;
                  set('navigation', nav);
                }}
              />
              <button
                className="btn sm ghost"
                onClick={() => set('navigation', config.navigation.filter((_, i) => i !== index))}
                title="Remover"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn sm"
          style={{ marginTop: 10 }}
          onClick={() => set('navigation', [...config.navigation, { label: 'Nova secao', href: '#' }])}
        >
          ＋ Adicionar item
        </button>
      </div>
    </div>
  );
}

function ImageSlotField({
  label,
  imageId,
  context,
  onChange,
}: {
  label: string;
  imageId: string | null;
  context: EditorContext;
  onChange: (id: string | null) => void;
}) {
  const image = imageId ? context.images[imageId] : null;
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ aspectRatio: '16 / 10', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--panel-2)' }}>
        {image ? (
          <img src={image.url} alt={image.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="empty-img" style={{ height: '100%', minHeight: 0 }}>
            sem imagem
          </div>
        )}
      </div>
      <div className="btn-group" style={{ marginTop: 6 }}>
        <button className="btn sm" onClick={() => context.pickImage((ids) => onChange(ids[0] ?? null))}>
          {image ? 'Trocar' : 'Escolher'}
        </button>
        {image ? (
          <button className="btn sm ghost" onClick={() => onChange(null)}>
            Remover
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* --------------------------------- Tema ---------------------------------- */

const PALETTE_PRESETS: { name: string; theme: Partial<Theme> }[] = [
  {
    name: 'Classico escuro',
    theme: { primary: '#111827', secondary: '#374151', accent: '#f59e0b', background: '#0b0f17', surface: '#161c27', text: '#f8fafc', muted: '#94a3b8' },
  },
  {
    name: 'Terroso',
    theme: { primary: '#7c2d12', secondary: '#431407', accent: '#f97316', background: '#fffbf5', surface: '#ffedd5', text: '#1c1917', muted: '#78716c' },
  },
  {
    name: 'Clinico',
    theme: { primary: '#0c4a6e', secondary: '#0e7490', accent: '#38bdf8', background: '#f8fafc', surface: '#e0f2fe', text: '#0f172a', muted: '#55708a' },
  },
  {
    name: 'Editorial claro',
    theme: { primary: '#18181b', secondary: '#3f3f46', accent: '#e11d48', background: '#ffffff', surface: '#f4f4f5', text: '#18181b', muted: '#71717a' },
  },
  {
    name: 'Verde fresco',
    theme: { primary: '#14532d', secondary: '#166534', accent: '#f59e0b', background: '#f7fdf9', surface: '#dcfce7', text: '#052e16', muted: '#4b7a5e' },
  },
  {
    name: 'Delicado',
    theme: { primary: '#831843', secondary: '#9d174d', accent: '#f9a8d4', background: '#fff7fb', surface: '#fce7f3', text: '#3f1229', muted: '#9d7188' },
  },
];

function ThemeTab({ config, set }: { config: SiteConfig; set: any }) {
  const theme = config.theme;
  const update = (patch: Partial<Theme>) => set('theme', { ...theme, ...patch });
  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 8 }}>
          Paletas prontas
        </div>
        <div className="btn-group">
          {PALETTE_PRESETS.map((preset) => (
            <button key={preset.name} className="btn sm" onClick={() => update(preset.theme)}>
              <span style={{ display: 'flex', gap: 2 }}>
                {[preset.theme.primary, preset.theme.accent, preset.theme.surface].map((c, i) => (
                  <i key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c, display: 'block' }} />
                ))}
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 10 }}>
          Cores
        </div>
        <div className="grid cols-3">
          <ColorField label="Primaria" value={theme.primary} onChange={(v) => update({ primary: v })} />
          <ColorField label="Secundaria" value={theme.secondary} onChange={(v) => update({ secondary: v })} />
          <ColorField label="Destaque" value={theme.accent} onChange={(v) => update({ accent: v })} />
          <ColorField label="Fundo" value={theme.background} onChange={(v) => update({ background: v })} />
          <ColorField label="Superficie" value={theme.surface} onChange={(v) => update({ surface: v })} />
          <ColorField label="Texto" value={theme.text} onChange={(v) => update({ text: v })} />
          <ColorField label="Texto secundario" value={theme.muted} onChange={(v) => update({ muted: v })} />
        </div>
      </div>

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 10 }}>
          Tipografia
        </div>
        <div className="grid cols-2">
          <Field label="Fonte dos titulos">
            <select className="select" value={theme.fontHeading} onChange={(e) => update({ fontHeading: e.target.value })}>
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fonte do texto">
            <select className="select" value={theme.fontBody} onChange={(e) => update({ fontBody: e.target.value })}>
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid cols-2" style={{ marginTop: 12 }}>
          <Field label={`Arredondamento: ${theme.radius}px`}>
            <input
              type="range"
              min={0}
              max={32}
              value={theme.radius}
              onChange={(e) => update({ radius: Number(e.target.value) })}
            />
          </Field>
          <Field label="Densidade do layout">
            <select className="select" value={theme.density} onChange={(e) => update({ density: e.target.value as Theme['density'] })}>
              <option value="compact">Compacta</option>
              <option value="comfortable">Confortavel</option>
              <option value="spacious">Espacosa</option>
            </select>
          </Field>
        </div>
        <div
          style={{
            marginTop: 14,
            padding: 18,
            borderRadius: theme.radius,
            background: theme.background,
            color: theme.text,
            border: `1px solid ${theme.surface}`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.find((f) => f.id === theme.fontHeading)?.stack,
              fontSize: 22,
              fontWeight: 700,
              color: theme.primary,
            }}
          >
            Titulo de exemplo
          </div>
          <div
            style={{
              fontFamily: FONTS.find((f) => f.id === theme.fontBody)?.stack,
              fontSize: 13.5,
              color: theme.muted,
              marginTop: 4,
            }}
          >
            Corpo de texto com a fonte escolhida, sobre o fundo do site.
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: 10,
              padding: '7px 15px',
              borderRadius: theme.radius * 0.8,
              background: theme.accent,
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 650,
            }}
          >
            Botao de exemplo
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Secoes --------------------------------- */

const SECTION_PROPS_HINT: Record<string, string> = {
  hero: 'Abertura do site. Ideal com imagem forte e uma chamada para acao.',
  about: 'Historia e diferenciais do estabelecimento.',
  features: 'Diferenciais em blocos curtos com icone.',
  catalog: 'Lista de produtos/servicos vinda da aba "Produtos e servicos".',
  gallery: 'Conjunto de imagens — priorize fotos proprias.',
  team: 'Profissionais e especialidades.',
  testimonials: 'Depoimentos de clientes.',
  hours: 'Horarios de funcionamento.',
  contact: 'Endereco, telefone, formulario e links.',
  cta: 'Faixa de chamada para acao.',
  faq: 'Perguntas frequentes.',
  stats: 'Numeros de destaque.',
  steps: 'Passo a passo de atendimento/processo.',
  brands: 'Marcas, convenios ou parceiros.',
  'menu-highlights': 'Selecao de itens do catalogo.',
  booking: 'Bloco de agendamento por WhatsApp/telefone.',
};

const ADDABLE_SECTIONS: Section['type'][] = [
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

function defaultSection(type: Section['type']): Section {
  const base = { enabled: true, variant: 'default', props: {} as Record<string, any> };
  switch (type) {
    case 'hero':
      return { id: uid('hero'), type, label: 'Destaque principal', ...base, props: { eyebrow: '', title: '', subtitle: '', imageId: null, align: 'left', overlay: 45, primaryLabel: '', primaryHref: '', secondaryLabel: '', secondaryHref: '', badges: [] } };
    case 'about':
      return { id: uid('about'), type, label: 'Sobre', ...base, props: { title: 'Sobre', body: '', imageId: null, highlights: [], layout: 'image-right' } };
    case 'features':
      return { id: uid('feat'), type, label: 'Diferenciais', ...base, props: { title: 'Diferenciais', subtitle: '', items: [] } };
    case 'catalog':
      return { id: uid('cat'), type, label: 'Catalogo', ...base, props: { title: 'Catalogo', subtitle: '', mode: 'cards', showPrices: true, columns: 3, categoryFilter: true, ctaLabel: '' } };
    case 'gallery':
      return { id: uid('gal'), type, label: 'Galeria', ...base, props: { title: 'Galeria', subtitle: '', imageIds: [], columns: 3, layout: 'grid' } };
    case 'team':
      return { id: uid('team'), type, label: 'Equipe', ...base, props: { title: 'Equipe', subtitle: '', members: [] } };
    case 'testimonials':
      return { id: uid('test'), type, label: 'Depoimentos', ...base, props: { title: 'Depoimentos', subtitle: '', items: [] } };
    case 'hours':
      return { id: uid('hours'), type, label: 'Horarios', ...base, props: { title: 'Horarios', subtitle: '', days: [], note: '' } };
    case 'contact':
      return { id: uid('cont'), type, label: 'Contato', ...base, props: { title: 'Contato', subtitle: '', showMap: true, showForm: true, formCta: 'Enviar mensagem' } };
    case 'cta':
      return { id: uid('cta'), type, label: 'Chamada para acao', ...base, props: { title: '', body: '', label: '', href: '', imageId: null } };
    case 'faq':
      return { id: uid('faq'), type, label: 'Perguntas frequentes', ...base, props: { title: 'Perguntas frequentes', subtitle: '', items: [] } };
    case 'stats':
      return { id: uid('stats'), type, label: 'Numeros', ...base, props: { title: '', items: [] } };
    case 'steps':
      return { id: uid('steps'), type, label: 'Passo a passo', ...base, props: { title: 'Como funciona', subtitle: '', items: [] } };
    case 'brands':
      return { id: uid('brands'), type, label: 'Marcas', ...base, props: { title: 'Marcas e parceiros', items: [] } };
    case 'menu-highlights':
      return { id: uid('menu'), type, label: 'Destaques do menu', ...base, props: { title: 'Destaques', subtitle: '', itemIds: [], layout: 'feature' } };
    case 'booking':
      return { id: uid('book'), type, label: 'Agendamento', ...base, props: { title: 'Agende seu horario', body: '', label: 'Agendar', href: '', channels: [] } };
    default:
      return { id: uid('sec'), type, label: type, ...base };
  }
}

function SectionsTab({
  config,
  onChange,
  context,
}: {
  config: SiteConfig;
  onChange: (c: SiteConfig) => void;
  context: EditorContext;
}) {
  const [open, setOpen] = useState<string | null>(config.sections[0]?.id ?? null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const toast = useToast();

  const updateSections = (sections: Section[]) => onChange({ ...config, sections });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= config.sections.length) return;
    const next = clone(config.sections);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateSections(next);
  };

  return (
    <div className="stack">
      <div className="banner info">
        <span>ℹ</span>
        <span>
          Arraste pelo marcador para reordenar, ou use as setas. Desative uma secao para esconde-la sem perder o
          conteudo.
        </span>
      </div>

      {config.sections.map((section, index) => (
        <div
          key={section.id}
          className={`section-item ${section.enabled ? '' : 'disabled'} ${dragIndex === index ? 'drag-over' : ''}`}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
        >
          <div className="section-head" onClick={() => setOpen(open === section.id ? null : section.id)}>
            <span className="grip">⋮⋮</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="name">{section.label}</div>
              <div className="type">
                {SECTION_LABEL[section.type] ?? section.type} · #{section.id}
              </div>
            </div>
            <button
              className="btn sm ghost"
              title={section.enabled ? 'Desativar secao' : 'Ativar secao'}
              onClick={(e) => {
                e.stopPropagation();
                updateSections(
                  config.sections.map((s) => (s.id === section.id ? { ...s, enabled: !s.enabled } : s)),
                );
              }}
            >
              {section.enabled ? '👁' : '🚫'}
            </button>
            <button
              className="btn sm ghost"
              onClick={(e) => {
                e.stopPropagation();
                move(index, index - 1);
              }}
              title="Mover para cima"
            >
              ↑
            </button>
            <button
              className="btn sm ghost"
              onClick={(e) => {
                e.stopPropagation();
                move(index, index + 1);
              }}
              title="Mover para baixo"
            >
              ↓
            </button>
            <button
              className="btn sm ghost"
              onClick={(e) => {
                e.stopPropagation();
                const copy = clone(section);
                copy.id = uid(section.type);
                copy.label = `${section.label} (copia)`;
                const next = [...config.sections];
                next.splice(index + 1, 0, copy);
                updateSections(next);
              }}
              title="Duplicar secao"
            >
              ⧉
            </button>
            <button
              className="btn sm ghost"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remover a secao "${section.label}"?`)) {
                  updateSections(config.sections.filter((s) => s.id !== section.id));
                }
              }}
              title="Remover secao"
            >
              🗑
            </button>
            <span className="muted small">{open === section.id ? '▾' : '▸'}</span>
          </div>

          {open === section.id ? (
            <div className="section-body">
              <div className="grid cols-2">
                <Field label="Titulo interno da secao" hint="Aparece no menu e neste editor">
                  <input
                    className="input sm"
                    value={section.label}
                    onChange={(e) =>
                      updateSections(config.sections.map((s) => (s.id === section.id ? { ...s, label: e.target.value } : s)))
                    }
                  />
                </Field>
                <Field label="Tipo" hint={SECTION_PROPS_HINT[section.type]}>
                  <input className="input sm" value={SECTION_LABEL[section.type] ?? section.type} disabled />
                </Field>
              </div>
              <SectionProps
                section={section}
                config={config}
                context={context}
                onChange={(props) =>
                  updateSections(config.sections.map((s) => (s.id === section.id ? { ...s, props } : s)))
                }
              />
            </div>
          ) : null}
        </div>
      ))}

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 8 }}>
          Adicionar secao
        </div>
        <div className="btn-group">
          {ADDABLE_SECTIONS.map((type) => (
            <button
              key={type}
              className="btn sm"
              onClick={() => {
                const section = defaultSection(type);
                updateSections([...config.sections, section]);
                setOpen(section.id);
                toast.push(`Secao "${SECTION_LABEL[type]}" adicionada`, 'success');
              }}
            >
              ＋ {SECTION_LABEL[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Props por tipo ------------------------------ */

function TextInput({ label, value, onChange, placeholder }: any) {
  return (
    <Field label={label}>
      <input className="input sm" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function TextArea({ label, value, onChange, rows = 3, hint }: any) {
  return (
    <Field label={label} hint={hint}>
      <textarea className="textarea" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <Field label={label}>
      <select className="select sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function SectionImage({
  label,
  imageId,
  context,
  onChange,
}: {
  label: string;
  imageId: string | null;
  context: EditorContext;
  onChange: (id: string | null) => void;
}) {
  const image = imageId ? context.images[imageId] : null;
  return (
    <div className="field">
      <label>{label}</label>
      <div className="row">
        <div style={{ width: 92, aspectRatio: '4/3', borderRadius: 7, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--panel-2)', flexShrink: 0 }}>
          {image ? (
            <img src={image.url} alt={image.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="empty-img" style={{ height: '100%', minHeight: 0, fontSize: 9 }}>
              sem imagem
            </div>
          )}
        </div>
        <div className="btn-group">
          <button className="btn sm" onClick={() => context.pickImage((ids) => onChange(ids[0] ?? null))}>
            {image ? 'Trocar' : 'Escolher'}
          </button>
          {image ? (
            <button className="btn sm ghost" onClick={() => onChange(null)}>
              Remover
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ListEditor<T extends Record<string, any>>({
  label,
  items,
  fields,
  onChange,
  create,
}: {
  label: string;
  items: T[];
  fields: { key: keyof T & string; label: string; type?: 'text' | 'area' | 'number' }[];
  onChange: (items: T[]) => void;
  create: () => T;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="stack" style={{ gap: 8 }}>
        {items.map((item, index) => (
          <div key={index} className="card card-pad" style={{ padding: 10, background: 'var(--panel-2)' }}>
            <div className="grid cols-2" style={{ gap: 8 }}>
              {fields.map((field) => (
                <Field key={field.key} label={field.label} style={field.type === 'area' ? { gridColumn: '1 / -1' } : undefined}>
                  {field.type === 'area' ? (
                    <textarea
                      className="textarea"
                      rows={2}
                      value={String(item[field.key] ?? '')}
                      onChange={(e) => {
                        const next = clone(items);
                        next[index][field.key] = e.target.value as any;
                        onChange(next);
                      }}
                    />
                  ) : (
                    <input
                      className="input sm"
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={String(item[field.key] ?? '')}
                      onChange={(e) => {
                        const next = clone(items);
                        next[index][field.key] = (field.type === 'number' ? Number(e.target.value) : e.target.value) as any;
                        onChange(next);
                      }}
                    />
                  )}
                </Field>
              ))}
            </div>
            <button
              className="btn sm ghost"
              style={{ marginTop: 8, color: 'var(--danger)' }}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remover item
            </button>
          </div>
        ))}
      </div>
      <button className="btn sm" style={{ marginTop: 8, justifySelf: 'start' }} onClick={() => onChange([...items, create()])}>
        ＋ Adicionar
      </button>
    </div>
  );
}

function SectionProps({
  section,
  config,
  context,
  onChange,
}: {
  section: Section;
  config: SiteConfig;
  context: EditorContext;
  onChange: (props: Record<string, any>) => void;
}) {
  const p = section.props;
  const set = (patch: Record<string, any>) => onChange({ ...p, ...patch });

  switch (section.type) {
    case 'hero':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Sobretitulo (eyebrow)" value={p.eyebrow} onChange={(v: string) => set({ eyebrow: v })} />
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextArea label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <SectionImage label="Imagem de fundo" imageId={p.imageId} context={context} onChange={(id) => set({ imageId: id })} />
          <div className="grid cols-2">
            <Select label="Alinhamento" value={p.align} onChange={(v: string) => set({ align: v })} options={[
              { value: 'left', label: 'Esquerda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Direita' },
            ]} />
            <Field label={`Escurecimento da imagem: ${p.overlay ?? 0}%`}>
              <input type="range" min={0} max={90} value={p.overlay ?? 0} onChange={(e) => set({ overlay: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="grid cols-2">
            <TextInput label="Botao principal" value={p.primaryLabel} onChange={(v: string) => set({ primaryLabel: v })} />
            <TextInput label="Link do botao principal" value={p.primaryHref} onChange={(v: string) => set({ primaryHref: v })} />
            <TextInput label="Botao secundario" value={p.secondaryLabel} onChange={(v: string) => set({ secondaryLabel: v })} />
            <TextInput label="Link do botao secundario" value={p.secondaryHref} onChange={(v: string) => set({ secondaryHref: v })} />
          </div>
          <Field label="Selos/badges" hint="Separe por virgula">
            <input
              className="input sm"
              value={(p.badges ?? []).join(', ')}
              onChange={(e) => set({ badges: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>
        </div>
      );
    case 'about':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextArea label="Texto" rows={5} value={p.body} onChange={(v: string) => set({ body: v })} />
          <SectionImage label="Imagem" imageId={p.imageId} context={context} onChange={(id) => set({ imageId: id })} />
          <Select label="Posicao da imagem" value={p.layout} onChange={(v: string) => set({ layout: v })} options={[
            { value: 'image-right', label: 'Direita' },
            { value: 'image-left', label: 'Esquerda' },
            { value: 'stacked', label: 'Sem imagem' },
          ]} />
          <Field label="Destaques" hint="Separe por virgula">
            <input
              className="input sm"
              value={(p.highlights ?? []).join(', ')}
              onChange={(e) => set({ highlights: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>
        </div>
      );
    case 'features':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <ListEditor
            label="Itens"
            items={p.items ?? []}
            fields={[
              { key: 'icon', label: 'Icone (star, truck, shield, award, clock, leaf, phone…)' },
              { key: 'title', label: 'Titulo' },
              { key: 'body', label: 'Descricao', type: 'area' },
            ]}
            create={() => ({ icon: 'star', title: '', body: '' })}
            onChange={(items) => set({ items })}
          />
        </div>
      );
    case 'catalog':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <div className="grid cols-3">
            <Select label="Layout" value={p.mode} onChange={(v: string) => set({ mode: v })} options={[
              { value: 'cards', label: 'Cartoes' },
              { value: 'compact', label: 'Lista compacta' },
              { value: 'gallery', label: 'Galeria' },
            ]} />
            <Select label="Colunas" value={String(p.columns)} onChange={(v: string) => set({ columns: Number(v) })} options={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]} />
            <Field label="Opcoes">
              <label className="row small" style={{ gap: 6 }}>
                <input type="checkbox" checked={p.showPrices !== false} onChange={(e) => set({ showPrices: e.target.checked })} />
                Mostrar precos
              </label>
              <label className="row small" style={{ gap: 6 }}>
                <input type="checkbox" checked={p.categoryFilter !== false} onChange={(e) => set({ categoryFilter: e.target.checked })} />
                Filtro por categoria
              </label>
            </Field>
          </div>
          <TextInput label="Texto do botao de cada item" value={p.ctaLabel} onChange={(v: string) => set({ ctaLabel: v })} />
          <div className="hint">
            Os itens vem da aba <strong>Produtos e servicos</strong>. {config.products.items.length} itens cadastrados.
          </div>
        </div>
      );
    case 'gallery':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <div className="grid cols-2">
            <Select label="Layout" value={p.layout} onChange={(v: string) => set({ layout: v })} options={[
              { value: 'grid', label: 'Grade' },
              { value: 'masonry', label: 'Mosaico' },
              { value: 'carousel', label: 'Carrossel' },
            ]} />
            <Select label="Colunas" value={String(p.columns)} onChange={(v: string) => set({ columns: Number(v) })} options={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]} />
          </div>
          <Field label={`Imagens (${(p.imageIds ?? []).length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: 6 }}>
              {(p.imageIds ?? []).map((id: string, index: number) => {
                const img = context.images[id];
                return (
                  <div key={`${id}-${index}`} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {img ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="empty-img" style={{ height: '100%', minHeight: 0, fontSize: 8 }}>?</div>}
                    <button
                      className="btn sm"
                      style={{ position: 'absolute', top: 2, right: 2, padding: '0 5px', fontSize: 10, background: 'rgba(255,255,255,.92)' }}
                      onClick={() => set({ imageIds: p.imageIds.filter((_: string, i: number) => i !== index) })}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              className="btn sm"
              style={{ marginTop: 8, justifySelf: 'start' }}
              onClick={() => context.pickImage((ids) => set({ imageIds: [...(p.imageIds ?? []), ...ids] }), { multiple: true })}
            >
              ＋ Adicionar imagens
            </button>
          </Field>
        </div>
      );
    case 'team':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <div className="field">
            <label>Profissionais</label>
            {(p.members ?? []).map((member: any, index: number) => (
              <div key={index} className="card card-pad" style={{ padding: 10, marginBottom: 8, background: 'var(--panel-2)' }}>
                <div className="grid cols-2" style={{ gap: 8 }}>
                  <TextInput
                    label="Nome"
                    value={member.name}
                    onChange={(v: string) => {
                      const members = clone(p.members);
                      members[index].name = v;
                      set({ members });
                    }}
                  />
                  <TextInput
                    label="Cargo"
                    value={member.role}
                    onChange={(v: string) => {
                      const members = clone(p.members);
                      members[index].role = v;
                      set({ members });
                    }}
                  />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <TextInput
                      label="Mini bio"
                      value={member.bio}
                      onChange={(v: string) => {
                        const members = clone(p.members);
                        members[index].bio = v;
                        set({ members });
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <SectionImage
                      label="Foto"
                      imageId={member.imageId}
                      context={context}
                      onChange={(id) => {
                        const members = clone(p.members);
                        members[index].imageId = id;
                        set({ members });
                      }}
                    />
                  </div>
                </div>
                <button className="btn sm ghost" style={{ color: 'var(--danger)' }} onClick={() => set({ members: p.members.filter((_: any, i: number) => i !== index) })}>
                  Remover
                </button>
              </div>
            ))}
            <button className="btn sm" style={{ justifySelf: 'start' }} onClick={() => set({ members: [...(p.members ?? []), { name: '', role: '', imageId: null, bio: '' }] })}>
              ＋ Adicionar profissional
            </button>
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <ListEditor
            label="Depoimentos"
            items={p.items ?? []}
            fields={[
              { key: 'quote', label: 'Depoimento', type: 'area' },
              { key: 'author', label: 'Autor' },
              { key: 'detail', label: 'Detalhe (ex.: Google Reviews)' },
              { key: 'rating', label: 'Nota (1-5)', type: 'number' },
            ]}
            create={() => ({ quote: '', author: '', detail: '', rating: 5 })}
            onChange={(items) => set({ items })}
          />
        </div>
      );
    case 'hours':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <div className="field">
            <label>Dias e horarios</label>
            {(p.days ?? []).map((day: any, index: number) => (
              <div key={index} className="row" style={{ marginBottom: 6 }}>
                <input
                  className="input sm"
                  style={{ flex: 1 }}
                  value={day.label}
                  onChange={(e) => {
                    const days = clone(p.days);
                    days[index].label = e.target.value;
                    set({ days });
                  }}
                />
                <input
                  className="input sm"
                  style={{ width: 78 }}
                  value={day.open}
                  placeholder="09:00"
                  onChange={(e) => {
                    const days = clone(p.days);
                    days[index].open = e.target.value;
                    set({ days });
                  }}
                />
                <input
                  className="input sm"
                  style={{ width: 78 }}
                  value={day.close}
                  placeholder="18:00"
                  onChange={(e) => {
                    const days = clone(p.days);
                    days[index].close = e.target.value;
                    set({ days });
                  }}
                />
                <label className="row small" style={{ gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={day.closed}
                    onChange={(e) => {
                      const days = clone(p.days);
                      days[index].closed = e.target.checked;
                      set({ days });
                    }}
                  />
                  Fechado
                </label>
                <button className="btn sm ghost" onClick={() => set({ days: p.days.filter((_: any, i: number) => i !== index) })}>
                  ✕
                </button>
              </div>
            ))}
            <button
              className="btn sm"
              style={{ justifySelf: 'start' }}
              onClick={() => set({ days: [...(p.days ?? []), { label: 'Novo dia', open: '09:00', close: '18:00', closed: false }] })}
            >
              ＋ Adicionar dia
            </button>
          </div>
          <TextInput label="Observacao" value={p.note} onChange={(v: string) => set({ note: v })} />
        </div>
      );
    case 'contact':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <div className="grid cols-2">
            <Field label="Opcoes">
              <label className="row small" style={{ gap: 6 }}>
                <input type="checkbox" checked={p.showForm !== false} onChange={(e) => set({ showForm: e.target.checked })} />
                Exibir formulario
              </label>
              <label className="row small" style={{ gap: 6 }}>
                <input type="checkbox" checked={p.showMap !== false} onChange={(e) => set({ showMap: e.target.checked })} />
                Exibir mapa/endereco
              </label>
            </Field>
            <TextInput label="Texto do botao" value={p.formCta} onChange={(v: string) => set({ formCta: v })} />
          </div>
          <div className="hint">
            Os dados exibidos vem da aba <strong>Contato e links</strong>. WhatsApp: {config.contact.whatsapp || 'nao definido'}
          </div>
        </div>
      );
    case 'cta':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextArea label="Texto" value={p.body} onChange={(v: string) => set({ body: v })} />
          <div className="grid cols-2">
            <TextInput label="Texto do botao" value={p.label} onChange={(v: string) => set({ label: v })} />
            <TextInput label="Link do botao" value={p.href} onChange={(v: string) => set({ href: v })} />
          </div>
          <SectionImage label="Imagem de fundo" imageId={p.imageId} context={context} onChange={(id) => set({ imageId: id })} />
        </div>
      );
    case 'faq':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <ListEditor
            label="Perguntas"
            items={p.items ?? []}
            fields={[
              { key: 'question', label: 'Pergunta' },
              { key: 'answer', label: 'Resposta', type: 'area' },
            ]}
            create={() => ({ question: '', answer: '' })}
            onChange={(items) => set({ items })}
          />
        </div>
      );
    case 'stats':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo (opcional)" value={p.title} onChange={(v: string) => set({ title: v })} />
          <ListEditor
            label="Numeros"
            items={p.items ?? []}
            fields={[
              { key: 'value', label: 'Valor (ex.: 120k)' },
              { key: 'label', label: 'Rotulo' },
            ]}
            create={() => ({ value: '', label: '' })}
            onChange={(items) => set({ items })}
          />
        </div>
      );
    case 'steps':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <ListEditor
            label="Etapas"
            items={p.items ?? []}
            fields={[
              { key: 'title', label: 'Titulo da etapa' },
              { key: 'body', label: 'Descricao', type: 'area' },
            ]}
            create={() => ({ title: '', body: '' })}
            onChange={(items) => set({ items })}
          />
        </div>
      );
    case 'brands':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <ListEditor
            label="Marcas"
            items={p.items ?? []}
            fields={[{ key: 'name', label: 'Nome' }]}
            create={() => ({ name: '', imageId: null })}
            onChange={(items) => set({ items })}
          />
        </div>
      );
    case 'menu-highlights':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextInput label="Subtitulo" value={p.subtitle} onChange={(v: string) => set({ subtitle: v })} />
          <Select label="Layout" value={p.layout} onChange={(v: string) => set({ layout: v })} options={[
            { value: 'feature', label: 'Destaque' },
            { value: 'grid', label: 'Grade' },
          ]} />
          <Field label={`Itens em destaque (${(p.itemIds ?? []).length})`} hint="Selecione itens da aba Produtos e servicos">
            <div className="stack" style={{ gap: 4 }}>
              {config.products.items.map((item) => (
                <label key={item.id} className="row small" style={{ gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={(p.itemIds ?? []).includes(item.id)}
                    onChange={(e) => {
                      const current = new Set<string>(p.itemIds ?? []);
                      if (e.target.checked) current.add(item.id);
                      else current.delete(item.id);
                      set({ itemIds: [...current] });
                    }}
                  />
                  {item.name} {item.price !== null ? <span className="muted">· {currency(item.price)}</span> : null}
                </label>
              ))}
              {!config.products.items.length ? <span className="muted small">Nenhum item cadastrado ainda.</span> : null}
            </div>
          </Field>
        </div>
      );
    case 'booking':
      return (
        <div className="stack" style={{ gap: 10 }}>
          <TextInput label="Titulo" value={p.title} onChange={(v: string) => set({ title: v })} />
          <TextArea label="Texto" value={p.body} onChange={(v: string) => set({ body: v })} />
          <div className="grid cols-2">
            <TextInput label="Texto do botao" value={p.label} onChange={(v: string) => set({ label: v })} />
            <TextInput label="Link alternativo" value={p.href} onChange={(v: string) => set({ href: v })} />
          </div>
          <Field label="Canais" hint="Separe por virgula">
            <input
              className="input sm"
              value={(p.channels ?? []).join(', ')}
              onChange={(e) => set({ channels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>
        </div>
      );
    default:
      return <div className="banner warn">Tipo de secao sem editor especifico.</div>;
  }
}

/* -------------------------------- Catalogo ------------------------------- */

function CatalogTab({
  config,
  onChange,
  context,
}: {
  config: SiteConfig;
  onChange: (c: SiteConfig) => void;
  context: EditorContext;
}) {
  const [filter, setFilter] = useState('');
  const products = config.products;
  const items = products.items;

  const updateItems = (next: typeof items) => onChange({ ...config, products: { ...products, items: next } });
  const updateCategories = (next: typeof products.categories) =>
    onChange({ ...config, products: { ...products, categories: next } });

  const visible = filter ? items.filter((i) => i.categoryId === filter) : items;

  return (
    <div className="stack">
      <div className="card">
        <div className="card-head">
          <div style={{ flex: 1 }}>
            <h3>Categorias</h3>
            <div className="sub">Agrupam produtos/servicos. A ordem define o filtro no site.</div>
          </div>
        </div>
        <div className="card-pad">
          <div className="stack" style={{ gap: 6 }}>
            {products.categories.map((cat, index) => (
              <div key={cat.id} className="row">
                <input
                  className="input sm"
                  style={{ maxWidth: 190 }}
                  value={cat.name}
                  onChange={(e) => {
                    const next = clone(products.categories);
                    next[index].name = e.target.value;
                    updateCategories(next);
                  }}
                />
                <input
                  className="input sm"
                  value={cat.description}
                  placeholder="Descricao (opcional)"
                  onChange={(e) => {
                    const next = clone(products.categories);
                    next[index].description = e.target.value;
                    updateCategories(next);
                  }}
                />
                <span className="pill">{items.filter((i) => i.categoryId === cat.id).length} itens</span>
                <button
                  className="btn sm ghost"
                  onClick={() => {
                    updateCategories(products.categories.filter((_, i) => i !== index));
                  }}
                  title="Remover categoria"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn sm"
            style={{ marginTop: 10 }}
            onClick={() =>
              updateCategories([
                ...products.categories,
                { id: uid('cat'), name: 'Nova categoria', description: '', order: products.categories.length },
              ])
            }
          >
            ＋ Adicionar categoria
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div style={{ flex: 1 }}>
            <h3>Produtos e servicos</h3>
            <div className="sub">{items.length} itens · exibidos na secao de catalogo</div>
          </div>
          <select className="select sm" style={{ width: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todas as categorias</option>
            {products.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="card-pad">
          <div className="stack" style={{ gap: 8 }}>
            {visible.map((item, index) => {
              const realIndex = items.findIndex((i) => i.id === item.id);
              const image = item.imageId ? context.images[item.imageId] : null;
              return (
                <div key={item.id} className="card card-pad" style={{ background: 'var(--panel-2)', padding: 10 }}>
                  <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 58, aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                      {image ? (
                        <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="empty-img" style={{ height: '100%', minHeight: 0, fontSize: 8 }}>
                          sem foto
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }} className="grid cols-2">
                      <input
                        className="input sm"
                        value={item.name}
                        placeholder="Nome do produto/servico"
                        onChange={(e) => {
                          const next = clone(items);
                          next[realIndex].name = e.target.value;
                          updateItems(next);
                        }}
                      />
                      <div className="row" style={{ gap: 6 }}>
                        <input
                          className="input sm"
                          type="number"
                          step="0.01"
                          placeholder="Preco"
                          value={item.price ?? ''}
                          onChange={(e) => {
                            const next = clone(items);
                            next[realIndex].price = e.target.value === '' ? null : Number(e.target.value);
                            updateItems(next);
                          }}
                        />
                        <select
                          className="select sm"
                          value={item.categoryId ?? ''}
                          onChange={(e) => {
                            const next = clone(items);
                            next[realIndex].categoryId = e.target.value || null;
                            updateItems(next);
                          }}
                        >
                          <option value="">Sem categoria</option>
                          {products.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        className="textarea"
                        rows={2}
                        style={{ gridColumn: '1 / -1' }}
                        placeholder="Descricao"
                        value={item.description}
                        onChange={(e) => {
                          const next = clone(items);
                          next[realIndex].description = e.target.value;
                          updateItems(next);
                        }}
                      />
                      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <input
                          className="input sm"
                          style={{ maxWidth: 120 }}
                          placeholder="Selo"
                          value={item.badge}
                          onChange={(e) => {
                            const next = clone(items);
                            next[realIndex].badge = e.target.value;
                            updateItems(next);
                          }}
                        />
                        <label className="row small" style={{ gap: 4 }}>
                          <input
                            type="checkbox"
                            checked={item.featured}
                            onChange={(e) => {
                              const next = clone(items);
                              next[realIndex].featured = e.target.checked;
                              updateItems(next);
                            }}
                          />
                          Destaque
                        </label>
                        <label className="row small" style={{ gap: 4 }}>
                          <input
                            type="checkbox"
                            checked={item.active !== false}
                            onChange={(e) => {
                              const next = clone(items);
                              next[realIndex].active = e.target.checked;
                              updateItems(next);
                            }}
                          />
                          Ativo
                        </label>
                        <button className="btn sm" onClick={() => context.pickImage((ids) => {
                          const next = clone(items);
                          next[realIndex].imageId = ids[0] ?? null;
                          updateItems(next);
                        })}>
                          {image ? 'Trocar foto' : 'Foto'}
                        </button>
                      </div>
                    </div>
                    <button
                      className="btn sm ghost"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => updateItems(items.filter((_, i) => i !== realIndex))}
                      title="Remover item"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="btn"
            style={{ marginTop: 12 }}
            onClick={() =>
              updateItems([
                ...items,
                {
                  id: uid('item'),
                  name: 'Novo item',
                  description: '',
                  price: null,
                  priceNote: '',
                  categoryId: products.categories[0]?.id ?? null,
                  imageId: null,
                  badge: '',
                  featured: false,
                  active: true,
                  order: items.length,
                },
              ])
            }
          >
            ＋ Adicionar produto/servico
          </button>
          {visible.length !== items.length ? (
            <span className="hint" style={{ marginLeft: 10 }}>
              Mostrando {visible.length} de {items.length} itens
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Contato e links ----------------------------- */

function ContactTab({ config, set }: { config: SiteConfig; set: any }) {
  const contact = config.contact;
  const update = (patch: Partial<SiteConfig['contact']>) => set('contact', { ...contact, ...patch });
  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 10 }}>
          Contato
        </div>
        <div className="grid cols-2">
          <Field label="Telefone">
            <input className="input" value={contact.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="(34) 3232-0000" />
          </Field>
          <Field label="WhatsApp" hint="Somente numeros com DDI/DDD — usado nos botoes de pedido/agendamento">
            <input className="input" value={contact.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} placeholder="5534999990000" />
          </Field>
          <Field label="E-mail">
            <input className="input" value={contact.email} onChange={(e) => update({ email: e.target.value })} />
          </Field>
          <Field label="Cidade">
            <input className="input" value={contact.city} onChange={(e) => update({ city: e.target.value })} />
          </Field>
          <Field label="Endereco">
            <input className="input" value={contact.address} onChange={(e) => update({ address: e.target.value })} />
          </Field>
          <Field label="Link do mapa" hint="Opcional — Google Maps, embed etc.">
            <input className="input" value={contact.mapUrl} onChange={(e) => update({ mapUrl: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 8 }}>
          Horarios de atendimento
        </div>
        {contact.hours.map((hour, index) => (
          <div key={index} className="row" style={{ marginBottom: 6 }}>
            <input
              className="input sm"
              style={{ flex: 1 }}
              value={hour.label}
              onChange={(e) => {
                const hours = clone(contact.hours);
                hours[index].label = e.target.value;
                update({ hours });
              }}
            />
            <input
              className="input sm"
              style={{ width: 80 }}
              value={hour.open}
              onChange={(e) => {
                const hours = clone(contact.hours);
                hours[index].open = e.target.value;
                update({ hours });
              }}
            />
            <input
              className="input sm"
              style={{ width: 80 }}
              value={hour.close}
              onChange={(e) => {
                const hours = clone(contact.hours);
                hours[index].close = e.target.value;
                update({ hours });
              }}
            />
            <label className="row small" style={{ gap: 4 }}>
              <input
                type="checkbox"
                checked={hour.closed}
                onChange={(e) => {
                  const hours = clone(contact.hours);
                  hours[index].closed = e.target.checked;
                  update({ hours });
                }}
              />
              Fechado
            </label>
            <button className="btn sm ghost" onClick={() => update({ hours: contact.hours.filter((_, i) => i !== index) })}>
              ✕
            </button>
          </div>
        ))}
        <button className="btn sm" onClick={() => update({ hours: [...contact.hours, { label: 'Novo dia', open: '09:00', close: '18:00', closed: false }] })}>
          ＋ Adicionar horario
        </button>
        <Field label="Observacao sobre horarios" style={{ marginTop: 10 }}>
          <input className="input sm" value={contact.noteHours} onChange={(e) => update({ noteHours: e.target.value })} />
        </Field>
      </div>

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 8 }}>
          Links (redes sociais, delivery, mapa)
        </div>
        {config.links.map((link, index) => (
          <div key={index} className="row" style={{ marginBottom: 6 }}>
            <input
              className="input sm"
              style={{ maxWidth: 140 }}
              value={link.label}
              placeholder="Rotulo"
              onChange={(e) => {
                const links = clone(config.links);
                links[index].label = e.target.value;
                set('links', links);
              }}
            />
            <input
              className="input sm"
              style={{ maxWidth: 120 }}
              value={link.type}
              placeholder="tipo"
              onChange={(e) => {
                const links = clone(config.links);
                links[index].type = e.target.value;
                set('links', links);
              }}
            />
            <input
              className="input sm mono"
              value={link.value}
              placeholder="https://"
              onChange={(e) => {
                const links = clone(config.links);
                links[index].value = e.target.value;
                set('links', links);
              }}
            />
            <button className="btn sm ghost" onClick={() => set('links', config.links.filter((_, i) => i !== index))}>
              ✕
            </button>
          </div>
        ))}
        <button className="btn sm" onClick={() => set('links', [...config.links, { label: 'Instagram', type: 'social', value: 'https://instagram.com/' }])}>
          ＋ Adicionar link
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- SEO ----------------------------------- */

function SeoTab({ config, set }: { config: SiteConfig; set: any }) {
  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 10 }}>
          SEO
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <Field label="Titulo da pagina" hint={`${config.seo.title.length}/60 caracteres recomendados`}>
            <input className="input" value={config.seo.title} onChange={(e) => set('seo', { ...config.seo, title: e.target.value })} />
          </Field>
          <Field label="Descricao" hint={`${config.seo.description.length}/160 caracteres recomendados`}>
            <textarea
              className="textarea"
              rows={3}
              value={config.seo.description}
              onChange={(e) => set('seo', { ...config.seo, description: e.target.value })}
            />
          </Field>
          <Field label="Palavras-chave" hint="Separadas por virgula">
            <input className="input" value={config.seo.keywords} onChange={(e) => set('seo', { ...config.seo, keywords: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 10 }}>
          Rodape
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <Field label="Texto de copyright" hint="Ex.: {{clientName}} - Todos os direitos reservados.">
            <input className="input" value={config.footer.text} onChange={(e) => set('footer', { ...config.footer, text: e.target.value })} />
          </Field>
          <Field label="Nota do rodape" hint="Bom lugar para creditos e avisos de imagens ilustrativas">
            <textarea className="textarea" rows={2} value={config.footer.note} onChange={(e) => set('footer', { ...config.footer, note: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="banner info">
        <span>ℹ</span>
        <span>
          Marcadores dinamicos disponiveis em textos: <code className="mono">{'{{clientName}}'}</code>,{' '}
          <code className="mono">{'{{city}}'}</code>, <code className="mono">{'{{phone}}'}</code>,{' '}
          <code className="mono">{'{{whatsapp}}'}</code>, <code className="mono">{'{{email}}'}</code>. Eles sao
          resolvidos na criacao do site do cliente; depois disso o texto e livre.
        </span>
      </div>
    </div>
  );
}
