import { Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ConfigService } from "@nestjs/config";
import type { ApiEnv } from "../config/api-env.js";

interface VersionUrls {
  fullSizeUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
}

interface UrlMappableImage {
  images: VersionUrls[];
  original: VersionUrls;
}

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

const mapVersionUrls = <V extends VersionUrls>(
  version: V,
  mapUrl: (url: string) => string,
): V => ({
  ...version,
  fullSizeUrl: mapUrl(version.fullSizeUrl),
  optimizedUrl: mapUrl(version.optimizedUrl),
  thumbnailUrl: mapUrl(version.thumbnailUrl),
});

export const withPublicImageUrls = <T extends UrlMappableImage>(
  documents: T[],
  bucketUrl: string,
): T[] =>
  documents.map((document) => ({
    ...document,
    images: document.images.map((image) =>
      mapVersionUrls(image, (url) => joinPublicUrl(bucketUrl, url)),
    ),
    original: mapVersionUrls(document.original, (url) =>
      joinPublicUrl(bucketUrl, url),
    ),
  }));

export const stripPublicImageUrls = <T extends UrlMappableImage>(
  document: T,
): T => ({
  ...document,
  images: document.images.map((image) => mapVersionUrls(image, stripToKey)),
  original: mapVersionUrls(document.original, stripToKey),
});

@Injectable()
export class ImageUrlService {
  constructor(private readonly configService: ConfigService<ApiEnv, true>) {}

  withPublicImageUrls<T extends UrlMappableImage>(documents: T[]): T[] {
    const bucketUrl = this.configService.get("BUCKET_URL", { infer: true });
    return withPublicImageUrls(documents, bucketUrl);
  }

  stripPublicImageUrls<T extends UrlMappableImage>(document: T): T {
    return stripPublicImageUrls(document);
  }
}
