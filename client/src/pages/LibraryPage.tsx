import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, query } from '../lib/api';
import type { ImageAsset, Segment } from '../types';
import {
  Spinner,
  Field,
  Modal,
  useToast,
  ConfirmDialog,
  SearchInput,
  EmptyState,
  Pill,
  useAsync,
} from '../components/ui';
import { bytes, relative } from '../lib/format';
import { navigate } from '../lib/router';

export function LibraryPage() {
  const [segment, setSegment] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<ImageAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<ImageAsset | null>(null);
  const [replacing, setReplacing] = useState<ImageAsset | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const segmentsData = useAsync<{ segments: Segment[] }>(() => api.get('/api/segments'), []);
  const segments = segmentsData.data?.segments ?? [];

  useEffect(() => {
    if (!segment && segments.length) setSegment(segments[0].slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length]);

  const data = useAsync<{ images: ImageAsset[]; categories: any[] }>(
    () => api.get(`/api/images${query({ segment, category })}`),
    [segment, category, reloadKey],
  );

  const images = useMemo(() => {
    const list = data.data?.images ?? [];
    if (!search) return list;
    const needle = search.toLowerCase();
    return list.filter((i) => `${i.title} ${i.alt} ${i.tags.join(' ')} ${i.category_slug}`.toLowerCase().includes(needle));
  }, [data.data, search]);

  const categories = data.data?.categories ?? [];

  const upload = async (file: File, meta: { title: string; license: string; category: string; is_cover: boolean }) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('segment_slug', segment);
      form.append('category_slug', meta.category || 'proprias');
      form.append('title', meta.title || file.name);
      form.append('license', meta.license);
      form.append('is_cover', String(meta.is_cover));
      await api.post('/api/images', form);
      toast.push('Imagem adicionada a biblioteca', 'success');
      setUploading(false);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.push(error.message, 'error');
      setUploading(false);
    }
  };

  const replaceFile = async (image: ImageAsset, file: File) => {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('license', image.license);
      await api.put(`/api/images/${image.id}/file`, form);
      toast.push('Imagem substituida', 'success');
      setReplacing(null);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.push(error.message, 'error');
    }
  };

  const remove = async (image: ImageAsset, force = false) => {
    try {
      await api.del(`/api/images/${image.id}${force ? '?force=true' : ''}`);
      toast.push('Imagem removida', 'success');
      setDeleting(null);
      setDetail(null);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      if (error.status === 409) {
        toast.push('Imagem em uso — confirme a remocao no dialogo.', 'error');
        setDeleting(image);
        return;
      }
      toast.push(error.message, 'error');
    }
  };

  const setCover = async (image: ImageAsset) => {
    try {
      await api.patch(`/api/images/${image.id}`, { is_cover: !image.is_cover });
      toast.push(image.is_cover ? 'Capa removida' : 'Definida como capa provisoria do segmento', 'success');
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.push(error.message, 'error');
    }
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="chips">
        {segments.map((s) => (
          <button
            key={s.slug}
            className={`chip ${segment === s.slug ? 'active' : ''}`}
            onClick={() => {
              setSegment(s.slug);
              setCategory('');
            }}
          >
            {s.name} <span style={{ opacity: 0.6 }}>{s.images}</span>
          </button>
        ))}
      </div>

      <div className="banner info">
        <span>📷</span>
        <span>
          <strong>Uso de imagens.</strong> Todas as imagens abaixo sao <em>ilustracoes geradas pelo sistema</em>, sem
          marcas ou pessoas reais, e estao marcadas como <strong>ilustrativas</strong>. Elas servem para montar a
          estrutura visual e devem ser trocadas pelas fotos do estabelecimento sempre que possivel. Quando o
          cliente envia as proprias imagens, elas ficam privadas daquele cliente no acervo dele.
        </span>
      </div>

      <div className="lib-layout">
        <aside className="lib-aside">
          <div className="card card-pad" style={{ padding: 10 }}>
            <div className="label" style={{ padding: '2px 6px 8px' }}>
              Categorias
            </div>
            <div className="cat-list">
              <button className={`cat-item ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
                Todas
                <span className="count">{data.data?.images.length ?? 0}</span>
              </button>
              {categories.map((c) => (
                <button key={c.slug} className={`cat-item ${category === c.slug ? 'active' : ''}`} onClick={() => setCategory(c.slug)}>
                  {c.name}
                  <span className="count">{c.images}</span>
                </button>
              ))}
            </div>
            <div className="divider" style={{ margin: '10px 0' }} />
            <div className="stack" style={{ gap: 7, padding: '0 4px' }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    upload(file, {
                      title: file.name.replace(/\.[^.]+$/, ''),
                      license: 'illustrative',
                      category: category || 'proprias',
                      is_cover: false,
                    });
                  }
                  if (fileRef.current) fileRef.current.value = '';
                }}
              />
              <button className="btn sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <span className="spin" /> : '↑'} Enviar imagem
              </button>
              <button
                className="btn sm"
                onClick={async () => {
                  const title = prompt('Titulo da ilustracao:');
                  if (!title) return;
                  setGenerating(true);
                  try {
                    await api.post('/api/images/illustration', {
                      title,
                      segment_slug: segment,
                      category_slug: category || 'proprias',
                    });
                    toast.push('Ilustracao gerada', 'success');
                    setReloadKey((k) => k + 1);
                  } catch (error: any) {
                    toast.push(error.message, 'error');
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating}
              >
                ✦ Gerar ilustracao
              </button>
              <button className="btn sm ghost" onClick={() => navigate('templates')}>
                ← Templates
              </button>
            </div>
          </div>
        </aside>

        <div>
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por titulo, tag ou categoria…" />
            <div className="small muted" style={{ marginLeft: 'auto' }}>
              {images.length} imagem(ns) — {segments.find((s) => s.slug === segment)?.name ?? ''}
            </div>
          </div>

          {data.loading ? (
            <Spinner label="Carregando biblioteca…" />
          ) : images.length === 0 ? (
            <EmptyState title="Nenhuma imagem nesta categoria">Envie uma imagem ou gere uma ilustracao.</EmptyState>
          ) : (
            <div className="img-grid">
              {images.map((image) => (
                <div key={image.id} className="img-card">
                  <div className="img-thumb" onClick={() => setDetail(image)} style={{ cursor: 'pointer' }}>
                    <img src={image.url} alt={image.alt} loading="lazy" />
                    <div className="badges">
                      {image.is_cover ? <span className="pill">capa</span> : null}
                      <span className={`pill ${image.license === 'own' ? 'own' : ''}`}>
                        {image.license === 'own' ? 'Propria' : image.license === 'authorized' ? 'Autorizada' : 'Ilustrativa'}
                      </span>
                    </div>
                    <div className="hover-actions">
                      <button
                        className="btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplacing(image);
                        }}
                      >
                        Substituir
                      </button>
                      <button
                        className="btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCover(image);
                        }}
                      >
                        {image.is_cover ? 'Remover capa' : 'Definir capa'}
                      </button>
                      <button
                        className="btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleting(image);
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className="img-body">
                    <strong title={image.title}>{image.title}</strong>
                    <span>
                      {image.category_slug} · {image.width}×{image.height} · {bytes(image.file_size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detail ? (
        <ImageDetailModal
          image={detail}
          onClose={() => setDetail(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
          onDelete={() => setDeleting(detail)}
          onReplace={() => setReplacing(detail)}
        />
      ) : null}

      {replacing ? (
        <ReplaceModal
          image={replacing}
          onClose={() => setReplacing(null)}
          onConfirm={async (file) => {
            if (replacing.id === '__upload__') {
              await upload(file, {
                title: file.name.replace(/\.[^.]+$/, ''),
                license: 'illustrative',
                category: category || 'proprias',
                is_cover: false,
              });
              setReplacing(null);
            } else {
              await replaceFile(replacing, file);
            }
          }}
        />
      ) : null}

      {deleting ? (
        <DeleteImageModal image={deleting} onCancel={() => setDeleting(null)} onConfirm={(force) => remove(deleting, force)} />
      ) : null}
    </div>
  );
}

function ImageDetailModal({
  image,
  onClose,
  onSaved,
  onDelete,
  onReplace,
}: {
  image: ImageAsset;
  onClose: () => void;
  onSaved: () => void;
  onDelete: () => void;
  onReplace: () => void;
}) {
  const [title, setTitle] = useState(image.title);
  const [alt, setAlt] = useState(image.alt);
  const [license, setLicense] = useState(image.license);
  const [note, setNote] = useState(image.license_note);
  const [tags, setTags] = useState(image.tags.join(', '));
  const toast = useToast();

  const save = async () => {
    try {
      await api.patch(`/api/images/${image.id}`, {
        title,
        alt,
        license,
        license_note: note,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.push('Imagem atualizada', 'success');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.push(error.message, 'error');
    }
  };

  return (
    <Modal
      title={image.title}
      subtitle={`${image.segment_slug} · ${image.category_slug} · ${bytes(image.file_size)}`}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <button className="btn danger" onClick={onDelete} style={{ marginRight: 'auto' }}>
            Excluir
          </button>
          <button className="btn" onClick={onReplace}>
            Substituir arquivo
          </button>
          <button className="btn primary" onClick={save}>
            Salvar
          </button>
        </>
      }
    >
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <div>
          <img src={image.url} alt={image.alt} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
          <div className="row" style={{ marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
            <Pill tone={image.license === 'own' ? 'green' : image.license === 'authorized' ? 'blue' : 'amber'}>
              {image.license === 'own' ? 'Propria do cliente' : image.license === 'authorized' ? 'Uso autorizado' : 'Ilustrativa'}
            </Pill>
            <Pill>{image.width}×{image.height}</Pill>
            <a className="btn sm" href={image.url} target="_blank" rel="noreferrer">
              Abrir original
            </a>
          </div>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <Field label="Titulo">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Texto alternativo (acessibilidade)">
            <input className="input" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          <Field label="Tags" hint="Separadas por virgula">
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
          <Field label="Licenca de uso" hint="Ilustrativa = demonstrativa. Autorizada = permissao registrada. Propria = enviada pelo estabelecimento.">
            <select className="select" value={license} onChange={(e) => setLicense(e.target.value as ImageAsset['license'])}>
              <option value="illustrative">Ilustrativa (demonstrativa)</option>
              <option value="authorized">Autorizada para uso</option>
              <option value="own">Propria do estabelecimento</option>
            </select>
          </Field>
          <Field label="Observacao de licenca">
            <textarea className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="hint">
            Criada em {relative(image.created_at)}
            {image.replaced_at ? ` · substituida em ${relative(image.replaced_at)}` : ''}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ReplaceModal({
  image,
  onClose,
  onConfirm,
}: {
  image: ImageAsset;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      title={image.id === '__upload__' ? 'Enviar imagem' : 'Substituir arquivo'}
      subtitle={image.id === '__upload__' ? 'Escolha o arquivo para enviar' : image.title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            disabled={!file || saving}
            onClick={async () => {
              if (!file) return;
              setSaving(true);
              await onConfirm(file);
              setSaving(false);
            }}
          >
            {saving ? <span className="spin" /> : null} Confirmar
          </button>
        </>
      }
    >
      <div className="banner warn">
        Substituir mantem titulo, categoria e referencias no site: o arquivo troca, o identificador continua o
        mesmo. Use isso para colocar a foto real do estabelecimento no lugar de uma ilustracao.
      </div>
      <Field label="Arquivo" hint="PNG, JPG, WEBP, GIF, AVIF ou SVG — ate 6 MB">
        <input
          className="input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>
    </Modal>
  );
}

function DeleteImageModal({
  image,
  onCancel,
  onConfirm,
}: {
  image: ImageAsset;
  onCancel: () => void;
  onConfirm: (force: boolean) => void;
}) {
  const [usages, setUsages] = useState<{ type: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ usages: any[] }>(`/api/images/${image.id}/usages`)
      .then((r) => setUsages(r.usages))
      .catch(() => setUsages([]))
      .finally(() => setLoading(false));
  }, [image.id]);

  return (
    <Modal
      title="Excluir imagem"
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn danger" onClick={() => onConfirm(usages.length > 0)} disabled={loading}>
            Excluir definitivamente
          </button>
        </>
      }
    >
      <p>
        A imagem <strong>{image.title}</strong> sera removida da biblioteca e o arquivo sera apagado do
        armazenamento.
      </p>
      {loading ? (
        <div className="small muted">Verificando referencias…</div>
      ) : usages.length ? (
        <div className="banner warn">
          <span>⚠</span>
          <span>
            Esta imagem esta em uso por {usages.length} registro(s):{' '}
            {usages.slice(0, 5).map((u) => `${u.type === 'template' ? 'template' : 'site'} "${u.name}"`).join(', ')}
            {usages.length > 5 ? '…' : ''}. Os locais que a utilizam passarao a exibir "imagem indisponivel" ate
            receberem uma nova imagem.
          </span>
        </div>
      ) : (
        <div className="banner info">Nenhum template ou site usa esta imagem no momento.</div>
      )}
      <div className="hint">
        Dica: em vez de excluir, voce pode usar "Substituir arquivo" para manter o layout intacto.
      </div>
    </Modal>
  );
}
