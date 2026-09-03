-- ====================================================================================
-- PHISHGUARD AI - FINAL PRODUCTION SUPABASE SCHEMA
-- ====================================================================================
-- This script is fully idempotent. You can safely run it multiple times.
-- It establishes the tables, Row Level Security (RLS) policies, Storage buckets,
-- and RPC functions required for the AI-Based Phishing URL Detection System.
-- ====================================================================================

-- 1. URL ANALYSES TABLE (History)
CREATE TABLE IF NOT EXISTS public.url_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL, -- Nullable to allow anonymous users to perform scans
    url_hash TEXT NOT NULL,
    sanitized_display_url TEXT NOT NULL,
    prediction TEXT NOT NULL,
    risk_score NUMERIC NOT NULL,
    confidence NUMERIC NOT NULL,
    model_version TEXT NOT NULL,
    features_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_url_analyses_created_at ON public.url_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url_analyses_user_id ON public.url_analyses(user_id);

-- Enable RLS on url_analyses
ALTER TABLE public.url_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (including anonymous) to insert scan results
DO $$ BEGIN
    CREATE POLICY "Allow public inserts" ON public.url_analyses FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policy: Allow authenticated users to read ONLY their own history
DO $$ BEGIN
    CREATE POLICY "Allow users to read own history" ON public.url_analyses FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- 2. APPLICATION SETTINGS TABLE (Branding & Budget Persistence)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one settings row exists
    brand_name TEXT NOT NULL DEFAULT 'PhishGuard AI',
    logo_url TEXT,
    theme_identity TEXT NOT NULL DEFAULT 'cyber',
    analysis_budget INT NOT NULL DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the default row if it doesn't exist
INSERT INTO public.app_settings (id, brand_name, theme_identity, analysis_budget)
VALUES (1, 'PhishGuard AI', 'cyber', 100)
ON CONFLICT (id) DO NOTHING;

-- If migrating from an older schema, ensure the analysis_budget column exists
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS analysis_budget INT NOT NULL DEFAULT 100;

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read the branding and budget settings
DO $$ BEGIN
    CREATE POLICY "Allow public read branding" ON public.app_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policy: Allow ONLY authenticated users to update settings (Admins)
DO $$ BEGIN
    CREATE POLICY "Allow authenticated update branding" ON public.app_settings FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- 3. BRAND ASSETS STORAGE BUCKET (Logo Uploads)
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand_assets', 'brand_assets', true)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Removed 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;' 
-- Supabase manages the ownership of storage tables. It is already enabled by default.
-- Attempting to alter it as a standard user causes ERROR: 42501 (must be owner of table objects).

-- Policy: Allow public to view logos
DO $$ BEGIN
    CREATE POLICY "Allow public read logo" ON storage.objects FOR SELECT USING (bucket_id = 'brand_assets');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policy: Allow authenticated users to upload logos
DO $$ BEGIN
    CREATE POLICY "Allow authenticated upload logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand_assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policy: Allow authenticated users to update/delete logos
DO $$ BEGIN
    CREATE POLICY "Allow authenticated modify logo" ON storage.objects FOR UPDATE USING (bucket_id = 'brand_assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated delete logo" ON storage.objects FOR DELETE USING (bucket_id = 'brand_assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- 4. RPC FUNCTION: GET TOTAL ANALYSES COUNT
-- Allows anonymous and authenticated users to fetch the total global count for the budget widget,
-- bypassing RLS without exposing the actual rows.
CREATE OR REPLACE FUNCTION get_total_analyses_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public -- Secure the execution path
AS $$
  SELECT count(*)::integer FROM public.url_analyses;
$$;


-- 5. UPDATE TRIGGER FOR SETTINGS
-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to app_settings
DROP TRIGGER IF EXISTS set_updated_at ON public.app_settings;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
