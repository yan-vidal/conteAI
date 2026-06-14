# Handoff

**Date:** 2026-06-14
**Repository:** `https://github.com/yan-vidal/conteAI`
**Branch atual:** `f3-web-nuxt` (criada a partir de `main` após o merge do PR #1)
**Feature em andamento:** F3 — Frontend Nuxt + Favoritas (`.specs/features/03-web-nuxt-favoritas/`)

## Completed ✓

- **F1** scaffolding do monorepo. **F3 Fase 0** baseline visual (goldens em `tests/visual/goldens/legacy/`, characterization `resize()` em `tests/legacy-resize/`).
- **F2** porte completo da API NestJS (T1–T16) — **mergeado em `main`** via PR #1. Aceitação em `.specs/features/02-api-nest-port/acceptance.md`.
- **F3 — breakdown do porte completo criado** em `.specs/features/03-web-nuxt-favoritas/tasks.md` (seção "Porte completo (execução)", tarefas P1–P10).
- **F3 P1 — API favoritas** (commit `d47cbfb`): `favorite?: boolean` (default false) em `Image` + `@conteai/shared`; `GET /images?favorite=true|false`; upload/edit aceitam `favorite`. 79 testes da API verdes.
- **F3 P2 — Fundação web** (commit `9b1275a`): `apps/web/composables/useApi.ts` (tipado, `NUXT_PUBLIC_API_URL`, token), stores Pinia `auth`/`theme` (setup-syntax, persistidas via `@pinia-plugin-persistedstate/nuxt`); `@conteai/shared` é dep do web. 4 testes web verdes.
- **F3 P3 — Rotas + auth middleware**: `/`→`/gallery`, `/gallery` público preservando query de deep-link, `/secretdoor`, `/upload` e `/list`; `auth` middleware exige token Pinia para `/upload`/`/list`; HeaderBar com toggle de tema. 7 testes web verdes, lint/typecheck web verdes sob Node 26, Sentiness fast `ok`.
- **F3 P4 — Matemática do modal**: `apps/web/utils/modalResize.ts` porta `resize()` do legado e `apps/web/test/modalResize.spec.ts` prova paridade exata contra a fixture golden. 8 testes web verdes, lint/typecheck web verdes sob Node 26, Sentiness fast `ok`.

## Decisões de execução da F3 (adotadas das sugestões da spec)

- Upload com checkbox "Favorita" **marcado** por padrão (R10).
- Toggle da galeria via `?all=true` na URL; ausência = só favoritas (R9).

## Next Step

**Retomar a F3 na tarefa P7** (ver `tasks.md`). Ordem sugerida: P7 → P5 → P6 → P8 → P9 → P10.

- **P7** Login (`/secretdoor`) grava token no Pinia e libera `/upload`/`/list`.
- **P5** GalleryView (filtros cascata, infinite scroll, sync URL, SSR 1ª página via `useAsyncData`, default favoritas + toggle `?all=true` + empty-state, deep-link R11). **Ordenação default `metadata.takenAt desc` é invariante.**
- **P6** ModalViewerImage (usa P4) · **P8** Upload · **P9** List/Edit · **P10** regressão visual vs goldens + Vitest + aceitação.

Ler primeiro: `.specs/features/03-web-nuxt-favoritas/spec.md` e a seção P1–P10 de `tasks.md`. Front legado de referência em `yan-site-front-vue/src/` (GalleryView, ModalViewerImage, ModalEditImage, UploadImages, LoginView; store Vuex; `plugins/api.js`).

## Context / Convenções

- Padrões do porte API (úteis se mexer em `apps/api`): ver "Lições aprendidas" no `STATE.md` (Biome sem parameter decorators → `@Bind`; value-import + `biome-ignore` para DI; Mongoose 9 `QueryFilter`/`UpdateQuery`; `exactOptionalPropertyTypes` → spreads condicionais).
- Web: stores Pinia em **sintaxe setup** (evita warning de auto-import); ambiente de teste vitest = `nuxt` (`mockNuxtImport` + `setActivePinia(createPinia())`).
- **API nova roda como backend do front novo** (`NUXT_PUBLIC_API_URL`).
- **Sentiness baseline** reinicializado na F2 (suprime falsos-positivos pré-existentes do knip). Nunca editar baseline/config para silenciar achados NOVOS. Issue de dogfooding: https://github.com/Arateki/Sentiness/issues/7.
- Uncommitted: nenhum (verificar `git status`). Branch `f3-web-nuxt` ainda não tem PR.

## Invariants (não quebrar)

- Deep-links `/gallery?id=&version=&city=...` idênticos; ordenação default `metadata.takenAt desc`; rota `/secretdoor`; contrato `{ images, total }`.
- Goldens da Fase 0 não devem ser atualizados para silenciar diff não compreendido; fotos pinadas não editadas.

## Suggested Skills

- `tlc-spec-driven` (executar P3+), `sentiness` (`pending` no início, fast pós-edit, standard pré-done), `superpowers:systematic-debugging`, `superpowers:verification-before-completion`.
