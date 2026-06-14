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
import type { StateEntityDocument } from "./geo.schema.js";
// biome-ignore lint/style/useImportType: ValidationPipe needs the runtime DTO class for metadata.
import { CreateStateDto, UpdateStateDto } from "./states.dto.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { StatesService } from "./states.service.js";

@Controller("states")
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  list(): Promise<StateEntityDocument[]> {
    return this.statesService.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Bind(Body())
  create(dto: CreateStateDto): Promise<StateEntityDocument> {
    return this.statesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Bind(Param("id"), Body())
  update(id: string, dto: UpdateStateDto): Promise<StateEntityDocument> {
    return this.statesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Bind(Param("id"))
  remove(id: string): Promise<void> {
    return this.statesService.remove(id);
  }
}
