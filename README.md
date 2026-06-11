# ConteAI

Monorepo TypeScript para evoluir a galeria de fotografia yanlucas.com.

## Objetivo

Este repositório será a nova base unificada do projeto:

- `apps/api`: API NestJS
- `apps/web`: frontend Nuxt 3
- `packages/shared`: tipos e contratos compartilhados

Os diretórios legados `yan-site-api-node/` e `yan-site-front-vue/` ficam no disco apenas como referência durante o porte e são ignorados pelo Git da raiz.

## Comandos

Use Node 26 e pnpm:

```bash
nvm use
npm install -g corepack@latest
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

Verificações do workspace:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Planejamento

A execução segue os artefatos em `.specs/`:

- `.specs/project/PROJECT.md`: visão e escopo
- `.specs/project/ROADMAP.md`: ordem das features
- `.specs/project/STATE.md`: decisões e contexto vivo
- `.specs/features/01-monorepo-scaffolding/`: spec, design e tasks da fundação
