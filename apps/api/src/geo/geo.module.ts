import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { CountriesController } from "./countries.controller.js";
import { CountriesService } from "./countries.service.js";
import {
  CountryModelName,
  CountrySchema,
  StateModelName,
  StateSchema,
} from "./geo.schema.js";
import { StatesController } from "./states.controller.js";
import { StatesService } from "./states.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CountryModelName, schema: CountrySchema },
      { name: StateModelName, schema: StateSchema },
    ]),
    AuthModule,
  ],
  controllers: [CountriesController, StatesController],
  providers: [CountriesService, StatesService],
})
export class GeoModule {}
