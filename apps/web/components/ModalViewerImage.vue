<template>
  <section
    class="modal-viewer"
    data-testid="modal-viewer"
    tabindex="0"
    @click.self="$emit('close')"
    @keydown="handleKeyDown"
  >
    <div
      class="viewer-stage"
      :class="{ rotated: isRotated }"
      data-testid="viewer-stage"
      :style="modalStyle"
      @mouseleave="onStageLeave"
      @mouseover="onStageOver"
      @touchend="handleTouchEnd"
      @touchstart="handleTouchStart"
    >
      <span
        aria-hidden="true"
        class="viewer-placeholder"
        :style="placeholderStyle"
      />
      <img
        :alt="imageAlt"
        data-testid="modal-image"
        :src="activeVersion.optimizedUrl"
      >

      <div
        v-if="expandedPanelVisible && image.original"
        class="no-edit-checkbox"
      >
        <v-checkbox
          density="compact"
          :disabled="onlyOriginal"
          :false-icon="editIcon"
          hide-details
          :model-value="showOriginal"
          :true-icon="noEditIcon"
          @update:model-value="toggleOriginal"
        />
      </div>

      <div
        v-if="expandedPanelVisible && image.images.length > 1"
        class="custom-delimiters"
      >
        <v-radio-group
          density="compact"
          hide-details
          inline
          :model-value="showOriginal ? null : activeIndex"
          @update:model-value="onSelectDelimiter"
        >
          <v-radio
            v-for="(versionItem, index) in image.images"
            :key="versionItem.optimizedUrl"
            density="compact"
            :value="index"
          />
        </v-radio-group>
      </div>

      <v-expansion-panels
        v-if="expandedPanelVisible"
        v-model="panelExpanded"
        class="expansion-panel"
      >
        <v-expansion-panel class="expansion-box">
          <v-expansion-panel-title
            class="expansion-title"
            hide-actions
            readonly
            @click="toggleExpansionPanel"
          >
            <v-row justify="space-between">
              <v-col cols="10">
                <v-row>
                  <div class="div-location-button">
                    <v-menu location="top">
                      <template #activator="{ props: menuProps }">
                        <v-btn
                          class="location-button"
                          density="comfortable"
                          size="x-small"
                          style="max-width: 80%; overflow: hidden"
                          v-bind="menuProps"
                        >
                          <div class="scroll-container">
                            <div
                              class="scroll-text"
                              :data-text="fullLocationText"
                            >
                              {{ fullLocationText }}
                            </div>
                          </div>
                        </v-btn>
                        <v-btn
                          class="location-button"
                          density="compact"
                          icon="mdi-plus"
                          size="x-small"
                          v-bind="menuProps"
                        />
                      </template>
                      <v-list
                        id="location-menu"
                        bg-color="rgba(0, 0, 0, 0.7)"
                      >
                        <div
                          class="location-full"
                          @click.stop
                        >
                          <span>{{ locationText }}</span>
                        </div>
                        <v-list-item
                          v-if="mapsLink"
                          class="location-menu"
                          data-testid="maps-link"
                          density="compact"
                          :href="mapsLink"
                          target="_blank"
                        >
                          <v-row>
                            <v-col cols="3">
                              <v-icon><CustomMap /></v-icon>
                            </v-col>
                            <v-col>
                              <v-list-item-title>Google Maps</v-list-item-title>
                            </v-col>
                          </v-row>
                        </v-list-item>
                        <v-list-item
                          v-if="streetViewLink"
                          class="location-menu"
                          data-testid="street-view-link"
                          density="compact"
                          :href="streetViewLink"
                          target="_blank"
                        >
                          <v-row>
                            <v-col cols="3">
                              <v-icon><CustomStreetView /></v-icon>
                            </v-col>
                            <v-col>
                              <v-list-item-title>Street View</v-list-item-title>
                            </v-col>
                          </v-row>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </v-row>
                <v-row>
                  <div>
                    <v-menu location="top">
                      <template #activator="{ props: menuProps }">
                        <v-btn
                          class="datetime-button datetime-photographed"
                          density="comfortable"
                          size="x-small"
                          style="max-width: 82%; overflow: hidden"
                          v-bind="menuProps"
                        >
                          {{ getDateHour(image.metadata.takenAt) }}
                        </v-btn>
                        <v-btn
                          class="datetime-button"
                          density="compact"
                          icon="mdi-plus"
                          size="x-small"
                          v-bind="menuProps"
                        />
                      </template>
                      <v-list
                        id="datetime-menu"
                        bg-color="rgba(0, 0, 0, 0.7)"
                        @click.stop
                      >
                        <v-list-item
                          class="datetime-menu"
                          density="compact"
                        >
                          <v-row>
                            <v-col cols="2">
                              <v-icon><CustomPhotographed /></v-icon>
                            </v-col>
                            <v-col>
                              <v-list-item-title>
                                {{ getDateHour(image.metadata.takenAt) }}
                              </v-list-item-title>
                            </v-col>
                          </v-row>
                        </v-list-item>
                        <v-list-item
                          class="datetime-menu"
                          density="compact"
                        >
                          <v-row>
                            <v-col cols="2">
                              <v-icon><CustomPost /></v-icon>
                            </v-col>
                            <v-col>
                              <v-list-item-title>
                                {{ getDateHour(image.createdAt) }}
                              </v-list-item-title>
                            </v-col>
                          </v-row>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </v-row>
              </v-col>
              <v-col
                class="d-flex justify-end arrow-expand-panel"
                cols="2"
              >
                <v-btn
                  class="expand-button"
                  density="compact"
                  :icon="panelExpanded === null ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  size="small"
                />
              </v-col>
            </v-row>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card class="card-pallete-colors">
              <v-row
                align="center"
                justify="center"
              >
                <v-col
                  class="align-center"
                  cols="auto"
                >
                  <div class="color-palette">
                    <button
                      v-for="(color, index) in activeVersion.colorPalette"
                      :key="`${color.red}-${color.green}-${color.blue}-${index}`"
                      :aria-label="`Copy ${toHexColor(color)}`"
                      class="color-box"
                      :data-testid="`palette-color-${index}`"
                      :style="{ backgroundColor: toRgbColor(color) }"
                      type="button"
                      @click="copyColorCode(color)"
                    />
                  </div>
                </v-col>
              </v-row>
            </v-card>
            <v-card class="card-description-tags">
              <v-tabs
                v-model="tab"
                align-tabs="center"
                color="white"
                density="compact"
              >
                <v-row justify="center">
                  <v-col :cols="image.description ? 4 : 6">
                    <v-tab :value="1">
                      <v-icon icon="mdi-cog-outline" />
                    </v-tab>
                  </v-col>
                  <v-col
                    v-if="image.description"
                    cols="4"
                  >
                    <v-tab :value="2">
                      <v-icon icon="mdi-text-box-outline" />
                    </v-tab>
                  </v-col>
                  <v-col :cols="image.description ? 4 : 6">
                    <v-tab :value="3">
                      <v-icon icon="mdi-tag-multiple" />
                    </v-tab>
                  </v-col>
                </v-row>
              </v-tabs>
              <v-card-text
                class="text-specs-description-tags"
                :style="{ 'max-height': heightThirtyPercent, 'overflow-y': 'auto' }"
              >
                <v-tabs-window v-model="tab">
                  <v-tabs-window-item :value="1">
                    <v-row>
                      <v-col class="d-flex justify-space-between">
                        <v-icon><CustomCamera /></v-icon>
                        {{ image.metadata.camera }}
                      </v-col>
                      <v-col class="d-flex justify-space-between">
                        <v-icon><CustomLens /></v-icon>
                        {{ image.metadata.lens?.substring(0, 18) }}
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col class="d-flex justify-space-between">
                        <v-icon><CustomShutterSpeed /></v-icon>
                        {{ image.metadata.shutterSpeed }}
                      </v-col>
                      <v-col class="d-flex justify-space-between">
                        <v-icon><CustomAperture /></v-icon>
                        {{ image.metadata.aperture }}
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col class="d-flex justify-space-between">
                        <v-icon><CustomIso /></v-icon>
                        {{ image.metadata.iso }}
                      </v-col>
                      <v-col class="d-flex justify-space-between">
                        <v-icon><CustomWhiteBalance /></v-icon>
                        {{ image.metadata.whiteBalance }}
                      </v-col>
                    </v-row>
                  </v-tabs-window-item>
                  <v-tabs-window-item
                    v-if="image.description"
                    :value="2"
                  >
                    {{ image.description }}
                  </v-tabs-window-item>
                  <v-tabs-window-item :value="3">
                    <v-chip-group column>
                      <v-chip
                        v-for="tag in image.tags"
                        :key="tag"
                        class="non-clickable"
                      >
                        {{ tag }}
                      </v-chip>
                    </v-chip-group>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <v-snackbar
      v-model="toastInfo"
      class="v-snackbar"
      location="top"
    >
      {{ toastMessage }}
    </v-snackbar>
  </section>
</template>

<script setup lang="ts">
import type { ColorPalette, ImageDocument, ImageVersion } from "@conteai/shared";
import { computed, markRaw, onBeforeUnmount, onMounted, ref, watch } from "vue";
import CustomAperture from "./icons/customAperture.vue";
import CustomCamera from "./icons/customCamera.vue";
import CustomEdit from "./icons/customEdit.vue";
import CustomIso from "./icons/customISO.vue";
import CustomLens from "./icons/customLens.vue";
import CustomMap from "./icons/customMap.vue";
import CustomNoEdit from "./icons/customNoEdit.vue";
import CustomPhotographed from "./icons/customPhotographed.vue";
import CustomPost from "./icons/customPost.vue";
import CustomShutterSpeed from "./icons/customShutterSpeed.vue";
import CustomStreetView from "./icons/customStreetView.vue";
import CustomWhiteBalance from "./icons/customWhiteBalance.vue";
import { getDateHour } from "../utils/date.js";
import { calculateModalSize, type ModalSize } from "../utils/modalResize.js";

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

// v-checkbox icon props accept a component; markRaw avoids reactivity warnings.
const editIcon = markRaw(CustomEdit);
const noEditIcon = markRaw(CustomNoEdit);

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
const expandedPanelVisible = ref(false);
const panelExpanded = ref<number | null>(null);
const tab = ref(1);
const toastInfo = ref(false);
const toastMessage = ref("");
const modalSize = ref<ModalSize>({ height: "100px", width: "100px" });
const resizeTimer = ref<ReturnType<typeof globalThis.setTimeout> | null>(null);

const onlyOriginal = computed(
  () => props.image.images.length === 0 && Boolean(props.image.original),
);

const activeVersion = computed<ImageVersion>(() =>
  showOriginal.value
    ? props.image.original
    : props.image.images[activeIndex.value] ?? props.image.original,
);

// Blurred base64 placeholder shown behind the pixel-faithful <img> while the
// full photo loads (legacy blur-up). The photo stays opaque and covers it once
// it paints, so the loaded golden is unchanged and there is no JS load race.
const placeholderStyle = computed(() => ({
  "--lazy-thumb": activeVersion.value.lazyThumbnailBase64
    ? `url("${activeVersion.value.lazyThumbnailBase64}")`
    : "none",
}));

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

// Trailing non-breaking spaces give the looping marquee its gap (legacy).
const fullLocationText = computed(() => `${locationText.value}${"\u00A0".repeat(10)}`);

const heightThirtyPercent = computed(
  () => `${Number(String(modalSize.value.height).slice(0, -2)) * 0.3}px`,
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

const updateModalSize = (): void => {
  const documentElement = globalThis.document?.documentElement;
  const viewportHeight = documentElement?.clientHeight ?? 800;
  const viewportWidth = documentElement?.clientWidth ?? 1280;

  modalSize.value = calculateModalSize({
    imageHeight: props.image.metadata.optimizedHeight,
    imageWidth: props.image.metadata.optimizedWidth,
    isRotated: props.isRotated,
    viewportHeight,
    viewportWidth,
  });
};

const scheduleResize = (delayMs = 100): void => {
  if (resizeTimer.value !== null) {
    globalThis.clearTimeout(resizeTimer.value);
  }

  resizeTimer.value = globalThis.setTimeout(() => {
    resizeTimer.value = null;
    updateModalSize();
  }, delayMs);
};

const handleViewportResize = (): void => {
  scheduleResize();
};

const handleScreenRotation = (): void => {
  scheduleResize();

  globalThis.setTimeout(() => {
    globalThis.window.scrollBy(0, 1);
    globalThis.window.scrollBy(0, -1);
  }, 500);
};

const modalStyle = computed(() => ({
  "--modal-height": String(modalSize.value.height),
  "--modal-width": String(modalSize.value.width),
}));

const toHexPart = (value: number): string => value.toString(16).padStart(2, "0");

const toHexColor = (color: ColorPalette): string =>
  `#${toHexPart(color.red)}${toHexPart(color.green)}${toHexPart(color.blue)}`;

const toRgbColor = (color: ColorPalette): string =>
  `rgb(${color.red}, ${color.green}, ${color.blue})`;

const copyColorCode = async (color: ColorPalette): Promise<void> => {
  const hexColor = toHexColor(color);
  await globalThis.navigator.clipboard.writeText(hexColor);
  toastMessage.value = `color code copied successfully: ${hexColor}`;
  toastInfo.value = true;
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

const toggleOriginal = (value: boolean | null): void => {
  if (value) {
    selectOriginal();
  } else {
    selectVersion(activeIndex.value);
  }
};

const onSelectDelimiter = (index: number | null): void => {
  if (index !== null) {
    selectVersion(index);
  }
};

const toggleExpansionPanel = (): void => {
  panelExpanded.value = panelExpanded.value === null ? 0 : null;
};

const onStageOver = (): void => {
  expandedPanelVisible.value = true;
};

const onStageLeave = (event: globalThis.MouseEvent): void => {
  // Keep the chrome open while the pointer moves onto a teleported menu overlay.
  const related = event.relatedTarget;

  if (related instanceof globalThis.HTMLElement && related.closest(".v-overlay")) {
    return;
  }

  expandedPanelVisible.value = false;
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
    // A tap toggles the info chrome, mirroring the legacy touch behaviour.
    expandedPanelVisible.value = !expandedPanelVisible.value;
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

watch(
  () => [props.image, props.isRotated] as const,
  () => {
    updateModalSize();
  },
);

onMounted(() => {
  updateModalSize();
  globalThis.window.addEventListener("resize", handleViewportResize);
  globalThis.screen.orientation?.addEventListener("change", handleScreenRotation);
});

onBeforeUnmount(() => {
  if (resizeTimer.value !== null) {
    globalThis.clearTimeout(resizeTimer.value);
  }

  globalThis.window.removeEventListener("resize", handleViewportResize);
  globalThis.screen.orientation?.removeEventListener(
    "change",
    handleScreenRotation,
  );
});
</script>

<style scoped>
.modal-viewer {
  align-items: center;
  background: rgba(255, 255, 255, 0.26);
  color: #f5f5f5;
  display: grid;
  inset: 0;
  justify-items: center;
  /* No padding: calculateModalSize already reserves the viewport margin
     (width <= clientWidth - 100). Centering happens against the full viewport,
     matching the legacy v-dialog — padding would shift the wider rotated stage. */
  overflow: hidden;
  padding: 0;
  position: fixed;
  z-index: 2400;
}

.viewer-stage {
  align-items: center;
  background: transparent;
  display: grid;
  height: var(--modal-height);
  justify-items: center;
  /* Replicates Vuetify v-dialog's default max-width (24px margin each side),
     which clamps the rotated modal on the narrowest viewports. */
  max-width: calc(100vw - 48px);
  overflow: visible;
  position: relative;
  width: var(--modal-width);
}

.viewer-stage img {
  border-radius: 4px;
  display: block;
  /* Absolute fill so height resolves against the stage box even when max-width
     clamps it (rotated modal on narrow viewports), matching the legacy cover. */
  height: 100%;
  inset: 0;
  object-fit: cover;
  position: absolute;
  width: 100%;
  z-index: 1;
}

/* Blurred low-res placeholder behind the photo (legacy blur-up). */
.viewer-placeholder {
  border-radius: 4px;
  inset: 0;
  overflow: hidden;
  position: absolute;
  z-index: 0;
}

.viewer-placeholder::before {
  background-image: var(--lazy-thumb);
  background-position: center;
  background-size: cover;
  content: "";
  filter: blur(16px);
  inset: -6%;
  position: absolute;
}

.viewer-stage.rotated {
  transform: rotate(90deg);
  transform-origin: center center;
}

.no-edit-checkbox {
  position: absolute;
  top: 0;
  right: 0;
}

.custom-delimiters {
  position: absolute;
  top: 7px;
  left: 0;
  margin: 4px;
  color: rgba(255, 255, 255, 0.3);
}

.expansion-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
}

.expansion-box {
  background-color: rgba(0, 0, 0, 0.5);
  color: #c5c5c5;
}

.expansion-title {
  max-height: 30px;
}

.arrow-expand-panel {
  padding-left: 0;
  padding-right: 0;
}

.expand-button {
  color: white;
  background-color: black;
}

.card-pallete-colors {
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
}

.color-palette {
  display: flex;
  margin: 0;
}

.color-box {
  width: 25px;
  height: 25px;
  border: none;
  cursor: pointer;
}

.card-description-tags {
  background-color: rgba(0, 0, 0, 0.7);
  color: #c5c5c5;
}

.non-clickable {
  pointer-events: none;
}

.v-tab.v-tab.v-btn {
  min-width: 50px;
}

:deep(.v-slide-group__container) {
  display: ruby;
  text-align: center;
}

.v-expansion-panel--active
  > .v-expansion-panel-title:not(.v-expansion-panel-title--static) {
  min-height: 40px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
  overflow-y: auto;
}

.location-button,
.datetime-button {
  color: white;
  background-color: rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.location-menu,
.datetime-menu {
  color: #c5c5c5;
}

.location-full {
  font-size: 14px;
  color: #c5c5c5;
  font-weight: bold;
  text-align: center;
}

.datetime-photographed {
  margin-left: 0;
}

.div-location-button {
  max-width: 100%;
}

.scroll-container {
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  display: inline-block;
  position: relative;
}

.scroll-text {
  display: inline-block;
  white-space: nowrap;
  animation: scroll 10s linear infinite;
}

.scroll-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 100%;
  white-space: nowrap;
}

.text-specs-description-tags::-webkit-scrollbar {
  width: 12px;
}

.text-specs-description-tags::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.9);
  border-radius: 6px;
}

.text-specs-description-tags::-webkit-scrollbar-track {
  background-color: rgba(255, 255, 255, 0.1);
}

@keyframes scroll {
  0% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(-100%);
  }
}
</style>
