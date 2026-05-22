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
import { listFolderFilesRecursive } from '@/src/lib/google/drive-recursive'
import { readRange } from '@/src/lib/google/sheets'
import { createGmailDraft } from '@/src/lib/google/gmail'
import { extractAtomsFromFile } from '@/src/lib/m6/extractor'
import { buildMatrix, parseRosterFromSheet, type FileWithAtoms } from '@/src/lib/matrix'

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
  {
    name: 'search_extracted_atoms',
    description: '이미 처리된 파일들에서 추출된 Atom 들을 조건으로 검색합니다. 매니저가 "다가오는 마감", "최근 결정사항", "어떤 팀이 뭘 요청했는지" 같은 질문을 할 때 사용. type 으로 필터하면 (예: Deadline) 빠르게 좁힐 수 있음. keyword 는 content 부분 일치. 결과에는 출처 파일명과 raw_text 포함.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'Requirement', 'Deadline', 'Constraint', 'Deliverable',
            'Metric', 'Narrative', 'Event', 'Question', 'Decision',
            'Reference', 'Definition', 'Entity',
          ],
          description: 'M6 v1.1 의 12 AtomType 중 하나 (선택). 비우면 전체.',
        },
        keyword: { type: 'string', description: 'content 안에서 찾을 부분 문자열 (선택, 한국어 가능)' },
        folder_id: { type: 'string', description: '특정 Draft folder UUID 로 제한 (선택)' },
        limit: { type: 'number', description: '최대 결과 수 (기본 30, 최대 100)' },
      },
    },
  },
  {
    name: 'get_file_atoms',
    description: '특정 처리된 파일 한 개의 모든 Atom 을 가져옵니다. processed_file UUID 가 필요. 매니저가 특정 파일의 요약을 묻거나 "○○ 보고서 내용 알려줘" 라고 할 때.',
    input_schema: {
      type: 'object',
      properties: {
        processed_file_id: { type: 'string', description: 'processed_files.id (uuid)' },
      },
      required: ['processed_file_id'],
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
  search_extracted_atoms: { type?: string; keyword?: string; folder_id?: string; limit?: number }
  get_file_atoms: { processed_file_id: string }
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
    case 'search_extracted_atoms':
      return searchExtractedAtomsTool(ctx, input as ToolInputs['search_extracted_atoms'])
    case 'get_file_atoms':
      return getFileAtomsTool(ctx, input as ToolInputs['get_file_atoms'])
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
  const { folder, filesWithAtoms, rosterTeams } = await loadFolderAndRecognize(ctx, input.folder_id)
  const matrix = buildMatrix({
    files: filesWithAtoms,
    rosterTeams,
    programStartDate: folder.program_start_date,
  })

  // 최근 활동 3개
  const recent = [...filesWithAtoms]
    .sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))
    .slice(0, 3)
    .map(f => ({ name: f.name, path: f.path.join(' / '), modified: f.modifiedTime }))

  const weeklyStats = matrix.weeks.map(week => {
    const submitted = matrix.cells.filter(c => c.week === week && c.status === 'done').length
    return { week, submitted, total: matrix.teams.length, missing: matrix.teams.length - submitted }
  })

  // 인식 출처 분포 (matrix 셀의 provenance_summary 기반)
  const provenanceCounts: Record<string, number> = { filename: 0, path: 0, mixed: 0 }
  for (const cell of matrix.cells) {
    for (const f of cell.files) {
      provenanceCounts[f.provenance_summary]++
    }
  }

  return {
    folder_name: folder.name,
    program: folder.program,
    team_count: matrix.teams.length,
    week_count: matrix.weeks.length,
    matched_files: matrix.source.fileCount,
    unmatched_files: matrix.source.unmatchedCount,
    provenance_breakdown: provenanceCounts,
    weekly_stats: weeklyStats,
    recent_activity: recent,
  }
}

// D8: 폴더 재귀 스캔 + path-based 인식 + 명단 — 모든 매트릭스 도구가 공유.
async function loadFolderAndRecognize(ctx: ToolContext, folderId: string) {
  const { data: folder, error } = await ctx.supabase
    .from('folders')
    .select('id, name, drive_folder_id, sheet_id, program, program_start_date')
    .eq('id', folderId)
    .maybeSingle()

  if (error) throw new Error(`폴더 조회 실패: ${error.message}`)
  if (!folder || !folder.drive_folder_id) throw new Error('폴더를 찾을 수 없습니다')

  const accessToken = await getValidAccessToken(ctx.userId)
  const scan = await listFolderFilesRecursive(accessToken, folder.drive_folder_id)

  const filesWithAtoms: FileWithAtoms[] = scan.files.map(f => ({
    file_id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
    path: f.path,
    atoms: extractAtomsFromFile({ file_id: f.id, name: f.name, path: f.path }),
  }))

  let rosterTeams: string[] | undefined
  if (folder.sheet_id) {
    try {
      const rows = await readRange(accessToken, folder.sheet_id, 'A:A')
      rosterTeams = parseRosterFromSheet(rows)
    } catch {}
  }

  return { folder, accessToken, scan, filesWithAtoms, rosterTeams }
}

async function listFolderFilesTool(ctx: ToolContext, input: ToolInputs['list_folder_files']) {
  const { folder, filesWithAtoms } = await loadFolderAndRecognize(ctx, input.folder_id)
  const matched = filesWithAtoms.filter(f =>
    f.atoms.some(a => a.canonical_key?.startsWith('week:')) &&
    f.atoms.some(a => a.canonical_key?.startsWith('team:')),
  )
  const unmatched = filesWithAtoms.filter(f =>
    !f.atoms.some(a => a.canonical_key?.startsWith('week:')) ||
    !f.atoms.some(a => a.canonical_key?.startsWith('team:')),
  )
  return {
    folder_name: folder.name,
    program: folder.program,
    total_files: filesWithAtoms.length,
    matched: matched.length,
    unmatched_count: unmatched.length,
    files: matched.map(f => {
      const week = f.atoms.find(a => a.canonical_key?.startsWith('week:'))!
      const team = f.atoms.find(a => a.canonical_key?.startsWith('team:'))!
      return {
        name: f.name,
        path: f.path.join(' / '),
        team: team.content,
        week: Number.parseInt(week.canonical_key!.split(':')[1], 10),
        confidence: (week.confidence + team.confidence) / 2,
      }
    }),
    unmatched_names: unmatched.map(f => ({
      name: f.name,
      path: f.path.join(' / '),
      missing: [
        f.atoms.some(a => a.canonical_key?.startsWith('week:')) ? null : '주차',
        f.atoms.some(a => a.canonical_key?.startsWith('team:')) ? null : '팀',
      ].filter(Boolean),
    })),
  }
}

async function findMissingTeamsTool(ctx: ToolContext, input: ToolInputs['find_missing_teams']) {
  const { folder, filesWithAtoms, rosterTeams } = await loadFolderAndRecognize(ctx, input.folder_id)
  const matrix = buildMatrix({
    files: filesWithAtoms,
    rosterTeams,
    programStartDate: folder.program_start_date,
  })

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

// ── M6 Atom 검색 ─────────────────────────────────────────────────────────
// 의도: 매니저가 직접 파일 열어보지 않고 자연어로 Atom 조회.
// "다가오는 마감" → type=Deadline 으로 좁힌 뒤 due_at 정렬은 호출자(LLM) 책임.
async function searchExtractedAtomsTool(
  ctx: ToolContext,
  input: ToolInputs['search_extracted_atoms'],
) {
  const { data: workspace } = await ctx.supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', ctx.userId)
    .maybeSingle()
  if (!workspace) return { atoms: [], note: '워크스페이스 없음' }

  const limit = Math.min(100, Math.max(1, input.limit ?? 30))

  // processed_files 조인해서 출처 파일명 + folder_id 같이 가져옴.
  // 의도: 결과만 보고 매니저가 원본 파일을 바로 찾을 수 있게.
  let q = ctx.supabase
    .from('extracted_atoms')
    .select(
      'id, local_id, type, content, attributes, provenance, confidence, processed_file_id, processed_files!inner(id, filename, folder_id)',
    )
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (input.type) q = q.eq('type', input.type)
  if (input.keyword) q = q.ilike('content', `%${input.keyword.replace(/[%_]/g, '\\$&')}%`)
  if (input.folder_id) {
    q = q.eq('processed_files.folder_id', input.folder_id)
  }

  const { data: rows, error } = await q
  if (error) return { atoms: [], error: error.message }

  return {
    count: rows?.length ?? 0,
    filter: {
      type: input.type ?? null,
      keyword: input.keyword ?? null,
      folder_id: input.folder_id ?? null,
    },
    atoms: (rows ?? []).map((r) => {
      const pf = (r as unknown as { processed_files: { id: string; filename: string; folder_id: string } }).processed_files
      const prov = r.provenance as { source?: { raw_text?: string; location?: string } } | null
      return {
        local_id: r.local_id,
        type: r.type,
        content: r.content,
        confidence: r.confidence,
        attributes: r.attributes,
        raw_text: prov?.source?.raw_text ?? null,
        location: prov?.source?.location ?? null,
        from_file: { processed_file_id: pf.id, filename: pf.filename, folder_id: pf.folder_id },
      }
    }),
  }
}

async function getFileAtomsTool(
  ctx: ToolContext,
  input: ToolInputs['get_file_atoms'],
) {
  const { data: workspace } = await ctx.supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', ctx.userId)
    .maybeSingle()
  if (!workspace) return { atoms: [], note: '워크스페이스 없음' }

  const { data: file, error: fileErr } = await ctx.supabase
    .from('processed_files')
    .select('id, filename, atom_count, relation_count, parsing_completed_at, parsing_error')
    .eq('id', input.processed_file_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (fileErr || !file) return { error: '해당 파일을 찾을 수 없음' }

  const { data: atoms, error: aErr } = await ctx.supabase
    .from('extracted_atoms')
    .select('local_id, type, content, attributes, provenance, confidence')
    .eq('processed_file_id', input.processed_file_id)
    .order('local_id', { ascending: true })
  if (aErr) return { error: aErr.message }

  return {
    file: {
      filename: file.filename,
      atom_count: file.atom_count,
      relation_count: file.relation_count,
      processed_at: file.parsing_completed_at,
      parsing_error: file.parsing_error,
    },
    atoms: (atoms ?? []).map((a) => {
      const prov = a.provenance as { source?: { raw_text?: string; location?: string } } | null
      return {
        local_id: a.local_id,
        type: a.type,
        content: a.content,
        confidence: a.confidence,
        attributes: a.attributes,
        raw_text: prov?.source?.raw_text ?? null,
        location: prov?.source?.location ?? null,
      }
    }),
  }
}
