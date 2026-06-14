import { Inject, Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { ConfigService } from "@nestjs/config";
import type { ApiEnv } from "../config/api-env.js";
import { HTTP_CLIENT, type HttpClient } from "./http-client.js";

interface GeocodeAddressComponent {
  long_name: string;
  types: string[];
}

interface GeocodeResponse {
  results?: Array<{ address_components: GeocodeAddressComponent[] }>;
}

export interface GeocodeLocation {
  city?: string;
  state?: string;
  country?: string;
}

@Injectable()
export class GeocodingService {
  @Inject(HTTP_CLIENT)
  private readonly http!: HttpClient;

  private readonly apiKey: string;

  constructor(configService: ConfigService<ApiEnv, true>) {
    this.apiKey = configService.get("GOOGLE_API_KEY", { infer: true });
  }

  async getCityStateCountry(
    latitude: number,
    longitude: number,
  ): Promise<GeocodeLocation> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`;

    const { data } = await this.http.get<GeocodeResponse>(url);
    const result = data.results?.[0];

    if (!result) {
      return {};
    }

    const location: GeocodeLocation = {};

    for (const component of result.address_components) {
      if (
        component.types.includes("locality") ||
        component.types.includes("administrative_area_level_2")
      ) {
        location.city = component.long_name;
      } else if (component.types.includes("administrative_area_level_1")) {
        location.state = component.long_name;
      } else if (component.types.includes("country")) {
        location.country = component.long_name;
      }
    }

    return location;
  }
}
