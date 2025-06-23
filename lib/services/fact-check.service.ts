import { db } from "./database.service"

export interface FactCheckResult {
  claim: string
  verdict: "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "UNVERIFIED" | "MISLEADING"
  confidence: number
  explanation: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
}

class FactCheckService {
  async factCheckClaim(claim: string): Promise<FactCheckResult> {
    const verdicts: FactCheckResult["verdict"][] = ["TRUE", "FALSE", "PARTIALLY_TRUE", "UNVERIFIED", "MISLEADING"]
    const randomVerdict = verdicts[Math.floor(Math.random() * verdicts.length)]
    const randomConfidence = Math.random() * 0.4 + 0.6

    const mockSources = [
      {
        title: "Reuters Fact Check",
        url: "https://reuters.com/fact-check",
        snippet: "Professional fact-checking analysis of similar claims.",
      },
      {
        title: "Associated Press",
        url: "https://apnews.com",
        snippet: "Comprehensive reporting on related topics.",
      },
    ]

    return {
      claim,
      verdict: randomVerdict,
      confidence: randomConfidence,
      explanation: `Analysis of claim: "${claim}". ${this.getVerdictExplanation(randomVerdict)}`,
      sources: mockSources,
    }
  }

  async processTranscript(podcastId: string, transcript: string): Promise<FactCheckResult[]> {
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    const claims = sentences.slice(0, 3)

    const results: FactCheckResult[] = []

    for (const claim of claims) {
      const result = await this.factCheckClaim(claim.trim())
      results.push(result)

      await db.createFactCheck({
        podcastId,
        claim: result.claim,
        verdict: result.verdict,
        confidence: result.confidence,
      })
    }

    return results
  }

  private getVerdictExplanation(verdict: FactCheckResult["verdict"]): string {
    switch (verdict) {
      case "TRUE":
        return "This claim appears to be accurate based on available sources."
      case "FALSE":
        return "This claim appears to be false or misleading."
      case "PARTIALLY_TRUE":
        return "This claim has some truth but is incomplete."
      case "MISLEADING":
        return "This claim is technically true but presented misleadingly."
      case "UNVERIFIED":
      default:
        return "This claim requires further verification."
    }
  }
}

export const factCheckService = new FactCheckService()
