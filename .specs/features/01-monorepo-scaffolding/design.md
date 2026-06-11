# F1 — Design

## Layout final

```
conteai/
├── .specs/                      # já existe
├── .github/workflows/ci.yml
├── .gitignore                   # inclui yan-site-api-node/ e yan-site-front-vue/
├── .nvmrc                       # Node 26
├── package.json                 # private, packageManager: pnpm@<versão>, scripts raiz
├── pnpm-workspace.yaml          # apps/* , packages/*
├── tsconfig.base.json           # strict, moduleResolution bundler/nodenext por app
├── biome.json                   # lint+format de apps/api e packages/shared (exclui apps/web)
├── sentiness.config.json        # quality gate (checks: biome, deps-diff, knip)
├── .sentiness/baseline.json     # commitado; runtime local no .gitignore
├── apps/
│   ├── api/                     # NestJS (porta 3000 — mesma da API legada)
│   │   ├── src/{main.ts, app.module.ts, health/}
│   │   ├── test/ (vitest + supertest)
│   │   └── .env.example
│   └── web/                     # Nuxt 3 (porta 3001 em dev)
│       ├── nuxt.config.ts       # vuetify, pinia, @nuxtjs/i18n
│       ├── eslint.config.mjs    # ESLint flat + eslint-plugin-vue (só este app)
│       ├── app/ | pages/ | i18n/locales/{pt-BR,en}.json
│       └── .env.example         # NUXT_PUBLIC_API_URL
└── packages/
    └── shared/                  # tipos/contratos
        └── src/{index.ts, image.ts}
```

## Decisões de design

- **Portas:** API mantém 3000 (paridade com legado e com `VUE_APP_API_URL` atual); web em 3001 dev / atrás do nginx em prod.
- **Vitest no Nest:** via `@swc/core` + `unplugin-swc` (decorators); supertest para o e2e do health.
- **Vuetify no Nuxt:** `vuetify-nuxt-module` (SSR-aware) em vez de plugin manual.
- **i18n:** `strategy: 'no_prefix'` + detecção por browser com cookie — URLs públicas não mudam por idioma (preserva deep-links existentes e simplifica SEO inicial; hreflang fica para F6 se necessário).
- **shared:** sem build step próprio (consumido por TS path/workspace direto; `tsc --noEmit` no typecheck). Evita orquestração de ordem de build sem Turbo.
- **CI:** single job matrix-free (projeto pequeno): `pnpm install --frozen-lockfile` → lint → typecheck → test → build, com `actions/setup-node` + cache pnpm.

- **Lint híbrido (decidido 2026-06-11):** Biome (linter+formatter Rust, config única) para TS puro — rápido o bastante para o tier fast do Sentiness via `check-biome`. ESLint + eslint-plugin-vue **somente** em `apps/web`: o suporte do Biome a SFC .vue (v2.3/2.4) é experimental, com falsos positivos e sem as regras específicas de Vue. `biome.json` exclui `apps/web`; script raiz `lint` roda os dois.
- **Sentiness (dogfooding):** instalado no F1 com baseline limpo; checks iniciais conservadores (biome fast, deps-diff fast, knip standard) — coverage/jscpd/semgrep/osv entram em F2 quando houver código real. CI roda `sentiness check` advisory (`continue-on-error`) enquanto 0.x. Workflow do agente passa a seguir a skill instalada (`check --tier=fast` pós-edit, `--tier=standard` pré-conclusão). Limitação conhecida: `check-coverage` é single-root (`<cwd>/coverage/coverage-final.json`) — tratar quando coverage entrar (merge na raiz ou issue de suporte a workspace).

## Riscos

- Versões Nuxt/Vuetify/Vite movem rápido — fixar versões exatas no F1 e atualizar conscientemente.
- ESLint flat config + Vue + TS exige `typescript-eslint` e `eslint-plugin-vue` compatíveis; validar com `pnpm lint` antes de seguir.
- Sentiness 0.1.x recém-publicado — papel advisory até provar estabilidade; nunca editar baseline/config para passar (regra da skill).
