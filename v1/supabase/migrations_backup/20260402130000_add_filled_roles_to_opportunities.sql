ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS filled_roles TEXT[] DEFAULT '{}';
