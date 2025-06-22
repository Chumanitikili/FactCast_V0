import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/services/auth.service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Refresh tokens
    const result = await authService.refreshToken(refreshToken)

    return NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
  }
}
