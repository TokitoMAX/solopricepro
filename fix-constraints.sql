-- SoloPrice Pro: Fix unicity constraints for UPSERT
-- To be run in Supabase SQL Editor

-- Ensure sp_settings has unique user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sp_settings_user_id_unique'
    ) THEN
        ALTER TABLE public.sp_settings ADD CONSTRAINT sp_settings_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Ensure sp_user_profiles has unique user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sp_user_profiles_user_id_unique'
    ) THEN
        ALTER TABLE public.sp_user_profiles ADD CONSTRAINT sp_user_profiles_user_id_unique UNIQUE (user_id);
    END IF;
END $$;
