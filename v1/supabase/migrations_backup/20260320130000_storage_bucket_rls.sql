-- Storage RLS policies for project-images and profile-images buckets
-- Buckets already created via Supabase Storage API

-- project-images: public read, authenticated upload/update/delete (own folder only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read project-images' AND tablename = 'objects') THEN
    CREATE POLICY "Public read project-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'project-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload project-images' AND tablename = 'objects') THEN
    CREATE POLICY "Auth upload project-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth update project-images' AND tablename = 'objects') THEN
    CREATE POLICY "Auth update project-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth delete project-images' AND tablename = 'objects') THEN
    CREATE POLICY "Auth delete project-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- profile-images: public read, authenticated upload/update/delete (own folder only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read profile-images' AND tablename = 'objects') THEN
    CREATE POLICY "Public read profile-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload profile-images' AND tablename = 'objects') THEN
    CREATE POLICY "Auth upload profile-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth update profile-images' AND tablename = 'objects') THEN
    CREATE POLICY "Auth update profile-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth delete profile-images' AND tablename = 'objects') THEN
    CREATE POLICY "Auth delete profile-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
