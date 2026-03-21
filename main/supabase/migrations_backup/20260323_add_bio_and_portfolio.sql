-- 1) bio 컬럼 추가 (vision_summary와 분리)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2) portfolio_items 테이블
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON public.portfolio_items(user_id);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- RLS: 누구나 읽기, 본인만 CUD
CREATE POLICY "portfolio_select" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio_insert" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolio_update" ON public.portfolio_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "portfolio_delete" ON public.portfolio_items FOR DELETE USING (auth.uid() = user_id);
