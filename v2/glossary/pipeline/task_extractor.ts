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
import { GoogleGenAI } from '@google/genai'
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

응답 JSON 스키마 (짧은 키 — 출력 토큰 절감 목적, 절대 풀네임으로 바꾸지 말 것):
{
  "a": [
    { "i": "R1", "t": "Requirement", "c": "≤ 500자 atom 본문", "r": "원문 발췌 ≤ 80자" }
  ],
  "r": [
    { "f": "R1", "t": "D1", "k": "requires" }
  ]
}

키 매핑 (이 6개만 사용, 다른 키 출력 금지):
- a = atoms 배열
- i = atom id (R1/D1/E1 등 prefix + 번호)
- t = AtomType (12개 중 하나, PascalCase EXACT name)
- c = content (≤ 500자, 독립적으로 의미)
- r = raw_text (원문 그대로 발췌, ≤ 80자, 마크다운 부호 제거)
- r (relations 안의 r) = relations 배열
- f = from atom id
- t (relation 안의 t) = to atom id
- k = RelationType (10개 중 하나)

서버가 자동 채우는 것 (출력 금지): id prefix 외 메타, attributes, confidence, provenance wrapper, location, file_id, extracted_by, timestamp.

핵심 규칙:
- 모든 atom 은 r (raw_text) 필수. 원문에 정확히 포함된 60자 이내 fragment.
- 같은 문장의 여러 Metric (예: "부산 2건, 광주 2건, 대전 1건") 은 각각 분리.
- 추론 금지 — 본문에 없는 정보 생성 X.
- Atom id prefix: R(Requirement), D(Deadline), E(Entity), M(Metric), C(Constraint), Q(Question), DL(Deliverable), N(Narrative), Ev(Event), Dc(Decision), Rf(Reference), Df(Definition).
- 응답은 ONLY valid JSON. 마크다운 코드블록 (\`\`\`json) 사용 금지.

타입별 추출 가이드 (자주 누락되는 패턴):
- Requirement: 과거형 "X를 했습니다" 뿐 아니라 미래/계획형도 포함. "다음 주차에 X 할 예정", "Y 까지 Z 준비하겠습니다", "A 를 진행할 계획" 같은 표현 = 명시적 작업이면 Requirement.
- Entity: 사람만 아님. 팀 (예: "3팀") 도 entity_kind="team", 조직/회사/사업단 (예: "창교", "LINC 사업단") 도 entity_kind="organization". 문서 본문에 한 번이라도 주체로 언급되면 추출.
- Deadline: 단순 날짜 언급 + "까지" 조사 = Deadline. due_at 은 YYYY-MM-DD 표준화.
- Constraint: 형식/수량 제한 (예: "PDF 10페이지 이내", "NRF 표준양식") 은 별도 Constraint, 관련 Requirement 와 references 관계 연결.
- Question: 불확실하거나 외부 의존 요청 (예: "○○에서 ... 가능할지 문의") = Question. asker_ref / addressee_ref attributes 함께.
`

export const TASK_EXTRACTOR_VERSION = 'm6-task-extractor-v1.1-multiprovider'
export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
export const FALLBACK_MODEL = 'gemini-2.5-flash'

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

  // 의도: 1차 Anthropic. SDK 가 자동 retry (429/5xx, default max_retries=2) 함 — 우리 별도 retry 루프 없음.
  //       실패 시 typed exception 으로 분기:
  //         - AuthenticationError(401)/PermissionDeniedError(403): API 키 문제 → fallback 무의미, throw
  //         - BadRequestError(400, AUP classifier 거부 포함) / 그 외 retry 소진 후 실패 → Gemini fallback 경유.
  //       caching 비활성: Haiku 4.5 의 최소 캐시 임계값(4096 토큰) 보다 시스템 프롬프트(~1600) 가 작아서
  //       cache_control 걸어도 silently 거부됨 → 굳이 두지 않음 (cosmetic 노이즈 제거).
  let rawText: string
  let actualModel = model

  const callAnthropic = () =>
    client.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

  let anthropicResp: Awaited<ReturnType<typeof callAnthropic>> | undefined
  let lastError: Error | undefined
  try {
    anthropicResp = await callAnthropic()
  } catch (e) {
    lastError = e as Error
    // 키/권한 문제는 Gemini 도 못 살림 — 진짜 인프라 장애로 그대로 throw.
    if (
      e instanceof Anthropic.AuthenticationError ||
      e instanceof Anthropic.PermissionDeniedError
    ) {
      throw e
    }
    // 그 외 모든 케이스 (AUP 400 거부, 5xx SDK retry 소진, 네트워크 에러 등) 는 Gemini 시도.
  }

  if (anthropicResp) {
    rawText = anthropicResp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
    // 의도: 토큰 사용량 측정 (병목 진단). DRAFT_LOG_USAGE=1 일 때만 출력.
    if (process.env.DRAFT_LOG_USAGE) {
      const u = anthropicResp.usage
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        provider: 'anthropic',
        model,
        input_tokens: u.input_tokens,
        output_tokens: u.output_tokens,
      }, null, 2))
    }
  } else {
    // Anthropic 막힘 → Gemini fallback. GEMINI_API_KEY 없으면 원래 에러 throw.
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        `Anthropic API 실패 + GEMINI_API_KEY 미설정. GEMINI_API_KEY 설정하면 자동 우회합니다. (원본: ${lastError?.message ?? 'unknown'})`,
      )
    }
    try {
      const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const geminiResp = await gemini.models.generateContent({
        model: FALLBACK_MODEL,
        contents: [
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction: systemPrompt,
          // JSON 응답 강제 — 마크다운 wrap 사고 차단
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })
      const candidateText = geminiResp.text ?? ''
      if (!candidateText.trim()) {
        throw new Error('Gemini fallback: 빈 응답')
      }
      rawText = candidateText
      actualModel = FALLBACK_MODEL
      if (process.env.DRAFT_LOG_USAGE) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ provider: 'gemini', model: FALLBACK_MODEL, reason: lastError?.message ?? 'unknown' }, null, 2))
      }
    } catch (e) {
      throw new Error(
        `Anthropic + Gemini 모두 실패. Anthropic: ${lastError?.message ?? '?'} · Gemini: ${(e as Error).message}`,
      )
    }
  }

  // JSON 파싱
  // 의도: LLM 은 짧은 키 (i/t/c/r, f/t/k) 로 출력 — 출력 토큰 절감.
  //       파싱 단에서 full schema (id/type/content/raw_text 등) 로 wrap.
  //       LLM 이 가끔 풀네임으로 응답하는 경우도 대비 (legacy fallback).
  interface ShortAtom { i?: string; t?: string; c?: string; r?: string }
  interface ShortRelation { f?: string; t?: string; k?: string }
  // legacy 호환 — 풀네임으로 응답한 경우 short 로 매핑
  type LegacyAtom = { id?: string; type?: string; content?: string; provenance?: { source?: { raw_text?: string } } }
  type LegacyRelation = { from?: string; to?: string; type?: string }
  function asShortAtom(x: unknown): ShortAtom {
    const o = x as ShortAtom & LegacyAtom
    return {
      i: o.i ?? o.id,
      t: o.t ?? o.type,
      c: o.c ?? o.content,
      r: o.r ?? o.provenance?.source?.raw_text,
    }
  }
  function asShortRelation(x: unknown): ShortRelation {
    const o = x as ShortRelation & LegacyRelation
    return {
      f: o.f ?? o.from,
      t: o.t ?? o.to,
      k: o.k ?? o.type,
    }
  }

  let parsed: { a?: unknown[]; r?: unknown[]; atoms?: unknown[]; relations?: unknown[] }
  try {
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
    model: actualModel,
    extractor_version: TASK_EXTRACTOR_VERSION,
    extracted_at: new Date().toISOString(),
  }
  // 의도: confidence 는 LLM 이 0.95 남발 + 출력 토큰 낭비 → 서버 default.
  //       향후 grounding 신호 (raw_text 매칭률 등) 로 동적 계산 여지.
  const DEFAULT_CONFIDENCE = 0.8

  const rawAtoms = parsed.a ?? parsed.atoms ?? []
  for (const a of rawAtoms) {
    const s = asShortAtom(a)
    if (!s.i || typeof s.i !== 'string') {
      issues.push(`atom 에 id 없음: ${JSON.stringify(a)}`)
      continue
    }
    if (!s.t || !(ATOM_TYPES as readonly string[]).includes(s.t)) {
      issues.push(`atom ${s.i}: invalid type "${s.t}"`)
      continue
    }
    if (!s.c || s.c.length > 500) {
      issues.push(`atom ${s.i}: content 빈/500자 초과`)
      continue
    }
    if (!s.r) {
      issues.push(`atom ${s.i}: raw_text 없음`)
      continue
    }
    atoms.push({
      id: s.i,
      type: s.t as AtomType,
      content: s.c,
      attributes: {},
      provenance: {
        source: {
          file_id: fileId,
          location: '',
          raw_text: s.r,
        },
        extracted_by,
      },
      confidence: DEFAULT_CONFIDENCE,
    })
  }

  const relations: ExtractedRelation[] = []
  const atomIds = new Set(atoms.map(a => a.id))
  const rawRelations = parsed.r ?? parsed.relations ?? []
  for (const r of rawRelations) {
    const s = asShortRelation(r)
    if (!s.f || !s.t || !s.k) continue
    if (!(RELATION_TYPES as readonly string[]).includes(s.k)) {
      issues.push(`relation: invalid type "${s.k}"`)
      continue
    }
    if (!atomIds.has(s.f) || !atomIds.has(s.t)) {
      issues.push(`relation: from/to atom id 없음 (${s.f} → ${s.t})`)
      continue
    }
    relations.push({
      from: s.f,
      to: s.t,
      type: s.k as RelationType,
      confidence: DEFAULT_CONFIDENCE,
    })
  }

  // 4중 방어선 #3: raw_text grounding (hallucination check).
  // 의도: markdown bold/italic/heading 부호는 normalize 후 비교.
  // 마크다운으로 둘러싸인 텍스트라도 의미 단위가 원문에 있으면 grounded 로 인정.
  const normalize = (s: string) =>
    s
      .replace(/[*_`#~]/g, '')      // markdown 부호 제거
      .replace(/\s+/g, ' ')         // 공백 정규화
      .trim()
  const normText = normalize(text)
  let groundedCount = 0
  for (const atom of atoms) {
    const normRaw = normalize(atom.provenance.source.raw_text)
    if (normText.includes(normRaw)) {
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
