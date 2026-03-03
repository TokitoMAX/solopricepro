-- SoloPrice Pro: Storage RLS Policies for logos bucket

-- 1. Enable RLS (Should be enabled by default for public buckets but let's be sure)
-- Policies are what really matter here

-- 2. Allow PUBLIC access for viewing (Reading)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for Logos') THEN
        CREATE POLICY "Public Access for Logos" ON storage.objects
        FOR SELECT TO public USING (bucket_id = 'logos');
    END IF;
END $$;

-- 3. Allow Authenticated users to upload/update logos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload to Logos') THEN
        CREATE POLICY "Authenticated Upload to Logos" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update to Logos') THEN
        CREATE POLICY "Authenticated Update to Logos" ON storage.objects
        FOR UPDATE TO authenticated WITH CHECK (bucket_id = 'logos');
    END IF;
END $$;

-- 4. Set bucket to public if not already
UPDATE storage.buckets SET public = true WHERE id = 'logos';
