import { type INestApplication, ValidationPipe } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { ApiEnv } from "../config/api-env.js";

export const configureApiApp = (
  app: INestApplication,
  configService: ConfigService<ApiEnv, true>,
): INestApplication => {
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

  return app;
};
