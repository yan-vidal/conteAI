import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import type { ApiEnv } from "./config/api-env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ApiEnv, true>);
  const port = configService.get("PORT", { infer: true });
  const corsOrigin = configService.get("CORS_ORIGIN", { infer: true });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    origin: corsOrigin ?? true,
  });

  await app.listen(port);
}

void bootstrap();
