import { NextResponse } from "next/server"
import { db } from "@/lib/services/database.service"
import { config } from "@/lib/config/production"

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded"
  timestamp: string
  version: string
  environment: string
  services: {
    database: {
      status: "up" | "down"
      responseTime?: number
    }
    redis?: {
      status: "up" | "down"
      responseTime?: number
    }
    openai: {
      status: "up" | "down"
      configured: boolean
    }
    storage?: {
      status: "up" | "down"
      configured: boolean
    }
  }
  metrics: {
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu?: {
      usage: number
    }
  }
}

export async function GET() {
  const startTime = Date.now()

  try {
    const healthStatus: HealthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: config.NODE_ENV,
      services: {
        database: { status: "down" },
        openai: {
          status: "up",
          configured: !!config.OPENAI_API_KEY,
        },
      },
      metrics: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
        },
      },
    }

    // Check database health
    const dbStart = Date.now()
    try {
      const isDbHealthy = await db.healthCheck()
      healthStatus.services.database = {
        status: isDbHealthy ? "up" : "down",
        responseTime: Date.now() - dbStart,
      }
    } catch (error) {
      healthStatus.services.database = {
        status: "down",
        responseTime: Date.now() - dbStart,
      }
      healthStatus.status = "degraded"
    }

    // Check Redis health (if configured)
    if (config.REDIS_URL || config.REDIS_HOST) {
      healthStatus.services.redis = { status: "up" }
      // Add Redis health check here if needed
    }

    // Check storage health (if configured)
    if (config.S3_BUCKET_NAME) {
      healthStatus.services.storage = {
        status: "up",
        configured: !!(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY),
      }
    }

    // Determine overall status
    const serviceStatuses = Object.values(healthStatus.services).map((service) => service.status)
    if (serviceStatuses.includes("down")) {
      healthStatus.status = serviceStatuses.filter((s) => s === "up").length > 0 ? "degraded" : "unhealthy"
    }

    const statusCode = healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503

    return NextResponse.json(healthStatus, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        responseTime: Date.now() - startTime,
      },
      { status: 503 },
    )
  }
}

// Simple health check for load balancers
export async function HEAD() {
  try {
    const isHealthy = await db.healthCheck()
    return new Response(null, { status: isHealthy ? 200 : 503 })
  } catch {
    return new Response(null, { status: 503 })
  }
}
