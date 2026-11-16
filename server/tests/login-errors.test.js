import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyLoginError, COOKIE_NOTICE } from '../../client/src/lib/login-errors.ts';

/**
 * Regressao do bug relatado pelo usuario: a tela de login avisava "cookies
 * bloqueados" mesmo quando a causa era senha errada. A classificacao agora
 * precisa ser fiel ao status HTTP.
 */
test('senha errada (401) nunca culpa cookies', () => {
  const issue = classifyLoginError(Object.assign(new Error('E-mail ou senha invalidos'), { status: 401 }));
  assert.equal(issue.kind, 'invalid-credentials');
  assert.equal(issue.detail, undefined, '401 nao deve carregar explicacao sobre cookies ou rede');
  assert.match(issue.message, /senha/i);
  assert.doesNotMatch(issue.message, /cookie/i);
});

test('falha de rede (status 0) aponta servidor fora do ar', () => {
  const issue = classifyLoginError(Object.assign(new Error('fetch failed'), { status: 0 }));
  assert.equal(issue.kind, 'unreachable');
  assert.match(issue.message, /servidor/i);
});

test('404 indica que o endereco nao expoe a API', () => {
  const issue = classifyLoginError(Object.assign(new Error('not found'), { status: 404 }));
  assert.equal(issue.kind, 'not-an-api');
});

test('5xx e 429 sao erros de servidor com mensagem propria', () => {
  assert.equal(classifyLoginError({ status: 500 }).kind, 'server');
  assert.match(classifyLoginError({ status: 429 }).message, /tentativas/i);
});

test('sessao por token nao e tratada como erro', () => {
  // O aviso de cookie e informativo e so aparece quando cookieAuth === false.
  assert.doesNotMatch(COOKIE_NOTICE, /inv[aá]lid|falh|erro/i);
  const login = readFileSync(new URL('../../client/src/pages/LoginScreen.tsx', import.meta.url), 'utf8');
  assert.match(login, /cookieAuth === false/, 'aviso so pode ser ligado pela confirmacao do servidor');
  assert.doesNotMatch(login, /loginCount|Cookies bloqueados neste contexto/, 'banner antigo deve ter saido');
});
