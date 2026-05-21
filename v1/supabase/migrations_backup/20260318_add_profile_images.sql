-- Add avatar and cover image URL columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT NULL;

-- Create storage bucket for profile images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile images
CREATE POLICY "Public read access for profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
