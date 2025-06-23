import { NextResponse } from "next/server"
import { db } from "@/lib/services/database.service"

export async function GET() {
  try {
    const isHealthy = await db.healthCheck()

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: isHealthy ? "up" : "down",
          api: "up",
        },
      },
      {
        status: isHealthy ? 200 : 503,
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      {
        status: 503,
      },
    )
  }
}
