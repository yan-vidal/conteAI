# F4 — Modo Teatro · Decisões de execução (Discuss)

Decisões tomadas por Yan em 2026-06-15 para as áreas que a `spec.md` deixou em aberto ("decidir no Specify de execução").

## D1 — Transição entre fotos (R3)

**Crossfade + Ken Burns sutil.** Fade suave entre as fotos somado a um zoom/pan bem lento em cada foto (efeito idle de smart TV). Intervalo default **~10s**.

**Aplicar:** respeitar `prefers-reduced-motion` desligando o Ken Burns (mantendo o crossfade) para acessibilidade.

## D2 — Overlay de info (R8)

**Visível e discreto, com entrada atrasada:** a localização/descrição da foto aparece com fade **~3s depois** que a foto entra (não imediatamente), em baixa opacidade, e some na transição para a próxima. É o oposto da UI de controle, que **some** após ~3s de inatividade.

## D3 — URL de acesso (R7)

**`/gallery?theater=true`.** A galeria continua dona do estado e dos filtros; o param só liga o overlay de teatro e reusa os filtros ativos direto. Sem rota dedicada.

## D4 — Componente de exibição (nota da spec §29 / CONCERNS §73)

**Componente dedicado novo** (`TheaterSlideshow`), NÃO extrair/reusar o `ModalViewerImage`. O viewer é sensível (cache, versões, touch, chrome, geometria recém-estabilizada) e o teatro precisa só de "imagem `optimized` em fullscreen com crossfade + Ken Burns + preload". Um componente leve dedicado é mais rápido e seguro; evita refatorar o componente frágil. A duplicação é mínima e aceita conscientemente.
