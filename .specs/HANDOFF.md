# Handoff

**Date:** 2026-06-11
**Repository:** `https://github.com/yan-vidal/conteAI`
**Branch:** `main`
**Current feature:** F1 — Scaffolding do monorepo (`.specs/features/01-monorepo-scaffolding/`)

## Completed

- F1 concluida em `main`: pnpm workspace, Node 26, `apps/api` NestJS skeleton, `apps/web` Nuxt 3 skeleton, `packages/shared`, Biome/ESLint, Vitest, CI GitHub Actions e Sentiness.
- T1-T8 marcadas como concluidas em `.specs/features/01-monorepo-scaffolding/tasks.md`.
- Sentiness instalado como instrucao de repo (`AGENTS.md`) e como skills nativas:
  - `.agents/skills/sentiness/SKILL.md`
  - `.claude/skills/sentiness/SKILL.md`
- Issue criada para o atrito antigo do adapter Codex skill: `https://github.com/Arateki/Sentiness/issues/5`. O repo ja usa `@sentiness/core@0.1.3`, com `codex-skill` funcionando.
- Legados mantidos no disco e ignorados pelo git:
  - `yan-site-api-node/`
  - `yan-site-front-vue/`

## Last Verification

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` passou fora da sandbox local porque o e2e da API precisa abrir socket local via Supertest.
- `pnpm build`
- `pnpm exec sentiness check --tier=fast --trigger=post-edit --compact`
- `pnpm exec sentiness check --tier=standard --trigger=pre-done --compact`
- API dev: `curl http://127.0.0.1:3000/health` retornou `200 {"status":"ok"}`.
- Web dev: `curl http://localhost:3001/` retornou HTML SSR contendo `ConteAI Fotografia`.
- `git status --short` ficou vazio apos o commit inicial.

## Next Step

Executar **F3 Fase 0 antes da F2**. Nao comecar o porte da API ou do frontend antes disso.

Ler primeiro:

- `.specs/project/ROADMAP.md`
- `.specs/features/03-web-nuxt-favoritas/spec.md` secao `Fase 0 — Baseline de paridade visual`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/CONCERNS.md`
- `.specs/codebase/STRUCTURE.md`

Objetivo da proxima sessao:

1. Criar a suite Playwright de captura contra o front legado em `yan-site-front-vue/`.
2. Rodar o front legado apontado para a API atual/producao somente em fluxos de leitura.
3. Fixar deep-links/IDs de fotos estaveis para a matriz visual.
4. Capturar goldens em `tests/visual/goldens/` e documentar IDs/data de captura.
5. Criar characterization tests da matematica `resize()` do modal legado antes do porte Nuxt.

## Frontend Migration Direction

O frontend novo nao e uma adaptacao direta do Vue CLI antigo. Ele sera portado para o projeto novo ja criado em:

- `apps/web/`

O legado fica como referencia e fonte de goldens:

- `yan-site-front-vue/`

Durante F3, portar comportamento, rotas, visual, edge cases e deep-links para `apps/web`, comparando contra os goldens da Fase 0. Nao editar o legado para "facilitar" a comparacao.

## Invariants

- O visitante nao deve perceber diferenca ate o cutover em F7.
- Deep-links antigos da galeria nunca podem quebrar: `/gallery?id=&version=&city=&state=&country=&tag=&startDate=&endDate=`.
- Ordenacao default preservada: `metadata.takenAt desc`.
- Rota de login preservada: `/secretdoor`.
- Contrato da listagem preservado: `{ images, total }`.
- API nova em F2 deve manter o front Vue legado funcionando sem alteracao.
- Bugs conhecidos do legado listados em `.specs/codebase/CONCERNS.md` sao corrigidos no porte F2, nunca como hotfix no repo antigo.
- Goldens da Fase 0 nao devem ser atualizados para silenciar diff nao compreendido.
- Fotos pinadas para goldens nao devem ser editadas durante o porte.
- Sentiness: nunca editar `sentiness.config.json`, baseline ou pending feedback para passar check.

## Suggested Skills

- `sentiness`: usar no inicio para `sentiness pending`, apos edicoes com tier fast e antes de concluir com tier standard.
- `superpowers:systematic-debugging`: usar em qualquer falha de teste, build, Playwright ou comportamento inesperado.
- `superpowers:verification-before-completion`: usar antes de declarar F3 Fase 0 concluida.
