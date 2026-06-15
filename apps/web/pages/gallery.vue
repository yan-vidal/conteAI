<template>
  <v-container class="gallery-shell">
    <section
      v-if="!selectedImage && !showAll"
      class="gallery-header"
    >
      <div>
        <p class="eyebrow">
          {{ $t("gallery.eyebrow") }}
        </p>
        <h1>{{ $t("gallery.title") }}</h1>
      </div>
      <div
        class="favorite-toggle"
        aria-label="Gallery mode"
      >
        <v-btn
          :color="showAll ? undefined : 'primary'"
          data-testid="show-favorites"
          :variant="showAll ? 'text' : 'flat'"
          @click="setAllMode(false)"
        >
          {{ $t("gallery.favorites") }}
        </v-btn>
        <v-btn
          :color="showAll ? 'primary' : undefined"
          data-testid="show-all"
          :variant="showAll ? 'flat' : 'text'"
          @click="setAllMode(true)"
        >
          {{ $t("gallery.all") }}
        </v-btn>
      </div>
    </section>

    <section
      class="filters"
      aria-label="Gallery filters"
    >
      <v-select
        v-model="selectedCountries"
        clearable
        density="compact"
        :items="countries"
        item-title="name"
        item-value="name"
        :label="$t('gallery.country')"
        multiple
        variant="solo-filled"
      />
      <v-select
        v-model="selectedStates"
        clearable
        density="compact"
        :items="availableStates"
        item-title="name"
        item-value="name"
        :label="$t('gallery.state')"
        multiple
        variant="solo-filled"
      />
      <v-select
        v-model="selectedCities"
        clearable
        density="compact"
        :items="availableCities"
        item-title="name"
        item-value="name"
        :label="$t('gallery.city')"
        multiple
        variant="solo-filled"
      />
    </section>

    <div
      class="theme-switch-top"
      aria-label="Gallery theme"
    >
      <v-icon
        class="switch-icon"
        size="16"
      >
        mdi-white-balance-sunny
      </v-icon>
      <v-switch
        :model-value="dark"
        density="compact"
        hide-details
        @update:model-value="toggleTheme"
      />
      <v-icon
        class="switch-icon"
        size="16"
      >
        mdi-weather-night
      </v-icon>
    </div>

    <dl
      class="query-preview"
      aria-label="Gallery deep-link query"
    >
      <div>
        <dt>id</dt>
        <dd data-testid="gallery-route-id">
          {{ idOpen }}
        </dd>
      </div>
      <div>
        <dt>version</dt>
        <dd data-testid="gallery-route-version">
          {{ versionOpen }}
        </dd>
      </div>
      <div>
        <dt>city</dt>
        <dd data-testid="gallery-route-city">
          {{ selectedCities.join(",") }}
        </dd>
      </div>
      <div>
        <dt>tag</dt>
        <dd data-testid="gallery-route-tag">
          {{ selectedTags.join(",") }}
        </dd>
      </div>
    </dl>

    <v-alert
      v-if="errorMessage"
      class="mt-4"
      density="compact"
      type="error"
    >
      {{ errorMessage }}
    </v-alert>

    <section
      v-if="items.length > 0"
      class="image-grid"
      aria-label="Gallery images"
    >
      <figure
        v-for="image in items"
        :key="image._id"
        class="image-tile"
      >
        <button
          class="image-button"
          type="button"
          @click="openImage(image)"
        >
          <span
            aria-hidden="true"
            class="thumb-placeholder"
            :style="lazyThumbnailStyle(image)"
          />
          <img
            :alt="imageAlt(image)"
            loading="lazy"
            :src="thumbnailUrl(image)"
          >
        </button>
        <figcaption class="sr-only">
          {{ imageAlt(image) }}
        </figcaption>
      </figure>
    </section>

    <section
      v-else-if="!pending"
      class="empty-state"
    >
      <h2>{{ $t("gallery.emptyFavoritesTitle") }}</h2>
      <p>{{ $t("gallery.emptyFavoritesText") }}</p>
      <button
        v-if="!showAll"
        class="empty-action"
        data-testid="show-all-empty"
        type="button"
        @click="setAllMode(true)"
      >
        {{ $t("gallery.showAllEmpty") }}
      </button>
    </section>

    <div
      ref="loadSentinel"
      class="load-more"
    >
      <v-progress-circular
        v-if="hasMore && (filling || loadingMore)"
        indeterminate
        size="32"
      />
    </div>

    <section
      class="filters-bottom"
      aria-label="Gallery secondary filters"
    >
      <v-btn
        class="bottom-pill date-pill"
        variant="flat"
      >
        {{ $t("gallery.date") }}
      </v-btn>
      <v-select
        v-model="selectedTags"
        class="bottom-tags"
        clearable
        density="compact"
        hide-details
        :items="tags"
        item-title="name"
        item-value="name"
        :label="$t('gallery.tags')"
        multiple
        variant="solo-filled"
      />
      <div class="theme-switch-wrapper">
        <v-icon
          class="switch-icon"
          size="16"
        >
          mdi-white-balance-sunny
        </v-icon>
        <v-switch
          :model-value="dark"
          density="compact"
          hide-details
          @update:model-value="toggleTheme"
        />
        <v-icon
          class="switch-icon"
          size="16"
        >
          mdi-weather-night
        </v-icon>
      </div>
    </section>

    <ModalViewerImage
      v-if="selectedImage"
      :image="selectedImage"
      :is-rotated="isRotated"
      :version="versionOpen || undefined"
      @close="closeImage"
      @next="changeImage(1)"
      @prev="changeImage(-1)"
      @version="setVersion"
    />
    <div
      v-if="selectedImage"
      class="nav-buttons"
    >
      <v-btn
        aria-label="Previous image"
        class="nav-button"
        data-testid="prev-image"
        icon="mdi-chevron-left"
        type="button"
        @click="changeImage(-1)"
      />
      <v-btn
        aria-label="Rotate image"
        class="nav-button"
        data-testid="rotate-image"
        :icon="isRotated ? 'mdi-rotate-right' : 'mdi-rotate-left'"
        type="button"
        @click="toggleRotation"
      />
      <v-btn
        aria-label="Next image"
        class="nav-button"
        data-testid="next-image"
        icon="mdi-chevron-right"
        type="button"
        @click="changeImage(1)"
      />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import type {
  City,
  Country,
  ImageDocument,
  State,
  Tag,
} from "@conteai/shared";
import { storeToRefs } from "pinia";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useTheme as useVuetifyTheme } from "vuetify";
import { useAsyncData, useRoute, useRouter } from "#imports";
import ModalViewerImage from "../components/ModalViewerImage.vue";
import { type GalleryQuery, useApi } from "../composables/useApi.js";
import { useThemeStore } from "../stores/theme.js";

type RouteQueryValue = string | null;

interface FilterData {
  readonly countries: Country[];
  readonly states: State[];
  readonly cities: City[];
  readonly tags: Tag[];
}

const perPage = 30;
const route = useRoute();
const router = useRouter();
const api = useApi();
const themeStore = useThemeStore();
const { dark, vuetifyTheme } = storeToRefs(themeStore);
const vuetifyThemeService = useVuetifyTheme();

const toggleTheme = (): void => {
  themeStore.toggle();
};

const toQueryArray = (
  value: RouteQueryValue | RouteQueryValue[] | undefined,
): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => entry !== null);
  }

  return value ? [value] : [];
};

const toQueryText = (
  value: RouteQueryValue | RouteQueryValue[] | undefined,
): string => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => entry !== null).join(",");
  }

  return value ?? "";
};

const isStatusCode = (error: unknown, statusCode: number): boolean => {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return false;
  }

  return error.statusCode === statusCode;
};

const selectedCountries = ref(toQueryArray(route.query.country));
const selectedStates = ref(toQueryArray(route.query.state));
const selectedCities = ref(toQueryArray(route.query.city));
const selectedTags = ref(toQueryArray(route.query.tag));
const startDateOpen = ref(toQueryText(route.query.startDate));
const endDateOpen = ref(toQueryText(route.query.endDate));
const idOpen = ref(toQueryText(route.query.id));
const versionOpen = ref(toQueryText(route.query.version));
const showAll = ref(toQueryText(route.query.all) === "true");
const loadingMore = ref(false);
const errorMessage = ref("");
const selectedImage = ref<ImageDocument | null>(null);
const isRotated = ref(false);

const { data: filterData } = await useAsyncData<FilterData>(
  "gallery-filters",
  async () => {
    const [countries, states, cities, tags] = await Promise.all([
      api.getCountries(),
      api.getStates(),
      api.getCities(),
      api.getTags(),
    ]);

    return { cities, countries, states, tags };
  },
);

const countries = computed(() => filterData.value?.countries ?? []);
const states = computed(() => filterData.value?.states ?? []);
const cities = computed(() => filterData.value?.cities ?? []);
const tags = computed(() => filterData.value?.tags ?? []);

const selectedCountryCodes = computed(() =>
  countries.value
    .filter((country) => selectedCountries.value.includes(country.name))
    .map((country) => country.code),
);

const selectedStateCodes = computed(() =>
  states.value
    .filter((state) => selectedStates.value.includes(state.name))
    .map((state) => state.code),
);

const availableStates = computed(() => {
  if (selectedCountryCodes.value.length === 0) {
    return states.value;
  }

  return states.value.filter((state) =>
    selectedCountryCodes.value.includes(state.countryParentCode ?? ""),
  );
});

const availableCities = computed(() =>
  cities.value.filter((city) => {
    const matchesCountry =
      selectedCountryCodes.value.length === 0 ||
      selectedCountryCodes.value.includes(city.countryParentCode ?? "");
    const matchesState =
      selectedStateCodes.value.length === 0 ||
      selectedStateCodes.value.includes(city.stateParentCode ?? "");

    return matchesCountry && matchesState;
  }),
);

const addArrayQuery = (
  query: GalleryQuery,
  key: "city" | "country" | "state" | "tags",
  values: readonly string[],
): void => {
  if (values.length > 0) {
    query[key] = [...values];
  }
};

const buildImageQuery = (offset: number, allMode: boolean): GalleryQuery => {
  const query: GalleryQuery = {
    limit: perPage,
    offset,
    order: "desc",
    sort: "metadata.takenAt",
  };

  if (!allMode) {
    query.favorite = true;
  }
  if (idOpen.value) {
    query.id = idOpen.value;
  }
  addArrayQuery(query, "country", selectedCountries.value);
  addArrayQuery(query, "state", selectedStates.value);
  addArrayQuery(query, "city", selectedCities.value);
  addArrayQuery(query, "tags", selectedTags.value);
  if (startDateOpen.value) {
    query.takenAtFrom = startDateOpen.value;
  }
  if (endDateOpen.value) {
    query.takenAtTo = endDateOpen.value;
  }

  return query;
};

const fetchImages = async (
  offset: number,
  allMode: boolean,
): Promise<{ images: ImageDocument[]; total: number }> =>
  api.listImages(buildImageQuery(offset, allMode));

const initialImages = await useAsyncData(`gallery-images:${route.fullPath}`, async () => {
  try {
    return await fetchImages(0, showAll.value);
  } catch (error: unknown) {
    if (idOpen.value && !showAll.value && isStatusCode(error, 404)) {
      showAll.value = true;
      return fetchImages(0, true);
    }

    throw error;
  }
});

const items = ref<ImageDocument[]>(initialImages.data.value?.images ?? []);
const total = ref(initialImages.data.value?.total ?? 0);
const pending = computed(() => initialImages.pending.value);
const hasMore = computed(() => items.value.length < total.value);

if (idOpen.value) {
  selectedImage.value =
    items.value.find((image) => image._id === idOpen.value) ?? null;
}

const thumbnailUrl = (image: ImageDocument): string =>
  image.images[0]?.thumbnailUrl ?? image.original.thumbnailUrl;

// The low-resolution base64 placeholder shown blurred while the real thumbnail
// loads, mirroring the legacy v-img lazy-src blur-up. Kept as a plain <img> so
// the gallery stays SSR-visible (v-img only renders client-side).
const lazyThumbnailStyle = (
  image: ImageDocument,
): Record<string, string> => {
  const lazy =
    image.images[0]?.lazyThumbnailBase64 ?? image.original.lazyThumbnailBase64;

  return { "--lazy-thumb": lazy ? `url("${lazy}")` : "none" };
};

const imageAlt = (image: ImageDocument): string =>
  image.description || [image.city, image.state, image.country].filter(Boolean).join(", ");

const cleanSelectedValues = (): void => {
  const stateNames = new Set(availableStates.value.map((state) => state.name));
  const cityNames = new Set(availableCities.value.map((city) => city.name));

  selectedStates.value = selectedStates.value.filter((state) =>
    stateNames.has(state),
  );
  selectedCities.value = selectedCities.value.filter((city) =>
    cityNames.has(city),
  );
};

const buildRouteQuery = (): Record<string, string | string[]> => {
  const query: Record<string, string | string[]> = {};

  if (showAll.value) {
    query.all = "true";
  }
  if (idOpen.value) {
    query.id = idOpen.value;
  }
  if (idOpen.value && versionOpen.value) {
    query.version = versionOpen.value;
  }
  if (selectedCountries.value.length > 0) {
    query.country = [...selectedCountries.value];
  }
  if (selectedStates.value.length > 0) {
    query.state = [...selectedStates.value];
  }
  if (selectedCities.value.length > 0) {
    query.city = [...selectedCities.value];
  }
  if (selectedTags.value.length > 0) {
    query.tag = [...selectedTags.value];
  }
  if (startDateOpen.value) {
    query.startDate = startDateOpen.value;
  }
  if (endDateOpen.value) {
    query.endDate = endDateOpen.value;
  }

  return query;
};

const replaceRouteQuery = async (): Promise<void> => {
  await router.replace({ path: "/gallery", query: buildRouteQuery() });
};

const openImage = async (image: ImageDocument): Promise<void> => {
  selectedImage.value = image;
  isRotated.value = false;
  idOpen.value = image._id ?? "";
  versionOpen.value = image.images.length > 0 ? "1" : "original";
  await replaceRouteQuery();
};

const closeImage = async (): Promise<void> => {
  selectedImage.value = null;
  isRotated.value = false;
  idOpen.value = "";
  versionOpen.value = "";
  await replaceRouteQuery();
};

const toggleRotation = (): void => {
  isRotated.value = !isRotated.value;
};

const setVersion = async (version: string): Promise<void> => {
  versionOpen.value = version;
  await replaceRouteQuery();
};

const changeImage = async (direction: 1 | -1): Promise<void> => {
  if (!selectedImage.value) {
    return;
  }

  const currentIndex = items.value.findIndex(
    (image) => image._id === selectedImage.value?._id,
  );
  const nextImage = items.value[currentIndex + direction];

  if (!nextImage) {
    return;
  }

  selectedImage.value = nextImage;
  idOpen.value = nextImage._id ?? "";
  versionOpen.value = nextImage.images.length > 0 ? "1" : "original";
  await replaceRouteQuery();
};

const refreshImages = async (): Promise<void> => {
  errorMessage.value = "";

  try {
    const response = await fetchImages(0, showAll.value);
    items.value = response.images;
    total.value = response.total;
    selectedImage.value = idOpen.value
      ? items.value.find((image) => image._id === idOpen.value) ?? null
      : null;
  } catch {
    errorMessage.value = "Image not found";
    items.value = [];
    total.value = 0;
  }

  await nextTick();
  await fillToViewport();
};

const setAllMode = async (allMode: boolean): Promise<void> => {
  if (showAll.value === allMode) {
    return;
  }

  showAll.value = allMode;
  await refreshImages();
  await replaceRouteQuery();
};

const loadMore = async (): Promise<void> => {
  if (!hasMore.value || loadingMore.value) {
    return;
  }

  loadingMore.value = true;
  try {
    const response = await fetchImages(items.value.length, showAll.value);
    items.value = [...items.value, ...response.images];
    total.value = response.total;
  } finally {
    loadingMore.value = false;
  }
};

const filling = ref(false);
const loadSentinel = ref<globalThis.HTMLElement | null>(null);
let scrollObserver: globalThis.IntersectionObserver | null = null;

const isSentinelVisible = (): boolean => {
  const el = loadSentinel.value;
  if (!el) {
    return false;
  }

  const rect = el.getBoundingClientRect();
  return rect.top < globalThis.window.innerHeight && rect.bottom > 0;
};

// Mimic the legacy v-infinite-scroll: keep loading pages while the sentinel
// stays within the viewport instead of waiting for a manual button click.
const fillToViewport = async (): Promise<void> => {
  if (filling.value) {
    return;
  }

  filling.value = true;
  try {
    let guard = 0;
    while (hasMore.value && isSentinelVisible() && guard < 50) {
      guard += 1;
      await loadMore();
      await nextTick();
    }
  } finally {
    filling.value = false;
  }
};

onMounted(async () => {
  await nextTick();
  await fillToViewport();

  if (typeof globalThis.IntersectionObserver === "undefined") {
    return;
  }

  scrollObserver = new globalThis.IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      void fillToViewport();
    }
  });
  if (loadSentinel.value) {
    scrollObserver.observe(loadSentinel.value);
  }
});

onBeforeUnmount(() => {
  scrollObserver?.disconnect();
});

watch(
  [selectedCountries, selectedStates, selectedCities, selectedTags],
  async () => {
    cleanSelectedValues();
    idOpen.value = "";
    versionOpen.value = "";
    await replaceRouteQuery();
    await refreshImages();
  },
  { deep: true },
);

watch(
  vuetifyTheme,
  (themeName) => {
    vuetifyThemeService.change(themeName);
  },
  { immediate: true },
);

if (showAll.value && toQueryText(route.query.all) !== "true") {
  await replaceRouteQuery();
}
</script>

<style scoped>
.gallery-shell {
  min-height: 100vh;
  padding: 10px 10px 150px;
}

.gallery-header {
  align-items: start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.eyebrow {
  color: rgb(var(--v-theme-secondary));
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}

h1 {
  color: rgb(var(--v-theme-primary));
  font-size: 2rem;
  letter-spacing: 0;
  line-height: 1.15;
  margin: 0;
}

.favorite-toggle {
  display: flex;
  gap: 6px;
}

.filters {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 4px 0 18px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.theme-switch-top {
  align-items: center;
  background: rgb(var(--v-theme-background));
  display: flex;
  justify-content: center;
  position: absolute;
  right: 20px;
  top: 12px;
  z-index: 11;
}

:deep(.v-select .v-label) {
  font-size: 12px;
  transform: translateY(-11px);
}

:deep(.v-select__menu-icon) {
  display: none;
}

:deep(.v-field) {
  border-radius: 100px !important;
}

.query-preview {
  display: none;
}

.image-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding-inline: 6px;
}

/* Match legacy Vuetify grid breakpoints (sm:600, md:960, lg:1264, xl:1904)
   with columns from img-cols (cols=3 / md=4 / lg=6 / xl=12). */
@media (min-width: 960px) {
  .image-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1264px) {
  .image-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 1904px) {
  .image-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
}

.image-tile {
  margin: 0;
}

.image-button {
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: block;
  font: inherit;
  padding: 0;
  position: relative;
  text-align: left;
  width: 100%;
}

/* Blurred low-res placeholder behind the thumbnail (legacy blur-up). The inset
   negative offset + overflow clip keep the blur bleed within the rounded box. */
.thumb-placeholder {
  border-radius: 8px;
  inset: 0;
  overflow: hidden;
  position: absolute;
  z-index: 0;
}

.thumb-placeholder::before {
  aspect-ratio: 1;
  background-image: var(--lazy-thumb);
  background-position: center;
  background-size: cover;
  content: "";
  filter: blur(12px);
  inset: -8%;
  position: absolute;
}

.image-button img {
  aspect-ratio: 1;
  border-radius: 8px;
  box-shadow: 4px 10px 5px rgba(0, 0, 0, 0.4);
  display: block;
  object-fit: cover;
  position: relative;
  transition: filter 0.3s ease-in-out, transform 0.3s ease-in-out;
  width: 100%;
  z-index: 1;
}

.image-button:hover img {
  filter: brightness(1.08);
  transform: scale(1.05);
}

.sr-only {
  clip: rect(0, 0, 0, 0);
  border: 0;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

.empty-state {
  padding-block: 40px;
  text-align: center;
}

.empty-state h2 {
  color: rgb(var(--v-theme-primary));
  font-size: 1.25rem;
  letter-spacing: 0;
  margin: 0 0 8px;
}

.empty-state p {
  margin: 0 auto 18px;
  max-width: 440px;
}

.empty-action {
  background: rgb(var(--v-theme-primary));
  border: 0;
  border-radius: 4px;
  color: rgb(var(--v-theme-on-primary));
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  min-height: 36px;
  padding: 0 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.filters-bottom {
  align-items: center;
  bottom: 15px;
  display: grid;
  gap: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  left: 50%;
  position: fixed;
  transform: translateX(-50%);
  width: 90vw;
  z-index: 100;
}

.bottom-pill,
.theme-switch-wrapper {
  background: rgb(var(--v-theme-surface));
  border-radius: 100px;
  min-height: 40px;
}

.bottom-pill {
  text-transform: none;
}

.theme-switch-wrapper {
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 0 4px;
}

.theme-switch-wrapper {
  display: none;
}

.switch-icon {
  flex: 0 0 auto;
}

.nav-buttons {
  bottom: 30px;
  display: flex;
  gap: 8px;
  left: 50%;
  position: fixed;
  transform: translateX(-50%);
  z-index: 2401;
}

.nav-button {
  background: rgba(0, 0, 0, 0.86);
  color: #fff;
}

@media (max-width: 720px) {
  .gallery-header {
    display: grid;
  }

  .theme-switch-top {
    display: none;
  }

  .filters {
    gap: 24px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filters-bottom {
    gap: 12px;
    grid-template-columns: minmax(86px, 1fr) minmax(86px, 1fr) minmax(92px, 1fr);
  }

  .theme-switch-wrapper {
    display: flex;
  }
}
</style>
