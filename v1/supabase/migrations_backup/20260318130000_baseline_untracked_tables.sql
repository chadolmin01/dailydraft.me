-- ============================================================
-- Baseline migration: 11 tables that exist in DB but had no migration file
-- All statements use IF NOT EXISTS for idempotency
-- ============================================================

-- ========================
-- 1. applications
-- ========================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intro TEXT NOT NULL,
  why_apply TEXT NOT NULL,
  portfolio_links JSONB,
  match_score NUMERIC,
  match_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'applications_select' AND tablename = 'applications') THEN
    CREATE POLICY "applications_select" ON public.applications
      FOR SELECT USING (
        auth.uid() = applicant_id
        OR auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'applications_insert' AND tablename = 'applications') THEN
    CREATE POLICY "applications_insert" ON public.applications
      FOR INSERT WITH CHECK (auth.uid() = applicant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'applications_update' AND tablename = 'applications') THEN
    CREATE POLICY "applications_update" ON public.applications
      FOR UPDATE USING (
        auth.uid() = applicant_id
        OR auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'applications_delete' AND tablename = 'applications') THEN
    CREATE POLICY "applications_delete" ON public.applications
      FOR DELETE USING (auth.uid() = applicant_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- ========================
-- 2. accepted_connections
-- ========================
CREATE TABLE IF NOT EXISTS public.accepted_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  opportunity_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  assigned_role TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.accepted_connections ENABLE ROW LEVEL SECURITY;

-- Add columns that may be missing if table already existed
ALTER TABLE public.accepted_connections ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL;
ALTER TABLE public.accepted_connections ADD COLUMN IF NOT EXISTS assigned_role TEXT;
ALTER TABLE public.accepted_connections ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.accepted_connections ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accepted_connections_select' AND tablename = 'accepted_connections') THEN
    CREATE POLICY "accepted_connections_select" ON public.accepted_connections
      FOR SELECT USING (
        auth.uid() = opportunity_creator_id OR auth.uid() = applicant_id
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accepted_connections_insert' AND tablename = 'accepted_connections') THEN
    CREATE POLICY "accepted_connections_insert" ON public.accepted_connections
      FOR INSERT WITH CHECK (auth.uid() = opportunity_creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accepted_connections_update' AND tablename = 'accepted_connections') THEN
    CREATE POLICY "accepted_connections_update" ON public.accepted_connections
      FOR UPDATE USING (auth.uid() = opportunity_creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accepted_connections_delete' AND tablename = 'accepted_connections') THEN
    CREATE POLICY "accepted_connections_delete" ON public.accepted_connections
      FOR DELETE USING (auth.uid() = opportunity_creator_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_accepted_connections_applicant ON public.accepted_connections(applicant_id);
CREATE INDEX IF NOT EXISTS idx_accepted_connections_creator ON public.accepted_connections(opportunity_creator_id);
CREATE INDEX IF NOT EXISTS idx_accepted_connections_opportunity ON public.accepted_connections(opportunity_id);

-- ========================
-- 3. startup_events
-- ========================
CREATE TABLE IF NOT EXISTS public.startup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  organizer TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  registration_start_date TIMESTAMPTZ,
  registration_end_date TIMESTAMPTZ NOT NULL,
  registration_url TEXT,
  target_audience TEXT,
  interest_tags TEXT[],
  status TEXT DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  content_embedding TEXT,
  raw_data JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, external_id)
);

ALTER TABLE public.startup_events ENABLE ROW LEVEL SECURITY;

-- Add columns that may be missing if table already existed
ALTER TABLE public.startup_events ADD COLUMN IF NOT EXISTS content_embedding TEXT;
ALTER TABLE public.startup_events ADD COLUMN IF NOT EXISTS raw_data JSONB;
ALTER TABLE public.startup_events ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.startup_events ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'startup_events_select' AND tablename = 'startup_events') THEN
    CREATE POLICY "startup_events_select" ON public.startup_events
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'startup_events_service_role' AND tablename = 'startup_events') THEN
    CREATE POLICY "startup_events_service_role" ON public.startup_events
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_startup_events_status ON public.startup_events(status);
CREATE INDEX IF NOT EXISTS idx_startup_events_event_type ON public.startup_events(event_type);
CREATE INDEX IF NOT EXISTS idx_startup_events_registration_end ON public.startup_events(registration_end_date);
CREATE INDEX IF NOT EXISTS idx_startup_events_interest_tags ON public.startup_events USING GIN(interest_tags);

-- ========================
-- 4. event_bookmarks
-- ========================
CREATE TABLE IF NOT EXISTS public.event_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.startup_events(id) ON DELETE CASCADE,
  notify_before_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.event_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_bookmarks_select' AND tablename = 'event_bookmarks') THEN
    CREATE POLICY "event_bookmarks_select" ON public.event_bookmarks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_bookmarks_insert' AND tablename = 'event_bookmarks') THEN
    CREATE POLICY "event_bookmarks_insert" ON public.event_bookmarks
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_bookmarks_delete' AND tablename = 'event_bookmarks') THEN
    CREATE POLICY "event_bookmarks_delete" ON public.event_bookmarks
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user ON public.event_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_event ON public.event_bookmarks(event_id);

-- ========================
-- 5. event_notifications
-- ========================
CREATE TABLE IF NOT EXISTS public.event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.startup_events(id) ON DELETE SET NULL,
  bookmark_id UUID REFERENCES public.event_bookmarks(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'pending',
  notify_date TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_notifications_select' AND tablename = 'event_notifications') THEN
    CREATE POLICY "event_notifications_select" ON public.event_notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_notifications_update' AND tablename = 'event_notifications') THEN
    CREATE POLICY "event_notifications_update" ON public.event_notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_notifications_service_role' AND tablename = 'event_notifications') THEN
    CREATE POLICY "event_notifications_service_role" ON public.event_notifications
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_notifications_user ON public.event_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_status ON public.event_notifications(status);
CREATE INDEX IF NOT EXISTS idx_event_notifications_notify_date ON public.event_notifications(notify_date);

-- ========================
-- 6. event_applications
-- ========================
CREATE TABLE IF NOT EXISTS public.event_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.startup_events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'preparing', 'applied', 'accepted', 'rejected', 'withdrawn')),
  status_updated_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  applied_url TEXT,
  result_notes TEXT,
  personal_notes TEXT,
  preparation_checklist JSONB,
  reminder_date TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;

-- Add columns that may be missing if table already existed
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS applied_url TEXT;
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS result_notes TEXT;
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS personal_notes TEXT;
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS preparation_checklist JSONB;
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMPTZ;
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_applications_select' AND tablename = 'event_applications') THEN
    CREATE POLICY "event_applications_select" ON public.event_applications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_applications_insert' AND tablename = 'event_applications') THEN
    CREATE POLICY "event_applications_insert" ON public.event_applications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_applications_update' AND tablename = 'event_applications') THEN
    CREATE POLICY "event_applications_update" ON public.event_applications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_applications_delete' AND tablename = 'event_applications') THEN
    CREATE POLICY "event_applications_delete" ON public.event_applications
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_applications_user ON public.event_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_event ON public.event_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_status ON public.event_applications(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_event_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_event_application_timestamp') THEN
    CREATE TRIGGER trigger_update_event_application_timestamp
      BEFORE UPDATE ON public.event_applications
      FOR EACH ROW
      EXECUTE FUNCTION update_event_application_timestamp();
  END IF;
END $$;

-- ========================
-- 7. notification_settings
-- ========================
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  email_deadline_days INTEGER DEFAULT 3,
  inapp_deadline BOOLEAN DEFAULT TRUE,
  inapp_bookmark_reminder BOOLEAN DEFAULT TRUE,
  inapp_new_match BOOLEAN DEFAULT TRUE,
  preferred_time TEXT DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_settings_select' AND tablename = 'notification_settings') THEN
    CREATE POLICY "notification_settings_select" ON public.notification_settings
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_settings_insert' AND tablename = 'notification_settings') THEN
    CREATE POLICY "notification_settings_insert" ON public.notification_settings
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_settings_update' AND tablename = 'notification_settings') THEN
    CREATE POLICY "notification_settings_update" ON public.notification_settings
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON public.notification_settings(user_id);

-- ========================
-- 8. team_checklists
-- ========================
CREATE TABLE IF NOT EXISTS public.team_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_checklists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_checklists_select' AND tablename = 'team_checklists') THEN
    CREATE POLICY "team_checklists_select" ON public.team_checklists
      FOR SELECT USING (
        auth.uid() IN (
          SELECT creator_id FROM public.opportunities WHERE id = opportunity_id
          UNION
          SELECT applicant_id FROM public.accepted_connections WHERE opportunity_id = team_checklists.opportunity_id
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_checklists_insert' AND tablename = 'team_checklists') THEN
    CREATE POLICY "team_checklists_insert" ON public.team_checklists
      FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_checklists_update' AND tablename = 'team_checklists') THEN
    CREATE POLICY "team_checklists_update" ON public.team_checklists
      FOR UPDATE USING (
        auth.uid() IN (
          SELECT creator_id FROM public.opportunities WHERE id = opportunity_id
          UNION
          SELECT applicant_id FROM public.accepted_connections WHERE opportunity_id = team_checklists.opportunity_id
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_checklists_delete' AND tablename = 'team_checklists') THEN
    CREATE POLICY "team_checklists_delete" ON public.team_checklists
      FOR DELETE USING (
        auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_checklists_opportunity ON public.team_checklists(opportunity_id);

-- ========================
-- 9. team_announcements
-- ========================
CREATE TABLE IF NOT EXISTS public.team_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_announcements_select' AND tablename = 'team_announcements') THEN
    CREATE POLICY "team_announcements_select" ON public.team_announcements
      FOR SELECT USING (
        auth.uid() IN (
          SELECT creator_id FROM public.opportunities WHERE id = opportunity_id
          UNION
          SELECT applicant_id FROM public.accepted_connections WHERE opportunity_id = team_announcements.opportunity_id
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_announcements_insert' AND tablename = 'team_announcements') THEN
    CREATE POLICY "team_announcements_insert" ON public.team_announcements
      FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_announcements_update' AND tablename = 'team_announcements') THEN
    CREATE POLICY "team_announcements_update" ON public.team_announcements
      FOR UPDATE USING (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_announcements_delete' AND tablename = 'team_announcements') THEN
    CREATE POLICY "team_announcements_delete" ON public.team_announcements
      FOR DELETE USING (
        auth.uid() = author_id
        OR auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_announcements_opportunity ON public.team_announcements(opportunity_id);

-- ========================
-- 10. event_opportunity_links
-- ========================
CREATE TABLE IF NOT EXISTS public.event_opportunity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.startup_events(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, opportunity_id)
);

ALTER TABLE public.event_opportunity_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_opportunity_links_select' AND tablename = 'event_opportunity_links') THEN
    CREATE POLICY "event_opportunity_links_select" ON public.event_opportunity_links
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_opportunity_links_insert' AND tablename = 'event_opportunity_links') THEN
    CREATE POLICY "event_opportunity_links_insert" ON public.event_opportunity_links
      FOR INSERT WITH CHECK (auth.uid() = created_by);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_opportunity_links_delete' AND tablename = 'event_opportunity_links') THEN
    CREATE POLICY "event_opportunity_links_delete" ON public.event_opportunity_links
      FOR DELETE USING (auth.uid() = created_by);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_opportunity_links_event ON public.event_opportunity_links(event_id);
CREATE INDEX IF NOT EXISTS idx_event_opportunity_links_opportunity ON public.event_opportunity_links(opportunity_id);

-- ========================
-- 11. waitlist_signups
-- ========================
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  current_situation TEXT CHECK (current_situation IN ('solo_want_team', 'has_project_need_member', 'want_to_join', 'just_curious')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waitlist_signups_insert' AND tablename = 'waitlist_signups') THEN
    CREATE POLICY "waitlist_signups_insert" ON public.waitlist_signups
      FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waitlist_signups_service_role' AND tablename = 'waitlist_signups') THEN
    CREATE POLICY "waitlist_signups_service_role" ON public.waitlist_signups
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- Note: weekly_digest_logs and email_logs were listed in the plan
-- but do not exist in database.ts type definitions.
-- Skipped — add when/if these tables are actually needed.
-- ============================================================
