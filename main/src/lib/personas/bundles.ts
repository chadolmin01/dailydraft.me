/**
 * Bundle Service (R3.1)
 *
 * 한 이벤트당 여러 채널 어댑터를 병렬 실행하여 persona_outputs 레코드를 묶어 저장.
 * - createBundle: 생성 + 운영자 Discord 채널에 알림
 * - approveBundle: 승인 + 자동 발행 가능 채널만 즉시 발행 (R3.1: discord_forum_markdown)
 * - rejectBundle: 거절 + 사유를 페르소나 taboos 슬롯에 누적 (R2 재활용 훅)
 *
 * RLS: can_edit_persona()가 모든 쓰기를 게이트하므로 호출 측은 user 세션만 전달.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import {
  sendChannelMessage,
  sendChannelMessageWithComponents,
} from '@/src/lib/discord/client'
import { fetchPersonaChain } from './fetch'
import { resolvePersonaChain } from './inherit'
import { runAdapter, type AdapterOutput } from './channel-adapters'
import { getChannelsForEvent, EVENT_CONFIG } from './event-catalog'
import type {
  ChannelFormat,
  EventType,
  FieldKey,
  PersonaOutputBundleRow,
  PersonaRow,
} from './types'

type Client = SupabaseClient<Database>

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://draft.im'

export interface CreateBundleInput {
  clubId?: string               // type='club' 페르소나 찾기용. personaId가 있으면 불필요
  personaId?: string            // 직접 지정 가능
  eventType: EventType
  eventMetadata: Record<string, unknown>
  /** 크론 등 시스템 실행 시 null 허용. created_by가 null로 기록됨. */
  userId: string | null
  corpusHint?: string
  semesterRef?: string
  weekNumber?: number
  /**
   * 생성된 번들을 운영자 채널에 알릴지. 크론 자동 실행 등은 true, 테스트는 false.
   */
  notifyOperator?: boolean
}

export interface CreateBundleResult {
  bundle: PersonaOutputBundleRow
  success_count: number
  failed_formats: ChannelFormat[]
  outputs: Array<{
    channel_format: ChannelFormat
    output_id: string | null
    error?: string
  }>
}

/**
 * 번들 생성.
 * 1) persona_output_bundles insert (status='generating')
 * 2) 이벤트의 채널 목록으로 병렬 어댑터 실행
 * 3) persona_outputs insert (bundle_id 연결)
 * 4) status='pending_approval' 전환
 * 5) 운영자 Discord 채널 알림 (선택)
 */
export async function createBundle(
  supabase: Client,
  input: CreateBundleInput,
): Promise<CreateBundleResult> {
  const { eventType, eventMetadata, userId } = input

  // 1) 페르소나 찾기
  const persona = await findTargetPersona(supabase, input)
  if (!persona) {
    throw new Error('이 동아리의 페르소나가 아직 만들어지지 않았습니다')
  }

  // 2) 이벤트 유효성 및 채널 목록
  const channels = getChannelsForEvent(eventType)
  if (channels.length === 0) {
    throw new Error(`${eventType} 이벤트는 아직 활성화되지 않았습니다 (R3.1 제외)`)
  }

  // 3) Zod 스키마로 메타 검증 (R3.1은 파싱 실패도 경고 수준으로 통과시켜 유연하게)
  const parsed = EVENT_CONFIG[eventType].metadata_schema.safeParse(eventMetadata)
  if (!parsed.success) {
    console.warn(
      `[bundles] ${eventType} metadata 검증 실패 — 그래도 진행:`,
      parsed.error.format(),
    )
  }

  // 4) 번들 insert
  const { data: bundleData, error: bundleErr } = await supabase
    .from('persona_output_bundles')
    .insert({
      persona_id: persona.id,
      event_type: eventType,
      event_metadata: eventMetadata,
      status: 'generating',
      semester_ref: input.semesterRef ?? null,
      week_number: input.weekNumber ?? null,
      created_by: userId,
    })
    .select('*')
    .single()

  if (bundleErr || !bundleData) {
    throw new Error(`번들 생성 실패: ${bundleErr?.message ?? 'unknown'}`)
  }
  const bundle = bundleData as unknown as PersonaOutputBundleRow

  // 5) 페르소나 체인 해석 (상속 merge)
  const chain = await fetchPersonaChain(supabase, persona.id)
  const resolvedPersona = resolvePersonaChain(chain)

  // 6) 조직명 조회 (club 페르소나만. project/personal은 R5+)
  const orgName = await resolveOrgName(supabase, persona)

  // 7) 병렬 어댑터 실행
  const adapterInputBase = {
    persona: resolvedPersona,
    orgName,
    eventType,
    eventMetadata,
    corpusHint: input.corpusHint,
  }

  const results = await Promise.allSettled(
    channels.map((fmt) => runAdapter(fmt, adapterInputBase)),
  )

  // 8) 성공분만 persona_outputs insert
  const outputsToInsert: Array<{
    adapterOutput: AdapterOutput
  }> = []
  const outputReport: CreateBundleResult['outputs'] = []

  for (let i = 0; i < channels.length; i++) {
    const fmt = channels[i]!
    const r = results[i]!
    if (r.status === 'fulfilled') {
      outputsToInsert.push({ adapterOutput: r.value })
      outputReport.push({ channel_format: fmt, output_id: null }) // id는 insert 후 채움
    } else {
      const err = r.reason instanceof Error ? r.reason.message : String(r.reason)
      console.warn(`[bundles] 어댑터 ${fmt} 실패:`, err)
      outputReport.push({ channel_format: fmt, output_id: null, error: err })
    }
  }

  if (outputsToInsert.length > 0) {
    const rows = outputsToInsert.map(({ adapterOutput }) => ({
      persona_id: persona.id,
      bundle_id: bundle.id,
      output_type: adapterOutput.channel_format,
      channel_format: adapterOutput.channel_format,
      generated_content: adapterOutput.generated_content,
      format_constraints: adapterOutput.format_constraints,
      is_copy_only: adapterOutput.is_copy_only,
      input_context: {
        event_type: eventType,
        event_metadata: eventMetadata,
        used_slots: adapterOutput.used_slots ?? [],
        title: adapterOutput.title,
      },
      status: 'draft' as const,
    }))

    const { data: insertedOutputs, error: outErr } = await supabase
      .from('persona_outputs')
      .insert(rows)
      .select('id, channel_format')

    if (outErr) {
      console.error('[bundles] persona_outputs insert 실패:', outErr)
      // 번들 상태는 pending_approval로 진행 (부분 성공)
    } else if (insertedOutputs) {
      // output_id 매핑
      const byFormat = new Map<string, string>()
      for (const row of insertedOutputs) {
        byFormat.set(row.channel_format as string, row.id as string)
      }
      for (const entry of outputReport) {
        const id = byFormat.get(entry.channel_format)
        if (id) entry.output_id = id
      }
    }
  }

  // 9) 번들 상태 → pending_approval
  await supabase
    .from('persona_output_bundles')
    .update({ status: 'pending_approval' })
    .eq('id', bundle.id)

  bundle.status = 'pending_approval'

  // 10) 운영자 알림
  if (input.notifyOperator !== false) {
    await notifyOperatorOfBundle(supabase, persona, bundle, outputReport).catch(
      (err) => console.warn('[bundles] 운영자 알림 실패:', err),
    )
  }

  const successCount = outputReport.filter((o) => !o.error).length

  return {
    bundle,
    success_count: successCount,
    failed_formats: outputReport.filter((o) => o.error).map((o) => o.channel_format),
    outputs: outputReport,
  }
}

/**
 * 번들 승인.
 * - 권한 게이트는 RLS가 실행 (can_edit_persona)
 * - 자동 발행 가능 채널(Discord 포럼)은 즉시 발행
 * - 나머지(에타/인스타/링크드인/이메일)는 is_copy_only 플래그로 UI에서 복사
 */
export async function approveBundle(
  supabase: Client,
  bundleId: string,
  userId: string,
): Promise<PersonaOutputBundleRow> {
  const now = new Date().toISOString()

  // 1) 번들 + 하위 outputs 로드
  const { data: bundle, error: bErr } = await supabase
    .from('persona_output_bundles')
    .select('*')
    .eq('id', bundleId)
    .maybeSingle()
  if (bErr) throw new Error(`번들 조회 실패: ${bErr.message}`)
  if (!bundle) throw new Error('번들을 찾을 수 없습니다')

  const { data: outputs } = await supabase
    .from('persona_outputs')
    .select('*')
    .eq('bundle_id', bundleId)

  // 2) 자동 발행 — R3.1은 discord_forum_markdown만
  let publishedCount = 0
  for (const output of (outputs ?? []) as Array<{
    id: string
    channel_format: string
    generated_content: string
    is_copy_only: boolean
    input_context: Record<string, unknown>
  }>) {
    if (output.is_copy_only) continue
    if (output.channel_format === 'discord_forum_markdown') {
      const channelId = await resolveDiscordTargetChannel(
        supabase,
        (bundle as unknown as PersonaOutputBundleRow).persona_id,
        (bundle as unknown as PersonaOutputBundleRow).event_metadata,
      )
      if (!channelId) {
        console.warn('[bundles] Discord 대상 채널 찾지 못함 — skip')
        continue
      }
      try {
        await sendChannelMessage(channelId, output.generated_content)
        await supabase
          .from('persona_outputs')
          .update({ status: 'published', published_at: now, destination: `discord:${channelId}` })
          .eq('id', output.id)
        publishedCount++
      } catch (err) {
        console.warn('[bundles] Discord 발행 실패:', (err as Error).message)
      }
    }
    // email_newsletter도 is_copy_only=false지만 구독자 리스트 UI는 R3.4. 지금은 published 전환 안 함.
  }

  // 3) 번들 상태 업데이트
  const { data: updated, error: uErr } = await supabase
    .from('persona_output_bundles')
    .update({
      status: publishedCount > 0 ? 'published' : 'approved',
      approved_by: userId,
      approved_at: now,
      published_at: publishedCount > 0 ? now : null,
    })
    .eq('id', bundleId)
    .select('*')
    .single()

  if (uErr) throw new Error(`번들 승인 실패: ${uErr.message}`)
  return updated as unknown as PersonaOutputBundleRow
}

/**
 * 번들 거절. 사유를 페르소나의 taboos 슬롯에 누적.
 */
export async function rejectBundle(
  supabase: Client,
  bundleId: string,
  userId: string,
  reason: string,
): Promise<PersonaOutputBundleRow> {
  const { data: bundle, error } = await supabase
    .from('persona_output_bundles')
    .update({
      status: 'rejected',
      rejected_reason: reason,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', bundleId)
    .select('*')
    .single()

  if (error) throw new Error(`번들 거절 실패: ${error.message}`)

  const bundleTyped = bundle as unknown as PersonaOutputBundleRow

  // taboos 슬롯에 사유 append (R2 인프라 재활용)
  await appendToTaboos(supabase, bundleTyped.persona_id, reason, userId).catch(
    (err) => console.warn('[bundles] taboos 누적 실패:', err),
  )

  return bundleTyped
}

// ============================================================
// 내부 헬퍼
// ============================================================

async function findTargetPersona(
  supabase: Client,
  input: CreateBundleInput,
): Promise<PersonaRow | null> {
  if (input.personaId) {
    const { data } = await supabase
      .from('personas')
      .select('*')
      .eq('id', input.personaId)
      .maybeSingle()
    return (data ?? null) as PersonaRow | null
  }
  if (!input.clubId) return null
  const { data } = await supabase
    .from('personas')
    .select('*')
    .eq('type', 'club')
    .eq('owner_id', input.clubId)
    .in('status', ['active', 'draft'])
    .order('status')
    .order('version', { ascending: false })
    .limit(1)
  return ((data?.[0] ?? null) as PersonaRow | null)
}

async function resolveOrgName(supabase: Client, persona: PersonaRow): Promise<string> {
  if (persona.type !== 'club') return persona.name
  const { data } = await supabase
    .from('clubs')
    .select('name')
    .eq('id', persona.owner_id)
    .maybeSingle<{ name: string }>()
  return data?.name ?? persona.name
}

/**
 * Discord 발행 대상 채널 결정.
 * 1) event_metadata.discord_target_channel_id 명시 있으면 우선
 * 2) event_metadata.team_id 있으면 discord_team_channels에서 해당 팀 채널
 * 3) fallback: clubs.operator_channel_id (운영자 채널)
 */
async function resolveDiscordTargetChannel(
  supabase: Client,
  personaId: string,
  eventMetadata: Record<string, unknown>,
): Promise<string | null> {
  const explicit = eventMetadata.discord_target_channel_id
  if (typeof explicit === 'string') return explicit

  const { data: persona } = await supabase
    .from('personas')
    .select('type, owner_id')
    .eq('id', personaId)
    .maybeSingle<{ type: string; owner_id: string }>()
  if (!persona || persona.type !== 'club') return null

  const teamId = eventMetadata.team_id
  if (typeof teamId === 'string') {
    const { data } = await supabase
      .from('discord_team_channels')
      .select('discord_channel_id')
      .eq('opportunity_id', teamId)
      .maybeSingle<{ discord_channel_id: string }>()
    if (data?.discord_channel_id) return data.discord_channel_id
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('operator_channel_id')
    .eq('id', persona.owner_id)
    .maybeSingle<{ operator_channel_id: string | null }>()
  return club?.operator_channel_id ?? null
}

/**
 * 운영자 Discord 채널에 번들 생성 알림.
 * 버튼 UI는 R3.1에선 생략 (단순 텍스트 + Draft 웹 링크). R3.2에서 components 추가.
 */
async function notifyOperatorOfBundle(
  supabase: Client,
  persona: PersonaRow,
  bundle: PersonaOutputBundleRow,
  outputReport: CreateBundleResult['outputs'],
): Promise<void> {
  if (persona.type !== 'club') return // project/personal은 DM 루프 R5+

  const { data: club } = await supabase
    .from('clubs')
    .select('slug, operator_channel_id, name')
    .eq('id', persona.owner_id)
    .maybeSingle<{ slug: string; operator_channel_id: string | null; name: string }>()
  if (!club?.operator_channel_id) return

  const eventLabel = EVENT_CONFIG[bundle.event_type].label
  const successCount = outputReport.filter((o) => !o.error).length
  const link = `${APP_URL}/clubs/${club.slug}/bundles/${bundle.id}`

  const content = [
    `📦 **${eventLabel}** 번들이 생성되었습니다`,
    `${successCount}/${outputReport.length}개 채널 준비됨`,
    ``,
    `웹에서 미리보기 및 편집: ${link}`,
  ].join('\n')

  // Discord 버튼: 승인은 원클릭, 거절은 웹으로 유도 (긴 사유 입력은 모바일 Discord 모달 부적합)
  await sendChannelMessageWithComponents(club.operator_channel_id, {
    content,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3, // success (green)
            label: '승인하고 발행',
            custom_id: `bundle_approve:${bundle.id}`,
          },
          {
            type: 2,
            style: 5, // link
            label: '웹에서 검토',
            url: link,
          },
        ],
      },
    ],
  })
}

/**
 * taboos 슬롯에 새 항목 append.
 * 기존 값이 { items: [] } 구조면 그대로 concat. 아니면 새로 생성.
 */
async function appendToTaboos(
  supabase: Client,
  personaId: string,
  newItem: string,
  userId: string,
): Promise<void> {
  const fieldKey: FieldKey = 'taboos'
  const { data: existing } = await supabase
    .from('persona_fields')
    .select('value')
    .eq('persona_id', personaId)
    .eq('field_key', fieldKey)
    .maybeSingle<{ value: Record<string, unknown> }>()

  const prevItems = Array.isArray(existing?.value?.items)
    ? (existing!.value.items as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  const newItems = Array.from(new Set([...prevItems, newItem]))

  await supabase.from('persona_fields').upsert(
    {
      persona_id: personaId,
      field_key: fieldKey,
      value: { items: newItems },
      source: 'auto',
      merge_strategy: 'extend',
      locked: false,
      confidence: 1.0,
      updated_by: userId,
    },
    { onConflict: 'persona_id,field_key' },
  )
}
