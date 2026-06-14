import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import type { ApiEnv } from "../config/api-env.js";
import { GeocodingService } from "./geocoding.service.js";
import { HTTP_CLIENT } from "./http-client.js";

const createService = async (
  get: ReturnType<typeof vi.fn>,
): Promise<GeocodingService> => {
  const moduleRef = await Test.createTestingModule({
    providers: [
      GeocodingService,
      { provide: HTTP_CLIENT, useValue: { get, post: vi.fn() } },
      {
        provide: ConfigService,
        useValue: new ConfigService<ApiEnv, true>({
          GOOGLE_API_KEY: "geo-key",
        }),
      },
    ],
  }).compile();

  return moduleRef.get(GeocodingService);
};

describe("GeocodingService", () => {
  it("extracts city, state, and country with legacy precedence", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        results: [
          {
            address_components: [
              { long_name: "Osaka", types: ["locality", "political"] },
              {
                long_name: "Osaka Prefecture",
                types: ["administrative_area_level_1", "political"],
              },
              { long_name: "Japan", types: ["country", "political"] },
            ],
          },
        ],
      },
      status: 200,
    });
    const service = await createService(get);

    const location = await service.getCityStateCountry(34.69, 135.5);

    expect(location).toEqual({
      city: "Osaka",
      country: "Japan",
      state: "Osaka Prefecture",
    });
    expect(get.mock.calls[0]?.[0]).toContain("latlng=34.69,135.5");
    expect(get.mock.calls[0]?.[0]).toContain("key=geo-key");
  });

  it("falls back to administrative_area_level_2 for city", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        results: [
          {
            address_components: [
              {
                long_name: "Some County",
                types: ["administrative_area_level_2", "political"],
              },
              { long_name: "Brazil", types: ["country", "political"] },
            ],
          },
        ],
      },
      status: 200,
    });
    const service = await createService(get);

    const location = await service.getCityStateCountry(-23.5, -46.6);

    expect(location).toEqual({ city: "Some County", country: "Brazil" });
  });

  it("returns an empty location when there are no results", async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ data: { results: [] }, status: 200 });
    const service = await createService(get);

    const location = await service.getCityStateCountry(0, 0);

    expect(location).toEqual({});
  });
});
