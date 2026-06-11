# F7 — Deploy & Cutover

**Status:** especificada | **Escopo:** Medium | **Depende de:** F3 (mínimo); idealmente F4–F6 para cutover único

## Objetivo

Colocar o monorepo em produção no VPS/EC2, trocar o yanlucas.com para a stack nova e aposentar os projetos legados.

## Requisitos

- **R1** — Dockerfiles de produção para `apps/api` (Node multi-stage; atenção: sharp precisa de build para a plataforma do container) e `apps/web` (Nuxt `.output` standalone).
- **R2** — `docker-compose.yml` no VPS: api + web + nginx reverse proxy (web em `/`, api em `/api` ou subdomínio `api.yanlucas.com` — decidir no design conforme o setup atual de DNS/SSL do Yan).
- **R3** — SSL (Let's Encrypt/certbot ou o que já existe no VPS); HTTPS forçado.
- **R4** — Migração de envs: mapear `.env` legados → novos nomes padronizados; documentar em `.env.example` de cada app; secrets nunca commitados.
- **R5** — Plano de cutover com rollback: subir stack nova em paralelo (porta/subdomínio de staging) → smoke test com checklist de F2-R11 → trocar o nginx para a stack nova → janela de observação → desligar processos legados. Rollback = reverter o proxy.
- **R5b — Gates pré-cutover (continuidade para o visitante):** (a) deep-links reais compartilhados antes da migração testados na stack nova (mesma foto, mesma versão, mesmo grid); (b) **curadoria de favoritas feita antes do switch** — o Yan usa o admin novo (`/list`) apontado para o banco de produção enquanto a stack antiga ainda atende o público (o campo `favorite` é ignorado pela API antiga e o Mongoose legado preserva campos desconhecidos em `save()`, então é seguro); o cutover só acontece com a galeria default não-vazia, salvo decisão explícita do Yan de ir com empty-state.
- **R6** — Pós-cutover: remover `yan-site-api-node/` e `yan-site-front-vue/` do disco; arquivar os repos no GitHub (read-only); executar checklist SEO pós-deploy (F6-R10) se F6 já estiver no ar.
- **R7** — Operação: restart automático (compose `restart: unless-stopped`), logs acessíveis (`docker logs`), e documentação de deploy no README (como buildar/subir nova versão).

## Critérios de aceite

1. `https://yanlucas.com/gallery` servido pela stack nova, com deep-links antigos funcionando.
2. Upload/edição/delete funcionando em produção (teste real do Yan).
3. Rollback testado (troca de proxy de volta) antes do cutover definitivo.
4. Repos legados arquivados; dirs removidos; `git status` do monorepo limpo.

## Notas

Detalhes do VPS (distro, nginx existente, como o site é servido hoje, DNS) serão levantados com o Yan no Specify de execução desta feature.
