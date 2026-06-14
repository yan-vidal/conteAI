import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import type { ApiEnv } from "../config/api-env.js";
import { S3_CLIENT } from "./s3-client.token.js";
import { StorageService } from "./storage.service.js";

const s3Mock = mockClient(S3Client);

const createService = async (): Promise<StorageService> => {
  const moduleRef = await Test.createTestingModule({
    providers: [
      StorageService,
      { provide: S3_CLIENT, useValue: new S3Client({ region: "us-east-1" }) },
      {
        provide: ConfigService,
        useValue: new ConfigService<ApiEnv, true>({
          BUCKET_NAME: "test-bucket",
        }),
      },
    ],
  }).compile();

  return moduleRef.get(StorageService);
};

describe("StorageService", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("uploads an image and returns the relative key", async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    const service = await createService();

    const key = await service.uploadImage(
      "1700000000000-photo.jpg",
      Buffer.from("binary"),
      "image/jpeg",
    );

    expect(key).toBe("1700000000000-photo.jpg");
    const calls = s3Mock.commandCalls(PutObjectCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args[0].input).toMatchObject({
      Bucket: "test-bucket",
      ContentType: "image/jpeg",
      Key: "1700000000000-photo.jpg",
    });
  });

  it("deletes all supplied keys in a single batch", async () => {
    s3Mock.on(DeleteObjectsCommand).resolves({});
    const service = await createService();

    await service.deleteImages(["a.jpg", "b.jpg", "c.jpg"]);

    const calls = s3Mock.commandCalls(DeleteObjectsCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args[0].input).toEqual({
      Bucket: "test-bucket",
      Delete: {
        Objects: [{ Key: "a.jpg" }, { Key: "b.jpg" }, { Key: "c.jpg" }],
      },
    });
  });

  it("treats an empty key list as a no-op", async () => {
    const service = await createService();

    await service.deleteImages([]);

    expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
  });
});
