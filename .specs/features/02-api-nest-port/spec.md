# F2 — Porte da API para NestJS

**Status:** especificada | **Escopo:** Complex | **Depende de:** F1

## Objetivo

Reimplementar a API Express em `apps/api` (NestJS) com **paridade de contrato**: o front Vue legado apontado para a API nova funciona sem nenhuma alteração. Corrigir na passagem os bugs documentados (CONCERNS.md §1–8) sem mudar formato de request/response.

## Requisitos

### Estrutura
- **R1** — Módulos Nest: `AuthModule`, `ImagesModule`, `TagsModule`, `GeoModule` (countries/states/cities), `StorageModule` (S3), `GoogleModule` (Vision+Geocoding), `DatabaseModule` (Mongoose). Schemas Mongoose tipados reusando tipos de `@conteai/shared`.
- **R2** — Mesmas rotas, métodos, status codes e shapes de resposta da API legada (tabela em `.specs/codebase/STRUCTURE.md`). Inclui: `POST /tags/sync`, modo deep-link por `id` no `GET /images`, e o contrato `{ images, total }`.
- **R3** — Convenção de URLs preservada: keys relativas no banco, `setImagesUrl` (prefixo `BUCKET_URL`) na saída, strip de URL absoluta→key no `PATCH /images/:id`.
- **R4** — Pipeline de upload idêntico em comportamento: EXIF (perfis por câmera portados de `helpers/metadata.js`) → sharp (lazy 1/25+blur webp base64, thumbnail 1/10, optimized 1/3) → S3 → Vision (labels só na 1ª imagem; cores em todas; filtro por tags cadastradas) → Geocoding (se GPS) → rollback S3 em erro.

### Correções embutidas (sem quebrar contrato)
- **R5** — JWT com `expiresIn: '1h'` real (CONCERNS §1); response do login mantém `{ token, payload }` com `payload.exp` correto em segundos — guards do front legado continuam funcionando.
- **R6** — Validação: DTOs class-validator em todos os bodies; allowlist de campos filtráveis no `GET /images` (mata operator injection, CONCERNS §6); limites no upload (mimetype imagem, tamanho máx., qtd. máx. — valores no design).
- **R7** — `PATCH /images/:id` tolera `metadata` ausente (CONCERNS §3); 404 para ids inexistentes onde hoje é 500 — **exceção consciente de paridade** (front trata como erro igualmente).
- **R8** — EXIF lido do arquivo com `versionName === "Original"` (fallback: primeiro arquivo; dimensões via `sharp().metadata()` se EXIF não tiver) (CONCERNS §4).
- **R9** — Logger estruturado (nest-pino ou Logger nativo) sem logar hash de senha nem dumps de respostas Google (CONCERNS §5); throttle no `POST /authentication` (CONCERNS §7); 401 para token ausente/inválido com CORS configurável por env (CONCERNS §8) — *401 vs 403: front legado só checa "erro", paridade ok*.

### Verificação
- **R10** — Testes de contrato: suite que sobe a app Nest (mongodb-memory-server + S3/Google mockados) e valida shapes de resposta de todas as rotas contra fixtures gravadas da API legada.
- **R11** — Teste manual de aceitação: front Vue legado com `VUE_APP_API_URL` apontando para a Nest — login, galeria com filtros, deep-link, upload multi-versão, edição, delete.

## Critérios de aceite

1. Suite de contrato verde; `pnpm --filter api test` verde.
2. Checklist R11 executado com o acervo real (ambiente local com .env de produção de leitura ou banco clonado).
3. Nenhuma referência a código morto migrada (tensorFlow.js etc.).

## Fora de escopo

Campo favorite (F3), fila assíncrona, mudanças de modelo de dados, desligamento da API antiga (F7).
