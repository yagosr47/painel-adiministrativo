import React, { useState } from 'react';
import { api } from '../lib/api';
import type { User } from '../types';
import { Field } from '../components/ui';

export function LoginScreen({ onLogin, needsSetup }: { onLogin: (user: User) => void; needsSetup: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ user: User }>('/api/auth/login', { email, password });
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message ?? 'Falha ao entrar');
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

        {error ? <div className="banner danger">{error}</div> : null}

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
