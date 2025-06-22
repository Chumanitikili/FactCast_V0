import OpenAI from "openai"
import { config } from "@/lib/config/production"
import { db } from "./database.service"

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
})

export interface FactCheckResult {
  claim: string
  verdict: "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "UNVERIFIED" | "MISLEADING"
  confidenceScore: number
  sources: Array<{
    title: string
    url: string
    snippet: string
    credibility: number
  }>
  explanation: string
  context?: string
  severity: "low" | "medium" | "high"
}

export interface ClaimExtraction {
  claims: Array<{
    text: string
    timestamp: number
    context: string
    importance: number
  }>
  summary: string
}

class FactCheckService {
  private static instance: FactCheckService

  static getInstance(): FactCheckService {
    if (!FactCheckService.instance) {
      FactCheckService.instance = new FactCheckService()
    }
    return FactCheckService.instance
  }

  async extractClaims(transcript: string): Promise<ClaimExtraction> {
    try {
      const prompt = `
        Analyze the following podcast transcript and extract factual claims that can be verified.
        Focus on statements about:
        - Statistics, numbers, and data
        - Historical events and dates
        - Scientific facts and research findings
        - Current events and news
        - Quotes and attributions
        - Policy claims and legal statements

        For each claim, provide:
        1. The exact text of the claim
        2. Estimated timestamp (if available)
        3. Context around the claim
        4. Importance score (1-10, where 10 is most important to verify)

        Transcript:
        ${transcript}

        Respond in JSON format:
        {
          "claims": [
            {
              "text": "exact claim text",
              "timestamp": 0,
              "context": "surrounding context",
              "importance": 8
            }
          ],
          "summary": "Brief summary of main topics discussed"
        }
      `

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No response from OpenAI")
      }

      return JSON.parse(content)
    } catch (error) {
      console.error("Error extracting claims:", error)
      throw new Error("Failed to extract claims from transcript")
    }
  }

  async factCheckClaim(claim: string, context?: string): Promise<FactCheckResult> {
    try {
      // First, search for relevant sources
      const sources = await this.searchSources(claim)

      // Then, analyze the claim with AI
      const prompt = `
        As a professional fact-checker, analyze this claim and provide a comprehensive fact-check.

        Claim: "${claim}"
        ${context ? `Context: "${context}"` : ""}

        Available sources:
        ${sources.map((source, i) => `${i + 1}. ${source.title}\n   ${source.snippet}\n   URL: ${source.url}`).join("\n\n")}

        Provide your analysis in JSON format:
        {
          "verdict": "TRUE|FALSE|PARTIALLY_TRUE|UNVERIFIED|MISLEADING",
          "confidenceScore": 0.85,
          "explanation": "Detailed explanation of your reasoning",
          "severity": "low|medium|high",
          "keyPoints": ["point 1", "point 2"],
          "sourcesUsed": [0, 1, 2]
        }

        Guidelines:
        - TRUE: Claim is accurate and well-supported
        - FALSE: Claim is demonstrably incorrect
        - PARTIALLY_TRUE: Claim has some truth but is incomplete or misleading
        - UNVERIFIED: Cannot be verified with available sources
        - MISLEADING: Technically true but presented in a misleading way

        Confidence score should reflect how certain you are (0.0 to 1.0).
        Severity indicates potential harm: low (minor inaccuracy), medium (significant misinformation), high (dangerous misinformation).
      `

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No response from OpenAI")
      }

      const analysis = JSON.parse(content)

      // Filter sources used in the analysis
      const usedSources = analysis.sourcesUsed?.map((index: number) => sources[index]).filter(Boolean) || []

      return {
        claim,
        verdict: analysis.verdict,
        confidenceScore: analysis.confidenceScore,
        sources: usedSources,
        explanation: analysis.explanation,
        context,
        severity: analysis.severity,
      }
    } catch (error) {
      console.error("Error fact-checking claim:", error)

      // Return a fallback result
      return {
        claim,
        verdict: "UNVERIFIED",
        confidenceScore: 0.0,
        sources: [],
        explanation: "Unable to fact-check this claim due to technical issues.",
        context,
        severity: "low",
      }
    }
  }

  private async searchSources(query: string): Promise<
    Array<{
      title: string
      url: string
      snippet: string
      credibility: number
    }>
  > {
    // This is a simplified implementation
    // In production, you would integrate with multiple news APIs, fact-checking databases, etc.

    const sources = [
      {
        title: "Reuters Fact Check",
        url: "https://reuters.com/fact-check",
        snippet: "Professional fact-checking from Reuters news agency.",
        credibility: 0.95,
      },
      {
        title: "Associated Press Fact Check",
        url: "https://apnews.com/hub/ap-fact-check",
        snippet: "Comprehensive fact-checking from Associated Press.",
        credibility: 0.95,
      },
      {
        title: "Snopes",
        url: "https://snopes.com",
        snippet: "Independent fact-checking organization.",
        credibility: 0.85,
      },
    ]

    // In a real implementation, you would:
    // 1. Search multiple APIs (News API, Google Custom Search, etc.)
    // 2. Filter by credibility and relevance
    // 3. Extract relevant snippets
    // 4. Rank sources by reliability

    return sources
  }

  async processTranscript(podcastId: string, transcript: string): Promise<FactCheckResult[]> {
    try {
      // Extract claims from transcript
      const extraction = await this.extractClaims(transcript)

      // Fact-check each important claim
      const results: FactCheckResult[] = []

      for (const claim of extraction.claims) {
        if (claim.importance >= 6) {
          // Only check important claims
          const result = await this.factCheckClaim(claim.text, claim.context)
          results.push(result)

          // Store result in database
          await db.createFactCheckResult({
            podcastId,
            claim: result.claim,
            verdict: result.verdict,
            confidenceScore: result.confidenceScore,
            sources: result.sources,
            explanation: result.explanation,
            timestampStart: claim.timestamp,
            timestampEnd: claim.timestamp + 30, // Assume 30 second duration
          })
        }
      }

      return results
    } catch (error) {
      console.error("Error processing transcript:", error)
      throw error
    }
  }

  async getFactCheckHistory(userId: string): Promise<any[]> {
    const podcasts = await db.getPodcastsByUserId(userId)
    const results = []

    for (const podcast of podcasts) {
      const factChecks = await db.getFactCheckResultsByPodcastId(podcast.id)
      results.push({
        podcast,
        factChecks,
      })
    }

    return results
  }
}

export const factCheckService = FactCheckService.getInstance()
export default FactCheckService
