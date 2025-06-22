import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/services/auth.service"
import { podcastService } from "@/lib/services/podcast.service"

async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return authService.verifyAccessToken(token)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const podcast = await podcastService.getPodcastDetails(params.id, user.id)

    return NextResponse.json({
      success: true,
      podcast,
    })
  } catch (error) {
    console.error("Get podcast details error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch podcast" }, { status: 404 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    await podcastService.deletePodcast(params.id, user.id)

    return NextResponse.json({
      success: true,
      message: "Podcast deleted successfully",
    })
  } catch (error) {
    console.error("Delete podcast error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete podcast" }, { status: 400 })
  }
}
