-- ==========================================
-- SOLOPRICE PRO - FINAL MARKETPLACE FIX v2 (v4.9.12)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Applications Table: Add missing columns
ALTER TABLE sp_marketplace_applications ADD COLUMN IF NOT EXISTS applicant_id UUID;
ALTER TABLE sp_marketplace_applications ADD COLUMN IF NOT EXISTS proposed_price NUMERIC;

-- 2. Performance & Relations
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON sp_marketplace_applications(applicant_id);

-- 3. Ensure invitations table exists and is correctly structured
CREATE TABLE IF NOT EXISTS sp_marketplace_invitations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    application_id TEXT NOT NULL REFERENCES sp_marketplace_applications(id) ON DELETE CASCADE,
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

-- 4. Security (RLS) for Applications
ALTER TABLE sp_marketplace_applications ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can see their own applications" ON sp_marketplace_applications;
    
    CREATE POLICY "Users can see their own applications" ON sp_marketplace_applications
    FOR SELECT USING (
        auth.uid() = applicant_id 
        OR auth.uid() IN (SELECT user_id FROM sp_marketplace_missions WHERE id = mission_id)
    );
END $$;

-- 5. Security (RLS) for Invitations
ALTER TABLE sp_marketplace_invitations ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read their own invitations" ON sp_marketplace_invitations;
    CREATE POLICY "Users can read their own invitations" ON sp_marketplace_invitations 
    FOR SELECT USING (auth.uid() = recruiter_id OR auth.uid() = candidate_id);

    DROP POLICY IF EXISTS "Recruiters can create invitations" ON sp_marketplace_invitations;
    CREATE POLICY "Recruiters can create invitations" ON sp_marketplace_invitations 
    FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

    DROP POLICY IF EXISTS "Users can update their invitations" ON sp_marketplace_invitations;
    CREATE POLICY "Users can update their invitations" ON sp_marketplace_invitations 
    FOR UPDATE USING (auth.uid() = recruiter_id OR auth.uid() = candidate_id);
END $$;

-- 6. CRITICAL: Force Supabase to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Verification
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('sp_marketplace_applications', 'sp_marketplace_invitations')
AND column_name IN ('applicant_id', 'proposed_price')
ORDER BY table_name;
