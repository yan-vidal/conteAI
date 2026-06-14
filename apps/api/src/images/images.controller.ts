import {
  Bind,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
// biome-ignore lint/style/useImportType: ValidationPipe needs the runtime DTO class for metadata.
import { EditImageDto } from "./dto/edit-image.dto.js";
// biome-ignore lint/style/useImportType: ValidationPipe needs the runtime DTO class for metadata.
import { ListImagesDto } from "./dto/list-images.dto.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ImagesService } from "./images.service.js";

@Controller("images")
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  @Bind(Query())
  list(query: ListImagesDto) {
    return this.imagesService.list(query);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Bind(Param("id"), Body())
  update(id: string, body: EditImageDto) {
    return this.imagesService.edit(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Bind(Param("id"))
  remove(id: string): Promise<void> {
    return this.imagesService.remove(id);
  }
}
