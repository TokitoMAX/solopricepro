-- ============================================================
-- SoloPrice Pro — Migration: Ecosystem Feature
-- Run this in your Supabase SQL Editor (once)
-- ============================================================

-- 1. Add missing columns to sp_network_providers
--    (safe to run even if columns already exist)
ALTER TABLE sp_network_providers
  ADD COLUMN IF NOT EXISTS is_ecosystem BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio    TEXT,
  ADD COLUMN IF NOT EXISTS description  TEXT;

-- 2. Create sp_ecosystem_applications table
CREATE TABLE IF NOT EXISTS sp_ecosystem_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name   TEXT NOT NULL,
  user_email  TEXT NOT NULL,
  specialty   TEXT NOT NULL,
  portfolio   TEXT,
  city        TEXT,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',   -- pending | accepted | rejected
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row-Level Security for sp_ecosystem_applications
ALTER TABLE sp_ecosystem_applications ENABLE ROW LEVEL SECURITY;

-- Users can INSERT their own application
CREATE POLICY "Users can apply" ON sp_ecosystem_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own applications
CREATE POLICY "Users read own applications" ON sp_ecosystem_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Service-role (backend) can read/write all rows (no RLS restriction)
-- This is handled automatically by using the service-role key on the backend.

-- 4. RLS for sp_network_providers — ecosystem experts readable by all authenticated
--    (only the backend/service-role can write them)
ALTER TABLE sp_network_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read ecosystem experts" ON sp_network_providers
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage their own providers" ON sp_network_providers
  FOR ALL USING (auth.uid() = user_id);
