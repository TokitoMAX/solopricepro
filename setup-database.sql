-- SoloPrice Pro - Global Database Setup Script
-- Run this in Supabase SQL Editor to initialize the entire structure

-- 1. Create Profile Table
CREATE TABLE IF NOT EXISTS public.sp_user_profile (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    siret TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    footer_mentions TEXT,
    logo TEXT,
    portfolio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT sp_user_profile_user_id_unique UNIQUE (user_id)
);

-- 2. Ensure Settings Unicity
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sp_settings') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_settings_user_id_unique') THEN
            ALTER TABLE public.sp_settings ADD CONSTRAINT sp_settings_user_id_unique UNIQUE (user_id);
        END IF;
    END IF;
END $$;

-- 3. Storage Configuration (Bucket 'logos')
-- Note: Buckets creation often requires admin or specific extension, but we define RLS here.
-- Ensure bucket 'logos' is public in Supabase Storage UI.

-- 4. RLS for Profile
ALTER TABLE public.sp_user_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.sp_user_profile;
CREATE POLICY "Users can view their own profile" ON public.sp_user_profile 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.sp_user_profile;
CREATE POLICY "Users can update their own profile" ON public.sp_user_profile 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.sp_user_profile;
CREATE POLICY "Users can insert their own profile" ON public.sp_user_profile 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Helper for Timestamp Updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sp_user_profile_updated_at ON public.sp_user_profile;
CREATE TRIGGER update_sp_user_profile_updated_at
    BEFORE UPDATE ON public.sp_user_profile
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
