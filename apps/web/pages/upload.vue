<script setup lang="ts">
import { definePageMeta } from "#imports";

definePageMeta({
  middleware: ["auth"],
});
</script>

<template>
  <ClientOnly>
    <v-container class="route-shell">
      <p class="eyebrow">
        {{ $t("upload.eyebrow") }}
      </p>
      <h1>Upload</h1>
    </v-container>
  </ClientOnly>
</template>

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
</style>
