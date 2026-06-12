# Legacy Visual Baseline

Capture date: 2026-06-12
Legacy app: `yan-site-front-vue`
Legacy API: `https://api.yanlucas.com`

This baseline is the reference for porting the Vue CLI gallery to `apps/web`.
Run only public/read-only flows against production data. Do not use upload,
edit, delete, or authenticated mutations while capturing goldens.

## Pinned Photos

Do not edit these photos in production until the Nuxt port has passed visual
comparison against this baseline.

| Purpose | ID | Route | Notes |
| --- | --- | --- | --- |
| Landscape with GPS | `68ab9c4b992f13858f306ad5` | `/gallery?id=68ab9c4b992f13858f306ad5&version=1` | Japan, Osaka, Museum. Exercises map links and landscape sizing. |
| Portrait with GPS | `68ab9be2992f13858f306a91` | `/gallery?id=68ab9be2992f13858f306a91&version=1` | Japan, Osaka, Night/Art/Museum. Exercises portrait sizing. |
| Multi-version | `67b7eb60084f9f0679bb2b17` | `/gallery?id=67b7eb60084f9f0679bb2b17&version=1` | Japan, Tokyo, Minato City. Versions 1-3 plus original. |
| Long description with GPS | `670f6341b6130f8f74278a0d` | `/gallery?id=670f6341b6130f8f74278a0d&version=1` | Japan, Tokyo, Taito, Senso-ji. Exercises long text and GPS. |
| Long description without GPS | `66ee7b0c2e06e822f24eba66` | `/gallery?id=66ee7b0c2e06e822f24eba66&version=1` | Brazil, Bahia, Lencois, Chapada Diamantina. Exercises long text without map links. |
| Original-only | `66ee7a262e06e822f24eb968` | `/gallery?id=66ee7a262e06e822f24eb968&version=original` | Brazil, Bahia, Lencois. Exercises images with no edited versions. |

## Filtered Routes

Use these routes to capture filter chrome and URL/state synchronization:

- `/gallery?country=Japan&state=Tokyo&city=Taito&tag=Temple`
- `/gallery?country=Brazil&state=Bahia&city=Lençóis&tag=Landscape`
- `/gallery?id=67b7eb60084f9f0679bb2b17&version=1`

## Viewports

All screenshots use `deviceScaleFactor: 1`.

- `mobile-360`: 360 x 800
- `mobile-390`: 390 x 844
- `mobile-landscape`: 844 x 390
- `tablet`: 768 x 1024
- `desktop`: 1366 x 768
- `wide`: 1920 x 1080

## States

- Gallery default, dark theme.
- Gallery default, light theme.
- Gallery filtered.
- Modal landscape.
- Modal portrait.
- Modal with EXIF/details panel expanded.
- Modal rotated.
- Modal multi-version with version delimiters visible.
- Login route `/secretdoor`.
- Protected `/list` redirect/block state without mutating data.

## Determinism Rules

- Run the legacy app locally with `VUE_APP_API_URL=https://api.yanlucas.com`.
- The production API is an external dependency and can be unavailable. Do not
  update goldens from an error page, empty grid, or `Image not found` state.
- Playwright serves the Vue app shell for history routes such as `/gallery`,
  `/secretdoor`, and `/list` because the legacy Vue CLI dev server does not
  directly serve those URLs in local capture mode.
- Disable animations in Playwright.
- Seed Vuex persisted state before navigation:
  - `darkTheme: true` for dark captures.
  - `darkTheme: false` for light captures.
- Wait for the expected route, gallery tiles or modal, and all visible images
  to complete before screenshots.
- Direct image links intentionally load the surrounding image group so arrow
  and gesture navigation have adjacent photos available.
- The rotated modal state is captured from an already hydrated gallery modal so
  the screenshot isolates the rotated layout instead of the direct-link preload
  spinner.
- Do not update goldens to hide unexplained diffs. Investigate and document
  every intentional visual difference during the Nuxt port.
