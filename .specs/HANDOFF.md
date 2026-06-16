# Handoff

**Date:** 2026-06-15
**Repository:** `https://github.com/yan-vidal/conteAI`
**Branch atual:** `f3-web-nuxt` (criada a partir de `main` após o merge do PR #1) — **F3 completa, pronta para PR**
**Feature concluída:** F3 — Frontend Nuxt + Favoritas (`.specs/features/03-web-nuxt-favoritas/`)

## Completed ✓

- **F1** scaffolding do monorepo. **F3 Fase 0** baseline visual (goldens em `tests/visual/goldens/legacy/`, characterization `resize()` em `tests/legacy-resize/`).
- **F2** porte completo da API NestJS (T1–T16) — **mergeado em `main`** via PR #1. Aceitação em `.specs/features/02-api-nest-port/acceptance.md`.
- **F3 — breakdown do porte completo criado** em `.specs/features/03-web-nuxt-favoritas/tasks.md` (seção "Porte completo (execução)", tarefas P1–P10).
- **F3 P1 — API favoritas** (commit `d47cbfb`): `favorite?: boolean` (default false) em `Image` + `@conteai/shared`; `GET /images?favorite=true|false`; upload/edit aceitam `favorite`. 79 testes da API verdes.
- **F3 P2 — Fundação web** (commit `9b1275a`): `apps/web/composables/useApi.ts` (tipado, `NUXT_PUBLIC_API_URL`, token), stores Pinia `auth`/`theme` (setup-syntax, persistidas via `@pinia-plugin-persistedstate/nuxt`); `@conteai/shared` é dep do web. 4 testes web verdes.
- **F3 P3 — Rotas + auth middleware**: `/`→`/gallery`, `/gallery` público preservando query de deep-link, `/secretdoor`, `/upload` e `/list`; `auth` middleware exige token Pinia para `/upload`/`/list`; HeaderBar com toggle de tema. 7 testes web verdes, lint/typecheck web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P4 — Matemática do modal**: `apps/web/utils/modalResize.ts` porta `resize()` do legado e `apps/web/test/modalResize.spec.ts` prova paridade exata contra a fixture golden. 8 testes web verdes, lint/typecheck web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P7 — Login**: `/secretdoor` com formulário i18n, `auth.login()`/`POST /authentication`, token/payload no Pinia, redirect para `/list` em sucesso e erro visível em credenciais inválidas. 10 testes web verdes, lint/typecheck web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P5 — GalleryView + favoritas**: `/gallery` com `useAsyncData` para filtros e primeira página, `<img>`/alt reais, ordenação `metadata.takenAt desc`, default favoritas (`favorite=true`), toggle `?all=true`, filtros de URL legados, empty-state com CTA e retry de deep-link 404 em "Todas". 14 testes web verdes, lint/typecheck/build web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P6 — ModalViewerImage**: modal abre por `/gallery?id=&version=`, renderiza versão correta, alterna original/versões, usa `calculateModalSize`, mostra EXIF/tags/paleta copy-hex, links Maps/Street View e navegação por teclado/swipe. 16 testes web verdes, lint/typecheck/build web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P8 — Upload**: `/upload` client-only protegido com multi-arquivo, `versionNames[index]`, Original exclusivo, Favorita marcada por padrão, descrição, `useApi().uploadImage(FormData)` e feedback de sucesso/erro. 18 testes web verdes, lint/typecheck/build web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P9 — List/Edit**: `/list` client-only protegido lista imagens admin, alterna favorita na linha, edita descrição/local/tags/favorita + `metadata.takenAt` + URLs de original/versões e exclui com confirmação. 20 testes web verdes, lint/typecheck/build web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P10 — Regressão visual + paridade** (commits `6d4d19c`..`86799f0`): suíte `tests/visual/webPort.spec.ts` (`playwright.web.config.ts`, app novo na porta 3003, 6 viewports) compara o Nuxt contra os goldens do legado — **66/66 verdes**. O chrome do modal foi **portado fielmente com Vuetify** (não mascarado): `ModalViewerImage.vue` reconstruído com `v-expansion-panels`/`v-radio-group`/`v-menu`, 12 ícones SVG em `components/icons/`, formatador de data em `utils/date.ts`. Geometria da foto corrigida (sem padding no `.modal-viewer`, resize síncrono na rotação, clamp `max-width: calc(100vw-48px)`, `img` absoluta). Thresholds calibrados por diff consciente: galeria 0.04 (sub-pixel do `<img>` vs `v-img`), chrome 0.05 (padding/sombra do Vuetify — RV5). Goldens de login/redirect recapturados para o design pt-BR "Secret Door"; golden mobile-landscape do modal substituído (era artefato de loading do legado). Vitest 21/21, lint/typecheck verdes, Sentiness standard `ok`. Ver memória `modal-chrome-parity`.

## Decisões de execução da F3 (adotadas das sugestões da spec)

- Upload com checkbox "Favorita" **marcado** por padrão (R10).
- Toggle da galeria via `?all=true` na URL; ausência = só favoritas (R9).

## Next Step

> ⚠️ **Regressões de paridade encontradas no teste manual (2026-06-15):** o front
> novo diverge do legado em 6 interações (date picker da galeria, menus de
> localização/data do modal, visibilidade do chrome do modal, toggle de tema,
> posição dos botões de nav/rotação, scrollbar do modo teatro). Tudo documentado
> com referências de código e metodologia golden-driven em
> [`HANDOFF-parity-fixes.md`](./HANDOFF-parity-fixes.md). **Ler antes de continuar.**

**F3 está completa (P1–P10).** Próximos passos:

1. **Abrir PR de `f3-web-nuxt` → `main`** (a branch ainda não tem PR). Escrever a aceitação da F3 em `.specs/features/03-web-nuxt-favoritas/acceptance.md` (espelhar o formato de `02-api-nest-port/acceptance.md`).
2. **Iniciar a F4** (próxima feature da spec — confirmar o escopo em `.specs/project/` / roadmap antes de criar o breakdown em `.specs/features/04-*/tasks.md`).

Pendências não-bloqueantes deixadas para decisão do Yan: (a) localizar ou não o heading "Secret Door" hardcoded; (b) manter o redesign de login ou reaproximar do legado.

Ler primeiro: `.specs/features/03-web-nuxt-favoritas/spec.md` e a seção P1–P10 de `tasks.md`. Front legado de referência em `yan-site-front-vue/src/` (GalleryView, ModalViewerImage, ModalEditImage, UploadImages, LoginView; store Vuex; `plugins/api.js`).

## Context / Convenções

- Padrões do porte API (úteis se mexer em `apps/api`): ver "Lições aprendidas" no `STATE.md` (Biome sem parameter decorators → `@Bind`; value-import + `biome-ignore` para DI; Mongoose 9 `QueryFilter`/`UpdateQuery`; `exactOptionalPropertyTypes` → spreads condicionais).
- Web: stores Pinia em **sintaxe setup** (evita warning de auto-import); ambiente de teste vitest = `nuxt` (`mockNuxtImport` + `setActivePinia(createPinia())`).
- **API nova roda como backend do front novo** (`NUXT_PUBLIC_API_URL`).
- **Sentiness baseline** reinicializado na F2 (suprime falsos-positivos pré-existentes do knip). Nunca editar baseline/config para silenciar achados NOVOS. Issue de dogfooding: https://github.com/Arateki/Sentiness/issues/7.
- Uncommitted: nenhum (verificar `git status`). Branch `f3-web-nuxt` com toda a F3 commitada (até `86799f0`), ainda **sem PR**.
- Regressão visual do app novo: `pnpm visual:web` (`playwright.web.config.ts`, porta 3003). `playwright.config.ts` agora aponta para a config do web; legado continua em `playwright.legacy.config.ts` (`pnpm visual:legacy`).

## Invariants (não quebrar)

- Deep-links `/gallery?id=&version=&city=...` idênticos; ordenação default `metadata.takenAt desc`; rota `/secretdoor`; contrato `{ images, total }`.
- Goldens da Fase 0 não devem ser atualizados para silenciar diff não compreendido; fotos pinadas não editadas.

## Suggested Skills

- `tlc-spec-driven` (executar P3+), `sentiness` (`pending` no início, fast pós-edit, standard pré-done), `superpowers:systematic-debugging`, `superpowers:verification-before-completion`.
