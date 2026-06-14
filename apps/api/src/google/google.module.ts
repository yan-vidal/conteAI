import { Module } from "@nestjs/common";
import axios from "axios";
import { GeocodingService } from "./geocoding.service.js";
import {
  HTTP_CLIENT,
  type HttpClient,
  type HttpRequestConfig,
} from "./http-client.js";
import { VisionService } from "./vision.service.js";

@Module({
  providers: [
    {
      provide: HTTP_CLIENT,
      useFactory: (): HttpClient => ({
        get: (url: string) => axios.get(url),
        post: (url: string, body: unknown, config?: HttpRequestConfig) =>
          axios.post(url, body, config),
      }),
    },
    VisionService,
    GeocodingService,
  ],
  exports: [VisionService, GeocodingService],
})
export class GoogleModule {}
