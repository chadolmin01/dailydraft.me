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
import { listFolderFiles } from '@/src/lib/google/drive'
import { readRange } from '@/src/lib/google/sheets'
import { parseFilenames } from '@/src/lib/parsers/filename'
import { buildMatrix, parseRosterFromSheet, type ParsedDriveFile } from '@/src/lib/matrix'

export const TOOL_DEFINITIONS = [
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
    name: 'compose_email_draft',
    description: 'Gmail 메일 초안용 mailto 링크를 생성합니다. 자동 발송하지 않고, 매니저가 클릭해서 Gmail 에서 직접 보냅니다.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'array', items: { type: 'string' }, description: '수신자 이메일 배열' },
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
  list_folder_files: { folder_id: string }
  find_missing_teams: { folder_id: string; week: number }
  compose_email_draft: { to: string[]; subject: string; body: string }
}

type ToolName = keyof ToolInputs

export async function executeTool(
  ctx: ToolContext,
  name: string,
  input: unknown,
): Promise<unknown> {
  switch (name as ToolName) {
    case 'list_folder_files':
      return listFolderFilesTool(ctx, input as ToolInputs['list_folder_files'])
    case 'find_missing_teams':
      return findMissingTeamsTool(ctx, input as ToolInputs['find_missing_teams'])
    case 'compose_email_draft':
      return composeEmailDraftTool(input as ToolInputs['compose_email_draft'])
    default:
      throw new Error(`알 수 없는 도구: ${name}`)
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

function composeEmailDraftTool(input: ToolInputs['compose_email_draft']) {
  const params = new URLSearchParams()
  if (input.subject) params.set('subject', input.subject)
  if (input.body) params.set('body', input.body)

  const to = input.to.join(',')
  const url = `mailto:${to}?${params.toString()}`

  return {
    mailto_url: url,
    recipient_count: input.to.length,
    note: '이 링크를 클릭하면 Gmail 새 창이 열립니다. 자동 발송되지 않습니다.',
  }
}
