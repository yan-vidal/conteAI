import type { AuthResponse } from "@conteai/shared";
import { Bind, Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { AuthService } from "./auth.service.js";
import type { AuthenticationDto } from "./authentication.dto.js";

@Controller("authentication")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Bind(Body())
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  authenticate(body: AuthenticationDto): Promise<AuthResponse> {
    return this.authService.authenticate(body);
  }
}
