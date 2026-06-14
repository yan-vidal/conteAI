# F2 — Tasks

**Spec:** `.specs/features/02-api-nest-port/spec.md`  
**Design source:** spec F2 + `.specs/codebase/{ARCHITECTURE,STRUCTURE,CONCERNS,CONVENTIONS,INTEGRATIONS,TESTING}.md`. Não há `design.md` dedicado para F2; esta quebra fixa a arquitetura de execução no nível de tarefas.  
**Status:** Draft  
**Scope:** Complex  

Status: [ ] pendente · [x] concluida. `[P]` = paralelizavel depois das dependencias indicadas.

## Gate commands

Use Node 26 antes de rodar gates:

```bash
source ~/.nvm/nvm.sh && nvm use
```

- API quick: `pnpm --filter api test`
- API full: `pnpm --filter api typecheck && pnpm --filter api test`
- Repo standard: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- Sentiness post-edit: `pnpm exec sentiness check --tier=fast --trigger=post-edit --compact`
- Sentiness pre-done: `pnpm exec sentiness check --tier=standard --trigger=pre-done --compact`

Observacao: o e2e da API usa Supertest e pode precisar rodar fora da sandbox local se aparecer `listen EPERM: operation not permitted 127.0.0.1`.

## Execution Plan

### Phase 1 — Foundation

```text
T1 -> T2 -> T3 -> T5
      |
      +-> T4, T9, T10, T11
```

### Phase 2 — Public and admin resources

```text
T3 + T5 -> T6 [P]
T3 + T5 -> T7 [P]
T3 + T5 -> T8 [P]
T3 + T5 -> T12 [P]
```

### Phase 3 — Images

```text
T3 + T4       -> T13
T3 + T4 + T5 + T9 -> T14
T3 + T4 + T5 + T9 + T10 + T11 + T13 -> T15
```

### Phase 4 — Acceptance

```text
T6 + T7 + T8 + T12 + T13 + T14 + T15 -> T16
```

## Task Breakdown

### T1 — API dependencies, config, and bootstrap

**Status:** [x] concluida em 2026-06-12.  
**What:** Add the Nest dependencies and config surface needed by the API port, then wire global validation, CORS, logger, throttling, and env validation without reading `process.env` outside config/bootstrap.  
**Where:** `apps/api/package.json`, `apps/api/.env.example`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/config/`  
**Depends on:** F1 complete  
**Reuses:** `yan-site-api-node/.env.example`, `.specs/codebase/INTEGRATIONS.md`, current `HealthModule` wiring  
**Requirement:** R1, R6, R9  

**Done when:**

- [ ] Runtime deps cover Mongoose, validation, JWT/auth, throttle, bcrypt, S3, Google HTTP, EXIF, and image processing.
- [ ] Test deps cover Mongo integration and mocked external HTTP/S3.
- [ ] `.env.example` lists `PORT`, `MONGO_URI` or normalized Mongo vars, `JWT_SECRET`, `BUCKET_*`, `GOOGLE_API_KEY`, and `CORS_ORIGIN`.
- [ ] Global `ValidationPipe` is configured with whitelist behavior for DTOs.
- [ ] CORS is env-driven and keeps legacy front compatibility.
- [ ] `pnpm --filter api typecheck` passes.
- [ ] Sentiness post-edit passes.

**Tests:** unit/config smoke  
**Gate:** API full + Sentiness post-edit  
**Commit:** `chore(api): add port dependencies and config`

**Implementation notes:** `validateApiEnv` accepts `MONGO_URI` or the legacy `MONGOUSER/MONGOPASS/MONGOIP/MONGOPORT/MONGODBNAME` set, normalizes `GOOGLEAPIKEY` to `GOOGLE_API_KEY`, and Vitest seeds a minimal env in `apps/api/test/support/api-test-env.ts` before importing `AppModule`.

---

### T2 — Contract test harness and fixtures

**Status:** [x] concluida em 2026-06-12.  
**What:** Create a reusable API test harness with isolated MongoDB, app boot helper, auth helper, and fixtures that encode the legacy response shapes before implementation starts.  
**Where:** `apps/api/test/support/`, `apps/api/test/fixtures/`, `apps/api/vitest.config.ts`  
**Depends on:** T1  
**Reuses:** `.specs/codebase/STRUCTURE.md`, legacy route files in `yan-site-api-node/routes/`, existing `health.e2e-spec.ts`  
**Requirement:** R2, R10  

**Done when:**

- [ ] Tests can bootstrap `AppModule` against isolated Mongo state.
- [ ] Fixtures include sample user, tag, country, state, city, image document, image versions, and expected `{ images, total }` list shape.
- [ ] Auth helper can mint a token through the public login route once T5 lands, without hardcoding JWT internals in later tests.
- [ ] External integrations are replaceable by injected mocks in tests.
- [ ] Existing health tests still pass.
- [ ] Sentiness post-edit passes.

**Tests:** integration harness  
**Gate:** API quick + Sentiness post-edit  
**Commit:** `test(api): add contract harness fixtures`

**Implementation notes:** `createApiTestApp` compila `AppModule`, aplica a mesma configuracao global de bootstrap via `configureApiApp`, e usa `app.init()`; `api-fixtures.ts` fixa user/tag/geo/image/list/auth shapes; `auth-helper.ts` fica pronto para T5; `mongo-memory.ts` fica pronto para T3.

---

### T3 — Database module, schemas, and repositories

**Status:** [x] concluida em 2026-06-12.  
**What:** Port the Mongo/Mongoose model layer to Nest: `Image`, `Tag`, `Country`, `State`, `City`, and `User`, with typed repositories or model providers used by feature modules.  
**Where:** `apps/api/src/database/`, `apps/api/src/images/image.schema.ts`, `apps/api/src/tags/tag.schema.ts`, `apps/api/src/geo/*.schema.ts`, `apps/api/src/auth/user.schema.ts`  
**Depends on:** T2  
**Reuses:** `yan-site-api-node/models/*.js`, `packages/shared/src/image.ts`  
**Requirement:** R1  

**Done when:**

- [ ] Schemas preserve field names, optionality, timestamps, uniqueness, and nested image-version/color-palette shape.
- [ ] Types exported from `@conteai/shared` are reused where practical without unsafe casts.
- [ ] Database connection is provided by `DatabaseModule`.
- [ ] Integration tests can insert and read all document families.
- [ ] No code imports legacy Mongoose models.
- [ ] Sentiness post-edit passes.

**Tests:** integration  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): add mongoose schemas`

**Implementation notes:** `DatabaseModule` provides `MongooseModule.forRootAsync` from normalized config; schemas preserve legacy model names/collections and nested image/color/metadata shape; `database.module.spec.ts` inserts and reads user/tag/country/state/city/image through `mongodb-memory-server`.

---

### T4 — Image URL/key mapping helpers

**Status:** [x] concluida em 2026-06-12.  
**What:** Implement pure helpers for outbound `BUCKET_URL` prefixing and inbound absolute URL stripping, preserving the relative-key-in-DB convention.  
**Where:** `apps/api/src/images/image-url.service.ts`, `apps/api/src/images/image-url.service.spec.ts`  
**Depends on:** T2  
**Reuses:** `yan-site-api-node/helpers/general.js`, `use-cases/images.js:editImage` URL stripping  
**Requirement:** R3  

**Done when:**

- [ ] `setImagesUrl` equivalent prefixes `original` and every edited version only when URLs are stored as relative keys.
- [ ] Strip helper converts absolute `https://.../key` values back to `key` for `fullSizeUrl`, `optimizedUrl`, and `thumbnailUrl`.
- [ ] Helpers do not mutate caller-owned fixtures unless the service contract explicitly documents mutation.
- [ ] Unit tests cover original-only images, multi-version images, already-relative keys, and missing optional arrays.
- [ ] Sentiness post-edit passes.

**Tests:** unit  
**Gate:** API quick + Sentiness post-edit  
**Commit:** `feat(api): preserve image url mapping`

**Implementation notes:** helpers return cloned documents, avoid double-prefixing `http(s)` URLs, and strip absolute URLs back to the last path segment to preserve the legacy PATCH convention.

---

### T5 — Auth module, JWT guard, and throttled login

**Status:** [x] concluida em 2026-06-13.  
**What:** Port `POST /authentication` and protected-route auth to Nest, fixing JWT expiration while preserving response shape `{ token, payload }`.  
**Where:** `apps/api/src/auth/`, `apps/api/src/app.module.ts`  
**Depends on:** T3  
**Reuses:** `yan-site-api-node/use-cases/authentication.js`, `middlewares/checkAuth.js`, `utils/hashBcrypt.js`  
**Requirement:** R2, R5, R9  

**Done when:**

- [ ] `POST /authentication` returns HTTP 201 with `{ token, payload: { name, id, exp } }`.
- [ ] `payload.exp` is one hour in the future in Unix seconds, not multiplied by `100000`.
- [ ] Invalid credentials preserve legacy external behavior as an error response, while protected routes use 401 for missing/invalid token.
- [ ] Bcrypt comparison is implemented with no hash logging.
- [ ] Throttle applies to login.
- [ ] E2E tests cover valid login, invalid login, protected access with token, and protected access without token.
- [ ] Sentiness post-edit passes.

**Tests:** e2e + unit  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port authentication`

**Implementation notes:** `AuthService` usa `JwtService.signAsync` com `expiresIn: "1h"` (corrige o bug do `exp * 100000` do legado) e mantem a paridade externa lancando erro 500 em credencial invalida; `JwtAuthGuard` valida o header `Bearer` e responde 401 em rotas protegidas; `@Throttle({ limit: 5, ttl: 60_000 })` no login e `ThrottlerGuard` global via `APP_GUARD`; e2e cobre login valido/invalido e o guard spec cobre acesso protegido com/sem token.

---

### T6 — Countries endpoint [P]

**Status:** [x] concluida em 2026-06-13.  
**What:** Port `GET/POST/PATCH/DELETE /countries` with public list and protected mutations.  
**Where:** `apps/api/src/geo/countries.*.ts`, `apps/api/test/countries.e2e-spec.ts`  
**Depends on:** T3, T5  
**Reuses:** `yan-site-api-node/routes/countries.js`, `use-cases/countries.js`, `models/Country.js`  
**Requirement:** R1, R2, R6, R9  

**Done when:**

- [ ] `GET /countries` returns sorted-by-name documents with legacy shape.
- [ ] `POST /countries` returns 201 and persists `{ name, code }`.
- [ ] `PATCH /countries/:id` returns 200 with updated document.
- [ ] `DELETE /countries/:id` returns 204.
- [ ] Mutations reject missing/invalid tokens with 401.
- [ ] DTO validation rejects unknown/operator-style body fields.
- [ ] Sentiness post-edit passes.

**Tests:** e2e  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port countries endpoints`

**Implementation notes:** `GeoModule` registra o model `Country` e importa `AuthModule` para o `JwtAuthGuard`; controller usa `@Bind(...)` (o Biome do projeto nao parseia parameter decorators) e o DTO e value-import com `biome-ignore` para preservar o metatype do `ValidationPipe`. Not-found em PATCH/DELETE retorna 404 (caminho que o front legado nunca exercita; legado dava 500). Mutacoes sem token retornam 401 via guard (legado dava 403 — mudanca aprovada na F2). `findByIdAndUpdate` usa `returnDocument: "after"`.

---

### T7 — States endpoint [P]

**Status:** [x] concluida em 2026-06-14.  
**What:** Port `GET/POST/PATCH/DELETE /states` with `countryParentCode` support and protected mutations.  
**Where:** `apps/api/src/geo/states.*.ts`, `apps/api/test/states.e2e-spec.ts`  
**Depends on:** T3, T5  
**Reuses:** `yan-site-api-node/routes/states.js`, `use-cases/states.js`, `models/State.js`  
**Requirement:** R1, R2, R6, R9  

**Done when:**

- [ ] `GET /states` returns sorted-by-name documents with legacy shape.
- [ ] `POST /states` persists `{ name, code, countryParentCode }`.
- [ ] `PATCH /states/:id` updates all editable fields.
- [ ] `DELETE /states/:id` returns 204.
- [ ] Mutations reject missing/invalid tokens with 401.
- [ ] DTO validation rejects unknown/operator-style body fields.
- [ ] Sentiness post-edit passes.

**Tests:** e2e  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port states endpoints`

---

### T8 — Cities endpoint [P]

**Status:** [x] concluida em 2026-06-14.  
**What:** Port `GET/POST/PATCH/DELETE /cities` with `countryParentCode` and `stateParentCode` support and protected mutations.  
**Where:** `apps/api/src/geo/cities.*.ts`, `apps/api/test/cities.e2e-spec.ts`  
**Depends on:** T3, T5  
**Reuses:** `yan-site-api-node/routes/cities.js`, `use-cases/cities.js`, `models/City.js`  
**Requirement:** R1, R2, R6, R9  

**Done when:**

- [ ] `GET /cities` returns sorted-by-name documents with legacy shape.
- [ ] `POST /cities` persists `{ name, code, countryParentCode, stateParentCode }`.
- [ ] `PATCH /cities/:id` updates all editable fields.
- [ ] `DELETE /cities/:id` returns 204.
- [ ] Mutations reject missing/invalid tokens with 401.
- [ ] DTO validation rejects unknown/operator-style body fields.
- [ ] Sentiness post-edit passes.

**Tests:** e2e  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port cities endpoints`

---

### T9 — Storage module [P]

**Status:** [x] concluida em 2026-06-14.  
**What:** Port S3 upload/delete as injectable storage service with test-time mockability and no module-level mutable client state.  
**Where:** `apps/api/src/storage/`, `apps/api/src/config/`  
**Depends on:** T1, T2  
**Reuses:** `yan-site-api-node/services/S3.js`, `.specs/codebase/INTEGRATIONS.md`  
**Requirement:** R1, R4, R9  

**Done when:**

- [ ] `StorageService.uploadImage(key, buffer, contentType)` sends `PutObjectCommand` and returns the relative key.
- [ ] `StorageService.deleteImages(keys)` sends `DeleteObjectsCommand` with all supplied keys and treats empty lists safely.
- [ ] Bucket credentials, endpoint, region, and bucket name come from config.
- [ ] Unit tests use an SDK mock and never hit real S3.
- [ ] No full URLs are returned by storage; URL prefixing remains T4's job.
- [ ] Sentiness post-edit passes.

**Tests:** unit  
**Gate:** API quick + Sentiness post-edit  
**Commit:** `feat(api): add storage service`

**Implementation notes:** `S3Client` injetado via token `S3_CLIENT` (factory no `StorageModule` a partir do `ConfigService`, sem cliente mutavel a nivel de modulo); `BUCKET_API` opcional vira `endpoint` so quando presente. `uploadImage` retorna a key relativa (nunca URL); `deleteImages([])` e no-op. Testes usam `aws-sdk-client-mock`. `StorageModule` ainda nao e importado pelo `AppModule` — sera consumido pelo `ImagesModule` (T14/T15) antes da checagem standard/knip da T16.

---

### T10 — Google Vision and Geocoding module [P]

**What:** Port Google Vision label/color extraction and Google Maps reverse geocoding as injectable services with mocked HTTP tests and no response dumps in logs.  
**Where:** `apps/api/src/google/`  
**Depends on:** T1, T2  
**Reuses:** `yan-site-api-node/services/google.js`, `.specs/codebase/INTEGRATIONS.md`  
**Requirement:** R1, R4, R9  

**Done when:**

- [ ] Vision request uses optimized image public URLs formed from `BUCKET_URL` + relative key.
- [ ] `LABEL_DETECTION` is requested only for the first image; `IMAGE_PROPERTIES` is requested for every image.
- [ ] Colors are mapped to `{ red, green, blue, score, pixelFraction }`.
- [ ] Geocoding extracts `city`, `state`, and `country` using the same component precedence as legacy.
- [ ] Tests mock HTTP and cover missing labels/colors and missing geocoding results.
- [ ] No logs expose full external payloads.
- [ ] Sentiness post-edit passes.

**Tests:** unit  
**Gate:** API quick + Sentiness post-edit  
**Commit:** `feat(api): port google metadata services`

---

### T11 — Metadata and image derivative service [P]

**What:** Port EXIF profile extraction and derivative generation, including the F2 correction to read EXIF from the file named `Original` when present.  
**Where:** `apps/api/src/images/metadata/`, `apps/api/src/images/image-processing.service.ts`  
**Depends on:** T1, T2  
**Reuses:** `yan-site-api-node/helpers/metadata.js`, `use-cases/images.js:uploadImage`, `packages/shared/src/image.ts`  
**Requirement:** R4, R8  

**Done when:**

- [ ] Camera profile mapping preserves iPhone 12 Pro Max, Poco X3 Pro, DJI Mini 2, GoPro Hero9, Sony ZV-E10, Lumia 640, `"--"`, and generic fallback behavior.
- [ ] `DateTimeOriginal` conversion preserves legacy output semantics.
- [ ] Width/height-derived fields use full size / 3 for optimized and / 10 for thumbnail.
- [ ] If EXIF lacks dimensions, service falls back to `sharp().metadata()` before failing.
- [ ] Derivative generation creates lazy webp base64, thumbnail, optimized, and full-size buffers with expected names/content types.
- [ ] Unit tests cover original-file selection, no-Original fallback, missing dimensions fallback, and at least one known camera profile plus generic fallback.
- [ ] Sentiness post-edit passes.

**Tests:** unit  
**Gate:** API quick + Sentiness post-edit  
**Commit:** `feat(api): port image metadata processing`

---

### T12 — Tags endpoint and sync [P]

**Status:** [x] concluida em 2026-06-14.  
**What:** Port `GET/POST/PATCH/DELETE /tags` and `POST /tags/sync`, including image tag cleanup.  
**Where:** `apps/api/src/tags/`, `apps/api/test/tags.e2e-spec.ts`  
**Depends on:** T3, T5  
**Reuses:** `yan-site-api-node/routes/tags.js`, `use-cases/tags.js`, `models/Tag.js`  
**Requirement:** R1, R2, R6  

**Done when:**

- [ ] `GET /tags` returns sorted-by-name documents with legacy shape.
- [ ] `POST /tags` returns 201 and persists `{ name, code }`.
- [ ] `POST /tags/sync` returns 201 with `null` body-equivalent behavior and removes image tags not present in the tag collection.
- [ ] `PATCH /tags/:id` returns 200 with updated document.
- [ ] `DELETE /tags/:id` returns 204.
- [ ] Mutations reject missing/invalid tokens with 401.
- [ ] DTO validation rejects unknown/operator-style body fields.
- [ ] Sentiness post-edit passes.

**Tests:** e2e  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port tags endpoints`

**Implementation notes:** `TagsModule` registra os models `Tag` e `Image` (sync precisa varrer imagens) e importa `AuthModule`. `sync()` carrega os nomes de tags num `Set` e usa `updateOne` por imagem removendo tags ausentes; `POST /tags/sync` (protegido) retorna 201 com body vazio (equivalente ao `send(null)` legado). `@Post("sync")` e `@Post()` nao conflitam (paths distintos).

---

### T13 — Public image listing and deep-link contract

**What:** Port `GET /images` with filters, metadata allowlist, sorting, pagination, URL prefixing, and deep-link-by-id limit expansion.  
**Where:** `apps/api/src/images/images.controller.ts`, `apps/api/src/images/images.service.ts`, `apps/api/src/images/dto/list-images.dto.ts`, `apps/api/test/images-list.e2e-spec.ts`  
**Depends on:** T3, T4  
**Reuses:** `yan-site-api-node/use-cases/images.js:listImages`, `routes/images.js`, `.specs/codebase/ARCHITECTURE.md`  
**Requirement:** R2, R3, R6  

**Done when:**

- [ ] Query supports `tags`, `country`, `state`, `city`, `sort`, `order`, `offset`, `limit`, `takenAtFrom/To`, `createdAtFrom/To`, and allowed metadata fields.
- [ ] Unknown metadata/operator query fields are rejected or ignored according to the documented allowlist, eliminating Mongo operator injection.
- [ ] Default pagination remains offset 0 and limit 10.
- [ ] Response shape is exactly `{ images, total }`.
- [ ] Outbound image URLs are absolute via T4.
- [ ] Deep-link `id` expands `limit` from offset 0 so the target image is included, and returns an error when the id is outside the filtered set.
- [ ] E2E tests cover filters, date ranges, sort/order, pagination, URL prefixing, and deep-link expansion.
- [ ] Sentiness post-edit passes.

**Tests:** e2e  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port image listing`

---

### T14 — Image edit and delete

**What:** Port protected `PATCH /images/:id` and `DELETE /images/:id`, preserving edit response shape and S3 cleanup while fixing metadata-absent PATCH and missing-id semantics.  
**Where:** `apps/api/src/images/images.controller.ts`, `apps/api/src/images/images.service.ts`, `apps/api/src/images/dto/edit-image.dto.ts`, `apps/api/test/images-edit-delete.e2e-spec.ts`  
**Depends on:** T3, T4, T5, T9  
**Reuses:** `yan-site-api-node/use-cases/images.js:editImage/deleteImage`, `routes/images.js`  
**Requirement:** R2, R3, R7, R9  

**Done when:**

- [ ] `PATCH /images/:id` accepts partial bodies, including bodies without `metadata`.
- [ ] Absolute URLs in edited `images` and `original` are stripped back to relative keys before persistence.
- [ ] Edited response returns absolute URLs via T4.
- [ ] Missing image returns 404 for PATCH/DELETE as the approved paridade exception.
- [ ] `DELETE /images/:id` deletes all full-size, thumbnail, and optimized keys from original and edited versions before removing the document.
- [ ] Protected routes require JWT and return 401 for missing/invalid token.
- [ ] E2E tests cover partial patch, URL strip, metadata absent, 404, delete key list, and auth failure.
- [ ] Sentiness post-edit passes.

**Tests:** e2e  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port image edit delete`

---

### T15 — Image upload pipeline

**What:** Port protected `POST /images` multipart upload with EXIF, derivatives, S3, Vision, Geocoding, tag allowlist, original/versions split, rollback, and legacy response shape.  
**Where:** `apps/api/src/images/images.controller.ts`, `apps/api/src/images/images.service.ts`, `apps/api/src/images/dto/upload-image.dto.ts`, `apps/api/test/images-upload.e2e-spec.ts`  
**Depends on:** T3, T4, T5, T9, T10, T11, T13  
**Reuses:** `yan-site-api-node/use-cases/images.js:uploadImage`, `routes/images.js`, `helpers/metadata.js`, `services/S3.js`, `services/google.js`  
**Requirement:** R2, R3, R4, R6, R8, R9  

**Done when:**

- [ ] Multipart field `files` maps by index to `versionNames`.
- [ ] File validation enforces image mimetype, max file count, and max file size from config.
- [ ] EXIF comes from the file whose version name is `Original`, falling back to first file.
- [ ] S3 uploads happen for thumbnail, optimized, and full-size objects for every file.
- [ ] Vision colors attach to every version; labels from the first Vision response are filtered against existing `Tag` names.
- [ ] Geocoding runs only when latitude and longitude exist.
- [ ] Stored document keeps relative keys; response returns absolute URLs.
- [ ] On failure after any S3 upload, all uploaded keys are deleted before the request errors.
- [ ] E2E tests cover successful multi-version upload, original-only upload, no-GPS upload, tag filtering, file validation, and rollback.
- [ ] Sentiness post-edit passes.

**Tests:** e2e + unit coverage from dependencies  
**Gate:** API full + Sentiness post-edit  
**Commit:** `feat(api): port image upload pipeline`

---

### T16 — F2 acceptance, legacy front smoke, and handoff

**What:** Run full gates, execute the documented legacy-front acceptance checklist against the Nest API, and refresh project state/handoff for F3 continuation.  
**Where:** `.specs/features/02-api-nest-port/acceptance.md`, `.specs/project/STATE.md`, `.specs/HANDOFF.md`, optional README env notes if implementation adds required setup details  
**Depends on:** T6, T7, T8, T12, T13, T14, T15  
**Reuses:** `.specs/features/02-api-nest-port/spec.md` R11, `.specs/HANDOFF.md`, `yan-site-front-vue/.env.example`  
**Requirement:** R10, R11, acceptance criteria 1-3  

**Done when:**

- [ ] `pnpm --filter api test` passes with contract/e2e coverage for all F2 routes.
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` passes under Node 26.
- [ ] Sentiness standard pre-done returns `summary.status: ok`.
- [ ] Legacy Vue front is run with `VUE_APP_API_URL` pointing to the Nest API.
- [ ] Manual/smoke checklist covers login, public gallery, filters, deep-link, upload multi-version, edit, and delete.
- [ ] Acceptance doc records env used, commands, and any consciously accepted contract exception.
- [ ] Handoff says F2 is complete and points next agent back to F3 full Nuxt port.
- [ ] No code from `services/tensorFlow.js`, `AboutView.vue`, or other documented dead code was migrated.

**Tests:** full repo + manual acceptance  
**Gate:** Repo standard + Sentiness pre-done  
**Commit:** `docs: record api port acceptance`

## Parallel Execution Map

```text
Sequential foundation:
  T1 -> T2 -> T3

After T2:
  T9 [P] storage
  T10 [P] google services
  T11 [P] metadata/image processing

After T3:
  T4 url helpers
  T5 auth

After T5:
  T6 [P] countries
  T7 [P] states
  T8 [P] cities
  T12 [P] tags

After T3 + T4:
  T13 image listing

After T3 + T4 + T5 + T9:
  T14 image edit/delete

After T3 + T4 + T5 + T9 + T10 + T11 + T13:
  T15 image upload

Final:
  T16 acceptance/handoff
```

## Validation Tables

### Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | API config/bootstrap surface | OK |
| T2 | Test harness and fixtures | OK |
| T3 | Database schemas/repositories | OK |
| T4 | Pure URL/key mapping helpers | OK |
| T5 | Auth endpoint and guard | OK |
| T6 | Countries resource | OK |
| T7 | States resource | OK |
| T8 | Cities resource | OK |
| T9 | Storage service | OK |
| T10 | Google service | OK |
| T11 | Metadata/derivative service | OK |
| T12 | Tags resource and sync | OK |
| T13 | Public image listing endpoint | OK |
| T14 | Image edit/delete endpoints | OK |
| T15 | Image upload endpoint/pipeline | OK |
| T16 | Acceptance and handoff | OK |

### Diagram-Definition Cross-Check

| Task | Depends on | Diagram shows | Status |
| --- | --- | --- | --- |
| T1 | F1 complete | Start | OK |
| T2 | T1 | T1 -> T2 | OK |
| T3 | T2 | T2 -> T3 | OK |
| T4 | T2 | T2 -> T4 | OK |
| T5 | T3 | T3 -> T5 | OK |
| T6 | T3, T5 | T3 + T5 -> T6 | OK |
| T7 | T3, T5 | T3 + T5 -> T7 | OK |
| T8 | T3, T5 | T3 + T5 -> T8 | OK |
| T9 | T1, T2 | T1 + T2 -> T9 | OK |
| T10 | T1, T2 | T1 + T2 -> T10 | OK |
| T11 | T1, T2 | T1 + T2 -> T11 | OK |
| T12 | T3, T5 | T3 + T5 -> T12 | OK |
| T13 | T3, T4 | T3 + T4 -> T13 | OK |
| T14 | T3, T4, T5, T9 | T3 + T4 + T5 + T9 -> T14 | OK |
| T15 | T3, T4, T5, T9, T10, T11, T13 | T3 + T4 + T5 + T9 + T10 + T11 + T13 -> T15 | OK |
| T16 | T6, T7, T8, T12, T13, T14, T15 | All route tasks -> T16 | OK |

### Test Co-location Validation

| Task | Code layer changed | Required test | Task says | Status |
| --- | --- | --- | --- | --- |
| T1 | API bootstrap/config | unit/config smoke | unit/config smoke | OK |
| T2 | Test infrastructure | integration harness | integration harness | OK |
| T3 | Mongoose schemas/repositories | integration | integration | OK |
| T4 | Pure image helpers | unit | unit | OK |
| T5 | Auth controller/service/guard | e2e + unit | e2e + unit | OK |
| T6 | Countries controller/service | e2e | e2e | OK |
| T7 | States controller/service | e2e | e2e | OK |
| T8 | Cities controller/service | e2e | e2e | OK |
| T9 | Storage provider | unit with SDK mock | unit | OK |
| T10 | Google provider | unit with HTTP mock | unit | OK |
| T11 | Metadata/image processing | unit | unit | OK |
| T12 | Tags controller/service | e2e | e2e | OK |
| T13 | Images list controller/service | e2e | e2e | OK |
| T14 | Images edit/delete controller/service | e2e | e2e | OK |
| T15 | Images upload controller/service | e2e + unit dependencies | e2e + unit coverage from dependencies | OK |
| T16 | Acceptance docs/state | full repo + manual acceptance | full repo + manual acceptance | OK |

## Execution Notes

- F2 deliberately does not add `favorite`; that belongs to F3.
- Do not port `services/tensorFlow.js` or other dead code listed in `.specs/codebase/CONCERNS.md`.
- Contract differences allowed by spec: JWT expiration is fixed, protected auth failures use 401, and missing image ids may return 404.
- All external services must be mocked in automated tests. Real S3, Google APIs, and production Mongo are only for the final manual acceptance when explicitly configured.
- Each implementation task should update this file from `[ ]` to `[x]` only after its own gate and Sentiness post-edit pass.
