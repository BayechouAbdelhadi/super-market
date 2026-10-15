-- =========================================================================
-- SUPABASE STORAGE RLS POLICIES FOR "super-market" BUCKET
-- =========================================================================
-- Purpose:
-- 1. Ensure the 'super-market' bucket exists, is public, and accepts images.
-- 2. Allow 'anon' (unauthenticated) and public consumers to READ/VIEW email images.
-- 3. Allow 'ADMIN' users to WRITE (INSERT, UPDATE, DELETE) campaign images
--    stored under the 'compaigns/${campaignId}/...' directory.
-- =========================================================================

-- 1. Ensure the 'super-market' bucket exists with public read access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'super-market',
  'super-market',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Enable Row Level Security (RLS) on storage tables
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 3. Clean up any conflicting previous policies on storage.objects for 'super-market'
DROP POLICY IF EXISTS "Public & Anon read access for super-market bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert objects into super-market bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update objects in super-market bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete objects in super-market bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public anon read access on super-market bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload objects into super-market" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update objects in super-market" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete objects in super-market" ON storage.objects;

-- Also clean up previous bucket policies
DROP POLICY IF EXISTS "Public & Anon can read super-market bucket record" ON storage.buckets;

-- -------------------------------------------------------------------------
-- STORAGE.BUCKETS POLICIES
-- -------------------------------------------------------------------------
-- Allow anyone (anon + authenticated) to read the bucket metadata
CREATE POLICY "Public & Anon can read super-market bucket record"
ON storage.buckets FOR SELECT
TO public
USING (id = 'super-market');

-- -------------------------------------------------------------------------
-- STORAGE.OBJECTS POLICIES
-- -------------------------------------------------------------------------

-- POLICY A: READ ACCESS (ANON & PUBLIC)
-- Allows consumers, email clients (Gmail, Outlook, Apple Mail), and visitors
-- to view images stored in the 'super-market' bucket.
CREATE POLICY "Public & Anon read access for super-market bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'super-market');

-- POLICY B: WRITE ACCESS (INSERT - ADMIN ONLY)
-- Allows authenticated administrators (and service role) to upload images
-- into 'super-market' (specifically under 'compaigns/...').
CREATE POLICY "Admins can insert objects into super-market bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'super-market'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
);

-- POLICY C: UPDATE ACCESS (UPDATE - ADMIN ONLY)
-- Allows administrators to update/replace existing images in 'super-market'.
CREATE POLICY "Admins can update objects in super-market bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'super-market'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
)
WITH CHECK (
  bucket_id = 'super-market'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
);

-- POLICY D: DELETE ACCESS (DELETE - ADMIN ONLY)
-- Allows administrators to remove banner images from 'super-market'.
CREATE POLICY "Admins can delete objects in super-market bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'super-market'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
);
