import type { ImageDocument } from "@conteai/shared";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ModalViewerImage from "../components/ModalViewerImage.vue";
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

const makeImage = (): ImageDocument => ({
  _id: "img-1",
  city: "Taito",
  country: "Japan",
  description: "Senso-ji at night",
  favorite: false,
  images: [
    {
      colorPalette: [
        { blue: 56, green: 34, pixelFraction: 0.4, red: 12, score: 0.8 },
      ],
      fullSizeUrl: "https://cdn.test/v1-full.jpg",
      lazyThumbnailBase64: "data:image/webp;base64,fixture",
      optimizedUrl: "https://cdn.test/v1-optimized.jpg",
      thumbnailUrl: "https://cdn.test/v1-thumb.jpg",
      versionName: "Warm",
    },
    {
      colorPalette: [
        { blue: 90, green: 80, pixelFraction: 0.3, red: 70, score: 0.7 },
      ],
      fullSizeUrl: "https://cdn.test/v2-full.jpg",
      lazyThumbnailBase64: "data:image/webp;base64,fixture",
      optimizedUrl: "https://cdn.test/v2-optimized.jpg",
      thumbnailUrl: "https://cdn.test/v2-thumb.jpg",
      versionName: "Cool",
    },
  ],
  metadata: {
    aperture: "f/2.8",
    camera: "X-T5",
    cameraTrueDirection: 120,
    fullSizeHeight: 1333,
    fullSizeWidth: 2000,
    iso: "640",
    latitude: 35.7148,
    lens: "23mm",
    longitude: 139.7967,
    optimizedHeight: 667,
    optimizedWidth: 1000,
    shutterSpeed: "1/125",
    takenAt: "2026-06-10T10:00:00.000Z",
    thumbnailHeight: 300,
    thumbnailWidth: 300,
    whiteBalance: "Auto",
  },
  original: {
    colorPalette: [
      { blue: 3, green: 2, pixelFraction: 0.2, red: 1, score: 0.6 },
    ],
    fullSizeUrl: "https://cdn.test/original-full.jpg",
    lazyThumbnailBase64: "data:image/webp;base64,fixture",
    optimizedUrl: "https://cdn.test/original-optimized.jpg",
    thumbnailUrl: "https://cdn.test/original-thumb.jpg",
    versionName: "Original",
  },
  state: "Tokyo",
  tags: ["Temple", "Night"],
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

describe("ModalViewerImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeFilters();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    // Vuetify overlays (v-menu) read visualViewport, absent in jsdom.
    Object.defineProperty(globalThis.window, "visualViewport", {
      configurable: true,
      value: {
        addEventListener: vi.fn(),
        height: 768,
        offsetLeft: 0,
        offsetTop: 0,
        removeEventListener: vi.fn(),
        scale: 1,
        width: 1024,
      },
    });
  });

  it("reveals the requested version EXIF, palette and location links", async () => {
    const component = await mountSuspended(ModalViewerImage, {
      attachTo: document.body,
      props: {
        image: makeImage(),
        isRotated: false,
        version: "2",
      },
    });

    expect(component.get("[data-testid='modal-image']").attributes("src")).toBe(
      "https://cdn.test/v2-optimized.jpg",
    );

    // The info chrome mirrors the legacy modal: hidden until hover, then the
    // EXIF/palette panel is revealed by expanding the title.
    await component.get("[data-testid='viewer-stage']").trigger("mouseover");
    await component.get(".expansion-title").trigger("click");

    expect(component.text()).toContain("X-T5");
    expect(component.text()).toContain("23mm");

    await component.get("[data-testid='palette-color-0']").trigger("click");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("#46505a");

    // Opening the location menu exposes the Maps/Street View deep-links.
    await component.get(".location-button").trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const mapsLink = document.body.querySelector("[data-testid='maps-link']");
    const streetViewLink = document.body.querySelector(
      "[data-testid='street-view-link']",
    );

    expect(mapsLink?.getAttribute("href")).toBe(
      "https://www.google.com/maps?q=35.7148,139.7967",
    );
    expect(streetViewLink?.getAttribute("href")).toContain(
      "viewpoint=35.7148,139.7967",
    );
  });

  it("opens from a gallery deep-link using the requested version", async () => {
    api.listImages.mockResolvedValue({ images: [makeImage()], total: 1 });

    const component = await mountSuspended(App, {
      route: "/gallery?all=true&id=img-1&version=2",
    });

    expect(component.find("[data-testid='modal-viewer']").exists()).toBe(true);
    expect(component.get("[data-testid='modal-image']").attributes("src")).toBe(
      "https://cdn.test/v2-optimized.jpg",
    );
  });

  it("rotates the modal from the gallery chrome", async () => {
    api.listImages.mockResolvedValue({ images: [makeImage()], total: 1 });

    const component = await mountSuspended(App, {
      route: "/gallery?all=true&id=img-1&version=1",
    });

    await component.get("[data-testid='rotate-image']").trigger("click");

    expect(component.get("[data-testid='viewer-stage']").classes()).toContain(
      "rotated",
    );
  });
});
