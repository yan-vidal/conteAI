import type { ImageDocument } from "@conteai/shared";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../app.vue";

const api = {
  getCities: vi.fn(),
  getCountries: vi.fn(),
  getStates: vi.fn(),
  getTags: vi.fn(),
  listImages: vi.fn(),
};

mockNuxtImport("useApi", () => {
  return () => api;
});

enableAutoUnmount(afterEach);

const makeImage = (id: string, favorite: boolean): ImageDocument => ({
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

const primeFilters = (): void => {
  api.getCountries.mockResolvedValue([{ code: "JP", name: "Japan" }]);
  api.getStates.mockResolvedValue([
    { code: "TOK", countryParentCode: "JP", name: "Tokyo" },
  ]);
  api.getCities.mockResolvedValue([
    {
      code: "TAI",
      countryParentCode: "JP",
      name: "Taito",
      stateParentCode: "TOK",
    },
  ]);
  api.getTags.mockResolvedValue([{ code: "TEM", name: "Temple" }]);
};

describe("gallery page", () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
    vi.clearAllMocks();
    primeFilters();
  });

  it("loads favorite images by default with SSR-visible img tags", async () => {
    api.listImages.mockResolvedValue({
      images: [makeImage("fav-1", true)],
      total: 1,
    });

    const component = await mountSuspended(App, { route: "/gallery" });

    expect(api.listImages).toHaveBeenCalledWith({
      favorite: true,
      limit: 30,
      offset: 0,
      order: "desc",
      sort: "metadata.takenAt",
    });
    expect(component.get("img").attributes("src")).toBe(
      "https://cdn.test/fav-1-thumb.jpg",
    );
    expect(component.get("img").attributes("alt")).toBe("Photo fav-1");
  });

  it("uses all mode and legacy URL filters from the query string", async () => {
    api.listImages.mockResolvedValue({
      images: [makeImage("all-1", false)],
      total: 1,
    });

    await mountSuspended(App, {
      route:
        "/gallery?all=true&country=Japan&state=Tokyo&city=Taito&tag=Temple&startDate=2026-01-01T00:00:00.000&endDate=2026-02-01T00:00:00.000",
    });

    expect(api.listImages).toHaveBeenCalledWith({
      city: ["Taito"],
      country: ["Japan"],
      limit: 30,
      offset: 0,
      order: "desc",
      sort: "metadata.takenAt",
      state: ["Tokyo"],
      tags: ["Temple"],
      takenAtFrom: "2026-01-01T00:00:00.000",
      takenAtTo: "2026-02-01T00:00:00.000",
    });
  });

  it("shows an empty favorite state with a CTA to load all photos", async () => {
    api.listImages
      .mockResolvedValueOnce({ images: [], total: 0 })
      .mockResolvedValueOnce({ images: [makeImage("plain-1", false)], total: 1 });

    const component = await mountSuspended(App, { route: "/gallery" });

    expect(component.text()).toContain("No favorites published");

    await component.get("[data-testid='show-all-empty']").trigger("click");
    await flushPromises();

    expect(api.listImages).toHaveBeenLastCalledWith({
      limit: 30,
      offset: 0,
      order: "desc",
      sort: "metadata.takenAt",
    });
    expect(component.text()).toContain("Photo plain-1");
  });

  it("retries a missing favorite deep-link in all mode", async () => {
    api.listImages
      .mockRejectedValueOnce({ statusCode: 404 })
      .mockResolvedValueOnce({
        images: [makeImage("plain-2", false)],
        total: 1,
      });

    const component = await mountSuspended(App, {
      route: "/gallery?id=plain-2&version=1",
    });

    expect(api.listImages).toHaveBeenNthCalledWith(1, {
      favorite: true,
      id: "plain-2",
      limit: 30,
      offset: 0,
      order: "desc",
      sort: "metadata.takenAt",
    });
    expect(api.listImages).toHaveBeenNthCalledWith(2, {
      id: "plain-2",
      limit: 30,
      offset: 0,
      order: "desc",
      sort: "metadata.takenAt",
    });
    expect(component.text()).toContain("Photo plain-2");
  });
});
