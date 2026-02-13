-- Table for storing interview invitations between recruiters and candidates
-- This enables in-app messaging without requiring external emails

CREATE TABLE IF NOT EXISTS sp_marketplace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES sp_marketplace_applications(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    message TEXT NOT NULL,
    proposed_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    candidate_response TEXT,
    selected_slot JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'confirmed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_invitations_application ON sp_marketplace_invitations(application_id);
CREATE INDEX IF NOT EXISTS idx_invitations_candidate ON sp_marketplace_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recruiter ON sp_marketplace_invitations(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON sp_marketplace_invitations(status);

-- Enable Row Level Security
ALTER TABLE sp_marketplace_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read invitations where they are either recruiter or candidate
CREATE POLICY "Users can read their own invitations"
    ON sp_marketplace_invitations FOR SELECT
    USING (auth.uid() = recruiter_id OR auth.uid() = candidate_id);

-- Policy: Only recruiters can create invitations
CREATE POLICY "Recruiters can create invitations"
    ON sp_marketplace_invitations FOR INSERT
    WITH CHECK (auth.uid() = recruiter_id);

-- Policy: Users can update invitations where they are involved
CREATE POLICY "Users can update their invitations"
    ON sp_marketplace_invitations FOR UPDATE
    USING (auth.uid() = recruiter_id OR auth.uid() = candidate_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_invitations_updated_at ON sp_marketplace_invitations;
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON sp_marketplace_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste this → Run
