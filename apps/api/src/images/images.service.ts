import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import type { Model, QueryFilter } from "mongoose";
import type { ApiEnv } from "../config/api-env.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { GeocodingService } from "../google/geocoding.service.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { VisionService } from "../google/vision.service.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { StorageService } from "../storage/storage.service.js";
import { type TagEntity, TagModelName } from "../tags/tag.schema.js";
import type { EditableVersion, EditImageDto } from "./dto/edit-image.dto.js";
import type { ListImagesDto } from "./dto/list-images.dto.js";
import type { UploadImageDto } from "./dto/upload-image.dto.js";
import {
  type ImageEntity,
  ImageModelName,
  type ImageVersionEntity,
} from "./image.schema.js";
import { FULL_SIZE_CONTENT_TYPE } from "./image-processing.constants.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ImageProcessingService } from "./image-processing.service.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ImageUrlService, stripToKey } from "./image-url.service.js";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { MetadataService } from "./metadata/metadata.service.js";
import type { UploadFile } from "./upload-file.js";

interface DateRange {
  $gte?: Date;
  $lte?: Date;
}

type ImageFilter = QueryFilter<ImageEntity & { createdAt?: Date }>;

@Injectable()
export class ImagesService {
  @InjectModel(ImageModelName)
  private readonly imageModel!: Model<ImageEntity>;

  @InjectModel(TagModelName)
  private readonly tagModel!: Model<TagEntity>;

  private readonly maxUploadFiles: number;
  private readonly maxUploadFileSize: number;

  constructor(
    private readonly imageUrlService: ImageUrlService,
    private readonly storageService: StorageService,
    private readonly metadataService: MetadataService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly visionService: VisionService,
    private readonly geocodingService: GeocodingService,
    configService: ConfigService<ApiEnv, true>,
  ) {
    this.maxUploadFiles = configService.get("MAX_UPLOAD_FILES", {
      infer: true,
    });
    this.maxUploadFileSize = configService.get("MAX_UPLOAD_FILE_SIZE", {
      infer: true,
    });
  }

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

  async upload(files: UploadFile[], body: UploadImageDto) {
    this.validateFiles(files);

    const exifSource = this.metadataService.selectExifSource(
      files,
      body.versionNames,
    );
    const metadata = await this.metadataService.extractMetadata(exifSource);

    const uploadedKeys: string[] = [];

    try {
      const versions: ImageVersionEntity[] = [];

      for (const [index, file] of files.entries()) {
        const derivatives = await this.imageProcessingService.createDerivatives(
          file.buffer,
          metadata,
        );
        const keys = this.imageProcessingService.buildObjectKeys(
          file.originalname,
        );

        await this.storageService.uploadImage(
          keys.thumbnailKey,
          derivatives.thumbnailBuffer,
          file.mimetype,
        );
        uploadedKeys.push(keys.thumbnailKey);

        await this.storageService.uploadImage(
          keys.optimizedKey,
          derivatives.optimizedBuffer,
          file.mimetype,
        );
        uploadedKeys.push(keys.optimizedKey);

        await this.storageService.uploadImage(
          keys.fullSizeKey,
          derivatives.fullSizeBuffer,
          FULL_SIZE_CONTENT_TYPE,
        );
        uploadedKeys.push(keys.fullSizeKey);

        const versionName = body.versionNames[index];
        versions.push({
          colorPalette: [],
          fullSizeUrl: keys.fullSizeKey,
          lazyThumbnailBase64: derivatives.lazyThumbnailBase64,
          optimizedUrl: keys.optimizedKey,
          thumbnailUrl: keys.thumbnailKey,
          ...(versionName !== undefined && { versionName }),
        });
      }

      const vision = await this.visionService.getTagsAndColors(
        versions.map((version) => version.optimizedUrl),
      );
      versions.forEach((version, index) => {
        version.colorPalette = vision.colors[index] ?? [];
      });

      const original = versions.find(
        (version) => version.versionName?.toLowerCase() === "original",
      );

      if (!original) {
        throw new BadRequestException(
          "Upload requires a version named Original",
        );
      }

      const editedVersions = versions.filter(
        (version) => version.versionName?.toLowerCase() !== "original",
      );

      const location =
        metadata.latitude !== undefined && metadata.longitude !== undefined
          ? await this.geocodingService.getCityStateCountry(
              metadata.latitude,
              metadata.longitude,
            )
          : {};

      const existingTags = await this.tagModel
        .find()
        .select("name")
        .lean()
        .exec();
      const tagNames = new Set(existingTags.map((tag) => tag.name));
      const tags = vision.tags.filter((tag) => tagNames.has(tag));

      const document = {
        images: editedVersions,
        metadata,
        original,
        tags,
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(location.country !== undefined && { country: location.country }),
        ...(location.state !== undefined && { state: location.state }),
        ...(location.city !== undefined && { city: location.city }),
      };

      const created = await this.imageModel.create(document);
      const [withUrls] = this.imageUrlService.withPublicImageUrls([
        created.toObject(),
      ]);

      if (!withUrls) {
        throw new Error("Failed to map image urls");
      }

      return withUrls;
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await this.storageService.deleteImages(uploadedKeys);
      }

      throw error;
    }
  }

  private validateFiles(files: UploadFile[]): void {
    if (files.length === 0) {
      throw new BadRequestException("At least one file is required");
    }
    if (files.length > this.maxUploadFiles) {
      throw new BadRequestException("Too many files in a single upload");
    }
    for (const file of files) {
      if (!file.mimetype.startsWith("image/")) {
        throw new BadRequestException("Only image uploads are allowed");
      }
      if (file.buffer.length > this.maxUploadFileSize) {
        throw new BadRequestException("File exceeds the maximum allowed size");
      }
    }
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
