-- Create the url_analyses table for history
CREATE TABLE IF NOT EXISTS url_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL, -- Nullable for anonymous scans
    url_hash TEXT NOT NULL,
    sanitized_display_url TEXT NOT NULL,
    prediction TEXT NOT NULL,
    risk_score NUMERIC NOT NULL,
    confidence NUMERIC NOT NULL,
    model_version TEXT NOT NULL,
    features_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster history lookups
CREATE INDEX IF NOT EXISTS idx_url_analyses_created_at ON url_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url_analyses_user_id ON url_analyses(user_id);

-- Setup Row Level Security (RLS)
ALTER TABLE url_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous scanning)
CREATE POLICY "Allow public inserts" ON url_analyses
    FOR INSERT WITH CHECK (true);

-- Allow users to read only their own history
CREATE POLICY "Allow users to read own history" ON url_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- Allow public to read anonymous history (optional, currently disabled for privacy)
-- CREATE POLICY "Allow public to read anonymous history" ON url_analyses
--    FOR SELECT USING (user_id IS NULL);
