// Claude tool 정의 — 매니저가 자연어로 시키면 챗봇이 이 도구들을 직접 호출.
//
// CLAUDE.md Hard Rule: AI / 에이전트 용어 UI 노출 금지 →
// tool 이름·설명도 사용자에게 안 보임 (Claude 내부). 단, 도구 결과는 사용자에게 보임.
//
// V1 의 tool 셋 (최소):
//   - list_folder_files: 폴더 안 파일 + 파싱 결과
//   - find_missing_teams: 특정 주차에 미제출 팀
//   - compose_email_draft: mailto 링크 생성 (자동 발송 X — D5)

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import { getValidAccessToken } from '@/src/lib/google/tokens'
import { listFolderFiles, searchDriveItems } from '@/src/lib/google/drive'
import { readRange } from '@/src/lib/google/sheets'
import { createGmailDraft } from '@/src/lib/google/gmail'
import { parseFilenames } from '@/src/lib/parsers/filename'
import { buildMatrix, parseRosterFromSheet, type ParsedDriveFile } from '@/src/lib/matrix'

export const TOOL_DEFINITIONS = [
  {
    name: 'list_workspace_folders',
    description: '매니저의 워크스페이스에 연결된 모든 폴더 목록을 반환합니다. 사용자가 특정 폴더를 언급하지 않을 때 먼저 이 도구로 폴더 ID 와 이름을 확인하세요.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_all_folders_summary',
    description: '모든 연결된 폴더의 한 줄 요약을 병렬로 가져옵니다. 사용자가 "전체 상황", "워크스페이스 요약" 등을 물을 때 사용. 폴더당 file_count + 최근 활동 일자 반환.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_folder_summary',
    description: '폴더의 진행 상황을 한눈에 요약합니다. 팀 수, 주차 수, 매칭/미매칭 파일 수, 최근 활동 파일을 반환. 사용자가 "현황", "요약", "어떻게 돼가" 라고 물을 때 사용.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: { type: 'string', description: 'Draft folder UUID' },
      },
      required: ['folder_id'],
    },
  },
  {
    name: 'list_folder_files',
    description: '연결된 폴더 안의 Drive 파일 목록과 파일명 컨벤션 파싱 결과를 가져옵니다. 폴더 ID 가 필요합니다.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: { type: 'string', description: 'Draft 의 folder UUID (Drive 폴더 ID 가 아님)' },
      },
      required: ['folder_id'],
    },
  },
  {
    name: 'find_missing_teams',
    description: '특정 주차에 제출하지 않은 팀 목록을 반환합니다. 명단 시트가 연결돼 있으면 명단 기준, 아니면 기존 파일에서 추출한 팀 기준.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: { type: 'string', description: 'Draft folder UUID' },
        week: { type: 'number', description: '몇 주차인지 (1 이상 정수)' },
      },
      required: ['folder_id', 'week'],
    },
  },
  {
    name: 'search_drive_files',
    description: '매니저의 Google Drive 전체에서 파일을 검색합니다 (이름 + 본문 텍스트). 폴더 안 어느 위치든 찾아냅니다. 연결된 Draft 폴더에 한정되지 않습니다. 사용자가 "어디 있더라", "찾아주세요" 같은 표현 쓸 때 사용.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '검색어 (한국어 가능)' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'compose_email_draft',
    description: 'Gmail 초안함에 메일 초안을 저장합니다. 매니저가 Gmail 에서 직접 열어 검토 후 보냅니다. 자동 발송하지 않습니다.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'array', items: { type: 'string' }, description: '수신자 이메일 배열' },
        cc: { type: 'array', items: { type: 'string' }, description: '참조 이메일 배열 (선택)' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
] as const

export interface ToolContext {
  supabase: SupabaseClient<Database>
  userId: string
}

interface ToolInputs {
  list_workspace_folders: Record<string, never>
  list_all_folders_summary: Record<string, never>
  get_folder_summary: { folder_id: string }
  list_folder_files: { folder_id: string }
  find_missing_teams: { folder_id: string; week: number }
  search_drive_files: { keyword: string }
  compose_email_draft: { to: string[]; subject: string; body: string; cc?: string[] }
}

type ToolName = keyof ToolInputs

export async function executeTool(
  ctx: ToolContext,
  name: string,
  input: unknown,
): Promise<unknown> {
  switch (name as ToolName) {
    case 'list_workspace_folders':
      return listWorkspaceFoldersTool(ctx)
    case 'list_all_folders_summary':
      return listAllFoldersSummaryTool(ctx)
    case 'get_folder_summary':
      return getFolderSummaryTool(ctx, input as ToolInputs['get_folder_summary'])
    case 'list_folder_files':
      return listFolderFilesTool(ctx, input as ToolInputs['list_folder_files'])
    case 'find_missing_teams':
      return findMissingTeamsTool(ctx, input as ToolInputs['find_missing_teams'])
    case 'search_drive_files':
      return searchDriveFilesTool(ctx, input as ToolInputs['search_drive_files'])
    case 'compose_email_draft':
      return composeEmailDraftTool(ctx, input as ToolInputs['compose_email_draft'])
    default:
      throw new Error(`알 수 없는 도구: ${name}`)
  }
}

async function listWorkspaceFoldersTool(ctx: ToolContext) {
  const { data: workspaces } = await ctx.supabase
    .from('workspaces')
    .select('id, name')
    .eq('owner_id', ctx.userId)
    .maybeSingle()

  if (!workspaces) {
    return { folder_count: 0, folders: [], note: '워크스페이스가 아직 없습니다.' }
  }

  const { data: folders, error } = await ctx.supabase
    .from('folders')
    .select('id, name, program, drive_folder_id, sheet_id, created_at')
    .eq('workspace_id', workspaces.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`folders 조회 실패: ${error.message}`)

  return {
    folder_count: folders?.length ?? 0,
    folders: (folders ?? []).map(f => ({
      folder_id: f.id,
      name: f.name,
      program: f.program,
      has_sheet: !!f.sheet_id,
    })),
  }
}

async function listAllFoldersSummaryTool(ctx: ToolContext) {
  const list = await listWorkspaceFoldersTool(ctx)
  if (list.folder_count === 0) {
    return { folder_count: 0, summaries: [] }
  }

  // 폴더당 light 요약 — Drive 통계만 (매트릭스 계산 X, 비용 절감)
  const accessToken = await getValidAccessToken(ctx.userId)
  const { listFolderFiles: list_drive_files_local } = await import('@/src/lib/google/drive')

  const summaries = await Promise.all(
    list.folders.map(async (f) => {
      try {
        const folderMeta = await ctx.supabase
          .from('folders')
          .select('drive_folder_id')
          .eq('id', f.folder_id)
          .maybeSingle()
        if (!folderMeta.data?.drive_folder_id) {
          return { folder_id: f.folder_id, name: f.name, error: 'Drive folder 없음' }
        }
        const files = await list_drive_files_local(accessToken, folderMeta.data.drive_folder_id)
        const latest = files.reduce<typeof files[0] | null>((best, file) => {
          if (!best) return file
          return file.modifiedTime > best.modifiedTime ? file : best
        }, null)
        return {
          folder_id: f.folder_id,
          name: f.name,
          program: f.program,
          file_count: files.length,
          latest_file: latest?.name ?? null,
          latest_modified: latest?.modifiedTime ?? null,
        }
      } catch (e) {
        return { folder_id: f.folder_id, name: f.name, error: (e as Error).message }
      }
    }),
  )

  return { folder_count: summaries.length, summaries }
}

async function getFolderSummaryTool(ctx: ToolContext, input: ToolInputs['get_folder_summary']) {
  const { folder, accessToken, files } = await loadFolderAndFiles(ctx, input.folder_id)
  const { parsed, unmatched } = parseFilenames(files.map(f => f.name))

  const filesByName = new Map(files.map(f => [f.name, f]))
  const parsedFiles: ParsedDriveFile[] = parsed.map(({ name, parsed: p }) => {
    const file = filesByName.get(name)!
    return { id: file.id, name: file.name, modifiedTime: file.modifiedTime, parsed: p }
  })

  let rosterTeams: string[] | undefined
  if (folder.sheet_id) {
    try {
      const rows = await readRange(accessToken, folder.sheet_id, 'A:A')
      rosterTeams = parseRosterFromSheet(rows)
    } catch {}
  }

  const matrix = buildMatrix({ parsedFiles, rosterTeams })

  // 가장 최근 활동 파일 3개
  const recent = [...files]
    .sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))
    .slice(0, 3)
    .map(f => ({ name: f.name, modified: f.modifiedTime }))

  // 주차별 제출 통계
  const weeklyStats = matrix.weeks.map(week => {
    const submitted = matrix.cells.filter(c => c.week === week && c.status === 'done').length
    return { week, submitted, total: matrix.teams.length, missing: matrix.teams.length - submitted }
  })

  return {
    folder_name: folder.name,
    program: folder.program,
    team_count: matrix.teams.length,
    week_count: matrix.weeks.length,
    matched_files: parsed.length,
    unmatched_files: unmatched.length,
    weekly_stats: weeklyStats,
    recent_activity: recent,
  }
}

async function loadFolderAndFiles(ctx: ToolContext, folderId: string) {
  const { data: folder, error } = await ctx.supabase
    .from('folders')
    .select('id, name, drive_folder_id, sheet_id, program')
    .eq('id', folderId)
    .maybeSingle()

  if (error) throw new Error(`폴더 조회 실패: ${error.message}`)
  if (!folder || !folder.drive_folder_id) throw new Error('폴더를 찾을 수 없습니다')

  const accessToken = await getValidAccessToken(ctx.userId)
  const files = await listFolderFiles(accessToken, folder.drive_folder_id)
  return { folder, accessToken, files }
}

async function listFolderFilesTool(ctx: ToolContext, input: ToolInputs['list_folder_files']) {
  const { folder, files } = await loadFolderAndFiles(ctx, input.folder_id)
  const { parsed, unmatched } = parseFilenames(files.map(f => f.name))
  return {
    folder_name: folder.name,
    program: folder.program,
    total_files: files.length,
    matched: parsed.length,
    unmatched_count: unmatched.length,
    files: parsed.map(({ name, parsed }) => ({
      name,
      team: parsed.team,
      week: parsed.week,
      task: parsed.task,
    })),
    unmatched_names: unmatched,
  }
}

async function findMissingTeamsTool(ctx: ToolContext, input: ToolInputs['find_missing_teams']) {
  const { folder, accessToken, files } = await loadFolderAndFiles(ctx, input.folder_id)
  const { parsed } = parseFilenames(files.map(f => f.name))

  const filesByName = new Map(files.map(f => [f.name, f]))
  const parsedFiles: ParsedDriveFile[] = parsed.map(({ name, parsed: p }) => {
    const file = filesByName.get(name)!
    return { id: file.id, name: file.name, modifiedTime: file.modifiedTime, parsed: p }
  })

  let rosterTeams: string[] | undefined
  if (folder.sheet_id) {
    try {
      const rows = await readRange(accessToken, folder.sheet_id, 'A:A')
      rosterTeams = parseRosterFromSheet(rows)
    } catch {
      // 시트 읽기 실패 → 명단 없이 진행
    }
  }

  const matrix = buildMatrix({ parsedFiles, rosterTeams })

  const submittedTeams = new Set(
    matrix.cells.filter(c => c.week === input.week && c.status === 'done').map(c => c.team),
  )
  const missing = matrix.teams.filter(t => !submittedTeams.has(t))

  return {
    folder_name: folder.name,
    week: input.week,
    team_source: matrix.source.teamSource,
    total_teams: matrix.teams.length,
    submitted_count: submittedTeams.size,
    missing_count: missing.length,
    missing_teams: missing,
  }
}

async function searchDriveFilesTool(ctx: ToolContext, input: ToolInputs['search_drive_files']) {
  const accessToken = await getValidAccessToken(ctx.userId)
  const files = await searchDriveItems(accessToken, input.keyword, 'all')
  return {
    keyword: input.keyword,
    count: files.length,
    files: files.map(f => ({
      id: f.id,
      name: f.name,
      modified: f.modifiedTime,
      url: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`,
    })),
  }
}

async function composeEmailDraftTool(
  ctx: ToolContext,
  input: ToolInputs['compose_email_draft'],
) {
  // 우선 Gmail API 로 진짜 초안 생성 시도 — 매니저가 Gmail "초안함" 에서 바로 열 수 있음.
  // 실패 (권한 / 네트워크) 시 mailto 링크로 폴백.
  try {
    const { getValidAccessToken } = await import('@/src/lib/google/tokens')
    const accessToken = await getValidAccessToken(ctx.userId)
    const draft = await createGmailDraft(accessToken, {
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      body: input.body,
    })

    return {
      kind: 'gmail_draft',
      gmail_url: draft.gmailUrl,
      draft_id: draft.id,
      recipient_count: input.to.length,
      subject: input.subject,
      note: 'Gmail 초안함에 저장했습니다. 매니저가 Gmail 에서 열어 보내주십시오. 자동 발송되지 않습니다.',
    }
  } catch (e) {
    // mailto 폴백 — 클라이언트가 새 창 띄움
    const params = new URLSearchParams()
    if (input.subject) params.set('subject', input.subject)
    if (input.body) params.set('body', input.body)
    const url = `mailto:${input.to.join(',')}?${params.toString()}`

    return {
      kind: 'mailto',
      mailto_url: url,
      recipient_count: input.to.length,
      subject: input.subject,
      fallback_reason: `Gmail 초안 저장 실패: ${(e as Error).message}`,
      note: '이 링크를 클릭하면 Gmail 새 창이 열립니다. 자동 발송되지 않습니다.',
    }
  }
}
