-- SoloPrice Pro - Fix sp_clients Table Schema
-- Run this in Supabase SQL Editor to add missing columns

-- 1. Add city column if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sp_clients' AND column_name = 'city') THEN
        ALTER TABLE public.sp_clients ADD COLUMN city TEXT;
    END IF;
END $$;

-- 2. Add zipCode column if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sp_clients' AND column_name = 'zipCode') THEN
        ALTER TABLE public.sp_clients ADD COLUMN "zipCode" TEXT;
    END IF;
END $$;

-- 3. Add siret column if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sp_clients' AND column_name = 'siret') THEN
        ALTER TABLE public.sp_clients ADD COLUMN siret TEXT;
    END IF;
END $$;

-- 4. Add notes column if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sp_clients' AND column_name = 'notes') THEN
        ALTER TABLE public.sp_clients ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 5. Add defaultServiceIds column (JSONB) if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sp_clients' AND column_name = 'defaultServiceIds') THEN
        ALTER TABLE public.sp_clients ADD COLUMN "defaultServiceIds" JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Optional: Re-fetch schema cache
-- NOTIFY pgrst, 'reload schema';
