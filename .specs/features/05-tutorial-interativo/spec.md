# F5 — Tutorial Interativo

**Status:** especificada | **Escopo:** Medium | **Depende de:** F4 (cobre o modo teatro)

## Objetivo

Tour guiado que ensina visitantes de primeira viagem a usar a galeria.

## Requisitos

- **R1** — Biblioteca: driver.js (decisão D4). Conteúdo bilíngue via i18n (pt-BR/en).
- **R2** — Dispara automaticamente na primeira visita à galeria (flag em localStorage via Pinia persistido), após o primeiro carregamento de imagens; nunca repete sozinho.
- **R3** — Reativável a qualquer momento por botão discreto ("?" no canto da galeria).
- **R4** — Passos mínimos: (1) filtros país/estado/cidade em cascata; (2) tags e datas; (3) toggle favoritas/todas; (4) clicar numa foto abre o viewer; (5) dentro do viewer: versões editadas vs original, painel EXIF, paleta de cores; (6) navegação por teclado/gestos; (7) modo teatro; (8) compartilhamento por URL.
- **R5** — Passo do viewer abre um exemplo real (primeira foto da galeria) — tour interage com o estado da app, não só aponta para elementos.
- **R6** — Adaptativo a touch vs desktop: textos de gestos para mobile, atalhos de teclado para desktop.
- **R7** — Pulável a qualquer momento (X / "pular tour"); pular marca como visto.

## Critérios de aceite

1. Primeira visita (localStorage limpo) inicia o tour; reload não repete.
2. Tour completo executável em pt-BR e en, mobile e desktop.
3. Botão "?" reinicia o tour do zero.
4. Teste Playwright cobrindo o fluxo de primeira visita.
