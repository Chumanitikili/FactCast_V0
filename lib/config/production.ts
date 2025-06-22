import { z } from "zod"

// Environment validation schema
const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("3000"),

  // Database
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  DATABASE_POOL_MAX: z.string().transform(Number).default("20"),
  DATABASE_POOL_MIN: z.string().transform(Number).default("5"),

  // Authentication
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT refresh secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // External APIs
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  NEWS_API_KEY: z.string().optional(),
  GUARDIAN_API_KEY: z.string().optional(),

  // Storage
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Application
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("1000"),

  // File uploads
  MAX_FILE_SIZE: z.string().transform(Number).default("524288000"), // 500MB
  ALLOWED_FILE_TYPES: z.string().default("audio/mpeg,audio/wav,audio/mp4,audio/webm"),
})

// Validate and export environment
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error("❌ Invalid environment configuration:")
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join(".")}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export const config = validateEnv()

// Derived configurations
export const isDevelopment = config.NODE_ENV === "development"
export const isProduction = config.NODE_ENV === "production"
export const isTest = config.NODE_ENV === "test"

export const database = {
  url: config.DATABASE_URL,
  pool: {
    max: config.DATABASE_POOL_MAX,
    min: config.DATABASE_POOL_MIN,
  },
}

export const auth = {
  jwtSecret: config.JWT_SECRET,
  jwtRefreshSecret: config.JWT_REFRESH_SECRET,
  jwtExpiresIn: config.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
}

export const storage = {
  aws: {
    region: config.AWS_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    bucketName: config.S3_BUCKET_NAME,
  },
}

export const redis = {
  url: config.REDIS_URL,
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
}

export const cors = {
  origin: config.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
  credentials: true,
}

export const rateLimit = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
}

export const upload = {
  maxFileSize: config.MAX_FILE_SIZE,
  allowedTypes: config.ALLOWED_FILE_TYPES.split(",").map((type) => type.trim()),
}
