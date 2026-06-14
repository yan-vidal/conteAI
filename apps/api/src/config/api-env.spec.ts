import { describe, expect, it } from "vitest";
import { validateApiEnv } from "./api-env.js";

describe("validateApiEnv", () => {
  it("normalizes legacy api environment variables", () => {
    const env = validateApiEnv({
      PORT: "3010",
      MONGOUSER: "user",
      MONGOPASS: "pass",
      MONGOIP: "mongo.local",
      MONGOPORT: "27017",
      MONGODBNAME: "conteai",
      JWT_SECRET: "secret",
      BUCKET_KEY: "bucket-key",
      BUCKET_SECRET: "bucket-secret",
      BUCKET_REGION: "us-east-1",
      BUCKET_NAME: "conteai-images",
      BUCKET_API: "https://s3.local",
      BUCKET_URL: "https://cdn.local",
      GOOGLEAPIKEY: "google-key",
      CORS_ORIGIN: "http://localhost:3001",
    });

    expect(env).toMatchObject({
      PORT: 3010,
      MONGO_URI: "mongodb://user:pass@mongo.local:27017/conteai",
      JWT_SECRET: "secret",
      BUCKET_KEY: "bucket-key",
      BUCKET_SECRET: "bucket-secret",
      BUCKET_REGION: "us-east-1",
      BUCKET_NAME: "conteai-images",
      BUCKET_API: "https://s3.local",
      BUCKET_URL: "https://cdn.local",
      GOOGLE_API_KEY: "google-key",
      CORS_ORIGIN: "http://localhost:3001",
    });
  });

  it("rejects missing jwt secret", () => {
    expect(() =>
      validateApiEnv({
        MONGO_URI: "mongodb://localhost:27017/conteai",
        BUCKET_KEY: "bucket-key",
        BUCKET_SECRET: "bucket-secret",
        BUCKET_REGION: "us-east-1",
        BUCKET_NAME: "conteai-images",
        BUCKET_URL: "https://cdn.local",
        GOOGLE_API_KEY: "google-key",
      }),
    ).toThrow("JWT_SECRET");
  });
});
