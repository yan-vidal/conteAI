# F3 — Tasks

Status: [ ] pendente · [x] concluida. Esta lista cobre somente a **Fase 0**. O porte Nuxt completo deve ganhar nova quebra de tarefas depois que os goldens estiverem commitados.

## T0 — Fixar dataset visual e contrato de captura
**O que:** documentar endpoint legado (`VUE_APP_API_URL=https://api.yanlucas.com`), data da captura, matriz de viewports, estados visuais e fotos pinadas. Usar somente rotas publicas/read-only do legado.  
**Cobre:** RV1, RV2, RV3  
**Done when:** `tests/visual/legacy-baseline.md` lista IDs, URLs, viewports e regras de nao editar fotos pinadas.  
**Depende de:** F1  
- [x]

## T1 — Extrair e caracterizar `resize()` do modal legado
**O que:** criar uma funcao pura com a matematica de `ModalViewerImage.resize()` e uma suite Vitest com matriz paisagem/retrato/quadrada x telas 360-1920 x `isRotated` true/false. A suite grava os valores esperados do legado como fixture versionada.  
**Cobre:** RV4  
**Done when:** `pnpm test -- tests/legacy-resize` ou comando equivalente passa e prova a fixture contra a implementacao pura.  
**Depende de:** T0  
- [x]

## T2 — Adicionar infraestrutura Playwright para baseline legado
**O que:** adicionar `@playwright/test`, config dedicada, helpers para subir o Vue CLI legado com `VUE_APP_API_URL=https://api.yanlucas.com`, fixtures de viewports, estado Vuex de tema e esperas deterministicas de imagens.  
**Cobre:** RV1, RV2, RV3  
**Done when:** a suite consegue abrir `/gallery` do legado local e esperar o grid carregar sem executar upload/edicao/delete.  
**Depende de:** T0  
- [x]

## T3 — Capturar goldens da matriz visual
**O que:** capturar screenshots do legado em `tests/visual/goldens/legacy/` para viewports 360x800, 390x844, 844x390, 768x1024, 1366x768 e 1920x1080 nos estados: galeria default dark/light, galeria filtrada, modal paisagem, modal retrato, painel EXIF expandido, rotacionado, multi-versao, login e `/list` bloqueada/redirecionada.  
**Cobre:** RV1, RV2, RV3, RV5  
**Done when:** goldens sao gerados e revisados visualmente; IDs/data ficam documentados em `tests/visual/legacy-baseline.md`.  
**Depende de:** T1, T2  
- [x]

## T4 — Integrar comandos e Sentiness slow
**O que:** adicionar scripts de captura/comparacao ao `package.json` raiz e, se o check existir/publicado, registrar o Playwright no Sentiness tier slow sem tornar o CI padrao bloqueante.  
**Cobre:** RV6  
**Done when:** comandos documentados rodam localmente; Sentiness standard continua verde; slow fica disponivel para execucao manual/background.  
**Depende de:** T3  
- [x]

## Dataset inicial aprovado

Endpoint: `https://api.yanlucas.com`

## Observacoes de execucao

- 2026-06-12: durante a primeira tentativa, a galeria ficou bloqueada por instabilidade externa da API/DNS. O trace do Chromium registrou `net::ERR_NAME_NOT_RESOLVED` para `countries`, `states`, `cities`, `tags` e `images`; os goldens so foram gerados depois da API voltar.
- 2026-06-12: a API voltou a resolver sem override; preflight externo para `countries` e `images` retornou HTTP 200 de forma consistente. A captura final usa `https://api.yanlucas.com` diretamente.
- 2026-06-12: `pnpm visual:legacy` passou com 78 testes em 7.1 min. Foram gerados 66 goldens em `tests/visual/goldens/legacy/` (11 estados x 6 viewports). Os testes esperam spinners visiveis sumirem antes de screenshot para nao versionar placeholders.
- 2026-06-12: links diretos de foto continuam carregando o grupo de imagens ao redor para preservar navegacao por seta/gestos. O estado rotacionado e capturado de um modal interativo ja hidratado para isolar o layout rotacionado.

IDs candidatos consultados em 2026-06-11:

- Paisagem com GPS: `68ab9c4b992f13858f306ad5` — Japan / Osaka / Museum.
- Retrato com GPS: `68ab9be2992f13858f306a91` — Japan / Osaka / Night / Art / Museum.
- Multi-versao com GPS: `67b7eb60084f9f0679bb2b17` — Japan / Tokyo / Minato City / Night / Skyscraper, `version=1..3`.
- Descricao longa com GPS: `670f6341b6130f8f74278a0d` — Japan / Tokyo / Taito / Sensō-ji.
- Descricao longa sem GPS: `66ee7b0c2e06e822f24eba66` — Brazil / Bahia / Lençóis / Chapada Diamantina.
- Somente original: `66ee7a262e06e822f24eb968` — Brazil / Bahia / Lençóis / landscape original-only.

Filtros candidatos:

- `/gallery?country=Japan&state=Tokyo&city=Taito&tag=Temple`
- `/gallery?country=Brazil&state=Bahia&city=Lençóis&tag=Landscape`
- `/gallery?id=67b7eb60084f9f0679bb2b17&version=1`

---

# Porte completo (execução) — breakdown 2026-06-14

Status: [ ] pendente · [x] concluida. Gates: `pnpm --filter api test` (API), `pnpm --filter web test` (web), `pnpm lint && pnpm typecheck && pnpm build`, Sentiness fast pós-edit / standard pré-done. Visual contra goldens da Fase 0 (RV5) entra na T14.

**Decisões de execução (das sugestões da spec):** upload com checkbox "Favorita" **marcado** por padrão (R10); toggle da galeria via `?all=true` na URL (R9, ausência = só favoritas).

## P1 — API: campo favorite (R7, R8)
**O que:** adicionar `favorite: boolean (default false)` ao schema `Image` e ao tipo `ImageDocument` em `@conteai/shared`; `GET /images?favorite=true|false` (true → `{favorite:true}`, false → `{favorite:false}`, ausente → sem filtro); aceitar `favorite` em `POST /images` (body) e `PATCH /images/:id`. e2e cobrindo filtro + create/edit.
**Depende de:** F2 (concluída).
**Done when:** testes da API verdes; contrato existente preservado (ausência de favorite = não-favorito).
**Commit:** `feat(api): add image favorite field and filter`
- [x] concluida em 2026-06-14. `favorite?: boolean` (schema default false) em `Image` + `ImageDocument`; `GET /images?favorite=` filtra; upload/edit aceitam `favorite`. e2e: filtro, default no upload, toggle no patch. 79 testes verdes.

## P2 — Web: fundação (API client + Pinia + config) (R5)
**O que:** composable/`$fetch` tipado com `@conteai/shared` e `NUXT_PUBLIC_API_URL`; stores Pinia (auth/token com persistência localStorage; tema claro/escuro; filtros da galeria; toggle favoritas; tutorial-visto placeholder); plugin de tema. Vuetify 3 + i18n já no skeleton.
**Depende de:** P1 (tipos shared).
**Done when:** `useApi` lista `/images` e `/countries` em dev; token persiste; typecheck/test web verdes.
**Commit:** `feat(web): api client and pinia stores`
- [x] concluida em 2026-06-14. `composables/useApi.ts` (tipado com `@conteai/shared`, `NUXT_PUBLIC_API_URL`, headers de auth); stores Pinia setup-syntax `auth` (token/payload/login/logout, persistido) e `theme` (dark/toggle, persistido) via `@pinia-plugin-persistedstate/nuxt`; `@conteai/shared` adicionado como dep do web. Stores em sintaxe setup para evitar colisão de auto-import. 4 testes web verdes.

## P3 — Web: rotas + middleware de auth (R1)
**O que:** `/` → redirect `/gallery`; `/gallery` (SSR público); `/secretdoor` (login); `/upload` e `/list` (client-only, middleware exige token Pinia). Layout base + HeaderBar portado.
**Depende de:** P2.
**Done when:** rotas resolvem; `/upload` e `/list` redirecionam sem token; deep-link query preservada.
**Commit:** `feat(web): routes and auth middleware`
- [x] concluida em 2026-06-14. `/` redireciona para `/gallery`; `/gallery` preserva query de deep-link; `/secretdoor`, `/upload` e `/list` existem; `/upload` e `/list` usam middleware `auth` e redirecionam sem token; HeaderBar com toggle de tema portado. Verificado com `pnpm --filter web test` (7 testes), `pnpm --filter web lint`, `pnpm --filter web typecheck` sob Node 26 e Sentiness fast `ok`.

## P4 — Web: porte da matemática `resize()` do modal (RV4)
**O que:** portar a função pura de `tests/legacy-resize/legacyResize.ts` para `apps/web` e provar contra a fixture de characterization (valores idênticos ao legado).
**Depende de:** P2.
**Done when:** suite de unidade reproduz a fixture golden exatamente.
**Commit:** `feat(web): port modal resize math`
- [x] concluida em 2026-06-14. `apps/web/utils/modalResize.ts` porta a matemática do legado sem arredondar valores; `apps/web/test/modalResize.spec.ts` compara contra a fixture golden de `tests/legacy-resize`. Verificado com `pnpm --filter web test` (8 testes), `pnpm --filter web lint`, `pnpm --filter web typecheck` sob Node 26 e Sentiness fast `ok`.

## P5 — Web: GalleryView + favoritas (R2, R6, R9, R11)
**O que:** grid com filtros em cascata country/state/city, tags, range de datas, infinite scroll, sync de estado↔URL, tema, i18n; ordenação default `metadata.takenAt desc`; SSR da 1ª página via `useAsyncData` com `<img>`/alt reais; default só favoritas + toggle "Favoritas ★ / Todas" (`?all=true`), empty-state com CTA; deep-link por `id` de foto não-favorita força "Todas" (R11).
**Depende de:** P2, P3.
**Done when:** SSR retorna HTML com imagens; filtros e deep-links funcionam; default favoritas com toggle.
**Commit:** `feat(web): gallery view with favorites default`
- [x] concluida em 2026-06-14. `/gallery` usa `useAsyncData` para filtros e primeira página de imagens, renderiza `<img>`/alt reais, aplica `sort=metadata.takenAt&order=desc`, default `favorite=true`, toggle `?all=true`, filtros de URL legados, empty-state com CTA para todas e retry de deep-link 404 em modo "Todas". Verificado com `pnpm --filter web test` (14 testes), `pnpm --filter web lint`, `pnpm --filter web typecheck`, `pnpm --filter web build` sob Node 26 e Sentiness fast `ok`.

## P6 — Web: ModalViewerImage (R3)
**O que:** carrossel de versões, toggle original, painel EXIF, paleta com copy-hex, links Maps/Street View, teclado + gestos touch (workarounds iOS documentados), cache de imagens; usa `resize()` da P4. Deep-link `version=`.
**Depende de:** P4, P5.
**Done when:** modal abre por deep-link com versão correta; EXIF/paleta/links corretos.
**Commit:** `feat(web): modal image viewer`
- [x] concluida em 2026-06-14. `ModalViewerImage.vue` renderiza versão solicitada por `version=`, alterna original/versões, usa `calculateModalSize`, mostra EXIF/tags/paleta com copy-hex, links Maps/Street View, teclado e swipe; `/gallery?id=&version=` abre o modal correto. Verificado com `pnpm --filter web test` (16 testes), `pnpm --filter web lint`, `pnpm --filter web typecheck`, `pnpm --filter web build` sob Node 26 e Sentiness fast `ok`.

## P7 — Web: Login (/secretdoor) (R1)
**O que:** form de login → `POST /authentication`, grava token no Pinia, redireciona; i18n.
**Depende de:** P2, P3.
**Done when:** login válido autentica e libera `/upload` e `/list`; inválido mostra erro.
**Commit:** `feat(web): login view`
- [x] concluida em 2026-06-14. `/secretdoor` tem formulário i18n, chama `auth.login()`/`POST /authentication`, grava token/payload no Pinia, redireciona para `/list` em sucesso e mostra erro em credenciais inválidas. Verificado com `pnpm --filter web test` (10 testes), `pnpm --filter web lint`, `pnpm --filter web typecheck` sob Node 26 e Sentiness fast `ok`.

## P8 — Web: Upload (client-only) (R4, R10)
**O que:** multi-arquivo com versionNames, checkbox Original, checkbox Favorita (default marcado), descrição → `POST /images` multipart; feedback/erros.
**Depende de:** P2, P3, P7, P1.
**Done when:** upload multi-versão cria imagem (validado contra a API).
**Commit:** `feat(web): upload view`
- [x] concluida em 2026-06-14. `/upload` tem formulário client-only protegido, múltiplos arquivos com `versionNames[index]`, Original exclusivo, Favorita marcada por padrão, descrição e envio via `useApi().uploadImage(FormData)` com feedback de sucesso/erro. Verificado com `pnpm --filter web test` (18 testes), `pnpm --filter web lint`, `pnpm --filter web typecheck`, `pnpm --filter web build` sob Node 26 e Sentiness fast `ok`.

## P9 — Web: List/Edit (client-only) (R4, R10)
**O que:** listagem admin, edição completa (incl. metadata/URLs), delete com confirmação, toggle favorita na linha e no modal.
**Depende de:** P2, P3, P7, P1.
**Done when:** editar/excluir/alternar favorita refletem na API.
**Commit:** `feat(web): list and edit view`
- [ ]

## P10 — Regressão visual + testes + aceitação (RV5, RV6, critérios 1-5)
**O que:** rodar comparação Playwright do front novo contra os goldens da Fase 0 (thresholds calibrados, masks nos elementos novos), revisar diffs visualmente; Vitest dos componentes críticos (galeria, viewer, toggle favoritas); registrar no Sentiness slow (RV6); doc de aceitação + handoff.
**Depende de:** P5, P6, P7, P8, P9.
**Done when:** paridade visual aceita conscientemente; critérios 1-5 da spec atendidos; handoff para F4.
**Commit:** `docs: record web port acceptance`
- [ ]
