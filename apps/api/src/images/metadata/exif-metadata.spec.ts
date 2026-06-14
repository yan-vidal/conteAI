import { describe, expect, it } from "vitest";
import { extractExifMetadata, type RawExifTags } from "./exif-metadata.js";

describe("extractExifMetadata", () => {
  it("maps the iPhone 12 Pro Max profile with lens lookup and dimensions", () => {
    const tags: RawExifTags = {
      ApertureValue: { description: "f/1.6" },
      DateTimeOriginal: { description: "2026:06:10 10:00:00" },
      GPSImgDirection: { description: 90 },
      GPSLatitude: { description: 34.69 },
      GPSLongitude: { description: 135.5 },
      "Image Height": { value: 3000 },
      "Image Width": { value: 4000 },
      ISOSpeedRatings: { value: 100 },
      LensModel: {
        description: "iPhone 12 Pro Max back triple camera 5.1mm f/1.6",
      },
      Model: { description: "iPhone 12 Pro Max" },
    };

    const result = extractExifMetadata(tags);

    expect(result).toMatchObject({
      aperture: "f/1.6",
      camera: "iPhone 12 Pro Max",
      cameraTrueDirection: 90,
      flash: "Off",
      fullSizeHeight: 3000,
      fullSizeWidth: 4000,
      iso: "100",
      latitude: 34.69,
      lens: "Wide",
      longitude: 135.5,
      whiteBalance: "Auto",
    });
    // Legacy parses "YYYY:MM:DD HH:MM:SS" as local time; preserve that semantics.
    expect(result.takenAt).toEqual(new Date("2026-06-10T10:00:00"));
  });

  it("maps the '--' alias to the Poco X3 Pro profile", () => {
    const tags: RawExifTags = {
      ApertureValue: { description: "2.2" },
      Model: { description: "--" },
    };

    const result = extractExifMetadata(tags);

    expect(result.camera).toBe("Poco X3 Pro");
    expect(result.lens).toBe("Ultra Wide");
  });

  it("applies DJI Mini 2 hemisphere signs to GPS coordinates", () => {
    const tags: RawExifTags = {
      GPSLatitude: { description: 23.5 },
      GPSLatitudeRef: { value: ["S"] },
      GPSLongitude: { description: 46.6 },
      GPSLongitudeRef: { value: ["W"] },
      Model: { description: "FC7303" },
    };

    const result = extractExifMetadata(tags);

    expect(result.camera).toBe("DJI Mini 2");
    expect(result.lens).toBe("24mm");
    expect(result.latitude).toBe(-23.5);
    expect(result.longitude).toBe(-46.6);
  });

  it("falls back to the generic profile for unknown models", () => {
    const tags: RawExifTags = {
      LensModel: { description: "Some Lens" },
      Model: { description: "Unknown Cam 9000" },
    };

    const result = extractExifMetadata(tags);

    expect(result.camera).toBe("Unknown Cam 9000");
    expect(result.lens).toBe("Some Lens");
    expect(result.fullSizeWidth).toBeUndefined();
    expect(result.fullSizeHeight).toBeUndefined();
  });

  it("uses N/A and generic camera when tags are empty", () => {
    const result = extractExifMetadata({});

    expect(result.camera).toBe("N/A");
    expect(result.lens).toBe("N/A");
    expect(result.iso).toBe("N/A");
    expect(result.takenAt).toBeUndefined();
  });
});
