import { getModelToken } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type UserEntity, UserModelName } from "../src/auth/user.schema.js";
import type { ImageEntity } from "../src/images/image.schema.js";
import { ImageModelName } from "../src/images/image.schema.js";
import type { TagEntity } from "../src/tags/tag.schema.js";
import { TagModelName } from "../src/tags/tag.schema.js";
import {
  sampleImageFixture,
  sampleLoginCredentialsFixture,
  sampleUserFixture,
} from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";
import { loginAndGetToken } from "./support/auth-helper.js";

describe("/tags", () => {
  let testApp: ApiTestApp | undefined;
  let tagModel: Model<TagEntity>;
  let imageModel: Model<ImageEntity>;
  let token: string;

  const getTestApp = (): ApiTestApp => {
    if (!testApp) {
      throw new Error("test app was not initialized");
    }

    return testApp;
  };

  beforeAll(async () => {
    testApp = await createApiTestApp();
    const app = getTestApp().app;
    tagModel = app.get<Model<TagEntity>>(getModelToken(TagModelName));
    imageModel = app.get<Model<ImageEntity>>(getModelToken(ImageModelName));
    const userModel = app.get<Model<UserEntity>>(getModelToken(UserModelName));
    await userModel.create({
      ...sampleUserFixture,
      password: await bcrypt.hash(sampleLoginCredentialsFixture.password, 4),
    });
    token = await loginAndGetToken(app);
  });

  beforeEach(async () => {
    await tagModel.deleteMany({}).exec();
    await imageModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("lists tags sorted by name", async () => {
    await tagModel.create([
      { code: "landscape", name: "Landscape" },
      { code: "architecture", name: "Architecture" },
    ]);

    const response = await request(getTestApp().app.getHttpServer())
      .get("/tags")
      .expect(200);

    const names = (response.body as TagEntity[]).map((tag) => tag.name);
    expect(names).toEqual(["Architecture", "Landscape"]);
  });

  it("creates a tag with a valid token", async () => {
    const response = await request(getTestApp().app.getHttpServer())
      .post("/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "landscape", name: "Landscape" })
      .expect(201);

    expect(response.body).toMatchObject({
      code: "landscape",
      name: "Landscape",
    });
  });

  it("updates a tag with a valid token", async () => {
    const created = await tagModel.create({
      code: "landscape",
      name: "Landscape",
    });

    const response = await request(getTestApp().app.getHttpServer())
      .patch(`/tags/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nature" })
      .expect(200);

    expect(response.body).toMatchObject({ code: "landscape", name: "Nature" });
  });

  it("deletes a tag with a valid token", async () => {
    const created = await tagModel.create({
      code: "landscape",
      name: "Landscape",
    });

    await request(getTestApp().app.getHttpServer())
      .delete(`/tags/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    expect(await tagModel.countDocuments().exec()).toBe(0);
  });

  it("sync removes image tags missing from the tag collection", async () => {
    await tagModel.create({ code: "landscape", name: "Landscape" });
    const imageToCreate: ImageEntity = {
      city: "Osaka",
      country: "Japan",
      description: "Pinned landscape fixture",
      images: sampleImageFixture.images,
      metadata: {
        ...sampleImageFixture.metadata,
        takenAt: new Date("2026-06-10T10:00:00.000Z"),
      },
      original: sampleImageFixture.original,
      state: "Osaka",
      tags: ["Landscape", "Orphan"],
    };
    const image = await imageModel.create(imageToCreate);

    await request(getTestApp().app.getHttpServer())
      .post("/tags/sync")
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const synced = await imageModel.findById(image._id).exec();
    expect(synced?.tags).toEqual(["Landscape"]);
  });

  it("rejects mutations without a token", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/tags")
      .send({ code: "landscape", name: "Landscape" })
      .expect(401);

    await request(getTestApp().app.getHttpServer())
      .post("/tags/sync")
      .expect(401);
  });

  it("rejects unknown body fields", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ $where: "1", code: "landscape", name: "Landscape" })
      .expect(400);
  });
});
