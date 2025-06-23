import { db } from "./database.service"
import { factCheckService } from "./fact-check.service"

interface PodcastUpload {
  title: string
  userId: string
  audioFile?: File
  audioUrl?: string
}

interface PodcastProcessingResult {
  id: string
  title: string
  status: "processing" | "completed" | "failed"
  factChecks: Array<{
    claim: string
    verdict: string
    confidence: number
  }>
  duration?: string
  transcript?: string
}

class PodcastService {
  async uploadPodcast(upload: PodcastUpload): Promise<{ success: boolean; podcastId?: string; error?: string }> {
    try {
      const { title, userId, audioUrl } = upload

      const podcast = await db.createPodcast({
        title,
        userId,
        audioUrl,
      })

      // Start background processing
      this.processPodcastAsync(podcast.id)

      return {
        success: true,
        podcastId: podcast.id,
      }
    } catch (error) {
      console.error("Podcast upload error:", error)
      return {
        success: false,
        error: "Failed to upload podcast",
      }
    }
  }

  async getPodcast(id: string): Promise<PodcastProcessingResult | null> {
    try {
      const podcast = await db.getPodcast(id)
      if (!podcast) return null

      const factChecks = await db.getFactChecks(id)

      return {
        id: podcast.id,
        title: podcast.title,
        status: podcast.status as "processing" | "completed" | "failed",
        factChecks: factChecks.map((fc) => ({
          claim: fc.claim,
          verdict: fc.verdict,
          confidence: fc.confidence,
        })),
        duration: podcast.duration,
        transcript: podcast.transcript,
      }
    } catch (error) {
      console.error("Get podcast error:", error)
      return null
    }
  }

  async getUserPodcasts(userId: string): Promise<PodcastProcessingResult[]> {
    try {
      const podcasts = await db.getPodcastsByUserId(userId)

      const results = await Promise.all(
        podcasts.map(async (podcast) => {
          const factChecks = await db.getFactChecks(podcast.id)
          return {
            id: podcast.id,
            title: podcast.title,
            status: podcast.status as "processing" | "completed" | "failed",
            factChecks: factChecks.map((fc) => ({
              claim: fc.claim,
              verdict: fc.verdict,
              confidence: fc.confidence,
            })),
            duration: podcast.duration,
            transcript: podcast.transcript,
          }
        }),
      )

      return results
    } catch (error) {
      console.error("Get user podcasts error:", error)
      return []
    }
  }

  private async processPodcastAsync(podcastId: string) {
    try {
      await this.simulateAudioProcessing(podcastId)

      const claims = await this.extractClaims()

      for (const claim of claims) {
        const result = await factCheckService.checkFact({ claim })
        await factCheckService.saveFactCheck(podcastId, result)
      }

      await db.updatePodcastStatus(podcastId, "completed")
    } catch (error) {
      console.error("Podcast processing error:", error)
      await db.updatePodcastStatus(podcastId, "failed")
    }
  }

  private async simulateAudioProcessing(podcastId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  private async extractClaims(): Promise<string[]> {
    return [
      "Global temperatures have risen by 1.1 degrees Celsius since pre-industrial times",
      "AI will transform the job market significantly in the next decade",
      "Renewable energy costs have decreased by 70% in the last decade",
    ]
  }

  async deletePodcast(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const podcast = await db.getPodcast(id)
      if (!podcast || podcast.userId !== userId) {
        return {
          success: false,
          error: "Podcast not found or access denied",
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Delete podcast error:", error)
      return {
        success: false,
        error: "Failed to delete podcast",
      }
    }
  }

  async getStats(userId: string) {
    try {
      const podcasts = await db.getPodcastsByUserId(userId)
      const completedPodcasts = podcasts.filter((p) => p.status === "completed")
      const processingPodcasts = podcasts.filter((p) => p.status === "processing")

      let totalFactChecks = 0
      let totalConfidence = 0

      for (const podcast of podcasts) {
        const factChecks = await db.getFactChecks(podcast.id)
        totalFactChecks += factChecks.length
        totalConfidence += factChecks.reduce((sum, fc) => sum + fc.confidence, 0)
      }

      return {
        totalPodcasts: podcasts.length,
        completedPodcasts: completedPodcasts.length,
        processingPodcasts: processingPodcasts.length,
        totalFactChecks,
        avgConfidence: totalFactChecks > 0 ? totalConfidence / totalFactChecks : 0,
      }
    } catch (error) {
      console.error("Get stats error:", error)
      return {
        totalPodcasts: 0,
        completedPodcasts: 0,
        processingPodcasts: 0,
        totalFactChecks: 0,
        avgConfidence: 0,
      }
    }
  }
}

export const podcastService = new PodcastService()
export default podcastService
