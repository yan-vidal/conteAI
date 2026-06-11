# F3 — Frontend Nuxt (porte) + Favoritas por padrão

**Status:** especificada | **Escopo:** Complex | **Depende de:** F2

## Objetivo

Portar a SPA Vue para `apps/web` (Nuxt 3, SSR nas páginas públicas) preservando todas as funcionalidades e deep-links, e introduzir a feature de favoritas com a galeria default "só favoritas".

## Fase 0 — Baseline de paridade visual

**Executar logo após F1 e antes da F2** (só precisa do repo para commitar goldens; aproveita o front legado intocado e os dados atuais). Decisão de 2026-06-11: o porte é dirigido por regressão visual contra goldens do front legado + characterization tests da matemática do modal.

- **RV1** — Suite de captura Playwright rodando contra o front legado (`npm run serve` local, apontado para a API de produção, **somente fluxos de leitura** — nunca upload/edição/delete contra prod), dirigida por deep-links pinados (IDs de fotos estáveis cobrindo: paisagem, retrato, multi-versão, descrição longa, com e sem GPS). Goldens commitados em `tests/visual/goldens/`; IDs pinados e data de captura documentados no repo. **As fotos pinadas não podem ser editadas durante o porte.**
- **RV2** — Matriz de captura: viewports 360×800, 390×844, 844×390 (landscape mobile — exercita rotação), 768×1024, 1366×768, 1920×1080 × estados: galeria default (dark e light), galeria filtrada, modal foto paisagem, modal foto retrato, modal painel EXIF expandido, modal rotacionado, modal multi-versão (delimiters visíveis); login e `/list` com cobertura leve. ≈ 50–70 goldens.
- **RV3** — Determinismo: `animations: 'disabled'` (congela marquee de localização, transições de carrossel, spinners), espera explícita de todas as imagens completas (lazy-blur já substituído), tema fixado via `addInitScript` no storage (`vuex` no legado / Pinia no novo), `deviceScaleFactor` fixo, e **captura e comparação sempre no mesmo container Docker oficial do Playwright** (rendering de fonte varia entre máquinas e contamina diffs).
- **RV4** — Characterization tests do `resize()` do `ModalViewerImage` (a parte com regras complexas por tela): extrair a lógica legada como função pura, alimentar matriz de entradas (proporção da foto paisagem/retrato/quadrada × tamanhos de tela 360→1920 × `isRotated` true/false) e gravar as saídas do código **legado** como golden de unidade. A implementação nova deve reproduzir os valores exatos. Screenshots amostram; esta suite **prova** os branches.
- **RV5** — Regras de comparação durante o porte: `expect(page).toHaveScreenshot()` resolvendo para os goldens da captura (`snapshotPathTemplate`), `maxDiffPixelRatio` calibrado (~1–2% — Vuetify beta→estável diverge por construção em paddings/sombras), `mask:` nos elementos intencionalmente novos (toggle favoritas, botão teatro, "?" do tutorial) e comparação por região (grid, modal) onde houver chrome novo. Todo diff é revisado visualmente pelo agente antes de aceitar/corrigir — nunca atualizar golden para silenciar diferença não compreendida.
- **RV6** — Quando a F3 entrar em execução, registrar a suite no Sentiness via `@sentiness/check-playwright` (tier slow): os paths de screenshot/diff entram em `Finding.references` e o agente os inspeciona com visão (protocolo da skill, seção 8).

**Limite conhecido:** o WebKit do Playwright não reproduz os bugs do Safari iOS real (workarounds de orientação do legado) — spot-check no iPhone do Yan permanece como gate de cutover (F7-R5b).

## Requisitos — Porte

- **R1** — Rotas equivalentes: `/` → redirect `/gallery`; `/gallery` (pública, SSR); `/secretdoor` (login); `/upload` e `/list` (client-only, middleware de auth por token Pinia persistido). Deep-links `/gallery?id=...&version=...&city=...` etc. continuam funcionando idênticos (URLs já compartilhadas não podem quebrar).
- **R2** — GalleryView portada: filtros em cascata country/state/city, tags, range de datas, infinite scroll, sync de estado com a URL, tema claro/escuro (cores atuais), i18n nas strings. **Ordenação default preservada: `metadata.takenAt desc`** — o modo deep-link por `id` calcula a página a partir dela; mudar a ordenação quebraria links antigos.
- **R3** — ModalViewerImage portada: carrossel de versões, toggle original, painel EXIF, paleta com copy-hex, links Maps/Street View, teclado e gestos touch (preservar workarounds iOS documentados), cache de imagens.
- **R4** — Upload e List/Edit portados (client-only): multi-arquivo com versionNames, checkbox Original, edição completa, delete com confirmação.
- **R5** — `$fetch`/composable de API tipado com `@conteai/shared`, token via Pinia (persistência localStorage), baseURL por `NUXT_PUBLIC_API_URL`.
- **R6** — Estrutura preparada para F6: página da galeria renderiza no servidor a primeira página de imagens (`useAsyncData`), com `<img>`/alt reais no HTML.

## Requisitos — Favoritas

- **R7** — Schema: `favorite: { type: Boolean, default: false }` em `Image`; acervo existente fica não-favorito (decisão D3 — sem migração de dados; ausência ≡ false em filtro e exibição).
- **R8** — API (`apps/api`): `GET /images?favorite=true|false` filtra (`true` → `{ favorite: true }`; ausente → sem filtro); `POST /images` aceita `favorite` no body; `PATCH /images/:id` permite alterar. Tipos atualizados em shared + testes.
- **R9** — Galeria pública: default **só favoritas**, com toggle proeminente (chip/switch "Favoritas ★ / Todas") sincronizado na URL (`?all=true` ou similar — deep-links antigos sem o param caem no default novo). Sem fallback silencioso: galeria sem favoritas mostra empty-state com CTA "ver todas as fotos".
- **R10** — Upload: checkbox "Favorita" (default a confirmar no Specify de execução; sugestão: marcado). Edição (`/list`): toggle favorita visível na linha e no modal.
- **R11** — Modo deep-link por `id` ignora o filtro de favoritas se a foto alvo não for favorita (link compartilhado de qualquer foto sempre abre). Para manter grid e modal consistentes, nesse caso o front entra com o toggle em "Todas" (e a URL reflete isso) — nunca exibir um modal de foto que o grid atrás "não contém".

## Critérios de aceite

0. (Fase 0) Goldens capturados e commitados com IDs/data documentados; suite de characterization do `resize()` verde contra a própria implementação legada (sanity) antes de qualquer porte.
1. Paridade visual contra os goldens da Fase 0 na matriz completa de viewports (diffs restantes revisados e aceitos conscientemente, com masks documentadas) + checklist funcional lado a lado.
2. Deep-link real antigo (URL com `id`+filtros) abre o modal correto na app nova.
3. `curl` na `/gallery` retorna HTML com `<img>` das fotos da primeira página (SSR real).
4. Galeria default mostra só favoritas; toggle revela tudo; foto não-favorita via link direto abre normalmente.
5. Testes: componentes críticos (galeria, viewer, toggle favoritas) com Vitest; fluxo público com Playwright.

## Fora de escopo

Modo teatro (F4), tutorial (F5), JSON-LD/sitemap (F6), desligamento do front antigo (F7).
