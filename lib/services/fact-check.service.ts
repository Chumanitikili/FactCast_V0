import { db } from "./database.service"

interface FactCheckRequest {
  claim: string
  context?: string
  sources?: string[]
}

interface FactCheckResult {
  claim: string
  verdict: "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "MISLEADING" | "UNVERIFIED"
  confidence: number
  sources: Array<{
    url: string
    title: string
    snippet: string
    reliability: number
  }>
  explanation: string
  timestamp: string
}

class FactCheckService {
  async checkFact(request: FactCheckRequest): Promise<FactCheckResult> {
    try {
      const { claim } = request
      const mockResult = await this.simulateFactCheck(claim)

      return {
        claim,
        verdict: mockResult.verdict,
        confidence: mockResult.confidence,
        sources: mockResult.sources,
        explanation: mockResult.explanation,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Fact-check error:", error)
      throw new Error("Failed to perform fact-check")
    }
  }

  async batchFactCheck(claims: string[]): Promise<FactCheckResult[]> {
    const results = await Promise.all(claims.map((claim) => this.checkFact({ claim })))
    return results
  }

  private async simulateFactCheck(claim: string): Promise<{
    verdict: "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "MISLEADING" | "UNVERIFIED"
    confidence: number
    sources: Array<{ url: string; title: string; snippet: string; reliability: number }>
    explanation: string
  }> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (claim.toLowerCase().includes("climate") || claim.toLowerCase().includes("temperature")) {
      return {
        verdict: "TRUE",
        confidence: 0.94,
        sources: [
          {
            url: "https://climate.nasa.gov",
            title: "NASA Climate Change",
            snippet: "Scientific evidence supports climate change claims",
            reliability: 0.98,
          },
        ],
        explanation: "This claim is supported by multiple credible scientific sources.",
      }
    }

    if (claim.toLowerCase().includes("ai") || claim.toLowerCase().includes("artificial intelligence")) {
      return {
        verdict: "PARTIALLY_TRUE",
        confidence: 0.72,
        sources: [
          {
            url: "https://example.com/ai-research",
            title: "AI Research Study",
            snippet: "Mixed evidence on AI impact predictions",
            reliability: 0.85,
          },
        ],
        explanation: "This claim contains elements of truth but may be oversimplified.",
      }
    }

    return {
      verdict: "UNVERIFIED",
      confidence: 0.45,
      sources: [],
      explanation: "Insufficient reliable sources found to verify this claim.",
    }
  }

  async saveFactCheck(podcastId: string, result: FactCheckResult) {
    return await db.createFactCheck({
      podcastId,
      claim: result.claim,
      verdict: result.verdict,
      confidence: result.confidence,
      sources: result.sources.map((s) => s.url),
    })
  }

  async getFactCheckHistory(podcastId: string) {
    return await db.getFactChecks(podcastId)
  }
}

export const factCheckService = new FactCheckService()
export default factCheckService
