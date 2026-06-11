# STATE — Memória do Projeto

**Atualizado:** 2026-06-11

## Sessão atual

Mapeamento brownfield + decisões fechadas + specs F1–F7 + **passada de validação em effort MAX** (2026-06-11): 6 correções aplicadas, a mais importante o adapter da skill Sentiness (`claude-code-skill` em vez de `claude-code`, que corrompe CLAUDE.md). Handoff para o próximo agente em `.specs/HANDOFF.md`. **Execução autorizada começando pela F1.**

## Decisões tomadas

- 2026-06-11 — **D1 resolvida:** pnpm workspaces puro (sem Turborepo/Nx por ora; scripts orquestrados com `pnpm -r --filter`).
- 2026-06-11 — **Runtime F1:** Node 26 fixado em `.nvmrc`/`engines` por decisão do Yan; specs da F1 atualizadas de Node 22 para 26 antes de continuar a execução.
- 2026-06-11 — **D2 resolvida:** repo git **novo** na raiz `conteai/`, sem preservar histórico. Os dirs `yan-site-api-node/` e `yan-site-front-vue/` ficam no disco como referência durante o porte, **ignorados no .gitignore**, e são removidos no cutover (F7).
- 2026-06-11 — **Hospedagem:** VPS/EC2 próprio (Node). Suporta SSR sem restrição.
- 2026-06-11 — **D5 resolvida:** Nuxt 3 híbrido — SSR/ISR nas páginas públicas, client-side nas áreas admin. Confirmado com o Yan que SSR ≥ prerender para SEO (conteúdo sempre fresco, sem rebuild).
- 2026-06-11 — **D3 resolvida:** acervo existente migra com **nenhuma favorita**; o Yan marca gradualmente. O filtro "só favoritas" é o default da galeria, mas com toggle fácil e visível para o visitante ver tudo. Galeria sem favoritas mostra empty-state com CTA para "ver todas" (sem fallback silencioso).
- 2026-06-11 — **Idioma:** i18n completo (pt-BR + en, os dois idiomas hoje misturados na UI) via @nuxtjs/i18n. Descrições das fotos permanecem no idioma em que foram escritas.
- 2026-06-11 — **D4 resolvida (minha recomendação, reversível):** driver.js para o tutorial (leve, MIT, mantido, framework-agnostic).
- 2026-06-11 — **D6 resolvida por consequência:** `apps/web` nasce em Nuxt com Vuetify 3 estável desde o início; não há migração incremental do front antigo.
- 2026-06-11 — **Vuex → Pinia** no app novo (padrão do ecossistema Nuxt; estado: user/token, tema, tutorial-visto, filtro favoritas).
- 2026-06-11 — MongoDB e S3 permanecem; bugs CONCERNS.md §1–8 corrigidos durante o porte (F2), não em hotfix.
- 2026-06-11 — Novo **F7 (deploy & cutover)** adicionado ao roadmap: a troca em produção no VPS é trabalho real e ganhou feature própria.
- 2026-06-11 — **Sentiness adotado (dogfooding):** o quality gate de IA do próprio Yan (Arateki/Sentiness, npm `@sentiness`, 0.1.x) entra no F1 (spec R10/T6): checks iniciais biome+deps-diff (fast) e knip (standard), baseline limpo, skill Claude Code instalada, CI advisory enquanto 0.x. Atritos viram issues no repo dele — feedback faz parte do objetivo.
- 2026-06-11 — **Paridade visual dirigida por goldens (proposta do Yan, aprovada):** Fase 0 da F3, executada logo após F1 e antes da F2 — Playwright captura goldens do front legado (deep-links pinados, read-only contra API de produção, 6 viewports × ~8 estados, mesmo container Docker) + characterization tests da função `resize()` do modal (prova os branches que screenshots só amostram). Porte F3 compara contra os goldens com thresholds tolerantes (Vuetify beta→estável diverge por construção) e masks nos elementos novos. Spec: F3 §Fase 0 (RV1–RV6).
- 2026-06-11 — **Lint híbrido:** Biome substitui ESLint+Prettier em `apps/api`/`packages/shared` (e alimenta o `check-biome` do Sentiness); ESLint+eslint-plugin-vue só em `apps/web` (suporte do Biome a .vue ainda experimental, sem regras específicas de Vue). Primeira issue publicada: `@sentiness/check-eslint` → https://github.com/Arateki/Sentiness/issues/1 (texto em `.specs/issues/sentiness-check-eslint.md`).

## Decisões pendentes

Nenhuma bloqueante. Pontos menores ficam para o Specify de cada feature (ex.: intervalo/transição do modo teatro, default do checkbox favorita no upload).

## Blockers

Nenhum.

## Lições aprendidas

- A API tem convenções sutis que quebram fácil num porte: keys S3 relativas no banco com `setImagesUrl` na saída e strip de URL na edição; `files[i]`↔`versionNames[i]` por índice; deep-link por `id` que expande o limit. Cobrir com testes de contrato antes do switch (TESTING.md).
- Vuetify do front antigo está em `^3.0.0-beta.0` — não rodar `npm install` no projeto legado sem lockfile.

## Ideias futuras (deferred)

- Fila assíncrona para pipeline de upload (BullMQ).
- Normalizar geografia/tags por referência (hoje strings casadas por nome).
- Paginação por cursor (deep-link por `id` carrega a collection para achar o índice).
- CDN/domínio próprio para imagens (ajuda SEO; avaliado em F6).
- Perfis de câmera declarativos (`helpers/metadata.js`).
- Turborepo se os builds ficarem lentos (D1 revisável).

## Preferences

- Idioma das interações e docs: PT-BR (código/identificadores em inglês; UI bilíngue via i18n).
