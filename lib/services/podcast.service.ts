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

      // Create podcast record
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
        status: podcast.status,
        factChecks: factChecks.map((fc: any) => ({
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
      const podcasts = await db.query("SELECT * FROM podcasts WHERE user_id = $1 ORDER BY created_at DESC", [userId])

      const results = await Promise.all(
        podcasts.map(async (podcast: any) => {
          const factChecks = await db.getFactChecks(podcast.id)
          return {
            id: podcast.id,
            title: podcast.title,
            status: podcast.status,
            factChecks: factChecks.map((fc: any) => ({
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
      // Simulate audio processing and transcription
      await this.simulateAudioProcessing(podcastId)

      // Extract claims from transcript (mock)
      const claims = await this.extractClaims(podcastId)

      // Fact-check each claim
      for (const claim of claims) {
        const result = await factCheckService.checkFact({ claim })
        await factCheckService.saveFactCheck(podcastId, result)
      }

      // Update podcast status
      await db.query("UPDATE podcasts SET status = $1, processed_at = NOW() WHERE id = $2", ["completed", podcastId])
    } catch (error) {
      console.error("Podcast processing error:", error)
      await db.query("UPDATE podcasts SET status = $1 WHERE id = $2", ["failed", podcastId])
    }
  }

  private async simulateAudioProcessing(podcastId: string): Promise<void> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock transcript
    const mockTranscript = "This is a sample transcript with various claims about climate change and technology."

    await db.query("UPDATE podcasts SET transcript = $1, duration = $2 WHERE id = $3", [
      mockTranscript,
      "25:30",
      podcastId,
    ])
  }

  private async extractClaims(podcastId: string): Promise<string[]> {
    // Mock claim extraction
    return [
      "Global temperatures have risen by 1.1 degrees Celsius since pre-industrial times",
      "AI will transform the job market significantly in the next decade",
      "Renewable energy costs have decreased by 70% in the last decade",
    ]
  }

  async deletePodcast(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify ownership
      const podcast = await db.getPodcast(id)
      if (!podcast || podcast.user_id !== userId) {
        return {
          success: false,
          error: "Podcast not found or access denied",
        }
      }

      // Delete fact checks first
      await db.query("DELETE FROM fact_checks WHERE podcast_id = $1", [id])

      // Delete podcast
      await db.query("DELETE FROM podcasts WHERE id = $1", [id])

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
      const stats = await db.query(
        `
        SELECT 
          COUNT(*) as total_podcasts,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_podcasts,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_podcasts
        FROM podcasts 
        WHERE user_id = $1
      `,
        [userId],
      )

      const factCheckStats = await db.query(
        `
        SELECT 
          COUNT(*) as total_fact_checks,
          AVG(confidence) as avg_confidence
        FROM fact_checks fc
        JOIN podcasts p ON fc.podcast_id = p.id
        WHERE p.user_id = $1
      `,
        [userId],
      )

      return {
        totalPodcasts: Number.parseInt(stats[0]?.total_podcasts || "0"),
        completedPodcasts: Number.parseInt(stats[0]?.completed_podcasts || "0"),
        processingPodcasts: Number.parseInt(stats[0]?.processing_podcasts || "0"),
        totalFactChecks: Number.parseInt(factCheckStats[0]?.total_fact_checks || "0"),
        avgConfidence: Number.parseFloat(factCheckStats[0]?.avg_confidence || "0"),
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

// Export singleton instance
export const podcastService = new PodcastService()
export default podcastService
