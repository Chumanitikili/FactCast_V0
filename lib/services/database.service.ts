// Database service for TruthCast application
interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

interface Podcast {
  id: string
  userId: string
  title: string
  description?: string
  status: string
  createdAt: Date
}

interface FactCheck {
  id: string
  podcastId: string
  claim: string
  verdict: string
  confidence: number
  createdAt: Date
}

class DatabaseService {
  private users: User[] = []
  private podcasts: Podcast[] = []
  private factChecks: FactCheck[] = []

  async createUser(data: { email: string; name: string }): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}`,
      email: data.email,
      name: data.name,
      createdAt: new Date(),
    }
    this.users.push(user)
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null
  }

  async createPodcast(data: {
    userId: string
    title: string
    description?: string
  }): Promise<Podcast> {
    const podcast: Podcast = {
      id: `podcast_${Date.now()}`,
      userId: data.userId,
      title: data.title,
      description: data.description,
      status: "processing",
      createdAt: new Date(),
    }
    this.podcasts.push(podcast)
    return podcast
  }

  async getPodcastsByUserId(userId: string): Promise<Podcast[]> {
    return this.podcasts.filter((p) => p.userId === userId)
  }

  async getPodcastById(id: string): Promise<Podcast | null> {
    return this.podcasts.find((p) => p.id === id) || null
  }

  async updatePodcastStatus(id: string, status: string): Promise<void> {
    const podcast = this.podcasts.find((p) => p.id === id)
    if (podcast) {
      podcast.status = status
    }
  }

  async createFactCheck(data: {
    podcastId: string
    claim: string
    verdict: string
    confidence: number
  }): Promise<FactCheck> {
    const factCheck: FactCheck = {
      id: `fact_${Date.now()}`,
      podcastId: data.podcastId,
      claim: data.claim,
      verdict: data.verdict,
      confidence: data.confidence,
      createdAt: new Date(),
    }
    this.factChecks.push(factCheck)
    return factCheck
  }

  async getFactChecksByPodcastId(podcastId: string): Promise<FactCheck[]> {
    return this.factChecks.filter((fc) => fc.podcastId === podcastId)
  }

  async healthCheck(): Promise<boolean> {
    return true
  }

  async getUserStats(userId: string) {
    const userPodcasts = this.podcasts.filter((p) => p.userId === userId)
    const userFactChecks = this.factChecks.filter((fc) => userPodcasts.some((p) => p.id === fc.podcastId))

    return {
      totalPodcasts: userPodcasts.length,
      totalFactChecks: userFactChecks.length,
      avgConfidence:
        userFactChecks.length > 0
          ? userFactChecks.reduce((sum, fc) => sum + fc.confidence, 0) / userFactChecks.length
          : 0,
    }
  }
}

export const db = new DatabaseService()
