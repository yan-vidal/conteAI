import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import type { ApiEnv } from "../config/api-env.js";
import { HTTP_CLIENT } from "./http-client.js";
import { VisionService } from "./vision.service.js";

const createService = async (
  post: ReturnType<typeof vi.fn>,
): Promise<VisionService> => {
  const moduleRef = await Test.createTestingModule({
    providers: [
      VisionService,
      { provide: HTTP_CLIENT, useValue: { get: vi.fn(), post } },
      {
        provide: ConfigService,
        useValue: new ConfigService<ApiEnv, true>({
          BUCKET_URL: "https://cdn.test",
          GOOGLE_API_KEY: "vision-key",
        }),
      },
    ],
  }).compile();

  return moduleRef.get(VisionService);
};

describe("VisionService", () => {
  it("requests labels only for the first image and properties for all", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        responses: [
          {
            imagePropertiesAnnotation: {
              dominantColors: {
                colors: [
                  {
                    color: { blue: 30, green: 20, red: 10 },
                    pixelFraction: 0.4,
                    score: 0.9,
                  },
                ],
              },
            },
            labelAnnotations: [
              { description: "Landscape" },
              { description: "Mountain" },
            ],
          },
          { imagePropertiesAnnotation: { dominantColors: { colors: [] } } },
        ],
      },
      status: 200,
    });
    const service = await createService(post);

    const result = await service.getTagsAndColors([
      "a-optimized.jpg",
      "b-optimized.jpg",
    ]);

    expect(result.tags).toEqual(["Landscape", "Mountain"]);
    expect(result.colors).toEqual([
      [{ blue: 30, green: 20, pixelFraction: 0.4, red: 10, score: 0.9 }],
      [],
    ]);

    const [url, body, config] = post.mock.calls[0] ?? [];
    expect(url).toBe("https://vision.googleapis.com/v1/images:annotate");
    expect(config).toEqual({ params: { key: "vision-key" } });
    expect(body).toMatchObject({
      requests: [
        {
          features: [
            { maxResults: 5, type: "IMAGE_PROPERTIES" },
            { maxResults: 50, type: "LABEL_DETECTION" },
          ],
          image: { source: { imageUri: "https://cdn.test/a-optimized.jpg" } },
        },
        {
          features: [{ maxResults: 5, type: "IMAGE_PROPERTIES" }],
          image: { source: { imageUri: "https://cdn.test/b-optimized.jpg" } },
        },
      ],
    });
  });

  it("defaults missing labels and colors to empty arrays", async () => {
    const post = vi
      .fn()
      .mockResolvedValue({ data: { responses: [{}] }, status: 200 });
    const service = await createService(post);

    const result = await service.getTagsAndColors(["only-optimized.jpg"]);

    expect(result.tags).toEqual([]);
    expect(result.colors).toEqual([[]]);
  });

  it("defaults missing color channels to zero", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        responses: [
          {
            imagePropertiesAnnotation: {
              dominantColors: {
                colors: [{ color: { red: 200 }, score: 0.5 }],
              },
            },
          },
        ],
      },
      status: 200,
    });
    const service = await createService(post);

    const result = await service.getTagsAndColors(["only-optimized.jpg"]);

    expect(result.colors).toEqual([
      [{ blue: 0, green: 0, pixelFraction: 0, red: 200, score: 0.5 }],
    ]);
  });
});
