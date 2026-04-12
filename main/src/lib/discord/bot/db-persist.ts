/**
 * 봇 감지 결과 → DB 저장
 *
 * bot_interventions: 모든 패턴 감지 기록
 * team_tasks / team_decisions / team_resources: 마무리 요약 시 구조화 데이터
 *
 * 봇은 별도 프로세스(Dockerfile.bot)로 실행되므로 자체 Supabase 클라이언트 사용.
 * SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 없으면 로그만 남기고 skip (graceful degradation)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PatternDetection, MeetingSummary } from './types';

// ── Supabase 클라이언트 (lazy init) ──

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('[DB] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 없음 — DB 저장 비활성');
    return null;
  }

  _supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _supabase;
}

// ── guild_id → club_id 캐시 ──
// TTL 1시간: 클럽-길드 매핑 변경 시 최대 1시간 후 반영
// 봇은 장기 실행 프로세스이므로 영구 캐시는 stale 데이터 위험

const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

interface CachedClub {
  clubId: string;
  cachedAt: number;
}

const guildToClub = new Map<string, CachedClub>();

async function resolveClubId(guildId: string): Promise<string | null> {
  if (!guildId) return null;

  const cached = guildToClub.get(guildId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.clubId;
  }

  const sb = getSupabase();
  if (!sb) return null;

  const { data } = await sb
    .from('discord_bot_installations')
    .select('club_id')
    .eq('discord_guild_id', guildId)
    .single();

  if (data?.club_id) {
    guildToClub.set(guildId, { clubId: data.club_id, cachedAt: Date.now() });
    return data.club_id;
  }

  // 실패 캐시는 하지 않음 — 다음 시도에서 재조회
  console.warn(`[DB] guild ${guildId}에 연결된 클럽 없음`);
  return null;
}

// ── bot_interventions 저장 ──

/**
 * 패턴 감지 → bot_interventions 기록
 * 반환: intervention ID (team_tasks 등 연결용)
 */
export async function saveIntervention(
  detection: PatternDetection,
  botMessageId?: string,
  triggerType: 'auto' | 'slash_command' | 'auto_summary' = 'auto'
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const firstMsg = detection.sourceMessages[0];
  if (!firstMsg) return null;

  const clubId = await resolveClubId(firstMsg.guildId);
  if (!clubId) return null;

  const { data, error } = await sb
    .from('bot_interventions')
    .insert({
      club_id: clubId,
      discord_guild_id: firstMsg.guildId,
      discord_channel_id: firstMsg.channelId,
      pattern_type: detection.type,
      confidence: detection.confidence,
      trigger_type: triggerType,
      bot_message_id: botMessageId ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] bot_interventions 저장 실패:', error.message);
    return null;
  }

  return data.id;
}

// ── 사용자 응답 (accept/dismiss) 업데이트 ──

export async function updateInterventionResponse(
  botMessageId: string,
  response: 'accepted' | 'dismissed'
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb
    .from('bot_interventions')
    .update({ user_response: response })
    .eq('bot_message_id', botMessageId);

  if (error) {
    console.error('[DB] user_response 업데이트 실패:', error.message);
  }
}

// ── 마무리 요약 → team_tasks / team_decisions / team_resources ──

export async function saveSummaryData(
  summary: MeetingSummary,
  channelId: string,
  guildId: string,
  interventionId?: string | null
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const clubId = await resolveClubId(guildId);
  if (!clubId) return;

  // team_tasks
  if (summary.tasks.length > 0) {
    const rows = summary.tasks.map((t) => ({
      club_id: clubId,
      discord_channel_id: channelId,
      assignee_name: t.assignee,
      task_description: t.task,
      deadline: t.deadline ? parseDeadline(t.deadline) : null,
      status: 'pending',
      source_intervention_id: interventionId ?? null,
    }));

    const { error } = await sb.from('team_tasks').insert(rows);
    if (error) {
      console.error('[DB] team_tasks 저장 실패:', error.message);
    } else {
      console.log(`[DB] team_tasks ${rows.length}건 저장`);
    }
  }

  // team_decisions
  if (summary.decisions.length > 0) {
    const rows = summary.decisions.map((d) => ({
      club_id: clubId,
      discord_channel_id: channelId,
      topic: d.topic,
      result: d.result,
      source_intervention_id: interventionId ?? null,
    }));

    const { error } = await sb.from('team_decisions').insert(rows);
    if (error) {
      console.error('[DB] team_decisions 저장 실패:', error.message);
    } else {
      console.log(`[DB] team_decisions ${rows.length}건 저장`);
    }
  }

  // team_resources
  if (summary.resources.length > 0) {
    const rows = summary.resources.map((r) => ({
      club_id: clubId,
      discord_channel_id: channelId,
      url: r.url,
      label: r.label,
      shared_by_name: r.sharedBy,
      resource_type: guessResourceType(r.url),
      source_intervention_id: interventionId ?? null,
    }));

    const { error } = await sb.from('team_resources').insert(rows);
    if (error) {
      console.error('[DB] team_resources 저장 실패:', error.message);
    } else {
      console.log(`[DB] team_resources ${rows.length}건 저장`);
    }
  }
}

// ── 유틸 ──

/**
 * "내일까지", "금요일" 등을 ISO 날짜로 변환 시도
 * 파싱 불가 시 null 반환 — DB에 text로 넣지 않음
 */
function parseDeadline(raw: string): string | null {
  // 간단한 "~까지" 패턴만 처리, 복잡한 건 null
  const now = new Date();
  const dayMap: Record<string, number> = {
    '월요일': 1, '화요일': 2, '수요일': 3, '목요일': 4,
    '금요일': 5, '토요일': 6, '일요일': 0,
  };

  if (raw.includes('내일')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }

  if (raw.includes('모레')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d.toISOString();
  }

  for (const [name, dayNum] of Object.entries(dayMap)) {
    if (raw.includes(name)) {
      const d = new Date(now);
      let diff = (dayNum - d.getDay() + 7) % 7;
      // "다음 주 금요일" 같은 표현이면 무조건 다음 주
      // "금요일까지" 같은 표현에서 오늘이 금요일이면 오늘(diff=0)을 의미
      // diff=0이고 "다음"이 포함되면 7일 후로 설정
      if (diff === 0 && raw.includes('다음')) {
        diff = 7;
      }
      d.setDate(d.getDate() + diff);
      return d.toISOString();
    }
  }

  return null;
}

/**
 * URL에서 리소스 타입 추측
 */
function guessResourceType(url: string): string {
  if (url.includes('figma.com')) return 'design';
  if (url.includes('github.com')) return 'code';
  if (url.includes('notion.')) return 'document';
  if (url.includes('docs.google.') || url.includes('drive.google.')) return 'document';
  if (url.includes('miro.com') || url.includes('whimsical.com')) return 'design';
  return 'link';
}
