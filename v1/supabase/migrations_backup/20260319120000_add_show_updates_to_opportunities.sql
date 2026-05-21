-- ============================================================
-- Migration: Add show_updates to opportunities
-- Date: 2026-03-19
-- Description: 주간 업데이트 공개 여부 토글 (기본 비공개)
-- ============================================================

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS show_updates boolean DEFAULT false;
