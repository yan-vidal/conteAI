import { Buffer } from "node:buffer";
import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getModelToken } from "@nestjs/mongoose";
import { mockClient } from "aws-sdk-client-mock";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import sharp from "sharp";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { type UserEntity, UserModelName } from "../src/auth/user.schema.js";
import { HTTP_CLIENT } from "../src/google/http-client.js";
import type { ImageEntity } from "../src/images/image.schema.js";
import { ImageModelName } from "../src/images/image.schema.js";
import { type TagEntity, TagModelName } from "../src/tags/tag.schema.js";
import {
  sampleLoginCredentialsFixture,
  sampleUserFixture,
} from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";
import { loginAndGetToken } from "./support/auth-helper.js";

const s3Mock = mockClient(S3Client);
const httpPost = vi.fn();
const httpGet = vi.fn();

const visionResponse = (versionCount: number, labels: string[]) => ({
  data: {
    responses: Array.from({ length: versionCount }, (_, index) => ({
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: [
            {
              color: { blue: 30, green: 20, red: 10 + index },
              pixelFraction: 0.4,
              score: 0.9,
            },
          ],
        },
      },
      ...(index === 0 && {
        labelAnnotations: labels.map((description) => ({ description })),
      }),
    })),
  },
  status: 200,
});

describe("POST /images", () => {
  let testApp: ApiTestApp | undefined;
  let imageModel: Model<ImageEntity>;
  let tagModel: Model<TagEntity>;
  let token: string;
  let jpeg: Buffer;

  const getTestApp = (): ApiTestApp => {
    if (!testApp) {
      throw new Error("test app was not initialized");
    }

    return testApp;
  };

  const server = () => getTestApp().app.getHttpServer();

  beforeAll(async () => {
    testApp = await createApiTestApp({
      configureModule: (builder) =>
        builder
          .overrideProvider(HTTP_CLIENT)
          .useValue({ get: httpGet, post: httpPost }),
    });
    const app = getTestApp().app;
    imageModel = app.get<Model<ImageEntity>>(getModelToken(ImageModelName));
    tagModel = app.get<Model<TagEntity>>(getModelToken(TagModelName));
    const userModel = app.get<Model<UserEntity>>(getModelToken(UserModelName));
    await userModel.create({
      ...sampleUserFixture,
      password: await bcrypt.hash(sampleLoginCredentialsFixture.password, 4),
    });
    token = await loginAndGetToken(app);
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

  beforeEach(async () => {
    s3Mock.reset();
    httpPost.mockReset();
    httpGet.mockReset();
    httpGet.mockResolvedValue({ data: { results: [] }, status: 200 });
    await imageModel.deleteMany({}).exec();
    await tagModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("uploads a multi-version image, filters tags, and stores relative keys", async () => {
    await tagModel.create({ code: "landscape", name: "Landscape" });
    s3Mock.on(PutObjectCommand).resolves({});
    httpPost.mockResolvedValue(visionResponse(2, ["Landscape", "Unknown"]));

    const response = await request(server())
      .post("/images")
      .set("Authorization", `Bearer ${token}`)
      .field("versionNames", "Original")
      .field("versionNames", "Edited")
      .field("description", "A pinned shot")
      .attach("files", jpeg, {
        contentType: "image/jpeg",
        filename: "original.jpg",
      })
      .attach("files", jpeg, {
        contentType: "image/jpeg",
        filename: "edited.jpg",
      })
      .expect(201);

    expect(response.body.tags).toEqual(["Landscape"]);
    expect(response.body.description).toBe("A pinned shot");
    expect(response.body.images).toHaveLength(1);
    expect(response.body.original.versionName).toBe("Original");
    expect(response.body.original.fullSizeUrl).toMatch(
      /^https:\/\/cdn\.test\//,
    );
    expect(response.body.original.colorPalette[0]).toMatchObject({
      blue: 30,
      green: 20,
      pixelFraction: 0.4,
      red: 10,
      score: 0.9,
    });
    expect(response.body.metadata.fullSizeWidth).toBe(600);

    const stored = await imageModel.findOne().lean().exec();
    expect(stored?.original.fullSizeUrl).not.toMatch(/^https:\/\//);
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(6);
  });

  it("uploads an original-only image with an empty edited versions array", async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    httpPost.mockResolvedValue(visionResponse(1, []));

    const response = await request(server())
      .post("/images")
      .set("Authorization", `Bearer ${token}`)
      .field("versionNames", "Original")
      .attach("files", jpeg, {
        contentType: "image/jpeg",
        filename: "original.jpg",
      })
      .expect(201);

    expect(response.body.images).toEqual([]);
    expect(response.body.original.versionName).toBe("Original");
    expect(response.body.tags).toEqual([]);
  });

  it("rejects non-image uploads", async () => {
    await request(server())
      .post("/images")
      .set("Authorization", `Bearer ${token}`)
      .field("versionNames", "Original")
      .attach("files", Buffer.from("not an image"), {
        contentType: "text/plain",
        filename: "notes.txt",
      })
      .expect(400);
  });

  it("rolls back uploaded keys when the pipeline fails", async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    s3Mock.on(DeleteObjectsCommand).resolves({});
    httpPost.mockRejectedValue(new Error("vision unavailable"));

    await request(server())
      .post("/images")
      .set("Authorization", `Bearer ${token}`)
      .field("versionNames", "Original")
      .attach("files", jpeg, {
        contentType: "image/jpeg",
        filename: "original.jpg",
      })
      .expect(500);

    expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(1);
    expect(await imageModel.countDocuments().exec()).toBe(0);
  });

  it("rejects uploads without a token", async () => {
    await request(server())
      .post("/images")
      .field("versionNames", "Original")
      .attach("files", jpeg, {
        contentType: "image/jpeg",
        filename: "original.jpg",
      })
      .expect(401);
  });
});
