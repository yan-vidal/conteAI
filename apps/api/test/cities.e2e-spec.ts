import { getModelToken } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type UserEntity, UserModelName } from "../src/auth/user.schema.js";
import type { CityEntity } from "../src/geo/geo.schema.js";
import { CityModelName } from "../src/geo/geo.schema.js";
import {
  sampleLoginCredentialsFixture,
  sampleUserFixture,
} from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";
import { loginAndGetToken } from "./support/auth-helper.js";

describe("/cities", () => {
  let testApp: ApiTestApp | undefined;
  let cityModel: Model<CityEntity>;
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
    cityModel = app.get<Model<CityEntity>>(getModelToken(CityModelName));
    const userModel = app.get<Model<UserEntity>>(getModelToken(UserModelName));
    await userModel.create({
      ...sampleUserFixture,
      password: await bcrypt.hash(sampleLoginCredentialsFixture.password, 4),
    });
    token = await loginAndGetToken(app);
  });

  beforeEach(async () => {
    await cityModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("lists cities sorted by name", async () => {
    await cityModel.create([
      {
        code: "OSAKA",
        countryParentCode: "JP",
        name: "Osaka",
        stateParentCode: "OS",
      },
      {
        code: "KOBE",
        countryParentCode: "JP",
        name: "Kobe",
        stateParentCode: "HY",
      },
    ]);

    const response = await request(getTestApp().app.getHttpServer())
      .get("/cities")
      .expect(200);

    const names = (response.body as CityEntity[]).map((city) => city.name);
    expect(names).toEqual(["Kobe", "Osaka"]);
  });

  it("creates a city with parent codes", async () => {
    const response = await request(getTestApp().app.getHttpServer())
      .post("/cities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "OSAKA",
        countryParentCode: "JP",
        name: "Osaka",
        stateParentCode: "OS",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      code: "OSAKA",
      countryParentCode: "JP",
      name: "Osaka",
      stateParentCode: "OS",
    });
  });

  it("updates a city with a valid token", async () => {
    const created = await cityModel.create({
      code: "OSAKA",
      countryParentCode: "JP",
      name: "Osaka",
      stateParentCode: "OS",
    });

    const response = await request(getTestApp().app.getHttpServer())
      .patch(`/cities/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Osaka City", stateParentCode: "OSK" })
      .expect(200);

    expect(response.body).toMatchObject({
      code: "OSAKA",
      name: "Osaka City",
      stateParentCode: "OSK",
    });
  });

  it("deletes a city with a valid token", async () => {
    const created = await cityModel.create({
      code: "OSAKA",
      countryParentCode: "JP",
      name: "Osaka",
      stateParentCode: "OS",
    });

    await request(getTestApp().app.getHttpServer())
      .delete(`/cities/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    expect(await cityModel.countDocuments().exec()).toBe(0);
  });

  it("rejects mutations without a token", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/cities")
      .send({ code: "OSAKA", name: "Osaka" })
      .expect(401);
  });

  it("rejects unknown body fields", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/cities")
      .set("Authorization", `Bearer ${token}`)
      .send({ $where: "1", code: "OSAKA", name: "Osaka" })
      .expect(400);
  });
});
