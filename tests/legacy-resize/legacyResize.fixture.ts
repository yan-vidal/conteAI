import type { LegacyModalSize, LegacyResizeInput } from "./legacyResize";

export interface LegacyResizeCase {
  readonly name: string;
  readonly input: LegacyResizeInput;
  readonly expected: LegacyModalSize;
}

export const legacyResizeFixture = {
  source: "yan-site-front-vue/src/components/ModalViewerImage.vue resize()",
  capturedAt: "2026-06-11",
  cases: [
    {
      name: "landscape-mobile-360-normal",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 360,
        viewportHeight: 800,
        isRotated: false,
      },
      expected: { width: "260px", height: "173.29px" },
    },
    {
      name: "landscape-mobile-360-rotated",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 360,
        viewportHeight: 800,
        isRotated: true,
      },
      expected: { width: "433.22499999999997px", height: "173.29px" },
    },
    {
      name: "landscape-mobile-390-normal",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 390,
        viewportHeight: 844,
        isRotated: false,
      },
      expected: { width: "290px", height: "193.285px" },
    },
    {
      name: "landscape-mobile-390-rotated",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 390,
        viewportHeight: 844,
        isRotated: true,
      },
      expected: { width: "462.551px", height: "193.285px" },
    },
    {
      name: "landscape-mobile-landscape-normal",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 844,
        viewportHeight: 390,
        isRotated: false,
      },
      expected: { width: "360.09002250562645px", height: "240px" },
    },
    {
      name: "landscape-mobile-landscape-rotated",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 844,
        viewportHeight: 390,
        isRotated: true,
      },
      expected: { width: "240px", height: "159.96px" },
    },
    {
      name: "landscape-tablet-normal",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 768,
        viewportHeight: 1024,
        isRotated: false,
      },
      expected: { width: "668px", height: "445.222px" },
    },
    {
      name: "landscape-tablet-rotated",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 768,
        viewportHeight: 1024,
        isRotated: true,
      },
      expected: { width: "874px", height: "445.222px" },
    },
    {
      name: "landscape-desktop-normal",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 1366,
        viewportHeight: 768,
        isRotated: false,
      },
      expected: { width: "927.2318079519881px", height: "618px" },
    },
    {
      name: "landscape-desktop-rotated",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 1366,
        viewportHeight: 768,
        isRotated: true,
      },
      expected: { width: "618px", height: "411.897px" },
    },
    {
      name: "landscape-wide-normal",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 1920,
        viewportHeight: 1080,
        isRotated: false,
      },
      expected: { width: "1395.3488372093025px", height: "930px" },
    },
    {
      name: "landscape-wide-rotated",
      input: {
        imageWidth: 2000,
        imageHeight: 1333,
        viewportWidth: 1920,
        viewportHeight: 1080,
        isRotated: true,
      },
      expected: { width: "930px", height: "619.845px" },
    },
    {
      name: "portrait-mobile-360-normal",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 360,
        viewportHeight: 800,
        isRotated: false,
      },
      expected: { width: "260px", height: "390.0975243810953px" },
    },
    {
      name: "portrait-mobile-360-rotated",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 360,
        viewportHeight: 800,
        isRotated: true,
      },
      expected: { width: "173.29px", height: "260px" },
    },
    {
      name: "portrait-mobile-390-normal",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 390,
        viewportHeight: 844,
        isRotated: false,
      },
      expected: { width: "290px", height: "435.10877719429857px" },
    },
    {
      name: "portrait-mobile-390-rotated",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 390,
        viewportHeight: 844,
        isRotated: true,
      },
      expected: { width: "193.285px", height: "290px" },
    },
    {
      name: "portrait-mobile-landscape-normal",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 844,
        viewportHeight: 390,
        isRotated: false,
      },
      expected: { width: "159.96px", height: "240px" },
    },
    {
      name: "portrait-mobile-landscape-rotated",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 844,
        viewportHeight: 390,
        isRotated: true,
      },
      expected: { width: "159.95999999999998px", height: "240px" },
    },
    {
      name: "portrait-tablet-normal",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 768,
        viewportHeight: 1024,
        isRotated: false,
      },
      expected: { width: "582.521px", height: "874px" },
    },
    {
      name: "portrait-tablet-rotated",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 768,
        viewportHeight: 1024,
        isRotated: true,
      },
      expected: { width: "445.222px", height: "668px" },
    },
    {
      name: "portrait-desktop-normal",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 1366,
        viewportHeight: 768,
        isRotated: false,
      },
      expected: { width: "411.897px", height: "618px" },
    },
    {
      name: "portrait-desktop-rotated",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 1366,
        viewportHeight: 768,
        isRotated: true,
      },
      expected: { width: "411.897px", height: "618px" },
    },
    {
      name: "portrait-wide-normal",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 1920,
        viewportHeight: 1080,
        isRotated: false,
      },
      expected: { width: "619.845px", height: "930px" },
    },
    {
      name: "portrait-wide-rotated",
      input: {
        imageWidth: 1333,
        imageHeight: 2000,
        viewportWidth: 1920,
        viewportHeight: 1080,
        isRotated: true,
      },
      expected: { width: "619.8449999999999px", height: "930px" },
    },
    {
      name: "square-mobile-360-normal",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 360,
        viewportHeight: 800,
        isRotated: false,
      },
      expected: { width: "260px", height: "260px" },
    },
    {
      name: "square-mobile-360-rotated",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 360,
        viewportHeight: 800,
        isRotated: true,
      },
      expected: { width: "260px", height: "260px" },
    },
    {
      name: "square-mobile-390-normal",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 390,
        viewportHeight: 844,
        isRotated: false,
      },
      expected: { width: "290px", height: "290px" },
    },
    {
      name: "square-mobile-390-rotated",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 390,
        viewportHeight: 844,
        isRotated: true,
      },
      expected: { width: "290px", height: "290px" },
    },
    {
      name: "square-mobile-landscape-normal",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 844,
        viewportHeight: 390,
        isRotated: false,
      },
      expected: { width: "240px", height: "240px" },
    },
    {
      name: "square-mobile-landscape-rotated",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 844,
        viewportHeight: 390,
        isRotated: true,
      },
      expected: { width: "240px", height: "240px" },
    },
    {
      name: "square-tablet-normal",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 768,
        viewportHeight: 1024,
        isRotated: false,
      },
      expected: { width: "668px", height: "668px" },
    },
    {
      name: "square-tablet-rotated",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 768,
        viewportHeight: 1024,
        isRotated: true,
      },
      expected: { width: "668px", height: "668px" },
    },
    {
      name: "square-desktop-normal",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 1366,
        viewportHeight: 768,
        isRotated: false,
      },
      expected: { width: "618px", height: "618px" },
    },
    {
      name: "square-desktop-rotated",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 1366,
        viewportHeight: 768,
        isRotated: true,
      },
      expected: { width: "618px", height: "618px" },
    },
    {
      name: "square-wide-normal",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 1920,
        viewportHeight: 1080,
        isRotated: false,
      },
      expected: { width: "930px", height: "930px" },
    },
    {
      name: "square-wide-rotated",
      input: {
        imageWidth: 1000,
        imageHeight: 1000,
        viewportWidth: 1920,
        viewportHeight: 1080,
        isRotated: true,
      },
      expected: { width: "930px", height: "930px" },
    },
  ] satisfies readonly LegacyResizeCase[],
} as const;
