export interface ApiEnv {
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  BUCKET_KEY: string;
  BUCKET_SECRET: string;
  BUCKET_REGION: string;
  BUCKET_NAME: string;
  BUCKET_API?: string;
  BUCKET_URL: string;
  GOOGLE_API_KEY: string;
  CORS_ORIGIN?: string;
  MAX_UPLOAD_FILES: number;
  MAX_UPLOAD_FILE_SIZE: number;
}

const DEFAULT_MAX_UPLOAD_FILES = 20;
const DEFAULT_MAX_UPLOAD_FILE_SIZE = 25 * 1024 * 1024;

type EnvInput = Record<string, unknown>;

const getString = (env: EnvInput, key: string): string | undefined => {
  const value = env[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const requireString = (env: EnvInput, key: string): string => {
  const value = getString(env, key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getPort = (env: EnvInput): number => {
  const rawPort = getString(env, "PORT");

  if (!rawPort) {
    return 3000;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
};

const getPositiveInt = (
  env: EnvInput,
  key: string,
  fallback: number,
): number => {
  const raw = getString(env, key);

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
};

const getMongoUri = (env: EnvInput): string => {
  const mongoUri = getString(env, "MONGO_URI");

  if (mongoUri) {
    return mongoUri;
  }

  const user = requireString(env, "MONGOUSER");
  const password = requireString(env, "MONGOPASS");
  const host = requireString(env, "MONGOIP");
  const port = requireString(env, "MONGOPORT");
  const database = requireString(env, "MONGODBNAME");

  return `mongodb://${user}:${password}@${host}:${port}/${database}`;
};

const getGoogleApiKey = (env: EnvInput): string => {
  const normalizedKey = getString(env, "GOOGLE_API_KEY");

  if (normalizedKey) {
    return normalizedKey;
  }

  return requireString(env, "GOOGLEAPIKEY");
};

export const validateApiEnv = (env: EnvInput): ApiEnv => {
  const bucketApi = getString(env, "BUCKET_API");
  const corsOrigin = getString(env, "CORS_ORIGIN");

  return {
    PORT: getPort(env),
    MONGO_URI: getMongoUri(env),
    JWT_SECRET: requireString(env, "JWT_SECRET"),
    BUCKET_KEY: requireString(env, "BUCKET_KEY"),
    BUCKET_SECRET: requireString(env, "BUCKET_SECRET"),
    BUCKET_REGION: requireString(env, "BUCKET_REGION"),
    BUCKET_NAME: requireString(env, "BUCKET_NAME"),
    ...(bucketApi ? { BUCKET_API: bucketApi } : {}),
    BUCKET_URL: requireString(env, "BUCKET_URL"),
    GOOGLE_API_KEY: getGoogleApiKey(env),
    ...(corsOrigin ? { CORS_ORIGIN: corsOrigin } : {}),
    MAX_UPLOAD_FILES: getPositiveInt(
      env,
      "MAX_UPLOAD_FILES",
      DEFAULT_MAX_UPLOAD_FILES,
    ),
    MAX_UPLOAD_FILE_SIZE: getPositiveInt(
      env,
      "MAX_UPLOAD_FILE_SIZE",
      DEFAULT_MAX_UPLOAD_FILE_SIZE,
    ),
  };
};
