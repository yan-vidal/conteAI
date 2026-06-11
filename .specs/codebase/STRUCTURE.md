# Estrutura do Projeto

**Raiz:** `/home/yan/projects/conteai/` (futura raiz do monorepo; hoje só contém os dois repos clonados — ela própria não é repo git)

## Árvore de diretórios

```
conteai/
├── .specs/                      # documentação de planejamento (este diretório)
├── yan-site-api-node/           # repo git: yan-vidal/yan-site-api-node
│   ├── index.js                 # entrypoint: dotenv, conexão Mongo, registro de routers
│   ├── routes/                  # images, tags, countries, states, cities, authentication
│   ├── use-cases/               # lógica de negócio (1:1 com routes)
│   ├── models/                  # Image, Tag, Country, State, City, User (Mongoose)
│   ├── services/                # S3.js, google.js (Vision+Geocoding), tensorFlow.js (morto)
│   ├── helpers/                 # metadata.js (perfis EXIF por câmera), general.js (setImagesUrl)
│   ├── middlewares/             # checkAuth.js (JWT)
│   ├── utils/                   # hashBcrypt.js
│   ├── global-bundle.pem        # CA bundle AWS (TLS DocumentDB)
│   └── .env.example
└── yan-site-front-vue/          # repo git: yan-vidal/yan-site-front-vue
    ├── public/                  # index.html, logo, favicon, icons/
    ├── src/
    │   ├── main.js              # bootstrap: router, vuetify, store, api
    │   ├── App.vue              # v-app + router-view (HeaderBar desativada)
    │   ├── views/               # GalleryView, ImageList, LoginView, AboutView (morta)
    │   ├── components/          # ModalViewerImage, ModalEditImage, UploadImages,
    │   │                        #   HeaderBar (não usada), HelloWorld (morta)
    │   ├── router/index.js      # rotas + guards de auth
    │   ├── store/index.js       # Vuex: user + darkTheme (persistido)
    │   ├── plugins/             # vuetify.js (temas+ícones), api.js (axios), webfontloader.js
    │   ├── customIcons/         # 13 SVGs (camera, lens, iso, aperture, map...)
    │   └── utils/date.js        # getDateHour (formatação dd/mm/yy hh:mm)
    ├── vue.config.js
    └── .env.example             # VUE_APP_API_URL
```

## Onde cada coisa vive

**Galeria pública:**
- UI: `yan-site-front-vue/src/views/GalleryView.vue` (filtros, grid, infinite scroll) + `ModalViewerImage.vue` (visualizador)
- API: `GET /images` (`use-cases/images.js:listImages`), `GET /countries|states|cities|tags`

**Upload/curadoria (autenticado):**
- UI: `/upload` → `UploadImages.vue`; `/list` → `ImageList.vue` + `ModalEditImage.vue`
- API: `POST /images` (pipeline completo), `PATCH /images/:id`, `DELETE /images/:id`, CRUD de tags/países/estados/cidades

**Autenticação:**
- UI: `/secretdoor` → `LoginView.vue`; token no Vuex (localStorage)
- API: `POST /authentication`; middleware `checkToken`

**Processamento de imagem:** `use-cases/images.js` (orquestração) + `helpers/metadata.js` (EXIF) + `services/S3.js` + `services/google.js`

**Configuração:** `.env` em cada projeto (ver `.env.example`); sem config compartilhada.

## Rotas HTTP da API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | /images | não | lista com filtros/paginação/deep-link por id |
| POST | /images | sim | upload multipart (files + versionNames + description) |
| PATCH | /images/:id | sim | edição de metadados/versões |
| DELETE | /images/:id | sim | remove doc + objetos S3 |
| GET/POST/PATCH/DELETE | /tags, /countries, /states, /cities | GET não; resto sim | CRUD (tags tem POST /sync extra) |
| POST | /authentication | não | login → { token, payload } |

## Rotas do frontend

| Rota | Componente | Guard |
|---|---|---|
| / | redirect → /gallery | — |
| /gallery | GalleryView | pública |
| /secretdoor | LoginView | — |
| /upload | UploadImages | token válido |
| /list | ImageList | token válido |

## Código morto (candidato a não migrar)

`services/tensorFlow.js`, `views/AboutView.vue`, `components/HelloWorld.vue`, `components/download.png`, `HeaderBar.vue` (renderizada com `v-if="false"`), esqueleto de retry desativado em `plugins/api.js`.
