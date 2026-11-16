export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const notFound = (message = 'Recurso nao encontrado') => new HttpError(404, message);
export const forbidden = (message = 'Acesso negado') => new HttpError(403, message);
export const unauthorized = (message = 'Faca login para continuar') => new HttpError(401, message);
export const conflict = (message, details) => new HttpError(409, message, details);

/**
 * Express 4 nao captura rejeicoes de handlers `async` automaticamente — sem
 * isso, um erro de validacao dentro de uma rota async derrubaria o processo.
 * Aplicado em /api para todas as rotas assincronas.
 */
export function wrapAsyncRouter(router) {
  for (const layer of router.stack) {
    if (!layer.route) continue;
    for (const handler of layer.route.stack) {
      const original = handler.handle;
      if (original.length >= 3) continue; // middleware de erro
      handler.handle = (req, res, next) => {
        try {
          const result = original(req, res, next);
          if (result && typeof result.catch === 'function') result.catch(next);
        } catch (error) {
          next(error);
        }
      };
    }
  }
  return router;
}

export function requireString(value, field, { min = 1, max = 500 } = {}) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < min) throw badRequest(`Campo "${field}" e obrigatorio`);
  if (text.length > max) throw badRequest(`Campo "${field}" deve ter no maximo ${max} caracteres`);
  return text;
}
