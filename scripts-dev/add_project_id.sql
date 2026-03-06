-- SoloPrice Pro: Add missing project_id column to sp_expenses
-- Updated Step 1: Add the column as TEXT to match sp_quotes.id type
ALTER TABLE public.sp_expenses 
ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.sp_quotes(id) ON DELETE SET NULL;

-- Step 2: Verify the column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sp_expenses' AND column_name = 'project_id') THEN
        RAISE NOTICE 'Column project_id successfully added to sp_expenses';
    ELSE
        RAISE EXCEPTION 'Failed to add project_id column';
    END IF;
END $$;
