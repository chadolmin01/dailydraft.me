// 파일명 컨벤션 파싱 — CONVENTIONS.md / spec.md F5 참조.
//
// 형식: [{program}_{N}주차]_{팀명}_{과제명}.{ext}
// 예시: [FLIP1기_3주차]_3팀_MVP기획서.pdf
//        [KVP_2주차]_5팀_시장조사.docx
//
// 의도: LLM 파싱이 아닌 결정론적 정규식 → 신뢰성 + LLM 호출 비용 절감 (D4).

export interface ParsedFilename {
  program: string    // 예: "FLIP1기"
  week: number       // 예: 3
  team: string       // 예: "3팀"
  task: string       // 예: "MVP기획서"
  ext: string        // 예: "pdf"
}

// 패턴 분해:
//   \[(program)_(N)주차\]_(team)_(task).(ext)
const FILENAME_RE = /^\[(?<program>[^_\]]+)_(?<week>\d+)주차\]_(?<team>\d+팀)_(?<task>.+)\.(?<ext>[^.]+)$/

export function parseFilename(name: string): ParsedFilename | null {
  const m = FILENAME_RE.exec(name)
  if (!m?.groups) return null

  const { program, week, team, task, ext } = m.groups
  return {
    program,
    week: Number.parseInt(week, 10),
    team,
    task,
    ext: ext.toLowerCase(),
  }
}

/**
 * 여러 파일명 일괄 파싱 — 매칭/실패 분리해서 반환.
 */
export function parseFilenames(names: string[]): {
  parsed: Array<{ name: string; parsed: ParsedFilename }>
  unmatched: string[]
} {
  const parsed: Array<{ name: string; parsed: ParsedFilename }> = []
  const unmatched: string[] = []
  for (const name of names) {
    const result = parseFilename(name)
    if (result) parsed.push({ name, parsed: result })
    else unmatched.push(name)
  }
  return { parsed, unmatched }
}
