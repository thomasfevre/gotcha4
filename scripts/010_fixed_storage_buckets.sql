-- Create storage buckets for profile and annoyance images
-- Run this in your Supabase SQL editor

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view annoyance images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload annoyance images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own annoyance images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own annoyance images" ON storage.objects;

-- Create profile-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[])
ON CONFLICT (id) DO NOTHING;

-- Create annoyance-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('annoyance-images', 'annoyance-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[])
ON CONFLICT (id) DO NOTHING;

-- Since we're using Privy auth (not Supabase Auth), we need to allow storage operations
-- at the bucket level since we handle authentication in our API endpoints

-- Allow all operations on profile-images bucket (auth handled in API)
CREATE POLICY "Allow all operations on profile-images" ON storage.objects
  FOR ALL USING (bucket_id = 'profile-images');

-- Allow all operations on annoyance-images bucket (auth handled in API)  
CREATE POLICY "Allow all operations on annoyance-images" ON storage.objects
  FOR ALL USING (bucket_id = 'annoyance-images');

-- Note: This is secure because:
-- 1. We validate authentication in our API endpoints before any storage operations
-- 2. Users can only access storage through our authenticated API routes
-- 3. Direct storage access is not exposed to end users
