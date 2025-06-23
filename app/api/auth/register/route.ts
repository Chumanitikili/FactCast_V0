import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/services/auth.service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Email, password, and name are required" }, { status: 400 })
    }

    const result = await authService.register({ email, password, name })

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
        error: error instanceof Error ? error.message : "Registration failed",
      },
      { status: 400 },
    )
  }
}
