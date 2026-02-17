-- Create sp_user_profile table if it doesn't exist
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

-- Enable RLS
ALTER TABLE public.sp_user_profile ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.sp_user_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.sp_user_profile
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.sp_user_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sp_user_profile_updated_at
    BEFORE UPDATE ON public.sp_user_profile
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
