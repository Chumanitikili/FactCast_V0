import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/services/auth.service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const result = await authService.login({ email, password })

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      },
      { status: 401 },
    )
  }
}
