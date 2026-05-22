/**
 * M6 v1.1 Task Extractor — File 의 텍스트에서 Atom 들과 Relation 들 추출.
 *
 * 단일 LLM 호출 (Anthropic Claude) 로 12 AtomType + 10 RelationType 분류.
 * Glossary v1.1 system prompt + ATOM_TYPE_GUIDES 주입.
 * 4중 방어선 #2 (런타임): JSON Schema 검증 + raw_text grounding.
 *
 * 사용:
 *   const result = await extractFromText(text, fileId)
 *   // result: { atoms: Atom[], relations: Relation[] }
 *
 * 비용 최적화: Haiku 4.5 사용 (Sonnet 의 1/12), 프롬프트 캐싱.
 */

import Anthropic from '@anthropic-ai/sdk'
import { ATOM_TYPES, RELATION_TYPES, type AtomType, type RelationType } from '../glossary'

// System prompt 인라인 — Next.js 서버리스 번들에서 readFileSync 의존 회피.
// 원본 소스(단일 진실 소스): glossary/system_prompt_glossary.md.
// 글로서리 md 가 바뀌면 여기 const 도 같이 업데이트할 것 (Hard Rule).
const GLOSSARY_SYSTEM = `# M6 Glossary — System Prompt Injection v1.1

You are working within the M6 atomic workspace system. Use these exact terms:

## Core Vocabulary

**Atom**: An indivisible unit of meaning extracted from a File. Every Atom has:
- one of 12 AtomTypes
- content (≤ 500 chars, independently meaningful)
- Provenance (where it came from)
- confidence score [0, 1]

**12 AtomTypes** (use these names EXACTLY, never invent new ones):
- Requirement, Deadline, Constraint  (what must be done)
- Deliverable, Metric, Narrative  (what is produced)
- Event, Question, Decision  (what happens)
- Reference, Definition  (what is cited)
- Entity  (who/what is involved)

**10 RelationTypes** (typed edges between Atoms, use these names EXACTLY):
- requires, fulfills, references
- assigned_to, produced_by
- temporally_after, responds_to, triggers
- approves, evolves_to

**Triple**: (subject Atom, RelationType, object Atom). The unit of knowledge in M6.

**File**: Uploaded artifact (PDF, HWP, DOCX, etc.). The source of Atoms.

**Provenance**: Required trace on every Atom. Includes source File ID, location, raw_text fragment, extraction model.

**Graph**: The collection of all active Atoms and Relations for one Tenant.

**Tenant**: One isolated organization.

## Critical Rules

1. **Every Atom MUST have Provenance**. An Atom without Provenance is INVALID and will be rejected.
2. **Atom content must be independently meaningful**. "87명" alone is not a valid Metric. "2026-1학기 캡스톤디자인 참여 학생 87명" is.
3. **Atom content ≤ 500 characters**. If a candidate exceeds this, it is NOT atomic — break it down.
4. **Use exact AtomType names**. "Req" / "요구사항" / "requirement" are all WRONG. Only "Requirement" (PascalCase, English).
5. **Cite Atoms when producing Outputs**. Every claim in an Output must be backed by Citations referencing specific Atom IDs.

## Glossary Version

M6 Glossary v1.1 (locked). If you find yourself wanting to invent a new term, STOP and use existing vocabulary.
`

// AtomType 별 추출 가이드. system prompt 의 8 line 만 (긴 가이드는 ATOM_TYPE_GUIDES 별도).
const EXTRACTION_INSTRUCTIONS = `
당신의 임무: 주어진 한국어 텍스트에서 Atom 과 Relation 을 추출하세요.

응답 JSON 스키마:
{
  "atoms": [
    {
      "id": "string (R1/D1/E1 등 prefix + 번호)",
      "type": "12 AtomTypes 중 하나 — EXACT name (PascalCase, English)",
      "content": "≤ 500자, 독립적으로 의미 있게",
      "attributes": { "key": "value 자유 형식" },
      "provenance": {
        "source": {
          "file_id": "주어진 file_id",
          "location": "section N — 제목 / header / etc",
          "raw_text": "원문에서 직접 인용한 fragment (글자 그대로)"
        }
      },
      "confidence": 0.0~1.0
    }
  ],
  "relations": [
    { "from": "atom_id", "to": "atom_id", "type": "10 RelationTypes 중 하나", "confidence": 0.0~1.0 }
  ]
}

핵심 규칙:
- 모든 Atom 은 Provenance 필수. raw_text 가 원문에 정확히 포함되어야 함 (hallucination 금지).
- 같은 문장의 여러 Metric (예: "부산 2건, 광주 2건, 대전 1건") 은 각각 분리.
- 명시 안 된 attribute 은 비울 것. 추론으로 채우지 말 것.
- Atom id 는 prefix 사용: R(Requirement), D(Deadline), E(Entity), M(Metric), C(Constraint), Q(Question), DL(Deliverable), N(Narrative), Ev(Event), Dc(Decision), Rf(Reference), Df(Definition).
- 응답은 ONLY valid JSON. 마크다운 코드블록 사용 금지.
`

export const TASK_EXTRACTOR_VERSION = 'm6-task-extractor-v1.0'
export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'

export interface ExtractedAtom {
  id: string
  type: AtomType
  content: string
  attributes: Record<string, unknown>
  provenance: {
    source: { file_id: string; location: string; raw_text: string }
    extracted_by: { model: string; extractor_version: string; extracted_at: string }
  }
  confidence: number
}

export interface ExtractedRelation {
  from: string
  to: string
  type: RelationType
  confidence: number
}

export interface ExtractionResult {
  atoms: ExtractedAtom[]
  relations: ExtractedRelation[]
  /** 검증 통과 여부 + 사유 (4중 방어선 #2/3) */
  validation: {
    schema_compliant: boolean
    grounded: boolean
    issues: string[]
  }
  /** LLM raw response (디버깅용) */
  raw_response?: string
}

interface ExtractOptions {
  model?: string
  apiKey?: string
}

export async function extractFromText(
  text: string,
  fileId: string,
  opts: ExtractOptions = {},
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey: opts.apiKey ?? process.env.ANTHROPIC_API_KEY! })
  const model = opts.model ?? DEFAULT_MODEL

  const systemPrompt = GLOSSARY_SYSTEM + '\n\n---\n\n' + EXTRACTION_INSTRUCTIONS

  const userMessage = `다음 텍스트에서 Atom 과 Relation 을 추출하세요. file_id = "${fileId}".

---

${text}`

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },  // prompt caching → 다음 fixture 호출 시 비용 절감
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')

  // JSON 파싱
  let parsed: { atoms: unknown[]; relations: unknown[] }
  try {
    // 모델이 가끔 ```json ... ``` 으로 감싸는 케이스 처리
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch (e) {
    return {
      atoms: [],
      relations: [],
      validation: { schema_compliant: false, grounded: false, issues: [`JSON parse 실패: ${(e as Error).message}`] },
      raw_response: rawText,
    }
  }

  // 4중 방어선 #2: schema validation
  const issues: string[] = []
  const atoms: ExtractedAtom[] = []
  const extracted_by = {
    model,
    extractor_version: TASK_EXTRACTOR_VERSION,
    extracted_at: new Date().toISOString(),
  }

  for (const a of parsed.atoms ?? []) {
    const atom = a as Partial<ExtractedAtom>
    if (!atom.id || typeof atom.id !== 'string') {
      issues.push(`atom 에 id 없음: ${JSON.stringify(a)}`)
      continue
    }
    if (!atom.type || !(ATOM_TYPES as readonly string[]).includes(atom.type)) {
      issues.push(`atom ${atom.id}: invalid type "${atom.type}"`)
      continue
    }
    if (!atom.content || atom.content.length > 500) {
      issues.push(`atom ${atom.id}: content 빈/500자 초과`)
      continue
    }
    if (typeof atom.confidence !== 'number' || atom.confidence < 0 || atom.confidence > 1) {
      issues.push(`atom ${atom.id}: invalid confidence ${atom.confidence}`)
      continue
    }
    if (!atom.provenance?.source?.raw_text) {
      issues.push(`atom ${atom.id}: provenance.source.raw_text 없음`)
      continue
    }
    atoms.push({
      id: atom.id,
      type: atom.type as AtomType,
      content: atom.content,
      attributes: atom.attributes ?? {},
      provenance: {
        source: {
          file_id: atom.provenance.source.file_id || fileId,
          location: atom.provenance.source.location || '',
          raw_text: atom.provenance.source.raw_text,
        },
        extracted_by,
      },
      confidence: atom.confidence,
    })
  }

  const relations: ExtractedRelation[] = []
  const atomIds = new Set(atoms.map(a => a.id))
  for (const r of parsed.relations ?? []) {
    const rel = r as Partial<ExtractedRelation>
    if (!rel.from || !rel.to || !rel.type) continue
    if (!(RELATION_TYPES as readonly string[]).includes(rel.type)) {
      issues.push(`relation: invalid type "${rel.type}"`)
      continue
    }
    if (!atomIds.has(rel.from) || !atomIds.has(rel.to)) {
      issues.push(`relation: from/to atom id 없음 (${rel.from} → ${rel.to})`)
      continue
    }
    if (typeof rel.confidence !== 'number') continue
    relations.push({
      from: rel.from,
      to: rel.to,
      type: rel.type as RelationType,
      confidence: rel.confidence,
    })
  }

  // 4중 방어선 #3: raw_text grounding (hallucination check)
  let groundedCount = 0
  for (const atom of atoms) {
    if (text.includes(atom.provenance.source.raw_text)) {
      groundedCount++
    } else {
      issues.push(`atom ${atom.id}: raw_text "${atom.provenance.source.raw_text.slice(0, 40)}..." not in source`)
    }
  }
  const grounded = atoms.length > 0 ? groundedCount === atoms.length : true

  return {
    atoms,
    relations,
    validation: {
      schema_compliant: issues.filter(i => !i.includes('not in source')).length === 0,
      grounded,
      issues,
    },
    raw_response: rawText,
  }
}
