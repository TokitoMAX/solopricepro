-- Migration to add accepted_at column to sp_quotes
-- This allows tracking when the client actually signed the quote.

ALTER TABLE public.sp_quotes 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Comment to explain the column
COMMENT ON COLUMN public.sp_quotes.accepted_at IS 'Date and time when the client signed the quote.';
