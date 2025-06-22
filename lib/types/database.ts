export interface User {
  id: string
  email: string
  name: string
  plan: string
  monthly_usage: number
  is_active: boolean
  email_verified: boolean
  created_at: Date
  last_login?: Date
}

export interface Podcast {
  id: string
  user_id: string
  title: string
  description?: string
  audio_url: string
  audio_size?: number
  duration: number
  status: string
  error_message?: string
  created_at: Date
  updated_at: Date
}

export interface LiveSession {
  id: string
  user_id: string
  title: string
  settings: any
  status: string
  created_at: Date
  updated_at: Date
}

export interface TranscriptSegment {
  id: string
  session_id?: string
  podcast_id?: string
  timestamp_ms: number
  text: string
  confidence: number
  speaker?: string
  is_processed: boolean
  created_at: string
}

export interface Source {
  id: string
  title: string
  url: string
  domain: string
  source_type: string
  political_lean?: string
  reliability_score: number
  is_active: boolean
  last_verified?: Date
  created_at: Date
}

export interface FactCheckResult {
  id: string
  session_id?: string
  podcast_id?: string
  segment_id?: string
  claim: string
  verdict: string
  confidence: number
  ai_summary?: string
  processing_time_ms?: number
  is_flagged: boolean
  created_at: Date
}

export interface Perspective {
  id: string
  fact_check_id: string
  source_id: string
  stance: string
  explanation: string
  relevance_score: number
  excerpt?: string
}

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  name: string
  permissions: string[]
  is_active: boolean
  last_used?: string
  expires_at?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface PerformanceMetric {
  id: string
  endpoint: string
  method: string
  response_time_ms: number
  status_code: number
  user_id?: string
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  event_name: string
  user_id?: string
  properties: any
  timestamp: string
  created_at: string
}
