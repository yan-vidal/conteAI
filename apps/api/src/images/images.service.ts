import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model, QueryFilter } from "mongoose";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { StorageService } from "../storage/storage.service.js";
import type { EditableVersion, EditImageDto } from "./dto/edit-image.dto.js";
import type { ListImagesDto } from "./dto/list-images.dto.js";
import { type ImageEntity, ImageModelName } from "./image.schema.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ImageUrlService, stripToKey } from "./image-url.service.js";

interface DateRange {
  $gte?: Date;
  $lte?: Date;
}

type ImageFilter = QueryFilter<ImageEntity & { createdAt?: Date }>;

@Injectable()
export class ImagesService {
  @InjectModel(ImageModelName)
  private readonly imageModel!: Model<ImageEntity>;

  constructor(
    private readonly imageUrlService: ImageUrlService,
    private readonly storageService: StorageService,
  ) {}

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

  async edit(id: string, body: EditImageDto) {
    const image = await this.imageModel.findById(id).exec();

    if (!image) {
      throw new NotFoundException("Image not found");
    }

    if (body.description !== undefined) {
      image.description = body.description;
    }
    if (body.tags !== undefined) {
      image.tags = body.tags;
    }
    if (body.country !== undefined) {
      image.country = body.country;
    }
    if (body.state !== undefined) {
      image.state = body.state;
    }
    if (body.city !== undefined) {
      image.city = body.city;
    }
    if (body.images !== undefined) {
      image.set(
        "images",
        body.images.map((version) => this.stripVersion(version)),
      );
    }
    if (body.original !== undefined) {
      image.set("original", this.stripVersion(body.original));
    }
    if (body.metadata?.takenAt !== undefined) {
      image.set("metadata.takenAt", new Date(body.metadata.takenAt));
    }

    const saved = await image.save();
    const [withUrls] = this.imageUrlService.withPublicImageUrls([
      saved.toObject(),
    ]);

    if (!withUrls) {
      throw new Error("Failed to map image urls");
    }

    return withUrls;
  }

  async remove(id: string): Promise<void> {
    const image = await this.imageModel.findById(id).lean().exec();

    if (!image) {
      throw new NotFoundException("Image not found");
    }

    const keys: string[] = [];

    for (const version of image.images) {
      keys.push(
        version.fullSizeUrl,
        version.thumbnailUrl,
        version.optimizedUrl,
      );
    }

    if (image.original) {
      keys.push(
        image.original.fullSizeUrl,
        image.original.thumbnailUrl,
        image.original.optimizedUrl,
      );
    }

    await this.storageService.deleteImages(keys);
    await this.imageModel.findByIdAndDelete(id).exec();
  }

  private stripVersion<V extends EditableVersion>(version: V): V {
    return {
      ...version,
      fullSizeUrl: stripToKey(version.fullSizeUrl),
      optimizedUrl: stripToKey(version.optimizedUrl),
      thumbnailUrl: stripToKey(version.thumbnailUrl),
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
