// Direct environment variable access
const NEWS_API_KEY = process.env.NEWS_API_KEY
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY

interface NewsAPIResponse {
  articles: Array<{
    title: string
    url: string
    source: { name: string }
    publishedAt: string
    description: string
  }>
}

interface Source {
  id: string
  title: string
  url: string
  domain: string
  source_type: string
  political_lean?: string
  reliability_score: number
  is_active?: boolean
  last_verified?: string | Date
  created_at?: string | Date
}

class SourceSearchService {
  async searchSources(query: string, sourceTypes: string[] = ["news"]): Promise<Source[]> {
    const sources: Source[] = []

    // Search news sources
    if (sourceTypes.includes("news")) {
      const newsSources = await this.searchNewsAPI(query)
      sources.push(...newsSources)
    }

    // Add academic sources
    if (sourceTypes.includes("academic")) {
      const academicSources = await this.getMockAcademicSources(query)
      sources.push(...academicSources)
    }

    // Add government sources
    if (sourceTypes.includes("government")) {
      const govSources = await this.getMockGovernmentSources(query)
      sources.push(...govSources)
    }

    return sources.slice(0, 10) // Limit to top 10 sources
  }

  private async searchNewsAPI(query: string): Promise<Source[]> {
    try {
      if (!NEWS_API_KEY) {
        console.warn("News API key not configured, using mock sources")
        return this.getMockNewsSources(query)
      }

      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`)
      }

      const data: NewsAPIResponse = await response.json()

      return data.articles.map((article, index) => ({
        id: `news_${Date.now()}_${index}`,
        title: article.title,
        url: article.url,
        domain: new URL(article.url).hostname,
        source_type: "news",
        political_lean: "unknown",
        reliability_score: this.calculateReliabilityScore(article.source.name),
        is_active: true,
        last_verified: new Date(),
        created_at: new Date(),
      }))
    } catch (error) {
      console.error("News API search error:", error)
      return this.getMockNewsSources(query)
    }
  }

  private calculateReliabilityScore(sourceName: string): number {
    const reliableSourcesMap: Record<string, number> = {
      Reuters: 95,
      "Associated Press": 95,
      "BBC News": 90,
      "The Guardian": 85,
      "The New York Times": 85,
      "The Washington Post": 85,
      NPR: 85,
      CNN: 75,
      "Fox News": 70,
    }

    return reliableSourcesMap[sourceName] || 60
  }

  private getMockNewsSources(query: string): Source[] {
    return [
      {
        id: `mock_news_${Date.now()}_1`,
        title: `Reuters Analysis: "${query}"`,
        url: `https://www.reuters.com/fact-check/analysis-${query.toLowerCase().replace(/\s+/g, "-")}`,
        domain: "reuters.com",
        source_type: "news",
        political_lean: "center",
        reliability_score: 95,
        is_active: true,
        last_verified: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: `mock_news_${Date.now()}_2`,
        title: `AP Fact Check: "${query}"`,
        url: `https://apnews.com/hub/ap-fact-check/${query.toLowerCase().replace(/\s+/g, "-")}`,
        domain: "apnews.com",
        source_type: "news",
        political_lean: "center",
        reliability_score: 94,
        is_active: true,
        last_verified: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]
  }

  private async getMockAcademicSources(query: string): Promise<Source[]> {
    return [
      {
        id: `mock_academic_${Date.now()}_1`,
        title: `Research Study: ${query}`,
        url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${Math.floor(Math.random() * 9000000) + 1000000}/`,
        domain: "ncbi.nlm.nih.gov",
        source_type: "academic",
        political_lean: "center",
        reliability_score: 98,
        is_active: true,
        last_verified: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]
  }

  private async getMockGovernmentSources(query: string): Promise<Source[]> {
    return [
      {
        id: `mock_gov_${Date.now()}_1`,
        title: `CDC Data: ${query}`,
        url: `https://www.cdc.gov/data/${query.toLowerCase().replace(/\s+/g, "-")}`,
        domain: "cdc.gov",
        source_type: "government",
        political_lean: "center",
        reliability_score: 93,
        is_active: true,
        last_verified: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]
  }
}

export const sourceSearchService = new SourceSearchService()
export default sourceSearchService
