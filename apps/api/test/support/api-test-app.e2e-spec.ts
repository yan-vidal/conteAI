import { afterAll, describe, expect, it } from "vitest";
import {
  imageListFixture,
  sampleTagFixture,
} from "../fixtures/api-fixtures.js";
import { type ApiTestApp, createApiTestApp } from "./api-test-app.js";

describe("api test harness", () => {
  let testApp: ApiTestApp | undefined;

  afterAll(async () => {
    await testApp?.close();
  });

  it("bootstraps AppModule through the shared helper", async () => {
    testApp = await createApiTestApp();

    expect(testApp.app.getHttpServer()).toBeDefined();
  });

  it("exports contract fixtures for later endpoint tests", () => {
    expect(sampleTagFixture).toMatchObject({
      code: "landscape",
      name: "Landscape",
    });
    expect(imageListFixture).toMatchObject({
      total: 1,
      images: [
        {
          description: "Pinned landscape fixture",
          tags: ["Landscape"],
        },
      ],
    });
  });
});
