import request from "supertest";
import { afterAll, beforeAll, describe, it } from "vitest";
import { type ApiTestApp, createApiTestApp } from "./support/api-test-app.js";

describe("GET /health", () => {
  let testApp: ApiTestApp;

  beforeAll(async () => {
    testApp = await createApiTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it("responds with ok status", async () => {
    await request(testApp.app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect({
        status: "ok",
      });
  });
});
