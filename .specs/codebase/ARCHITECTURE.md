# Arquitetura

**Padrão:** Dois monolitos separados — API REST (Express) + SPA (Vue 3). Comunicação exclusivamente via HTTP/JSON. Imagens servidas direto do S3 ao browser (a API nunca serve binários, exceto no upload).

## Estrutura de alto nível

```
Browser (SPA Vue) ──HTTP──> API Express ──> MongoDB (metadados)
       │                        │──> S3 (binários das imagens)
       │                        │──> Google Vision (tags + cores)
       │                        └──> Google Geocoding (lat/lng → cidade/estado/país)
       └────GET direto (URLs públicas)────> S3
```

## Padrões identificados — API

### Camadas: routes → use-cases → models/services/helpers

**Localização:** `routes/`, `use-cases/`, `models/`, `services/`, `helpers/`, `middlewares/`, `utils/`
**Implementação:** Cada recurso (images, tags, countries, states, cities, authentication) tem um par route+use-case com o mesmo nome. Routes são finas: extraem `req`, chamam o use-case, mapeiam erro para status 500 genérico. Use-cases contêm toda a lógica e acessam models Mongoose diretamente.
**Exemplo:** `routes/images.js:21` → `use-cases/images.js:90` (`uploadImage`).

### Recursos CRUD clonados

countries, states e cities são cópias do mesmo template (list público; create/edit/delete atrás de `checkToken`). Models: `name` + `code` únicos; State tem `countryParentCode`, City tem `countryParentCode` + `stateParentCode`. **A hierarquia geográfica é ligada por `code` string, não por ObjectId/ref.**

### Auth JWT

**Localização:** `middlewares/checkAuth.js`, `use-cases/authentication.js`
`POST /authentication` valida name+password (bcrypt) e devolve `{ token, payload }`. `checkToken` valida o header `Authorization: Bearer <token>` e injeta `req.payload`. Não há roles — qualquer usuário autenticado pode tudo. Não há refresh token. (Bug do `exp`: ver CONCERNS.md.)

### URLs relativas no banco, absolutas na saída

**Localização:** `helpers/general.js` (`setImagesUrl`)
O banco guarda apenas a **key** S3; toda resposta de list/upload/edit passa por `setImagesUrl` que prefixa `BUCKET_URL`. No `editImage`, o caminho inverso: URLs absolutas recebidas do front são reduzidas de volta para keys (strip de tudo até a última `/`). Qualquer porta nova da API precisa preservar essa convenção ou migrar os dados.

## Fluxos principais

### Upload de imagem (`POST /images`, multipart)

1. multer carrega arquivos em memória; `versionNames[i]` casa por índice com `files[i]`.
2. `helpers/metadata.js` lê EXIF do **primeiro arquivo** e resolve um perfil por modelo de câmera (iPhone 12 Pro Max, Poco X3 Pro, Lumia 640, DJI Mini 2, GoPro Hero9, Sony ZV-E10, fallback `generic`). Calcula dimensões: optimized = 1/3, thumbnail = 1/10 do original.
3. Para cada arquivo, sharp gera: lazyThumbnail (1/25 + blur, webp, vira base64 inline no documento), thumbnail e optimized; os 3 + o original sobem para o S3 com nome `${Date.now()}-${nomeSanitizado}`.
4. Google Vision: IMAGE_PROPERTIES (paleta de cores) para todas as versões; LABEL_DETECTION **somente para a primeira**. Tags retornadas são filtradas para manter apenas as que já existem na collection `Tag` (curadoria por allowlist).
5. Se houver GPS no EXIF, Google Geocoding resolve country/state/city (gravados como **strings**, não vinculados às collections Country/State/City).
6. Documento `Image` é salvo: a versão com `versionName === "Original"` vai para o campo `original`, as demais para o array `images`.
7. **Rollback:** em caso de erro, todas as keys já enviadas ao S3 são deletadas.

### Listagem/galeria (`GET /images`)

Filtros: `tags` ($all), `country/state/city` ($in), ranges `takenAtFrom/To` e `createdAtFrom/To`, qualquer outro query param vira filtro `metadata.*`. Sort dinâmico + paginação offset/limit. **Modo deep-link:** se `id` é passado, a API busca todos os documentos do filtro, localiza o índice da imagem e expande o limit para garantir que ela esteja na página retornada (permite abrir o modal por URL compartilhada e continuar navegando).

### Delete (`DELETE /images/:id`)

Coleta todas as keys (original + versões × 3 tamanhos), deleta do S3 em batch, depois remove o documento.

## Padrões identificados — Frontend

### Estado de filtros espelhado na URL

**Localização:** `src/views/GalleryView.vue`
Filtros (country/state/city em cascata, tags, range de datas) e estado do modal (id + version) são sincronizados com a query string via `updateRoute()` — toda visualização é compartilhável por URL. Watchers comparam old/new para evitar loops, e `debounceLoadImages` (lodash, 300ms) recarrega com reset.

### Visualizador modal com cache e versões

**Localização:** `src/components/ModalViewerImage.vue` + `GalleryView`
GalleryView pré-carrega as versões da imagem aberta via `fetch → blob → base64` num objeto `cache` (keyed por `_id` da versão). O modal exibe carrossel de versões editadas + toggle "sem edição" (original), painel EXIF expansível, paleta de cores clicável (copia hex), links Google Maps/Street View, navegação por teclado (setas, shift+setas para versões, Esc) e gestos touch com workarounds para Safari iOS.

### Guards de rota por expiração do token

**Localização:** `src/router/index.js`
`/upload` e `/list` checam `payload.exp * 1000 > Date.now()` no Vuex (persistido). Login fica em `/secretdoor` (rota não-linkada). `/` redireciona para `/gallery`, que é pública.

### Plugin axios global

**Localização:** `src/plugins/api.js`
Instância axios com `baseURL` de `VUE_APP_API_URL`, interceptor que injeta o Bearer token do Vuex, e esqueleto de retry para 500 (desativado, `RETRY = 0`). Exposto como `this.$api`.

## Organização de código

**API:** layer-based (routes/use-cases/models/services/helpers/middlewares/utils — um arquivo por recurso).
**Frontend:** padrão Vue CLI (views/ para páginas roteadas, components/ para modais e upload, plugins/, store/, router/, customIcons/, utils/).

**Renderização:** 100% client-side (SPA). Não há SSR, prerender, meta tags dinâmicas nem sitemap — ponto central para o objetivo de SEO.
