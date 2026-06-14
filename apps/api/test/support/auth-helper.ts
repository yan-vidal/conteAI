import type { AuthResponse } from "@conteai/shared";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { sampleLoginCredentialsFixture } from "../fixtures/api-fixtures.js";

export interface LoginCredentials {
  name: string;
  password: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAuthResponse = (value: unknown): value is AuthResponse => {
  if (!isRecord(value) || typeof value.token !== "string") {
    return false;
  }

  const payload = value.payload;

  return (
    isRecord(payload) &&
    typeof payload.name === "string" &&
    typeof payload.id === "string" &&
    typeof payload.exp === "number"
  );
};

export const loginAndGetToken = async (
  app: INestApplication,
  credentials: LoginCredentials = sampleLoginCredentialsFixture,
): Promise<string> => {
  const response = await request(app.getHttpServer())
    .post("/authentication")
    .send(credentials)
    .expect(201);
  const body: unknown = response.body;

  if (!isAuthResponse(body)) {
    throw new Error("Authentication response does not match AuthResponse");
  }

  return body.token;
};
