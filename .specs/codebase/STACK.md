# Tech Stack

**Analisado:** 2026-06-11

Dois projetos independentes (repos git separados), ambos em JavaScript puro (sem TypeScript).

## API — `yan-site-api-node/`

- Framework: Express 4.19
- Linguagem: JavaScript (CommonJS, `require`)
- Runtime: Node.js (sem versão fixada — não há `.nvmrc` nem `engines`)
- Package manager: npm (package-lock.json)
- Banco: MongoDB via Mongoose 8.3 (conexão por env vars; `global-bundle.pem` na raiz sugere AWS DocumentDB/RDS com TLS em produção)
- Upload: multer 1.4.5-lts.1 (memória, sem storage em disco)
- Processamento de imagem: sharp 0.33 (resize, blur, webp)
- EXIF: exifreader 4.22
- Storage: @aws-sdk/client-s3 3.x (S3 ou compatível — endpoint configurável via `BUCKET_API`)
- Auth: jsonwebtoken 9 (JWT Bearer) + bcrypt 5.1 (saltRounds 14)
- HTTP client: axios 1.6 (chamadas às APIs Google)
- Outros: cors (aberto), dotenv
- Dev: nodemon (`npm run dev`)

## Frontend — `yan-site-front-vue/`

- UI Framework: Vue 3.2 (Options API predominante, `setup()` pontual para composables Vuetify)
- Build: Vue CLI 5 (webpack 5, babel) — **não** Vite
- Component library: Vuetify `^3.0.0-beta.0` (versão beta fixada por range — risco)
- Ícones: @mdi/font + 13 ícones SVG custom em `src/customIcons/`
- State: Vuex 4 + vuex-persistedstate (persiste user/token e tema no localStorage)
- Router: vue-router 4 (history mode)
- HTTP: axios via plugin próprio (`src/plugins/api.js`) com interceptor de token
- Utils: lodash (debounce), webfontloader
- Lint: ESLint 7 + plugin:vue/vue3-essential (regras mínimas)
- Scripts: `serve`, `build`, `lint`

## Testes

- **Nenhum framework de teste em nenhum dos projetos.** Zero testes.

## Serviços externos

- Storage de imagens: AWS S3 (ou compatível)
- Geocoding reverso: Google Maps Geocoding API
- Tags e paleta de cores: Google Cloud Vision API (LABEL_DETECTION + IMAGE_PROPERTIES)
- Banco: MongoDB/DocumentDB

## Observações para a migração

- `@tensorflow-models/mobilenet` é importado em `services/tensorFlow.js` mas o arquivo tem 1 linha — dependência nem está no package.json (código morto).
- `package.json` da API tem name/description placeholder ("sua-aplicacao").
- Vue CLI está em modo manutenção (deprecated); a migração para monorepo é boa oportunidade de ir para Vite ou Nuxt.
