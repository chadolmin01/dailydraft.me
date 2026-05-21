-- Idea Snap: fragments storage bucket
-- Run this in your Supabase SQL Editor

-- Create fragments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fragments',
  'fragments',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fragments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'fragments');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'fragments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fragments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
