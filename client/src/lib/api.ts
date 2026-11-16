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

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
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

  if (!response.ok) {
    // token expirado/invalido: limpa para nao insistir em sessao morta
    if (response.status === 401 && token) tokenStore.set(null);
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
