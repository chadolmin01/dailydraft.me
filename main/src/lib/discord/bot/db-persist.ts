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

// ── 온보딩 완료 → pending_discord_setups 저장 ──

/**
 * 봇 온보딩 완료 시 guild 정보 + 설정을 임시 저장
 * club_id/user_id는 Draft 웹에서 클럽 연결 시 매핑됨
 */
export async function savePendingSetup(setup: {
  guildId: string;
  guildName: string;
  ownerId: string;
  selectedChannels: string[];
  selectedTone: 'formal' | 'casual' | 'english';
}): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('pending_discord_setups')
    .upsert(
      {
        discord_guild_id: setup.guildId,
        discord_guild_name: setup.guildName,
        discord_owner_id: setup.ownerId,
        selected_channels: setup.selectedChannels,
        selected_tone: setup.selectedTone,
        status: 'pending',
      },
      { onConflict: 'discord_guild_id' }
    );

  if (error) {
    console.error('[DB] pending_discord_setups 저장 실패:', error.message);
    return false;
  }

  console.log(`[DB] 온보딩 설정 저장: ${setup.guildName} (${setup.guildId})`);
  return true;
}

// ── FileTrail ──

/**
 * 파일 업로드 로그 저장 (초기 상태: pending)
 * ON CONFLICT: Gateway 재연결로 같은 MESSAGE_CREATE가 재전송되면 중복 무시
 */
export async function saveFileLog(params: {
  channelId: string;
  guildId: string;
  messageId: string;
  uploaderDiscordId: string;
  uploaderName: string;
  filename: string;
  fileType: string;
  fileSize: number;
  threadId?: string;
}): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const clubId = await resolveClubId(params.guildId);
  if (!clubId) return null;

  const { data, error } = await sb
    .from('file_logs')
    .upsert(
      {
        club_id: clubId,
        discord_channel_id: params.channelId,
        discord_message_id: params.messageId,
        uploader_discord_id: params.uploaderDiscordId,
        uploader_name: params.uploaderName,
        filename: params.filename,
        file_type: params.fileType,
        file_size: params.fileSize,
        thread_id: params.threadId ?? null,
        response_status: 'pending',
      },
      // UNIQUE(discord_message_id, filename) 기반 중복 방지
      { onConflict: 'discord_message_id,filename', ignoreDuplicates: true }
    )
    .select('id')
    // ignoreDuplicates=true일 때 중복이면 0행 반환 → single()은 에러
    // maybeSingle()은 null 반환 (정상)
    .maybeSingle();

  if (error) {
    console.error('[DB] file_logs 저장 실패:', error.message);
    return null;
  }

  // 중복(Gateway 재전송)이면 data=null
  if (!data) {
    console.log(`[FileTrail] 중복 파일 무시: ${params.filename}`);
    return null;
  }

  return data.id;
}

/**
 * 같은 채널의 최근 파일 로그 조회 (유사 파일 검색용)
 * 기본 2주 이내 파일만
 */
export async function getRecentFileLogs(
  channelId: string,
  guildId: string,
  days: number = 14
): Promise<Array<{ id: string; filename: string; category: string | null; version: number }>> {
  const sb = getSupabase();
  if (!sb) return [];

  const clubId = await resolveClubId(guildId);
  if (!clubId) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await sb
    .from('file_logs')
    .select('id, filename, category, version')
    .eq('club_id', clubId)
    .eq('discord_channel_id', channelId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[DB] file_logs 조회 실패:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * 만료/무응답 file_log를 skipped로 마킹
 * cleanup()에서 24시간 경과 세션 정리 시 호출
 */
export async function markFileLogsSkipped(fileLogIds: string[]): Promise<void> {
  if (fileLogIds.length === 0) return;
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb
    .from('file_logs')
    .update({
      response_status: 'skipped',
      responded_at: new Date().toISOString(),
    })
    .in('id', fileLogIds)
    .eq('response_status', 'pending');

  if (error) {
    console.error('[DB] file_logs skipped 마킹 실패:', error.message);
  }
}

/**
 * 봇 재시작 시 오래된 pending 세션 일괄 skipped 처리
 * 봇이 꺼져 있는 동안 24시간 넘은 pending은 복구 불가
 */
export async function cleanupStalePendingFileLogs(
  hoursThreshold: number = 24
): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString();

  const { data, error } = await sb
    .from('file_logs')
    .update({
      response_status: 'skipped',
      responded_at: new Date().toISOString(),
    })
    .eq('response_status', 'pending')
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    console.error('[DB] stale file_logs 정리 실패:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * 유저 답변 후 AI 분류 결과로 file_log 업데이트
 */
export async function updateFileLogResponse(
  fileLogId: string,
  userResponse: string,
  aiResult: {
    category: string;
    tags: string[];
    summary: string;
    parentFileId?: string;
    version?: number;
  }
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  // DB CHECK 제약: parent_file_id=null이면 version=1, parent≠null이면 version>1
  // AI가 잘못된 조합을 반환할 수 있으므로 여기서 강제 보정
  const hasParent = !!aiResult.parentFileId;
  const safeVersion = hasParent
    ? Math.max(aiResult.version ?? 2, 2)   // parent 있으면 최소 v2
    : 1;                                    // parent 없으면 무조건 v1

  const { error } = await sb
    .from('file_logs')
    .update({
      user_response: userResponse,
      category: aiResult.category,
      tags: aiResult.tags,
      ai_summary: aiResult.summary,
      parent_file_id: aiResult.parentFileId ?? null,
      version: safeVersion,
      response_status: 'answered',
      responded_at: new Date().toISOString(),
    })
    .eq('id', fileLogId);

  if (error) {
    console.error('[DB] file_log 응답 업데이트 실패:', error.message);
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
