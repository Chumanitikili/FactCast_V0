"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Mic, Play, Square, Send, AlertTriangle, CheckCircle, XCircle, Clock, Volume2 } from "lucide-react"

interface FactCheckResult {
  id: string
  claim: string
  verdict: "verified" | "false" | "uncertain" | "partial" | "disputed"
  confidence: number
  summary: string
  timestamp: number
  isFlagged: boolean
}

interface TranscriptSegment {
  id: string
  text: string
  timestamp: number
  speaker?: string
  confidence: number
}

export default function LiveFactChecker() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [factChecks, setFactChecks] = useState<FactCheckResult[]>([])
  const [manualClaim, setManualClaim] = useState("")
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    totalClaims: 0,
    flaggedClaims: 0,
    avgConfidence: 0,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const sessionStartTimeRef = useRef<number>(0)

  useEffect(() => {
    // Update session stats
    const flaggedCount = factChecks.filter((fc) => fc.isFlagged).length
    const avgConfidence =
      factChecks.length > 0 ? factChecks.reduce((sum, fc) => sum + fc.confidence, 0) / factChecks.length : 0

    setSessionStats({
      duration: sessionId ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000) : 0,
      totalClaims: factChecks.length,
      flaggedClaims: flaggedCount,
      avgConfidence: Math.round(avgConfidence),
    })
  }, [factChecks, sessionId])

  const startSession = async () => {
    try {
      // Create new session
      const response = await fetch("/api/live-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          title: `Live Session ${new Date().toLocaleString()}`,
          settings: {
            autoFactCheck: true,
            confidenceThreshold: 70,
          },
        }),
      })

      if (response.ok) {
        const session = await response.json()
        setSessionId(session.sessionId)
        sessionStartTimeRef.current = Date.now()

        // Start audio recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
          processAudioChunk(audioBlob)
          audioChunksRef.current = []
        }

        mediaRecorder.start(5000) // Record in 5-second chunks
        setIsRecording(true)
      }
    } catch (error) {
      console.error("Failed to start session:", error)
      alert("Failed to start live session. Please check microphone permissions.")
    }
  }

  const stopSession = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    }

    if (sessionId) {
      // End session
      await fetch(`/api/live-sessions/${sessionId}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setSessionId(null)
    }
  }

  const processAudioChunk = async (audioBlob: Blob) => {
    if (!sessionId) return

    try {
      setIsProcessing(true)

      // Mock transcription - in production, send to speech-to-text service
      const mockTranscript = [
        "According to recent studies, renewable energy costs have decreased by 70% over the past decade.",
        "The World Health Organization reports that air pollution causes 7 million deaths annually.",
        "Climate scientists agree that we need to reduce carbon emissions by 45% by 2030.",
      ]

      const randomText = mockTranscript[Math.floor(Math.random() * mockTranscript.length)]

      // Add to transcript
      const newSegment: TranscriptSegment = {
        id: `segment_${Date.now()}`,
        text: randomText,
        timestamp: Date.now() - sessionStartTimeRef.current,
        confidence: 0.9 + Math.random() * 0.1,
      }

      setTranscript((prev) => [...prev, newSegment])

      // Auto fact-check if the segment contains potential claims
      if (randomText.length > 50) {
        await processFactCheck(randomText)
      }
    } catch (error) {
      console.error("Audio processing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const processFactCheck = async (claim: string) => {
    try {
      const response = await fetch("/api/fact-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          claim,
          sessionId,
          context: "Live session",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const factCheck: FactCheckResult = {
          id: result.result.id,
          claim: result.result.claim,
          verdict: result.result.verdict,
          confidence: result.result.confidence,
          summary: result.result.summary,
          timestamp: Date.now() - sessionStartTimeRef.current,
          isFlagged: result.result.isFlagged,
        }

        setFactChecks((prev) => [factCheck, ...prev])
      }
    } catch (error) {
      console.error("Fact-check error:", error)
    }
  }

  const handleManualFactCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualClaim.trim()) return

    await processFactCheck(manualClaim)
    setManualClaim("")
  }

  const getVerdictColor = (verdict: string) => {
    const colors = {
      verified: "text-green-500",
      false: "text-red-500",
      disputed: "text-yellow-500",
      uncertain: "text-gray-500",
      partial: "text-purple-500",
    }
    return colors[verdict] || "text-gray-500"
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "false":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Live Fact-Checker
            </h1>
            <p className="text-zinc-400">Real-time fact-checking for live audio streams</p>
          </div>

          <div className="flex items-center gap-4">
            {!isRecording ? (
              <Button onClick={startSession} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            ) : (
              <Button onClick={stopSession} className="bg-red-500 hover:bg-red-600 text-white">
                <Square className="h-4 w-4 mr-2" />
                Stop Session
              </Button>
            )}
          </div>
        </div>

        {/* Session Stats */}
        {sessionId && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Session Duration</p>
                    <p className="text-2xl font-bold">
                      {Math.floor(sessionStats.duration / 60)}:
                      {(sessionStats.duration % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Total Claims</p>
                    <p className="text-2xl font-bold">{sessionStats.totalClaims}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Flagged Claims</p>
                    <p className="text-2xl font-bold">{sessionStats.flaggedClaims}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Avg Confidence</p>
                    <p className="text-2xl font-bold">{sessionStats.avgConfidence}%</p>
                  </div>
                  <Volume2 className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Transcript */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isRecording ? (
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-500 rounded-full" />
                    )}
                    Live Transcript
                  </CardTitle>
                  <CardDescription>Real-time speech-to-text transcription</CardDescription>
                </div>
                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                    Processing...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {transcript.length === 0 ? (
                    <div className="text-center py-12">
                      <Mic className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                      <p className="text-zinc-400">
                        {isRecording ? "Listening for speech..." : "Start a session to begin transcription"}
                      </p>
                    </div>
                  ) : (
                    transcript.map((segment) => (
                      <div key={segment.id} className="p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-zinc-500">{Math.floor(segment.timestamp / 1000)}s</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(segment.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm">{segment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              {/* Manual Fact-Check Input */}
              <form onSubmit={handleManualFactCheck} className="flex gap-2">
                <Input
                  value={manualClaim}
                  onChange={(e) => setManualClaim(e.target.value)}
                  placeholder="Enter a claim to fact-check manually..."
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button type="submit" size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Fact-Check Results */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Fact-Check Results</CardTitle>
              <CardDescription>Real-time verification of claims</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {factChecks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                      <p className="text-zinc-400">No fact-checks yet</p>
                      <p className="text-sm text-zinc-500">Claims will appear here as they are detected</p>
                    </div>
                  ) : (
                    factChecks.map((factCheck) => (
                      <div
                        key={factCheck.id}
                        className={`p-4 rounded-lg border ${
                          factCheck.isFlagged ? "border-red-500/50 bg-red-500/5" : "border-zinc-700 bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getVerdictIcon(factCheck.verdict)}
                            <Badge
                              variant={factCheck.isFlagged ? "destructive" : "default"}
                              className={`text-xs ${getVerdictColor(factCheck.verdict)}`}
                            >
                              {factCheck.verdict.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-zinc-500">{factCheck.confidence}% confidence</span>
                          </div>
                          <span className="text-xs text-zinc-500">{Math.floor(factCheck.timestamp / 1000)}s</span>
                        </div>
                        <p className="text-sm mb-2 font-medium">{factCheck.claim}</p>
                        <p className="text-xs text-zinc-400">{factCheck.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
