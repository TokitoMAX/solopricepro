-- SoloPrice Pro: Update logos bucket limits
-- Run this in Supabase SQL Editor if needed, or via this script

UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
  file_size_limit = 2097152 -- 2MB
WHERE id = 'logos';
