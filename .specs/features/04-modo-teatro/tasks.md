# F4 — Modo Teatro · Tarefas

Escopo: Medium. Depende de F3 (galeria + favoritas, já mergeada no PR #2).
Decisões de execução em `context.md` (D1 crossfade+Ken Burns ~10s, D2 overlay de info com fade ~3s após a foto, D3 `/gallery?theater=true`, D4 componente dedicado novo).

Convenções (de F3): componente em `apps/web/components`, página é `apps/web/pages/gallery.vue`, i18n em `apps/web/i18n/locales/{en,pt-BR}.json`, browser globals prefixados com `globalThis.`, testes Vitest em `apps/web/test` (ambiente `nuxt`). Gate por tarefa: `pnpm --filter web test`, `pnpm --filter web lint`, `pnpm --filter web typecheck` + Sentiness fast `ok`.

---

## T1 — Estado do teatro + ciclo de vida na galeria (R1, R2, R7, AC4)
**O que:** `theater=true` em `/gallery` ativa o overlay de teatro (`TheaterMode`). Captura os itens do **filtro ativo** (default favoritas; se vazio, usa todas — R2). Entrar dispara a Fullscreen API; sair por Esc, botão discreto, back do browser ou `fullscreenchange` remove `theater=true` e **restaura exatamente o estado anterior** da galeria (filtros, scroll, modal fechado — AC4). Botão de entrada (ícone play/teatro) visível na galeria. i18n e tema respeitados.
**Depende de:** F3.
**Reusa:** estado/filtros de `gallery.vue`, `useApi`, store de tema/locale.
**Done when:** `/gallery?theater=true` entra em fullscreen exibindo só as fotos do filtro; Esc e back restauram a galeria sem perda de estado.
**Commit:** `feat(web): theater mode entry, url state and lifecycle`
- [x] concluída em 2026-06-15. `TheaterMode.vue` (overlay fullscreen, exibe a 1ª foto do filtro — slideshow é a T4) + integração em `gallery.vue`: FAB `enter-theater` (oculto com modal/teatro aberto), `enterTheater` pede Fullscreen API dentro do gesto + `theater=true` na URL, `exitTheater` sai do fullscreen e remove o param, watch de `route.query.theater` p/ back/forward, `fullscreenchange` mapeia Esc → saída; fallback p/ todas quando o filtro é vazio (R2); galeria permanece montada por baixo (restauração grátis, AC4). Botão é elemento novo → mascarado nos 3 estados de galeria do `webPort.spec.ts` (RV5). i18n `theater.{enter,exit}`. Verificado: `pnpm --filter web test` (22), `lint`, `typecheck`, visual desktop 11/11, Sentiness fast `ok`.

## T2 — Screen Wake Lock (R6, AC3)
**O que:** adquirir `globalThis.navigator.wakeLock.request("screen")` ao entrar no teatro; reativar em `visibilitychange` ao voltar do background; liberar ao sair. Degradar graciosamente onde a API não existe (sem erro).
**Depende de:** T1.
**Done when:** a tela não apaga durante 5+ min de exibição (onde há suporte) e o lock é liberado na saída.
**Commit:** `feat(web): keep screen awake during theater mode`
- [ ] pendente

## T3 — Pipeline de origem das imagens (R4, R5, AC2)
**O que:** ordem **embaralhada por sessão** (seed por sessão; revisitar não repete a mesma sequência); **loop infinito** com paginação transparente contra a API ao avançar; **pré-carregar** a próxima imagem `optimized` antes da transição (sem flash de loading).
**Depende de:** T1.
**Done when:** avança em loop sem flash de loading em conexão normal; busca novas páginas sob demanda sem interromper a exibição.
**Commit:** `feat(web): theater image source with shuffle, loop and preload`
- [ ] pendente

## T4 — Componente `TheaterSlideshow` dedicado (R3, R4, D1, D4)
**O que:** componente novo de exibição fullscreen (sem reusar `ModalViewerImage`): imagem `optimized`, **crossfade** suave + **Ken Burns sutil** (zoom/pan lento por foto), intervalo default ~10s. Respeita `prefers-reduced-motion` (desliga Ken Burns, mantém crossfade).
**Depende de:** T3.
**Done when:** as fotos trocam sozinhas com crossfade + Ken Burns, sem controles visíveis durante a exibição; reduced-motion desliga o movimento.
**Commit:** `feat(web): dedicated theater slideshow component`
- [ ] pendente

## T5 — Controles auto-ocultos + overlay de info (R3, R8, D2)
**O que:** UI de controle (botão sair discreto) **some após ~3s** de inatividade e reaparece ao mover o mouse/tocar; overlay de info discreto (localização/descrição) que **aparece com fade ~3s após** cada foto entrar (D2) e some na transição; baixa opacidade.
**Depende de:** T4.
**Done when:** controles auto-ocultam e voltam na interação; a info aparece 3s após a foto e some na troca.
**Commit:** `feat(web): theater controls auto-hide and info overlay`
- [ ] pendente

## T6 — Testes + aceitação (R1–R8, AC1–4)
**O que:** Vitest do estado/lifecycle (toggle por query, restauração no Esc/back, shuffle determinístico por seed, seleção da fonte pelo filtro + fallback p/ todas, preload da próxima); teste de interação do auto-hide dos controles e do timing do overlay; (se viável) 1 golden visual do estado de teatro em `webPort.spec.ts`. Rodar Sentiness slow; escrever `acceptance.md` + handoff para F5.
**Depende de:** T1–T5.
**Done when:** critérios AC1–4 da spec atendidos; gates (test/lint/typecheck + Sentiness) verdes; handoff para F5 (tutorial interativo, que cobre o modo teatro).
**Commit:** `docs: record theater mode acceptance`
- [ ] pendente
