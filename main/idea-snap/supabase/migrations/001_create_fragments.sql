-- Idea Snap: fragments table migration
-- Run this in your Supabase SQL Editor

-- Create fragments table
CREATE TABLE IF NOT EXISTS public.fragments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Fragment type
  type TEXT NOT NULL CHECK (type IN ('photo', 'memo')),

  -- Content
  content TEXT,                     -- Memo: text content / Photo: caption
  photo_url TEXT,                   -- Photo Storage URL
  thumbnail_url TEXT,               -- Thumbnail URL

  -- Context
  location JSONB,                   -- { lat, lng, address }
  captured_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fragments_user_id ON public.fragments(user_id);
CREATE INDEX IF NOT EXISTS idx_fragments_created_at ON public.fragments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fragments_status ON public.fragments(status);
CREATE INDEX IF NOT EXISTS idx_fragments_type ON public.fragments(type);

-- Enable RLS
ALTER TABLE public.fragments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own fragments" ON public.fragments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own fragments" ON public.fragments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fragments" ON public.fragments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fragments" ON public.fragments FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_fragments_updated ON public.fragments;
CREATE TRIGGER on_fragments_updated
  BEFORE UPDATE ON public.fragments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
