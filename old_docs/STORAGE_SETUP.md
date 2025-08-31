# Supabase Storage Setup for Profile Images

## Steps to set up the profile images storage bucket:

### 1. Run the SQL migration
Execute the migration script `013_add_profile_image_url.sql` in your Supabase SQL Editor.

### 2. Verify the storage bucket
1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. You should see a `profile-images` bucket
4. If not created automatically, create it manually:
   - Click "New bucket"
   - Name: `profile-images`
   - Make it public: ✅

### 3. Configure bucket policies (if not set by migration)
```sql
-- Allow users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Make profile images publicly viewable
CREATE POLICY "Profile images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
```

### 4. Test the functionality
1. Run your app: `npm run dev`
2. Go to Profile page
3. Click Settings icon
4. Try uploading a profile image
5. Verify the image appears in your profile

## File Structure
- Images are stored as: `profile-images/{userId}-{timestamp}.{ext}`
- This ensures unique filenames and easy user-based organization
- Old images are automatically deleted when new ones are uploaded

## File Limits
- Maximum file size: 5MB
- Supported formats: All image types (jpg, png, gif, webp, etc.)
- Files are automatically made public for easy display
