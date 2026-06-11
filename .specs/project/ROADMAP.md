# Roadmap

Decisões de arquitetura fechadas em 2026-06-11 (ver STATE.md). Ordem: fundação → porte seguro → features visíveis → alcance → cutover. Specs em `.specs/features/`.

## Milestone 1 — Fundação

### F1. Scaffolding do monorepo `conteai/` — **pronta para executar**
**Escopo:** Large | **Spec:** `features/01-monorepo-scaffolding/`
Repo git novo na raiz; pnpm workspaces; `apps/api` (NestJS skeleton), `apps/web` (Nuxt 3 + Vuetify 3 estável + Pinia + i18n pt-BR/en), `packages/shared`; tsconfig/eslint/prettier compartilhados; Vitest; CI GitHub Actions. Legados ignorados no git, mantidos no disco como referência.

## Milestone 2 — Porte da API

### F2. API NestJS com paridade de contrato
**Escopo:** Complex | **Spec:** `features/02-api-nest-port/`
Porte de todas as rotas mantendo contratos exatos — o front Vue legado deve continuar funcionando apontado para a API nova. Corrige bugs CONCERNS.md §1–8 na passagem. Testes de contrato antes do switch. Não migra código morto.

## Milestone 3 — Frontend novo + features de produto

### F3. Frontend Nuxt (porte da galeria/admin) + Favoritas por padrão
**Escopo:** Complex | **Spec:** `features/03-web-nuxt-favoritas/`
**Fase 0 (executada logo após F1, antes da F2):** baseline de paridade visual — suite Playwright captura goldens do front legado (deep-links pinados, 6 viewports × ~8 estados, fluxos read-only contra a API de produção) + characterization tests do `resize()` do modal. O porte inteiro compara contra esses goldens.
Porte das telas (galeria, viewer, login, upload, list/edição) para `apps/web` com SSR nas públicas, preservando deep-links `/gallery?...`. Inclui a feature de favoritas: campo no schema, filtro na API, toggle no upload/edição, galeria default "só favoritas" com toggle visível e empty-state com CTA (acervo migra todo não-favorito — decisão D3).

### F4. Modo teatro
**Escopo:** Medium | **Spec:** `features/04-modo-teatro/`
Slideshow fullscreen lento (estilo idle de smart TV), respeitando filtros ativos.

### F5. Tutorial interativo
**Escopo:** Medium | **Spec:** `features/05-tutorial-interativo/`
Tour de primeira visita com driver.js, bilíngue, reativável; cobre filtros, viewer, favoritas e modo teatro.

## Milestone 4 — Alcance

### F6. SEO e indexabilidade por IA
**Escopo:** Large | **Spec:** `features/06-seo/`
Página canônica por foto, meta/OG/JSON-LD `ImageObject`, sitemap de imagens dinâmico, robots.txt amigável a crawlers de IA, alt text, content-type correto no S3.

## Milestone 5 — Produção

### F7. Deploy & cutover no VPS
**Escopo:** Medium | **Spec:** `features/07-deploy-cutover/`
Docker Compose (api + web) + nginx + SSL no VPS; migração de envs; switch do yanlucas.com; arquivamento/remoção dos repos legados.

## Dependências

```
F1 ──> F3-Fase0 ──> F2 ──> F3 ──> F4 ──> F5
       (goldens)           │
                           └────> F6 ──> F7   (F7 também depende de F4/F5 se quiser cutover único)
```

A Fase 0 da F3 vem antes da F2 de propósito: captura o front legado intocado com os dados atuais; a F2 (API) não a afeta.

## Ideias futuras (fora do roadmap — STATE.md)

Fila assíncrona de upload, geografia/tags por referência, paginação por cursor, CDN para imagens, perfis de câmera declarativos.
