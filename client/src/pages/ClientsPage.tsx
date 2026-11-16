import React, { useMemo, useState } from 'react';
import { api, query } from '../lib/api';
import type { Client, Segment, Template } from '../types';
import {
  Spinner,
  StatusPill,
  EmptyState,
  SearchInput,
  Modal,
  Field,
  useToast,
  ConfirmDialog,
  useAsync,
} from '../components/ui';
import { navigate } from '../lib/router';
import { relative } from '../lib/format';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const toast = useToast();

  const segments = useAsync<{ segments: Segment[] }>(() => api.get('/api/segments'), []);
  const clients = useAsync<{ clients: Client[] }>(
    () => api.get(`/api/clients${query({ q: search, segment })}`),
    [search, segment, reloadKey],
  );

  const list = clients.data?.clients ?? [];

  return (
    <div className="stack">
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente…" />
        <select className="select" style={{ width: 220 }} value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="">Todos os segmentos</option>
          {(segments.data?.segments ?? []).map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => setCreating(true)}>
          ＋ Novo cliente
        </button>
      </div>

      <div className="banner info">
        <span>🧬</span>
        <span>
          <strong>Isolamento por cliente.</strong> Ao criar o cliente, o template escolhido vira uma{' '}
          <em>copia propria</em> (config, textos, catalogo e imagens). Editar o site deste cliente nao altera o
          template nem qualquer outro site — mesmo entre clientes que usam o mesmo modelo.
        </span>
      </div>

      {clients.loading ? (
        <Spinner label="Carregando clientes…" />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" action={<button className="btn primary" onClick={() => setCreating(true)}>Cadastrar cliente</button>}>
          Comece com um template da biblioteca.
        </EmptyState>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Segmento</th>
                <th>Template de origem</th>
                <th>Site</th>
                <th>Secoes</th>
                <th>Atualizado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="row" style={{ gap: 9 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.site?.accent ?? '#94a3b8' }} />
                      <div>
                        <strong style={{ fontSize: 13 }}>{c.name}</strong>
                        <div className="small muted" style={{ fontSize: 11 }}>
                          {c.site ? `/s/${c.site.subdomain}` : 'sem site'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="small">{c.segment_name}</td>
                  <td className="small">{c.site?.template_name ?? '—'}</td>
                  <td>{c.site ? <StatusPill status={c.site.status} /> : <span className="muted small">—</span>}</td>
                  <td className="small">{c.site?.stats?.sections ?? '—'}</td>
                  <td className="small muted">{relative(c.updated_at)}</td>
                  <td>
                    <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn sm" onClick={() => navigate(`clients/${c.id}`)}>
                        Editar site
                      </button>
                      {c.site?.status === 'published' ? (
                        <a className="btn sm" href={`#/s/${c.site.subdomain}`} target="_blank" rel="noreferrer">
                          Ver site
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating ? (
        <CreateClientModal
          segments={segments.data?.segments ?? []}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            toast.push('Cliente criado com site proprio e isolado', 'success');
            navigate(`clients/${id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function CreateClientModal({
  segments,
  onClose,
  onCreated,
}: {
  segments: Segment[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [segment, setSegment] = useState(segments[0]?.slug ?? 'restaurantes');
  const [templateId, setTemplateId] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    api
      .get<{ templates: Template[] }>('/api/templates?status=published')
      .then((r) => setTemplates(r.templates))
      .catch(() => {});
  }, []);

  const available = useMemo(() => templates.filter((t) => t.segment_slug === segment), [templates, segment]);

  React.useEffect(() => {
    setTemplateId(available[0]?.id ?? '');
  }, [segment, templates.length]);

  const submit = async () => {
    if (!name.trim()) {
      toast.push('Informe o nome do estabelecimento', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ client: Client }>('/api/clients', {
        name,
        segment_slug: segment,
        template_id: templateId || null,
        contact_name: contactName,
        contact_phone: phone,
        contact_email: email,
        notes,
      });
      onCreated(res.client.id);
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selected = templates.find((t) => t.id === templateId);

  return (
    <Modal
      title="Novo cliente"
      subtitle="O template escolhido vira uma copia independente para este estabelecimento"
      size="wide"
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
      <div className="grid cols-2">
        <Field label="Nome do estabelecimento">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex.: Pizzaria Bella Massa" />
        </Field>
        <Field label="Segmento" hint="Define as imagens e templates disponiveis">
          <select className="select" value={segment} onChange={(e) => setSegment(e.target.value)}>
            {segments.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Responsavel">
          <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Telefone / WhatsApp">
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(34) 99999-0000" />
        </Field>
        <Field label="E-mail">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Observacoes internas">
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      <Field label="Template de partida">
        <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">Modelo em branco (configuracao inicial)</option>
          {available.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.category} (v{t.version})
            </option>
          ))}
        </select>
      </Field>

      {selected ? (
        <div className="row" style={{ gap: 12 }}>
          {selected.cover ? (
            <img src={selected.cover.url} alt="" style={{ width: 160, aspectRatio: '16/10', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
          ) : null}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.name}</div>
            <div className="small muted" style={{ marginTop: 3 }}>{selected.summary}</div>
            <div className="small muted" style={{ marginTop: 5 }}>
              {selected.stats.sections} secoes · {selected.stats.products} itens · {selected.stats.images} imagens
            </div>
          </div>
        </div>
      ) : null}

      <div className="banner ok">
        <span>✓</span>
        <span>
          O sistema cria <strong>site proprio</strong> com configuracao clonada, identificador unico (
          <code className="mono">/s/…</code>) e historico de revisoes. Marcadores como{' '}
          <code className="mono">{'{{clientName}}'}</code> sao preenchidos com os dados deste cliente.
        </span>
      </div>
    </Modal>
  );
}
