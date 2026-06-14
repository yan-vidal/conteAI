import type {
  AuthPayload,
  AuthResponse,
  City,
  Country,
  ImageDocument,
  ImageVersion,
  State,
  Tag,
} from "@conteai/shared";

export interface UserFixture {
  _id: string;
  name: string;
  password: string;
}

export interface LoginCredentialsFixture {
  name: string;
  password: string;
}

export interface ImageListFixture {
  images: ImageDocument[];
  total: number;
}

const createdAt = "2026-06-12T12:00:00.000Z";
const updatedAt = "2026-06-12T12:00:00.000Z";

export const fixtureIds = {
  city: "68b000000000000000000005",
  country: "68b000000000000000000003",
  image: "68b000000000000000000006",
  imageVersion: "68b000000000000000000007",
  originalVersion: "68b000000000000000000008",
  state: "68b000000000000000000004",
  tag: "68b000000000000000000002",
  user: "68b000000000000000000001",
} as const;

export const sampleLoginCredentialsFixture: LoginCredentialsFixture = {
  name: "yan",
  password: "correct-password",
};

export const sampleUserFixture: UserFixture = {
  _id: fixtureIds.user,
  name: sampleLoginCredentialsFixture.name,
  password: "$2b$14$5xAHL5MWoB2DAtg5cXSA0.f8DHsGTk0ZQ7n0aVKxBDeq3eN8JkQtG",
};

export const sampleTagFixture: Tag = {
  _id: fixtureIds.tag,
  code: "landscape",
  createdAt,
  name: "Landscape",
  updatedAt,
};

export const sampleCountryFixture: Country = {
  _id: fixtureIds.country,
  code: "JP",
  createdAt,
  name: "Japan",
  updatedAt,
};

export const sampleStateFixture: State = {
  _id: fixtureIds.state,
  code: "OS",
  countryParentCode: sampleCountryFixture.code,
  createdAt,
  name: "Osaka",
  updatedAt,
};

export const sampleCityFixture: City = {
  _id: fixtureIds.city,
  code: "OSAKA",
  countryParentCode: sampleCountryFixture.code,
  createdAt,
  name: "Osaka",
  stateParentCode: sampleStateFixture.code,
  updatedAt,
};

export const sampleImageVersionFixture: ImageVersion = {
  _id: fixtureIds.imageVersion,
  colorPalette: [
    {
      blue: 30,
      green: 20,
      pixelFraction: 0.4,
      red: 10,
      score: 0.9,
    },
  ],
  createdAt,
  fullSizeUrl: "landscape-full.jpg",
  lazyThumbnailBase64: "data:image/webp;base64,fixture",
  optimizedUrl: "landscape-optimized.jpg",
  thumbnailUrl: "landscape-thumbnail.jpg",
  updatedAt,
  versionName: "Edited",
};

export const sampleOriginalVersionFixture: ImageVersion = {
  ...sampleImageVersionFixture,
  _id: fixtureIds.originalVersion,
  fullSizeUrl: "landscape-original.jpg",
  optimizedUrl: "landscape-original-optimized.jpg",
  thumbnailUrl: "landscape-original-thumbnail.jpg",
  versionName: "Original",
};

export const sampleImageFixture: ImageDocument = {
  _id: fixtureIds.image,
  city: sampleCityFixture.name,
  country: sampleCountryFixture.name,
  createdAt,
  description: "Pinned landscape fixture",
  images: [sampleImageVersionFixture],
  metadata: {
    aperture: "f/1.8",
    camera: "iPhone 12 Pro Max",
    cameraTrueDirection: 90,
    flash: "Off",
    fullSizeHeight: 3000,
    fullSizeWidth: 4000,
    iso: "100",
    latitude: 34.6937,
    lens: "Wide",
    longitude: 135.5023,
    optimizedHeight: 1000,
    optimizedWidth: 1333,
    shutterSpeed: "1/100",
    takenAt: "2026-06-10T10:00:00.000Z",
    thumbnailHeight: 300,
    thumbnailWidth: 400,
    whiteBalance: "Auto",
  },
  original: sampleOriginalVersionFixture,
  state: sampleStateFixture.name,
  tags: [sampleTagFixture.name],
  updatedAt,
};

export const imageListFixture: ImageListFixture = {
  images: [sampleImageFixture],
  total: 1,
};

export const sampleAuthPayloadFixture: AuthPayload = {
  exp: 1_782_000_000,
  id: fixtureIds.user,
  name: sampleUserFixture.name,
};

export const sampleAuthResponseFixture: AuthResponse = {
  payload: sampleAuthPayloadFixture,
  token: "fixture.jwt.token",
};
