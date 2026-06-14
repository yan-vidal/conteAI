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
import { CreateCityDto, UpdateCityDto } from "./cities.dto.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { CitiesService } from "./cities.service.js";
import type { CityEntityDocument } from "./geo.schema.js";

@Controller("cities")
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  list(): Promise<CityEntityDocument[]> {
    return this.citiesService.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Bind(Body())
  create(dto: CreateCityDto): Promise<CityEntityDocument> {
    return this.citiesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Bind(Param("id"), Body())
  update(id: string, dto: UpdateCityDto): Promise<CityEntityDocument> {
    return this.citiesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Bind(Param("id"))
  remove(id: string): Promise<void> {
    return this.citiesService.remove(id);
  }
}
