import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authService } from "@/lib/services/auth.service"
import { db } from "@/lib/services/database.service"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let statusCode = 200

  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    const ipAddress = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    const result = await authService.login(validatedData, ipAddress)

    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    })

    // Set HTTP-only cookies for tokens
    response.cookies.set("accessToken", result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
    })

    response.cookies.set("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    statusCode = error instanceof z.ZodError ? 400 : 401

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
        ...(error instanceof z.ZodError && { details: error.errors }),
      },
      { status: statusCode },
    )
  } finally {
    // Log API usage
    const responseTime = Date.now() - startTime
    const ipAddress = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    await db
      .logApiUsage({
        endpoint: "/api/auth/login",
        method: "POST",
        statusCode,
        responseTimeMs: responseTime,
        ipAddress,
      })
      .catch(console.error)
  }
}
