import React from 'react';
import type { ImageRef, Product, Section, SiteConfig } from '../types';
import { currency, fontStack } from '../lib/format';

type Images = Record<string, ImageRef>;

export interface SiteRendererProps {
  config: SiteConfig;
  images: Images;
  /** Somente a secao indicada (usado em miniaturas e testes). */
  onlySectionId?: string;
  /** Escala global do conteudo (miniaturas). */
  scale?: number;
  hideHeader?: boolean;
}

/* --------------------------------- Helpers -------------------------------- */

function Img({ id, images, alt, className }: { id?: string | null; images: Images; alt?: string; className?: string }) {
  if (!id) return null;
  const img = images[id];
  if (!img) {
    return (
      <div className="empty-img" style={{ width: '100%', height: '100%' }}>
        imagem indisponivel
      </div>
    );
  }
  return <img src={img.url} alt={alt || img.alt || img.title} loading="lazy" className={className} />;
}

const hasImage = (id: string | null | undefined, images: Images) => Boolean(id && images[id]);

function Price({ item, show }: { item: Product; show: boolean }) {
  if (!show) return null;
  if (item.price === null || item.price === undefined) {
    return item.priceNote ? <span className="price" style={{ fontSize: 13 }}>{item.priceNote}</span> : null;
  }
  return <span className="price">{currency(item.price)}</span>;
}

function sortedSections(config: SiteConfig) {
  return config.sections.filter((s) => s.enabled);
}

/* --------------------------------- Secoes --------------------------------- */

function HeroSection({ section, config, images }: { section: Section; config: SiteConfig; images: Images }) {
  const p = section.props;
  const overlay = Math.min(90, Math.max(0, Number(p.overlay) || 0)) / 100;
  const dark = overlay > 0.25;
  const textColor = dark ? '#ffffff' : config.theme.text;
  const subColor = dark ? 'rgba(255,255,255,0.85)' : config.theme.muted;
  return (
    <section
      className="hero"
      style={{
        backgroundImage: hasImage(p.imageId, images) ? `url(${images[p.imageId].url})` : undefined,
        background: hasImage(p.imageId, images) ? undefined : `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.secondary})`,
        color: textColor,
        textAlign: p.align === 'center' ? 'center' : p.align === 'right' ? 'right' : 'left',
      }}
    >
      {hasImage(p.imageId, images) ? (
        <div
          className="veil"
          style={{
            background: dark
              ? `linear-gradient(90deg, rgba(0,0,0,${overlay}), rgba(0,0,0,${Math.max(0, overlay - 0.2)}))`
              : 'rgba(255,255,255,0.55)',
          }}
        />
      ) : null}
      <div className="wrap" style={{ display: 'grid', justifyContent: p.align === 'center' ? 'center' : p.align === 'right' ? 'end' : 'start' }}>
        <div style={{ maxWidth: 700 }}>
          {p.eyebrow ? <div className="kicker" style={{ color: dark ? 'rgba(255,255,255,0.85)' : config.theme.accent }}>{p.eyebrow}</div> : null}
          <h1>{p.title || config.identity.name}</h1>
          {p.subtitle ? <p className="lede" style={{ color: subColor }}>{p.subtitle}</p> : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: p.align === 'center' ? 'center' : p.align === 'right' ? 'flex-end' : 'flex-start' }}>
            {p.primaryLabel ? (
              <a className="btn-solid" href={p.primaryHref || '#'}>
                {p.primaryLabel}
              </a>
            ) : null}
            {p.secondaryLabel ? (
              <a
                className="btn-line"
                href={p.secondaryHref || '#'}
                style={{ color: textColor, borderColor: dark ? 'rgba(255,255,255,0.5)' : 'currentColor' }}
              >
                {p.secondaryLabel}
              </a>
            ) : null}
          </div>
          {Array.isArray(p.badges) && p.badges.length ? (
            <div className="badges" style={{ justifyContent: p.align === 'center' ? 'center' : 'flex-start' }}>
              {p.badges.filter(Boolean).map((b: string, i: number) => (
                <span key={i} style={dark ? undefined : { background: config.theme.surface, border: `1px solid ${config.theme.surface}`, color: config.theme.text }}>
                  {b}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ section, config, images }: { section: Section; config: SiteConfig; images: Images }) {
  const p = section.props;
  const stacked = p.layout === 'stacked' || !hasImage(p.imageId, images);
  return (
    <section>
      <div className="wrap">
        <div className={stacked ? '' : 'grid-2'} style={stacked ? { maxWidth: 720 } : undefined}>
          <div style={{ order: p.layout === 'image-left' ? 2 : 1 }}>
            <h2>{p.title}</h2>
            <div style={{ marginTop: 12, color: config.theme.muted, whiteSpace: 'pre-line' }}>{p.body}</div>
            {Array.isArray(p.highlights) && p.highlights.length ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'grid', gap: 8 }}>
                {p.highlights.filter(Boolean).map((h: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: 9, fontSize: 14 }}>
                    <span style={{ color: config.theme.accent, fontWeight: 800 }}>✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {!stacked ? (
            <div style={{ order: p.layout === 'image-left' ? 1 : 2 }}>
              <div style={{ borderRadius: config.theme.radius, overflow: 'hidden', aspectRatio: '4 / 3', background: config.theme.surface }}>
                <Img id={p.imageId} images={images} alt={p.title} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  return (
    <section style={{ background: config.theme.surface }}>
      <div className="wrap">
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {(p.items ?? []).map((item: any, i: number) => (
            <div key={i} className="feature" style={{ background: config.theme.background }}>
              <div className="ic">{iconFor(item.icon)}</div>
              <div>
                <strong style={{ fontSize: 14.5, fontFamily: 'var(--font-heading)' }}>{item.title}</strong>
                <p style={{ fontSize: 13, color: config.theme.muted, marginTop: 3 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CatalogSection({ section, config, images }: { section: Section; config: SiteConfig; images: Images }) {
  const p = section.props;
  const [filter, setFilter] = React.useState<string>('all');
  const [query, setQuery] = React.useState('');
  const items = (config.products?.items ?? []).filter((item) => item.active !== false);
  const categories = (config.products?.categories ?? []).filter((c) => items.some((i) => i.categoryId === c.id));
  const visible = items
    .filter((item) => filter === 'all' || item.categoryId === filter)
    .filter((item) => !query || `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  const mode = p.mode ?? 'cards';
  const cols = Math.max(1, Math.min(4, Number(p.columns) || 3));

  return (
    <section>
      <div className="wrap">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <h2>{p.title}</h2>
            {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
          </div>
          {items.length > 6 ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              style={{
                padding: '9px 12px',
                borderRadius: config.theme.radius,
                border: `1px solid ${config.theme.surface}`,
                background: config.theme.surface,
                fontSize: 13,
                minWidth: 180,
              }}
            />
          ) : null}
        </div>

        {p.categoryFilter && categories.length > 1 ? (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 18 }}>
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} theme={config.theme}>
              Todos
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)} theme={config.theme}>
                {c.name}
              </FilterChip>
            ))}
          </div>
        ) : null}

        {mode === 'compact' ? (
          <div style={{ marginTop: 18, columns: '2', columnGap: 34 }}>
            {visible.map((item) => (
              <div key={item.id} className="list-row" style={{ breakInside: 'avoid' }}>
                <div style={{ minWidth: 0 }}>
                  <strong>{item.name}</strong>
                  {item.description ? (
                    <div style={{ fontSize: 12.5, color: config.theme.muted, marginTop: 2 }}>{item.description}</div>
                  ) : null}
                </div>
                <span className="dots" />
                <Price item={item} show={p.showPrices !== false} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-cards" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${mode === 'gallery' ? 240 : 200}px, 1fr))` }}>
            {visible.map((item) => (
              <div key={item.id} className="tile">
                <div className="ph">
                  {hasImage(item.imageId, images) ? <Img id={item.imageId} images={images} alt={item.name} /> : <div className="empty-img">sem imagem</div>}
                </div>
                <div className="txt">
                  {item.badge ? <span className="badge">{item.badge}</span> : null}
                  <strong style={{ fontSize: 15, fontFamily: 'var(--font-heading)' }}>{item.name}</strong>
                  {item.description ? <span style={{ fontSize: 12.5, color: config.theme.muted, lineHeight: 1.45 }}>{item.description}</span> : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Price item={item} show={p.showPrices !== false} />
                    {p.ctaLabel ? (
                      <a
                        href="#contato"
                        style={{
                          fontSize: 12,
                          fontWeight: 650,
                          color: config.theme.accent,
                        }}
                      >
                        {p.ctaLabel} →
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!visible.length ? <p className="lede">Nenhum item cadastrado nesta secao.</p> : null}
        <div style={{ marginTop: 8 }} />
        <span style={{ fontSize: 11, color: config.theme.muted, opacity: 0.8, display: 'none' }}>
          {cols}
        </span>
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children, theme }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? theme.accent : theme.surface}`,
        background: active ? theme.accent : 'transparent',
        color: active ? '#fff' : theme.text,
        borderRadius: 999,
        padding: '6px 14px',
        fontSize: 12.5,
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

function GallerySection({ section, config, images }: { section: Section; config: SiteConfig; images: Images }) {
  const p = section.props;
  const ids: string[] = (p.imageIds ?? []).filter((id: string) => id);
  const cols = Math.max(1, Math.min(4, Number(p.columns) || 3));
  if (!ids.length) return null;
  return (
    <section style={{ background: config.theme.surface }}>
      <div className="wrap">
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div className="gallery-grid" style={{ gridTemplateColumns: `repeat(${p.layout === 'grid' ? cols : Math.min(cols, 2)}, 1fr)` }}>
          {ids.map((id, i) => (
            <div key={`${id}-${i}`} style={{ borderRadius: config.theme.radius, overflow: 'hidden' }}>
              <Img id={id} images={images} />
            </div>
          ))}
        </div>
        {ids.some((id) => images[id]?.license === 'illustrative') ? (
          <p className="illustrative-note" style={{ color: config.theme.muted }}>
            Imagens ilustrativas. Substitua pelas fotos reais do estabelecimento.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function TeamSection({ section, config, images }: { section: Section; config: SiteConfig; images: Images }) {
  const p = section.props;
  return (
    <section>
      <div className="wrap">
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 26 }}>
          {(p.members ?? []).map((m: any, i: number) => (
            <div key={i} className="person">
              <div className="ava">
                {hasImage(m.imageId, images) ? <Img id={m.imageId} images={images} alt={m.name} /> : <div className="empty-img" style={{ borderRadius: '50%' }}>foto</div>}
              </div>
              <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{m.name}</strong>
              <span style={{ fontSize: 12, color: config.theme.accent, fontWeight: 600 }}>{m.role}</span>
              {m.bio ? <span style={{ fontSize: 12, color: config.theme.muted }}>{m.bio}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  return (
    <section style={{ background: config.theme.surface }}>
      <div className="wrap">
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {(p.items ?? []).map((t: any, i: number) => (
            <div key={i} className="quote" style={{ background: config.theme.background }}>
              <div className="stars">{'★'.repeat(Math.max(1, Math.min(5, Number(t.rating) || 5)))}</div>
              <p style={{ fontSize: 14 }}>“{t.quote}”</p>
              <div style={{ fontSize: 12.5 }}>
                <strong>{t.author}</strong>
                {t.detail ? <span style={{ color: config.theme.muted }}> · {t.detail}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HoursSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  return (
    <section>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div style={{ marginTop: 18 }}>
          {(p.days ?? []).map((d: any, i: number) => (
            <div key={i} className="list-row" style={{ opacity: d.closed ? 0.55 : 1 }}>
              <strong style={{ fontSize: 14 }}>{d.label}</strong>
              <span className="dots" />
              <span style={{ fontSize: 13.5, color: d.closed ? config.theme.muted : config.theme.text }}>
                {d.closed ? 'Fechado' : `${d.open} – ${d.close}`}
              </span>
            </div>
          ))}
        </div>
        {p.note ? <p style={{ marginTop: 12, fontSize: 12.5, color: config.theme.muted }}>{p.note}</p> : null}
      </div>
    </section>
  );
}

function ContactSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  const c = config.contact;
  const whatsapp = String(c.whatsapp || '').replace(/\D/g, '');
  return (
    <section id="contato" style={{ background: config.theme.surface }}>
      <div className="wrap">
        <h2>{p.title || 'Contato'}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div className="contact-grid" style={{ marginTop: 24 }}>
          <div>
            <div style={{ display: 'grid', gap: 10, fontSize: 13.5 }}>
              {c.phone ? <div><strong>Telefone</strong><div style={{ color: config.theme.muted }}>{c.phone}</div></div> : null}
              {c.email ? <div><strong>E-mail</strong><div style={{ color: config.theme.muted }}>{c.email}</div></div> : null}
              {c.address ? (
                <div>
                  <strong>Endereco</strong>
                  <div style={{ color: config.theme.muted }}>
                    {c.address}
                    {c.city ? ` — ${c.city}` : ''}
                  </div>
                </div>
              ) : null}
              {whatsapp ? (
                <a className="btn-solid" href={`https://wa.me/${whatsapp}`} style={{ marginTop: 8, justifySelf: 'start' }}>
                  WhatsApp
                </a>
              ) : null}
            </div>
            {config.links?.length ? (
              <div className="link-row">
                {config.links.map((l, i) => (
                  <a key={i} href={l.value || '#'} target="_blank" rel="noreferrer" style={{ color: config.theme.text }}>
                    {l.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          {p.showForm ? (
            <div>
              <div className="field-row">
                <span>Nome</span>
                <input placeholder="Seu nome" />
              </div>
              <div className="field-row">
                <span>Contato</span>
                <input placeholder="Telefone ou e-mail" />
              </div>
              <div className="field-row">
                <span>Mensagem</span>
                <textarea rows={3} placeholder="Como podemos ajudar?" />
              </div>
              <button className="btn-solid" type="button" style={{ width: '100%', justifyContent: 'center' }}>
                {p.formCta || 'Enviar mensagem'}
              </button>
              <p style={{ fontSize: 10.5, color: config.theme.muted, marginTop: 7 }}>
                Formulario demonstrativo. Conecte o envio ao canal oficial do estabelecimento.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ section, config, images }: { section: Section; config: SiteConfig; images: Images }) {
  const p = section.props;
  const bg = hasImage(p.imageId, images);
  return (
    <section
      style={{
        background: bg ? `linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)), url(${images[p.imageId].url}) center/cover` : config.theme.primary,
        color: '#fff',
      }}
    >
      <div className="wrap" style={{ textAlign: 'center', maxWidth: 640 }}>
        <h2>{p.title}</h2>
        {p.body ? <p style={{ marginTop: 10, opacity: 0.86 }}>{p.body}</p> : null}
        {p.label ? (
          <a className="btn-solid" href={p.href || '#contato'} style={{ marginTop: 22, background: config.theme.accent }}>
            {p.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function FaqSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  return (
    <section>
      <div className="wrap" style={{ maxWidth: 780 }}>
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div style={{ marginTop: 18 }}>
          {(p.items ?? []).map((q: any, i: number) => (
            <details key={i} className="faq-item">
              <summary>{q.question}</summary>
              <p style={{ marginTop: 8, fontSize: 13.5, color: config.theme.muted }}>{q.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  return (
    <section className="tight" style={{ background: config.theme.primary, color: '#fff' }}>
      <div className="wrap">
        {p.title ? <h2 style={{ textAlign: 'center', marginBottom: 22, fontSize: 22 }}>{p.title}</h2> : null}
        <div className="stat-row">
          {(p.items ?? []).map((s: any, i: number) => (
            <div key={i}>
              <div className="v" style={{ color: config.theme.accent }}>{s.value}</div>
              <div style={{ fontSize: 12.5, opacity: 0.85 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepsSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  return (
    <section>
      <div className="wrap">
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div className="steps" style={{ marginTop: 24 }}>
          {(p.items ?? []).map((s: any, i: number) => (
            <div key={i} className="step" style={{ background: config.theme.surface }}>
              <strong style={{ fontFamily: 'var(--font-heading)', minWidth: 120 }}>{s.title}</strong>
              <span style={{ fontSize: 13.5, color: config.theme.muted }}>{s.body}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandsSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  return (
    <section className="tight" style={{ background: config.theme.surface }}>
      <div className="wrap">
        {p.title ? <p style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: config.theme.muted, textAlign: 'center', marginBottom: 16 }}>{p.title}</p> : null}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {(p.items ?? []).map((b: any, i: number) => (
            <span key={i} style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 650, opacity: 0.65 }}>
              {b.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuHighlightsSection({ section, config, images }: { section: Section; config: SiteConfig; images: Images }) {
  const p = section.props;
  const items = (config.products?.items ?? []).filter((i) => p.itemIds?.includes(i.id));
  const layoutFeature = (p.layout ?? 'feature') === 'feature';
  if (!items.length) return null;
  return (
    <section>
      <div className="wrap">
        <h2>{p.title}</h2>
        {p.subtitle ? <p className="lede">{p.subtitle}</p> : null}
        <div
          className="grid-cards"
          style={
            layoutFeature
              ? { gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }
              : { gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
          }
        >
          {items.map((item) => (
            <div key={item.id} className="tile" style={{ background: config.theme.surface }}>
              {hasImage(item.imageId, images) ? (
                <div className="ph" style={{ aspectRatio: layoutFeature ? '16 / 10' : '4 / 3' }}>
                  <Img id={item.imageId} images={images} alt={item.name} />
                </div>
              ) : null}
              <div className="txt">
                <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{item.name}</strong>
                {item.description ? <span style={{ fontSize: 12.5, color: config.theme.muted }}>{item.description}</span> : null}
                <Price item={item} show />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingSection({ section, config }: { section: Section; config: SiteConfig }) {
  const p = section.props;
  const whatsapp = String(config.contact.whatsapp || '').replace(/\D/g, '');
  return (
    <section style={{ background: config.theme.primary, color: '#fff' }}>
      <div className="wrap" style={{ display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center' }}>
        <h2>{p.title}</h2>
        {p.body ? <p style={{ maxWidth: 520, opacity: 0.86 }}>{p.body}</p> : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
          {(p.channels ?? []).filter(Boolean).map((c: string, i: number) => (
            <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)' }}>
              {c}
            </span>
          ))}
        </div>
        <a
          className="btn-solid"
          href={whatsapp ? `https://wa.me/${whatsapp}` : p.href || '#'}
          style={{ background: config.theme.accent, marginTop: 8 }}
        >
          {p.label || 'Agendar'}
        </a>
      </div>
    </section>
  );
}

function iconFor(name: string) {
  const map: Record<string, string> = {
    star: '★',
    truck: '🚚',
    refresh: '↻',
    scissors: '✂',
    heart: '♥',
    leaf: '🌿',
    bread: '🥖',
    beef: '🥩',
    bottle: '🍾',
    basket: '🧺',
    snow: '❄',
    pen: '✎',
    layout: '▦',
    box: '▣',
    camera: '📷',
    clock: '⏱',
    shield: '🛡',
    award: '🏆',
    phone: '☎',
    sparkles: '✦',
  };
  return map[name] ?? '★';
}

/* ------------------------------- Render ---------------------------------- */

export function SiteRenderer({ config, images, onlySectionId, hideHeader }: SiteRendererProps) {
  const sections = sortedSections(config).filter((s) => !onlySectionId || s.id === onlySectionId);
  const heading = fontStack(config.theme.fontHeading);
  const body = fontStack(config.theme.fontBody);

  const style = {
    '--s-bg': config.theme.background,
    '--s-text': config.theme.text,
    '--s-muted': config.theme.muted,
    '--s-surface': config.theme.surface,
    '--s-accent': config.theme.accent,
    '--s-primary': config.theme.primary,
    '--s-radius': `${config.theme.radius}px`,
    '--font-heading': heading,
    '--font-body': body,
  } as React.CSSProperties;

  const logo = config.identity.logoImageId ? images[config.identity.logoImageId] : null;

  return (
    <div className={`site density-${config.theme.density}`} style={style}>
      {!hideHeader && !onlySectionId ? (
        <header className="site-header">
          <div className="bar">
            <div className="logo">
              {logo ? <img src={logo.url} alt={config.identity.name} /> : null}
              {config.identity.showLogoText !== false ? <span>{config.identity.logoText || config.identity.name}</span> : null}
            </div>
            <nav className="site-nav">
              {(config.navigation ?? []).slice(0, 6).map((n, i) => (
                <a key={i} href={n.href || '#'}>
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
      ) : null}

      {sections.map((section) => {
        switch (section.type) {
          case 'hero':
            return <HeroSection key={section.id} section={section} config={config} images={images} />;
          case 'about':
            return <AboutSection key={section.id} section={section} config={config} images={images} />;
          case 'features':
            return <FeaturesSection key={section.id} section={section} config={config} />;
          case 'catalog':
            return <CatalogSection key={section.id} section={section} config={config} images={images} />;
          case 'gallery':
            return <GallerySection key={section.id} section={section} config={config} images={images} />;
          case 'team':
            return <TeamSection key={section.id} section={section} config={config} images={images} />;
          case 'testimonials':
            return <TestimonialsSection key={section.id} section={section} config={config} />;
          case 'hours':
            return <HoursSection key={section.id} section={section} config={config} />;
          case 'contact':
            return <ContactSection key={section.id} section={section} config={config} />;
          case 'cta':
            return <CtaSection key={section.id} section={section} config={config} images={images} />;
          case 'faq':
            return <FaqSection key={section.id} section={section} config={config} />;
          case 'stats':
            return <StatsSection key={section.id} section={section} config={config} />;
          case 'steps':
            return <StepsSection key={section.id} section={section} config={config} />;
          case 'brands':
            return <BrandsSection key={section.id} section={section} config={config} />;
          case 'menu-highlights':
            return <MenuHighlightsSection key={section.id} section={section} config={config} images={images} />;
          case 'booking':
            return <BookingSection key={section.id} section={section} config={config} />;
          default:
            return null;
        }
      })}

      {!onlySectionId ? (
        <footer className="site-footer">
          <div className="bar">
            <span>{config.footer?.text || config.identity.name}</span>
            <span style={{ opacity: 0.6, maxWidth: 420, textAlign: 'right' }}>{config.footer?.note}</span>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

export default SiteRenderer;
