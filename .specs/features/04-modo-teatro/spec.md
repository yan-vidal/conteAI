# F4 — Modo Teatro

**Status:** especificada | **Escopo:** Medium | **Depende de:** F3

## Objetivo

Slideshow fullscreen das fotos, lento e contemplativo, no estilo do idle das smart TVs.

## Requisitos

- **R1** — Botão de entrada visível na galeria (ícone play/teatro). Entra em fullscreen via Fullscreen API; sai com Esc, botão discreto, ou back do browser.
- **R2** — Exibe as fotos do **filtro ativo** da galeria (incluindo o default de favoritas); se o resultado for vazio, usa todas.
- **R3** — Transição lenta e suave entre fotos (crossfade; avaliar Ken Burns sutil no Specify de execução). Intervalo default ~10s, sem controles visíveis durante a exibição (UI some após ~3s de inatividade).
- **R4** — Usa a versão `optimized`; pré-carrega a próxima imagem antes da transição (sem flash de loading).
- **R5** — Ordem: embaralhada por sessão (revisitar não repete a mesma sequência); loop infinito com paginação transparente contra a API.
- **R6** — Screen Wake Lock API ativa durante o modo (tela não dorme), liberada na saída.
- **R7** — Acessível por URL própria (`/gallery?theater=true` ou `/theater`) para deep-link/cast; estado i18n e tema respeitados.
- **R8** — Info opcional discreta (localização/descrição) em overlay minimal — decidir exibição default no Specify de execução.

## Critérios de aceite

1. Entrar no modo da galeria filtrada exibe apenas as fotos do filtro, em fullscreen, trocando sozinhas.
2. Nenhum loading visível entre fotos em conexão normal.
3. Tela não apaga durante 5+ min de exibição (desktop e mobile que suporte Wake Lock).
4. Esc restaura exatamente o estado anterior da galeria.

## Notas de design

Reusar a base de exibição extraída do viewer (F3 deve deixar o componente de imagem desacoplado do modal — registrado em CONCERNS.md §lacunas).
