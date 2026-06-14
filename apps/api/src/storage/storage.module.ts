import { S3Client } from "@aws-sdk/client-s3";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ApiEnv } from "../config/api-env.js";
import { S3_CLIENT } from "./s3-client.token.js";
import { StorageService } from "./storage.service.js";

@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApiEnv, true>): S3Client => {
        const endpoint = configService.get("BUCKET_API", { infer: true });

        return new S3Client({
          credentials: {
            accessKeyId: configService.get("BUCKET_KEY", { infer: true }),
            secretAccessKey: configService.get("BUCKET_SECRET", {
              infer: true,
            }),
          },
          region: configService.get("BUCKET_REGION", { infer: true }),
          ...(endpoint ? { endpoint } : {}),
        });
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
