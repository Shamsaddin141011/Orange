-- ============================================================
-- OrangeUni Profile Pictures
-- Run once in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Store the public URL of each user's avatar on their profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Public "avatars" bucket: 5 MB cap, PNG / WebP / JPEG only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/webp', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Users may only touch objects under avatars/{auth.uid()}/...
--    (Public reads go through the public URL and need no policy.)
DROP POLICY IF EXISTS "Avatar owners list" ON storage.objects;
CREATE POLICY "Avatar owners list"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Avatar owners upload" ON storage.objects;
CREATE POLICY "Avatar owners upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Avatar owners update" ON storage.objects;
CREATE POLICY "Avatar owners update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Avatar owners delete" ON storage.objects;
CREATE POLICY "Avatar owners delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
