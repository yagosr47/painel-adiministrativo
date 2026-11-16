import { Router } from 'express';
import { all, get, run } from '../db/index.js';
import { badRequest, conflict, notFound, requireString } from '../lib/http.js';
import { hashPassword, verifyPassword, newId } from '../lib/auth.js';
import { logActivity } from '../lib/activity.js';
import { wrapAsyncRouter } from '../lib/http.js';
import { requireRole } from './auth.js';

const now = () => new Date().toISOString();
const ROLES = ['admin', 'editor'];

export function usersRouter() {
  const router = Router();

  router.get('/users', (req, res) => {
    const users = all(
      `SELECT u.id, u.name, u.email, u.role, u.active, u.created_at,
              (SELECT COUNT(*) FROM activity_log a WHERE a.user_id = u.id) AS actions
         FROM users u ORDER BY u.created_at`,
    );
    res.json({ users, roles: ROLES, canManage: req.user.role === 'admin' });
  });

  router.post('/users', requireRole('admin'), (req, res) => {
    const body = req.body ?? {};
    const name = requireString(body.name, 'nome', { max: 80 });
    const email = requireString(body.email, 'e-mail', { max: 160 }).toLowerCase();
    const password = requireString(body.password, 'senha', { min: 8, max: 200 });
    const role = ROLES.includes(body.role) ? body.role : 'editor';

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('E-mail invalido');
    if (get('SELECT id FROM users WHERE lower(email) = ?', [email])) {
      throw conflict('Ja existe um usuario com este e-mail');
    }

    const id = newId('usr');
    run(
      `INSERT INTO users (id, name, email, password_hash, role, active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [id, name, email, hashPassword(password), role, now()],
    );
    logActivity(req.user, 'user.created', 'user', id, `Usuario ${email} criado com perfil ${role}`);
    res.status(201).json({ user: { id, name, email, role, active: 1 } });
  });

  router.patch('/users/:id', requireRole('admin'), (req, res) => {
    const target = get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!target) throw notFound('Usuario nao encontrado');
    const body = req.body ?? {};
    const fields = [];
    const params = [];

    if (body.name !== undefined) {
      fields.push('name = ?');
      params.push(requireString(body.name, 'nome', { max: 80 }));
    }
    if (body.role !== undefined) {
      if (!ROLES.includes(body.role)) throw badRequest('Perfil invalido');
      if (target.id === req.user.id && body.role !== 'admin') {
        throw badRequest('Voce nao pode remover seu proprio acesso de administrador');
      }
      fields.push('role = ?');
      params.push(body.role);
    }
    if (body.active !== undefined) {
      if (target.id === req.user.id && !body.active) throw badRequest('Voce nao pode desativar o proprio usuario');
      fields.push('active = ?');
      params.push(body.active ? 1 : 0);
      if (!body.active) run('DELETE FROM sessions WHERE user_id = ?', [target.id]);
    }
    if (body.password !== undefined) {
      fields.push('password_hash = ?');
      params.push(hashPassword(requireString(body.password, 'senha', { min: 8, max: 200 })));
      run('DELETE FROM sessions WHERE user_id = ?', [target.id]);
    }
    if (!fields.length) throw badRequest('Nenhum campo para atualizar');
    params.push(target.id);
    run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    logActivity(req.user, 'user.updated', 'user', target.id, `Usuario ${target.email} atualizado`);
    res.json({ ok: true });
  });

  router.post('/auth/password', (req, res) => {
    const { current_password: current, new_password: next } = req.body ?? {};
    const row = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!row || !verifyPassword(current, row.password_hash)) {
      throw badRequest('Senha atual incorreta');
    }
    const password = requireString(next, 'nova senha', { min: 8, max: 200 });
    run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), req.user.id]);
    run('DELETE FROM sessions WHERE user_id = ?', [req.user.id]);
    logActivity(req.user, 'user.password_changed', 'user', req.user.id, 'Senha alterada pelo proprio usuario');
    res.json({ ok: true });
  });

  return wrapAsyncRouter(router);
}
