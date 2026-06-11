# Integrações Externas

## Storage de objetos — AWS S3 (ou compatível)

**Serviço:** S3 via `@aws-sdk/client-s3`
**Propósito:** armazenar todos os binários de imagem (original + optimized + thumbnail por versão). O browser baixa direto do bucket; a API só escreve/deleta.
**Implementação:** `yan-site-api-node/services/S3.js` — `uploadImageToS3(key, buffer, mimetype)` e `deleteImagesToS3(keys)` (batch).
**Configuração:** `BUCKET_KEY`, `BUCKET_SECRET`, `BUCKET_REGION`, `BUCKET_NAME`, `BUCKET_API` (endpoint custom — permite R2/MinIO), `BUCKET_URL` (URL pública usada por `setImagesUrl`).
**Convenções:** keys `${Date.now()}-${nomeSanitizado}[-thumbnail|-optimized].ext`; o full-size sobe com `ContentType: application/octet-stream` (força download em vez de exibir — relevante para SEO de imagens: o Googlebot prefere content-type de imagem).
**Autenticação:** access key/secret estáticas.

## Google Cloud Vision API

**Propósito:** no upload — LABEL_DETECTION (tags, só na primeira versão, máx. 50) e IMAGE_PROPERTIES (paleta de cores dominantes por versão, máx. 5).
**Implementação:** `services/google.js:getTagsAndColors` — POST REST para `vision.googleapis.com/v1/images:annotate`, passando a URL pública S3 da imagem otimizada (`imageUri`), não o binário.
**Configuração/Auth:** `GOOGLEAPIKEY` como query param (API key simples, não service account).
**Detalhes:** as tags retornadas são filtradas contra a collection `Tag` (allowlist curada manualmente via CRUD `/tags`). Cores viram `colorPalette[]` (rgb + score + pixelFraction) em cada versão.

## Google Maps Geocoding API

**Propósito:** no upload — reverse geocoding de GPS EXIF para `country/state/city` (strings).
**Implementação:** `services/google.js:getCityStateCountry` — `locality`/`administrative_area_level_2` → city, `administrative_area_level_1` → state, `country` → country.
**Configuração/Auth:** mesma `GOOGLEAPIKEY`.
**Detalhe:** loga a resposta completa no console (`util.inspect`) — poluição de log em produção.

## MongoDB / AWS DocumentDB

**Propósito:** persistência de metadados (Image, Tag, Country, State, City, User).
**Implementação:** conexão única em `index.js` via Mongoose; string montada de `MONGOUSER/MONGOPASS/MONGOIP/MONGOPORT/MONGODBNAME`.
**Detalhe:** `global-bundle.pem` (CA da AWS) na raiz sugere DocumentDB com TLS em produção, mas a connection string no código não referencia TLS — provável configuração divergente entre ambientes. A app sobe mesmo se a conexão falhar (erro só logado).

## Google Maps / Street View (frontend, sem API)

**Propósito:** links externos no viewer (`ModalViewerImage.vue`) — abre Maps com lat/lng e Street View com heading = `cameraTrueDirection` do EXIF. São URLs públicas, sem chave.

## Webhooks

Nenhum.

## Background jobs

Nenhum — todo o pipeline de upload (sharp + S3 + Vision + Geocoding) roda síncrono dentro do request HTTP. Uploads grandes/multi-versão podem estourar timeouts (o frontend já trata `ECONNABORTED` no delete com alert + reload).

## Impacto nas novas features

- **SEO/Google Images:** exigirá sitemap de imagens apontando para URLs S3, content-type correto no full-size, e provavelmente um domínio/CDN próprio para as imagens (URLs de bucket são penalizadas/feias para indexação).
- **Exibição por IA:** descrição + tags já existem como base para alt-text/JSON-LD; falta expô-los em HTML renderizado no servidor.
- **NestJS:** as integrações mapeiam bem para providers injetáveis (`S3Service`, `VisionService`, `GeocodingService`) com `ConfigModule`.
