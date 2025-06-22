// Direct environment variable access
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface AIFactCheckResponse {
  verdict: "verified" | "false" | "uncertain" | "partial" | "disputed"
  confidence: number
  summary?: string
  perspectives: Array<{
    sourceId: string
    stance: "supports" | "disputes" | "neutral" | "mixed"
    explanation: string
    relevanceScore: number
    excerpt: string
  }>
}

class AIService {
  async factCheckClaim(params: {
    claim: string
    sources: any[]
    context?: string
  }): Promise<AIFactCheckResponse> {
    // Mock implementation for now
    const mockVerdict = this.getMockVerdict(params.claim)
    const mockConfidence = Math.floor(Math.random() * 40) + 60 // 60-100

    return {
      verdict: mockVerdict,
      confidence: mockConfidence,
      summary: `Analysis of claim: "${params.claim}". Based on available sources, this claim appears to be ${mockVerdict}.`,
      perspectives: params.sources.map((source, index) => ({
        sourceId: source.id,
        stance: index % 2 === 0 ? "supports" : "neutral",
        explanation: `Analysis from ${source.title}`,
        relevanceScore: Math.floor(Math.random() * 30) + 70,
        excerpt: `Relevant information from ${source.domain}`,
      })),
    }
  }

  async generateSummary(claim: string, verdict: string, confidence: number, sources: any[]): Promise<string> {
    return `The claim "${claim}" has been assessed as ${verdict} with ${confidence}% confidence based on ${sources.length} sources.`
  }

  async extractClaims(text: string): Promise<string[]> {
    // Simple extraction - split by sentences and filter meaningful ones
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 200)

    return sentences.slice(0, 5) // Return up to 5 claims
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // Mock transcription - in production, use OpenAI Whisper
    return "Mock transcription: This is a sample transcription of the audio content."
  }

  private getMockVerdict(claim: string): "verified" | "false" | "uncertain" | "partial" | "disputed" {
    const lowerClaim = claim.toLowerCase()

    if (lowerClaim.includes("false") || lowerClaim.includes("fake") || lowerClaim.includes("hoax")) {
      return "false"
    }
    if (lowerClaim.includes("true") || lowerClaim.includes("fact") || lowerClaim.includes("confirmed")) {
      return "verified"
    }
    if (lowerClaim.includes("partial") || lowerClaim.includes("some")) {
      return "partial"
    }
    if (lowerClaim.includes("disputed") || lowerClaim.includes("controversial")) {
      return "disputed"
    }

    return "uncertain"
  }
}

export const aiService = new AIService()
export default aiService
