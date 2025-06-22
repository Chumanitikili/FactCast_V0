import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authService } from "@/lib/services/auth.service"
import { db } from "@/lib/services/database.service"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let statusCode = 200

  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const result = await authService.register(validatedData)

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
    statusCode = error instanceof z.ZodError ? 400 : 500

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
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
        endpoint: "/api/auth/register",
        method: "POST",
        statusCode,
        responseTimeMs: responseTime,
        ipAddress,
      })
      .catch(console.error)
  }
}
