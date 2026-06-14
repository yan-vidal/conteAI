import type { ImageMetadata } from "@conteai/shared";
import { Injectable } from "@nestjs/common";
import sharp from "sharp";

export interface ImageDerivatives {
  lazyThumbnailBase64: string;
  thumbnailBuffer: Buffer;
  optimizedBuffer: Buffer;
  fullSizeBuffer: Buffer;
}

export interface VersionObjectKeys {
  fullSizeKey: string;
  optimizedKey: string;
  thumbnailKey: string;
}

@Injectable()
export class ImageProcessingService {
  async createDerivatives(
    buffer: Buffer,
    metadata: ImageMetadata,
  ): Promise<ImageDerivatives> {
    const lazyThumbnail = await sharp(buffer)
      .resize(
        Math.round(metadata.fullSizeWidth / 25),
        Math.round(metadata.fullSizeHeight / 25),
      )
      .blur(5)
      .toFormat("webp")
      .toBuffer();

    const thumbnailBuffer = await sharp(buffer)
      .resize(metadata.thumbnailWidth, metadata.thumbnailHeight)
      .toBuffer();

    const optimizedBuffer = await sharp(buffer)
      .resize(metadata.optimizedWidth, metadata.optimizedHeight)
      .toBuffer();

    return {
      fullSizeBuffer: buffer,
      lazyThumbnailBase64: `data:image/webp;base64,${lazyThumbnail.toString("base64")}`,
      optimizedBuffer,
      thumbnailBuffer,
    };
  }

  buildObjectKeys(originalname: string): VersionObjectKeys {
    const parts = originalname.split(".");
    const fileExtension = parts.pop() ?? "";
    const fileName = parts.join(".");
    const sanitized = fileName.replace(/[^\w\s.-]/gi, "");
    const truncated = sanitized.substring(0, 240);
    const uniqueName = `${Date.now()}-${truncated}`;

    return {
      fullSizeKey: `${uniqueName}.${fileExtension}`,
      optimizedKey: `${uniqueName}-optimized.${fileExtension}`,
      thumbnailKey: `${uniqueName}-thumbnail.${fileExtension}`,
    };
  }
}
