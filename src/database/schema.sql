-- ╔═══════════════════════════════════════════════════════════╗
-- ║          RINDELL MVP - DATABASE SCHEMA                    ║
-- ╚═══════════════════════════════════════════════════════════╝

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    whatsapp_connected BOOLEAN DEFAULT FALSE,
    whatsapp_session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Sessions Table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(50),
    connected BOOLEAN DEFAULT FALSE,
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Document Detections Table (for accuracy metrics)
CREATE TABLE IF NOT EXISTS document_detections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    notes TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    message_id VARCHAR(255),
    chat_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processing_duration INTEGER, -- milliseconds
    error_message TEXT
);

-- Summaries Table
CREATE TABLE IF NOT EXISTS summaries (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT,
    executive_summary TEXT,
    key_points JSONB,
    important_facts JSONB,
    insights TEXT,
    tldr TEXT,
    full_response JSONB,
    sent_to_whatsapp BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processing Metrics Table
CREATE TABLE IF NOT EXISTS processing_metrics (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL, -- download, extraction, ai_processing, response_sent
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration INTEGER, -- milliseconds
    success BOOLEAN,
    error_message TEXT
);

-- System Metrics Table
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL, -- detection_accuracy, processing_time, session_persistence
    metric_value NUMERIC,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_summaries_document_id ON summaries(document_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON system_metrics(recorded_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
