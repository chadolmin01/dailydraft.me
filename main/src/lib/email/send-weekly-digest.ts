/**
 * Weekly Digest Email Sender
 *
 * Sends personalized weekly digest emails with recommended events.
 */

import { createClient } from '@supabase/supabase-js';
import { resend, FROM_EMAIL, isEmailEnabled } from './client';
import { renderWeeklyDigestEmail } from './templates/weekly-digest';
import { generateDigestSummary } from '@/src/lib/ai/recommendation-explainer';

interface DigestResult {
  success: boolean;
  emailsSent: number;
  skipped: number;
  errors: string[];
}

interface DigestEvent {
  id: string;
  title: string;
  organizer: string;
  event_type: string;
  registration_end_date: string;
  registration_url: string | null;
  interest_tags: string[];
  score?: number;
}

/**
 * Send weekly digest emails to all opted-in users
 */
export async function sendWeeklyDigestEmails(): Promise<DigestResult> {
  const result: DigestResult = {
    success: true,
    emailsSent: 0,
    skipped: 0,
    errors: [],
  };

  if (!isEmailEnabled()) {
    result.success = false;
    result.errors.push('Email not configured');
    return result;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    result.success = false;
    result.errors.push('Supabase not configured');
    return result;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Get users who opted into weekly digest
    const { data: users, error: usersError } = await supabase
      .from('notification_settings')
      .select(`
        user_id,
        profiles!inner (
          user_id,
          nickname,
          interest_tags,
          contact_email
        )
      `)
      .eq('email_enabled', true)
      .eq('weekly_digest_enabled', true);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return result;
    }

    // 2. Check which users already received digest this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: recentDigests } = await supabase
      .from('weekly_digest_logs')
      .select('user_id')
      .gte('sent_at', oneWeekAgo.toISOString())
      .eq('email_status', 'sent');

    const recentUserIds = new Set(recentDigests?.map((d) => d.user_id) || []);

    // 3. Process each user
    for (const user of users) {
      const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles;
      if (!profile) {
        result.skipped++;
        continue;
      }

      const userId = user.user_id;
      const email = profile.contact_email;
      const nickname = profile.nickname || '사용자';

      // Skip if already sent this week
      if (recentUserIds.has(userId)) {
        result.skipped++;
        continue;
      }

      // Skip if no email
      if (!email) {
        result.skipped++;
        continue;
      }

      try {
        // 4. Get recommended events for this user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: digestEvents } = await (supabase as any).rpc(
          'get_weekly_digest_events',
          {
            p_user_id: userId,
            p_recommended_limit: 5,
            p_popular_limit: 3,
          }
        );

        // Fallback if function doesn't exist
        let recommendedEvents: DigestEvent[] = [];
        let popularEvents: DigestEvent[] = [];

        if (digestEvents) {
          recommendedEvents = digestEvents
            .filter((e: { category: string }) => e.category === 'recommended')
            .map(formatDigestEvent);
          popularEvents = digestEvents
            .filter((e: { category: string }) => e.category === 'popular')
            .map(formatDigestEvent);
        } else {
          // Fallback: get recent active events
          const { data: fallbackEvents } = await supabase
            .from('startup_events')
            .select('id, title, organizer, event_type, registration_end_date, registration_url, interest_tags')
            .eq('status', 'active')
            .gte('registration_end_date', new Date().toISOString().split('T')[0])
            .order('created_at', { ascending: false })
            .limit(5);

          recommendedEvents = (fallbackEvents || []).map(formatDigestEvent);
        }

        // Skip if no events to send
        if (recommendedEvents.length === 0 && popularEvents.length === 0) {
          result.skipped++;
          continue;
        }

        // 5. Generate and send email
        const summary = generateDigestSummary(
          recommendedEvents.map((e) => ({
            title: e.title,
            eventType: e.event_type,
            interestTags: e.interest_tags,
            registrationEndDate: e.registration_end_date,
            organizer: e.organizer,
          })),
          nickname
        );

        const htmlContent = renderWeeklyDigestEmail({
          userName: nickname,
          summary,
          recommendedEvents,
          popularEvents,
        });

        const { error: sendError } = await resend!.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `[DailyDraft] ${nickname}님을 위한 이번 주 추천 행사`,
          html: htmlContent,
        });

        if (sendError) {
          throw new Error(sendError.message);
        }

        // 6. Log successful send
        await supabase.from('weekly_digest_logs').insert({
          user_id: userId,
          events_included: [...recommendedEvents, ...popularEvents].map((e) => e.id),
          email_status: 'sent',
        });

        result.emailsSent++;

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));

      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : String(userError);
        result.errors.push(`${nickname}: ${errorMsg}`);

        // Log failed attempt
        await supabase.from('weekly_digest_logs').insert({
          user_id: userId,
          events_included: [],
          email_status: 'failed',
          error_message: errorMsg,
        });
      }
    }

    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.success = false;
    result.errors.push(errorMsg);
    return result;
  }
}

function formatDigestEvent(event: Record<string, unknown>): DigestEvent {
  return {
    id: String(event.event_id || event.id),
    title: String(event.title || ''),
    organizer: String(event.organizer || ''),
    event_type: String(event.event_type || ''),
    registration_end_date: String(event.registration_end_date || ''),
    registration_url: event.registration_url ? String(event.registration_url) : null,
    interest_tags: Array.isArray(event.interest_tags) ? event.interest_tags : [],
    score: typeof event.score === 'number' ? event.score : undefined,
  };
}
