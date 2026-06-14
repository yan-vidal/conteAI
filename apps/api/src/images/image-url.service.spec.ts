import { describe, expect, it } from "vitest";
import { sampleImageFixture } from "../../test/fixtures/api-fixtures.js";
import {
  stripPublicImageUrls,
  withPublicImageUrls,
} from "./image-url.service.js";

describe("image url helpers", () => {
  it("prefixes relative image keys without mutating the caller document", () => {
    const [documentWithUrls] = withPublicImageUrls(
      [sampleImageFixture],
      "https://cdn.example.com/",
    );

    expect(documentWithUrls?.original.fullSizeUrl).toBe(
      "https://cdn.example.com/landscape-original.jpg",
    );
    expect(documentWithUrls?.images[0]?.optimizedUrl).toBe(
      "https://cdn.example.com/landscape-optimized.jpg",
    );
    expect(sampleImageFixture.original.fullSizeUrl).toBe(
      "landscape-original.jpg",
    );
  });

  it("does not double-prefix absolute image urls", () => {
    const [documentWithUrls] = withPublicImageUrls(
      [
        {
          ...sampleImageFixture,
          original: {
            ...sampleImageFixture.original,
            fullSizeUrl: "https://cdn.example.com/already-full.jpg",
          },
        },
      ],
      "https://cdn.example.com",
    );

    expect(documentWithUrls?.original.fullSizeUrl).toBe(
      "https://cdn.example.com/already-full.jpg",
    );
  });

  it("strips absolute image urls back to relative keys", () => {
    const firstVersion = sampleImageFixture.images[0];

    if (!firstVersion) {
      throw new Error("sampleImageFixture must include one edited version");
    }

    const stripped = stripPublicImageUrls({
      ...sampleImageFixture,
      images: [
        {
          ...firstVersion,
          fullSizeUrl: "https://cdn.example.com/version-full.jpg",
          optimizedUrl: "https://cdn.example.com/version-optimized.jpg",
          thumbnailUrl: "https://cdn.example.com/version-thumbnail.jpg",
        },
      ],
      original: {
        ...sampleImageFixture.original,
        fullSizeUrl: "https://cdn.example.com/original-full.jpg",
        optimizedUrl: "https://cdn.example.com/original-optimized.jpg",
        thumbnailUrl: "https://cdn.example.com/original-thumbnail.jpg",
      },
    });

    expect(stripped.original).toMatchObject({
      fullSizeUrl: "original-full.jpg",
      optimizedUrl: "original-optimized.jpg",
      thumbnailUrl: "original-thumbnail.jpg",
    });
    expect(stripped.images[0]).toMatchObject({
      fullSizeUrl: "version-full.jpg",
      optimizedUrl: "version-optimized.jpg",
      thumbnailUrl: "version-thumbnail.jpg",
    });
  });
});
