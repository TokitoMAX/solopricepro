-- Migration: Add 'country' column to sp_user_profile
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard/project/_/sql

ALTER TABLE sp_user_profile
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
