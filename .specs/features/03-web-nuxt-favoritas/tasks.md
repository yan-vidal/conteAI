# F3 — Tasks

Status: [ ] pendente · [x] concluida. Esta lista cobre somente a **Fase 0**. O porte Nuxt completo deve ganhar nova quebra de tarefas depois que os goldens estiverem commitados.

## T0 — Fixar dataset visual e contrato de captura
**O que:** documentar endpoint legado (`VUE_APP_API_URL=https://api.yanlucas.com`), data da captura, matriz de viewports, estados visuais e fotos pinadas. Usar somente rotas publicas/read-only do legado.  
**Cobre:** RV1, RV2, RV3  
**Done when:** `tests/visual/legacy-baseline.md` lista IDs, URLs, viewports e regras de nao editar fotos pinadas.  
**Depende de:** F1  
- [x]

## T1 — Extrair e caracterizar `resize()` do modal legado
**O que:** criar uma funcao pura com a matematica de `ModalViewerImage.resize()` e uma suite Vitest com matriz paisagem/retrato/quadrada x telas 360-1920 x `isRotated` true/false. A suite grava os valores esperados do legado como fixture versionada.  
**Cobre:** RV4  
**Done when:** `pnpm test -- tests/legacy-resize` ou comando equivalente passa e prova a fixture contra a implementacao pura.  
**Depende de:** T0  
- [x]

## T2 — Adicionar infraestrutura Playwright para baseline legado
**O que:** adicionar `@playwright/test`, config dedicada, helpers para subir o Vue CLI legado com `VUE_APP_API_URL=https://api.yanlucas.com`, fixtures de viewports, estado Vuex de tema e esperas deterministicas de imagens.  
**Cobre:** RV1, RV2, RV3  
**Done when:** a suite consegue abrir `/gallery` do legado local e esperar o grid carregar sem executar upload/edicao/delete.  
**Depende de:** T0  
- [x]

## T3 — Capturar goldens da matriz visual
**O que:** capturar screenshots do legado em `tests/visual/goldens/legacy/` para viewports 360x800, 390x844, 844x390, 768x1024, 1366x768 e 1920x1080 nos estados: galeria default dark/light, galeria filtrada, modal paisagem, modal retrato, painel EXIF expandido, rotacionado, multi-versao, login e `/list` bloqueada/redirecionada.  
**Cobre:** RV1, RV2, RV3, RV5  
**Done when:** goldens sao gerados e revisados visualmente; IDs/data ficam documentados em `tests/visual/legacy-baseline.md`.  
**Depende de:** T1, T2  
- [x]

## T4 — Integrar comandos e Sentiness slow
**O que:** adicionar scripts de captura/comparacao ao `package.json` raiz e, se o check existir/publicado, registrar o Playwright no Sentiness tier slow sem tornar o CI padrao bloqueante.  
**Cobre:** RV6  
**Done when:** comandos documentados rodam localmente; Sentiness standard continua verde; slow fica disponivel para execucao manual/background.  
**Depende de:** T3  
- [x]

## Dataset inicial aprovado

Endpoint: `https://api.yanlucas.com`

## Observacoes de execucao

- 2026-06-12: durante a primeira tentativa, a galeria ficou bloqueada por instabilidade externa da API/DNS. O trace do Chromium registrou `net::ERR_NAME_NOT_RESOLVED` para `countries`, `states`, `cities`, `tags` e `images`; os goldens so foram gerados depois da API voltar.
- 2026-06-12: a API voltou a resolver sem override; preflight externo para `countries` e `images` retornou HTTP 200 de forma consistente. A captura final usa `https://api.yanlucas.com` diretamente.
- 2026-06-12: `pnpm visual:legacy` passou com 78 testes em 7.1 min. Foram gerados 66 goldens em `tests/visual/goldens/legacy/` (11 estados x 6 viewports). Os testes esperam spinners visiveis sumirem antes de screenshot para nao versionar placeholders.
- 2026-06-12: links diretos de foto continuam carregando o grupo de imagens ao redor para preservar navegacao por seta/gestos. O estado rotacionado e capturado de um modal interativo ja hidratado para isolar o layout rotacionado.

IDs candidatos consultados em 2026-06-11:

- Paisagem com GPS: `68ab9c4b992f13858f306ad5` — Japan / Osaka / Museum.
- Retrato com GPS: `68ab9be2992f13858f306a91` — Japan / Osaka / Night / Art / Museum.
- Multi-versao com GPS: `67b7eb60084f9f0679bb2b17` — Japan / Tokyo / Minato City / Night / Skyscraper, `version=1..3`.
- Descricao longa com GPS: `670f6341b6130f8f74278a0d` — Japan / Tokyo / Taito / Sensō-ji.
- Descricao longa sem GPS: `66ee7b0c2e06e822f24eba66` — Brazil / Bahia / Lençóis / Chapada Diamantina.
- Somente original: `66ee7a262e06e822f24eb968` — Brazil / Bahia / Lençóis / landscape original-only.

Filtros candidatos:

- `/gallery?country=Japan&state=Tokyo&city=Taito&tag=Temple`
- `/gallery?country=Brazil&state=Bahia&city=Lençóis&tag=Landscape`
- `/gallery?id=67b7eb60084f9f0679bb2b17&version=1`
