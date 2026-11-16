/**
 * Traduz falhas de login em mensagens corretas.
 *
 * Historico: a primeira versao mostrava "seu navegador bloqueia cookies" em
 * QUALQUER falha — inclusive senha errada. Isso confundiu o diagnostico. Agora
 * cada causa tem sua propria mensagem, baseada no status HTTP real:
 *
 *   0   -> sem resposta (API fora do ar / endereco errado)  -> 'unreachable'
 *   401 -> credencial recusada pelo servidor                -> 'invalid-credentials'
 *   404 -> endereco nao expoe a API (deploy estatico)       -> 'not-an-api'
 *   5xx -> erro do servidor                                 -> 'server'
 */
export type LoginIssueKind = 'invalid-credentials' | 'unreachable' | 'not-an-api' | 'server' | 'unknown';

export interface LoginIssue {
  kind: LoginIssueKind;
  message: string;
  detail?: string;
}

export function classifyLoginError(error: unknown): LoginIssue {
  const status = Number((error as any)?.status ?? 0);
  const serverMessage = (error as any)?.message as string | undefined;

  if (!status) {
    return {
      kind: 'unreachable',
      message: 'Nao foi possivel falar com o servidor.',
      detail:
        'A requisicao de login nao recebeu resposta. Confira se a API esta no ar e se voce esta acessando a porta do servidor Node (npm start) — nao apenas os arquivos estaticos do painel.',
    };
  }

  if (status === 401) {
    return { kind: 'invalid-credentials', message: 'E-mail ou senha invalidos.' };
  }

  if (status === 404) {
    return {
      kind: 'not-an-api',
      message: 'Este endereco nao expoe a API do painel.',
      detail:
        'O login recebeu 404. Isso acontece quando a interface esta hospedada sem o servidor (ex.: deploy apenas estatico). Rode npm start ou use a configuracao de deploy incluida no repositorio.',
    };
  }

  if (status === 429) {
    return { kind: 'server', message: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.' };
  }

  if (status >= 500) {
    return { kind: 'server', message: 'Erro no servidor ao processar o login.', detail: serverMessage };
  }

  return { kind: 'unknown', message: serverMessage ?? 'Falha ao entrar.' };
}

/**
 * Mensagem sobre cookies. So deve ser exibida quando o servidor CONFIRMA que a
 * sessao nao usou cookie (`cookieAuth === false`), nunca em falha de login.
 */
export const COOKIE_NOTICE =
  'Sessao ativa pelo token. Se quiser sessao persistente entre abas, abra o painel em uma aba propria ou permita cookies para este site.';
