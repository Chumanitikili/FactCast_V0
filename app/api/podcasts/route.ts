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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const podcasts = await podcastService.getPodcastsByUser(user.id)

    return NextResponse.json({
      success: true,
      podcasts,
    })
  } catch (error) {
    console.error("Get podcasts error:", error)
    return NextResponse.json({ error: "Failed to fetch podcasts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const audioFile = formData.get("audioFile") as File
    const autoFactCheck = formData.get("autoFactCheck") === "true"

    if (!title || !audioFile) {
      return NextResponse.json({ error: "Title and audio file are required" }, { status: 400 })
    }

    const result = await podcastService.uploadPodcast({
      userId: user.id,
      title,
      description,
      audioFile,
      settings: {
        autoFactCheck,
        confidenceThreshold: 70,
        sourceTypes: ["news", "academic", "government"],
      },
    })

    return NextResponse.json({
      success: true,
      podcastId: result.podcastId,
      message: "Podcast uploaded successfully. Processing will begin shortly.",
    })
  } catch (error) {
    console.error("Upload podcast error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 400 })
  }
}
