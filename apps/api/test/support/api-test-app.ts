import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModuleBuilder } from "@nestjs/testing";
import { configureApiApp } from "../../src/bootstrap/configure-api-app.js";
import type { ApiEnv } from "../../src/config/api-env.js";
import {
  createMongoMemoryTestServer,
  type MongoMemoryTestServer,
} from "./mongo-memory.js";

export interface ApiTestApp {
  app: INestApplication;
  close: () => Promise<void>;
}

export interface CreateApiTestAppOptions {
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
  useMongoMemory?: boolean;
}

export const createApiTestApp = async (
  options: CreateApiTestAppOptions = {},
): Promise<ApiTestApp> => {
  const previousMongoUri = process.env.MONGO_URI;
  const mongo =
    options.useMongoMemory === false
      ? undefined
      : await createMongoMemoryTestServer();

  if (mongo) {
    process.env.MONGO_URI = mongo.uri;
  }

  const { AppModule } = await import("../../src/app.module.js");
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
      await closeMongo(mongo);

      if (previousMongoUri) {
        process.env.MONGO_URI = previousMongoUri;
      } else {
        delete process.env.MONGO_URI;
      }
    },
  };
};

const closeMongo = async (
  mongo: MongoMemoryTestServer | undefined,
): Promise<void> => {
  await mongo?.stop();
};
