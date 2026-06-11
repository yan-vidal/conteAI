# F6 — SEO e Indexabilidade por IA

**Status:** especificada | **Escopo:** Large | **Depende de:** F3 (SSR e favoritas no ar)

## Objetivo

Fotos do yanlucas.com aparecendo no Google Imagens, encontráveis pela descrição em busca textual, e expostas com dados estruturados consumíveis por crawlers de IA.

## Requisitos

### Páginas e metadados
- **R1** — Página canônica por foto: rota SSR `/photo/[id]` (slug amigável `id-descricao-resumida` avaliado no design) com a imagem otimizada, descrição, localização, EXIF e tags em HTML real. Deep-links existentes `/gallery?id=X` **mantêm o comportamento atual** (modal sobre o grid — links já compartilhados não mudam de experiência) e apenas declaram `<link rel="canonical">` para `/photo/X`; a página `/photo/[id]` é a face para crawlers e novos compartilhamentos. Redirect é descartado pela restrição de continuidade.
- **R2** — Meta tags por página: title/description derivados da descrição+localização da foto; Open Graph + Twitter Card (`og:image` com a URL otimizada, dimensões corretas).
- **R3** — JSON-LD `ImageObject` por foto: `contentUrl`, `name`/`description`, `creator` (Yan Lucas), `creditText`, `dateCreated` (takenAt), `contentLocation` (city/state/country), `keywords` (tags), licença (definir com o Yan no Specify de execução); galeria com `ImageGallery`.
- **R4** — `alt` real em todas as `<img>` públicas (descrição ou fallback `localização + data`).

### Infraestrutura de crawling
- **R5** — `sitemap.xml` dinâmico (server route Nitro) com todas as fotos **favoritas** + páginas públicas, usando a extensão Google Image sitemap (`image:image`, `image:title`, `image:caption`, `image:geo_location`); atualiza sozinho a cada upload (gerado da API).
- **R6** — `robots.txt` permitindo crawlers de busca e de IA (Googlebot, Googlebot-Image, Bingbot, GPTBot, ClaudeBot, PerplexityBot, etc.) nas rotas públicas; bloqueando `/secretdoor`, `/upload`, `/list`; referência ao sitemap.
- **R7** — Content-type correto: `POST /images` passa a subir o full-size com o mimetype real (não `application/octet-stream`); script one-shot opcional de backfill (S3 copy in place) para o acervo — sem reprocessar binários.
- **R8** — Imagens referenciadas por URL pública estável; avaliar no design servir via subdomínio próprio (`img.yanlucas.com` → CNAME/CDN no bucket) em vez da URL crua do bucket.

### Verificação e pós-deploy
- **R9** — Validação com Rich Results Test / Schema.org validator nas páginas de foto; Lighthouse SEO ≥ 95 nas rotas públicas.
- **R10** — Checklist manual pós-deploy documentado: Google Search Console (propriedade + submit sitemap), Bing Webmaster, monitorar indexação de imagens.

## Critérios de aceite

1. `curl /photo/<id>` retorna HTML com meta/OG/JSON-LD completos e `<img alt>` corretos, sem JS.
2. `curl /sitemap.xml` lista as fotos favoritas com tags de imagem; validador de sitemap sem erros.
3. Rich Results Test verde para `ImageObject` numa página real.
4. Upload novo chega ao S3 com content-type de imagem no full-size.

## Fora de escopo

Garantia de ranking (depende do Google), tradução de descrições, CDN completo (registrado em STATE.md se ficar para depois).
