import { app } from './app.js';
import { getDb, get } from './db/index.js';

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

getDb();

app.listen(PORT, HOST, () => {
  console.log(`[api] painel administrativo ouvindo em http://${HOST}:${PORT}`);
  console.log(`[api] banco: ${process.env.DB_PATH ?? 'data/panel.db'}`);
  const usuarios = get('SELECT COUNT(*) AS total FROM users')?.total ?? 0;
  if (!usuarios) {
    console.log('[api] NENHUM usuario cadastrado. Rode "npm run seed" para criar o administrador inicial.');
  }
});
