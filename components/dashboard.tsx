"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, CheckCircle, AlertTriangle, BarChart3, TrendingUp, Clock, Shield, Mic, FileAudio } from "lucide-react"

interface Podcast {
  id: string
  title: string
  status: string
  factCheckCount: number
  flaggedCount: number
  confidence: number
  duration: string
  createdAt: string
}

interface FactCheck {
  id: string
  claim: string
  verdict: "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "UNVERIFIED" | "MISLEADING"
  confidence: number
  sources: number
  timestamp: string
}

export default function Dashboard() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [recentFactChecks, setRecentFactChecks] = useState<FactCheck[]>([])
  const [stats, setStats] = useState({
    totalPodcasts: 0,
    totalFactChecks: 0,
    avgConfidence: 0,
    thisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const mockPodcasts: Podcast[] = [
        {
          id: "1",
          title: "Climate Change: The Latest Science",
          status: "completed",
          factCheckCount: 12,
          flaggedCount: 2,
          confidence: 0.89,
          duration: "45:32",
          createdAt: "2024-01-15T10:30:00Z",
        },
        {
          id: "2",
          title: "Tech Industry Trends 2024",
          status: "processing",
          factCheckCount: 0,
          flaggedCount: 0,
          confidence: 0,
          duration: "32:18",
          createdAt: "2024-01-14T14:20:00Z",
        },
      ]

      const mockFactChecks: FactCheck[] = [
        {
          id: "1",
          claim: "Global temperatures have risen by 1.1°C since pre-industrial times",
          verdict: "TRUE",
          confidence: 0.96,
          sources: 3,
          timestamp: "2024-01-15T10:35:00Z",
        },
        {
          id: "2",
          claim: "AI will replace 50% of jobs by 2030",
          verdict: "MISLEADING",
          confidence: 0.73,
          sources: 4,
          timestamp: "2024-01-14T14:25:00Z",
        },
      ]

      const mockStats = {
        totalPodcasts: 24,
        totalFactChecks: 156,
        avgConfidence: 0.87,
        thisMonth: 8,
      }

      setPodcasts(mockPodcasts)
      setRecentFactChecks(mockFactChecks)
      setStats(mockStats)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "TRUE":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "FALSE":
        return "text-red-600 bg-red-50 border-red-200"
      case "PARTIALLY_TRUE":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "MISLEADING":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "UNVERIFIED":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const title = prompt("Enter podcast title:")
    if (!title) return

    try {
      const newPodcast: Podcast = {
        id: Date.now().toString(),
        title,
        status: "processing",
        factCheckCount: 0,
        flaggedCount: 0,
        confidence: 0,
        duration: "00:00",
        createdAt: new Date().toISOString(),
      }

      setPodcasts((prev) => [newPodcast, ...prev])

      setTimeout(() => {
        setPodcasts((prev) =>
          prev.map((p) =>
            p.id === newPodcast.id
              ? { ...p, status: "completed", factCheckCount: 7, confidence: 0.88, duration: "28:45" }
              : p,
          ),
        )
      }, 3000)
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-emerald-600" />
                <span className="text-2xl font-bold text-slate-900">TruthCast</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Mic className="w-4 h-4 mr-2" />
                Start Live Session
              </Button>
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="audio-upload" />
              <label htmlFor="audio-upload">
                <Button className="cursor-pointer bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Podcast
                </Button>
              </label>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Sarah!</h1>
          <p className="text-slate-600">Here is what is happening with your podcast fact-checking.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Podcasts</CardTitle>
              <FileAudio className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalPodcasts}</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />+{stats.thisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Fact Checks</CardTitle>
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalFactChecks}</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +23 this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Confidence</CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{Math.round(stats.avgConfidence * 100)}%</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Processing Time</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">2.3s</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                15% faster
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="podcasts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="podcasts">Recent Podcasts</TabsTrigger>
            <TabsTrigger value="factchecks">Fact Checks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="podcasts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileAudio className="w-5 h-5 mr-2" />
                  Recent Podcasts
                </CardTitle>
                <CardDescription>Your latest podcast uploads and their fact-check status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {podcasts.map((podcast) => (
                    <div
                      key={podcast.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{podcast.title}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge
                            variant={podcast.status === "completed" ? "default" : "secondary"}
                            className={podcast.status === "completed" ? "bg-emerald-100 text-emerald-800" : ""}
                          >
                            {podcast.status}
                          </Badge>
                          <span className="text-sm text-slate-600">{podcast.duration}</span>
                          <span className="text-sm text-slate-600">{podcast.factCheckCount} fact checks</span>
                          {podcast.confidence > 0 && (
                            <span className="text-sm text-slate-600">
                              {Math.round(podcast.confidence * 100)}% confidence
                            </span>
                          )}
                          {podcast.flaggedCount > 0 && (
                            <div className="flex items-center text-amber-600">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              <span className="text-sm">{podcast.flaggedCount} flagged</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {podcast.status === "processing" && (
                          <div className="flex items-center space-x-2">
                            <Progress value={65} className="w-20" />
                            <span className="text-sm text-slate-600">65%</span>
                          </div>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factchecks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Recent Fact Checks
                </CardTitle>
                <CardDescription>Latest claims verified by TruthCast AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentFactChecks.map((factCheck) => (
                    <div key={factCheck.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={getVerdictColor(factCheck.verdict)}>
                          {factCheck.verdict.replace("_", " ")}
                        </Badge>
                        <div className="text-sm text-slate-500">
                          {Math.round(factCheck.confidence * 100)}% confidence
                        </div>
                      </div>
                      <p className="text-slate-900 mb-3">{factCheck.claim}</p>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>{factCheck.sources} sources verified</span>
                        <span>{new Date(factCheck.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fact-Check Accuracy Trends</CardTitle>
                  <CardDescription>Your fact-checking confidence over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600">Analytics chart would appear here</p>
                      <p className="text-sm text-slate-500">Showing confidence trends over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verdict Distribution</CardTitle>
                  <CardDescription>Breakdown of fact-check results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                        <span className="text-sm">True</span>
                      </div>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-sm">Partially True</span>
                      </div>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-sm">Misleading</span>
                      </div>
                      <span className="text-sm font-medium">8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm">False</span>
                      </div>
                      <span className="text-sm font-medium">4%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                        <span className="text-sm">Unverified</span>
                      </div>
                      <span className="text-sm font-medium">2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
