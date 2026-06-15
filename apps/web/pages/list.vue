<script setup lang="ts">
import type { ImageDocument, ImageVersion } from "@conteai/shared";
import { definePageMeta, useAsyncData } from "#imports";
import { computed, ref } from "vue";
import { useApi } from "../composables/useApi.js";

definePageMeta({
  middleware: ["auth"],
});

const perPage = 50;
const api = useApi();
const errorMessage = ref("");
const successMessage = ref("");
const saving = ref(false);
const deleting = ref(false);
const selectedImage = ref<ImageDocument | null>(null);
const imageToDelete = ref<ImageDocument | null>(null);

const { data } = await useAsyncData("admin-images", () =>
  api.listImages({
    limit: perPage,
    offset: 0,
    order: "desc",
    sort: "createdAt",
  }),
);

const items = ref<ImageDocument[]>(data.value?.images ?? []);
const total = ref(data.value?.total ?? 0);
const hasMore = computed(() => items.value.length < total.value);

const thumbnailUrl = (image: ImageDocument): string =>
  image.images[0]?.thumbnailUrl ?? image.original.thumbnailUrl;

const imageLabel = (image: ImageDocument): string =>
  image.description ||
  [image.country, image.state, image.city].filter(Boolean).join(", ");

const cloneVersion = (version: ImageVersion): ImageVersion => ({
  ...version,
  colorPalette: version.colorPalette.map((color) => ({ ...color })),
});

const cloneImage = (image: ImageDocument): ImageDocument => ({
  ...image,
  images: image.images.map(cloneVersion),
  metadata: { ...image.metadata },
  original: cloneVersion(image.original),
  tags: [...image.tags],
});

const messageFromError = (fallback: string, error: unknown): string =>
  error instanceof Error && error.message
    ? `${fallback}: ${error.message}`
    : fallback;

const replaceImage = (updated: ImageDocument): void => {
  items.value = items.value.map((image) =>
    image._id === updated._id ? updated : image,
  );
};

const toggleFavorite = async (
  image: ImageDocument,
  event: globalThis.Event,
): Promise<void> => {
  const input = event.target;

  if (!(input instanceof globalThis.HTMLInputElement) || !image._id) {
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";

  try {
    const updated = await api.editImage(image._id, { favorite: input.checked });
    replaceImage(updated);
  } catch (error) {
    input.checked = image.favorite === true;
    errorMessage.value = messageFromError(
      "Erro ao atualizar favorita",
      error,
    );
  }
};

const openEditor = (image: ImageDocument): void => {
  selectedImage.value = cloneImage(image);
};

const setEditedTags = (event: globalThis.Event): void => {
  const input = event.target;

  if (!(input instanceof globalThis.HTMLInputElement) || !selectedImage.value) {
    return;
  }

  selectedImage.value.tags = input.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const dateLikeToInputValue = (
  value: ImageDocument["metadata"]["takenAt"],
): string => {
  if (value instanceof globalThis.Date) {
    return value.toISOString();
  }

  return value ?? "";
};

const setEditedTakenAt = (event: globalThis.Event): void => {
  const input = event.target;

  if (!(input instanceof globalThis.HTMLInputElement) || !selectedImage.value) {
    return;
  }

  selectedImage.value.metadata.takenAt = input.value;
};

const saveImage = async (): Promise<void> => {
  if (!selectedImage.value?._id) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const updated = await api.editImage(selectedImage.value._id, {
      city: selectedImage.value.city,
      country: selectedImage.value.country,
      description: selectedImage.value.description,
      favorite: selectedImage.value.favorite,
      images: selectedImage.value.images,
      metadata: selectedImage.value.metadata,
      original: selectedImage.value.original,
      state: selectedImage.value.state,
      tags: selectedImage.value.tags,
    });
    replaceImage(updated);
    selectedImage.value = cloneImage(updated);
    successMessage.value = "Imagem salva com sucesso";
  } catch (error) {
    errorMessage.value = messageFromError("Erro ao salvar imagem", error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (image: ImageDocument): void => {
  imageToDelete.value = image;
};

const deleteSelectedImage = async (): Promise<void> => {
  if (!imageToDelete.value?._id) {
    return;
  }

  deleting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await api.deleteImage(imageToDelete.value._id);
    items.value = items.value.filter(
      (image) => image._id !== imageToDelete.value?._id,
    );
    total.value = Math.max(0, total.value - 1);
    successMessage.value = "Imagem excluída com sucesso";
    imageToDelete.value = null;
  } catch (error) {
    errorMessage.value = messageFromError("Erro ao excluir imagem", error);
  } finally {
    deleting.value = false;
  }
};

const loadMore = async (): Promise<void> => {
  if (!hasMore.value) {
    return;
  }

  const response = await api.listImages({
    limit: perPage,
    offset: items.value.length,
    order: "desc",
    sort: "createdAt",
  });
  items.value = [...items.value, ...response.images];
  total.value = response.total;
};
</script>

<template>
  <ClientOnly>
    <v-container class="list-shell">
      <header>
        <p class="eyebrow">
          {{ $t("list.eyebrow") }}
        </p>
        <h1>{{ $t("list.title") }}</h1>
      </header>

      <section
        class="image-list"
        aria-label="Admin image list"
      >
        <article
          v-for="image in items"
          :key="image._id"
          class="image-row"
        >
          <img
            :alt="imageLabel(image)"
            :src="thumbnailUrl(image)"
          >
          <div class="row-main">
            <strong>{{ imageLabel(image) }}</strong>
            <span>{{ image.country }}, {{ image.state }}, {{ image.city }}</span>
            <span>{{ image.metadata.takenAt }}</span>
          </div>
          <label class="checkbox-label">
            <input
              :checked="image.favorite === true"
              :data-testid="`row-favorite-${image._id}`"
              type="checkbox"
              @change="toggleFavorite(image, $event)"
            >
            {{ $t("list.favorite") }}
          </label>
          <div class="row-actions">
            <button
              :data-testid="`edit-${image._id}`"
              type="button"
              @click="openEditor(image)"
            >
              {{ $t("list.edit") }}
            </button>
            <button
              :data-testid="`delete-${image._id}`"
              type="button"
              @click="confirmDelete(image)"
            >
              {{ $t("list.delete") }}
            </button>
          </div>
        </article>
      </section>

      <button
        v-if="hasMore"
        class="secondary-action"
        type="button"
        @click="loadMore"
      >
        {{ $t("list.loadMore") }}
      </button>

      <section
        v-if="selectedImage"
        class="edit-panel"
        aria-label="Edit image"
      >
        <h2>{{ $t("list.editTitle") }}</h2>
        <label>
          {{ $t("list.description") }}
          <textarea
            v-model="selectedImage.description"
            data-testid="edit-description"
          />
        </label>
        <div class="field-grid">
          <label>
            {{ $t("list.country") }}
            <input
              v-model="selectedImage.country"
              data-testid="edit-country"
              type="text"
            >
          </label>
          <label>
            {{ $t("list.state") }}
            <input
              v-model="selectedImage.state"
              data-testid="edit-state"
              type="text"
            >
          </label>
          <label>
            {{ $t("list.city") }}
            <input
              v-model="selectedImage.city"
              data-testid="edit-city"
              type="text"
            >
          </label>
        </div>
        <label>
          {{ $t("list.tags") }}
          <input
            :value="selectedImage.tags.join(',')"
            data-testid="edit-tags"
            type="text"
            @input="setEditedTags"
          >
        </label>
        <label class="checkbox-label">
          <input
            v-model="selectedImage.favorite"
            data-testid="edit-favorite"
            type="checkbox"
          >
          {{ $t("list.favorite") }}
        </label>
        <div class="versions">
          <h3>{{ $t("list.original") }}</h3>
          <label>
            {{ $t("list.thumbnailUrl") }}
            <input
              v-model="selectedImage.original.thumbnailUrl"
              data-testid="edit-original-thumbnail-url"
              type="url"
            >
          </label>
          <label>
            {{ $t("list.optimizedUrl") }}
            <input
              v-model="selectedImage.original.optimizedUrl"
              data-testid="edit-original-optimized-url"
              type="url"
            >
          </label>
          <label>
            {{ $t("list.fullSizeUrl") }}
            <input
              v-model="selectedImage.original.fullSizeUrl"
              data-testid="edit-original-full-size-url"
              type="url"
            >
          </label>
          <label>
            {{ $t("list.lazyThumbnail") }}
            <input
              v-model="selectedImage.original.lazyThumbnailBase64"
              data-testid="edit-original-lazy-thumbnail"
              type="text"
            >
          </label>

          <h3>{{ $t("list.metadata") }}</h3>
          <label>
            {{ $t("list.takenAt") }}
            <input
              :value="dateLikeToInputValue(selectedImage.metadata.takenAt)"
              data-testid="edit-taken-at"
              type="text"
              @input="setEditedTakenAt"
            >
          </label>

          <h3>{{ $t("list.versions") }}</h3>
          <label
            v-for="(version, index) in selectedImage.images"
            :key="version.optimizedUrl"
          >
            {{ $t("list.versionName") }} {{ index + 1 }}
            <input
              v-model="version.versionName"
              :data-testid="`edit-version-${index}`"
              type="text"
            >
            {{ $t("list.thumbnailUrl") }}
            <input
              v-model="version.thumbnailUrl"
              :data-testid="`edit-version-${index}-thumbnail-url`"
              type="url"
            >
            {{ $t("list.optimizedUrl") }}
            <input
              v-model="version.optimizedUrl"
              :data-testid="`edit-version-${index}-optimized-url`"
              type="url"
            >
            {{ $t("list.fullSizeUrl") }}
            <input
              v-model="version.fullSizeUrl"
              :data-testid="`edit-version-${index}-full-size-url`"
              type="url"
            >
            {{ $t("list.lazyThumbnail") }}
            <input
              v-model="version.lazyThumbnailBase64"
              :data-testid="`edit-version-${index}-lazy-thumbnail`"
              type="text"
            >
          </label>
        </div>
        <div class="panel-actions">
          <button
            data-testid="save-image"
            :disabled="saving"
            type="button"
            @click="saveImage"
          >
            {{ $t("list.save") }}
          </button>
          <button
            type="button"
            @click="selectedImage = null"
          >
            {{ $t("list.close") }}
          </button>
        </div>
      </section>

      <section
        v-if="imageToDelete"
        class="delete-panel"
        aria-label="Confirm delete"
      >
        <h2>Confirmar exclusão</h2>
        <p>{{ $t("list.deleteQuestion") }}</p>
        <button
          data-testid="confirm-delete"
          :disabled="deleting"
          type="button"
          @click="deleteSelectedImage"
        >
          {{ $t("list.confirmDelete") }}
        </button>
        <button
          type="button"
          @click="imageToDelete = null"
        >
          {{ $t("list.cancel") }}
        </button>
      </section>

      <v-alert
        v-if="errorMessage"
        density="compact"
        type="error"
      >
        {{ errorMessage }}
      </v-alert>
      <v-alert
        v-if="successMessage"
        density="compact"
        type="success"
      >
        {{ successMessage }}
      </v-alert>
    </v-container>
  </ClientOnly>
</template>

<style scoped>
.list-shell {
  display: grid;
  gap: 18px;
  min-height: calc(100vh - 40px);
  padding-block: 32px 96px;
}

.eyebrow {
  color: rgb(var(--v-theme-secondary));
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}

h1,
h2 {
  color: rgb(var(--v-theme-primary));
  letter-spacing: 0;
  margin: 0;
}

h1 {
  font-size: 2rem;
  line-height: 1.15;
}

h2 {
  font-size: 1.25rem;
}

h3 {
  color: rgb(var(--v-theme-secondary));
  font-size: 0.95rem;
  letter-spacing: 0;
  margin: 8px 0 0;
}

.image-list,
.edit-panel,
.delete-panel {
  display: grid;
  gap: 12px;
}

.image-row {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: 72px minmax(0, 1fr) auto auto;
  padding: 12px;
}

.image-row img {
  aspect-ratio: 1;
  border-radius: 6px;
  object-fit: cover;
  width: 72px;
}

.row-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.row-main span,
.row-main strong {
  overflow-wrap: anywhere;
}

.checkbox-label {
  align-items: center;
  display: flex;
  gap: 8px;
}

.row-actions,
.panel-actions,
.delete-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

button {
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 34px;
  padding: 0 12px;
}

.row-actions button,
.secondary-action,
.panel-actions button,
.delete-panel button {
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
}

.edit-panel,
.delete-panel {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  padding: 16px;
}

.field-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 6px;
  font-weight: 600;
}

input,
textarea {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: inherit;
  font: inherit;
  min-height: 36px;
  padding: 8px 10px;
}

textarea {
  min-height: 80px;
  resize: vertical;
}

.versions {
  display: grid;
  gap: 10px;
}

@media (max-width: 760px) {
  .image-row,
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
