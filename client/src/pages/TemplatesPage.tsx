import React, { useMemo, useState } from 'react';
import { api, query } from '../lib/api';
import type { Segment, Template, SiteConfig } from '../types';
import {
  useAsync,
  Spinner,
  StatusPill,
  EmptyState,
  SearchInput,
  Modal,
  Field,
  useToast,
  ConfirmDialog,
} from '../components/ui';
import { navigate, useRoute } from '../lib/router';
import { relative } from '../lib/format';
import { SiteRenderer } from '../site/SiteRenderer';
import { TemplatePreviewModal } from '../components/TemplatePreviewModal';
import { TemplateCreateModal } from '../components/TemplateCreateModal';

export function TemplatesPage() {
  const route = useRoute();
  const [segment, setSegment] = useState(route.params.get('segment') ?? '');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [preview, setPreview] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [duplicating, setDuplicating] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState<Template | null>(null);
  const toast = useToast();

  const segments = useAsync<{ segments: Segment[] }>(() => api.get('/api/segments'), []);
  const templates = useAsync<{ templates: Template[] }>(
    () => api.get(`/api/templates${query({ segment, status })}`),
    [segment, status],
  );

  React.useEffect(() => {
    setSegment(route.params.get('segment') ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.raw]);

  const filtered = useMemo(() => {
    const list = templates.data?.templates ?? [];
    if (!search) return list;
    const needle = search.toLowerCase();
    return list.filter((t) =>
      `${t.name} ${t.category} ${t.summary} ${t.segment_name}`.toLowerCase().includes(needle),
    );
  }, [templates.data, search]);

  const duplicate = async (tpl: Template) => {
    try {
      const res = await api.post<{ template: Template }>(`/api/templates/${tpl.id}/duplicate`, {
        name: `${tpl.name} (copia)`,
      });
      toast.push('Template duplicado como rascunho independente', 'success');
      setDuplicating(null);
      templates.reload();
      navigate(`templates/${res.template.id}`);
    } catch (error: any) {
      toast.push(error.message, 'error');
    }
  };

  const remove = async (tpl: Template, force = false) => {
    try {
      await api.del(`/api/templates/${tpl.id}${force ? '?force=true' : ''}`);
      toast.push('Template removido', 'success');
      setDeleting(null);
      templates.reload();
    } catch (error: any) {
      if (error.details?.sites_using) {
        toast.push(`${error.message}`, 'error');
        setDeleting(tpl);
        return;
      }
      toast.push(error.message, 'error');
    }
  };

  const segmentList = segments.data?.segments ?? [];

  return (
    <div className="stack">
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar template, segmento ou categoria…" />
        <select className="select" style={{ width: 210 }} value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="">Todos os segmentos</option>
          {segmentList.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select className="select" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunhos</option>
          <option value="archived">Arquivados</option>
        </select>
        <div className="btn-group" style={{ marginLeft: 'auto' }}>
          <div className="chips">
            <button className={`chip ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
              Grade
            </button>
            <button className={`chip ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>
              Lista
            </button>
          </div>
          <button className="btn" onClick={() => navigate('library')}>
            Biblioteca de imagens
          </button>
          <button className="btn primary" onClick={() => setCreating(true)}>
            ＋ Novo template
          </button>
        </div>
      </div>

      <div className="chips">
        <button className={`chip ${segment === '' ? 'active' : ''}`} onClick={() => setSegment('')}>
          Todos ({segmentList.reduce((acc, s) => acc + s.templates, 0)})
        </button>
        {segmentList.map((s) => (
          <button key={s.slug} className={`chip ${segment === s.slug ? 'active' : ''}`} onClick={() => setSegment(s.slug)}>
            {s.name} ({s.templates})
          </button>
        ))}
      </div>

      <div className="banner info">
        <span>🔒</span>
        <span>
          <strong>Modelos independentes.</strong> Editar um template atualiza apenas o modelo. Cada cliente usa
          uma <em>copia propria</em> do configuracao, com dados e imagens isolados — mudar o template nunca
          altera um site ja criado (a reaplicacao e sempre manual).
        </span>
      </div>

      {templates.loading ? (
        <Spinner label="Carregando templates…" />
      ) : templates.error ? (
        <div className="banner danger">{templates.error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum template encontrado"
          action={
            <button className="btn primary" onClick={() => setCreating(true)}>
              Criar primeiro template
            </button>
          }
        >
          Crie um modelo novo ou ajuste os filtros acima.
        </EmptyState>
      ) : view === 'grid' ? (
        <div className="tpl-grid">
          {filtered.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              onPreview={() => setPreview(tpl)}
              onEdit={() => navigate(`templates/${tpl.id}`)}
              onDuplicate={() => setDuplicating(tpl)}
              onDelete={() => setDeleting(tpl)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Segmento</th>
                <th>Categoria</th>
                <th>Secoes</th>
                <th>Versao</th>
                <th>Sites</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((tpl) => (
                <tr key={tpl.id}>
                  <td>
                    <div className="row" style={{ gap: 9 }}>
                      <img
                        src={tpl.thumbnail?.url}
                        alt=""
                        style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 5, background: '#eef0f3' }}
                      />
                      <div>
                        <strong style={{ fontSize: 13 }}>{tpl.name}</strong>
                        <div className="small muted" style={{ fontSize: 11 }}>
                          {tpl.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="small">{tpl.segment_name}</td>
                  <td className="small">{tpl.category}</td>
                  <td className="small">{tpl.stats.sections}</td>
                  <td className="small">v{tpl.version}</td>
                  <td className="small">{tpl.sites_using}</td>
                  <td>
                    <StatusPill status={tpl.status} />
                  </td>
                  <td className="small muted">{relative(tpl.updated_at)}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn sm" onClick={() => setPreview(tpl)}>
                        Previa
                      </button>
                      <button className="btn sm" onClick={() => navigate(`templates/${tpl.id}`)}>
                        Editar
                      </button>
                      <button className="btn sm ghost" onClick={() => setDuplicating(tpl)} title="Duplicar">
                        ⧉
                      </button>
                      <button className="btn sm ghost" onClick={() => setDeleting(tpl)} title="Excluir">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview ? <TemplatePreviewModal template={preview} onClose={() => setPreview(null)} /> : null}
      {creating ? (
        <TemplateCreateModal
          segments={segmentList}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            templates.reload();
            navigate(`templates/${id}`);
          }}
        />
      ) : null}
      {duplicating ? (
        <DuplicateModal tpl={duplicating} onClose={() => setDuplicating(null)} onConfirm={duplicate} />
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title={`Excluir "${deleting.name}"?`}
          danger
          confirmLabel="Excluir template"
          message={
            <div>
              O modelo sera removido da biblioteca. {deleting.sites_using > 0 ? (
                <strong> {deleting.sites_using} site(s) foram criados a partir dele</strong>
              ) : null}
              {deleting.sites_using > 0
                ? ' — eles continuam no ar, pois guardam copia propria, mas perdem o vinculo de origem.'
                : ' Nenhum site usa este template.'}
            </div>
          }
          details={
            deleting.sites_using > 0
              ? 'Esta acao nao pode ser desfeita. Confirme apenas se o modelo realmente nao sera reutilizado.'
              : undefined
          }
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove(deleting, true)}
        />
      ) : null}
    </div>
  );
}

function TemplateCard({
  tpl,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  tpl: Template;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="tpl-card">
      <div className="tpl-cover" onClick={onPreview} style={{ cursor: 'pointer' }}>
        {tpl.cover ? (
          <img src={tpl.cover.url} alt={tpl.name} loading="lazy" />
        ) : (
          <div className="empty-img" style={{ height: '100%' }}>
            sem capa
          </div>
        )}
        <div className="tag-row">
          <span className="pill glass">{tpl.segment_name}</span>
          <span className="pill glass">v{tpl.version}</span>
          <span className="pill glass" style={{ marginLeft: 'auto', background: tpl.status === 'published' ? '#0f9d58' : undefined }}>
            {tpl.status === 'published' ? 'Publicado' : tpl.status === 'draft' ? 'Rascunho' : 'Arquivado'}
          </span>
        </div>
      </div>
      <div className="tpl-body">
        <div className="row" style={{ gap: 7 }}>
          <h3 style={{ flex: 1 }}>{tpl.name}</h3>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: tpl.accent }} />
        </div>
        <div className="tpl-meta">
          <span>{tpl.category}</span>
        </div>
        <p>{tpl.summary}</p>
        <div className="tpl-meta">
          <span>{tpl.stats.sections} secoes</span>
          <span>·</span>
          <span>{tpl.stats.products} itens</span>
          <span>·</span>
          <span>{tpl.sites_using} site(s)</span>
        </div>
      </div>
      <div className="tpl-actions">
        <button className="btn sm" onClick={onPreview}>
          Previa
        </button>
        <button className="btn sm primary" onClick={onEdit}>
          Editar
        </button>
        <button className="btn sm ghost" onClick={onDuplicate} title="Duplicar template">
          ⧉
        </button>
        <button className="btn sm ghost" onClick={onDelete} title="Excluir template">
          🗑
        </button>
      </div>
    </div>
  );
}

function DuplicateModal({
  tpl,
  onClose,
  onConfirm,
}: {
  tpl: Template;
  onClose: () => void;
  onConfirm: (tpl: Template) => void;
}) {
  const [name, setName] = useState(`${tpl.name} (copia)`);
  return (
    <Modal
      title="Duplicar template"
      subtitle="Uma copia independente e criada como rascunho"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={() => onConfirm({ ...tpl, name })}>
            Duplicar
          </button>
        </>
      }
    >
      <Field label="Nome do novo template" hint="Sugestao: inclua o segmento ou o estilo para facilitar a busca.">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <div className="banner info">
        A copia mantem secoes, cores, textos e catalogo do original, mas nao tem qualquer vinculo com ele nem com
        os sites existentes.
      </div>
    </Modal>
  );
}
