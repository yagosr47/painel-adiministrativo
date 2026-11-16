import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, query } from '../lib/api';
import type { Client, ImageAsset, Segment } from '../types';
import { Field, Modal, SearchInput, useToast, Pill } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (image: ImageAsset | null) => void;
  /** Escopo: se informado, mostra biblioteca do segmento do cliente + imagens proprias. */
  clientId?: string;
  segmentSlug: string;
  allowMultiple?: boolean;
  onPickMultiple?: (images: ImageAsset[]) => void;
  title?: string;
}

/**
 * Seletor de imagens com dois escopos claros:
 *  - Biblioteca ilustrativa do segmento (compartilhada)
 *  - Imagens proprias do cliente (privadas)
 * Nunca exibe imagens privadas de outro cliente.
 */
export function ImagePicker({
  open,
  onClose,
  onPick,
  clientId,
  segmentSlug,
  allowMultiple,
  onPickMultiple,
  title,
}: Props) {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [categories, setCategories] = useState<{ slug: string; name: string; images: number }[]>([]);
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'client'>(clientId ? 'all' : 'all');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ images: ImageAsset[]; categories: any[] }>(
        `/api/images${query({
          clientId: clientId,
          segment: clientId ? undefined : segmentSlug,
          category: category || undefined,
          q: search || undefined,
          scope: scope === 'client' ? 'client' : undefined,
        })}`,
      );
      setImages(res.images);
      setCategories(res.categories);
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category, scope, segmentSlug, clientId]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(load, 320);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const upload = async (file: File) => {
    if (!clientId) {
      toast.push('Para enviar imagens proprias, abra o seletor dentro de um cliente ou use a Biblioteca.', 'error');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('client_id', clientId);
      form.append('category_slug', category || 'proprias');
      form.append('title', file.name.replace(/\.[^.]+$/, '').slice(0, 80));
      form.append('license', 'own');
      const res = await api.post<{ image: ImageAsset }>('/api/images', form);
      toast.push('Imagem enviada para o acervo do cliente', 'success');
      setScope('all');
      await load();
      if (allowMultiple) {
        setSelected((prev) => [...prev, res.image.id]);
      } else {
        onPick(res.image);
        onClose();
      }
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmSelection = () => {
    const picked = images.filter((i) => selected.includes(i.id));
    if (allowMultiple) onPickMultiple?.(picked);
    else onPick(picked[0] ?? null);
    setSelected([]);
    onClose();
  };

  const toggle = (image: ImageAsset) => {
    if (allowMultiple) {
      setSelected((prev) => (prev.includes(image.id) ? prev.filter((id) => id !== image.id) : [...prev, image.id]));
      return;
    }
    onPick(image);
    onClose();
  };

  const filtered = useMemo(() => images, [images]);

  if (!open) return null;

  return (
    <Modal
      title={title ?? 'Escolher imagem'}
      subtitle={
        clientId
          ? 'Biblioteca ilustrativa do segmento + imagens proprias do estabelecimento'
          : 'Biblioteca compartilhada de imagens ilustrativas'
      }
      size="xl"
      onClose={onClose}
      footer={
        <>
          <span className="small muted" style={{ marginRight: 'auto' }}>
            {filtered.length} imagem(ns){selected.length ? ` · ${selected.length} selecionada(s)` : ''}
          </span>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          {allowMultiple ? (
            <button className="btn primary" onClick={confirmSelection} disabled={!selected.length}>
              Usar selecionadas
            </button>
          ) : null}
        </>
      }
    >
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por titulo ou tag…" />
        {clientId ? (
          <div className="chips">
            <button className={`chip ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>
              Tudo do cliente
            </button>
            <button className={`chip ${scope === 'client' ? 'active' : ''}`} onClick={() => setScope('client')}>
              Somente proprias
            </button>
          </div>
        ) : null}
        <div style={{ marginLeft: 'auto' }} className="btn-group">
          {clientId ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              <button className="btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <span className="spin" /> : '↑'} Enviar imagem
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 168, flexShrink: 0, display: 'grid', gap: 2 }}>
          <button className={`cat-item ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
            Todas
            <span className="count">{images.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              className={`cat-item ${category === c.slug ? 'active' : ''}`}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
              <span className="count">{c.images}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="page-loading"><div className="dot" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <h3>Nenhuma imagem encontrada</h3>
              <div className="small">
                {clientId
                  ? 'Envie a primeira imagem propria deste estabelecimento com o botao acima.'
                  : 'Ajuste a busca ou selecione outra categoria.'}
              </div>
            </div>
          ) : (
            <div className="img-grid">
              {filtered.map((image) => (
                <div
                  key={image.id}
                  className="img-card"
                  style={{
                    cursor: 'pointer',
                    outline: selected.includes(image.id) ? '2px solid #2563eb' : undefined,
                  }}
                  onClick={() => toggle(image)}
                >
                  <div className="img-thumb">
                    <img src={image.url} alt={image.alt} loading="lazy" />
                    <div className="badges">
                      {image.scope === 'client' ? <span className="pill own">Propria</span> : <span className="pill">Ilustrativa</span>}
                    </div>
                  </div>
                  <div className="img-body">
                    <strong>{image.title}</strong>
                    <span>
                      {image.category_slug}
                      {image.width ? ` · ${image.width}×${image.height}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="banner info">
        <span>ℹ</span>
        <span>
          <strong>Boas praticas de uso:</strong> priorize sempre as imagens proprias do estabelecimento. As
          ilustracoes da biblioteca sao demonstrativas e so devem ir ao ar quando houver autorizacao de uso —
          por isso ficam marcadas como <em>ilustrativas</em> tanto aqui quanto no site publicado.
        </span>
      </div>
    </Modal>
  );
}

/** Miniatura com botao de troca/remocao — usada no editor. */
export function ImageSlot({
  imageId,
  images,
  onPick,
  onClear,
  label,
  hint,
  ratio,
}: {
  imageId: string | null | undefined;
  images: Record<string, { url: string; title: string }>;
  onPick: () => void;
  onClear?: () => void;
  label: string;
  hint?: string;
  ratio?: string;
}) {
  const image = imageId ? images[imageId] : null;
  return (
    <div className="field">
      <label>{label}</label>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div
          style={{
            width: 120,
            aspectRatio: ratio ?? '4 / 3',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--panel-2)',
            flexShrink: 0,
          }}
        >
          {image ? (
            <img src={image.url} alt={image.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="empty-img" style={{ height: '100%', minHeight: 0, fontSize: 10 }}>
              sem imagem
            </div>
          )}
        </div>
        <div className="btn-group" style={{ paddingTop: 2 }}>
          <button className="btn sm" onClick={onPick} type="button">
            {image ? 'Trocar' : 'Escolher'}
          </button>
          {image && onClear ? (
            <button className="btn sm ghost" onClick={onClear} type="button">
              Remover
            </button>
          ) : null}
          {image ? <Pill>{(images as any)[imageId!]?.license === 'illustrative' ? 'Ilustrativa' : 'Propria'}</Pill> : null}
        </div>
      </div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}
