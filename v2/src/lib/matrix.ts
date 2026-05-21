// 팀 × 주차 진행도 매트릭스 계산.
//
// spec F4 + tasks.md Day 2 — 실시간 계산 (DB 캐싱 X).
// 입력: 파일명 컨벤션으로 파싱된 Drive 파일 + (선택) Sheets 명단
// 출력: 2D 매트릭스 (행=팀, 열=주차, 셀=상태+파일목록)
//
// V1 상태값: done / empty 만. late / pending 은 program 시작일이 정해진 후 (V1.5+).

import type { ParsedFilename } from './parsers/filename'

export type CellStatus = 'done' | 'empty'

export interface ParsedDriveFile {
  id: string
  name: string
  modifiedTime: string
  parsed: ParsedFilename
}

export interface MatrixCell {
  team: string
  week: number
  status: CellStatus
  files: Array<{ id: string; name: string; modifiedTime: string }>
}

export interface MatrixData {
  teams: string[]          // 표시 순서
  weeks: number[]          // 1, 2, 3, ...
  cells: MatrixCell[]      // teams.length * weeks.length 개
  source: {
    teamSource: 'roster' | 'derived'
    rosterSize?: number
    fileCount: number
  }
}

interface BuildInput {
  parsedFiles: ParsedDriveFile[]
  rosterTeams?: string[]   // Sheets 에서 읽은 명단 (있으면 우선)
  weeksOverride?: number   // UI 에서 명시적으로 N 주차까지 보고 싶을 때
}

export function buildMatrix({ parsedFiles, rosterTeams, weeksOverride }: BuildInput): MatrixData {
  // 1) 팀 목록 결정 — 명단 시트 있으면 그대로, 없으면 파싱된 파일에서 추출
  const teamsFromFiles = Array.from(new Set(parsedFiles.map(f => f.parsed.team)))
  const useRoster = rosterTeams && rosterTeams.length > 0
  const teams = useRoster
    ? [...rosterTeams!]
    : teamsFromFiles.sort(compareTeam)

  // 2) 주차 범위 — override 있으면 그대로, 없으면 최대 주차까지
  const weeksFromFiles = parsedFiles.map(f => f.parsed.week)
  const maxWeek = weeksFromFiles.length > 0 ? Math.max(...weeksFromFiles) : 1
  const weekCount = weeksOverride ?? maxWeek
  const weeks = Array.from({ length: weekCount }, (_, i) => i + 1)

  // 3) 파일을 team|week 키로 그룹핑
  const groups = new Map<string, ParsedDriveFile[]>()
  for (const f of parsedFiles) {
    const key = `${f.parsed.team}|${f.parsed.week}`
    const arr = groups.get(key) ?? []
    arr.push(f)
    groups.set(key, arr)
  }

  // 4) 셀 생성
  const cells: MatrixCell[] = []
  for (const team of teams) {
    for (const week of weeks) {
      const key = `${team}|${week}`
      const files = groups.get(key) ?? []
      cells.push({
        team,
        week,
        status: files.length > 0 ? 'done' : 'empty',
        files: files.map(f => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime })),
      })
    }
  }

  return {
    teams,
    weeks,
    cells,
    source: {
      teamSource: useRoster ? 'roster' : 'derived',
      rosterSize: useRoster ? rosterTeams!.length : undefined,
      fileCount: parsedFiles.length,
    },
  }
}

// "3팀" < "10팀" 처럼 숫자 부분 기준 정렬
function compareTeam(a: string, b: string): number {
  const na = Number.parseInt(a, 10)
  const nb = Number.parseInt(b, 10)
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b)
  return na - nb
}

/**
 * Sheets 의 첫 열을 명단으로 해석.
 * 빈 값 / 헤더로 보이는 값 ('팀명', '팀', '#' 등) 은 skip.
 */
const HEADER_HINTS = ['팀명', '팀', 'team', '#', '번호', '순번']

export function parseRosterFromSheet(rows: string[][]): string[] {
  const teams: string[] = []
  for (const row of rows) {
    const cell = row[0]?.trim()
    if (!cell) continue
    if (HEADER_HINTS.includes(cell.toLowerCase())) continue
    if (HEADER_HINTS.includes(cell)) continue
    teams.push(cell)
  }
  return teams
}
