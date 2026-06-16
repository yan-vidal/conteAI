<template>
  <div
    class="theater-mode"
    data-testid="theater-mode"
  >
    <img
      v-if="currentImage"
      :alt="imageAlt(currentImage)"
      class="theater-photo"
      data-testid="theater-image"
      :src="optimizedUrl(currentImage)"
    >
    <v-btn
      :aria-label="$t('theater.exit')"
      class="theater-exit"
      data-testid="theater-exit"
      icon="mdi-close"
      variant="text"
      @click="$emit('exit')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ImageDocument } from "@conteai/shared";
import { computed } from "vue";

const props = defineProps<{
  items: ImageDocument[];
}>();

defineEmits<{
  exit: [];
}>();

// T1 shows the first photo of the active source; the auto-advancing slideshow
// with crossfade and Ken Burns is built in T4.
const currentImage = computed<ImageDocument | null>(
  () => props.items[0] ?? null,
);

const optimizedUrl = (image: ImageDocument): string =>
  image.images[0]?.optimizedUrl ?? image.original.optimizedUrl;

const imageAlt = (image: ImageDocument): string =>
  image.description ||
  [image.city, image.state, image.country].filter(Boolean).join(", ");
</script>

<style scoped>
.theater-mode {
  align-items: center;
  background: #000;
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
  z-index: 2000;
}

.theater-photo {
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.theater-exit {
  color: #fff;
  position: absolute;
  right: 16px;
  top: 16px;
}
</style>
