import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { ClientDetail, ImageAsset, ImageRef, Revision, SiteConfig, Template } from '../types';
import {
  Spinner,
  Field,
  useToast,
  Modal,
  StatusPill,
  Pill,
  ConfirmDialog,
  EmptyState,
} from '../components/ui';
import { navigate } from '../lib/router';
import { SiteConfigEditor, EDITOR_TABS, type EditorTab, type EditorContext } from '../editor/SiteConfigEditor';
import { SiteRenderer } from '../site/SiteRenderer';
import { ImagePicker } from '../components/ImagePicker';
import { relative, dateTime } from '../lib/format';

export function ClientEditorPage({ clientId }: { clientId: string }) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [images, setImages] = useState<Record<string, ImageRef>>({});
  const [tab, setTab] = useState<EditorTab>('identity');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ cb: (ids: string[]) => void; multiple?: boolean } | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<ClientDetail>(`/api/clients/${clientId}`);
      setDetail(data);
      setConfig(data.site?.config ?? null);
      setImages(data.images);
      const rev = await api.get<{ revisions: Revision[] }>(`/api/clients/${clientId}/site/revisions`);
      setRevisions(rev.revisions);
      setDirty(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, reloadKey]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const openPicker = (cb: (ids: string[]) => void, opts?: { multiple?: boolean }) => setPicker({ cb, multiple: opts?.multiple });

  const context: EditorContext = useMemo(
    () => ({ images, clientScoped: true, pickImage: openPicker }),
    [images],
  );

  /* Recarrega somente o mapa de imagens quando o acervo do cliente muda. */
  const refreshImages = async () => {
    const data = await api.get<ClientDetail>(`/api/clients/${clientId}`);
    setImages(data.images);
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await api.put<{ changes: string[] }>(`/api/clients/${clientId}/site`, { config });
      toast.push(`Site salvo. Alteracoes: ${res.changes.slice(0, 3).join(', ')}`, 'success');
      setDirty(false);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      if (error.details?.images) {
        toast.push(
          `Imagem fora do escopo: ${error.details.images.map((i: any) => i.title ?? i.id).join(', ')}`,
          'error',
        );
      } else {
        toast.push(error.message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    try {
      if (dirty) {
        toast.push('Salve as alteracoes antes de publicar', 'error');
        return;
      }
      await api.post(`/api/clients/${clientId}/site/publish`);
      toast.push('Site publicado', 'success');
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.push(error.message, 'error');
    }
  };

  const unpublish = async () => {
    try {
      await api.post(`/api/clients/${clientId}/site/unpublish`);
      toast.push('Site retirado do ar', 'success');
      setConfirmUnpublish(false);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.push(error.message, 'error');
    }
  };

  const restore = async (rev: Revision) => {
    try {
      await api.post(`/api/clients/${clientId}/site/revisions/${rev.id}/restore`);
      toast.push(`Versao ${rev.version} restaurada`, 'success');
      setShowHistory(false);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.push(error.message, 'error');
    }
  };

  if (loading) return <Spinner label="Abrindo site do cliente…" />;
  if (error) return <div className="banner danger">{error}</div>;
  if (!detail) return null;

  const client = detail.client;
  const site = detail.site;

  if (!site || !config) {
    return (
      <div className="stack">
        <button className="btn sm ghost" onClick={() => navigate('clients')} style={{ justifySelf: 'start' }}>
          ← Voltar
        </button>
        <EmptyState title="Este cliente nao possui site">
          Crie o site a partir de um template para comecar.
        </EmptyState>
      </div>
    );
  }

  const templateOutdated = detail.template && detail.template.version_now > detail.template.origin_version;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button className="btn sm ghost" onClick={() => navigate('clients')}>
            ← Clientes
          </button>
          <div className="row" style={{ gap: 7 }}>
            <StatusPill status={site.status} />
            <Pill tone="blue">/s/{site.subdomain}</Pill>
            {dirty ? <Pill tone="amber">alteracoes nao salvas</Pill> : null}
          </div>
        </div>
        <div className="btn-group">
          <button className="btn sm" onClick={() => setShowHistory(true)}>
            Historico ({revisions.length})
          </button>
          {site.status === 'published' ? (
            <>
              <a className="btn sm" href={`#/s/${site.subdomain}`} target="_blank" rel="noreferrer">
                Abrir site
              </a>
              <button className="btn sm" onClick={() => setConfirmUnpublish(true)}>
                Retirar do ar
              </button>
            </>
          ) : (
            <button className="btn sm primary" onClick={publish} disabled={dirty}>
              Publicar site
            </button>
          )}
          <button className="btn sm primary" onClick={save} disabled={saving || !dirty}>
            {saving ? <span className="spin" /> : null} Salvar
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 200 }}>
          <h2 style={{ fontSize: 17, fontWeight: 650 }}>{client.name}</h2>
          <div className="small muted">
            {client.segment_name} · {client.contact_name || 'sem responsavel'} · {client.contact_phone || 'sem telefone'}
          </div>
        </div>
        <div className="divider" style={{ width: 1, height: 34, background: 'var(--border)', margin: '0 4px' }} />
        <div>
          <div className="small muted">Template de origem</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {site.template_name} <span className="muted">· v{site.template_version}</span>
          </div>
        </div>
        <div>
          <div className="small muted">Versao atual do modelo</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            v{detail.template?.version_now ?? site.template_version}
            {templateOutdated ? <span className="pill amber" style={{ marginLeft: 6 }}>mais recente</span> : null}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }} className="btn-group">
          <button className="btn sm" onClick={() => setShowApply(true)}>
            Reaplicar template
          </button>
          <button className="btn sm ghost" onClick={() => navigate('library')} title="Biblioteca ilustrativa">
            Biblioteca
          </button>
        </div>
      </div>

      {templateOutdated ? (
        <div className="banner warn">
          <span>⚠</span>
          <span>
            O template <strong>{site.template_name}</strong> recebeu atualizacoes (v{detail.template?.version_now}) que
            <strong> nao</strong> foram aplicadas a este site — por design, alteracoes no modelo nunca propagam
            sozinhas. Se quiser trazer as novidades, use <strong>Reaplicar template</strong> (acao manual e
            versionada).
          </span>
        </div>
      ) : null}

      <div className="banner ok" style={{ background: '#f0f9ff', color: '#0c4a6e' }}>
        <span>🔐</span>
        <span>
          <strong>Ambiente isolado.</strong> Este site guarda copia propria do config e usa apenas imagens do
          segmento ({client.segment_name}) ou do acervo privado deste cliente. Imagens de outros clientes sao
          bloqueadas pelo servidor.
        </span>
      </div>

      <div className="editor-layout">
        <div className="stack" style={{ gap: 14 }}>
          <div className="card">
            <div className="editor-tabs" style={{ padding: '0 12px', marginBottom: 0 }}>
              {EDITOR_TABS.map((t) => (
                <button key={t.key} className={`editor-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="card-pad">
              <SiteConfigEditor
                config={config}
                onChange={(next) => {
                  setConfig(next);
                  setDirty(true);
                }}
                context={context}
                tab={tab}
              />
            </div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 76 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="chips">
              <button className={`chip ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')}>
                Desktop
              </button>
              <button className={`chip ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')}>
                Mobile
              </button>
            </div>
            <span className="small muted" style={{ marginLeft: 'auto' }}>
              previa deste cliente (nao afeta outros)
            </span>
          </div>
          <div className="device-frame" style={{ margin: '0 auto', width: device === 'mobile' ? 380 : '100%' }}>
            <div className="device-bar">
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
              <div className="url">/s/{site.subdomain}</div>
              <span className="pill">{dirty ? 'editando' : site.status === 'published' ? 'publicado' : 'rascunho'}</span>
            </div>
            <div className="preview-scroll">
              <SiteRenderer config={config} images={images} />
            </div>
          </div>
        </div>
      </div>

      {picker ? (
        <ImagePicker
          open
          clientId={client.id}
          segmentSlug={client.segment_slug}
          onClose={async () => {
            setPicker(null);
            await refreshImages();
          }}
          allowMultiple={picker.multiple}
          onPickMultiple={(imgs) => picker.cb(imgs.map((i) => i.id))}
          onPick={(img) => picker.cb(img ? [img.id] : [])}
        />
      ) : null}

      {showHistory ? (
        <HistoryModal revisions={revisions} onClose={() => setShowHistory(false)} onRestore={restore} />
      ) : null}

      {showApply ? (
        <ApplyTemplateModal
          clientId={client.id}
          clientSegment={client.segment_slug}
          currentTemplateId={site.template_id}
          sections={config.sections.map((s) => ({ id: s.id, label: s.label }))}
          onClose={() => setShowApply(false)}
          onApplied={() => {
            setShowApply(false);
            toast.push('Template reaplicado manualmente e versionado', 'success');
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}

      {confirmUnpublish ? (
        <ConfirmDialog
          title="Retirar o site do ar?"
          message="O site deixa de ser acessado publicamente. O conteudo, o historico e as imagens continuam salvos."
          confirmLabel="Retirar do ar"
          danger
          onCancel={() => setConfirmUnpublish(false)}
          onConfirm={unpublish}
        />
      ) : null}
    </div>
  );
}

function HistoryModal({
  revisions,
  onClose,
  onRestore,
}: {
  revisions: Revision[];
  onClose: () => void;
  onRestore: (rev: Revision) => void;
}) {
  const [restoring, setRestoring] = useState<Revision | null>(null);
  return (
    <Modal
      title="Historico de versoes"
      subtitle="Cada salvamento gera uma versao imutavel — restaurar nunca apaga o historico"
      size="wide"
      onClose={onClose}
      footer={
        <button className="btn" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div className="stack" style={{ gap: 6 }}>
        {revisions.map((rev) => (
          <div key={rev.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                v{rev.version} · {rev.label}
              </div>
              <div className="small muted">
                {dateTime(rev.created_at)} · {rev.author ?? 'sistema'}
              </div>
            </div>
            <button className="btn sm" onClick={() => setRestoring(rev)}>
              Restaurar
            </button>
          </div>
        ))}
        {!revisions.length ? <EmptyState title="Sem versoes" /> : null}
      </div>
      {restoring ? (
        <ConfirmDialog
          title={`Restaurar a versao ${restoring.version}?`}
          message="O conteudo atual sera preservado como uma nova versao antes da restauracao. Nada e perdido."
          confirmLabel="Restaurar"
          onCancel={() => setRestoring(null)}
          onConfirm={() => {
            onRestore(restoring);
            setRestoring(null);
          }}
        />
      ) : null}
    </Modal>
  );
}

function ApplyTemplateModal({
  clientId,
  clientSegment,
  currentTemplateId,
  sections,
  onClose,
  onApplied,
}: {
  clientId: string;
  clientSegment: string;
  currentTemplateId: string | null;
  sections: { id: string; label: string }[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState(currentTemplateId ?? '');
  const [mode, setMode] = useState<'config' | 'theme' | 'section'>('theme');
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api
      .get<{ templates: Template[] }>(`/api/templates?segment=${clientSegment}`)
      .then((r) => {
        setTemplates(r.templates);
        if (!templateId && r.templates[0]) setTemplateId(r.templates[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post(`/api/clients/${clientId}/site/apply-template`, {
        template_id: templateId,
        mode,
        section_id: mode === 'section' ? sectionId : undefined,
      });
      onApplied();
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Reaplicar template neste site"
      subtitle="Acao manual: nada muda em outros clientes nem no template"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit} disabled={loading || !templateId || (mode === 'section' && !sectionId)}>
            {loading ? <span className="spin" /> : null} Aplicar
          </button>
        </>
      }
    >
      <div className="banner warn">
        <span>⚠</span>
        <span>
          {mode === 'config'
            ? 'O conteudo atual deste site sera substituido pelo configuracao do template. A versao anterior fica salva no historico.'
            : 'Apenas o que voce selecionar sera substituido — o restante do site permanece intacto.'}
        </span>
      </div>
      <Field label="Template (apenas do mesmo segmento)">
        <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — v{t.version}
            </option>
          ))}
        </select>
      </Field>
      <Field label="O que aplicar">
        <select className="select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <option value="theme">Somente tema (cores e tipografia)</option>
          <option value="section">Somente uma secao</option>
          <option value="config">Configuracao completa (preserva dados do cliente)</option>
        </select>
      </Field>
      {mode === 'section' ? (
        <Field label="Secao">
          <select className="select" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Selecione…</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} (#{s.id})
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <div className="hint">
        O cliente mantem nome, contatos e acervo de imagens proprias. Imagens do template que nao pertencerem ao
        segmento deste cliente sao descartadas.
      </div>
    </Modal>
  );
}
