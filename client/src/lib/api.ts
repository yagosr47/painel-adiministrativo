export class ApiError extends Error {
  status: number;
  details: any;
  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Autenticacao em duas camadas.
 *
 * 1. cookie httpOnly `panel_session` — caminho normal em qualquer navegador.
 * 2. token em `Authorization: Bearer` — usado quando o navegador descarta o
 *    cookie (cookies de terceiros bloqueados em iframe, ex.: preview do painel).
 *
 * O token e guardado em localStorage apenas como fallback; o cookie continua
 * sendo a fonte preferida e o servidor aceita os dois.
 */
const TOKEN_KEY = 'panel_token';

/**
 * Avisa a UI que a sessao do servidor morreu (401).
 *
 * Sem isso, um token velho no localStorage continuava sendo enviado em toda
 * requisicao: o servidor respondia 401 sempre e o painel parecia "pedir login"
 * em telas isoladas (visao geral, criacao de template) mesmo com o usuario
 * logado. O listener troca a tela para o login de forma coerente.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export const sessionEvents = {
  onUnauthorized(handler: UnauthorizedHandler) {
    onUnauthorized = handler;
    return () => {
      if (onUnauthorized === handler) onUnauthorized = null;
    };
  },
};

function notifyUnauthorized() {
  try {
    onUnauthorized?.();
  } catch {
    /* a UI nunca deve quebrar a requisicao */
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* modo privado / storage bloqueado */
    }
  },
};

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options_: { silent401?: boolean } = {},
): Promise<T> {
  const options: RequestInit = { method, credentials: 'same-origin', headers: {} as Record<string, string> };
  const headers = options.headers as Record<string, string>;

  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    // Sem resposta (DNS, offline, porta errada, iframe bloqueado): status 0
    // permite a UI distinguir "servidor fora do ar" de "credencial recusada".
    throw new ApiError(0, 'Servidor indisponivel. Verifique se a API esta no ar.', null);
  }
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  // O servidor marca com X-Session-Stale quando o Bearer apresentado nao vale
  // mais (troca de servidor, sessao revogada, expiracao). Nesse caso o token
  // local precisa sair, mesmo que a resposta seja 200 via cookie.
  const stale = response.headers.get('X-Session-Stale');
  if (stale === 'bearer') tokenStore.set(null);

  if (!response.ok) {
    if (response.status === 401) {
      // sessao invalida: limpa o token e avisa a UI uma unica vez
      if (token) tokenStore.set(null);
      if (!options_.silent401) notifyUnauthorized();
    }
    throw new ApiError(response.status, data?.error ?? `Erro ${response.status}`, data?.details);
  }
  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

export const api = {
  get: <T,>(url: string) => request<T>('GET', url),
  /** GET que nao dispara o handler global de 401 (usado pelo boot da sessao). */
  probe: <T,>(url: string) => request<T>('GET', url, undefined, { silent401: true }),
  post: <T,>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T,>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T,>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  del: <T,>(url: string) => request<T>('DELETE', url),
};

export const query = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
};
