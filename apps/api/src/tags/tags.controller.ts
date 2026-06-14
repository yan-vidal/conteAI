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
import type { TagEntityDocument } from "./tag.schema.js";
// biome-ignore lint/style/useImportType: ValidationPipe needs the runtime DTO class for metadata.
import { CreateTagDto, UpdateTagDto } from "./tags.dto.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { TagsService } from "./tags.service.js";

@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  list(): Promise<TagEntityDocument[]> {
    return this.tagsService.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Bind(Body())
  create(dto: CreateTagDto): Promise<TagEntityDocument> {
    return this.tagsService.create(dto);
  }

  @Post("sync")
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  sync(): Promise<void> {
    return this.tagsService.sync();
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Bind(Param("id"), Body())
  update(id: string, dto: UpdateTagDto): Promise<TagEntityDocument> {
    return this.tagsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Bind(Param("id"))
  remove(id: string): Promise<void> {
    return this.tagsService.remove(id);
  }
}
