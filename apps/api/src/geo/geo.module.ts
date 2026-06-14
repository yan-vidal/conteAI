import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { CitiesController } from "./cities.controller.js";
import { CitiesService } from "./cities.service.js";
import { CountriesController } from "./countries.controller.js";
import { CountriesService } from "./countries.service.js";
import {
  CityModelName,
  CitySchema,
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
      { name: CityModelName, schema: CitySchema },
    ]),
    AuthModule,
  ],
  controllers: [CountriesController, StatesController, CitiesController],
  providers: [CountriesService, StatesService, CitiesService],
})
export class GeoModule {}
