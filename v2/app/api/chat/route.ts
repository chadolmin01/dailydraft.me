import { type NextRequest } from 'next/server'

// Claude tool loop 가 도구 6회까지 호출 — Vercel 기본 10s 로는 부족.
// Pro 플랜이면 60s 까지 가능, Hobby 는 10s 고정 (이 설정 무시됨).
export const maxDuration = 60
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'
import { getAnthropic, CHAT_MODEL, SYSTEM_PROMPT } from '@/src/lib/anthropic/client'
import { TOOL_DEFINITIONS, executeTool, type ToolContext } from '@/src/lib/anthropic/tools'
import { consumeToken } from '@/src/lib/rate-limit'
import type Anthropic from '@anthropic-ai/sdk'
import type { Json } from '@/src/types/database'

// Anthropic SDK 의 ContentBlock[] 은 런타임상 JSON 호환이지만 TS 의 Json index
// signature 요구를 못 맞춰서 직접 대입이 안 됨. 저장 직전 한 곳에서 캐스팅.
const asJson = (v: unknown): Json => v as Json

// 챗봇 turn 1회 — 사용자 메시지를 받아 tool loop 끝까지 돌리고 최종 응답 + 저장된 행들 반환.
//
// 메시지 DB 저장 매핑:
//   - role 'user'      : 사용자 입력 ({type:'text', text})
//   - role 'assistant' : Claude 응답 (content blocks: text + tool_use)
//   - role 'tool'      : tool_result 묶음 (Anthropic API 에 user role 로 보내짐)
//
// CLAUDE.md Hard Rules: 시스템 용어 노출 금지 → 응답 텍스트만 클라이언트에 보여주고,
// tool_use / tool_result 는 history 에만 저장 (디버깅용).

const MAX_HISTORY = 30          // 너무 길어지면 비용 + 컨텍스트 한도. V1 기준 충분.
const MAX_TOOL_LOOPS = 6        // 무한 루프 방어

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // Rate limit — 매니저당 분당 20 메시지. 무한 루프 / 도용 방어.
  // 분당 20 = 3초당 1 → 정상 사용 (생각 시간 포함) 으론 절대 안 걸림.
  if (!consumeToken(`chat:${user.id}`, { capacity: 20, refillMs: 3_000 })) {
    return ApiResponse.rateLimited('잠시 후 다시 시도해 주세요. 1분에 20개까지 메시지를 보낼 수 있습니다.')
  }

  const body = (await request.json().catch(() => ({}))) as { message?: string; folder_id?: string }
  const message = body.message?.trim()
  if (!message) return ApiResponse.badRequest('message 가 필요합니다')

  const workspace = await getOrCreateWorkspace(supabase, user.id)
  const folderId = body.folder_id ?? null

  // 1) 히스토리 로드 (이번 워크스페이스 전체, 최신 N개)
  const { data: historyRows, error: historyError } = await supabase
    .from('chats')
    .select('id, role, content')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY)
  if (historyError) return ApiResponse.internalError(historyError.message)

  const history = (historyRows ?? []).reverse()

  // 2) 사용자 메시지 저장 (role='user')
  const userContent = [{ type: 'text', text: message }]
  const { data: userRow, error: userInsertError } = await supabase
    .from('chats')
    .insert({
      workspace_id: workspace.id,
      folder_id: folderId,
      role: 'user',
      content: asJson(userContent),
    })
    .select('id, role, content, created_at')
    .single()
  if (userInsertError) return ApiResponse.internalError(userInsertError.message)

  // 3) Anthropic 메시지 배열 빌드
  const messages: Anthropic.MessageParam[] = []
  for (const row of history) {
    messages.push(rowToMessage(row.role, row.content))
  }
  messages.push({ role: 'user', content: userContent as Anthropic.ContentBlockParam[] })

  const client = getAnthropic()
  const ctx: ToolContext = { supabase, userId: user.id }
  const savedRows: Array<{ id: string; role: string; content: unknown }> = [userRow]

  // 4) Tool loop
  let loopCount = 0
  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS as unknown as Anthropic.Tool[],
      messages,
    })
  } catch (e) {
    return ApiResponse.internalError(`Claude API 호출 실패: ${(e as Error).message}`)
  }

  while (response.stop_reason === 'tool_use' && loopCount < MAX_TOOL_LOOPS) {
    loopCount++

    // assistant 응답 저장 (tool_use 블록 포함)
    const { data: assistantRow, error: assistantError } = await supabase
      .from('chats')
      .insert({
        workspace_id: workspace.id,
        folder_id: folderId,
        role: 'assistant',
        content: asJson(response.content),
      })
      .select('id, role, content, created_at')
      .single()
    if (assistantError) return ApiResponse.internalError(assistantError.message)
    savedRows.push(assistantRow)

    // tool 실행
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      try {
        const result = await executeTool(ctx, block.name, block.input)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result, null, 2),
        })
      } catch (e) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `오류: ${(e as Error).message}`,
          is_error: true,
        })
      }
    }

    // tool_result 저장 (role='tool')
    const { data: toolRow, error: toolError } = await supabase
      .from('chats')
      .insert({
        workspace_id: workspace.id,
        folder_id: folderId,
        role: 'tool',
        content: asJson(toolResults),
      })
      .select('id, role, content, created_at')
      .single()
    if (toolError) return ApiResponse.internalError(toolError.message)
    savedRows.push(toolRow)

    // 다음 호출에 assistant + tool_results 이어붙임
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    try {
      response = await client.messages.create({
        model: CHAT_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOL_DEFINITIONS as unknown as Anthropic.Tool[],
        messages,
      })
    } catch (e) {
      return ApiResponse.internalError(`Claude API 호출 실패: ${(e as Error).message}`)
    }
  }

  // 5) 최종 assistant 응답 저장
  const { data: finalRow, error: finalError } = await supabase
    .from('chats')
    .insert({
      workspace_id: workspace.id,
      folder_id: folderId,
      role: 'assistant',
      content: asJson(response.content),
    })
    .select('id, role, content, created_at')
    .single()
  if (finalError) return ApiResponse.internalError(finalError.message)
  savedRows.push(finalRow)

  // 6) 클라이언트에 보여줄 텍스트만 추출
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n\n')

  return ApiResponse.ok({
    text,
    rows: savedRows,
    tool_loops: loopCount,
  })
}

// GET — 워크스페이스의 채팅 히스토리 (UI 초기 로드용)
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data: rows, error } = await supabase
    .from('chats')
    .select('id, role, content, created_at, folder_id')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.ok({ rows: rows ?? [] })
}

// DELETE — 워크스페이스의 채팅 기록 전체 삭제
export async function DELETE() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('workspace_id', workspace.id)

  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.noContent()
}

// chats.content 에 저장된 JSON 을 Anthropic API 메시지로 복원.
function rowToMessage(role: string, content: unknown): Anthropic.MessageParam {
  // role 'tool' (우리 DB 컨벤션) → Anthropic 의 user role + tool_result blocks
  if (role === 'tool') {
    return { role: 'user', content: content as Anthropic.ContentBlockParam[] }
  }
  if (role === 'assistant') {
    return { role: 'assistant', content: content as Anthropic.ContentBlockParam[] }
  }
  // user
  return { role: 'user', content: content as Anthropic.ContentBlockParam[] }
}
