import type { ImageDocument } from "@conteai/shared";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../app.vue";
import { useAuthStore } from "../stores/auth.js";

const uploadImage = vi.fn();

mockNuxtImport("useApi", () => {
  return () => ({ uploadImage });
});

const uploadedImage: ImageDocument = {
  _id: "uploaded-1",
  description: "Uploaded photo",
  favorite: true,
  images: [],
  metadata: {
    fullSizeHeight: 1000,
    fullSizeWidth: 1500,
    optimizedHeight: 667,
    optimizedWidth: 1000,
    thumbnailHeight: 300,
    thumbnailWidth: 300,
    whiteBalance: "Auto",
  },
  original: {
    colorPalette: [],
    fullSizeUrl: "https://cdn.test/original-full.jpg",
    lazyThumbnailBase64: "data:image/webp;base64,fixture",
    optimizedUrl: "https://cdn.test/original-optimized.jpg",
    thumbnailUrl: "https://cdn.test/original-thumb.jpg",
    versionName: "Original",
  },
  tags: [],
};

const setFileInput = async (
  component: Awaited<ReturnType<typeof mountSuspended>>,
  testId: string,
  file: File,
): Promise<void> => {
  const input = component.get(`[data-testid='${testId}']`);
  Object.defineProperty(input.element, "files", {
    configurable: true,
    value: [file],
  });
  await input.trigger("change");
};

describe("upload page", () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
    uploadImage.mockReset();
    const auth = useAuthStore();
    auth.token = "jwt-token";
    auth.payload = { exp: 1_782_000_000, id: "user-1", name: "yan" };
  });

  it("sends multipart data for multiple files with favorite checked by default", async () => {
    uploadImage.mockResolvedValue(uploadedImage);
    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });

    const component = await mountSuspended(App, { route: "/upload" });

    await setFileInput(component, "file-input-0", firstFile);
    await component.get("[data-testid='add-upload-row']").trigger("click");
    await setFileInput(component, "file-input-1", secondFile);
    await component.get("[data-testid='version-input-0']").setValue("Warm");
    await component.get("[data-testid='original-checkbox-1']").setValue(true);
    await component.get("[data-testid='description-input']").setValue("Trip");
    await component.get("form").trigger("submit");
    await flushPromises();

    const form = uploadImage.mock.calls[0]?.[0] as FormData | undefined;

    expect(form).toBeInstanceOf(FormData);
    expect(form?.getAll("files")).toEqual([firstFile, secondFile]);
    expect(form?.get("versionNames[0]")).toBe("Warm");
    expect(form?.get("versionNames[1]")).toBe("Original");
    expect(form?.get("description")).toBe("Trip");
    expect(form?.get("favorite")).toBe("true");
    expect(component.text()).toContain("Upload concluído");
  });

  it("shows an error when upload fails", async () => {
    uploadImage.mockRejectedValue(new Error("upload failed"));
    const component = await mountSuspended(App, { route: "/upload" });

    await setFileInput(
      component,
      "file-input-0",
      new File(["first"], "first.jpg", { type: "image/jpeg" }),
    );
    await component.get("form").trigger("submit");
    await flushPromises();

    expect(component.text()).toContain("Erro ao realizar o envio");
  });
});
