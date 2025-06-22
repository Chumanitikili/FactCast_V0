import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getSecurityHeaders } from "@/lib/auth/security"
import { db } from "@/lib/services/database.service"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401, headers: getSecurityHeaders() })
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Get user's podcasts
    const podcasts = await db.findPodcastsByUserId(user.id)

    // Get fact-check statistics
    const factCheckStats = await db.query(
      `
      SELECT 
        COUNT(*) as total_fact_checks,
        COUNT(CASE WHEN verdict = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN verdict = 'false' THEN 1 END) as false_count,
        COUNT(CASE WHEN verdict = 'disputed' THEN 1 END) as disputed_count,
        COUNT(CASE WHEN verdict = 'uncertain' THEN 1 END) as uncertain_count,
        COUNT(CASE WHEN verdict = 'partial' THEN 1 END) as partial_count,
        AVG(confidence) as avg_confidence,
        AVG(processing_time_ms) as avg_processing_time
      FROM fact_check_results fcr
      JOIN podcasts p ON p.id = fcr.podcast_id
      WHERE p.user_id = $1 AND fcr.created_at >= $2
    `,
      [user.id, startDate],
    )

    // Get daily fact-check counts for chart
    const dailyStats = await db.query(
      `
      SELECT 
        DATE(fcr.created_at) as date,
        COUNT(*) as fact_checks,
        COUNT(CASE WHEN verdict = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN verdict = 'false' THEN 1 END) as false_claims
      FROM fact_check_results fcr
      JOIN podcasts p ON p.id = fcr.podcast_id
      WHERE p.user_id = $1 AND fcr.created_at >= $2
      GROUP BY DATE(fcr.created_at)
      ORDER BY date DESC
      LIMIT 30
    `,
      [user.id, startDate],
    )

    // Get usage statistics
    const usageStats = await db.query(
      `
      SELECT 
        SUM(duration) as total_minutes_processed,
        COUNT(*) as total_podcasts,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_podcasts,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_podcasts
      FROM podcasts
      WHERE user_id = $1 AND created_at >= $2
    `,
      [user.id, startDate],
    )

    // Get top sources used
    const topSources = await db.query(
      `
      SELECT 
        s.domain,
        s.source_type,
        COUNT(*) as usage_count,
        AVG(s.reliability_score) as avg_reliability
      FROM perspectives p
      JOIN sources s ON s.id = p.source_id
      JOIN fact_check_results fcr ON fcr.id = p.fact_check_id
      JOIN podcasts pod ON pod.id = fcr.podcast_id
      WHERE pod.user_id = $1 AND fcr.created_at >= $2
      GROUP BY s.domain, s.source_type
      ORDER BY usage_count DESC
      LIMIT 10
    `,
      [user.id, startDate],
    )

    const stats = {
      overview: {
        totalPodcasts: podcasts.length,
        totalFactChecks: Number.parseInt(factCheckStats[0]?.total_fact_checks || "0"),
        avgConfidence: Math.round(Number.parseFloat(factCheckStats[0]?.avg_confidence || "0")),
        avgProcessingTime: Math.round(Number.parseFloat(factCheckStats[0]?.avg_processing_time || "0")),
        monthlyUsage: user.monthly_usage,
        planLimit: getPlanLimit(user.plan),
      },
      verdictBreakdown: {
        verified: Number.parseInt(factCheckStats[0]?.verified_count || "0"),
        false: Number.parseInt(factCheckStats[0]?.false_count || "0"),
        disputed: Number.parseInt(factCheckStats[0]?.disputed_count || "0"),
        uncertain: Number.parseInt(factCheckStats[0]?.uncertain_count || "0"),
        partial: Number.parseInt(factCheckStats[0]?.partial_count || "0"),
      },
      dailyStats: dailyStats.map((stat) => ({
        date: stat.date,
        factChecks: Number.parseInt(stat.fact_checks),
        verified: Number.parseInt(stat.verified),
        falseClaims: Number.parseInt(stat.false_claims),
      })),
      usage: {
        totalMinutesProcessed: Math.round(Number.parseFloat(usageStats[0]?.total_minutes_processed || "0") / 60),
        totalPodcasts: Number.parseInt(usageStats[0]?.total_podcasts || "0"),
        completedPodcasts: Number.parseInt(usageStats[0]?.completed_podcasts || "0"),
        failedPodcasts: Number.parseInt(usageStats[0]?.failed_podcasts || "0"),
      },
      topSources: topSources.map((source) => ({
        domain: source.domain,
        sourceType: source.source_type,
        usageCount: Number.parseInt(source.usage_count),
        avgReliability: Math.round(Number.parseFloat(source.avg_reliability)),
      })),
    }

    return NextResponse.json(stats, { headers: getSecurityHeaders() })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500, headers: getSecurityHeaders() },
    )
  }
}

function getPlanLimit(plan: string): number {
  const limits = {
    free: 30,
    creator: 600,
    professional: 3000,
    enterprise: -1, // unlimited
  }
  return limits[plan] || 30
}
