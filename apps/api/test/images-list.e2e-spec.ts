import { getModelToken } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type {
  ImageEntity,
  ImageVersionEntity,
} from "../src/images/image.schema.js";
import { ImageModelName } from "../src/images/image.schema.js";
import { sampleImageFixture } from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";

interface ImageOverrides {
  tags?: string[];
  country?: string;
  takenAt?: Date;
  versionKey?: string;
}

const makeVersion = (
  fullSizeUrl: string,
  versionName: string,
): ImageVersionEntity => ({
  colorPalette: [],
  fullSizeUrl,
  lazyThumbnailBase64: "data:image/webp;base64,fixture",
  optimizedUrl: "optimized.jpg",
  thumbnailUrl: "thumbnail.jpg",
  versionName,
});

const makeImage = (overrides: ImageOverrides = {}): ImageEntity => {
  const key = overrides.versionKey ?? "landscape";

  return {
    country: overrides.country ?? "Japan",
    description: "Listing fixture",
    images: [makeVersion(`${key}-full.jpg`, "Edited")],
    metadata: {
      ...sampleImageFixture.metadata,
      takenAt: overrides.takenAt ?? new Date("2026-06-10T10:00:00"),
    },
    original: makeVersion(`${key}-original.jpg`, "Original"),
    tags: overrides.tags ?? ["Landscape"],
  };
};

describe("GET /images", () => {
  let testApp: ApiTestApp | undefined;
  let imageModel: Model<ImageEntity>;

  const getTestApp = (): ApiTestApp => {
    if (!testApp) {
      throw new Error("test app was not initialized");
    }

    return testApp;
  };

  const server = () => getTestApp().app.getHttpServer();

  beforeAll(async () => {
    testApp = await createApiTestApp();
    imageModel = getTestApp().app.get<Model<ImageEntity>>(
      getModelToken(ImageModelName),
    );
  });

  beforeEach(async () => {
    await imageModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("returns { images, total } with absolute urls and default pagination", async () => {
    await imageModel.create(makeImage({ versionKey: "photo" }));

    const response = await request(server()).get("/images").expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.images).toHaveLength(1);
    expect(response.body.images[0].original.fullSizeUrl).toBe(
      "https://cdn.test/photo-original.jpg",
    );
    expect(response.body.images[0].images[0].fullSizeUrl).toBe(
      "https://cdn.test/photo-full.jpg",
    );
  });

  it("filters by tags using $all semantics", async () => {
    await imageModel.create([
      makeImage({ tags: ["Landscape", "Mountain"] }),
      makeImage({ tags: ["Portrait"] }),
    ]);

    const response = await request(server())
      .get("/images")
      .query({ tags: ["Landscape", "Mountain"] })
      .expect(200);

    expect(response.body.total).toBe(1);
  });

  it("filters by country", async () => {
    await imageModel.create([
      makeImage({ country: "Japan" }),
      makeImage({ country: "Brazil" }),
    ]);

    const response = await request(server())
      .get("/images")
      .query({ country: "Brazil" })
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.images[0].country).toBe("Brazil");
  });

  it("filters by takenAt date range", async () => {
    await imageModel.create([
      makeImage({ takenAt: new Date("2020-01-01T00:00:00.000Z") }),
      makeImage({ takenAt: new Date("2026-01-01T00:00:00.000Z") }),
    ]);

    const response = await request(server())
      .get("/images")
      .query({ takenAtFrom: "2025-01-01T00:00:00.000Z" })
      .expect(200);

    expect(response.body.total).toBe(1);
  });

  it("sorts by the requested field and order", async () => {
    await imageModel.create([
      makeImage({
        takenAt: new Date("2026-01-01T00:00:00.000Z"),
        versionKey: "old",
      }),
      makeImage({
        takenAt: new Date("2026-06-01T00:00:00.000Z"),
        versionKey: "new",
      }),
    ]);

    const response = await request(server())
      .get("/images")
      .query({ order: "desc", sort: "metadata.takenAt" })
      .expect(200);

    expect(response.body.images[0].original.fullSizeUrl).toContain("new");
  });

  it("expands the limit so a deep-linked id past the page is included", async () => {
    const created = await imageModel.create(
      Array.from({ length: 15 }, (_, index) =>
        makeImage({
          takenAt: new Date(2026, 0, 1, 0, 0, index),
          versionKey: `img-${index}`,
        }),
      ),
    );
    const sorted = [...created].sort(
      (a, b) =>
        (b.metadata.takenAt?.getTime() ?? 0) -
        (a.metadata.takenAt?.getTime() ?? 0),
    );
    const target = sorted[12];

    if (!target) {
      throw new Error("expected a 13th image in the sorted set");
    }

    const response = await request(server())
      .get("/images")
      .query({
        id: String(target._id),
        order: "desc",
        sort: "metadata.takenAt",
      })
      .expect(200);

    const ids = (response.body.images as Array<{ _id: string }>).map(
      (image) => image._id,
    );
    expect(ids).toContain(String(target._id));
  });

  it("returns 404 when the deep-linked id is outside the filtered set", async () => {
    await imageModel.create(makeImage());

    await request(server())
      .get("/images")
      .query({ id: "68b0000000000000000000ff" })
      .expect(404);
  });

  it("rejects unknown query fields to prevent operator injection", async () => {
    await request(server())
      .get("/images")
      .query({ "metadata.fullSizeWidth": "4000" })
      .expect(400);
  });
});
