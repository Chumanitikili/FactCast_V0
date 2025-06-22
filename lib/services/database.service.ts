import { Pool, type PoolClient } from "pg"
import { config, database } from "@/lib/config/production"

class DatabaseService {
  private pool: Pool
  private static instance: DatabaseService

  constructor() {
    this.pool = new Pool({
      connectionString: database.url,
      max: database.pool.max,
      min: database.pool.min,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: config.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })

    // Handle pool errors
    this.pool.on("error", (err) => {
      console.error("Database pool error:", err)
    })

    // Handle pool connection
    this.pool.on("connect", () => {
      console.log("Database connected")
    })
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start

      if (config.LOG_LEVEL === "debug") {
        console.log("Query executed:", { text, duration, rows: result.rowCount })
      }

      return result.rows
    } catch (error) {
      console.error("Database query error:", { text, params, error })
      throw error
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect()
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient()
    try {
      await client.query("BEGIN")
      const result = await callback(client)
      await client.query("COMMIT")
      return result
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query("SELECT 1")
      return true
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    await this.pool.end()
  }

  // User operations
  async createUser(userData: {
    email: string
    passwordHash: string
    firstName?: string
    lastName?: string
  }) {
    const { email, passwordHash, firstName, lastName } = userData
    const result = await this.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, email, first_name, last_name, created_at`,
      [email, passwordHash, firstName, lastName],
    )
    return result[0]
  }

  async getUserByEmail(email: string) {
    const result = await this.query("SELECT * FROM users WHERE email = $1 AND is_active = true", [email])
    return result[0]
  }

  async getUserById(id: string) {
    const result = await this.query("SELECT * FROM users WHERE id = $1 AND is_active = true", [id])
    return result[0]
  }

  async updateUserLastLogin(userId: string) {
    await this.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [userId])
  }

  // Podcast operations
  async createPodcast(podcastData: {
    userId: string
    title: string
    description?: string
    fileUrl: string
    fileSize?: number
    durationSeconds?: number
  }) {
    const { userId, title, description, fileUrl, fileSize, durationSeconds } = podcastData
    const result = await this.query(
      `INSERT INTO podcasts (user_id, title, description, file_url, file_size, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, description, fileUrl, fileSize, durationSeconds],
    )
    return result[0]
  }

  async getPodcastsByUserId(userId: string, limit = 50, offset = 0) {
    return this.query(
      `SELECT * FROM podcasts 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    )
  }

  async getPodcastById(id: string) {
    const result = await this.query("SELECT * FROM podcasts WHERE id = $1", [id])
    return result[0]
  }

  async updatePodcastStatus(id: string, status: string, progress?: number) {
    await this.query(
      `UPDATE podcasts 
       SET status = $2, processing_progress = COALESCE($3, processing_progress), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, status, progress],
    )
  }

  // Fact check operations
  async createFactCheckResult(resultData: {
    podcastId: string
    claim: string
    verdict: string
    confidenceScore: number
    sources: any[]
    explanation?: string
    timestampStart?: number
    timestampEnd?: number
  }) {
    const { podcastId, claim, verdict, confidenceScore, sources, explanation, timestampStart, timestampEnd } =
      resultData

    const result = await this.query(
      `INSERT INTO fact_check_results 
       (podcast_id, claim, verdict, confidence_score, sources, explanation, timestamp_start, timestamp_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [podcastId, claim, verdict, confidenceScore, JSON.stringify(sources), explanation, timestampStart, timestampEnd],
    )
    return result[0]
  }

  async getFactCheckResultsByPodcastId(podcastId: string) {
    return this.query("SELECT * FROM fact_check_results WHERE podcast_id = $1 ORDER BY timestamp_start ASC", [
      podcastId,
    ])
  }

  // Live session operations
  async createLiveSession(sessionData: {
    userId: string
    title?: string
  }) {
    const { userId, title } = sessionData
    const result = await this.query(
      `INSERT INTO live_sessions (user_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, title],
    )
    return result[0]
  }

  async endLiveSession(sessionId: string) {
    const result = await this.query(
      `UPDATE live_sessions 
       SET status = 'ended', ended_at = CURRENT_TIMESTAMP,
           duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))
       WHERE id = $1
       RETURNING *`,
      [sessionId],
    )
    return result[0]
  }

  async getLiveSessionsByUserId(userId: string) {
    return this.query(
      `SELECT * FROM live_sessions 
       WHERE user_id = $1 
       ORDER BY started_at DESC`,
      [userId],
    )
  }

  // Analytics operations
  async getUserStats(userId: string) {
    const result = await this.query(
      `SELECT 
         COUNT(DISTINCT p.id) as total_podcasts,
         COUNT(DISTINCT fcr.id) as total_fact_checks,
         COUNT(DISTINCT ls.id) as total_live_sessions,
         AVG(fcr.confidence_score) as avg_confidence_score
       FROM users u
       LEFT JOIN podcasts p ON u.id = p.user_id
       LEFT JOIN fact_check_results fcr ON p.id = fcr.podcast_id
       LEFT JOIN live_sessions ls ON u.id = ls.user_id
       WHERE u.id = $1`,
      [userId],
    )
    return result[0]
  }

  async logApiUsage(data: {
    userId?: string
    endpoint: string
    method: string
    statusCode: number
    responseTimeMs: number
    ipAddress?: string
  }) {
    const { userId, endpoint, method, statusCode, responseTimeMs, ipAddress } = data
    await this.query(
      `INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time_ms, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, endpoint, method, statusCode, responseTimeMs, ipAddress],
    )
  }

  async logAuditEvent(data: {
    userId?: string
    action: string
    resourceType?: string
    resourceId?: string
    oldValues?: any
    newValues?: any
    ipAddress?: string
    userAgent?: string
  }) {
    const { userId, action, resourceType, resourceId, oldValues, newValues, ipAddress, userAgent } = data
    await this.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      ],
    )
  }
}

export const db = DatabaseService.getInstance()
export default DatabaseService
