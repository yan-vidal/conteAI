# Infraestrutura de Testes

## Estado atual

**Não existe nenhum teste em nenhum dos dois projetos.** Sem framework instalado, sem diretórios de teste, sem CI. O único comando de verificação existente é `npm run lint` no frontend (ESLint com regras mínimas `vue3-essential`).

## Frameworks

**Unit/Integration:** nenhum
**E2E:** nenhum
**Coverage:** nenhum

## Comandos de verificação disponíveis hoje

| Projeto | Comando | O que verifica |
|---|---|---|
| yan-site-front-vue | `npm run lint` | ESLint essencial |
| yan-site-front-vue | `npm run build` | build webpack compila |
| yan-site-api-node | `node index.js` | apenas que o entrypoint carrega (exige .env) |

## Matriz de cobertura (estado atual)

| Camada | Tipo de teste exigido | Localização | Comando |
|---|---|---|---|
| API routes/use-cases | none (inexistente) | — | — |
| Models Mongoose | none | — | — |
| Componentes Vue | none | — | — |
| E2E galeria | none | — | — |

## Avaliação de paralelismo

Não aplicável — não há testes.

## Gate checks

| Nível | Quando usar | Comando |
|---|---|---|
| Quick | hoje | `cd yan-site-front-vue && npm run lint` |
| Build | hoje | `cd yan-site-front-vue && npm run build` |

## Recomendações para o monorepo (a definir na fase de design)

- **Test runner:** Vitest único para todos os packages (compatível com Nest via SWC e com Vue/Vite nativamente).
- **API NestJS:** unit tests por service/use-case com mocks; integração com `mongodb-memory-server` ou Testcontainers (paralelo-seguro com DB por teste). Supertest para e2e dos controllers.
- **Mocks de externos:** S3 (aws-sdk-client-mock), Google Vision/Geocoding (nock/msw) — nunca bater nas APIs reais em teste.
- **Frontend:** Vue Test Utils + Vitest para componentes críticos (galeria, viewer, tutorial); Playwright para e2e dos fluxos públicos (galeria, modo teatro, deep-links).
- **Paridade visual do porte (decidido 2026-06-11):** goldens do front legado capturados via Playwright (Fase 0 da F3) + characterization tests do `resize()` do modal; o front novo compara contra os goldens durante todo o porte. Detalhes: F3 spec §Fase 0.
- **Gates do monorepo:** `lint` + `typecheck` + `test` + `build` orquestrados pela ferramenta de workspace (turbo/nx/pnpm -r) e exigidos em CI.
- A porta Express→Nest deve ser coberta por testes de contrato (mesmas respostas para mesmas requests) antes de desligar a API antiga — os fluxos de upload/edição têm convenções sutis (URLs relativas↔absolutas, versionNames por índice) fáceis de quebrar.
