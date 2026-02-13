-- ==========================================
-- SOLOPRICE PRO - FINAL MARKETPLACE FIX (v4.9.10)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Ensure applicant_id exists in applications table
ALTER TABLE sp_marketplace_applications ADD COLUMN IF NOT EXISTS applicant_id UUID;

-- 2. Performance & Relations
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON sp_marketplace_applications(applicant_id);

-- 3. Security (RLS)
-- Safely drop old policy if it exists and recreate
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can see their own applications" ON sp_marketplace_applications;
    
    CREATE POLICY "Users can see their own applications" ON sp_marketplace_applications
    FOR SELECT USING (
        auth.uid() = applicant_id 
        OR auth.uid() = user_id 
        OR auth.uid() IN (
            SELECT user_id FROM sp_marketplace_missions WHERE id = mission_id
        )
    );
END $$;

-- 4. CRITICAL: Force Supabase to reload the schema cache
-- This fixes the "column not found in schema cache" error
NOTIFY pgrst, 'reload schema';

-- 5. Verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sp_marketplace_applications' 
AND column_name = 'applicant_id';
