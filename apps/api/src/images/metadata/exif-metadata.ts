import { load as loadExif } from "exifreader";

interface RawExifTag {
  value?: unknown;
  description?: unknown;
}

export type RawExifTags = Record<string, RawExifTag | undefined>;

export interface ExtractedExifMetadata {
  camera: string;
  lens: string;
  iso: string;
  shutterSpeed: string;
  flash: string;
  whiteBalance: string;
  aperture: string;
  latitude: number | undefined;
  longitude: number | undefined;
  cameraTrueDirection: number | undefined;
  takenAt: Date | undefined;
  fullSizeWidth: number | undefined;
  fullSizeHeight: number | undefined;
}

const IPHONE_LENS: Record<string, string> = {
  "iPhone 12 Pro Max back triple camera 1.54mm f/2.4": "Ultra wide",
  "iPhone 12 Pro Max back triple camera 5.1mm f/1.6": "Wide",
  "iPhone 12 Pro Max back triple camera 7.5mm f/2.2": "Telephoto",
};

const POCO_LENS: Record<number, string> = {
  1.8: "Wide",
  2.2: "Ultra Wide",
  2.4: "Macro",
};

const readDescriptionString = (
  tags: RawExifTags,
  key: string,
): string | undefined => {
  const description = tags[key]?.description;
  return typeof description === "string" ? description : undefined;
};

const readValueNumber = (
  tags: RawExifTags,
  key: string,
): number | undefined => {
  const value = tags[key]?.value;
  return typeof value === "number" ? value : undefined;
};

const readDescriptionNumber = (
  tags: RawExifTags,
  key: string,
): number | undefined => {
  const description = tags[key]?.description;

  if (typeof description === "number") {
    return description;
  }

  if (typeof description === "string") {
    const parsed = Number(description);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

const readRefFirstChar = (
  tags: RawExifTags,
  key: string,
): string | undefined => {
  const value = tags[key]?.value;

  if (Array.isArray(value)) {
    const first: unknown = value[0];
    return typeof first === "string" ? first : undefined;
  }

  return typeof value === "string" ? value : undefined;
};

const convertDateFormat = (dateStr?: string): Date | undefined => {
  if (!dateStr) {
    return undefined;
  }

  const [date, hour] = dateStr.split(" ");

  if (!date || !hour) {
    return undefined;
  }

  return new Date(`${date.replace(/:/g, "-")}T${hour}`);
};

interface CameraResolution {
  camera: string;
  lens: string;
  djiGps: boolean;
}

const resolveCameraAndLens = (
  model: string | undefined,
  tags: RawExifTags,
): CameraResolution => {
  switch (model) {
    case "iPhone 12 Pro Max":
      return {
        camera: "iPhone 12 Pro Max",
        djiGps: false,
        lens:
          IPHONE_LENS[readDescriptionString(tags, "LensModel") ?? ""] ?? "N/A",
      };
    case "M2102J20SG":
    case "--":
      return {
        camera: "Poco X3 Pro",
        djiGps: false,
        lens:
          POCO_LENS[Number(readDescriptionString(tags, "ApertureValue"))] ??
          "N/A",
      };
    case "FC7303":
      return { camera: "DJI Mini 2", djiGps: true, lens: "24mm" };
    case "HERO9 Black":
      return { camera: "Go Pro Hero 9 Black", djiGps: false, lens: "16mm" };
    case "ZV-E10":
      return {
        camera: "Sony ZV-E10",
        djiGps: false,
        lens: readDescriptionString(tags, "LensModel") ?? "N/A",
      };
    case "RM-1109":
      return { camera: "Nokia Lumia 640", djiGps: false, lens: "Wide" };
    default:
      return {
        camera: readDescriptionString(tags, "Model") ?? "N/A",
        djiGps: false,
        lens: readDescriptionString(tags, "LensModel") ?? "N/A",
      };
  }
};

export const extractExifMetadata = (
  tags: RawExifTags,
): ExtractedExifMetadata => {
  const model = readDescriptionString(tags, "Model");
  const { camera, lens, djiGps } = resolveCameraAndLens(model, tags);

  const isoValue = readValueNumber(tags, "ISOSpeedRatings");
  const latitudeRaw = readDescriptionNumber(tags, "GPSLatitude");
  const longitudeRaw = readDescriptionNumber(tags, "GPSLongitude");
  const latSign =
    djiGps && readRefFirstChar(tags, "GPSLatitudeRef") === "S" ? -1 : 1;
  const lonSign =
    djiGps && readRefFirstChar(tags, "GPSLongitudeRef") === "W" ? -1 : 1;

  return {
    aperture: readDescriptionString(tags, "ApertureValue") ?? "N/A",
    camera,
    cameraTrueDirection: readDescriptionNumber(tags, "GPSImgDirection"),
    flash: "Off",
    fullSizeHeight: readValueNumber(tags, "Image Height"),
    fullSizeWidth: readValueNumber(tags, "Image Width"),
    iso: isoValue !== undefined ? String(isoValue) : "N/A",
    latitude: latitudeRaw !== undefined ? latitudeRaw * latSign : undefined,
    lens,
    longitude: longitudeRaw !== undefined ? longitudeRaw * lonSign : undefined,
    shutterSpeed: readDescriptionString(tags, "ShutterSpeedValue") ?? "N/A",
    takenAt: convertDateFormat(readDescriptionString(tags, "DateTimeOriginal")),
    whiteBalance: "Auto",
  };
};

export const loadExifMetadata = (buffer: Buffer): ExtractedExifMetadata => {
  let tags: RawExifTags = {};

  try {
    // Boundary cast: ExifReader returns a heterogeneous Tags map; the typed
    // accessors above narrow each field before use.
    tags = loadExif(buffer) as unknown as RawExifTags;
  } catch {
    // ExifReader throws when the file carries no metadata. Fall back to the
    // generic profile so dimension resolution can use sharp downstream.
    tags = {};
  }

  return extractExifMetadata(tags);
};
