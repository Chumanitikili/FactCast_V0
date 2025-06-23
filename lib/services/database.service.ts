import { neon } from "@neondatabase/serverless"

// Database connection
const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "")

// Database service class
class DatabaseService {
  private sql = sql

  async query(text: string, params: any[] = []) {
    try {
      const result = await this.sql(text, params)
      return result
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  }

  async getUser(id: string) {
    const result = await this.query("SELECT * FROM users WHERE id = $1", [id])
    return result[0] || null
  }

  async createUser(userData: { email: string; password: string; name?: string }) {
    const { email, password, name } = userData
    const result = await this.query(
      "INSERT INTO users (email, password, name, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [email, password, name || ""],
    )
    return result[0]
  }

  async getPodcast(id: string) {
    const result = await this.query("SELECT * FROM podcasts WHERE id = $1", [id])
    return result[0] || null
  }

  async createPodcast(podcastData: { title: string; userId: string; audioUrl?: string }) {
    const { title, userId, audioUrl } = podcastData
    const result = await this.query(
      "INSERT INTO podcasts (title, user_id, audio_url, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [title, userId, audioUrl || "", "processing"],
    )
    return result[0]
  }

  async getFactChecks(podcastId: string) {
    const result = await this.query("SELECT * FROM fact_checks WHERE podcast_id = $1", [podcastId])
    return result
  }

  async createFactCheck(factCheckData: {
    podcastId: string
    claim: string
    verdict: string
    confidence: number
    sources: string[]
  }) {
    const { podcastId, claim, verdict, confidence, sources } = factCheckData
    const result = await this.query(
      "INSERT INTO fact_checks (podcast_id, claim, verdict, confidence, sources, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *",
      [podcastId, claim, verdict, confidence, JSON.stringify(sources)],
    )
    return result[0]
  }

  async healthCheck() {
    try {
      await this.query("SELECT 1")
      return { status: "healthy", timestamp: new Date().toISOString() }
    } catch (error) {
      return { status: "unhealthy", error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}

// Export singleton instance
export const db = new DatabaseService()
export default db
