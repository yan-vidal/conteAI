import { ConfigModule } from "@nestjs/config";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import type { Model } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  sampleCityFixture,
  sampleCountryFixture,
  sampleImageFixture,
  sampleStateFixture,
  sampleTagFixture,
  sampleUserFixture,
} from "../../test/fixtures/api-fixtures.js";
import {
  createMongoMemoryTestServer,
  type MongoMemoryTestServer,
} from "../../test/support/mongo-memory.js";
import {
  type UserEntity,
  UserModelName,
  UserSchema,
} from "../auth/user.schema.js";
import { validateApiEnv } from "../config/api-env.js";
import {
  type CityEntity,
  CityModelName,
  CitySchema,
  type CountryEntity,
  CountryModelName,
  CountrySchema,
  type StateEntity,
  StateModelName,
  StateSchema,
} from "../geo/geo.schema.js";
import {
  type ImageEntity,
  ImageModelName,
  ImageSchema,
} from "../images/image.schema.js";
import { type TagEntity, TagModelName, TagSchema } from "../tags/tag.schema.js";
import { DatabaseModule } from "./database.module.js";

describe("DatabaseModule schemas", () => {
  let mongo: MongoMemoryTestServer;
  let userModel: Model<UserEntity>;
  let tagModel: Model<TagEntity>;
  let countryModel: Model<CountryEntity>;
  let stateModel: Model<StateEntity>;
  let cityModel: Model<CityEntity>;
  let imageModel: Model<ImageEntity>;

  beforeAll(async () => {
    mongo = await createMongoMemoryTestServer();
    process.env.MONGO_URI = mongo.uri;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateApiEnv,
        }),
        DatabaseModule,
        MongooseModule.forFeature([
          { name: UserModelName, schema: UserSchema },
          { name: TagModelName, schema: TagSchema },
          { name: CountryModelName, schema: CountrySchema },
          { name: StateModelName, schema: StateSchema },
          { name: CityModelName, schema: CitySchema },
          { name: ImageModelName, schema: ImageSchema },
        ]),
      ],
    }).compile();

    userModel = moduleRef.get<Model<UserEntity>>(getModelToken(UserModelName));
    tagModel = moduleRef.get<Model<TagEntity>>(getModelToken(TagModelName));
    countryModel = moduleRef.get<Model<CountryEntity>>(
      getModelToken(CountryModelName),
    );
    stateModel = moduleRef.get<Model<StateEntity>>(
      getModelToken(StateModelName),
    );
    cityModel = moduleRef.get<Model<CityEntity>>(getModelToken(CityModelName));
    imageModel = moduleRef.get<Model<ImageEntity>>(
      getModelToken(ImageModelName),
    );
  });

  afterAll(async () => {
    await mongo?.stop();
  });

  it("inserts and reads every legacy document family", async () => {
    const imageToCreate: ImageEntity = {
      city: sampleCityFixture.name,
      country: sampleCountryFixture.name,
      description: "Pinned landscape fixture",
      images: sampleImageFixture.images,
      metadata: {
        ...sampleImageFixture.metadata,
        takenAt: new Date("2026-06-10T10:00:00.000Z"),
      },
      original: sampleImageFixture.original,
      state: sampleStateFixture.name,
      tags: [sampleTagFixture.name],
    };

    await userModel.create(sampleUserFixture);
    await tagModel.create(sampleTagFixture);
    await countryModel.create(sampleCountryFixture);
    await stateModel.create(sampleStateFixture);
    await cityModel.create(sampleCityFixture);
    await imageModel.create(imageToCreate);

    await expect(userModel.countDocuments()).resolves.toBe(1);
    await expect(
      tagModel.findOne({ code: "landscape" }).lean(),
    ).resolves.toMatchObject({
      name: "Landscape",
    });
    await expect(
      countryModel.findOne({ code: "JP" }).lean(),
    ).resolves.toMatchObject({
      name: "Japan",
    });
    await expect(
      stateModel.findOne({ code: "OS" }).lean(),
    ).resolves.toMatchObject({
      countryParentCode: "JP",
    });
    await expect(
      cityModel.findOne({ code: "OSAKA" }).lean(),
    ).resolves.toMatchObject({
      stateParentCode: "OS",
    });
    await expect(
      imageModel.findOne({ description: "Pinned landscape fixture" }).lean(),
    ).resolves.toMatchObject({
      images: [
        {
          fullSizeUrl: "landscape-full.jpg",
        },
      ],
      metadata: {
        fullSizeWidth: 4000,
      },
      original: {
        versionName: "Original",
      },
    });
  });
});
