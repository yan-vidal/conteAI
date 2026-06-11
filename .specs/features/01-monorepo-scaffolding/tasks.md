# F1 — Tasks

Status: [ ] pendente · [x] concluída. `[P]` = paralelizável após T2.

## T1 — Iniciar repo e raiz do workspace
**O quê:** `git init` em `conteai/`; criar `.gitignore` (node_modules, dist, .output, .nuxt, .env*, `!.env.example`, `yan-site-api-node/`, `yan-site-front-vue/`), `.nvmrc` (26), `package.json` raiz (private, `packageManager`, scripts `lint/typecheck/test/build` via `pnpm -r`), `pnpm-workspace.yaml` (`apps/*`, `packages/*`), README.
**Cobre:** R1, R2, R9
**Done when:** `git status` não lista os legados; `pnpm install` roda sem erro.
- [x]

## T2 — Tooling compartilhado (TS + lint + format)
**O quê:** `tsconfig.base.json` estrito; **Biome** na raiz (`biome.json`: lint+format de `apps/api` e `packages/shared`, excluindo `apps/web`); script raiz `lint` agregando Biome + ESLint do web (T5).
**Cobre:** R3, R4
**Done when:** `pnpm exec biome check .` roda limpo (mesmo sem pacotes ainda).
**Depende de:** T1
- [x]

## T3 [P] — packages/shared
**O quê:** pacote `@conteai/shared` com `src/image.ts` tipando `ImageDocument`/`ImageVersion`/`ImageMetadata`/`ColorPalette` (espelho fiel de `yan-site-api-node/models/Image.js`, incluindo campos opcionais) + `Tag`, `Country`, `State`, `City`, `AuthResponse`. Script `typecheck`.
**Cobre:** R7
**Done when:** `pnpm --filter @conteai/shared typecheck` verde.
**Depende de:** T2
- [x]

## T4 [P] — apps/api esqueleto NestJS
**O quê:** NestJS (major estável mais recente no momento da execução) em TS estrito; `ConfigModule.forRoot` global; `HealthController` (`GET /health` → `{ status: 'ok' }`); porta 3000; Vitest+SWC com teste unit do controller e e2e supertest; `.env.example`. Importar tipo de `@conteai/shared` em ao menos um lugar para validar o workspace link.
**Cobre:** R5, R7
**Done when:** `pnpm --filter api test` verde; `curl localhost:3000/health` → 200 com app rodando.
**Depende de:** T2 (e T3 para o import)
- [x]

## T5 [P] — apps/web esqueleto Nuxt 3
**O quê:** Nuxt 3 + vuetify-nuxt-module (tema dark default com as cores de `plugins/vuetify.js` legado) + Pinia + @nuxtjs/i18n (`pt-BR`, `en`, `no_prefix`, cookie); ESLint flat local com eslint-plugin-vue (este app fica fora do Biome); página index SSR com string i18n; Vitest (@nuxt/test-utils) com 1 teste; `.env.example` com `NUXT_PUBLIC_API_URL`; dev na porta 3001.
**Cobre:** R4, R6
**Done when:** `pnpm --filter web test` e `build` verdes; `curl localhost:3001` contém o texto da index no HTML.
**Depende de:** T2
- [x]

## T6 — Adotar Sentiness (dogfooding)
**O quê:** `pnpm add -D @sentiness/core` + checks (`check-biome`, `check-deps-diff`, `check-knip`, `check-eslint`); `sentiness init` (config: biome/deps-diff em fast, knip/eslint em standard); `sentiness doctor` limpo; `sentiness install-skill --agent=claude-code-skill` e `sentiness install-skill --agent=codex-skill` para gerar skills nativas em `.claude/skills/` e `.agents/skills/`. A partir daqui o agente segue a skill: `check --tier=fast` pós-edit, `--tier=standard` pré-conclusão. Atritos → issues em Arateki/Sentiness.
**Cobre:** R10
**Done when:** `pnpm exec sentiness check --tier=standard --compact` retorna `summary.status: ok`; `.claude/skills/sentiness/SKILL.md` e `.agents/skills/sentiness/SKILL.md` commitados.
**Depende de:** T3, T4, T5
- [x]

## T7 — CI GitHub Actions
**O quê:** `.github/workflows/ci.yml`: checkout → pnpm/setup-node com cache → `pnpm install --frozen-lockfile` → lint → typecheck → test → build → `sentiness check --tier=standard` (advisory: `continue-on-error: true` enquanto 0.x), em push/PR para main.
**Cobre:** R8, R10
**Done when:** workflow verde no GitHub (ou `act`/execução local equivalente documentada). Validado localmente em 2026-06-11 com `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm exec sentiness check --tier=standard --trigger=pre-done --compact`.
**Depende de:** T6
- [x]

## T8 — Gate final + commit
**O quê:** rodar a sequência completa `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm exec sentiness check --tier=standard`; conferir critérios de aceite 1–4 do spec; commits atômicos por task (se não feitos ao longo do caminho); push para o repo novo no GitHub (criar repo `conteai` — nome a confirmar com o Yan).
**Cobre:** todos
**Done when:** critérios de aceite 1–4 verificados e anotados.
**Validação 2026-06-11:** critério 1 verde com `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (fora da sandbox por bind local do Supertest), `pnpm build` e `pnpm exec sentiness check --tier=standard --trigger=pre-done --compact`; critério 2 verde com `curl http://127.0.0.1:3000/health` → 200 `{"status":"ok"}`; critério 3 verde com `curl http://localhost:3001/` → 200 e HTML SSR contendo `ConteAI Fotografia`; critério 4 verde após commit inicial: `git status --short` vazio e legados aparecem apenas como ignorados.
**Depende de:** T7
- [x]
