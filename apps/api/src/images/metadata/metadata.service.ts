import type { ImageMetadata } from "@conteai/shared";
import { Injectable } from "@nestjs/common";
import sharp from "sharp";
import type { UploadFile } from "../upload-file.js";
import { loadExifMetadata } from "./exif-metadata.js";

export type ExtractedImageMetadata = Omit<ImageMetadata, "takenAt"> & {
  takenAt?: Date;
};

@Injectable()
export class MetadataService {
  async extractMetadata(buffer: Buffer): Promise<ExtractedImageMetadata> {
    const extracted = loadExifMetadata(buffer);

    let fullSizeWidth = extracted.fullSizeWidth;
    let fullSizeHeight = extracted.fullSizeHeight;

    if (fullSizeWidth === undefined || fullSizeHeight === undefined) {
      const dimensions = await sharp(buffer).metadata();
      fullSizeWidth = fullSizeWidth ?? dimensions.width;
      fullSizeHeight = fullSizeHeight ?? dimensions.height;
    }

    if (fullSizeWidth === undefined || fullSizeHeight === undefined) {
      throw new Error("Could not determine image dimensions");
    }

    return {
      aperture: extracted.aperture,
      camera: extracted.camera,
      flash: extracted.flash,
      fullSizeHeight,
      fullSizeWidth,
      iso: extracted.iso,
      lens: extracted.lens,
      optimizedHeight: Math.round(fullSizeHeight / 3),
      optimizedWidth: Math.round(fullSizeWidth / 3),
      shutterSpeed: extracted.shutterSpeed,
      thumbnailHeight: Math.round(fullSizeHeight / 10),
      thumbnailWidth: Math.round(fullSizeWidth / 10),
      whiteBalance: extracted.whiteBalance,
      ...(extracted.latitude !== undefined && { latitude: extracted.latitude }),
      ...(extracted.longitude !== undefined && {
        longitude: extracted.longitude,
      }),
      ...(extracted.cameraTrueDirection !== undefined && {
        cameraTrueDirection: extracted.cameraTrueDirection,
      }),
      ...(extracted.takenAt !== undefined && { takenAt: extracted.takenAt }),
    };
  }

  selectExifSource(files: UploadFile[], versionNames: string[]): Buffer {
    const originalIndex = versionNames.findIndex(
      (name) => name?.toLowerCase() === "original",
    );
    const index = originalIndex === -1 ? 0 : originalIndex;
    const file = files[index];

    if (!file) {
      throw new Error("No file available for EXIF extraction");
    }

    return file.buffer;
  }
}
