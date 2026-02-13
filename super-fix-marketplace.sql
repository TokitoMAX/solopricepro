-- ==========================================
-- SOLOPRICE PRO - FINAL MARKETPLACE GLUE (v4.9.13)
-- Run this in your Supabase SQL Editor
-- This script fixes relationships for PostgREST joins.
-- ==========================================

-- 1. Ensure Columns Exist
ALTER TABLE sp_marketplace_applications ADD COLUMN IF NOT EXISTS applicant_id UUID;
ALTER TABLE sp_marketplace_applications ADD COLUMN IF NOT EXISTS proposed_price NUMERIC;

-- 2. Performance & Relations (Indices)
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON sp_marketplace_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_mission ON sp_marketplace_applications(mission_id);

-- 3. FORCED FOREIGN KEYS (The "Glue" for Joins)
-- We use a DO block to safely add constraints if they don't exist
DO $$ 
BEGIN
    -- Link Applications to Missions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_apps_missions') THEN
        ALTER TABLE sp_marketplace_applications 
        ADD CONSTRAINT fk_apps_missions 
        FOREIGN KEY (mission_id) REFERENCES sp_marketplace_missions(id) ON DELETE CASCADE;
    END IF;

    -- Link Invitations to Applications
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invites_apps') THEN
        ALTER TABLE sp_marketplace_invitations 
        ADD CONSTRAINT fk_invites_apps 
        FOREIGN KEY (application_id) REFERENCES sp_marketplace_applications(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. CRITICAL: Force Supabase to reload the schema cache
-- This is what clears the "column not found in schema cache" error
NOTIFY pgrst, 'reload schema';

-- 5. Verification
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('sp_marketplace_applications', 'sp_marketplace_invitations')
ORDER BY 1;
