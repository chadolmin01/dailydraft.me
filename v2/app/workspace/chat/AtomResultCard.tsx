'use client'

import { Sparkles } from 'lucide-react'

/**
 * 챗 안에서 search_extracted_atoms / get_file_atoms 도구 결과를 인라인으로 표시.
 * 매니저는 LLM 의 자연어 요약 + 추출된 Atom 데이터 둘 다 본다.
 * 클릭하면 출처 파일을 새 창에서 열 수 있게.
 */

export interface InlineAtom {
  type: string
  content: string
  confidence: number
  raw_text?: string | null
  location?: string | null
  from_file?: { processed_file_id: string; filename: string; folder_id: string } | null
}

export interface AtomResultBlock {
  count: number
  filter?: { type?: string | null; keyword?: string | null; folder_id?: string | null }
  atoms: InlineAtom[]
}

const ATOM_LABEL: Record<string, string> = {
  Requirement: '요구사항', Deadline: '마감', Constraint: '제약',
  Deliverable: '산출물', Metric: '수치', Narrative: '서술',
  Event: '이벤트', Question: '질문', Decision: '결정',
  Reference: '참조', Definition: '정의', Entity: '주체',
}

export function AtomResultCard({ block }: { block: AtomResultBlock }) {
  const top = block.atoms.slice(0, 5)
  const more = block.atoms.length - top.length

  return (
    <div className="chat-bubble-in rounded-2xl bg-surface-soft border border-hairline px-4 py-3 max-w-[92%]">
      <div className="flex items-center gap-2 mb-2 text-caption text-muted">
        <Sparkles size={12} />
        <span>{block.filter?.type ? `${ATOM_LABEL[block.filter.type] ?? block.filter.type} 항목 ` : '추출 항목 '}{block.count}건</span>
      </div>
      <ul className="space-y-1.5">
        {top.map((a, i) => (
          <li key={i} className="text-body-sm text-ink space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-caption text-muted-soft shrink-0">
                {ATOM_LABEL[a.type] ?? a.type}
              </span>
              <span className="flex-1 min-w-0">{a.content}</span>
            </div>
            {a.from_file?.filename ? (
              <p className="text-caption text-muted-soft truncate">
                {a.from_file.filename}
                {a.location ? ` · ${a.location}` : ''}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {more > 0 ? (
        <p className="text-caption text-muted-soft mt-2">… 외 {more}건</p>
      ) : null}
    </div>
  )
}

// chat row content (tool_result blocks) 에서 atom 검색 결과만 발췌.
export function extractAtomResults(content: unknown): AtomResultBlock[] {
  const out: AtomResultBlock[] = []
  if (!Array.isArray(content)) return out
  for (const block of content) {
    if (typeof block !== 'object' || block === null) continue
    if (!('type' in block) || (block as { type: unknown }).type !== 'tool_result') continue
    const inner = (block as { content: unknown }).content
    if (typeof inner !== 'string') continue
    try {
      const parsed = JSON.parse(inner) as Record<string, unknown>
      // search_extracted_atoms / get_file_atoms 둘 다 atoms 키 사용
      if (Array.isArray(parsed.atoms)) {
        out.push({
          count: typeof parsed.count === 'number' ? parsed.count : parsed.atoms.length,
          filter: parsed.filter as AtomResultBlock['filter'] | undefined,
          atoms: parsed.atoms as InlineAtom[],
        })
      }
    } catch {}
  }
  return out
}
