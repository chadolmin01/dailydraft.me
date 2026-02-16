import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { TransformedEvent, EventSource, SyncResult } from '../types/index.js';

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Sync Mode: Direct DB or HTTP API
 */
type SyncMode = 'direct' | 'api';

export interface SyncOptions {
  dryRun?: boolean;
  skipAI?: boolean; // Skip AI tagging/embedding (for testing)
  mode?: SyncMode;  // 'direct' for DB, 'api' for HTTP API
}

/**
 * Sync Manager handles saving crawled events to database
 * Supports both direct DB connection and HTTP API mode
 */
export class SyncManager {
  private supabase: SupabaseClient | null = null;
  private apiUrl: string | null = null;
  private apiSecret: string | null = null;

  constructor() {
    this.supabase = getSupabaseClient();
    this.apiUrl = process.env.BACKEND_API_URL || null;
    this.apiSecret = process.env.CRON_SECRET || null;
  }

  /**
   * Determine sync mode based on available credentials
   */
  private getSyncMode(preferred?: SyncMode): SyncMode {
    if (preferred === 'api' && this.apiUrl && this.apiSecret) {
      return 'api';
    }
    if (preferred === 'direct' && this.supabase) {
      return 'direct';
    }
    // Auto-detect
    if (this.supabase) {
      return 'direct';
    }
    if (this.apiUrl && this.apiSecret) {
      return 'api';
    }
    throw new Error('No sync credentials available. Set SUPABASE_URL/KEY or BACKEND_API_URL/CRON_SECRET');
  }

  /**
   * Sync transformed events to database (via direct DB or HTTP API)
   */
  async syncEvents(events: TransformedEvent[], options: SyncOptions = {}): Promise<SyncResult> {
    const source = events[0]?.source;
    const result: SyncResult = {
      source: source as EventSource,
      newEvents: 0,
      updatedEvents: 0,
      skippedEvents: 0,
      expiredEvents: 0,
      errors: [],
    };

    if (events.length === 0) {
      logger.info('No events to sync');
      return result;
    }

    if (options.dryRun) {
      logger.info(`[DRY RUN] Would sync ${events.length} events`);
      events.forEach(e => logger.info(`  - ${e.title} (${e.external_id})`));
      return result;
    }

    const mode = this.getSyncMode(options.mode);
    logger.info(`Syncing ${events.length} events via ${mode} mode`);

    if (mode === 'api') {
      return this.syncViaApi(events, options);
    }

    return this.syncViaDirect(events, options);
  }

  /**
   * Sync via HTTP API (backend ingest endpoint)
   */
  private async syncViaApi(events: TransformedEvent[], options: SyncOptions): Promise<SyncResult> {
    const source = events[0]?.source;
    const result: SyncResult = {
      source: source as EventSource,
      newEvents: 0,
      updatedEvents: 0,
      skippedEvents: 0,
      expiredEvents: 0,
      errors: [],
    };

    try {
      const response = await fetch(`${this.apiUrl}/api/cron/ingest-crawled-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiSecret}`,
        },
        body: JSON.stringify({
          source,
          events,
          skipAI: options.skipAI || false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        success?: boolean;
        result?: {
          new_events?: number;
          updated_events?: number;
          skipped_events?: number;
          expired_events?: number;
          errors?: Array<{ externalId?: string; error: string }>;
        };
      };

      if (data.success && data.result) {
        result.newEvents = data.result.new_events || 0;
        result.updatedEvents = data.result.updated_events || 0;
        result.skippedEvents = data.result.skipped_events || 0;
        result.expiredEvents = data.result.expired_events || 0;
        if (data.result.errors) {
          result.errors = data.result.errors;
        }
      }

      logger.info('API sync completed', {
        new: result.newEvents,
        updated: result.updatedEvents,
        skipped: result.skippedEvents,
      });

    } catch (error) {
      const err = error as Error;
      logger.error(`API sync failed: ${err.message}`);
      result.errors.push({ error: err.message });
    }

    return result;
  }

  /**
   * Sync directly to database
   */
  private async syncViaDirect(events: TransformedEvent[], options: SyncOptions): Promise<SyncResult> {
    const source = events[0]?.source;
    const result: SyncResult = {
      source: source as EventSource,
      newEvents: 0,
      updatedEvents: 0,
      skippedEvents: 0,
      expiredEvents: 0,
      errors: [],
    };

    if (!this.supabase) {
      result.errors.push({ error: 'Supabase client not initialized' });
      return result;
    }

    // Filter out expired events
    const now = new Date();
    const activeEvents = events.filter(event => {
      if (!event.registration_end_date) return false;
      const endDate = new Date(event.registration_end_date);
      return endDate >= now;
    });

    const expiredCount = events.length - activeEvents.length;
    result.expiredEvents = expiredCount;
    logger.info(`Filtered out ${expiredCount} expired events`);

    // Get existing event IDs
    const externalIds = activeEvents.map(e => e.external_id);
    const { data: existingEvents, error: fetchError } = await this.supabase!
      .from('startup_events')
      .select('external_id')
      .in('external_id', externalIds);

    if (fetchError) {
      logger.error('Failed to fetch existing events', { error: fetchError });
      result.errors.push({ error: fetchError.message });
      return result;
    }

    const existingIds = new Set(existingEvents?.map(e => e.external_id) || []);

    // Split into new and existing
    const newEvents = activeEvents.filter(e => !existingIds.has(e.external_id));
    const updateEvents = activeEvents.filter(e => existingIds.has(e.external_id));

    logger.info(`New events: ${newEvents.length}, Updates: ${updateEvents.length}`);

    // Insert new events
    for (const event of newEvents) {
      try {
        const eventData = {
          external_id: event.external_id,
          source: event.source,
          title: event.title,
          organizer: event.organizer,
          description: event.description,
          event_type: event.event_type,
          start_date: event.start_date,
          end_date: event.end_date,
          registration_start_date: event.registration_start_date,
          registration_end_date: event.registration_end_date,
          registration_url: event.registration_url,
          target_audience: event.target_audience,
          status: event.status,
          raw_data: event.raw_data,
          // interest_tags and content_embedding will be generated by AI later
          last_synced_at: new Date().toISOString(),
        };

        const { error: insertError } = await this.supabase!
          .from('startup_events')
          .insert(eventData);

        if (insertError) {
          throw insertError;
        }

        result.newEvents++;
        logger.debug(`Inserted: ${event.title}`);
      } catch (error) {
        const err = error as Error;
        logger.error(`Failed to insert ${event.external_id}: ${err.message}`);
        result.errors.push({
          externalId: event.external_id,
          error: err.message,
        });
      }
    }

    // Update existing events (only update if data changed)
    for (const event of updateEvents) {
      try {
        const { error: updateError } = await this.supabase!
          .from('startup_events')
          .update({
            title: event.title,
            organizer: event.organizer,
            description: event.description,
            event_type: event.event_type,
            start_date: event.start_date,
            end_date: event.end_date,
            registration_start_date: event.registration_start_date,
            registration_end_date: event.registration_end_date,
            registration_url: event.registration_url,
            target_audience: event.target_audience,
            status: event.status,
            raw_data: event.raw_data,
            last_synced_at: new Date().toISOString(),
          })
          .eq('external_id', event.external_id);

        if (updateError) {
          throw updateError;
        }

        result.updatedEvents++;
        logger.debug(`Updated: ${event.title}`);
      } catch (error) {
        const err = error as Error;
        logger.error(`Failed to update ${event.external_id}: ${err.message}`);
        result.errors.push({
          externalId: event.external_id,
          error: err.message,
        });
      }
    }

    // Mark old events as expired
    await this.markExpiredEvents(source as EventSource);

    logger.info('Sync completed', {
      new: result.newEvents,
      updated: result.updatedEvents,
      skipped: result.skippedEvents,
      expired: result.expiredEvents,
      errors: result.errors.length,
    });

    return result;
  }

  /**
   * Mark events past their registration deadline as expired
   */
  private async markExpiredEvents(source: EventSource): Promise<number> {
    if (!this.supabase) return 0;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('startup_events')
      .update({ status: 'expired' })
      .eq('source', source)
      .eq('status', 'active')
      .lt('registration_end_date', today)
      .select('id');

    if (error) {
      logger.error('Failed to mark expired events', { error });
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      logger.info(`Marked ${count} events as expired`);
    }
    return count;
  }

  /**
   * Get events that need AI processing (no tags or embeddings)
   */
  async getEventsNeedingAI(source?: EventSource): Promise<{ id: string; title: string; description: string | null }[]> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized for getEventsNeedingAI');
      return [];
    }

    let query = this.supabase
      .from('startup_events')
      .select('id, title, description')
      .eq('status', 'active')
      .or('interest_tags.is.null,content_embedding.is.null');

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      logger.error('Failed to get events needing AI', { error });
      return [];
    }

    return data || [];
  }

  /**
   * Update event with AI-generated tags and embedding
   */
  async updateEventAI(
    eventId: string,
    tags: string[],
    embedding: number[]
  ): Promise<boolean> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized for updateEventAI');
      return false;
    }

    const { error } = await this.supabase
      .from('startup_events')
      .update({
        interest_tags: tags,
        content_embedding: embedding,
      })
      .eq('id', eventId);

    if (error) {
      logger.error(`Failed to update AI data for ${eventId}`, { error });
      return false;
    }

    return true;
  }
}

export const syncManager = new SyncManager();
