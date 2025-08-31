-- Create storage buckets for profile and annoyance images
-- Run this in your Supabase SQL editor

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

-- Set up RLS policies for profile-images bucket
CREATE POLICY "Anyone can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set up RLS policies for annoyance-images bucket
CREATE POLICY "Anyone can view annoyance images" ON storage.objects
  FOR SELECT USING (bucket_id = 'annoyance-images');

CREATE POLICY "Authenticated users can upload annoyance images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'annoyance-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own annoyance images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'annoyance-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own annoyance images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'annoyance-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
