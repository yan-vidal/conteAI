import {
  DeleteObjectsCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Inject, Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ConfigService } from "@nestjs/config";
import type { ApiEnv } from "../config/api-env.js";
import { S3_CLIENT } from "./s3-client.token.js";

@Injectable()
export class StorageService {
  @Inject(S3_CLIENT)
  private readonly s3Client!: S3Client;

  private readonly bucketName: string;

  constructor(configService: ConfigService<ApiEnv, true>) {
    this.bucketName = configService.get("BUCKET_NAME", { infer: true });
  }

  async uploadImage(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Body: body,
        Bucket: this.bucketName,
        ContentType: contentType,
        Key: key,
      }),
    );

    return key;
  }

  async deleteImages(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: { Objects: keys.map((key) => ({ Key: key })) },
      }),
    );
  }
}
