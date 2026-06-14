import {
  Bind,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
// biome-ignore lint/style/useImportType: ValidationPipe needs the runtime DTO class for metadata.
import { CreateCountryDto, UpdateCountryDto } from "./countries.dto.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { CountriesService } from "./countries.service.js";
import type { CountryEntityDocument } from "./geo.schema.js";

@Controller("countries")
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  list(): Promise<CountryEntityDocument[]> {
    return this.countriesService.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Bind(Body())
  create(dto: CreateCountryDto): Promise<CountryEntityDocument> {
    return this.countriesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Bind(Param("id"), Body())
  update(id: string, dto: UpdateCountryDto): Promise<CountryEntityDocument> {
    return this.countriesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Bind(Param("id"))
  remove(id: string): Promise<void> {
    return this.countriesService.remove(id);
  }
}
