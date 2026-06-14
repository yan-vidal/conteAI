<template>
  <v-container class="route-shell">
    <p class="eyebrow">
      {{ $t("gallery.eyebrow") }}
    </p>
    <h1>{{ $t("gallery.title") }}</h1>
    <dl
      class="query-preview"
      aria-label="Gallery deep-link query"
    >
      <div>
        <dt>id</dt>
        <dd data-testid="gallery-route-id">
          {{ queryText.id }}
        </dd>
      </div>
      <div>
        <dt>version</dt>
        <dd data-testid="gallery-route-version">
          {{ queryText.version }}
        </dd>
      </div>
      <div>
        <dt>city</dt>
        <dd data-testid="gallery-route-city">
          {{ queryText.city }}
        </dd>
      </div>
      <div>
        <dt>tag</dt>
        <dd data-testid="gallery-route-tag">
          {{ queryText.tag }}
        </dd>
      </div>
    </dl>
  </v-container>
</template>

<script setup lang="ts">
import { useRoute } from "#imports";
import type { LocationQueryValue } from "vue-router";
import { computed } from "vue";

const route = useRoute();

const toQueryText = (
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => item !== null).join(",");
  }

  return value ?? "";
};

const queryText = computed(() => ({
  city: toQueryText(route.query.city),
  id: toQueryText(route.query.id),
  tag: toQueryText(route.query.tag),
  version: toQueryText(route.query.version),
}));
</script>

<style scoped>
.route-shell {
  min-height: calc(100vh - 40px);
  padding-block: 32px;
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

.query-preview {
  display: grid;
  gap: 8px;
  margin-block: 24px 0;
  max-width: 480px;
}

.query-preview div {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
}

dt {
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.875rem;
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
