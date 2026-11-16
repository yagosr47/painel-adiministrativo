# Painel de Sites — Templates e Biblioteca

Sistema de desenvolvimento e gerenciamento de sites para estabelecimentos de
diferentes segmentos. O painel oferece uma **biblioteca de templates** pronta por
segmento, uma **biblioteca de imagens** organizada por categoria e um **editor de
personalizacao** que cria, para cada cliente, uma versao **independente e isolada**
do site.

> Principio central: **template e modelo; site de cliente e copia.**
> Editar o template nunca altera um site existente. Personalizar um cliente nunca
> altera outro cliente — nem o template.

---

## Sumario

- [Como rodar](#como-rodar)
- [Arquitetura](#arquitetura)
- [Modelo de isolamento](#modelo-de-isolamento)
- [Templates por segmento](#templates-por-segmento)
- [Biblioteca de imagens](#biblioteca-de-imagens)
- [Painel administrativo](#painel-administrativo)
- [Permissoes e seguranca](#permissoes-e-seguranca)
- [API](#api)
- [Testes](#testes)
- [Decisoes e limites](#decisoes-e-limites)

---

## Como rodar

Requisitos: **Node.js 22.5+** (usa `node:sqlite`, sem dependencias nativas).

```bash
npm install
npm run seed      # cria usuario admin, segmentos, templates, imagens e 3 clientes de exemplo
npm run dev       # API (4000) + painel (5173)
```

Acesse **http://localhost:5173**.

Credenciais criadas pelo seed (configuraveis por variavel de ambiente):

| Variavel | Padrao |
| --- | --- |
| `PANEL_ADMIN_EMAIL` | `admin@painel.local` |
| `PANEL_ADMIN_PASSWORD` | `admin123` |

> Em producao, defina essas variaveis **antes** do primeiro `npm run seed` e troque a
> senha em **Equipe e permissoes → Alterar minha senha**.

Outros comandos:

```bash
npm test          # suite completa (API, isolamento, SSR do renderizador)
npm run build     # typecheck + build do painel em dist/
npm start         # serve API + painel compilado na porta 4000
```

Variaveis de ambiente: `PORT`, `DATA_DIR` (padrao `data/`), `DB_PATH`.

---

## Arquitetura

```
server/
  app.js                 aplicacao Express (exportada para testes)
  index.js               bootstrap HTTP
  db/schema.sql          schema SQLite (documentado por tabela)
  db/index.js            conexao, helpers e transacoes
  lib/config.js          modelo do config do site + normalizacao/validacao
  lib/auth.js            hash scrypt, ids
  lib/session.js         sessoes por cookie httpOnly
  lib/storage.js         armazenamento individualizado de midia
  lib/imagery.js         gerador de ilustracoes SVG (deterministico)
  lib/upload.js          multipart com limite de tamanho
  routes/                auth, templates, images, clients/public, dashboard, users
  seed/catalog.js        catalogo de segmentos, templates e imagens
  seed/seed.js           popular banco
  tests/                 isolamento, catalogo, renderizacao (SSR)

client/src/
  site/SiteRenderer.tsx  motor de renderizacao do site (16 tipos de secao)
  editor/SiteConfigEditor.tsx  editor reutilizavel (template OU cliente)
  components/            UI base, seletor de imagens, previas
  pages/                 dashboard, templates, biblioteca, clientes, equipe
```

O **mesmo** `SiteConfigEditor` e o **mesmo** `SiteRenderer` atendem templates e
sites de clientes. A diferenca esta no que o servidor permite gravar em cada
escopo — nao em telas duplicadas.

---

## Modelo de isolamento

### Template x Site

```
templates.config  ──clone──►  sites.config   (copia profunda, JSON proprio)
      │                            │
      │ modelo editavel           │ conteudo do cliente
      └── nunca lido em runtime ───┘ (o site nao depende do template para renderizar)
```

- `sites.template_id` / `template_version` sao apenas **proveniencia** (auditoria).
- Ao criar um cliente, o servidor faz `structuredClone` do config do template,
  resolvе marcadores (`{{clientName}}`, `{{whatsapp}}`…), valida as imagens e grava.
- A **reaplicacao** de um template em um site existente e sempre **manual e
  versionada**, com tres modos: apenas tema, apenas uma secao, ou configuracao
  completa. Nunca acontece em cascata a partir de uma edicao de template.

### Historico

Todo salvamento de site gera uma linha em `site_revisions` (config completo,
autor, rotulo e resumo das mudancas). Restaurar cria uma **nova** versao — o
historico nunca e reescrito.

### Imagens

| Escopo | Armazenamento | Visibilidade |
| --- | --- | --- |
| Biblioteca (`owner_client_id IS NULL`) | `data/media/library/<segmento>/` | compartilhada, somente leitura |
| Acervo do cliente (`owner_client_id`) | `data/media/clients/<cliente>/` | privada do cliente |

Regras aplicadas **no servidor** em toda gravacao de config:

1. imagem de biblioteca so e aceita se pertencer ao **segmento do cliente**;
2. imagem propria so e aceita se pertencer **aquele cliente**;
3. imagens privadas de um cliente nunca aparecem na listagem de outro;
4. o arquivo de uma imagem privada de site **nao publicado** retorna 404 para
   quem nao esta logado (ao publicar, passa a ser publico).

Validacao em `server/routes/clients.js` (`assertImagesAllowed`), testada em
`server/tests/isolation.test.js`.

---

## Templates por segmento

Cada template tem identidade visual propria (paleta, tipografia, densidade,
cantos), estrutura de secoes especifica do segmento, catalogo inicial e
categorias. Nao sao variacoes de um mesmo layout.

| Segmento | Templates |
| --- | --- |
| Restaurantes e lanchonetes | Forno Italiano (pizzaria) · Burger Street (hamburgueria) |
| Barbearias e saloes | Navalha de Ouro (classica) · Studio Lumiere (salao) |
| Oficinas e servicos automotivos | Torque Auto Center |
| Lojas de roupas | Vitrine Urbana |
| Mercados e mercearias | Mercado do Bairro |
| Clinicas e servicos profissionais | Clinica Vitalis · Escritorio Vertice |
| Portfolios e institucionais | Ateliere Portfolio · Instituto Horizonte |

**16 tipos de secao** disponiveis no editor: `hero`, `about`, `features`,
`catalog`, `gallery`, `team`, `testimonials`, `hours`, `contact`, `cta`, `faq`,
`stats`, `steps`, `brands`, `menu-highlights`, `booking`.

Personalizacao disponivel por site: cores, logotipo, tipografia, imagens, textos,
produtos e servicos, categorias, links, contatos, horarios, SEO, rodape, menu,
secoes (adicionar, remover, reordenar, duplicar, desativar) e dados de negocio
(pedido por WhatsApp, agendamento, convenios, delivery).

---

## Biblioteca de imagens

Organizada por **segmento → categoria**: restaurantes (pizzas, hamburgueres,
bebidas, pratos, ambientes, sobremesas), barbearias (cortes, cadeiras,
ambientes, ferramentas, produtos), oficinas (veiculos, servicos, pecas,
ambientes), lojas (roupas, calcados, acessorios, vitrines), mercados
(hortifruti, padaria, bebidas, mercearia), clinicas (consultorios, equipe,
procedimentos, escritorio) e portfolio (projetos, equipe, escritorio, processo).

Recursos: visualizar, buscar por titulo/tag, filtrar por categoria, enviar imagem
propria, substituir arquivo, excluir, definir capa do segmento e definir
capa/miniatura do site e do template.

### Sobre licenciamento (importante)

As imagens demonstrativas **nao sao fotos de banco de imagens**. Sao
**ilustracoes vetoriais geradas pelo proprio sistema** (`lib/imagery.js`), sem
marcas, pessoas ou obras de terceiros. Por isso:

- entram como `license = 'illustrative'` e o campo `license_note` explica o uso;
- a interface marca cada uma com o selo **Ilustrativa** (biblioteca e site);
- os sites exibem a nota "imagens ilustrativas, substitua pelas fotos reais";
- o sistema **nao baixa** imagens externas — nao ha uso de material de terceiros
  sem autorizacao.

O fluxo recomendado e sempre preferir as **imagens proprias do estabelecimento**:
ao abrir o seletor dentro de um cliente, o admin pode enviar o arquivo real, que
fica privado daquele cliente e substitui a ilustracao mantendo o layout.

Licencas suportadas por imagem: `illustrative` (demonstrativa), `authorized`
(uso autorizado, com nota registrada) e `own` (enviada pelo estabelecimento).

---

## Painel administrativo

Secao **Templates e Biblioteca** (menu lateral):

- **Modelos de site** — grade/lista por segmento/categoria, busca, previa em
  desktop e mobile, criar, editar, duplicar, arquivar, excluir (com confirmacao
  quando ha sites dependentes) e ver quais clientes usam o modelo.
- **Biblioteca de imagens** — categorias por segmento, upload, substituicao,
  exclusao com checagem de uso, capa e edicao de metadados/licenca.

**Clientes e sites** — cadastro com escolha do template de partida, status do
site, editor completo com previa ao vivo, publicar/retirar do site, historico de
versoes e reaplicacao manual de template.

**Visao geral** — indicadores, segmentos atendidos, atividade recente.

**Atividade** — trilha de auditoria de todas as acoes.

**Equipe e permissoes** — usuarios, perfis, desativacao e troca de senha.

O site publicado fica em `#/s/<identificador>` (ex.: `#/s/bella-massa`), com SEO
basico (titulo e descricao) aplicado a partir do config.

---

## Permissoes e seguranca

| Recurso | Administrador | Editor |
| --- | --- | --- |
| Ver templates/clientes/imagens | sim | sim |
| Editar conteudo, tema e imagens | sim | sim |
| Publicar/despublicar site | sim | sim |
| Criar/duplicar template | sim | sim |
| Excluir template · reaplicar template · excluir cliente | sim | nao (403) |
| Gerenciar usuarios | sim | nao (403) |

Alem das permissoes:

- senhas com **scrypt** + salt, comparacao em tempo constante;
- sessao por **cookie httpOnly / SameSite=Lax**, expiracao de 14 dias, revogada ao
  trocar senha ou desativar usuario;
- toda consulta usa **prepared statements** (sem concatenacao de SQL);
- validacao e normalizacao centralizadas em `lib/config.js` (cores, fontes, ids de
  imagem, limites de listas, tipos de secao desconhecidos viram tipo seguro);
- upload detecta o formato pelos **magic numbers**, limita a 6 MB, gera o nome do
  arquivo no servidor (sem path traversal) e **rejeita SVG com script/eventos**;
- SVG e servido com `Content-Security-Policy: default-src 'none'` e `nosniff`;
- isolamento de midia validado no servidor a cada gravacao (nao apenas na UI);
- erros de handlers assincronos sao capturados (`wrapAsyncRouter`), sem derrubar o
  processo;
- todas as acoes sensiveis geram registro em `activity_log`.

---

## API

Todas as rotas `/api/*` (exceto `auth` e `public`) exigem sessao.

```
POST   /api/auth/login | /api/auth/logout        GET /api/auth/session
POST   /api/auth/password

GET    /api/dashboard                            GET /api/activity

GET    /api/segments
GET    /api/templates?segment=&category=&status=&q=
GET    /api/templates/:id
POST   /api/templates                            PATCH /api/templates/:id
POST   /api/templates/:id/duplicate
DELETE /api/templates/:id?force=true             POST /api/templates/from-site/:siteId

GET    /api/images?segment=&category=&q=&clientId=&scope=
POST   /api/images                               (multipart: file + metadados)
POST   /api/images/illustration
PATCH  /api/images/:id
PUT    /api/images/:id/file                      DELETE /api/images/:id?force=true
GET    /api/images/:id/usages

GET    /api/clients?q=&segment=                  POST /api/clients
GET    /api/clients/:id                          PATCH /api/clients/:id
DELETE /api/clients/:id
PUT    /api/clients/:id/site                     (salva config + nova revisao)
POST   /api/clients/:id/site/publish | /unpublish
POST   /api/clients/:id/site/apply-template      { mode: config|theme|section }
GET    /api/clients/:id/site/revisions
POST   /api/clients/:id/site/revisions/:revId/restore

GET    /api/users                                POST /api/users
PATCH  /api/users/:id

GET    /api/public/sites/:slug[?preview=1]       (preview exige sessao)
GET    /media/:arquivo
```

---

## Testes

```bash
npm test
```

54 testes, em tres frentes:

**`tests/isolation.test.js`** — sobe o app real com banco temporario e prova, via
HTTP: autenticacao e permissoes por perfil; todos os segmentos com template
publicado; duplicacao independente; **editar template nao altera site**;
**personalizar um cliente nao altera outro nem o template**; copia profunda sem
referencia compartilhada; versionamento e restauracao; **imagem de outro cliente
bloqueada**; **imagem de biblioteca de outro segmento bloqueada**; ausencia de
vazamento na listagem; imagem privada de site em rascunho inacessivel; SVG
malicioso rejeitado e SVG limpo servido com CSP; validacoes de entrada; remocao de
template em uso exigindo confirmacao; reaplicacao de tema preservando conteudo;
ciclo de vida de usuarios e sessoes.

**`tests/render.test.js`** — valida o catalogo: um template por segmento, secoes e
catalogo presentes, **toda referencia de imagem existente e do proprio segmento**,
ids unicos e prefixados, imagens marcadas como ilustrativas, normalizacao de
entradas invalidas e placeholders.

**`tests/ssr.test.js`** — renderiza o `SiteRenderer` (React) para **todos** os
templates e verifica HTML, secoes habilitadas/desativadas, tema aplicado, precos,
marca de imagens ilustrativas, tolerancia a imagem ausente e **escape de HTML**
(conteudo nao injeta `<script>`).

---

## Decisoes e limites

- **Sem dependencias nativas**: persistencia com `node:sqlite`. Para trocar por
  Postgres, o isolamento depende apenas de `sites.config` ser um documento proprio
  — nenhuma consulta de renderizacao le `templates`.
- **Config como JSON versionado**: renderizar um site nao exige o template. Isso e
  o que garante que editar um modelo jamais quebre um cliente publicado.
- **Aplicacao de template e manual** — de proposito. Propagacao automatica entre
  clientes e justamente o risco que o sistema evita.
- **Ilustracoes geradas localmente** em vez de fotos de banco de imagens, para nao
  usar material de terceiros sem autorizacao; o fluxo prioriza a imagem real do
  estabelecimento.
- **Sem upload de video/fonte** e sem CMS de blog — fora do escopo desta entrega.
- O formulario de contato do site e demonstrativo (nao envia e-mail); a integracao
  com canal oficial do estabelecimento entra como proximo passo.
