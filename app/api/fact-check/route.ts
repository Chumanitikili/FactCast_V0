import { type NextRequest, NextResponse } from "next/server"
import { factCheckService } from "@/lib/services/fact-check.service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claim, sessionId, podcastId, context } = body

    if (!claim || typeof claim !== "string") {
      return NextResponse.json({ error: "Claim is required and must be a string" }, { status: 400 })
    }

    const result = await factCheckService.processFactCheck({
      claim,
      sessionId,
      podcastId,
      context,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Fact-check API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Fact-check API is running" })
}
