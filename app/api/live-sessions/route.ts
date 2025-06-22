import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/services/auth.service"
import { db } from "@/lib/services/database.service"

async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return authService.verifyAccessToken(token)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { title, settings } = body

    if (!title) {
      return NextResponse.json({ error: "Session title is required" }, { status: 400 })
    }

    const session = await db.createLiveSession({
      userId: user.id,
      title,
      settings: settings || {},
    })

    // Track analytics
    await db.trackEvent({
      eventName: "live_session_started",
      userId: user.id,
      properties: {
        sessionId: session.id,
        title,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: "Live session started successfully",
    })
  } catch (error) {
    console.error("Create live session error:", error)
    return NextResponse.json({ error: "Failed to create live session" }, { status: 500 })
  }
}
