import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModuleBuilder } from "@nestjs/testing";
import { AppModule } from "../../src/app.module.js";
import { configureApiApp } from "../../src/bootstrap/configure-api-app.js";
import type { ApiEnv } from "../../src/config/api-env.js";

export interface ApiTestApp {
  app: INestApplication;
  close: () => Promise<void>;
}

export interface CreateApiTestAppOptions {
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}

export const createApiTestApp = async (
  options: CreateApiTestAppOptions = {},
): Promise<ApiTestApp> => {
  const baseBuilder = Test.createTestingModule({
    imports: [AppModule],
  });
  const builder = options.configureModule?.(baseBuilder) ?? baseBuilder;
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  const configService = app.get(ConfigService<ApiEnv, true>);

  configureApiApp(app, configService);

  await app.init();

  return {
    app,
    close: async () => {
      await app.close();
    },
  };
};
