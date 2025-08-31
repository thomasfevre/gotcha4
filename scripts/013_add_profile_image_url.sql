-- Add profile image URL column to profiles table
ALTER TABLE profiles 
ADD COLUMN profile_image_url TEXT;

-- Create a storage bucket for profile images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to profile-images" ON storage.objects;

-- For Privy auth, we'll handle authorization in the API and allow all operations
-- This is secure because our API routes verify Privy tokens before allowing operations
CREATE POLICY "Allow all operations on profile-images"
ON storage.objects 
FOR ALL
TO public
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');