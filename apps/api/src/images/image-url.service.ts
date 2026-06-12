import type { ImageDocument, ImageVersion } from "@conteai/shared";
import { Injectable } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { ApiEnv } from "../config/api-env.js";

const isHttpUrl = (value: string): boolean =>
  value.startsWith("http://") || value.startsWith("https://");

const joinPublicUrl = (bucketUrl: string, key: string): string => {
  if (isHttpUrl(key)) {
    return key;
  }

  const normalizedBucketUrl = bucketUrl.replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");

  return `${normalizedBucketUrl}/${normalizedKey}`;
};

const stripToKey = (value: string): string => {
  if (!isHttpUrl(value)) {
    return value;
  }

  const lastSlashIndex = value.lastIndexOf("/");
  return lastSlashIndex >= 0 ? value.substring(lastSlashIndex + 1) : value;
};

const mapVersionUrls = (
  version: ImageVersion,
  mapUrl: (url: string) => string,
): ImageVersion => ({
  ...version,
  fullSizeUrl: mapUrl(version.fullSizeUrl),
  optimizedUrl: mapUrl(version.optimizedUrl),
  thumbnailUrl: mapUrl(version.thumbnailUrl),
});

export const withPublicImageUrls = (
  documents: ImageDocument[],
  bucketUrl: string,
): ImageDocument[] =>
  documents.map((document) => ({
    ...document,
    images: document.images.map((image) =>
      mapVersionUrls(image, (url) => joinPublicUrl(bucketUrl, url)),
    ),
    original: mapVersionUrls(document.original, (url) =>
      joinPublicUrl(bucketUrl, url),
    ),
  }));

export const stripPublicImageUrls = (
  document: ImageDocument,
): ImageDocument => ({
  ...document,
  images: document.images.map((image) => mapVersionUrls(image, stripToKey)),
  original: mapVersionUrls(document.original, stripToKey),
});

@Injectable()
export class ImageUrlService {
  constructor(private readonly configService: ConfigService<ApiEnv, true>) {}

  withPublicImageUrls(documents: ImageDocument[]): ImageDocument[] {
    const bucketUrl = this.configService.get("BUCKET_URL", { infer: true });
    return withPublicImageUrls(documents, bucketUrl);
  }

  stripPublicImageUrls(document: ImageDocument): ImageDocument {
    return stripPublicImageUrls(document);
  }
}
