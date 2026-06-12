import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureApiApp } from "./bootstrap/configure-api-app.js";
import type { ApiEnv } from "./config/api-env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ApiEnv, true>);
  const port = configService.get("PORT", { infer: true });

  configureApiApp(app, configService);

  await app.listen(port);
}

void bootstrap();
