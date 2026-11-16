import React from 'react';
import { api } from '../lib/api';
import type { ActivityEntry } from '../types';
import { useAsync, Spinner, EmptyState } from '../components/ui';
import { dateTime } from '../lib/format';

const ACTION_LABEL: Record<string, string> = {
  'template.created': 'Template criado',
  'template.updated': 'Template atualizado',
  'template.duplicated': 'Template duplicado',
  'template.deleted': 'Template removido',
  'template.created_from_site': 'Template derivado de site',
  'site.created': 'Site criado',
  'site.updated': 'Site personalizado',
  'site.published': 'Site publicado',
  'site.unpublished': 'Site retirado do ar',
  'site.template_applied': 'Template reaplicado',
  'site.restored': 'Versao restaurada',
  'client.created': 'Cliente criado',
  'client.updated': 'Cliente atualizado',
  'client.deleted': 'Cliente removido',
  'image.uploaded': 'Imagem enviada',
  'image.generated': 'Ilustracao gerada',
  'image.replaced': 'Imagem substituida',
  'image.deleted': 'Imagem removida',
  'auth.login': 'Login',
};

export function ActivityPage() {
  const { data, loading, error } = useAsync<{ activity: ActivityEntry[] }>(() => api.get('/api/activity?limit=120'), []);

  if (loading) return <Spinner label="Carregando historico…" />;
  if (error) return <div className="banner danger">{error}</div>;
  const activity = data?.activity ?? [];

  return (
    <div className="stack">
      <div className="banner info">
        <span>📋</span>
        <span>
          Trilha de auditoria do painel: quem alterou o que e quando. Imagems, templates, clientes e publicacoes
          ficam registrados.
        </span>
      </div>
      {activity.length === 0 ? (
        <EmptyState title="Nenhuma atividade registrada" />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 190 }}>Quando</th>
                <th style={{ width: 150 }}>Acao</th>
                <th>Detalhe</th>
                <th style={{ width: 140 }}>Responsavel</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((entry) => (
                <tr key={entry.id}>
                  <td className="small muted">{dateTime(entry.created_at)}</td>
                  <td>
                    <span className="pill">{ACTION_LABEL[entry.action] ?? entry.action}</span>
                  </td>
                  <td className="small">{entry.summary}</td>
                  <td className="small muted">{entry.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
