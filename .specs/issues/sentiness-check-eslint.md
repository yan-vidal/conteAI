# Issue para Arateki/Sentiness

> **Publicada em 2026-06-11:** https://github.com/Arateki/Sentiness/issues/1

**Title:** feat: `@sentiness/check-eslint` — ESLint check for ecosystems Biome can't fully lint (Vue SFCs)

**Body:**

## Context

Adopting Sentiness in a real pnpm monorepo (NestJS API + Nuxt 3 web app). `check-biome` covers the pure-TS packages well, but the Nuxt app needs ESLint + `eslint-plugin-vue`: Biome's `.vue` SFC support (v2.3/v2.4) is still experimental — no Vue-specific rules (v-for keys, deprecated syntax, component conventions) and known false positives (e.g. biomejs/biome#7139).

Today that means the web app's lint runs **outside** the Sentiness gate (`pnpm lint` only), so `summary.blocking` / `agentInstructions.mustFix` never see Vue lint findings, and the agent can declare a task done with lint errors in `.vue` files.

## Proposal

A `@sentiness/check-eslint` package that:

- Runs `eslint --format json` (flat config, respecting the project's own config) on configured globs.
- Maps diagnostics to normalized findings (`ruleId`, file, line, severity error/warning) with stable fingerprints (check id + rule id + relative path + normalized line content).
- `detect()`: presence of `eslint.config.*` + eslint resolvable from the project.
- Tier suggestion: `fast` for small projects, `standard` default (ESLint is slower than Biome).
- Plays well alongside `check-biome` in the same repo (disjoint file sets via per-check config globs).

Alternative if preferred: a generic `check-command` adapter (run any command, parse via a small mapping spec) would cover ESLint, stylelint, vue-tsc etc. — but a first-class ESLint check probably produces better fingerprints/messages.

## Real-world setup hitting this

- `biome.json` at root excluding `apps/web`; `check-biome` enabled (fast).
- `apps/web` with ESLint flat + `eslint-plugin-vue` — currently invisible to the gate.

Happy to test a pre-release in this repo and report back.

---

*Segunda issue candidata (separada, quando coverage entrar em F2):* `check-coverage` lê apenas `<cwd>/coverage/coverage-final.json` — suporte a múltiplos relatórios/workspaces num monorepo (globs ou lista de paths) evitaria o merge manual na raiz.
