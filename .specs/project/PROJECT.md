# Yan Lucas — Galeria de Fotografia (yanlucas.com)

**Visão:** Evoluir o site de fotografias yanlucas.com de dois repos JS separados para um monorepo TypeScript moderno, com API NestJS, experiência de visitante mais rica (tutorial interativo, modo teatro) e fotos indexáveis no Google Imagens e utilizáveis por IAs.
**Para:** visitantes da galeria pública e o próprio autor (Yan) como único usuário admin (upload/curadoria).
**Resolve:** o site atual funciona, mas é invisível para buscadores (SPA sem SEO), tem stack envelhecida (Vue CLI, Vuetify beta, Express JS puro, zero testes) e mostra o acervo inteiro em vez de destacar as melhores fotos.

## Goals

- Monorepo TypeScript unificado com tooling compartilhado; CI com lint+typecheck+test+build verdes.
- API portada para NestJS com paridade de contrato com a API Express atual (galeria atual continua funcionando durante a transição).
- Fotos marcadas como favoritas pelo autor são o padrão da galeria; acervo completo acessível por toggle.
- Modo teatro: slideshow fullscreen lento (estilo idle de smart TV) acessível da galeria.
- Tutorial interativo de primeira visita ensinando filtros, viewer, gestos e atalhos.
- SEO: fotos aparecendo no Google Imagens, buscáveis pela descrição, com dados estruturados consumíveis por crawlers de IA (sitemap de imagens + JSON-LD + meta/OG + render server-side).

## Tech Stack

**Atual (documentado em `.specs/codebase/`):**
- API: Express 4 + Mongoose 8 (MongoDB/DocumentDB) + S3 + sharp + Google Vision/Geocoding, JS CommonJS
- Front: Vue 3 (Options API) + Vuetify 3 beta + Vuex 4 + Vue CLI, JS

**Alvo (decidido em 2026-06-11):**
- Monorepo: pnpm workspaces, TypeScript estrito, repo git novo na raiz `conteai/` (legados ignorados e removidos no cutover)
- API: NestJS + Mongoose (mantém MongoDB e contratos) — `apps/api`
- Front: Nuxt 3 híbrido (SSR/ISR público, client-side admin) + Vuetify 3 estável + Pinia + @nuxtjs/i18n (pt-BR/en) — `apps/web`
- Compartilhado: `packages/shared` (tipos/contratos)
- Testes: Vitest + Playwright; CI GitHub Actions
- Deploy: VPS/EC2 próprio (Docker Compose + nginx)

**Dependências críticas:** sharp, exifreader, @aws-sdk/client-s3, Google Vision/Geocoding APIs, Vuetify.

## Scope

**v1 inclui:**
- Scaffolding do monorepo (workspaces, TS, lint/format/test compartilhados, CI)
- Porte completo da API para NestJS (mesmas rotas/contratos) corrigindo bugs documentados em CONCERNS.md (JWT exp, validação de entrada, `res` fora de escopo, etc.)
- Campo `favorite` no schema Image + filtro na API + toggle no upload/edição + galeria default "só favoritas"
- Modo teatro (fullscreen, transições lentas, ordem a definir, idle-friendly)
- Tutorial interativo no frontend (primeira visita + reativável)
- Fundação SEO: render server-side ou prerender das páginas públicas, meta/OG/JSON-LD `ImageObject` por foto, sitemap de imagens, robots.txt amigável a crawlers de IA, alt text a partir das descrições

**Explicitamente fora de escopo (por ora):**
- Multi-usuário/roles, contas públicas, comentários, likes de visitantes
- Apps mobile
- Mudança de banco (MongoDB permanece) ou de storage (S3 permanece)
- Reprocessamento do acervo de imagens existente no S3
- Fila assíncrona de upload (registrada como ideia futura em STATE.md)

## Constraints

- Projeto pessoal, sem prazo rígido; produção em yanlucas.com já no ar — migração não pode quebrar URLs públicas existentes (`/gallery` com query params de deep-link são compartilhados externamente).
- Dados de produção existentes: fotos sem o campo `favorite` precisam de default na migração.
- Custo: serviços atuais (S3, Google APIs) devem permanecer no free tier/baixo custo.
