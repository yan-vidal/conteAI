import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model, QueryFilter } from "mongoose";
import type { ListImagesDto } from "./dto/list-images.dto.js";
import { type ImageEntity, ImageModelName } from "./image.schema.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ImageUrlService } from "./image-url.service.js";

interface DateRange {
  $gte?: Date;
  $lte?: Date;
}

type ImageFilter = QueryFilter<ImageEntity & { createdAt?: Date }>;

@Injectable()
export class ImagesService {
  @InjectModel(ImageModelName)
  private readonly imageModel!: Model<ImageEntity>;

  constructor(private readonly imageUrlService: ImageUrlService) {}

  async list(query: ListImagesDto) {
    const filter = this.buildFilter(query);
    const sortQuery = this.buildSort(query);
    let limit = query.limit ?? 10;
    let offset = query.offset ?? 0;

    if (query.id) {
      const all = await this.imageModel
        .find(filter)
        .sort(sortQuery)
        .select("_id")
        .lean()
        .exec();
      const index = all.findIndex((doc) => String(doc._id) === query.id);

      if (index === -1) {
        throw new NotFoundException("Image not found");
      }

      limit = (index < limit ? limit : index) + 10;
      offset = 0;
    }

    const documents = await this.imageModel
      .find(filter)
      .sort(sortQuery)
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
    const total = await this.imageModel.countDocuments(filter).exec();

    return {
      images: this.imageUrlService.withPublicImageUrls(documents),
      total,
    };
  }

  private buildFilter(query: ListImagesDto): ImageFilter {
    const filter: ImageFilter = {};

    if (query.tags) {
      filter.tags = { $all: query.tags };
    }
    if (query.country) {
      filter.country = { $in: query.country };
    }
    if (query.state) {
      filter.state = { $in: query.state };
    }
    if (query.city) {
      filter.city = { $in: query.city };
    }

    if (query.camera) {
      filter["metadata.camera"] = { $in: query.camera };
    }
    if (query.lens) {
      filter["metadata.lens"] = { $in: query.lens };
    }
    if (query.iso) {
      filter["metadata.iso"] = { $in: query.iso };
    }
    if (query.shutterSpeed) {
      filter["metadata.shutterSpeed"] = { $in: query.shutterSpeed };
    }
    if (query.flash) {
      filter["metadata.flash"] = { $in: query.flash };
    }
    if (query.whiteBalance) {
      filter["metadata.whiteBalance"] = { $in: query.whiteBalance };
    }
    if (query.aperture) {
      filter["metadata.aperture"] = { $in: query.aperture };
    }

    const takenAt = this.buildDateRange(query.takenAtFrom, query.takenAtTo);
    if (takenAt) {
      filter["metadata.takenAt"] = takenAt;
    }

    const createdAt = this.buildDateRange(
      query.createdAtFrom,
      query.createdAtTo,
    );
    if (createdAt) {
      filter.createdAt = createdAt;
    }

    return filter;
  }

  private buildDateRange(from?: string, to?: string): DateRange | undefined {
    if (!from && !to) {
      return undefined;
    }

    const range: DateRange = {};
    if (from) {
      range.$gte = new Date(from);
    }
    if (to) {
      range.$lte = new Date(to);
    }

    return range;
  }

  private buildSort(query: ListImagesDto): Record<string, 1 | -1> {
    if (query.sort && query.order) {
      return { [query.sort]: query.order === "asc" ? 1 : -1 };
    }

    return {};
  }
}
