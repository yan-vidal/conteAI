import { getModelToken } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type UserEntity, UserModelName } from "../src/auth/user.schema.js";
import type { CountryEntity } from "../src/geo/geo.schema.js";
import { CountryModelName } from "../src/geo/geo.schema.js";
import {
  sampleLoginCredentialsFixture,
  sampleUserFixture,
} from "./fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";
import { loginAndGetToken } from "./support/auth-helper.js";

describe("/countries", () => {
  let testApp: ApiTestApp | undefined;
  let countryModel: Model<CountryEntity>;
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
    countryModel = app.get<Model<CountryEntity>>(
      getModelToken(CountryModelName),
    );
    const userModel = app.get<Model<UserEntity>>(getModelToken(UserModelName));
    await userModel.create({
      ...sampleUserFixture,
      password: await bcrypt.hash(sampleLoginCredentialsFixture.password, 4),
    });
    token = await loginAndGetToken(app);
  });

  beforeEach(async () => {
    await countryModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("lists countries sorted by name", async () => {
    await countryModel.create([
      { code: "JP", name: "Japan" },
      { code: "BR", name: "Brazil" },
    ]);

    const response = await request(getTestApp().app.getHttpServer())
      .get("/countries")
      .expect(200);

    const names = (response.body as CountryEntity[]).map(
      (country) => country.name,
    );
    expect(names).toEqual(["Brazil", "Japan"]);
  });

  it("creates a country with a valid token", async () => {
    const response = await request(getTestApp().app.getHttpServer())
      .post("/countries")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "PT", name: "Portugal" })
      .expect(201);

    expect(response.body).toMatchObject({ code: "PT", name: "Portugal" });
    expect(await countryModel.countDocuments().exec()).toBe(1);
  });

  it("updates a country with a valid token", async () => {
    const created = await countryModel.create({ code: "PT", name: "Portugal" });

    const response = await request(getTestApp().app.getHttpServer())
      .patch(`/countries/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Portugal Republic" })
      .expect(200);

    expect(response.body).toMatchObject({
      code: "PT",
      name: "Portugal Republic",
    });
  });

  it("deletes a country with a valid token", async () => {
    const created = await countryModel.create({ code: "PT", name: "Portugal" });

    await request(getTestApp().app.getHttpServer())
      .delete(`/countries/${String(created._id)}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    expect(await countryModel.countDocuments().exec()).toBe(0);
  });

  it("rejects mutations without a token", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/countries")
      .send({ code: "PT", name: "Portugal" })
      .expect(401);
  });

  it("rejects unknown body fields", async () => {
    await request(getTestApp().app.getHttpServer())
      .post("/countries")
      .set("Authorization", `Bearer ${token}`)
      .send({ $where: "1", code: "PT", name: "Portugal" })
      .expect(400);
  });
});
