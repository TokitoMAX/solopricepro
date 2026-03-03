-- SoloPrice Pro - Journal de Bord Table
-- Stores mental state, victories, and blockages for EXPERT users

CREATE TABLE IF NOT EXISTS public.sp_journal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood TEXT DEFAULT 'motivated',
    energy INTEGER DEFAULT 7,
    entries JSONB DEFAULT '[]'::jsonb,
    daily_focus TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT sp_journal_user_id_unique UNIQUE (user_id)
);

-- RLS
ALTER TABLE public.sp_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own journal" ON public.sp_journal;
CREATE POLICY "Users can view their own journal" ON public.sp_journal 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own journal" ON public.sp_journal;
CREATE POLICY "Users can update their own journal" ON public.sp_journal 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own journal" ON public.sp_journal;
CREATE POLICY "Users can insert their own journal" ON public.sp_journal 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_sp_journal_updated_at ON public.sp_journal;
CREATE TRIGGER update_sp_journal_updated_at
    BEFORE UPDATE ON public.sp_journal
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
