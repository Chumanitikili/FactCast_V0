import { type NextRequest, NextResponse } from "next/server"
import { podcastService } from "@/lib/services/podcast.service"
import { authService } from "@/lib/services/auth.service"

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const userId = await authService.verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const audioFile = formData.get("audioFile") as File

    if (!title || !audioFile) {
      return NextResponse.json({ error: "Title and audio file are required" }, { status: 400 })
    }

    const result = await podcastService.uploadPodcast({
      userId,
      title,
      description,
      audioFile,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 400 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const userId = await authService.verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const podcasts = await podcastService.getPodcastsByUser(userId)

    return NextResponse.json({
      success: true,
      data: podcasts,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch podcasts",
      },
      { status: 500 },
    )
  }
}
