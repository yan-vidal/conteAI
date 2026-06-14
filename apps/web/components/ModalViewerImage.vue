<template>
  <section
    class="modal-viewer"
    data-testid="modal-viewer"
    :style="modalStyle"
    tabindex="0"
    @keydown="handleKeyDown"
    @touchend="handleTouchEnd"
    @touchstart="handleTouchStart"
  >
    <div class="viewer-stage">
      <button
        class="close-button"
        type="button"
        @click="$emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
      <img
        :alt="imageAlt"
        data-testid="modal-image"
        :src="activeVersion.optimizedUrl"
      >
      <div class="version-controls">
        <button
          v-for="(versionItem, index) in image.images"
          :key="versionItem.optimizedUrl"
          :class="{ active: !showOriginal && activeIndex === index }"
          type="button"
          @click="selectVersion(index)"
        >
          {{ versionItem.versionName || `V${index + 1}` }}
        </button>
        <button
          :class="{ active: showOriginal }"
          type="button"
          @click="selectOriginal"
        >
          Original
        </button>
      </div>
    </div>

    <aside class="viewer-details">
      <p class="location">
        {{ locationText }}
      </p>
      <div
        v-if="mapsLink && streetViewLink"
        class="location-links"
      >
        <a
          data-testid="maps-link"
          :href="mapsLink"
          rel="noreferrer"
          target="_blank"
        >
          Google Maps
        </a>
        <a
          data-testid="street-view-link"
          :href="streetViewLink"
          rel="noreferrer"
          target="_blank"
        >
          Street View
        </a>
      </div>

      <dl class="metadata">
        <div v-if="image.metadata.camera">
          <dt>Camera</dt>
          <dd>{{ image.metadata.camera }}</dd>
        </div>
        <div v-if="image.metadata.lens">
          <dt>Lens</dt>
          <dd>{{ image.metadata.lens }}</dd>
        </div>
        <div v-if="image.metadata.shutterSpeed">
          <dt>Shutter</dt>
          <dd>{{ image.metadata.shutterSpeed }}</dd>
        </div>
        <div v-if="image.metadata.aperture">
          <dt>Aperture</dt>
          <dd>{{ image.metadata.aperture }}</dd>
        </div>
        <div v-if="image.metadata.iso">
          <dt>ISO</dt>
          <dd>{{ image.metadata.iso }}</dd>
        </div>
        <div>
          <dt>White balance</dt>
          <dd>{{ image.metadata.whiteBalance }}</dd>
        </div>
      </dl>

      <p
        v-if="image.description"
        class="description"
      >
        {{ image.description }}
      </p>

      <div
        class="palette"
        aria-label="Color palette"
      >
        <button
          v-for="(color, index) in activeVersion.colorPalette"
          :key="`${color.red}-${color.green}-${color.blue}-${index}`"
          :aria-label="`Copy ${toHexColor(color)}`"
          class="palette-color"
          :data-testid="`palette-color-${index}`"
          :style="{ backgroundColor: toRgbColor(color) }"
          type="button"
          @click="copyColorCode(color)"
        />
      </div>

      <div class="tags">
        <span
          v-for="tag in image.tags"
          :key="tag"
        >
          {{ tag }}
        </span>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import type { ColorPalette, ImageDocument, ImageVersion } from "@conteai/shared";
import { computed, ref, watch } from "vue";
import { calculateModalSize } from "../utils/modalResize.js";

const props = defineProps<{
  readonly image: ImageDocument;
  readonly isRotated: boolean;
  readonly version?: string;
}>();

const emit = defineEmits<{
  close: [];
  next: [];
  prev: [];
  version: [version: string];
}>();

const versionToIndex = (version: string | undefined): number => {
  const numeric = Number(version);

  if (!Number.isInteger(numeric) || numeric < 1) {
    return 0;
  }

  return Math.min(numeric - 1, Math.max(props.image.images.length - 1, 0));
};

const activeIndex = ref(versionToIndex(props.version));
const showOriginal = ref(
  props.version === "original" || props.image.images.length === 0,
);
const touchStartX = ref<number | null>(null);

const activeVersion = computed<ImageVersion>(() =>
  showOriginal.value
    ? props.image.original
    : props.image.images[activeIndex.value] ?? props.image.original,
);

const imageAlt = computed(
  () =>
    props.image.description ||
    [props.image.city, props.image.state, props.image.country]
      .filter(Boolean)
      .join(", "),
);

const locationText = computed(() =>
  [props.image.country, props.image.state, props.image.city]
    .filter(Boolean)
    .join(", "),
);

const mapsLink = computed(() => {
  const { latitude, longitude } = props.image.metadata;

  if (latitude === undefined || longitude === undefined) {
    return "";
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
});

const streetViewLink = computed(() => {
  const { cameraTrueDirection, latitude, longitude } = props.image.metadata;

  if (latitude === undefined || longitude === undefined) {
    return "";
  }

  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}&heading=${cameraTrueDirection ?? 0}&pitch=0&fov=90`;
});

const modalStyle = computed(() => {
  const size = calculateModalSize({
    imageHeight: props.image.metadata.optimizedHeight,
    imageWidth: props.image.metadata.optimizedWidth,
    isRotated: props.isRotated,
    viewportHeight: globalThis.document?.documentElement.clientHeight ?? 800,
    viewportWidth: globalThis.document?.documentElement.clientWidth ?? 1280,
  });

  return {
    "--modal-image-height": String(size.height),
    "--modal-image-width": String(size.width),
  };
});

const toHexPart = (value: number): string =>
  value.toString(16).padStart(2, "0");

const toHexColor = (color: ColorPalette): string =>
  `#${toHexPart(color.red)}${toHexPart(color.green)}${toHexPart(color.blue)}`;

const toRgbColor = (color: ColorPalette): string =>
  `rgb(${color.red}, ${color.green}, ${color.blue})`;

const copyColorCode = async (color: ColorPalette): Promise<void> => {
  await globalThis.navigator.clipboard.writeText(toHexColor(color));
};

const selectVersion = (index: number): void => {
  activeIndex.value = index;
  showOriginal.value = false;
  emit("version", String(index + 1));
};

const selectOriginal = (): void => {
  showOriginal.value = true;
  emit("version", "original");
};

const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
  if (event.shiftKey && event.key === "ArrowLeft") {
    selectVersion(
      (activeIndex.value - 1 + props.image.images.length) %
        props.image.images.length,
    );
  } else if (event.shiftKey && event.key === "ArrowRight") {
    selectVersion((activeIndex.value + 1) % props.image.images.length);
  } else if (event.key === "Escape") {
    emit("close");
  } else if (event.key === "ArrowLeft") {
    emit("prev");
  } else if (event.key === "ArrowRight") {
    emit("next");
  }
};

const handleTouchStart = (event: globalThis.TouchEvent): void => {
  touchStartX.value = event.changedTouches[0]?.clientX ?? null;
};

const handleTouchEnd = (event: globalThis.TouchEvent): void => {
  if (touchStartX.value === null) {
    return;
  }

  const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.value;
  const delta = touchStartX.value - touchEndX;
  touchStartX.value = null;

  if (Math.abs(delta) < 40) {
    return;
  }

  if (delta > 0) {
    emit("next");
  } else {
    emit("prev");
  }
};

watch(
  () => props.version,
  (version) => {
    showOriginal.value =
      version === "original" || props.image.images.length === 0;
    activeIndex.value = versionToIndex(version);
  },
);
</script>

<style scoped>
.modal-viewer {
  background: rgba(0, 0, 0, 0.88);
  border-radius: 8px;
  color: #f5f5f5;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
  inset: 56px 16px 24px;
  padding: 16px;
  position: fixed;
  z-index: 1000;
}

.viewer-stage {
  align-items: center;
  display: grid;
  justify-items: center;
  min-width: 0;
  position: relative;
}

.viewer-stage img {
  max-height: min(var(--modal-image-height), calc(100vh - 128px));
  max-width: min(var(--modal-image-width), 100%);
  object-fit: contain;
}

.close-button {
  background: rgba(255, 255, 255, 0.14);
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  font-size: 1.25rem;
  height: 32px;
  position: absolute;
  right: 0;
  top: 0;
  width: 32px;
}

.version-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}

.version-controls button,
.palette-color {
  cursor: pointer;
}

.version-controls button {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  color: #fff;
  min-height: 30px;
  padding: 0 12px;
}

.version-controls .active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.viewer-details {
  display: grid;
  gap: 12px;
  overflow: auto;
}

.location {
  font-weight: 700;
  margin: 0;
}

.location-links,
.tags,
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.location-links a {
  color: rgb(var(--v-theme-secondary));
}

.metadata {
  display: grid;
  gap: 8px;
  margin: 0;
}

.metadata div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
}

.metadata dt {
  color: rgba(255, 255, 255, 0.64);
}

.metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.description {
  margin: 0;
}

.palette-color {
  border: 1px solid rgba(255, 255, 255, 0.24);
  height: 28px;
  width: 28px;
}

.tags span {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 4px 10px;
}

@media (max-width: 760px) {
  .modal-viewer {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
