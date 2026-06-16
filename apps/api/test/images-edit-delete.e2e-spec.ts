import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { getModelToken } from "@nestjs/mongoose";
import { mockClient } from "aws-sdk-client-mock";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type UserEntity, UserModelName } from "../src/auth/user.schema.js";
import type {
  ImageEntity,
  ImageVersionEntity,
} from "../src/images/image.schema.js";
import { ImageModelName } from "../src/images/image.schema.js";
import {
  sampleImageFixture,
  sampleLoginCredentialsFixture,
  sampleUserFixture,
} from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";
import { loginAndGetToken } from "./support/auth-helper.js";

const s3Mock = mockClient(S3Client);

const makeVersion = (
  prefix: string,
  versionName: string,
): ImageVersionEntity => ({
  colorPalette: [],
  fullSizeUrl: `${prefix}-full.jpg`,
  lazyThumbnailBase64: "data:image/webp;base64,fixture",
  optimizedUrl: `${prefix}-optimized.jpg`,
  thumbnailUrl: `${prefix}-thumbnail.jpg`,
  versionName,
});

const makeImage = (): ImageEntity => ({
  country: "Japan",
  description: "Original description",
  images: [makeVersion("edited", "Edited")],
  metadata: {
    ...sampleImageFixture.metadata,
    takenAt: new Date("2026-06-10T10:00:00"),
  },
  original: makeVersion("original", "Original"),
  tags: ["Landscape"],
});

describe("/images (edit and delete)", () => {
  let testApp: ApiTestApp | undefined;
  let imageModel: Model<ImageEntity>;
  let token: string;

  const getTestApp = (): ApiTestApp => {
    if (!testApp) {
      throw new Error("test app was not initialized");
    }

    return testApp;
  };

  const server = () => getTestApp().app.getHttpServer();

  beforeAll(async () => {
    testApp = await createApiTestApp();
    const app = getTestApp().app;
    imageModel = app.get<Model<ImageEntity>>(getModelToken(ImageModelName));
    const userModel = app.get<Model<UserEntity>>(getModelToken(UserModelName));
    await userModel.create({
      ...sampleUserFixture,
      password: await bcrypt.hash(sampleLoginCredentialsFixture.password, 4),
    });
    token = await loginAndGetToken(app);
  });

  beforeEach(async () => {
    s3Mock.reset();
    await imageModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("applies a partial patch without touching other fields", async () => {
    const created = await imageModel.create(makeImage());

    const response = await request(server())
      .patch(`/images/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Updated description" })
      .expect(200);

    expect(response.body.description).toBe("Updated description");
    expect(response.body.country).toBe("Japan");
  });

  it("accepts a patch body without a metadata field", async () => {
    const created = await imageModel.create(makeImage());

    await request(server())
      .patch(`/images/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ tags: ["Mountain"] })
      .expect(200);

    const stored = await imageModel.findById(created._id).lean().exec();
    expect(stored?.tags).toEqual(["Mountain"]);
  });

  it("strips absolute urls to relative keys but returns absolute urls", async () => {
    const created = await imageModel.create(makeImage());

    const response = await request(server())
      .patch(`/images/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        original: {
          ...makeVersion("original", "Original"),
          fullSizeUrl: "https://cdn.test/original-full.jpg",
          optimizedUrl: "https://cdn.test/original-optimized.jpg",
          thumbnailUrl: "https://cdn.test/original-thumbnail.jpg",
        },
      })
      .expect(200);

    expect(response.body.original.fullSizeUrl).toBe(
      "https://cdn.test/original-full.jpg",
    );

    const stored = await imageModel.findById(created._id).lean().exec();
    expect(stored?.original.fullSizeUrl).toBe("original-full.jpg");
  });

  it("toggles the favorite flag via patch", async () => {
    const created = await imageModel.create(makeImage());

    const response = await request(server())
      .patch(`/images/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ favorite: true })
      .expect(200);

    expect(response.body.favorite).toBe(true);
    const stored = await imageModel.findById(created._id).lean().exec();
    expect(stored?.favorite).toBe(true);
  });

  it("returns 404 when patching a missing image", async () => {
    await request(server())
      .patch("/images/68b0000000000000000000ff")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "x" })
      .expect(404);
  });

  it("deletes every stored key from S3 and removes the document", async () => {
    s3Mock.on(DeleteObjectsCommand).resolves({});
    const created = await imageModel.create(makeImage());

    await request(server())
      .delete(`/images/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const calls = s3Mock.commandCalls(DeleteObjectsCommand);
    expect(calls).toHaveLength(1);
    const keys = calls[0]?.args[0].input.Delete?.Objects?.map(
      (object) => object.Key,
    );
    expect(keys).toEqual([
      "edited-full.jpg",
      "edited-thumbnail.jpg",
      "edited-optimized.jpg",
      "original-full.jpg",
      "original-thumbnail.jpg",
      "original-optimized.jpg",
    ]);
    expect(await imageModel.countDocuments().exec()).toBe(0);
  });

  it("rejects mutations without a token", async () => {
    const created = await imageModel.create(makeImage());

    await request(server())
      .patch(`/images/${String(created._id)}`)
      .send({ description: "x" })
      .expect(401);

    await request(server())
      .delete(`/images/${String(created._id)}`)
      .expect(401);
  });
});
