# Handoff

**Date:** 2026-06-14
**Repository:** `https://github.com/yan-vidal/conteAI`
**Branch:** `f3-visual-baseline` (F3 Fase 0 + F2 vivem aqui)
**Last feature:** F2 — Porte da API para NestJS (`.specs/features/02-api-nest-port/`) — **CONCLUÍDA**

## Completed ✓

- **F1** scaffolding do monorepo (pnpm, Node 26, NestJS/Nuxt skeletons, Biome/ESLint, Vitest, CI, Sentiness).
- **F3 Fase 0** baseline de paridade visual: goldens Playwright do front legado (6 viewports × estados) em `tests/visual/goldens/legacy/` + characterization tests do `resize()` em `tests/legacy-resize/`.
- **F2** porte completo da API (T1–T16, todas concluídas em `.specs/features/02-api-nest-port/tasks.md`):
  - Config/bootstrap, harness de contrato, schemas Mongoose, helpers de URL.
  - Auth (JWT 1h, guard 401, throttle), geo (countries/states/cities), tags (+ `/tags/sync`).
  - Storage S3, Google Vision/Geocoding, EXIF/derivativos (sharp).
  - Imagens: listagem (filtros + deep-link), edit/delete, upload multipart (pipeline + rollback).
  - Aceitação documentada em `.specs/features/02-api-nest-port/acceptance.md`.

## Last Verification (Node 26, 2026-06-14)

- `pnpm lint` · `pnpm typecheck` · `pnpm build` — OK.
- `pnpm test` — **77 testes, 21 arquivos** (e2e precisam rodar fora da sandbox: Supertest abre socket local).
- `pnpm exec sentiness check --tier=standard --trigger=pre-done` — `status: ok` (baseline reinicializado, ver nota abaixo).

## Next Step

**Executar a F3 — porte completo do frontend para `apps/web` (Nuxt).**

Ler primeiro:
- `.specs/features/03-web-nuxt-favoritas/spec.md` (telas, favoritas por padrão, deep-links).
- `.specs/features/03-web-nuxt-favoritas/tasks.md`.
- Goldens da Fase 0 em `tests/visual/goldens/legacy/` — comparar o porte contra eles (thresholds tolerantes, masks em elementos novos; nunca atualizar goldens para silenciar diff não compreendido).
- A API nova (F2) já roda e mantém o contrato; pode ser usada como backend do novo front.

## Blockers

Nenhum funcional. Item de infra (não bloqueia F2): ver nota de dogfooding.

## Context

- Uncommitted: nenhum após o commit da T16 (verificar `git status`).
- **Sentiness baseline:** estava vazio; reinicializado via `sentiness baseline init` (decisão do Yan). Suprime 25 falsos-positivos pré-existentes do knip (deps Nuxt, `multer` via `FilesInterceptor`, `@sentiness/check-*`, `eslint`, exports de scaffolding). `newInDiff` limpo. Reportar ao repo Sentiness: knip sem config para Nuxt e deps dinâmicas. **Nunca editar baseline/config para silenciar achados NOVOS.**
- Smoke manual do front legado contra a API Nest está pendente de infra real (checklist em `acceptance.md`) — validar antes do cutover (F7).
- Bugs do legado já corrigidos no porte estão listados como "exceções de contrato" em `acceptance.md`.

## Suggested Skills

- `tlc-spec-driven`: retomar pela F3 (`specify`/`design`/`tasks` já existem; ir para execução).
- `sentiness`: `pending` no início, tier fast pós-edit, standard antes de concluir.
- `superpowers:systematic-debugging` e `superpowers:verification-before-completion`.
