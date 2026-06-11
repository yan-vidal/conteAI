import type { ImageDocument } from "@conteai/shared";
import { Controller, Get } from "@nestjs/common";

export interface HealthResponse {
  status: "ok";
  sampleImageDescription?: ImageDocument["description"];
}

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return { status: "ok" };
  }
}
