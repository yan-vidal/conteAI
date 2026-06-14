# F2 — Aceitação do porte da API NestJS

**Data:** 2026-06-14
**Escopo:** Complex · todas as tarefas T1–T16 concluídas
**Branch:** `f3-visual-baseline` (a F3 Fase 0 e a F2 compartilham esta branch)

## Resultado dos gates (Node 26)

| Gate | Comando | Resultado |
| --- | --- | --- |
| Lint | `pnpm lint` | OK (Biome 93 arquivos + ESLint `apps/web`) |
| Typecheck | `pnpm typecheck` | OK (`apps/api`, `apps/web`, `packages/shared`) |
| Testes | `pnpm test` | OK — 21 arquivos, **77 testes** |
| Build | `pnpm build` | OK (`apps/web` Nuxt + `apps/api` tsc) |
| Sentiness | `pnpm exec sentiness check --tier=standard --trigger=pre-done` | `status: ok` (baseline aplicado) |

Os e2e da API usam Supertest (socket local) e `mongodb-memory-server`; precisam rodar fora da sandbox restrita (`listen EPERM` caso contrário).

## Ambiente de teste

- **Mongo:** `mongodb-memory-server` por suite (isolado), via `createApiTestApp`.
- **S3:** `aws-sdk-client-mock` intercepta o `S3Client` (nenhuma chamada AWS real).
- **Google Vision/Geocoding:** override do provider `HTTP_CLIENT` com mocks (`vi.fn`).
- **EXIF/derivativos:** `exifreader` + `sharp` reais sobre buffers gerados em teste.
- Env semeado em `apps/api/test/support/api-test-env.ts` (`BUCKET_URL=https://cdn.test`, etc.).

## Cobertura por rota (todas as rotas legadas portadas)

`POST /authentication`; `GET/POST/PATCH/DELETE /countries|/states|/cities|/tags`; `POST /tags/sync`; `GET /images` (filtros + deep-link); `PATCH /images/:id`; `DELETE /images/:id`; `POST /images` (upload multipart). `GET /health` mantido.

## Exceções de contrato conscientemente aceitas (aprovadas na spec F2)

1. **JWT exp corrigido** — `expiresIn: "1h"` em vez do bug legado `exp * 100000` (R5).
2. **401 em rotas protegidas** — guard responde 401 a token ausente/inválido (legado usava 403).
3. **404 para id inexistente** — PATCH/DELETE de imagem, deep-link `id` fora do conjunto, e PATCH/DELETE de geo/tags (legado lançava → 500). O front legado nunca exercita esses caminhos (sempre envia ids válidos).
4. **Injeção de operador Mongo eliminada** — `GET /images` valida um allowlist (DTO `whitelist + forbidNonWhitelisted`, valores coagidos a string), substituindo o `metadata.${key}` dinâmico do legado.
5. **PATCH sem `metadata`** — corrige o crash legado (`metadata.takenAt` quando `metadata` ausente); só `metadata.takenAt` é atualizado.
6. **EXIF do arquivo `Original`** — upload extrai EXIF da versão nomeada `Original` (fallback ao primeiro arquivo), não sempre do `files[0]` (R8).
7. **Fallback de dimensões** — sem dimensões no EXIF, usa `sharp().metadata()` antes de falhar.
8. **Geocoding resiliente** — retorna `{}` em vez de lançar quando não há resultados (upload não falha por isso).
9. **Sem log de payloads externos** — Vision/Geocoding não logam respostas (limpeza do CONCERNS §log).

## Invariantes preservados

- Resposta da listagem exatamente `{ images, total }`; default offset 0 / limit 10.
- Deep-links `/gallery?...` por `id` expandem o limit a partir de offset 0.
- Ordenação default fica a cargo do front (legado só ordena com `sort && order`); a API não impõe sort implícito.
- Keys S3 relativas no banco; URLs absolutas (`BUCKET_URL`) na saída; strip no PATCH.
- `files[i] ↔ versionNames[i]` por índice no upload.
- Rota de login `/authentication` e shape `{ token, payload }` preservados.

## Código morto NÃO migrado

`services/tensorFlow.js`, `AboutView.vue` e demais itens do CONCERNS.md não foram portados.

## Smoke do front legado (MANUAL — pendente de infra real)

Não executável na sandbox (exige Mongo/S3/Google reais + os dois apps rodando). Checklist para o Yan validar antes do cutover (F7), rodando o Vue legado com `VUE_APP_API_URL` apontando para a API Nest:

- [ ] Login em `/secretdoor`.
- [ ] Galeria pública e filtros (tags, país/estado/cidade, datas, metadata).
- [ ] Deep-link `/gallery?id=...` abre a foto correta no modal.
- [ ] Upload multi-versão (Original + edições) com EXIF/derivativos/Vision/Geocoding.
- [ ] Edição (incl. PATCH sem metadata) e exclusão (limpeza de keys no S3).

## Dependências adicionadas/removidas nesta feature

- Adicionadas (T1, runtime): Mongoose/Nest stack, `bcrypt`, `@nestjs/jwt`, `@nestjs/throttler`, `@aws-sdk/client-s3`, `axios`, `exifreader`, `sharp`, `multer`, `class-validator`/`class-transformer`.
- Removidas na T16 (não utilizadas): `nock`, `@types/multer`.

## Nota de dogfooding (Sentiness)

O baseline (`.sentiness/baseline.json`) estava vazio; foi reinicializado (`sentiness baseline init`) com decisão do Yan. Suprime 25 achados pré-existentes do knip que são falsos-positivos no monorepo: deps do Nuxt em `apps/web` (`vuetify`, `@mdi/font`, `sass`, `vue-tsc`), `multer` (usado via `FilesInterceptor`, sem import direto), os pacotes `@sentiness/check-*` (invocados pela CLI) e `eslint` (cross-workspace), além de exports de schema/fixtures de scaffolding. `newInDiff` limpo — a F2 não introduziu nenhuma violação nova. Reportado ao repo Sentiness: https://github.com/Arateki/Sentiness/issues/7 (knip flaga os próprios `@sentiness/check-*` e `eslint` out of the box; + precisa de config para Nuxt e deps invocadas dinamicamente).
