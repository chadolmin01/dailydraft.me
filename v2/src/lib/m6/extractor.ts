/**
 * M6 V1 Extractor — File 의 path + filename 에서 Atom 들 추출 (deterministic).
 *
 * D4 결정: LLM 파싱 X. 정규식 패턴만 사용 → 신뢰성 + 비용 0.
 * V2/V3 에서 LLM 기반 Extractor 가 추가될 때도 본 deterministic extractor 가 우선
 * 적용되고 LLM 은 폴백/보완.
 *
 * 추출 대상 (V1):
 *   - Atom { type: 'Event',  content: 'NN주차' } — 시간 단위 (UI 라벨: 일정)
 *   - Atom { type: 'Entity', content: 'NN팀' }   — 조직 단위 (UI 라벨: 주체)
 */

import type { Atom, Provenance } from './types'
import { v1ExtractedBy } from './types'

// 입력 표기 다양성 흡수 (3주차, Week 3, Wk 3, W3, 주차 3)
const WEEK_PATTERNS: RegExp[] = [
  /(\d+)\s*주차/i,
  /Week\s*(\d+)/i,
  /Wk\s*(\d+)/i,
  /W(\d+)\b/i,
  /^(\d+)\s*주$/,
  /주차\s*(\d+)/i,
]

const TEAM_PATTERNS: RegExp[] = [
  /(\d+)\s*팀/,
  /Team\s*(\d+)/i,
  /T(\d+)\b/i,
  /팀\s*(\d+)/,
  /^(\d+)조$/,
]

interface Match {
  number: number
  raw: string
}

function findWeek(s: string): Match | null {
  for (const re of WEEK_PATTERNS) {
    const m = re.exec(s)
    if (m) {
      const n = Number.parseInt(m[1], 10)
      if (!Number.isNaN(n) && n > 0 && n <= 52) return { number: n, raw: m[0] }
    }
  }
  return null
}

function findTeam(s: string): Match | null {
  for (const re of TEAM_PATTERNS) {
    const m = re.exec(s)
    if (m) {
      const n = Number.parseInt(m[1], 10)
      if (!Number.isNaN(n) && n > 0 && n <= 100) return { number: n, raw: m[0] }
    }
  }
  return null
}

export interface FileInput {
  file_id: string
  name: string
  path: string[]  // 폴더 경로 (root 빼고)
}

/**
 * 한 File 에서 추출되는 Atom 들.
 *
 * Confidence 규칙:
 *   - filename 에서 매칭 → 1.0
 *   - path 에서 매칭 → 0.85 (덜 직접적이지만 매니저가 분류한 폴더라 신뢰)
 *   - 둘 다 같은 값 → 1.0 (강한 확신)
 *
 * Provenance:
 *   - filename 출처면 location: 'filename'
 *   - path 출처면 location: 'path:<idx>' (idx = path 배열 index)
 */
export function extractAtomsFromFile(file: FileInput): Atom[] {
  const atoms: Atom[] = []
  const extracted_by = v1ExtractedBy()

  // 1) filename (확장자 제외) 에서 시도
  const stem = file.name.replace(/\.[^.]+$/, '')
  const weekInName = findWeek(stem)
  const teamInName = findTeam(stem)

  // 2) path 각 segment 에서 시도 (root 부근 우선)
  let weekInPath: { match: Match; pathIndex: number } | null = null
  let teamInPath: { match: Match; pathIndex: number } | null = null
  for (let i = 0; i < file.path.length; i++) {
    const seg = file.path[i]
    if (weekInPath === null) {
      const m = findWeek(seg)
      if (m) weekInPath = { match: m, pathIndex: i }
    }
    if (teamInPath === null) {
      const m = findTeam(seg)
      if (m) teamInPath = { match: m, pathIndex: i }
    }
  }

  // Week Atom
  if (weekInName || weekInPath) {
    const fromName = !!weekInName
    const fromPath = !!weekInPath
    const winner = weekInName ?? weekInPath!.match
    const confidence = fromName && fromPath ? 1.0 : (fromName ? 1.0 : 0.85)
    const provenance: Provenance = {
      source: {
        file_id: file.file_id,
        location: fromName ? 'filename' : `path:${weekInPath!.pathIndex}`,
        raw_text: winner.raw,
      },
      extracted_by,
    }
    atoms.push({
      id: `${file.file_id}#week`,
      type: 'Event',  // 주차 = 시간 단위 → Event (UI: 일정)
      content: `${winner.number}주차`,
      confidence,
      canonical_key: `week:${winner.number}`,
      provenance,
    })
  }

  // Team Atom
  if (teamInName || teamInPath) {
    const fromName = !!teamInName
    const fromPath = !!teamInPath
    const winner = teamInName ?? teamInPath!.match
    const confidence = fromName && fromPath ? 1.0 : (fromName ? 1.0 : 0.85)
    const provenance: Provenance = {
      source: {
        file_id: file.file_id,
        location: fromName ? 'filename' : `path:${teamInPath!.pathIndex}`,
        raw_text: winner.raw,
      },
      extracted_by,
    }
    atoms.push({
      id: `${file.file_id}#team`,
      type: 'Entity',  // 팀 = 조직 주체 → Entity (UI: 주체)
      content: `${winner.number}팀`,
      confidence,
      canonical_key: `team:${winner.number}`,
      provenance,
    })
  }

  return atoms
}

/** Atom 들 중 canonical_key 로 빠르게 찾는 헬퍼 */
export function findAtomByKey(atoms: Atom[], key: string): Atom | undefined {
  return atoms.find(a => a.canonical_key === key)
}
