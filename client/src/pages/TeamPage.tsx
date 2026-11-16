import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, Modal, Field, useToast, Pill, ConfirmDialog } from '../components/ui';
import { dateTime } from '../lib/format';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  active: number;
  created_at: string;
  actions: number;
}

export function TeamPage({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TeamUser | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ users: TeamUser[]; canManage: boolean }>('/api/users');
      setUsers(res.users);
      setCanManage(res.canManage);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner label="Carregando equipe…" />;
  if (error) return <div className="banner danger">{error}</div>;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="row" style={{ gap: 8 }}>
          <Pill tone="blue">Perfil administrador</Pill>
          <span className="small muted">
            cria/remove templates, aplica templates e gerencia usuarios
          </span>
          <Pill tone="amber">Perfil editor</Pill>
          <span className="small muted">edita conteudo e imagens dos clientes</span>
        </div>
        <div className="btn-group">
          <button className="btn sm" onClick={() => setChangingPassword(true)}>
            Alterar minha senha
          </button>
          {canManage ? (
            <button className="btn sm primary" onClick={() => setCreating(true)}>
              ＋ Novo usuario
            </button>
          ) : null}
        </div>
      </div>

      <div className="banner info">
        <span>🛡</span>
        <span>
          <strong>Permissoes aplicadas no servidor</strong>, nao apenas na interface. Acoes destrutivas ou de
          governanca (excluir template, reaplicar template, excluir cliente, gerenciar usuarios) exigem perfil
          administrador e sao registradas no log de atividade.
        </span>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Acoes registradas</th>
              <th>Desde</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong style={{ fontSize: 13 }}>{user.name}</strong>
                  <div className="small muted">{user.email}</div>
                </td>
                <td>
                  <Pill tone={user.role === 'admin' ? 'blue' : 'amber'}>
                    {user.role === 'admin' ? 'Administrador' : 'Editor'}
                  </Pill>
                </td>
                <td>
                  <Pill tone={user.active ? 'green' : 'red'}>{user.active ? 'Ativo' : 'Desativado'}</Pill>
                </td>
                <td className="small">{user.actions}</td>
                <td className="small muted">{dateTime(user.created_at)}</td>
                <td style={{ textAlign: 'right' }}>
                  {canManage ? (
                    <button className="btn sm" onClick={() => setEditing(user)} disabled={user.id === currentUserId}>
                      {user.id === currentUserId ? 'Voce' : 'Gerenciar'}
                    </button>
                  ) : (
                    <span className="small muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating ? (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      ) : null}

      {editing ? (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}

      {changingPassword ? (
        <PasswordModal
          onClose={() => setChangingPassword(false)}
          onSaved={() => {
            setChangingPassword(false);
            toast.push('Senha alterada. Faca login novamente.', 'success');
            setTimeout(() => window.location.reload(), 1200);
          }}
        />
      ) : null}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'editor'>('editor');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/api/users', { name, email, password, role });
      toast.push('Usuario criado', 'success');
      onCreated();
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Novo usuario"
      subtitle="O acesso e por e-mail e senha, com sessao de 14 dias"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit} disabled={loading}>
            {loading ? <span className="spin" /> : null} Criar usuario
          </button>
        </>
      }
    >
      <Field label="Nome">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="E-mail">
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Senha inicial" hint="Minimo de 8 caracteres. Oriente a troca no primeiro acesso.">
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Perfil" hint="Editor nao pode excluir templates, reaplicar templates nem gerenciar usuarios.">
        <select className="select" value={role} onChange={(e) => setRole(e.target.value as any)}>
          <option value="editor">Editor</option>
          <option value="admin">Administrador</option>
        </select>
      </Field>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: TeamUser; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(Boolean(user.active));
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const toast = useToast();

  const save = async () => {
    setLoading(true);
    try {
      await api.patch(`/api/users/${user.id}`, {
        name,
        role,
        active,
        ...(password ? { password } : {}),
      });
      toast.push('Usuario atualizado', 'success');
      onSaved();
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Gerenciar ${user.name}`}
      subtitle={user.email}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={() => (active ? save() : setConfirmDeactivate(true))} disabled={loading}>
            {loading ? <span className="spin" /> : null} Salvar
          </button>
        </>
      }
    >
      <Field label="Nome">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid cols-2">
        <Field label="Perfil">
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
        </Field>
        <Field label="Status" hint="Desativar encerra todas as sessoes abertas.">
          <select className="select" value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}>
            <option value="1">Ativo</option>
            <option value="0">Desativado</option>
          </select>
        </Field>
      </div>
      <Field label="Redefinir senha" hint="Deixe em branco para manter a senha atual. Minimo 8 caracteres.">
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {confirmDeactivate ? (
        <ConfirmDialog
          title="Desativar este usuario?"
          message="Todas as sessoes ativas serao encerradas imediatamente. O historico de acoes permanece."
          confirmLabel="Desativar"
          danger
          onCancel={() => setConfirmDeactivate(false)}
          onConfirm={() => {
            setActive(false);
            setConfirmDeactivate(false);
            save();
          }}
        />
      ) : null}
    </Modal>
  );
}

function PasswordModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (next !== repeat) {
      toast.push('A confirmacao nao confere', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/password', { current_password: current, new_password: next });
      onSaved();
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Alterar minha senha"
      subtitle="Todas as sessoes serao encerradas apos a troca"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit} disabled={loading || !current || next.length < 8}>
            {loading ? <span className="spin" /> : null} Alterar senha
          </button>
        </>
      }
    >
      <Field label="Senha atual">
        <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
      </Field>
      <Field label="Nova senha" hint="Minimo 8 caracteres">
        <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="Confirmar nova senha">
        <input className="input" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </Field>
    </Modal>
  );
}
