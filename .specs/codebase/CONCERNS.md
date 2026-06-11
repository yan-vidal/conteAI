# Concerns — Riscos, Bugs e Dívida Técnica

Priorizado por impacto. Tudo verificado no código em 2026-06-11.

## Bugs reais

### 1. JWT praticamente sem expiração
**Evidência:** `use-cases/authentication.js:16-22` — `exp: (Math.floor(Date.now()/1000) + 3600) * 100000`. A multiplicação por 100000 joga o `exp` para milhares de anos no futuro. Os guards do frontend (`router/index.js:29`) fazem `payload.exp * 1000 > Date.now()`, sempre verdadeiro.
**Impacto:** token roubado vale para sempre; "sessão de 1 hora" não existe.
**Correção:** usar `expiresIn: '1h'` do jsonwebtoken na porta para Nest; invalidar tokens antigos trocando o `JWT_SECRET`.

### 2. `res` fora de escopo nos catch de use-cases
**Evidência:** `use-cases/images.js:86`, `use-cases/tags.js:10`, `use-cases/countries.js:11` (e equivalentes em states/cities) — `res.status(500).json(...)` dentro de use-case, onde `res` não existe.
**Impacto:** qualquer erro nesses list vira `ReferenceError`, mascarando a causa raiz (a rota ainda responde 500, mas o log engana).
**Correção:** desaparece naturalmente com exception filters do Nest.

### 3. `editImage` quebra se `metadata` não vier no body
**Evidência:** `use-cases/images.js:255` — `typeof metadata.takenAt` sem checar `metadata` (todos os outros campos checam). PATCH sem `metadata` → TypeError → 500.
**Correção:** DTO com validação na porta para Nest.

### 4. EXIF lido somente do primeiro arquivo
**Evidência:** `use-cases/images.js:97` — `getMetadata(files[0].buffer)` único, aplicado a todas as versões. Se a versão editada (índice 0) tiver EXIF removido pelo editor de fotos, dimensões/GPS/câmera saem errados ou o upload falha (`fullSizeWidth` ausente).
**Correção:** ler EXIF do arquivo marcado como Original; fallback para `sharp().metadata()` nas dimensões.

### 5. Hash bcrypt logado no console
**Evidência:** `utils/hashBcrypt.js:6` — `console.log(hashValue)` dentro de `hashValue()`.
**Impacto:** hashes de senha em logs.
**Correção:** remover; adotar logger estruturado com redaction no Nest.

## Riscos de segurança

### 6. Sem validação de entrada em nenhuma rota
Payloads são usados como chegam (`use-cases/*`). Query params viram filtros Mongo direto (`use-cases/images.js:42-46` injeta qualquer `metadata.*`), abrindo espaço para operator injection (`?metadata.x[$gt]=`). multer sem limites de tamanho/quantidade/mimetype — qualquer arquivo pode subir para o S3.
**Correção:** DTOs class-validator + `ParseFilePipe` no Nest; allowlist de campos filtráveis.

### 7. Sem rate limiting / brute force no login
`POST /authentication` sem throttle; bcrypt com salt 14 ameniza, mas não impede enumeração.
**Correção:** `@nestjs/throttler` na porta.

### 8. CORS irrestrito e erros 403 vs 401 trocados
`index.js:15` — `app.use(cors())` aberto. `checkAuth.js:12` responde 403 para token ausente/inválido (semanticamente 401).

## Dívida técnica estrutural

### 9. Vuetify fixado em beta
`package.json:18` — `"vuetify": "^3.0.0-beta.0"`. APIs de beta divergem da 3.x estável; a migração do frontend precisa orçar ajustes em todos os componentes (especialmente `v-select` slots, `v-date-picker`, `v-infinite-scroll`).

### 10. Vue CLI deprecated + multer 1.x
Vue CLI está em manutenção (webpack, build lento); multer `1.4.5-lts.1` tem CVEs conhecidas corrigidas só na 2.x. A migração para Vite/Nest resolve ambos.

### 11. Zero testes
Ver TESTING.md. O maior risco da migração é regressão silenciosa nas convenções sutis: URLs relativas no banco ↔ absolutas na API (`helpers/general.js` + strip em `editImage`), pareamento `files[i]`↔`versionNames[i]`, semântica do deep-link por `id` no `listImages`.

### 12. Deep-link por `id` carrega a collection inteira
`use-cases/images.js:62-72` — com `id` na query, faz `Image.find(filter)` **sem limit** para achar o índice. Funciona com centenas de fotos; degrada linearmente.
**Correção:** calcular o índice com `countDocuments` usando o critério de ordenação, ou retornar a imagem + cursor.

### 13. Geografia como strings desconectadas
`Image.country/state/city` são strings do Geocoding; as collections Country/State/City (com `code`) servem só aos filtros do front, casadas **por nome**. Renomear um país nos cadastros quebra o vínculo com as fotos. Tags têm o mesmo acoplamento por nome (`tags: [String]` + sync manual `POST /tags/sync`).
**Correção (futura):** referenciar por code/ObjectId; manter strings denormalizadas só para exibição.

### 14. Pipeline de upload síncrono no request
Sharp ×3 + S3 ×3 + Vision + Geocoding por arquivo, tudo no ciclo do POST. Multi-upload grande → timeout (o front já contorna no delete: `ImageList.vue:196`).
**Correção (futura):** fila (BullMQ) com processamento assíncrono e status.

### 15. Perfis de câmera hardcoded
`helpers/metadata.js` — 6 modelos + `generic`; câmeras novas caem no genérico com `lens: 'N/A'`. Mapeamento `"--": pocoX3Pro` é frágil. Considerar normalização genérica via exifreader + overrides declarativos.

## Lacunas para as features planejadas

- **Favoritas:** não existe campo no schema `Image` — exigirá migração de dados (definir default para fotos existentes) + filtro na API + toggle no upload/edição + default na galeria.
- **SEO:** inexistente por arquitetura — SPA sem SSR, `index.html` estático com `<title>` fixo, sem meta/OG/JSON-LD, sem sitemap/robots.txt, imagens em URL de bucket com `application/octet-stream` no full-size (`use-cases/images.js:148`). Indexação no Google Images exige render server-side (ou prerender), sitemap de imagens, alt text e content-type corretos — é mudança de arquitetura do frontend, não ajuste.
- **Modo teatro / tutorial:** sem bloqueios técnicos; o viewer atual (`ModalViewerImage`) já tem a base de exibição, mas está fortemente acoplado ao fluxo de modal+galeria (cache, versões, touch) — vale extrair a exibição pura para reuso.

## Código morto / higiene

`services/tensorFlow.js` (1 import, dependência nem listada), `AboutView.vue`, `HelloWorld.vue`, `components/download.png`, `HeaderBar` com `v-if="false"`, retry desativado em `plugins/api.js` (`RETRY = 0`), `package.json` da API com name placeholder `"sua-aplicacao"`, `console.log` extensivos com `util.inspect` de respostas Google (`services/google.js:13-20,84-91`).
