// 팀 × 주차 진행도 매트릭스 — M6 v1.1 Atom 기반.
//
// spec F4 + D8 (인식 확장):
//   입력 = File 리스트 + 각 File 에서 추출된 Atom 들 (week=Event, team=Entity).
//   처리 = 같은 File 의 week Atom + team Atom 쌍을 한 셀에 카운트.
//
// 명단 시트 (rosterTeams) 가 있으면 그 팀 목록 우선, 없으면 Atom 에서 추출.
// 실시간 계산 (DB 캐싱 X).

import type { Atom } from './m6/types'

export type CellStatus = 'done' | 'pending' | 'late' | 'empty'

/** File + 그 File 에서 추출된 Atom 들. matrix 의 입력 단위. */
export interface FileWithAtoms {
  file_id: string
  name: string
  modifiedTime: string
  path: string[]
  atoms: Atom[]
}

export interface MatrixCell {
  team: string
  week: number
  status: CellStatus
  files: Array<{
    id: string
    name: string
    modifiedTime: string
    path: string[]
    /** week + team Atom 의 평균 confidence */
    confidence: number
    /** 인식 출처 요약: 'filename' | 'path' | 'mixed' */
    provenance_summary: 'filename' | 'path' | 'mixed'
  }>
}

export interface MatrixData {
  teams: string[]
  weeks: number[]
  cells: MatrixCell[]
  source: {
    teamSource: 'roster' | 'derived'
    rosterSize?: number
    fileCount: number
    unmatchedCount: number
  }
}

interface BuildInput {
  files: FileWithAtoms[]
  rosterTeams?: string[]
  weeksOverride?: number
  programStartDate?: string | null
  today?: Date
}

function calcCurrentWeek(programStartDate: string, today: Date): number {
  const start = new Date(programStartDate + 'T00:00:00')
  const ms = today.getTime() - start.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days < 0) return 0
  return Math.floor(days / 7) + 1
}

interface MatchedFile {
  file: FileWithAtoms
  weekAtom: Atom
  teamAtom: Atom
  week: number
  team: string
}

export function buildMatrix({ files, rosterTeams, weeksOverride, programStartDate, today }: BuildInput): MatrixData {
  const matched: MatchedFile[] = []
  let unmatchedCount = 0
  for (const file of files) {
    const weekAtom = file.atoms.find(a => a.canonical_key?.startsWith('week:'))
    const teamAtom = file.atoms.find(a => a.canonical_key?.startsWith('team:'))
    if (!weekAtom || !teamAtom) {
      unmatchedCount++
      continue
    }
    const weekNum = Number.parseInt(weekAtom.canonical_key!.split(':')[1], 10)
    const teamStr = teamAtom.content
    matched.push({ file, weekAtom, teamAtom, week: weekNum, team: teamStr })
  }

  const teamsFromAtoms = Array.from(new Set(matched.map(m => m.team)))
  const useRoster = rosterTeams && rosterTeams.length > 0
  const teams = useRoster
    ? [...rosterTeams!]
    : teamsFromAtoms.sort(compareTeam)

  const weeksFromAtoms = matched.map(m => m.week)
  const maxWeek = weeksFromAtoms.length > 0 ? Math.max(...weeksFromAtoms) : 1
  const weekCount = weeksOverride ?? maxWeek
  const weeks = Array.from({ length: weekCount }, (_, i) => i + 1)

  const groups = new Map<string, MatchedFile[]>()
  for (const m of matched) {
    const key = `${m.team}|${m.week}`
    const arr = groups.get(key) ?? []
    arr.push(m)
    groups.set(key, arr)
  }

  const now = today ?? new Date()
  const currentWeek = programStartDate ? calcCurrentWeek(programStartDate, now) : null

  const cells: MatrixCell[] = []
  for (const team of teams) {
    for (const week of weeks) {
      const key = `${team}|${week}`
      const matchedFiles = groups.get(key) ?? []
      let status: CellStatus
      if (matchedFiles.length > 0) {
        status = 'done'
      } else if (currentWeek === null) {
        status = 'empty'
      } else if (week < currentWeek) {
        status = 'late'
      } else if (week === currentWeek) {
        status = 'pending'
      } else {
        status = 'empty'
      }
      cells.push({
        team,
        week,
        status,
        files: matchedFiles.map(mf => {
          const confidence = (mf.weekAtom.confidence + mf.teamAtom.confidence) / 2
          const weekFromFilename = mf.weekAtom.provenance.source.location === 'filename'
          const teamFromFilename = mf.teamAtom.provenance.source.location === 'filename'
          const provenance_summary: 'filename' | 'path' | 'mixed' =
            weekFromFilename && teamFromFilename ? 'filename'
              : !weekFromFilename && !teamFromFilename ? 'path'
                : 'mixed'
          return {
            id: mf.file.file_id,
            name: mf.file.name,
            modifiedTime: mf.file.modifiedTime,
            path: mf.file.path,
            confidence,
            provenance_summary,
          }
        }),
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
      fileCount: matched.length,
      unmatchedCount,
    },
  }
}

function compareTeam(a: string, b: string): number {
  const na = Number.parseInt(a, 10)
  const nb = Number.parseInt(b, 10)
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b)
  return na - nb
}

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
