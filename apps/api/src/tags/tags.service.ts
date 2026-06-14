import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { type ImageEntity, ImageModelName } from "../images/image.schema.js";
import {
  type TagEntity,
  type TagEntityDocument,
  TagModelName,
} from "./tag.schema.js";
import type { CreateTagDto, UpdateTagDto } from "./tags.dto.js";

@Injectable()
export class TagsService {
  @InjectModel(TagModelName)
  private readonly tagModel!: Model<TagEntity>;

  @InjectModel(ImageModelName)
  private readonly imageModel!: Model<ImageEntity>;

  list(): Promise<TagEntityDocument[]> {
    return this.tagModel.find().sort({ name: 1 }).exec();
  }

  create(dto: CreateTagDto): Promise<TagEntityDocument> {
    return this.tagModel.create(dto);
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagEntityDocument> {
    const updated = await this.tagModel
      .findByIdAndUpdate(id, dto, { returnDocument: "after" })
      .exec();

    if (updated === null) {
      throw new NotFoundException("Tag not found");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.tagModel.findByIdAndDelete(id).exec();

    if (deleted === null) {
      throw new NotFoundException("Tag not found");
    }
  }

  async sync(): Promise<void> {
    const tags = await this.tagModel.find().exec();
    const tagNames = new Set(tags.map((tag) => tag.name));
    const images = await this.imageModel.find({}, { _id: 1, tags: 1 }).exec();

    await Promise.all(
      images.map((image) =>
        this.imageModel
          .updateOne(
            { _id: image._id },
            { $set: { tags: image.tags.filter((tag) => tagNames.has(tag)) } },
          )
          .exec(),
      ),
    );
  }
}
