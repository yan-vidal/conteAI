<script setup lang="ts">
import type { ImageDocument } from "@conteai/shared";
import { definePageMeta } from "#imports";
import { computed, ref } from "vue";
import { useApi } from "../composables/useApi.js";

definePageMeta({
  middleware: ["auth"],
});

interface UploadRow {
  readonly id: number;
  file: globalThis.File | null;
  versionName: string;
  original: boolean;
}

const nextRowId = ref(1);
const rows = ref<UploadRow[]>([
  { file: null, id: 0, original: false, versionName: "V1" },
]);
const description = ref("");
const favorite = ref(true);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const uploadedImage = ref<ImageDocument | null>(null);

const selectedRows = computed(() => rows.value.filter((row) => row.file));

const addRow = (): void => {
  rows.value = [
    ...rows.value,
    {
      file: null,
      id: nextRowId.value,
      original: false,
      versionName: `V${rows.value.length + 1}`,
    },
  ];
  nextRowId.value += 1;
};

const setFile = (event: globalThis.Event, row: UploadRow): void => {
  const input = event.target;

  if (!(input instanceof globalThis.HTMLInputElement)) {
    return;
  }

  row.file = input.files?.[0] ?? null;
};

const selectOriginal = (row: UploadRow, checked: boolean): void => {
  row.original = checked;
  row.versionName = checked ? "Original" : "";

  if (!checked) {
    return;
  }

  for (const otherRow of rows.value) {
    if (otherRow.id !== row.id) {
      otherRow.original = false;
      if (otherRow.versionName.toLowerCase() === "original") {
        otherRow.versionName = "";
      }
    }
  }
};

const buildFormData = (): globalThis.FormData => {
  const form = new globalThis.FormData();

  selectedRows.value.forEach((row, index) => {
    if (!row.file) {
      return;
    }

    form.append("files", row.file);
    form.append(`versionNames[${index}]`, row.versionName);
  });
  form.append("description", description.value);
  form.append("favorite", String(favorite.value));

  return form;
};

const resetForm = (): void => {
  rows.value = [{ file: null, id: 0, original: false, versionName: "V1" }];
  nextRowId.value = 1;
  description.value = "";
  favorite.value = true;
};

const submitUpload = async (): Promise<void> => {
  errorMessage.value = "";
  successMessage.value = "";

  if (selectedRows.value.length === 0) {
    errorMessage.value = "Selecione ao menos uma imagem";
    return;
  }

  loading.value = true;

  try {
    const { uploadImage } = useApi();
    uploadedImage.value = await uploadImage(buildFormData());
    successMessage.value = "Upload concluído";
    resetForm();
  } catch {
    errorMessage.value = "Erro ao realizar o envio";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <ClientOnly>
    <v-container class="upload-shell">
      <form
        class="upload-form"
        @submit.prevent="submitUpload"
      >
        <header>
          <p class="eyebrow">
            {{ $t("upload.eyebrow") }}
          </p>
          <h1>{{ $t("upload.title") }}</h1>
        </header>

        <div class="upload-rows">
          <fieldset
            v-for="(row, index) in rows"
            :key="row.id"
            class="upload-row"
          >
            <legend>{{ $t("upload.image") }} {{ index + 1 }}</legend>
            <label>
              {{ $t("upload.file") }}
              <input
                :data-testid="`file-input-${index}`"
                type="file"
                accept="image/*"
                @change="setFile($event, row)"
              >
            </label>
            <label>
              {{ $t("upload.versionName") }}
              <input
                v-model="row.versionName"
                :data-testid="`version-input-${index}`"
                :disabled="row.original"
                type="text"
              >
            </label>
            <label class="checkbox-label">
              <input
                v-model="row.original"
                :data-testid="`original-checkbox-${index}`"
                type="checkbox"
                @change="
                  selectOriginal(
                    row,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              >
              {{ $t("upload.original") }}
            </label>
          </fieldset>
        </div>

        <button
          data-testid="add-upload-row"
          type="button"
          class="secondary-action"
          @click="addRow"
        >
          {{ $t("upload.addVersion") }}
        </button>

        <label>
          {{ $t("upload.description") }}
          <textarea
            v-model="description"
            data-testid="description-input"
          />
        </label>

        <label class="checkbox-label">
          <input
            v-model="favorite"
            data-testid="favorite-checkbox"
            type="checkbox"
          >
          {{ $t("upload.favorite") }}
        </label>

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

        <button
          class="primary-action"
          :disabled="loading"
          type="submit"
        >
          {{ loading ? $t("upload.sending") : $t("upload.submit") }}
        </button>
      </form>
    </v-container>
  </ClientOnly>
</template>

<style scoped>
.upload-shell {
  min-height: calc(100vh - 40px);
  padding-block: 32px 96px;
}

.upload-form {
  display: grid;
  gap: 18px;
  margin-inline: auto;
  max-width: 720px;
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

.upload-rows {
  display: grid;
  gap: 12px;
}

.upload-row {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 16px;
}

legend {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  padding-inline: 4px;
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
  min-height: 38px;
  padding: 8px 10px;
}

textarea {
  min-height: 96px;
  resize: vertical;
}

.checkbox-label {
  align-items: center;
  display: flex;
  gap: 8px;
}

.checkbox-label input {
  min-height: auto;
}

.primary-action,
.secondary-action {
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 38px;
  padding: 0 16px;
}

.primary-action {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  justify-self: end;
}

.secondary-action {
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  justify-self: start;
}
</style>
