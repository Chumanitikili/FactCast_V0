"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  CheckCircle,
  XCircle,
  Zap,
  Upload,
  Play,
  BarChart3,
  FileAudio,
  Activity,
  Download,
  Trash2,
  Eye,
  Plus,
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

interface Podcast {
  id: string
  title: string
  description?: string
  duration: number
  status: string
  created_at: string
  factCheckCount: number
  flaggedCount: number
}

export default function ComprehensiveDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [timeRange, setTimeRange] = useState("30")
  const [activeTab, setActiveTab] = useState("overview")

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    audioFile: null as File | null,
    autoFactCheck: true,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch stats and podcasts in parallel
      const [statsResponse, podcastsResponse] = await Promise.all([
        fetch(`/api/dashboard/stats?days=${timeRange}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
        fetch("/api/podcasts", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (podcastsResponse.ok) {
        const podcastsData = await podcastsResponse.json()
        setPodcasts(podcastsData.podcasts || [])
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadForm.title || !uploadForm.audioFile) {
      alert("Please provide a title and select an audio file")
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("title", uploadForm.title)
      formData.append("description", uploadForm.description)
      formData.append("audioFile", uploadForm.audioFile)
      formData.append("autoFactCheck", uploadForm.autoFactCheck.toString())

      const response = await fetch("/api/podcasts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        alert("Podcast uploaded successfully! Processing will begin shortly.")

        // Reset form
        setUploadForm({
          title: "",
          description: "",
          audioFile: null,
          autoFactCheck: true,
        })

        // Refresh data
        fetchDashboardData()
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePodcast = async (podcastId: string) => {
    if (!confirm("Are you sure you want to delete this podcast?")) {
      return
    }

    try {
      const response = await fetch(`/api/podcasts/${podcastId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      if (response.ok) {
        alert("Podcast deleted successfully")
        fetchDashboardData()
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Delete failed. Please try again.")
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

  const verdictColors = {
    verified: "#10b981",
    false: "#ef4444",
    disputed: "#f59e0b",
    uncertain: "#6b7280",
    partial: "#8b5cf6",
  }

  const pieData = stats
    ? Object.entries(stats.verdictBreakdown).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        color: verdictColors[key as keyof typeof verdictColors],
      }))
    : []

  const usagePercentage = stats
    ? stats.overview.planLimit === -1
      ? 0
      : (stats.overview.monthlyUsage / stats.overview.planLimit) * 100
    : 0

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              TruthCast Dashboard
            </h1>
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

            <Button onClick={() => setActiveTab("upload")} className="bg-emerald-500 hover:bg-emerald-600 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Upload Podcast
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        {stats && (
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
                    <p className="text-sm font-medium text-zinc-400">Total Podcasts</p>
                    <p className="text-3xl font-bold">{stats.overview.totalPodcasts}</p>
                  </div>
                  <FileAudio className="h-8 w-8 text-purple-500" />
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
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
                {stats.overview.planLimit !== -1 && (
                  <div className="mt-4">
                    <Progress value={usagePercentage} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
              <FileAudio className="h-4 w-4 mr-2" />
              Podcasts
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
            >
              <Activity className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {stats && (
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
            )}
          </TabsContent>

          <TabsContent value="podcasts" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Your Podcasts</CardTitle>
                <CardDescription>Manage and view your uploaded podcasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {podcasts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileAudio className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No podcasts yet</h3>
                      <p className="text-zinc-400 mb-4">Upload your first podcast to get started with fact-checking</p>
                      <Button onClick={() => setActiveTab("upload")} className="bg-emerald-500 hover:bg-emerald-600">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Podcast
                      </Button>
                    </div>
                  ) : (
                    podcasts.map((podcast) => (
                      <div key={podcast.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <FileAudio className="h-6 w-6 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="font-medium">{podcast.title}</h3>
                            <p className="text-sm text-zinc-400">
                              {Math.floor(podcast.duration / 60)}:{(podcast.duration % 60).toString().padStart(2, "0")}{" "}
                              • {new Date(podcast.created_at).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={podcast.status === "completed" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {podcast.status}
                              </Badge>
                              {podcast.factCheckCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {podcast.factCheckCount} fact-checks
                                </Badge>
                              )}
                              {podcast.flaggedCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {podcast.flaggedCount} flagged
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePodcast(podcast.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Upload New Podcast</CardTitle>
                <CardDescription>Upload an audio file to start fact-checking</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Podcast Title</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="Enter podcast title"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Enter podcast description"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audioFile">Audio File</Label>
                    <Input
                      id="audioFile"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setUploadForm({ ...uploadForm, audioFile: e.target.files?.[0] || null })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <p className="text-xs text-zinc-500">
                      Supported formats: MP3, WAV, MP4, WebM, OGG. Max size: 500MB
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoFactCheck"
                      checked={uploadForm.autoFactCheck}
                      onCheckedChange={(checked) => setUploadForm({ ...uploadForm, autoFactCheck: checked })}
                    />
                    <Label htmlFor="autoFactCheck">Enable automatic fact-checking</Label>
                  </div>

                  <Button type="submit" disabled={uploading} className="w-full bg-emerald-500 hover:bg-emerald-600">
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Podcast
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {stats && (
              <>
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

                {/* Top Sources */}
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
