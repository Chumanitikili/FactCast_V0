-- TruthCast Production Database Setup
-- Complete schema with all tables, indexes, and constraints

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Users table with comprehensive fields
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires TIMESTAMP,
    api_key VARCHAR(255) UNIQUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Podcasts table with metadata
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    duration_seconds INTEGER,
    transcript TEXT,
    status VARCHAR(50) DEFAULT 'processing',
    processing_progress INTEGER DEFAULT 0,
    fact_check_status VARCHAR(50) DEFAULT 'pending',
    fact_check_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Fact check results table
CREATE TABLE IF NOT EXISTS fact_check_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    claim TEXT NOT NULL,
    verdict VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    sources JSONB DEFAULT '[]',
    explanation TEXT,
    timestamp_start INTEGER,
    timestamp_end INTEGER,
    context TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Live sessions for real-time fact checking
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    total_claims INTEGER DEFAULT 0,
    verified_claims INTEGER DEFAULT 0,
    flagged_claims INTEGER DEFAULT 0,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Live fact checks for real-time sessions
CREATE TABLE IF NOT EXISTS live_fact_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    claim TEXT NOT NULL,
    verdict VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    sources JSONB DEFAULT '[]',
    explanation TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    audio_segment_url TEXT,
    context TEXT
);

-- User analytics and usage tracking
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size BIGINT,
    response_size BIGINT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fact_check_results_podcast_id ON fact_check_results(podcast_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_id ON live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_fact_checks_session_id ON live_fact_checks(session_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_podcasts_title_search ON podcasts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_podcasts_description_search ON podcasts USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_fact_check_results_claim_search ON fact_check_results USING gin(to_tsvector('english', claim));

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_podcasts_updated_at BEFORE UPDATE ON podcasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, password_hash, first_name, last_name, email_verified) VALUES
('demo@truthcast.com', '$2b$10$example.hash.here', 'Demo', 'User', true)
ON CONFLICT (email) DO NOTHING;

COMMIT;
