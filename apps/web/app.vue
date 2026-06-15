<template>
  <v-app>
    <HeaderBar v-if="route.path !== '/gallery'" />
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useRoute } from "#imports";

const route = useRoute();
</script>
