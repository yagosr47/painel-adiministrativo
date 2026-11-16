/**
 * Entrada serverless (Vercel / Netlify Functions).
 *
 * Reaproveita o mesmo app Express do servidor Node — nao ha logica duplicada.
 * A interface (dist/) e servida estaticamente pela plataforma; a API responde
 * em /api/* e as midias em /media/*.
 *
 * Limitacoes do modo serverless (importante):
 *  - filesystem efemero e somente /tmp gravavel -> o SQLite nao persiste;
 *  - cada instancia tem o proprio banco;
 *  - portanto, use serverless para demonstracao. Para producao, rode
 *    `npm start` em um host com disco (Railway, Render, Fly.io, VPS) ou aponte
 *    DB_PATH para um volume persistente.
 */
import './_env.js';
import { app } from '../server/app.js';
import { getDb } from '../server/db/index.js';
import { seedDatabase } from '../server/seed/seed.js';
import { countUsers } from '../server/lib/session.js';

getDb();

// Sem disco persistente, o banco nasce vazio a cada instancia fria. Populamos
// automaticamente (admin + templates + imagens) para o painel ser utilizavel.
if (process.env.PANEL_AUTO_SEED !== 'false' && countUsers() === 0) {
  try {
    seedDatabase({ force: true });
  } catch (error) {
    console.error('[serverless] falha no seed automatico:', error);
  }
}

const PREFIX = '/api/index';

/**
 * Reconstroi a URL original que o Express deve enxergar.
 *
 * Dependendo do provedor, o rewrite entrega ao handler uma destas formas:
 *   1. URL original preservada .................... /api/dashboard?x=1
 *   2. URL de destino + query __path (Vercel) .... /api/index?__path=/api/dashboard&x=1
 *   3. URL de destino com caminho anexado ........ /api/index/dashboard
 *   4. cabecalho x-original-url / x-rewrite-url .. /api/dashboard
 *
 * Testado em server/tests/serverless.test.js para os quatro formatos.
 */
export function restoreUrl(rawUrl, headers = {}) {
  const target = rawUrl || '/';
  const parsed = new URL(target, 'http://localhost');

  const fromQuery = parsed.searchParams.get('__path');
  if (fromQuery) {
    const rest = new URLSearchParams(parsed.searchParams);
    rest.delete('__path');
    const path = fromQuery.startsWith('/') ? fromQuery : `/${fromQuery}`;
    const qs = rest.toString();
    return qs ? `${path}?${qs}` : path;
  }

  const fromHeader = headers['x-original-url'] || headers['x-rewrite-url'];
  if (typeof fromHeader === 'string' && fromHeader.startsWith('/')) return fromHeader;

  const { pathname } = parsed;
  if (pathname === PREFIX || pathname === `${PREFIX}/`) {
    // Sem pista do caminho original: preserva a query crua e deixa o Express
    // responder 404 JSON (nunca uma pagina NOT_FOUND do provedor).
    return `/api${parsed.search}`;
  }
  if (pathname.startsWith(`${PREFIX}/`)) {
    const stripped = pathname.slice(PREFIX.length);
    // /api/index/dashboard -> /api/dashboard (a funcao responde por /api e
    // /media); se o caminho ja vier completo, preservamos.
    const full = /^\/(api|media)(\/|$)/.test(stripped) ? stripped : `/api${stripped}`;
    return `${full}${parsed.search}`;
  }

  return target;
}

export default function handler(req, res) {
  const restored = restoreUrl(req.url, req.headers);
  try {
    req.url = restored;
  } catch {
    console.warn('[serverless] nao foi possivel reescrever req.url:', req.url);
  }
  return app(req, res);
}

export { app };
