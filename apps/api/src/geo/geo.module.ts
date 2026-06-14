import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { CountriesController } from "./countries.controller.js";
import { CountriesService } from "./countries.service.js";
import { CountryModelName, CountrySchema } from "./geo.schema.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CountryModelName, schema: CountrySchema },
    ]),
    AuthModule,
  ],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class GeoModule {}
