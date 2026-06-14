<template>
  <v-container class="gallery-shell">
    <section class="gallery-header">
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
      <v-select
        v-model="selectedTags"
        clearable
        density="compact"
        :items="tags"
        item-title="name"
        item-value="name"
        :label="$t('gallery.tags')"
        multiple
        variant="solo-filled"
      />
    </section>

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
        <img
          :alt="imageAlt(image)"
          loading="lazy"
          :src="thumbnailUrl(image)"
        >
        <figcaption>{{ imageAlt(image) }}</figcaption>
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

    <div class="load-more">
      <v-btn
        v-if="hasMore"
        :loading="loadingMore"
        variant="tonal"
        @click="loadMore"
      >
        {{ $t("gallery.loadMore") }}
      </v-btn>
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
import { computed, ref, watch } from "vue";
import type { LocationQueryValue } from "vue-router";
import { useAsyncData, useRoute, useRouter } from "#imports";
import { type GalleryQuery, useApi } from "../composables/useApi.js";

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

const toQueryArray = (
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => entry !== null);
  }

  return value ? [value] : [];
};

const toQueryText = (
  value: LocationQueryValue | LocationQueryValue[] | undefined,
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

const thumbnailUrl = (image: ImageDocument): string =>
  image.images[0]?.thumbnailUrl ?? image.original.thumbnailUrl;

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

const refreshImages = async (): Promise<void> => {
  errorMessage.value = "";

  try {
    const response = await fetchImages(0, showAll.value);
    items.value = response.images;
    total.value = response.total;
  } catch {
    errorMessage.value = "Image not found";
    items.value = [];
    total.value = 0;
  }
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

if (showAll.value && toQueryText(route.query.all) !== "true") {
  await replaceRouteQuery();
}
</script>

<style scoped>
.gallery-shell {
  min-height: calc(100vh - 40px);
  padding-block: 24px 96px;
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
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-block: 20px 12px;
}

.query-preview {
  display: none;
}

.image-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
}

.image-tile {
  margin: 0;
}

.image-tile img {
  aspect-ratio: 1;
  border-radius: 8px;
  display: block;
  object-fit: cover;
  width: 100%;
}

.image-tile figcaption {
  font-size: 0.8125rem;
  line-height: 1.3;
  margin-top: 6px;
  overflow-wrap: anywhere;
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

@media (max-width: 720px) {
  .gallery-header {
    display: grid;
  }

  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
