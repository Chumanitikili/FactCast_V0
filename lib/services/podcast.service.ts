import { db } from "./database.service"
import { factCheckService } from "./fact-check.service"

export interface PodcastUploadData {
  userId: string
  title: string
  description?: string
  audioFile: File
}

export interface PodcastStats {
  totalFactChecks: number
  flaggedCount: number
  avgConfidence: number
  verdictBreakdown: Record<string, number>
}

class PodcastService {
  async uploadPodcast(data: PodcastUploadData): Promise<{ podcastId: string }> {
    if (!data.audioFile) {
      throw new Error("Audio file is required")
    }

    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm"]
    if (!allowedTypes.includes(data.audioFile.type)) {
      throw new Error("Unsupported audio file type")
    }

    const maxSize = 100 * 1024 * 1024
    if (data.audioFile.size > maxSize) {
      throw new Error("File size exceeds 100MB limit")
    }

    const podcast = await db.createPodcast({
      userId: data.userId,
      title: data.title,
      description: data.description,
    })

    this.processPodcastAsync(podcast.id)

    return { podcastId: podcast.id }
  }

  async getPodcastsByUser(userId: string): Promise<any[]> {
    const podcasts = await db.getPodcastsByUserId(userId)

    const podcastsWithStats = await Promise.all(
      podcasts.map(async (podcast) => {
        const factChecks = await db.getFactChecksByPodcastId(podcast.id)
        return {
          ...podcast,
          factCheckCount: factChecks.length,
          flaggedCount: factChecks.filter((fc) => fc.confidence < 0.7).length,
        }
      }),
    )

    return podcastsWithStats
  }

  async getPodcastDetails(podcastId: string, userId: string): Promise<any> {
    const podcast = await db.getPodcastById(podcastId)
    if (!podcast) {
      throw new Error("Podcast not found")
    }

    if (podcast.userId !== userId) {
      throw new Error("Access denied")
    }

    const factChecks = await db.getFactChecksByPodcastId(podcastId)

    return {
      ...podcast,
      factChecks,
      stats: {
        totalFactChecks: factChecks.length,
        flaggedCount: factChecks.filter((fc) => fc.confidence < 0.7).length,
        avgConfidence:
          factChecks.length > 0 ? factChecks.reduce((sum, fc) => sum + fc.confidence, 0) / factChecks.length : 0,
      },
    }
  }

  private async processPodcastAsync(podcastId: string): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockTranscript = `
        Welcome to today's podcast. We're discussing climate change facts.
        Global temperatures have risen by 1.1 degrees Celsius since pre-industrial times.
        The Paris Agreement aims to limit warming to below 2 degrees Celsius.
        Renewable energy is becoming more cost-effective each year.
      `

      await factCheckService.processTranscript(podcastId, mockTranscript)

      await db.updatePodcastStatus(podcastId, "completed")
    } catch (error) {
      console.error("Processing failed:", error)
      await db.updatePodcastStatus(podcastId, "failed")
    }
  }
}

export const podcastService = new PodcastService()
