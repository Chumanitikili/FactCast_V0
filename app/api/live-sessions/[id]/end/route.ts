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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const session = await db.findLiveSessionById(params.id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update session status
    await db.updateLiveSessionStatus(params.id, "ended")

    // Track analytics
    await db.trackEvent({
      eventName: "live_session_ended",
      userId: user.id,
      properties: {
        sessionId: params.id,
        duration: Date.now() - new Date(session.created_at).getTime(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Live session ended successfully",
    })
  } catch (error) {
    console.error("End live session error:", error)
    return NextResponse.json({ error: "Failed to end live session" }, { status: 500 })
  }
}
