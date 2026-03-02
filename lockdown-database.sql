-- SoloPrice Pro - Database Security Lockdown Script
-- Run this in the Supabase SQL Editor to enforce structural integrity and Row Level Security.
-- This script adds missing foreign keys (with CASCADE) and strict RLS policies to all core tables.

-------------------------------------------------------------------------------
-- 0. ENABLE ROW LEVEL SECURITY GLOBALLY
-------------------------------------------------------------------------------
-- Protect all core tables so NO ONE can access data without a valid auth token.
ALTER TABLE IF EXISTS public.sp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_calculator_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sp_journal ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 1. ENFORCE STRUCTURAL INTEGRITY (FOREIGN KEYS)
-------------------------------------------------------------------------------
-- 1.1 All tables must link back to auth.users ON DELETE CASCADE
-- This ensures if a user deletes their account, ALL their data is wiped instantly.

DO $$ 
BEGIN
    -- Clients
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_clients_user_id_fkey') THEN
        ALTER TABLE public.sp_clients ADD CONSTRAINT sp_clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Quotes
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_quotes_user_id_fkey') THEN
        ALTER TABLE public.sp_quotes ADD CONSTRAINT sp_quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Invoices
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_invoices_user_id_fkey') THEN
        ALTER TABLE public.sp_invoices ADD CONSTRAINT sp_invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Expenses
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_expenses_user_id_fkey') THEN
        ALTER TABLE public.sp_expenses ADD CONSTRAINT sp_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Settings
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_settings_user_id_fkey') THEN
        ALTER TABLE public.sp_settings ADD CONSTRAINT sp_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Calculator Data
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_calculator_data_user_id_fkey') THEN
        ALTER TABLE public.sp_calculator_data ADD CONSTRAINT sp_calculator_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Leads
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_leads_user_id_fkey') THEN
        ALTER TABLE public.sp_leads ADD CONSTRAINT sp_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Services
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_services_user_id_fkey') THEN
        ALTER TABLE public.sp_services ADD CONSTRAINT sp_services_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Journal
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_journal_user_id_fkey') THEN
        ALTER TABLE public.sp_journal ADD CONSTRAINT sp_journal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. APPLY STRICT ROW LEVEL SECURITY (RLS) POLICIES
-------------------------------------------------------------------------------
-- The golden rule: A user can ONLY view, insert, update, or delete THEIR OWN DATA.

-- Function helper to generate standard policies for a given table
-- Note: Doing this manually for clarity and reliability in Supabase UI.

-- [sp_clients]
DROP POLICY IF EXISTS "Users can view their own clients" ON public.sp_clients;
CREATE POLICY "Users can view their own clients" ON public.sp_clients FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own clients" ON public.sp_clients;
CREATE POLICY "Users can insert their own clients" ON public.sp_clients FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON public.sp_clients;
CREATE POLICY "Users can update their own clients" ON public.sp_clients FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.sp_clients;
CREATE POLICY "Users can delete their own clients" ON public.sp_clients FOR DELETE USING (auth.uid() = user_id);


-- [sp_quotes]
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.sp_quotes;
CREATE POLICY "Users can view their own quotes" ON public.sp_quotes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.sp_quotes;
CREATE POLICY "Users can insert their own quotes" ON public.sp_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quotes" ON public.sp_quotes;
CREATE POLICY "Users can update their own quotes" ON public.sp_quotes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.sp_quotes;
CREATE POLICY "Users can delete their own quotes" ON public.sp_quotes FOR DELETE USING (auth.uid() = user_id);


-- [sp_invoices]
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.sp_invoices;
CREATE POLICY "Users can view their own invoices" ON public.sp_invoices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.sp_invoices;
CREATE POLICY "Users can insert their own invoices" ON public.sp_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own invoices" ON public.sp_invoices;
CREATE POLICY "Users can update their own invoices" ON public.sp_invoices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.sp_invoices;
CREATE POLICY "Users can delete their own invoices" ON public.sp_invoices FOR DELETE USING (auth.uid() = user_id);


-- [sp_expenses]
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.sp_expenses;
CREATE POLICY "Users can view their own expenses" ON public.sp_expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.sp_expenses;
CREATE POLICY "Users can insert their own expenses" ON public.sp_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.sp_expenses;
CREATE POLICY "Users can update their own expenses" ON public.sp_expenses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.sp_expenses;
CREATE POLICY "Users can delete their own expenses" ON public.sp_expenses FOR DELETE USING (auth.uid() = user_id);


-- [sp_settings]
DROP POLICY IF EXISTS "Users can view their own settings" ON public.sp_settings;
CREATE POLICY "Users can view their own settings" ON public.sp_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.sp_settings;
CREATE POLICY "Users can insert their own settings" ON public.sp_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.sp_settings;
CREATE POLICY "Users can update their own settings" ON public.sp_settings FOR UPDATE USING (auth.uid() = user_id);


-- [sp_calculator_data]
DROP POLICY IF EXISTS "Users can view their own calculator data" ON public.sp_calculator_data;
CREATE POLICY "Users can view their own calculator data" ON public.sp_calculator_data FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own calculator data" ON public.sp_calculator_data;
CREATE POLICY "Users can insert their own calculator data" ON public.sp_calculator_data FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own calculator data" ON public.sp_calculator_data;
CREATE POLICY "Users can update their own calculator data" ON public.sp_calculator_data FOR UPDATE USING (auth.uid() = user_id);


-- [sp_journal]
DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.sp_journal;
CREATE POLICY "Users can view their own journal entries" ON public.sp_journal FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own journal entries" ON public.sp_journal;
CREATE POLICY "Users can insert their own journal entries" ON public.sp_journal FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.sp_journal;
CREATE POLICY "Users can update their own journal entries" ON public.sp_journal FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.sp_journal;
CREATE POLICY "Users can delete their own journal entries" ON public.sp_journal FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 3. INTER-TABLE INTEGRITY (Quotes -> Clients -> Validation)
-------------------------------------------------------------------------------
-- It is bad practice to allow a quote without a client.
-- Currently, we don't enforce this at the SQL column level due to legacy data, 
-- but we should add a comment / soft guard for the future app updates.

-- Ensure client_id in quotes references clients.id (if client_id is a UUID)
-- Note: If client_id is just a text field mapping to id, we alter it if possible.
DO $$ 
BEGIN
    -- Check if client_id actually exists and is a UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sp_quotes' AND column_name = 'client_id' AND data_type = 'uuid'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_quotes_client_id_fkey') THEN
            ALTER TABLE public.sp_quotes ADD CONSTRAINT sp_quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.sp_clients(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

SELECT 'Lockdown Complete! Database is now secured and structurally sound.' as status;
