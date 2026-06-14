import type { ColorPalette } from "@conteai/shared";
import { Inject, Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ConfigService } from "@nestjs/config";
import type { ApiEnv } from "../config/api-env.js";
import { HTTP_CLIENT, type HttpClient } from "./http-client.js";

const VISION_ANNOTATE_URL = "https://vision.googleapis.com/v1/images:annotate";

interface VisionColorInfo {
  color: { red?: number; green?: number; blue?: number };
  score?: number;
  pixelFraction?: number;
}

interface VisionAnnotateResponse {
  responses: Array<{
    labelAnnotations?: Array<{ description: string }>;
    imagePropertiesAnnotation?: {
      dominantColors?: { colors?: VisionColorInfo[] };
    };
  }>;
}

export interface VisionResult {
  tags: string[];
  colors: ColorPalette[][];
}

@Injectable()
export class VisionService {
  @Inject(HTTP_CLIENT)
  private readonly http!: HttpClient;

  private readonly apiKey: string;
  private readonly bucketUrl: string;

  constructor(configService: ConfigService<ApiEnv, true>) {
    this.apiKey = configService.get("GOOGLE_API_KEY", { infer: true });
    this.bucketUrl = configService.get("BUCKET_URL", { infer: true });
  }

  async getTagsAndColors(optimizedKeys: string[]): Promise<VisionResult> {
    const requestData = {
      requests: optimizedKeys.map((key, index) => {
        const features = [{ maxResults: 5, type: "IMAGE_PROPERTIES" }];

        if (index === 0) {
          features.push({ maxResults: 50, type: "LABEL_DETECTION" });
        }

        return {
          features,
          image: { source: { imageUri: `${this.bucketUrl}/${key}` } },
        };
      }),
    };

    const { data } = await this.http.post<VisionAnnotateResponse>(
      VISION_ANNOTATE_URL,
      requestData,
      { params: { key: this.apiKey } },
    );

    const tags =
      data.responses[0]?.labelAnnotations?.map(
        (annotation) => annotation.description,
      ) ?? [];

    const colors = data.responses.map(
      (response) =>
        response.imagePropertiesAnnotation?.dominantColors?.colors?.map(
          (entry) => ({
            blue: entry.color.blue ?? 0,
            green: entry.color.green ?? 0,
            pixelFraction: entry.pixelFraction ?? 0,
            red: entry.color.red ?? 0,
            score: entry.score ?? 0,
          }),
        ) ?? [],
    );

    return { colors, tags };
  }
}
