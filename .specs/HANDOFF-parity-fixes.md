# Handoff — Correções de paridade (F3 web port + F4 teatro)

**Criado em:** 2026-06-15 · **Para:** próximo agente que retomar.
**Origem:** teste manual do front novo apontando para a API de produção
(`NUXT_PUBLIC_API_URL=https://api.yanlucas.com pnpm --filter web dev`, porta 3001).
Yan encontrou as divergências abaixo entre o app novo (Nuxt) e o legado
(`yan-site-front-vue/`). **Nada disso foi corrigido ainda — só documentado.**

Branches: regressões #1–#5 são da **F3** (PR #2 `f3-web-nuxt → main`). O item #6 é
da **F4** (branch `f4-modo-teatro`, PR próprio). Este doc vive na base F3, então as
duas PRs o enxergam.

---

## ⚠️ Metodologia obrigatória (golden-driven) — leia antes de codar

Essas interações passaram batido na matriz visual da P10 porque os goldens só
capturaram estados **estáticos/carregados**, nunca as **interações** (date picker
aberto, menus do modal abertos, chrome revelado de forma estável, posições de
botões). **Para cada item abaixo, NÃO corrija no olho.** Siga:

1. **Capture o golden do legado da interação**: adicione um teste em
   `tests/visual/legacyBaseline.spec.ts` que executa a interação no app legado
   (ex.: abrir o date picker, clicar na localização) e tira o screenshot; gere o
   golden com `pnpm visual:legacy:update` (usa `playwright.legacy.config.ts`,
   app legado na 8080 contra a API de produção).
2. **Adicione o teste-espelho do app novo** em `tests/visual/webPort.spec.ts`
   (mesmo nome de snapshot, helpers em `tests/visual/web-port.helpers.ts`).
3. **Corrija o app novo** até o `pnpm visual:web` passar contra o golden do legado.
4. Rode os gates: `pnpm --filter web test|lint|typecheck` + Sentiness
   (`fast` pós-edit, `standard` pré-done). Ver skill `sentiness`.

Referência de comportamento do legado sempre em `yan-site-front-vue/src/`.

---

## #1 — Date picker da galeria não abre

- **Sintoma:** clicar no seletor de datas não faz nada.
- **Causa raiz:** no app novo o controle é só um botão estático sem handler —
  `apps/web/pages/gallery.vue` (`<v-btn class="bottom-pill date-pill">{{ $t("gallery.date") }}</v-btn>`,
  ~linha 213). Nunca foi ligado a um menu/date-picker. O filtro de data hoje só
  funciona via URL (`startDateOpen`/`endDateOpen` → `takenAtFrom`/`takenAtTo`).
- **Legado:** `yan-site-front-vue/src/views/GalleryView.vue:211-245` — um
  `v-menu` (`:close-on-content-click="false"`, `transition="slide-y-transition"`,
  `location="left"`, `max-width="100"`) com **activator** `v-select` (readonly,
  `clearable`, `v-bind="props"`, `v-model="dateRange"`) e dentro um
  `v-date-picker` (`range`, `:first-day-of-week="1"`, `multiple="2"`) com header
  custom (`dateHeaderText`). `selectedDate` é o range; ao confirmar, dispara o
  filtro por data.
- **Correção:** portar fielmente o `v-menu` + `v-date-picker` range, escrevendo
  em `startDateOpen`/`endDateOpen` e refazendo a busca (`refreshImages` +
  `replaceRouteQuery`). Manter o formato de data atual da query.
- **Golden a criar:** "gallery date picker open" (legado + web).

## #2 — Menus de localização e data (dentro do modal) não abrem

- **Sintoma:** ao abrir uma foto, clicar na **localização** e na **data** deveria
  abrir um menu/select com mais informações (links de Maps/Street View; detalhes
  da data). Não abre.
- **Novo:** os `v-menu` existem em `apps/web/components/ModalViewerImage.vue`
  (localização ~linha 81 com `data-testid="maps-link"`/`street-view-link`; data
  ~linha 157), mas só aparecem dentro do chrome revelado, cuja visibilidade está
  quebrada (ver #3). Verificar também se o activator está corretamente vinculado
  (`v-bind="props"` no botão de localização/data) — no legado a estrutura é
  `<v-menu location="top"><template #activator>…botão…</template>…conteúdo…</v-menu>`.
- **Legado:** `yan-site-front-vue/src/components/ModalViewerImage.vue:93-178`
  (localização, com `id="location-menu"`, `@click.stop`, links condicionais a
  `latitude/longitude` e `cameraTrueDirection`) e `:183-234` (data).
- **Causa raiz:** compartilhada com #3 (o chrome some). Corrigir #3 deve
  ressurgir os activators; depois validar que cada `v-menu` abre e mantém aberto
  (o `@click.stop` no conteúdo evita fechar ao interagir).
- **Golden a criar:** "modal location menu open" e "modal date menu open".

## #3 — Checkbox "ver sem efeito" e bolinhas seletoras de versão só piscam

- **Sintoma:** o botão de ver a foto sem edição (no canto **superior direito**) só
  aparece por milissegundos ao abrir a foto e some; idem (suspeita confirmada
  pela lógica) para as **bolinhas seletoras de versão** (canto **superior
  esquerdo**). No legado isso foi implementado manualmente para funcionar em
  conjunto com o resto.
- **Novo:** `apps/web/components/ModalViewerImage.vue` — `expandedPanelVisible`
  controla `v-if` do `.no-edit-checkbox` (`expandedPanelVisible && image.original`)
  e dos `.custom-delimiters` (`expandedPanelVisible && image.images.length > 1`).
  É ligado por `onStageOver` (mouseover→true) e desligado por `onStageLeave`
  (mouseleave→false, exceto se for para um `.v-overlay`). Esconde cedo demais.
- **Legado (mecanismo correto):**
  `yan-site-front-vue/src/components/ModalViewerImage.vue:530-600`
  (`toggleHoverExpansionPanel`). Regras-chave a replicar:
  - `mouseleave` → esconde **apenas** se `event.relatedTarget?.className === "v-overlay__scrim"`
    (ou seja, só quando o ponteiro vai para o backdrop). Sair para qualquer outro
    alvo (menus, EXIF) **mantém visível**.
  - `mouseover` (e `!touchInProgress`) → mostra.
  - touch: `touchstart/touchmove/touchend/touchcancel` com `maxTouchPoints`,
    detecção de swipe (next/prev por direção+duração vs `threshold`/
    `touchSwipeDuration`) e, sem swipe, **tap alterna** `expandedPanelVisible`
    com guarda `touchInProgress` (300ms). Listeners no legado:
    `@mouseover/@mouseleave` + `@touchstart.capture/@touchmove/@touchend/@touchcancel.capture`
    (linhas 10-15), todos filtrando por `event.target.className === "v-img__img v-img__img--cover"`.
- **Correção:** substituir `onStageOver/onStageLeave/handleTouchEnd` pela porta
  fiel de `toggleHoverExpansionPanel` (adaptando o seletor do alvo, já que o app
  novo usa `<img data-testid="modal-image">` e não `.v-img__img--cover`).
- **Golden a criar:** "modal chrome revealed (no-edit checkbox)" e "modal version
  delimiters revealed" capturando o estado **estável** pós-reveal (hoje
  `revealWebModalChrome` força hover; o golden do legado deve refletir o reveal
  real, persistente).

## #4 — Toggle de tema esmagado; filtros do desktop largos demais

- **Sintoma:** o switch claro/escuro fica espremido com os ícones de sol/lua se
  sobrepondo — mobile **e** desktop. No desktop, os filtros do legado são um
  pouco menos largos, sobrando espaço para o toggle respirar.
- **Novo:** `apps/web/pages/gallery.vue` — `.theme-switch-top`/`.theme-switch-wrapper`
  e `.filters` (grid `repeat(3, 1fr)`, ~linha 855). Falta a largura máxima e o
  espaçamento do legado.
- **Legado:** `GalleryView.vue:103-124` — wrapper do tema com
  `maxWidth: 100px`, `position: absolute`, `right: 0` (≥960px) / `10px`,
  `class="d-flex align-center justify-space-between"`, ícones `size="15"`, switch
  com `class="switch-margin"`. Filtros-top em `v-col` com `cols=3/4/3` no desktop
  (`GalleryView.vue:4,37,70`), deixando espaço para o tema (`cols=3`, absoluto).
- **Correção:** dar `max-width`/`justify-content: space-between` ao wrapper do
  tema e reduzir a largura dos filtros no desktop para reproduzir as proporções
  do legado.
- **Golden a criar:** já coberto pelos goldens estáticos da galeria — recapturar/
  ajustar `gallery-default-*` se a proporção mudar (cuidado: o botão de teatro da
  F4 é mascarado nesses estados).

## #5 — Botões de navegação/rotação do modal: posição

- **Sintoma:** os botões de navegação (prev/next) e rotação dentro da foto aberta
  devem ficar um pouco **mais para baixo** e **mais próximos** um do outro, como
  no legado.
- **Novo:** `apps/web/pages/gallery.vue` — `.nav-buttons` (`bottom: 30px`,
  `gap: 8px`, ~linha 1068) e `.nav-button`.
- **Legado:** comparar com o posicionamento dos botões de navegação/rotação em
  `yan-site-front-vue/src/components/ModalViewerImage.vue` (e CSS do modal).
  Ajustar `bottom`/`gap` para bater.
- **Golden a criar:** "modal nav buttons" capturando a barra de navegação sobre a
  foto (legado + web).

## #6 — Modo teatro (F4): barra de rolagem inútil + não avança

- **Sintoma:** o modo teatro mostra uma barra de rolagem lateral que não faz nada;
  e está "travado", não vai para a próxima imagem.
- **Estado atual:** a T1 da F4 entregou só o **ciclo de vida** (entrar/sair,
  fullscreen, URL). O avanço automático com crossfade + Ken Burns é a **T4**
  (ainda não implementada) — por isso "não avança" é esperado por ora.
- **Bug real (scrollbar):** o overlay `apps/web/components/TheaterMode.vue` é
  `position: fixed; inset: 0`, mas a **galeria por baixo** continua com seu scroll
  (página longa), deixando a barra lateral visível. **Corrigir** travando o scroll
  do `body`/`html` enquanto o teatro está ativo (ex.: classe com `overflow: hidden`
  aplicada/removida em `enterTheater`/`exitTheater` e no watch de `route.query.theater`),
  e garantir que o overlay não role.
- **Restante:** T3 (shuffle/loop/preload), T4 (slideshow crossfade+Ken Burns ~10s),
  T5 (controles auto-ocultos + overlay de info com fade ~3s após a foto). Ver
  `.specs/features/04-modo-teatro/tasks.md` e `context.md`.
- **Golden a criar:** "theater mode" (estado estável da 1ª foto) sem scrollbar.

---

## Resumo do que falta (checklist)

- [ ] #1 Date picker da galeria (F3) — portar `v-menu`+`v-date-picker` do legado.
- [ ] #2 Menus de localização/data no modal (F3) — depende de #3.
- [ ] #3 Visibilidade do chrome do modal (F3) — portar `toggleHoverExpansionPanel`.
- [ ] #4 Toggle de tema + largura dos filtros (F3).
- [ ] #5 Posição dos botões nav/rotação do modal (F3).
- [ ] #6 Scroll-lock do modo teatro (F4) + seguir T3–T6.

Cada item: **golden do legado primeiro**, depois espelho web, depois correção, depois gates.
