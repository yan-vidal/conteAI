import { Buffer } from "node:buffer";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import type { UploadFile } from "../upload-file.js";
import { MetadataService } from "./metadata.service.js";

const createFile = (
  originalname: string,
  buffer: Buffer = Buffer.from("data"),
): UploadFile => ({
  buffer,
  mimetype: "image/jpeg",
  originalname,
});

describe("MetadataService", () => {
  const service = new MetadataService();

  describe("selectExifSource", () => {
    it("selects the file named Original regardless of position", () => {
      const files = [
        createFile("edited.jpg", Buffer.from("edited")),
        createFile("original.jpg", Buffer.from("original")),
      ];

      const buffer = service.selectExifSource(files, ["Edited", "Original"]);

      expect(buffer.toString()).toBe("original");
    });

    it("falls back to the first file when no Original is present", () => {
      const files = [
        createFile("first.jpg", Buffer.from("first")),
        createFile("second.jpg", Buffer.from("second")),
      ];

      const buffer = service.selectExifSource(files, ["Edited", "Bright"]);

      expect(buffer.toString()).toBe("first");
    });
  });

  describe("extractMetadata", () => {
    let jpeg: Buffer;

    beforeAll(async () => {
      jpeg = await sharp({
        create: {
          background: { b: 80, g: 50, r: 200 },
          channels: 3,
          height: 300,
          width: 600,
        },
      })
        .jpeg()
        .toBuffer();
    });

    it("falls back to sharp dimensions when EXIF lacks them", async () => {
      const metadata = await service.extractMetadata(jpeg);

      expect(metadata.fullSizeWidth).toBe(600);
      expect(metadata.fullSizeHeight).toBe(300);
      expect(metadata.optimizedWidth).toBe(200);
      expect(metadata.optimizedHeight).toBe(100);
      expect(metadata.thumbnailWidth).toBe(60);
      expect(metadata.thumbnailHeight).toBe(30);
      expect(metadata.camera).toBe("N/A");
    });
  });
});
