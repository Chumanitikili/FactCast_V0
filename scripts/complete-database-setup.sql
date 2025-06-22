-- TruthCast Complete Database Setup
-- This script creates all necessary tables, indexes, and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'professional', 'enterprise')),
    monthly_usage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    audio_size BIGINT,
    duration INTEGER NOT NULL, -- in seconds
    status VARCHAR(50) DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Live sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(1000) NOT NULL,
    url TEXT UNIQUE NOT NULL,
    domain VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('news', 'academic', 'government', 'fact_check', 'other')),
    political_lean VARCHAR(50) DEFAULT 'unknown' CHECK (political_lean IN ('left', 'center-left', 'center', 'center-right', 'right', 'unknown')),
    reliability_score INTEGER DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fact check results table
CREATE TABLE IF NOT EXISTS fact_check_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
    segment_id UUID, -- For future transcript segments
    claim TEXT NOT NULL,
    verdict VARCHAR(50) NOT NULL CHECK (verdict IN ('verified', 'false', 'uncertain', 'partial', 'disputed')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    ai_summary TEXT,
    processing_time_ms INTEGER,
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Perspectives table (sources' stances on claims)
CREATE TABLE IF NOT EXISTS perspectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_check_id UUID NOT NULL REFERENCES fact_check_results(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    stance VARCHAR(50) NOT NULL CHECK (stance IN ('supports', 'disputes', 'neutral', 'mixed')),
    explanation TEXT NOT NULL,
    relevance_score DECIMAL(5,2) CHECK (relevance_score >= 0 AND relevance_score <= 100),
    excerpt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transcript segments table
CREATE TABLE IF NOT EXISTS transcript_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL,
    text TEXT NOT NULL,
    confidence DECIMAL(5,2),
    speaker VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_id ON live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sources_domain ON sources(domain);
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active);
CREATE INDEX IF NOT EXISTS idx_fact_check_results_session_id ON fact_check_results(session_id);
CREATE INDEX IF NOT EXISTS idx_fact_check_results_podcast_id ON fact_check_results(podcast_id);
CREATE INDEX IF NOT EXISTS idx_fact_check_results_verdict ON fact_check_results(verdict);
CREATE INDEX IF NOT EXISTS idx_fact_check_results_created_at ON fact_check_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perspectives_fact_check_id ON perspectives(fact_check_id);
CREATE INDEX IF NOT EXISTS idx_perspectives_source_id ON perspectives(source_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_session_id ON transcript_segments(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_podcast_id ON transcript_segments(podcast_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_timestamp ON transcript_segments(timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_podcasts_updated_at ON podcasts;
CREATE TRIGGER update_podcasts_updated_at BEFORE UPDATE ON podcasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON live_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default reliable sources
INSERT INTO sources (title, url, domain, source_type, political_lean, reliability_score) VALUES
('Reuters', 'https://www.reuters.com', 'reuters.com', 'news', 'center', 95),
('Associated Press', 'https://apnews.com', 'apnews.com', 'news', 'center', 94),
('BBC News', 'https://www.bbc.com/news', 'bbc.com', 'news', 'center-left', 92),
('NPR', 'https://www.npr.org', 'npr.org', 'news', 'center-left', 91),
('The Wall Street Journal', 'https://www.wsj.com', 'wsj.com', 'news', 'center-right', 89),
('PolitiFact', 'https://www.politifact.com', 'politifact.com', 'fact_check', 'center', 88),
('FactCheck.org', 'https://www.factcheck.org', 'factcheck.org', 'fact_check', 'center', 92),
('Snopes', 'https://www.snopes.com', 'snopes.com', 'fact_check', 'center', 85),
('CDC', 'https://www.cdc.gov', 'cdc.gov', 'government', 'center', 93),
('FDA', 'https://www.fda.gov', 'fda.gov', 'government', 'center', 91),
('Bureau of Labor Statistics', 'https://www.bls.gov', 'bls.gov', 'government', 'center', 95),
('Congressional Budget Office', 'https://www.cbo.gov', 'cbo.gov', 'government', 'center', 94),
('PubMed/NCBI', 'https://pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'academic', 'center', 98),
('Nature', 'https://www.nature.com', 'nature.com', 'academic', 'center', 97),
('Science Magazine', 'https://www.science.org', 'science.org', 'academic', 'center', 96)
ON CONFLICT (url) DO NOTHING;

-- Create a demo user for testing
INSERT INTO users (email, password_hash, name, plan, email_verified) VALUES
('demo@truthcast.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', 'Demo User', 'professional', true)
ON CONFLICT (email) DO NOTHING;

COMMIT;
