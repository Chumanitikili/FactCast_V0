// Simple environment configuration
export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number.parseInt(process.env.PORT || "3000"),
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",
  DATABASE_POOL_MAX: Number.parseInt(process.env.DATABASE_POOL_MAX || "20"),
  DATABASE_POOL_MIN: Number.parseInt(process.env.DATABASE_POOL_MIN || "5"),
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-key",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  GUARDIAN_API_KEY: process.env.GUARDIAN_API_KEY,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT) : undefined,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
}

export const isDevelopment = config.NODE_ENV === "development"
export const isProduction = config.NODE_ENV === "production"
export const isTest = config.NODE_ENV === "test"
