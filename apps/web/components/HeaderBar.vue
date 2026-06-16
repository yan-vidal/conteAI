<template>
  <v-app-bar
    class="header-bar"
    density="compact"
    height="40"
  >
    <NuxtLink
      class="brand-link"
      to="/gallery"
    >
      ConteAI
    </NuxtLink>
    <v-spacer />
    <v-btn
      :aria-label="$t('header.toggleTheme')"
      :icon="dark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
      variant="text"
      @click="toggleTheme"
    />
  </v-app-bar>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { useTheme as useVuetifyTheme } from "vuetify";
import { useThemeStore } from "../stores/theme.js";

const themeStore = useThemeStore();
const { dark, vuetifyTheme } = storeToRefs(themeStore);
const vuetifyThemeService = useVuetifyTheme();

const toggleTheme = (): void => {
  themeStore.toggle();
};

watch(
  vuetifyTheme,
  (themeName) => {
    vuetifyThemeService.change(themeName);
  },
  { immediate: true },
);
</script>

<style scoped>
.header-bar {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-link {
  color: rgb(var(--v-theme-primary));
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
  padding-inline: 16px;
  text-decoration: none;
}
</style>
