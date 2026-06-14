import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { ImageModelName, ImageSchema } from "../images/image.schema.js";
import { TagModelName, TagSchema } from "./tag.schema.js";
import { TagsController } from "./tags.controller.js";
import { TagsService } from "./tags.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TagModelName, schema: TagSchema },
      { name: ImageModelName, schema: ImageSchema },
    ]),
    AuthModule,
  ],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
