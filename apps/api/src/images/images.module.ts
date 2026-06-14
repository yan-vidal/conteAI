import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { ImageModelName, ImageSchema } from "./image.schema.js";
import { ImageUrlService } from "./image-url.service.js";
import { ImagesController } from "./images.controller.js";
import { ImagesService } from "./images.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ImageModelName, schema: ImageSchema }]),
    AuthModule,
    StorageModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService, ImageUrlService],
})
export class ImagesModule {}
