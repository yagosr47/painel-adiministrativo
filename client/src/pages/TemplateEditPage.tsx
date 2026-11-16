import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { ImageAsset, ImageRef, Template, SiteConfig, Segment } from '../types';
import { Spinner, Field, useToast, Modal, StatusPill, Pill } from '../components/ui';
import { navigate } from '../lib/router';
import { SiteConfigEditor, EDITOR_TABS, type EditorTab, type EditorContext } from '../editor/SiteConfigEditor';
import { SiteRenderer } from '../site/SiteRenderer';
import { ImagePicker } from '../components/ImagePicker';
import { relative } from '../lib/format';

export function TemplateEditPage({ templateId }: { templateId: string }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [images, setImages] = useState<Record<string, ImageRef>>({});
  const [segments, setSegments] = useState<Segment[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; status: string; site_id: string }[]>([]);
  const [tab, setTab] = useState<EditorTab>('identity');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ cb: (ids: string[]) => void; multiple?: boolean } | null>(null);
  const [meta, setMeta] = useState({ name: '', category: '', summary: '', description: '', status: 'draft', accent: '#2563eb' });
  const [assigning, setAssigning] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const detail = await api.get<{ template: Template; clients: any[] }>(`/api/templates/${templateId}`);
      setTemplate(detail.template);
      setConfig(detail.template.config ?? null);
      setClients(detail.clients);
      setMeta({
        name: detail.template.name,
        category: detail.template.category,
        summary: detail.template.summary,
        description: detail.template.description,
        status: detail.template.status,
        accent: detail.template.accent,
      });
      const img = await api.get<{ images: ImageAsset[] }>(`/api/images?segment=${detail.template.segment_slug}`);
      setImages(
        Object.fromEntries(
          img.images.map((i) => [i.id, { id: i.id, url: i.url, title: i.title, alt: i.alt, license: i.license }]),
        ),
      );
      const seg = await api.get<{ segments: Segment[] }>('/api/segments');
      setSegments(seg.segments);
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
  }, [templateId, reloadKey]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const context: EditorContext = useMemo(
    () => ({
      images,
      clientScoped: false,
      pickImage: (cb, opts) => setPicker({ cb, multiple: opts?.multiple }),
    }),
    [images],
  );

  const save = async () => {
    if (!template || !config) return;
    setSaving(true);
    try {
      await api.patch(`/api/templates/${template.id}`, {
        name: meta.name,
        category: meta.category,
        summary: meta.summary,
        description: meta.description,
        status: meta.status,
        accent: meta.accent,
        config,
        cover_image_id: config.media.coverImageId,
        thumbnail_image_id: config.media.thumbnailImageId,
      });
      toast.push('Template salvo. Nenhum site de cliente foi alterado.', 'success');
      setDirty(false);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Abrindo template…" />;
  if (error) return <div className="banner danger">{error}</div>;
  if (!template || !config) return <div className="banner warn">Template sem configuracao valida.</div>;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <button className="btn sm ghost" onClick={() => navigate('templates')}>
          ← Voltar para templates
        </button>
        <div className="btn-group">
          <StatusPill status={template.status} />
          <Pill tone="blue">v{template.version}</Pill>
          <span className="small muted">{template.sites_using} site(s) originados</span>
          {dirty ? <span className="pill amber">alteracoes nao salvas</span> : null}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad">
            <div className="grid cols-2">
              <Field label="Nome do template">
                <input className="input" value={meta.name} onChange={(e) => { setMeta({ ...meta, name: e.target.value }); setDirty(true); }} />
              </Field>
              <Field label="Categoria">
                <input className="input" value={meta.category} onChange={(e) => { setMeta({ ...meta, category: e.target.value }); setDirty(true); }} />
              </Field>
            </div>
            <div className="grid cols-2" style={{ marginTop: 10 }}>
              <Field
                label="Segmento"
                hint={
                  template.sites_using > 0
                    ? `Bloqueado: ${template.sites_using} site(s) usam este modelo. Altere o segmento do cliente, nao do template.`
                    : 'Define a biblioteca de imagens disponivel para o template'
                }
              >
                <select
                  className="select"
                  value={template.segment_slug}
                  disabled={template.sites_using > 0}
                  onChange={async (e) => {
                    try {
                      await api.patch(`/api/templates/${template.id}`, { segment_slug: e.target.value });
                      toast.push('Segmento atualizado', 'success');
                      setReloadKey((k) => k + 1);
                    } catch (err: any) {
                      toast.push(err.message, 'error');
                    }
                  }}
                >
                  {segments.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select className="select" value={meta.status} onChange={(e) => { setMeta({ ...meta, status: e.target.value }); setDirty(true); }}>
                  <option value="draft">Rascunho (nao disponivel para novos clientes)</option>
                  <option value="published">Publicado (disponivel na biblioteca)</option>
                  <option value="archived">Arquivado</option>
                </select>
              </Field>
            </div>
            <Field label="Resumo" style={{ marginTop: 10 }}>
              <textarea className="textarea" rows={2} value={meta.summary} onChange={(e) => { setMeta({ ...meta, summary: e.target.value }); setDirty(true); }} />
            </Field>
            <Field label="Descricao detalhada" style={{ marginTop: 10 }}>
              <textarea className="textarea" rows={2} value={meta.description} onChange={(e) => { setMeta({ ...meta, description: e.target.value }); setDirty(true); }} />
            </Field>
          </div>

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

          <div className="card card-pad">
            <div className="label" style={{ marginBottom: 8 }}>
              Distribuicao deste modelo
            </div>
            {clients.length ? (
              <div className="stack" style={{ gap: 6 }}>
                {clients.map((c) => (
                  <div key={c.id} className="row" style={{ justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12.5 }}>{c.name}</span>
                    <div className="row" style={{ gap: 6 }}>
                      <StatusPill status={c.status} />
                      <button className="btn sm ghost" onClick={() => navigate(`clients/${c.id}`)}>
                        Abrir site
                      </button>
                    </div>
                  </div>
                ))}
                <div className="hint">
                  Cada site acima e uma copia independente. Salvar este template <strong>nao</strong> altera esses
                  sites.
                </div>
              </div>
            ) : (
              <div className="hint">Nenhum site usa este template ainda.</div>
            )}
            <div className="divider" style={{ margin: '12px 0' }} />
            <button className="btn sm" onClick={() => setAssigning(true)}>
              Usar este template em um novo cliente
            </button>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 76 }}>
          <div className="device-frame">
            <div className="device-bar">
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
              <div className="url">previa ao vivo · {meta.name || template.slug}</div>
              <span className="pill">{dirty ? 'editando' : 'salvo'}</span>
            </div>
            <div className="preview-scroll">
              <SiteRenderer config={config} images={images} />
            </div>
          </div>
          <div className="hint" style={{ marginTop: 8 }}>
            A previa reflete o modelo. Alteracoes so valem para novos clientes apos salvar — e nunca mudam sites ja
            publicados.
          </div>
        </div>
      </div>

      <div
        className="card card-pad"
        style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'sticky', bottom: 12, zIndex: 10 }}
      >
        <span className="small muted">
          {dirty ? 'Ha alteracoes nao salvas.' : `Ultima atualizacao ${relative(template.updated_at)}`}
        </span>
        <div className="btn-group" style={{ marginLeft: 'auto' }}>
          <button className="btn" onClick={() => setReloadKey((k) => k + 1)} disabled={saving}>
            Descartar
          </button>
          <button className="btn primary" onClick={save} disabled={saving || !dirty}>
            {saving ? <span className="spin" /> : null} Salvar template
          </button>
        </div>
      </div>

      {picker ? (
        <ImagePicker
          open
          segmentSlug={template.segment_slug}
          onClose={() => setPicker(null)}
          allowMultiple={picker.multiple}
          onPickMultiple={(imgs) => picker.cb(imgs.map((i) => i.id))}
          onPick={(img) => picker.cb(img ? [img.id] : [])}
        />
      ) : null}

      {assigning ? (
        <AssignClientModal
          template={template}
          onClose={() => setAssigning(false)}
          onCreated={(clientId) => {
            setAssigning(false);
            toast.push('Cliente criado com copia independente do template', 'success');
            navigate(`clients/${clientId}`);
          }}
        />
      ) : null}
    </div>
  );
}

function AssignClientModal({
  template,
  onClose,
  onCreated,
}: {
  template: Template;
  onClose: () => void;
  onCreated: (clientId: string) => void;
}) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!name.trim()) {
      toast.push('Informe o nome do estabelecimento', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ client: { id: string } }>('/api/clients', {
        name,
        contact_name: contactName,
        contact_phone: phone,
        contact_email: email,
        segment_slug: template.segment_slug,
        template_id: template.id,
      });
      onCreated(res.client.id);
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Novo cliente a partir deste template"
      subtitle={`${template.name} · ${template.segment_name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit} disabled={loading}>
            {loading ? <span className="spin" /> : null} Criar cliente e site
          </button>
        </>
      }
    >
      <div className="banner ok">
        O sistema vai <strong>clonar</strong> a configuracao deste template para um site novo e independente. A
        partir dai, a personalizacao do cliente nao toca no modelo.
      </div>
      <Field label="Nome do estabelecimento">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex.: Pizzaria Bella Massa" />
      </Field>
      <div className="grid cols-2">
        <Field label="Responsavel">
          <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Telefone/WhatsApp">
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(34) 99999-0000" />
        </Field>
      </div>
      <Field label="E-mail">
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
    </Modal>
  );
}
