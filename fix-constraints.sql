-- SoloPrice Pro: Intelligent unicity constraints fix
-- This script detects if the table is singular or plural and applies the fix

DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- 1. Fix sp_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sp_settings') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_settings_user_id_unique') THEN
            ALTER TABLE public.sp_settings ADD CONSTRAINT sp_settings_user_id_unique UNIQUE (user_id);
            RAISE NOTICE 'Constraint added to sp_settings';
        END IF;
    END IF;

    -- 2. Detect and Fix Profile Table
    -- Try plural first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sp_user_profiles') THEN
        table_name := 'sp_user_profiles';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sp_user_profile') THEN
        table_name := 'sp_user_profile';
    END IF;

    IF table_name IS NOT NULL THEN
        -- Check if constraint already exists (using a generic name or checking columns)
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = (quote_ident('public.' || table_name))::regclass 
            AND contype = 'u' 
            AND (
                SELECT array_agg(attname ORDER BY attname) 
                FROM pg_attribute 
                WHERE attrelid = conrelid AND attnum = ANY(conkey)
            ) = ARRAY['user_id']
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (user_id)', table_name, table_name || '_user_id_unique');
            RAISE NOTICE 'Unique constraint added to %', table_name;
        ELSE
            RAISE NOTICE 'Unique constraint already exists on %', table_name;
        END IF;
    ELSE
        RAISE WARNING 'Neither sp_user_profiles nor sp_user_profile found in public schema.';
    END IF;
END $$;
