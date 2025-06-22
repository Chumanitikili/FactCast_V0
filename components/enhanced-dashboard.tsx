"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Upload,
  Play,
  BarChart3,
  Globe,
  Calendar,
} from "lucide-react"

interface DashboardStats {
  overview: {
    totalPodcasts: number
    totalFactChecks: number
    avgConfidence: number
    avgProcessingTime: number
    monthlyUsage: number
    planLimit: number
  }
  verdictBreakdown: {
    verified: number
    false: number
    disputed: number
    uncertain: number
    partial: number
  }
  dailyStats: Array<{
    date: string
    factChecks: number
    verified: number
    falseClaims: number
  }>
  usage: {
    totalMinutesProcessed: number
    totalPodcasts: number
    completedPodcasts: number
    failedPodcasts: number
  }
  topSources: Array<{
    domain: string
    sourceType: string
    usageCount: number
    avgReliability: number
  }>
}

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/stats?days=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-zinc-800 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Unable to load dashboard</h2>
            <Button onClick={fetchStats}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const verdictColors = {
    verified: "#10b981",
    false: "#ef4444",
    disputed: "#f59e0b",
    uncertain: "#6b7280",
    partial: "#8b5cf6",
  }

  const pieData = Object.entries(stats.verdictBreakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: verdictColors[key as keyof typeof verdictColors],
  }))

  const usagePercentage =
    stats.overview.planLimit === -1 ? 0 : (stats.overview.monthlyUsage / stats.overview.planLimit) * 100

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">TruthCast Dashboard</h1>
            <p className="text-zinc-400">Real-time insights into your fact-checking activity</p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
              <Upload className="h-4 w-4 mr-2" />
              Upload Podcast
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Total Fact-Checks</p>
                  <p className="text-3xl font-bold">{stats.overview.totalFactChecks.toLocaleString()}</p>
                </div>
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Avg Confidence</p>
                  <p className="text-3xl font-bold">{stats.overview.avgConfidence}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Avg Processing</p>
                  <p className="text-3xl font-bold">{(stats.overview.avgProcessingTime / 1000).toFixed(1)}s</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Monthly Usage</p>
                  <p className="text-3xl font-bold">{stats.overview.monthlyUsage}</p>
                  <p className="text-xs text-zinc-500">
                    {stats.overview.planLimit === -1 ? "Unlimited" : `/ ${stats.overview.planLimit} min`}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-purple-500" />
              </div>
              {stats.overview.planLimit !== -1 && (
                <div className="mt-4">
                  <Progress value={usagePercentage} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="sources" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
              <Globe className="h-4 w-4 mr-2" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
              <Calendar className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Verdict Breakdown */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Fact-Check Verdicts</CardTitle>
                  <CardDescription>Distribution of verification results</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Daily Activity */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Daily Activity</CardTitle>
                  <CardDescription>Fact-checks over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="factChecks"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Total Fact-Checks"
                      />
                      <Line type="monotone" dataKey="verified" stroke="#3b82f6" strokeWidth={2} name="Verified" />
                      <Line
                        type="monotone"
                        dataKey="falseClaims"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="False Claims"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Usage Statistics */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Processing and upload metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-lg mx-auto mb-3">
                      <Play className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.usage.totalMinutesProcessed}</p>
                    <p className="text-sm text-zinc-400">Minutes Processed</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg mx-auto mb-3">
                      <Upload className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.usage.totalPodcasts}</p>
                    <p className="text-sm text-zinc-400">Total Uploads</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.usage.completedPodcasts}</p>
                    <p className="text-sm text-zinc-400">Completed</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-lg mx-auto mb-3">
                      <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.usage.failedPodcasts}</p>
                    <p className="text-sm text-zinc-400">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Top Sources</CardTitle>
                <CardDescription>Most frequently used sources for fact-checking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topSources.map((source, index) => (
                    <div
                      key={source.domain}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-emerald-500">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{source.domain}</p>
                          <p className="text-sm text-zinc-400 capitalize">{source.sourceType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{source.usageCount} uses</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {source.avgReliability}% reliable
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest fact-checking activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.dailyStats.slice(0, 7).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-zinc-400">{day.factChecks} fact-checks performed</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-500">{day.verified}</p>
                          <p className="text-xs text-zinc-400">Verified</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-red-500">{day.falseClaims}</p>
                          <p className="text-xs text-zinc-400">False</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
