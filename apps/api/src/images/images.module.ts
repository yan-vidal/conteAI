import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { GoogleModule } from "../google/google.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { TagModelName, TagSchema } from "../tags/tag.schema.js";
import { ImageModelName, ImageSchema } from "./image.schema.js";
import { ImageProcessingService } from "./image-processing.service.js";
import { ImageUrlService } from "./image-url.service.js";
import { ImagesController } from "./images.controller.js";
import { ImagesService } from "./images.service.js";
import { MetadataService } from "./metadata/metadata.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageModelName, schema: ImageSchema },
      { name: TagModelName, schema: TagSchema },
    ]),
    AuthModule,
    StorageModule,
    GoogleModule,
  ],
  controllers: [ImagesController],
  providers: [
    ImagesService,
    ImageUrlService,
    MetadataService,
    ImageProcessingService,
  ],
})
export class ImagesModule {}
