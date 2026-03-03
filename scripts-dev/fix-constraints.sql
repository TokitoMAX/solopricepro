-- SoloPrice Pro: Intelligent unicity constraints fix (v2)
-- Renamed variable to avoid ambiguity with information_schema column names

DO $$
DECLARE
    v_table_name TEXT;
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
        v_table_name := 'sp_user_profiles';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sp_user_profile') THEN
        v_table_name := 'sp_user_profile';
    END IF;

    IF v_table_name IS NOT NULL THEN
        -- Check if constraint already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = (quote_ident('public.' || v_table_name))::regclass 
            AND contype = 'u' 
            AND (
                SELECT array_agg(attname ORDER BY attname) 
                FROM pg_attribute 
                WHERE attrelid = conrelid AND attnum = ANY(conkey)
            ) = ARRAY['user_id']
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (user_id)', v_table_name, v_table_name || '_user_id_unique');
            RAISE NOTICE 'Unique constraint added to %', v_table_name;
        ELSE
            RAISE NOTICE 'Unique constraint already exists on %', v_table_name;
        END IF;
    ELSE
        RAISE WARNING 'Neither sp_user_profiles nor sp_user_profile found in public schema.';
    END IF;
END $$;
