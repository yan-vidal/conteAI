import type { ImageDocument } from "@conteai/shared";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../app.vue";
import { useAuthStore } from "../stores/auth.js";

const api = {
  deleteImage: vi.fn(),
  editImage: vi.fn(),
  listImages: vi.fn(),
};

mockNuxtImport("useApi", () => {
  return () => api;
});

const makeImage = (id: string, favorite = false): ImageDocument => ({
  _id: id,
  city: "Taito",
  country: "Japan",
  description: `Photo ${id}`,
  favorite,
  images: [
    {
      colorPalette: [],
      fullSizeUrl: `https://cdn.test/${id}-full.jpg`,
      lazyThumbnailBase64: "data:image/webp;base64,fixture",
      optimizedUrl: `https://cdn.test/${id}-optimized.jpg`,
      thumbnailUrl: `https://cdn.test/${id}-thumb.jpg`,
      versionName: "Edited",
    },
  ],
  metadata: {
    fullSizeHeight: 1333,
    fullSizeWidth: 2000,
    optimizedHeight: 667,
    optimizedWidth: 1000,
    takenAt: "2026-06-10T10:00:00.000Z",
    thumbnailHeight: 300,
    thumbnailWidth: 300,
    whiteBalance: "Auto",
  },
  original: {
    colorPalette: [],
    fullSizeUrl: `https://cdn.test/${id}-original-full.jpg`,
    lazyThumbnailBase64: "data:image/webp;base64,fixture",
    optimizedUrl: `https://cdn.test/${id}-original-optimized.jpg`,
    thumbnailUrl: `https://cdn.test/${id}-original-thumb.jpg`,
    versionName: "Original",
  },
  state: "Tokyo",
  tags: ["Temple"],
});

describe("image list page", () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
    vi.clearAllMocks();
    const auth = useAuthStore();
    auth.token = "jwt-token";
    auth.payload = { exp: 1_782_000_000, id: "user-1", name: "yan" };
  });

  it("loads admin images and toggles favorite from the row", async () => {
    api.listImages.mockResolvedValue({ images: [makeImage("img-1")], total: 1 });
    api.editImage.mockResolvedValue(makeImage("img-1", true));

    const component = await mountSuspended(App, { route: "/list" });

    expect(api.listImages).toHaveBeenCalledWith({
      limit: 50,
      offset: 0,
      order: "desc",
      sort: "createdAt",
    });
    expect(component.text()).toContain("Photo img-1");

    await component.get("[data-testid='row-favorite-img-1']").setValue(true);
    await flushPromises();

    expect(api.editImage).toHaveBeenCalledWith("img-1", { favorite: true });
    expect(component.get("[data-testid='row-favorite-img-1']").element).toHaveProperty(
      "checked",
      true,
    );
  });

  it("edits metadata and deletes an image after confirmation", async () => {
    api.listImages.mockResolvedValue({ images: [makeImage("img-2")], total: 1 });
    api.editImage.mockResolvedValue({
      ...makeImage("img-2", true),
      city: "Osaka",
      description: "Updated",
    });
    api.deleteImage.mockResolvedValue(undefined);

    const component = await mountSuspended(App, { route: "/list" });

    await component.get("[data-testid='edit-img-2']").trigger("click");
    await component.get("[data-testid='edit-description']").setValue("Updated");
    await component.get("[data-testid='edit-city']").setValue("Osaka");
    await component.get("[data-testid='edit-favorite']").setValue(true);
    await component
      .get("[data-testid='edit-taken-at']")
      .setValue("2026-06-11T12:00:00.000Z");
    await component
      .get("[data-testid='edit-version-0-optimized-url']")
      .setValue("https://cdn.test/img-2-edited-optimized.jpg");
    await component
      .get("[data-testid='edit-original-thumbnail-url']")
      .setValue("https://cdn.test/img-2-original-new-thumb.jpg");
    await component
      .get("[data-testid='edit-original-lazy-thumbnail']")
      .setValue("data:image/webp;base64,original-edited");
    await component
      .get("[data-testid='edit-version-0-lazy-thumbnail']")
      .setValue("data:image/webp;base64,version-edited");
    await component.get("[data-testid='save-image']").trigger("click");
    await flushPromises();

    expect(api.editImage).toHaveBeenCalledWith(
      "img-2",
      expect.objectContaining({
        city: "Osaka",
        description: "Updated",
        favorite: true,
        images: [
          expect.objectContaining({
            lazyThumbnailBase64: "data:image/webp;base64,version-edited",
            optimizedUrl: "https://cdn.test/img-2-edited-optimized.jpg",
          }),
        ],
        metadata: expect.objectContaining({
          takenAt: "2026-06-11T12:00:00.000Z",
        }),
        original: expect.objectContaining({
          lazyThumbnailBase64: "data:image/webp;base64,original-edited",
          thumbnailUrl: "https://cdn.test/img-2-original-new-thumb.jpg",
        }),
      }),
    );
    expect(component.text()).toContain("Updated");

    await component.get("[data-testid='delete-img-2']").trigger("click");
    expect(component.text()).toContain("Confirmar exclusão");
    await component.get("[data-testid='confirm-delete']").trigger("click");
    await flushPromises();

    expect(api.deleteImage).toHaveBeenCalledWith("img-2");
    expect(component.text()).not.toContain("Updated");
  });
});
