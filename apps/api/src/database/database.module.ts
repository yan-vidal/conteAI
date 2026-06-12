import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import type { ApiEnv } from "../config/api-env.js";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApiEnv, true>) => ({
        uri: configService.get("MONGO_URI", { infer: true }),
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
