-- Add applicant_id column to sp_marketplace_applications to track the candidate
ALTER TABLE sp_marketplace_applications ADD COLUMN IF NOT EXISTS applicant_id UUID;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON sp_marketplace_applications(applicant_id);

-- Update RLS if necessary (Users should be able to see their own applications)
-- Check if policy exists first or just try to create it
-- Using a DO block to be safer
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sp_marketplace_applications' AND policyname = 'Users can see their own applications'
    ) THEN
        CREATE POLICY "Users can see their own applications" ON sp_marketplace_applications
        FOR SELECT USING (auth.uid() = applicant_id);
    END IF;
END $$;
