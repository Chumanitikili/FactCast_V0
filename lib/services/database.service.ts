// Simple in-memory database service for demo purposes
interface User {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
}

interface Podcast {
  id: string
  userId: string
  title: string
  description?: string
  status: string
  duration?: string
  transcript?: string
  createdAt: Date
}

interface FactCheck {
  id: string
  podcastId: string
  claim: string
  verdict: string
  confidence: number
  sources: string[]
  createdAt: Date
}

class DatabaseService {
  private users: User[] = []
  private podcasts: Podcast[] = []
  private factChecks: FactCheck[] = []

  async query(text: string, params: any[] = []) {
    // Mock query implementation
    return []
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null
  }

  async createUser(userData: { email: string; password: string; name?: string }): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      password: userData.password,
      name: userData.name || "",
      createdAt: new Date(),
    }
    this.users.push(user)
    return user
  }

  async getPodcast(id: string): Promise<Podcast | null> {
    return this.podcasts.find((p) => p.id === id) || null
  }

  async createPodcast(podcastData: { title: string; userId: string; audioUrl?: string }): Promise<Podcast> {
    const podcast: Podcast = {
      id: `podcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: podcastData.userId,
      title: podcastData.title,
      status: "processing",
      createdAt: new Date(),
    }
    this.podcasts.push(podcast)
    return podcast
  }

  async getPodcastsByUserId(userId: string): Promise<Podcast[]> {
    return this.podcasts.filter((p) => p.userId === userId)
  }

  async updatePodcastStatus(id: string, status: string): Promise<void> {
    const podcast = this.podcasts.find((p) => p.id === id)
    if (podcast) {
      podcast.status = status
    }
  }

  async getFactChecks(podcastId: string): Promise<FactCheck[]> {
    return this.factChecks.filter((fc) => fc.podcastId === podcastId)
  }

  async createFactCheck(factCheckData: {
    podcastId: string
    claim: string
    verdict: string
    confidence: number
    sources: string[]
  }): Promise<FactCheck> {
    const factCheck: FactCheck = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      podcastId: factCheckData.podcastId,
      claim: factCheckData.claim,
      verdict: factCheckData.verdict,
      confidence: factCheckData.confidence,
      sources: factCheckData.sources,
      createdAt: new Date(),
    }
    this.factChecks.push(factCheck)
    return factCheck
  }

  async healthCheck() {
    return { status: "healthy", timestamp: new Date().toISOString() }
  }
}

export const db = new DatabaseService()
export default db
