import { getModelToken } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type UserEntity, UserModelName } from "../src/auth/user.schema.js";
import {
  sampleLoginCredentialsFixture,
  sampleUserFixture,
} from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";

describe("POST /authentication", () => {
  let testApp: ApiTestApp | undefined;
  let userModel: Model<UserEntity>;

  const getTestApp = (): ApiTestApp => {
    if (!testApp) {
      throw new Error("test app was not initialized");
    }

    return testApp;
  };

  beforeAll(async () => {
    testApp = await createApiTestApp();
    userModel = getTestApp().app.get<Model<UserEntity>>(
      getModelToken(UserModelName),
    );
    await userModel.create({
      ...sampleUserFixture,
      password: await bcrypt.hash(sampleLoginCredentialsFixture.password, 4),
    });
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("returns a jwt and one-hour payload for valid credentials", async () => {
    const response = await request(getTestApp().app.getHttpServer())
      .post("/authentication")
      .send(sampleLoginCredentialsFixture)
      .expect(201);
    const body: unknown = response.body;

    expect(body).toMatchObject({
      payload: {
        id: sampleUserFixture._id,
        name: sampleUserFixture.name,
      },
    });
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.payload.exp).toBeGreaterThan(
      Math.floor(Date.now() / 1000) + 3_500,
    );
    expect(response.body.payload.exp).toBeLessThan(
      Math.floor(Date.now() / 1000) + 3_700,
    );
  });

  it("returns an error response for invalid credentials", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/authentication")
      .send({
        name: sampleLoginCredentialsFixture.name,
        password: "wrong-password",
      })
      .expect(500);
  });
});
