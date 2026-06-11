# F1 — Scaffolding do Monorepo

**Status:** pronta para executar | **Escopo:** Large

## Objetivo

Criar a fundação do monorepo TypeScript em `conteai/` com pnpm workspaces, apps esqueleto (NestJS e Nuxt 3) e tooling compartilhado, de modo que F2 (porte da API) e F3 (porte do front) comecem com lint/typecheck/test/build funcionando em CI.

## Requisitos

- **R1** — Repo git novo iniciado na raiz `conteai/`, branch `main`; `.gitignore` cobre `node_modules`, `dist`, `.output`, `.nuxt`, `.env*` (exceto `.env.example`) **e os dirs legados** `yan-site-api-node/` e `yan-site-front-vue/`.
- **R2** — pnpm workspaces com layout `apps/api`, `apps/web`, `packages/shared`; `packageManager` fixado no package.json raiz (corepack); Node 26 fixado em `.nvmrc` e `engines`.
- **R3** — TypeScript estrito compartilhado: `tsconfig.base.json` na raiz (`strict: true`), estendido pelos três pacotes.
- **R4** — Lint/format híbrido: **Biome** na raiz como linter+formatter de `apps/api` e `packages/shared` (TS/JSON; substitui ESLint+Prettier nesses pacotes); **ESLint flat + eslint-plugin-vue** apenas em `apps/web` (suporte do Biome a .vue ainda é experimental). Scripts raiz `lint`, `typecheck`, `test`, `build` orquestrando via `pnpm -r`.
- **R5** — `apps/api`: NestJS esqueleto em TS estrito com `ConfigModule`, endpoint `GET /health` respondendo 200, e Vitest configurado com ≥1 teste passando.
- **R6** — `apps/web`: Nuxt 3 esqueleto com Vuetify 3 **estável**, Pinia, @nuxtjs/i18n configurado com locales `pt-BR` e `en` (strategy sem prefixo de URL no default), página index renderizando SSR, e Vitest com ≥1 teste passando.
- **R7** — `packages/shared`: pacote TS com ao menos o tipo `ImageDocument` (espelhando o schema atual de `models/Image.js`) exportado e consumível pelos dois apps via workspace protocol.
- **R8** — CI GitHub Actions: workflow rodando install (cache pnpm) + lint + typecheck + test + build em push/PR para `main`.
- **R9** — README raiz descrevendo o monorepo, comandos e apontando para `.specs/`.
- **R10** — Sentiness adotado como quality gate (dogfooding do projeto do Yan): `@sentiness/core` instalado, `sentiness init` com checks iniciais `biome`, `deps-diff` (fast) e `knip` (standard), `baseline init` após o scaffolding (baseline limpo), skill instalada via `install-skill --agent=claude-code-skill` (**não** usar o adapter `claude-code`, que escreve managed markers dentro do CLAUDE.md — classe de incidente documentada no próprio repo do Sentiness), e `sentiness check --tier=standard` no CI em modo advisory (não bloqueia o pipeline enquanto 0.x; promover a bloqueante quando provar estabilidade). Atritos encontrados viram issues em Arateki/Sentiness.

## Critérios de aceite

1. `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes na raiz.
2. `pnpm --filter api dev` sobe a API e `curl localhost:3000/health` → 200.
3. `pnpm --filter web dev` sobe o Nuxt; `curl localhost:3001` retorna HTML renderizado no servidor (conteúdo visível sem JS).
4. `git status` limpo não lista os dirs legados.

## Fora de escopo

Porte de qualquer lógica real (F2/F3); deploy (F7); remoção dos dirs legados (F7).
