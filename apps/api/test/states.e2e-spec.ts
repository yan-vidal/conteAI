import { getModelToken } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type UserEntity, UserModelName } from "../src/auth/user.schema.js";
import type { StateEntity } from "../src/geo/geo.schema.js";
import { StateModelName } from "../src/geo/geo.schema.js";
import {
  sampleLoginCredentialsFixture,
  sampleUserFixture,
} from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";
import { loginAndGetToken } from "./support/auth-helper.js";

describe("/states", () => {
  let testApp: ApiTestApp | undefined;
  let stateModel: Model<StateEntity>;
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
    stateModel = app.get<Model<StateEntity>>(getModelToken(StateModelName));
    const userModel = app.get<Model<UserEntity>>(getModelToken(UserModelName));
    await userModel.create({
      ...sampleUserFixture,
      password: await bcrypt.hash(sampleLoginCredentialsFixture.password, 4),
    });
    token = await loginAndGetToken(app);
  });

  beforeEach(async () => {
    await stateModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("lists states sorted by name", async () => {
    await stateModel.create([
      { code: "OS", countryParentCode: "JP", name: "Osaka" },
      { code: "AI", countryParentCode: "JP", name: "Aichi" },
    ]);

    const response = await request(getTestApp().app.getHttpServer())
      .get("/states")
      .expect(200);

    const names = (response.body as StateEntity[]).map((state) => state.name);
    expect(names).toEqual(["Aichi", "Osaka"]);
  });

  it("creates a state with country parent code", async () => {
    const response = await request(getTestApp().app.getHttpServer())
      .post("/states")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "OS", countryParentCode: "JP", name: "Osaka" })
      .expect(201);

    expect(response.body).toMatchObject({
      code: "OS",
      countryParentCode: "JP",
      name: "Osaka",
    });
  });

  it("updates a state with a valid token", async () => {
    const created = await stateModel.create({
      code: "OS",
      countryParentCode: "JP",
      name: "Osaka",
    });

    const response = await request(getTestApp().app.getHttpServer())
      .patch(`/states/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ countryParentCode: "JPN", name: "Osaka Prefecture" })
      .expect(200);

    expect(response.body).toMatchObject({
      code: "OS",
      countryParentCode: "JPN",
      name: "Osaka Prefecture",
    });
  });

  it("deletes a state with a valid token", async () => {
    const created = await stateModel.create({
      code: "OS",
      countryParentCode: "JP",
      name: "Osaka",
    });

    await request(getTestApp().app.getHttpServer())
      .delete(`/states/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    expect(await stateModel.countDocuments().exec()).toBe(0);
  });

  it("rejects mutations without a token", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/states")
      .send({ code: "OS", countryParentCode: "JP", name: "Osaka" })
      .expect(401);
  });

  it("rejects unknown body fields", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/states")
      .set("Authorization", `Bearer ${token}`)
      .send({ $where: "1", code: "OS", name: "Osaka" })
      .expect(400);
  });
});
