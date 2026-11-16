import React, { useState } from 'react';
import { api, tokenStore } from '../lib/api';
import type { User } from '../types';
import { Field } from '../components/ui';
import { classifyLoginError, COOKIE_NOTICE, type LoginIssue } from '../lib/login-errors';

export function LoginScreen({ onLogin, needsSetup }: { onLogin: (user: User) => void; needsSetup: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [issue, setIssue] = useState<LoginIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [cookiesBlocked, setCookiesBlocked] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIssue(null);
    try {
      const res = await api.post<{ user: User; token: string }>('/api/auth/login', { email, password });
      // guarda o token como alternativa ao cookie httpOnly: cobre navegadores
      // que bloqueiam cookies de terceiros dentro do preview/iframe.
      if (res.token) tokenStore.set(res.token);
      // Confirma o estado real da sessao: se o servidor reconheceu pelo cookie,
      // nao ha nada a avisar. `cookiePresent` diz se o navegador guardou o
      // cookie; `sessionSource` diz por qual canal a sessao foi aceita.
      const check = await api
        .probe<{ cookieAuth?: boolean; cookiePresent?: boolean; sessionSource?: string }>('/api/auth/session')
        .catch(() => null);
      setCookiesBlocked(Boolean(check && check.cookieAuth === false && check.cookiePresent === false));
      onLogin(res.user);
    } catch (err: any) {
      setIssue(classifyLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="row">
          <div className="brand-mark">PS</div>
          <div>
            <h1 style={{ fontSize: 17 }}>Painel de Sites</h1>
            <div className="small muted">Templates, biblioteca e clientes</div>
          </div>
        </div>

        <p className="small muted" style={{ lineHeight: 1.55 }}>
          Entre para gerenciar modelos de site por segmento, a biblioteca de imagens e os sites publicados de
          cada estabelecimento.
        </p>

        {issue ? <IssueBanner issue={issue} /> : null}
        {cookiesBlocked ? (
          <div className="banner info">
            <span>ℹ</span>
            <span>{COOKIE_NOTICE}</span>
          </div>
        ) : null}

        <Field label="E-mail">
          <input
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            required
          />
        </Field>
        <Field label="Senha">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>

        <button className="btn primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
          {loading ? <span className="spin" /> : null}
          Entrar
        </button>

        {needsSetup ? (
          <div className="banner warn">
            <span>⚠</span>
            <span>
              Nenhum usuario cadastrado ainda. Rode <code className="mono">npm run seed</code> no servidor para
              criar o administrador inicial.
            </span>
          </div>
        ) : (
          <div className="hint" style={{ textAlign: 'center' }}>
            Acesso restrito a equipe administrativa. Sessoes expiram em 14 dias.
          </div>
        )}
      </form>
    </div>
  );
}

function IssueBanner({ issue }: { issue: LoginIssue }) {
  const tone = issue.kind === 'invalid-credentials' ? 'danger' : issue.kind === 'server' ? 'danger' : 'warn';
  const icon = issue.kind === 'invalid-credentials' ? '✕' : '⚠';
  return (
    <div className={`banner ${tone}`}>
      <span>{icon}</span>
      <span>
        <strong>{issue.message}</strong>
        {issue.detail ? (
          <>
            <br />
            <span className="small">{issue.detail}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
