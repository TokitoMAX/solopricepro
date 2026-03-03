-- SoloPrice Pro - PayPal Migration
-- 1. Add paypal_email to expert profiles
ALTER TABLE public.sp_user_profile 
ADD COLUMN IF NOT EXISTS paypal_email TEXT;

-- 2. Add accepted_at to quotes (if not already done)
ALTER TABLE public.sp_quotes 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.sp_user_profile.paypal_email IS 'PayPal email for receiving client payments.';
COMMENT ON COLUMN public.sp_quotes.accepted_at IS 'Timestamp of the client signature.';
