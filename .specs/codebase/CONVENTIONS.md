# Convenções de Código

Observadas no código existente (não são ideais — ver CONCERNS.md para desvios a corrigir na migração).

## Nomenclatura

**Arquivos — API:**
- Recursos no plural, camelCase/lowercase: `images.js`, `countries.js` (routes e use-cases espelhados)
- Models no singular, PascalCase: `Image.js`, `Country.js`
- Services/helpers descritivos: `S3.js`, `google.js`, `metadata.js`, `checkAuth.js`, `hashBcrypt.js`

**Arquivos — Frontend:**
- Views: PascalCase com sufixo `View` (`GalleryView.vue`, `LoginView.vue`) — exceção: `ImageList.vue`
- Components: PascalCase descritivo, modais com prefixo `Modal` (`ModalViewerImage.vue`, `ModalEditImage.vue`)
- Ícones custom: prefixo `custom` (`customAperture.vue`), registrados como aliases Vuetify `$custom-aperture`

**Funções:** camelCase verbo+substantivo: `listImages`, `uploadImage`, `editImage`, `deleteImage`, `getCityStateCountry`, `setImagesUrl`. Use-cases exportam objeto com as funções (`module.exports = { listImages, ... }`).

**Variáveis:** camelCase. Flags booleanas com prefixos `is`/`has`/`loading` (`isRotated`, `hasMore`, `loadingModalImage`). Env vars em SCREAMING_CASE sem padrão consistente (`MONGOUSER` vs `BUCKET_KEY` vs `GOOGLEAPIKEY`).

## Organização interna dos arquivos

**Routes (API):** requires no topo → `router.get/post/patch/delete` → `module.exports = router`. Rotas protegidas recebem `checkToken` como middleware inline. Padrão de handler:

```js
router.patch('/:id', checkToken, async (req, res) => {
  const { body, params } = req;
  try {
    const result = await useCases.editImage(params.id, body);
    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao editar imagem');
  }
});
```

**Componentes Vue:** Options API (`data`, `computed`, `methods`, `watch`, lifecycle). `setup()` usado apenas para composables Vuetify (`useDisplay`, `useTheme`). SFC na ordem template → script → style scoped. Store acessada via `mapGetters`/`mapActions`.

## Status HTTP

- 200 list/edit, 201 create (inclusive login), 204 delete, 403 token inválido, 500 para qualquer erro de negócio (sem distinção 400/404)

## Tipagem/Documentação

Nenhuma — sem TypeScript, sem JSDoc. Validação de payload inexistente na API (campos são usados como chegam).

## Tratamento de erros

**API:** try/catch em todas as camadas; use-case loga (`console.error`) e relança `new Error("mensagem genérica em PT")`; route loga de novo e responde 500 com string em português. Mensagens de erro voltadas ao usuário em PT-BR.

**Frontend:** try/catch nos métodos async; erro vira `v-snackbar` (`this.error = true; this.errorMessage = ...`) + `console.error`. Mensagens da galeria em inglês, das telas admin em português (inconsistente).

## Comentários

Raros e em português; usados para explicar workarounds (ex.: timeout para bug de rotação no Safari iOS em `ModalViewerImage.vue:434`) ou estratégias (deep-link em `use-cases/images.js:61`). CSS com comentários explicativos frequentes.

## Idioma

Código/identificadores em inglês; strings de UI, mensagens de erro, commits recentes e comentários em mistura PT-BR/inglês. Commits seguem vagamente conventional commits (`feat:`, `fix:`) sem rigor.

## Para o monorepo (decisões a tomar)

- Adotar TypeScript estrito em tudo; DTOs com validação (class-validator no Nest)
- Unificar idioma das mensagens de UI (sugestão: inglês na UI pública, já que a galeria é pública)
- Padronizar env vars (`MONGO_USER`, `GOOGLE_API_KEY`...)
- Conventional commits; lint/format híbrido decidido em 2026-06-11: Biome (raiz, TS puro) + ESLint/eslint-plugin-vue (só `apps/web`) — ver F1 design
