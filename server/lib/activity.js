import { all, run } from '../db/index.js';
import { newId } from './auth.js';

export function logActivity(user, action, entity, entityId = '', summary = '') {
  run(
    `INSERT INTO activity_log (id, user_id, actor, action, entity, entity_id, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId('log'),
      user?.id ?? null,
      user?.name ?? 'sistema',
      action,
      entity,
      entityId,
      summary,
      new Date().toISOString(),
    ],
  );
}

export function recentActivity(limit = 25) {
  return all(
    `SELECT id, actor, action, entity, entity_id, summary, created_at
       FROM activity_log ORDER BY created_at DESC LIMIT ?`,
    [Math.min(200, Math.max(1, Number(limit) || 25))],
  );
}
