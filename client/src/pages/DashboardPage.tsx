import React, { useState } from 'react';
import { api } from '../lib/api';
import type { ActivityEntry } from '../types';
import { useAsync, StatusPill, Spinner, EmptyState } from '../components/ui';
import { navigate } from '../lib/router';
import { relative } from '../lib/format';

interface DashboardData {
  totals: Record<string, number>;
  bySegment: { slug: string; name: string; templates: number; clients: number; images: number }[];
  templates: {
    id: string;
    name: string;
    segment_name: string;
    category: string;
    status: string;
    version: number;
    sites_using: number;
    cover: { url: string } | null;
    updated_at: string;
  }[];
  clients: {
    id: string;
    name: string;
    segment_slug: string;
    site_status: string | null;
    template_name: string;
    accent: string;
    updated_at: string;
  }[];
  activity: ActivityEntry[];
}

export function DashboardPage() {
  const { data, loading, error } = useAsync<DashboardData>(() => api.get('/api/dashboard'), []);

  if (loading) return <Spinner label="Carregando indicadores…" />;
  if (error) return <div className="banner danger">{error}</div>;
  if (!data) return null;

  const { totals } = data;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="stat-grid">
        <Stat k="Templates" v={totals.templates} d={`${totals.published_templates} publicados`} onClick={() => navigate('templates')} />
        <Stat k="Clientes" v={totals.clients} d={`${totals.published_sites} sites no ar`} onClick={() => navigate('clients')} />
        <Stat k="Imagens na biblioteca" v={totals.images} d={`${totals.own_images} imagens proprias de clientes`} onClick={() => navigate('library')} />
        <Stat k="Segmentos" v={totals.segments} d="estruturas prontas para comecar" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head">
            <div style={{ flex: 1 }}>
              <h3>Segmentos atendidos</h3>
              <div className="sub">Cada segmento tem modelos, categorias de imagem e estrutura propria</div>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Segmento</th>
                <th style={{ width: 90 }}>Templates</th>
                <th style={{ width: 80 }}>Clientes</th>
                <th style={{ width: 90 }}>Imagens</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {data.bySegment.map((s) => (
                <tr key={s.slug}>
                  <td>
                    <strong style={{ fontSize: 13 }}>{s.name}</strong>
                  </td>
                  <td>{s.templates}</td>
                  <td>{s.clients}</td>
                  <td>{s.images}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn sm" onClick={() => navigate(`templates?segment=${s.slug}`)}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <div style={{ flex: 1 }}>
              <h3>Atividade recente</h3>
              <div className="sub">Acoes administrativas e publicacoes</div>
            </div>
            <button className="btn sm ghost" onClick={() => navigate('activity')}>
              Ver tudo
            </button>
          </div>
          <div style={{ padding: '6px 0' }}>
            {data.activity.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                style={{ display: 'flex', gap: 10, padding: '9px 16px', borderBottom: '1px solid #f2f4f7' }}
              >
                <span style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>•</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>{entry.summary}</div>
                  <div className="small muted" style={{ fontSize: 11 }}>
                    {entry.actor} · {relative(entry.created_at)}
                  </div>
                </div>
              </div>
            ))}
            {!data.activity.length ? <EmptyState title="Nenhuma atividade ainda" /> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div style={{ flex: 1 }}>
            <h3>Templates disponiveis</h3>
            <div className="sub">Modelos independentes — personalizar um cliente nao altera o modelo nem os demais clientes</div>
          </div>
          <button className="btn" onClick={() => navigate('templates')}>
            Gerenciar templates
          </button>
        </div>
        <div style={{ padding: 16 }}>
          <div className="tpl-grid">
            {data.templates.map((t) => (
              <div key={t.id} className="tpl-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`templates/${t.id}`)}>
                <div className="tpl-cover">
                  {t.cover ? <img src={t.cover.url} alt={t.name} /> : <div className="empty-img" style={{ height: '100%' }}>sem capa</div>}
                </div>
                <div className="tpl-body">
                  <div className="row" style={{ gap: 6 }}>
                    <StatusPill status={t.status} />
                    <span className="pill">v{t.version}</span>
                  </div>
                  <h3>{t.name}</h3>
                  <div className="tpl-meta">
                    <span>{t.segment_name}</span>
                    <span>·</span>
                    <span>{t.category}</span>
                  </div>
                  <div className="tpl-meta">
                    <span>{t.sites_using} site(s) usam</span>
                    <span>·</span>
                    <span>atualizado {relative(t.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div style={{ flex: 1 }}>
            <h3>Clientes recentes</h3>
            <div className="sub">Cada cliente possui uma versao propria e isolada do site</div>
          </div>
          <button className="btn" onClick={() => navigate('clients')}>
            Ver clientes
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Template de origem</th>
              <th>Status do site</th>
              <th>Atualizado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.clients.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent }} />
                    <strong style={{ fontSize: 13 }}>{c.name}</strong>
                  </div>
                </td>
                <td className="small muted">{c.template_name}</td>
                <td>{c.site_status ? <StatusPill status={c.site_status} /> : <span className="muted small">sem site</span>}</td>
                <td className="small muted">{relative(c.updated_at)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn sm" onClick={() => navigate(`clients/${c.id}`)}>
                    Abrir editor
                  </button>
                </td>
              </tr>
            ))}
            {!data.clients.length ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="Nenhum cliente cadastrado" action={<button className="btn" onClick={() => navigate('clients')}>Cadastrar cliente</button>} />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ k, v, d, onClick }: { k: string; v: number; d: string; onClick?: () => void }) {
  return (
    <div className="stat" style={onClick ? { cursor: 'pointer' } : undefined} onClick={onClick}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      <div className="d">{d}</div>
    </div>
  );
}
