import type { Buffer } from "node:buffer";
import type { ImageMetadata } from "@conteai/shared";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { ImageProcessingService } from "./image-processing.service.js";

const metadata: ImageMetadata = {
  aperture: "f/1.8",
  camera: "Test",
  flash: "Off",
  fullSizeHeight: 300,
  fullSizeWidth: 600,
  iso: "100",
  lens: "Wide",
  optimizedHeight: 100,
  optimizedWidth: 200,
  shutterSpeed: "1/100",
  thumbnailHeight: 30,
  thumbnailWidth: 60,
  whiteBalance: "Auto",
};

describe("ImageProcessingService", () => {
  const service = new ImageProcessingService();
  let jpeg: Buffer;

  beforeAll(async () => {
    jpeg = await sharp({
      create: {
        background: { b: 80, g: 50, r: 200 },
        channels: 3,
        height: 300,
        width: 600,
      },
    })
      .jpeg()
      .toBuffer();
  });

  it("creates lazy, thumbnail, optimized, and full-size derivatives", async () => {
    const derivatives = await service.createDerivatives(jpeg, metadata);

    expect(derivatives.lazyThumbnailBase64).toMatch(
      /^data:image\/webp;base64,/,
    );
    expect(derivatives.fullSizeBuffer).toBe(jpeg);

    const thumbnail = await sharp(derivatives.thumbnailBuffer).metadata();
    expect(thumbnail.width).toBe(60);
    expect(thumbnail.height).toBe(30);

    const optimized = await sharp(derivatives.optimizedBuffer).metadata();
    expect(optimized.width).toBe(200);
    expect(optimized.height).toBe(100);
  });

  it("builds sanitized, suffixed object keys", () => {
    const keys = service.buildObjectKeys("My Photo!@#.JPG");

    expect(keys.fullSizeKey).toMatch(/^\d+-My Photo\.JPG$/);
    expect(keys.optimizedKey).toMatch(/^\d+-My Photo-optimized\.JPG$/);
    expect(keys.thumbnailKey).toMatch(/^\d+-My Photo-thumbnail\.JPG$/);
  });
});
