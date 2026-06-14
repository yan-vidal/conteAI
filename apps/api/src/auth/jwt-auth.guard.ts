import type { AuthPayload } from "@conteai/shared";
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { JwtService } from "@nestjs/jwt";

export interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  payload?: AuthPayload;
}

const getBearerToken = (authorization?: string): string => {
  if (!authorization) {
    throw new UnauthorizedException("Unauthorized");
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedException("Unauthorized");
  }

  return token;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = getBearerToken(request.headers.authorization);

    try {
      request.payload = await this.jwtService.verifyAsync<AuthPayload>(token);
      return true;
    } catch (error) {
      throw new UnauthorizedException("Unauthorized", { cause: error });
    }
  }
}
