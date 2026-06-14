import { Bind, Controller, Get, Query } from "@nestjs/common";
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
}
