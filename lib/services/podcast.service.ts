import { db } from "./database.service"
import { factCheckService } from "./fact-check.service"

interface PodcastUploadData {
  userId: string
  title: string
  description?: string
  audioFile: File
  settings?: {
    autoFactCheck?: boolean
    confidenceThreshold?: number
    sourceTypes?: string[]
  }
}

interface PodcastProcessingResult {
  podcastId: string
  status: string
  transcriptSegments?: any[]
  factCheckResults?: any[]
  processingTimeMs: number
}

class PodcastService {
  async uploadPodcast(data: PodcastUploadData): Promise<{ podcastId: string; uploadUrl?: string }> {
    try {
      // Validate file
      if (!data.audioFile) {
        throw new Error("Audio file is required")
      }

      // Check file type
      const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm", "audio/ogg"]
      if (!allowedTypes.includes(data.audioFile.type)) {
        throw new Error("Unsupported audio file type")
      }

      // Check file size (500MB limit)
      const maxSize = 500 * 1024 * 1024 // 500MB
      if (data.audioFile.size > maxSize) {
        throw new Error("File size exceeds 500MB limit")
      }

      // For now, we'll use a mock URL - in production, upload to S3/storage
      const audioUrl = `https://storage.truthcast.com/audio/${Date.now()}-${data.audioFile.name}`

      // Create podcast record
      const podcast = await db.createPodcast({
        userId: data.userId,
        title: data.title,
        description: data.description,
        audioUrl,
        audioSize: data.audioFile.size,
        duration: 0, // Will be updated after processing
      })

      // Track analytics
      await db.trackEvent({
        eventName: "podcast_uploaded",
        userId: data.userId,
        properties: {
          podcastId: podcast.id,
          fileSize: data.audioFile.size,
          fileType: data.audioFile.type,
          autoFactCheck: data.settings?.autoFactCheck || false,
        },
      })

      // Start background processing (in production, use a queue)
      this.processPodcastAsync(podcast.id, data.settings)

      return {
        podcastId: podcast.id,
        uploadUrl: audioUrl,
      }
    } catch (error) {
      console.error("Podcast upload error:", error)
      throw error
    }
  }

  async getPodcastsByUser(userId: string): Promise<any[]> {
    try {
      const podcasts = await db.findPodcastsByUserId(userId)

      // Get fact-check counts for each podcast
      const podcastsWithStats = await Promise.all(
        podcasts.map(async (podcast) => {
          const factChecks = await db.findFactChecksByPodcastId(podcast.id)
          return {
            ...podcast,
            factCheckCount: factChecks.length,
            flaggedCount: factChecks.filter((fc) => fc.is_flagged).length,
          }
        }),
      )

      return podcastsWithStats
    } catch (error) {
      console.error("Error fetching user podcasts:", error)
      return []
    }
  }

  async getPodcastDetails(podcastId: string, userId: string): Promise<any> {
    try {
      const podcast = await db.findPodcastById(podcastId)
      if (!podcast) {
        throw new Error("Podcast not found")
      }

      // Verify ownership
      if (podcast.user_id !== userId) {
        throw new Error("Access denied")
      }

      // Get fact-check results
      const factChecks = await db.findFactChecksByPodcastId(podcastId)

      // Get transcript segments (if available)
      const transcriptSegments = await db.query(
        "SELECT * FROM transcript_segments WHERE podcast_id = $1 ORDER BY timestamp_ms ASC",
        [podcastId],
      )

      return {
        ...podcast,
        factChecks,
        transcriptSegments,
        stats: {
          totalFactChecks: factChecks.length,
          flaggedCount: factChecks.filter((fc) => fc.is_flagged).length,
          avgConfidence:
            factChecks.length > 0 ? factChecks.reduce((sum, fc) => sum + fc.confidence, 0) / factChecks.length : 0,
          verdictBreakdown: this.getVerdictBreakdown(factChecks),
        },
      }
    } catch (error) {
      console.error("Error fetching podcast details:", error)
      throw error
    }
  }

  async deletePodcast(podcastId: string, userId: string): Promise<void> {
    try {
      const podcast = await db.findPodcastById(podcastId)
      if (!podcast) {
        throw new Error("Podcast not found")
      }

      // Verify ownership
      if (podcast.user_id !== userId) {
        throw new Error("Access denied")
      }

      // Delete podcast and related data (cascading deletes will handle fact checks, etc.)
      await db.query("DELETE FROM podcasts WHERE id = $1", [podcastId])

      // Track analytics
      await db.trackEvent({
        eventName: "podcast_deleted",
        userId,
        properties: {
          podcastId,
          title: podcast.title,
        },
      })
    } catch (error) {
      console.error("Error deleting podcast:", error)
      throw error
    }
  }

  private async processPodcastAsync(podcastId: string, settings?: any): Promise<void> {
    try {
      // Update status to processing
      await db.updatePodcastStatus(podcastId, "processing")

      // Mock processing - in production, use actual transcription service
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate processing time

      // Mock transcript
      const mockTranscript = [
        {
          timestamp_ms: 0,
          text: "Welcome to today's podcast. We're going to discuss some important facts about climate change.",
          confidence: 0.95,
        },
        {
          timestamp_ms: 5000,
          text: "According to recent studies, global temperatures have risen by 1.1 degrees Celsius since pre-industrial times.",
          confidence: 0.92,
        },
        {
          timestamp_ms: 15000,
          text: "The Paris Agreement aims to limit global warming to well below 2 degrees Celsius.",
          confidence: 0.94,
        },
      ]

      // Save transcript segments
      for (const segment of mockTranscript) {
        await db.query(
          "INSERT INTO transcript_segments (podcast_id, timestamp_ms, text, confidence) VALUES ($1, $2, $3, $4)",
          [podcastId, segment.timestamp_ms, segment.text, segment.confidence],
        )
      }

      // Auto fact-check if enabled
      if (settings?.autoFactCheck) {
        for (const segment of mockTranscript) {
          // Extract potential claims
          if (segment.text.length > 50) {
            // Simple heuristic for factual claims
            try {
              await factCheckService.processFactCheck({
                claim: segment.text,
                podcastId,
                context: "Podcast transcript segment",
              })
            } catch (error) {
              console.error("Auto fact-check failed for segment:", error)
            }
          }
        }
      }

      // Update podcast duration and status
      const totalDuration = Math.max(...mockTranscript.map((s) => s.timestamp_ms)) / 1000 + 10 // Add 10 seconds
      await db.query("UPDATE podcasts SET duration = $1, status = $2 WHERE id = $3", [
        totalDuration,
        "completed",
        podcastId,
      ])

      // Track completion
      await db.trackEvent({
        eventName: "podcast_processing_completed",
        properties: {
          podcastId,
          duration: totalDuration,
          segmentCount: mockTranscript.length,
          autoFactCheck: settings?.autoFactCheck || false,
        },
      })
    } catch (error) {
      console.error("Podcast processing error:", error)
      await db.updatePodcastStatus(podcastId, "failed", error.message)
    }
  }

  private getVerdictBreakdown(factChecks: any[]): Record<string, number> {
    const breakdown = {
      verified: 0,
      false: 0,
      uncertain: 0,
      partial: 0,
      disputed: 0,
    }

    factChecks.forEach((fc) => {
      if (breakdown.hasOwnProperty(fc.verdict)) {
        breakdown[fc.verdict]++
      }
    })

    return breakdown
  }
}

export const podcastService = new PodcastService()
export default podcastService
