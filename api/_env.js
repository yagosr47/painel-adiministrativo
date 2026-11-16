/**
 * Ambiente serverless.
 *
 * Este modulo precisa ser importado ANTES de qualquer modulo do servidor:
 * `server/db/index.js` le DATA_DIR/DB_PATH no primeiro uso. Em plataformas
 * serverless o diretorio do projeto e somente leitura — apenas /tmp e gravavel.
 * Como o filesystem e efemero, os dados nao persistem entre instancias; use
 * um servidor Node com disco para producao de verdade.
 */
import { mkdirSync } from 'node:fs';

const isServerless = Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (isServerless && !process.env.DATA_DIR) {
  const dir = '/tmp/painel-data';
  mkdirSync(dir, { recursive: true });
  process.env.DATA_DIR = dir;
  process.env.DB_PATH = `${dir}/panel.db`;
}

export const SERVERLESS = isServerless;
