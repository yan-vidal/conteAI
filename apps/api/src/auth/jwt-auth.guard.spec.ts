import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { describe, expect, it } from "vitest";
import { type AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard.js";

const createContext = (request: AuthenticatedRequest): ExecutionContext => {
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };

  return context as ExecutionContext;
};

describe("JwtAuthGuard", () => {
  const jwtService = new JwtService({
    secret: "test-jwt-secret",
  });

  it("rejects requests without bearer token", async () => {
    const guard = new JwtAuthGuard(jwtService);

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("accepts valid bearer token and attaches payload", async () => {
    const token = await jwtService.signAsync(
      {
        id: "user-id",
        name: "yan",
      },
      { expiresIn: "1h" },
    );
    const request: AuthenticatedRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const guard = new JwtAuthGuard(jwtService);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.payload).toMatchObject({
      id: "user-id",
      name: "yan",
    });
    expect(request.payload?.exp).toEqual(expect.any(Number));
  });
});
