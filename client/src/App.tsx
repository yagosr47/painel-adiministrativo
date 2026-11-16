import React, { useEffect, useState } from 'react';
import { api, tokenStore, sessionEvents } from './lib/api';
import type { User } from './types';
import { useRoute, navigate } from './lib/router';
import { LoginScreen } from './pages/LoginScreen';
import { DashboardPage } from './pages/DashboardPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TemplateEditPage } from './pages/TemplateEditPage';
import { LibraryPage } from './pages/LibraryPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientEditorPage } from './pages/ClientEditorPage';
import { PublicSitePage } from './pages/PublicSitePage';
import { ActivityPage } from './pages/ActivityPage';
import { TeamPage } from './pages/TeamPage';
import { Spinner, useToast } from './components/ui';
import { initials } from './lib/format';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const route = useRoute();
  const toast = useToast();

  const checkSession = async () => {
    try {
      const res = await api.probe<{ user: User | null; needsSetup: boolean }>('/api/auth/session');
      setUser(res.user);
      setNeedsSetup(res.needsSetup);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Sessao caiu no meio do uso (token revogado, servidor reiniciado, conta
   * desativada): volta para o login imediatamente, em vez de deixar cada pagina
   * mostrar "faca login" isoladamente.
   */
  useEffect(() => {
    return sessionEvents.onUnauthorized(() => {
      setUser((current) => {
        if (current) toast.push('Sua sessao expirou. Entre novamente.', 'error');
        return null;
      });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await api.post('/api/auth/logout').catch(() => {});
    tokenStore.set(null);
    document.cookie = 'panel_sid=; Max-Age=0; Path=/';
    setUser(null);
    navigate('');
  };

  /* Rota publica: site publicado / preview (precisa de sessao apenas no preview). */
  if (route.parts[0] === 's' && route.parts[1]) {
    return <PublicSitePage slug={route.parts[1]} preview={route.params.get('preview') === '1'} />;
  }

  if (loading) return <Spinner label="Carregando painel…" />;
  if (!user) return <LoginScreen onLogin={setUser} needsSetup={needsSetup} />;

  const page = route.parts[0] ?? 'dashboard';
  const param = route.parts[1];

  const navItems = [
    { key: 'dashboard', label: 'Visao geral', icon: '▦' },
    { key: 'templates', label: 'Templates e Biblioteca', icon: '◫' },
    { key: 'clients', label: 'Clientes e sites', icon: '◍' },
    { key: 'activity', label: 'Atividade', icon: '≡' },
    { key: 'team', label: 'Equipe e permissoes', icon: '⚿' },
  ];

  const librarySection = page === 'templates' || page === 'library';

  const go = (key: string) => {
    navigate(key === 'dashboard' ? '' : key);
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">PS</div>
          <div className="brand-text">
            <strong>Painel de Sites</strong>
            <span>Templates e Biblioteca</span>
          </div>
        </div>

        <div className="nav-section">Gestao</div>
        {navItems.map((item) => (
          <React.Fragment key={item.key}>
            <button
              className={`nav-link ${
                page === item.key || (item.key === 'templates' && librarySection) || (item.key === 'clients' && page === 'clients')
                  ? 'active'
                  : ''
              }`}
              onClick={() => go(item.key)}
            >
              <span style={{ opacity: 0.75 }}>{item.icon}</span>
              {item.label}
            </button>
            {item.key === 'templates' && librarySection ? (
              <div style={{ display: 'grid', gap: 2, paddingLeft: 26, marginBottom: 4 }}>
                <button className={`nav-link ${page === 'templates' ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '6px 8px' }} onClick={() => go('templates')}>
                  Modelos de site
                </button>
                <button className={`nav-link ${page === 'library' ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '6px 8px' }} onClick={() => go('library')}>
                  Biblioteca de imagens
                </button>
              </div>
            ) : null}
          </React.Fragment>
        ))}

        <div className="nav-section">Atalhos</div>
        <button className="nav-link" onClick={() => go('templates')}>
          <span style={{ opacity: 0.75 }}>＋</span> Novo template
        </button>
        <button className="nav-link" onClick={() => go('clients')}>
          <span style={{ opacity: 0.75 }}>＋</span> Novo cliente
        </button>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{user.role === 'admin' ? 'Administrador' : 'Editor'}</div>
            </div>
          </div>
          <button className="nav-link" onClick={logout}>
            <span style={{ opacity: 0.75 }}>⏻</span> Sair
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn ghost icon sidebar-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            ☰
          </button>
          <div>
            <h1>{pageTitle(page, param)}</h1>
            <div className="sub">{pageSubtitle(page)}</div>
          </div>
          <div className="topbar-actions">
            <button className="btn" onClick={() => navigate(`clients`)}>
              Clientes
            </button>
            <button className="btn primary" onClick={() => navigate('templates')}>
              Templates
            </button>
          </div>
        </header>

        <main className="content">
          {page === 'dashboard' ? <DashboardPage /> : null}
          {page === 'templates' && !param ? <TemplatesPage /> : null}
          {page === 'templates' && param ? <TemplateEditPage templateId={param} /> : null}
          {page === 'library' ? <LibraryPage /> : null}
          {page === 'clients' && !param ? <ClientsPage /> : null}
          {page === 'clients' && param ? <ClientEditorPage clientId={param} /> : null}
          {page === 'activity' ? <ActivityPage /> : null}
          {page === 'team' ? <TeamPage currentUserId={user.id} /> : null}
          {!['dashboard', 'templates', 'library', 'clients', 'activity', 'team'].includes(page) ? (
            <div className="empty">
              <h3>Pagina nao encontrada</h3>
              <button className="btn" onClick={() => navigate('')}>
                Voltar para a visao geral
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function pageTitle(page: string, param?: string) {
  if (page === 'dashboard') return 'Visao geral';
  if (page === 'templates') return param ? 'Editor de template' : 'Templates e Biblioteca';
  if (page === 'library') return 'Biblioteca de imagens';
  if (page === 'clients') return param ? 'Site do cliente' : 'Clientes e sites';
  if (page === 'activity') return 'Registro de atividade';
  if (page === 'team') return 'Equipe e permissoes';
  return 'Painel';
}

function pageSubtitle(page: string) {
  if (page === 'dashboard') return 'Tudo o que esta acontecendo nos seus sites';
  if (page === 'templates') return 'Modelos reutilizaveis por segmento — alterar um template nunca altera sites existentes';
  if (page === 'library') return 'Imagens organizadas por segmento e categoria';
  if (page === 'clients') return 'Cada cliente tem uma copia independente e isolada do modelo';
  if (page === 'team') return 'Quem pode acessar o painel e o que cada perfil pode fazer';
  return '';
}
