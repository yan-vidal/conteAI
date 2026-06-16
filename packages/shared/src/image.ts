export type DocumentId = string;
export type DateLike = Date | string;

export interface TimestampedDocument {
  _id?: DocumentId;
  createdAt?: DateLike;
  updatedAt?: DateLike;
}

export interface ColorPalette {
  red: number;
  green: number;
  blue: number;
  score: number;
  pixelFraction: number;
}

export interface ImageVersion extends TimestampedDocument {
  lazyThumbnailBase64: string;
  thumbnailUrl: string;
  optimizedUrl: string;
  fullSizeUrl: string;
  versionName?: string;
  colorPalette: ColorPalette[];
}

export interface ImageMetadata {
  camera?: string;
  lens?: string;
  iso?: string;
  shutterSpeed?: string;
  flash?: string;
  whiteBalance: string;
  aperture?: string;
  latitude?: number;
  longitude?: number;
  cameraTrueDirection?: number;
  takenAt?: DateLike;
  fullSizeWidth: number;
  fullSizeHeight: number;
  optimizedWidth: number;
  optimizedHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export interface ImageDocument extends TimestampedDocument {
  description?: string;
  tags: string[];
  country?: string;
  state?: string;
  city?: string;
  images: ImageVersion[];
  original: ImageVersion;
  metadata: ImageMetadata;
  favorite?: boolean;
}

export interface Tag extends TimestampedDocument {
  name: string;
  code: string;
}

export interface Country extends TimestampedDocument {
  name: string;
  code: string;
}

export interface State extends TimestampedDocument {
  name: string;
  code: string;
  countryParentCode?: string;
}

export interface City extends TimestampedDocument {
  name: string;
  code: string;
  countryParentCode?: string;
  stateParentCode?: string;
}

export interface AuthPayload {
  name: string;
  id: DocumentId;
  exp: number;
}

export interface AuthResponse {
  token: string;
  payload: AuthPayload;
}
