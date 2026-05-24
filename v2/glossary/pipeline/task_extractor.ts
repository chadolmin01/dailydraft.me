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
- 모든 atom 은 r (raw_text) 필수. 원문에 정확히 포함된 80자 이내 fragment. **의역/요약 금지** — 원문 글자 그대로 복사.
- **한 문장의 여러 제약/항목은 모두 분리**. 예: "15명 이상, 3개 단과대 이상, 학번 2/3 이하" → Constraint 3개. "부산 2건, 광주 2건, 대전 1건" → Metric 3개. 통합 atom 금지.
- 추론 금지 — 본문에 없는 정보 생성 X.
- Atom id prefix: R(Requirement), D(Deadline), E(Entity), M(Metric), C(Constraint), Q(Question), DL(Deliverable), N(Narrative), Ev(Event), Dc(Decision), Rf(Reference), Df(Definition).
- 응답은 ONLY valid JSON. 마크다운 코드블록 (\`\`\`json) 사용 금지.

**RelationType 10개 — 이 10개만 사용. 절대 변형/추가 금지:**
\`requires\`, \`fulfills\`, \`references\`, \`assigned_to\`, \`produced_by\`, \`temporally_after\`, \`responds_to\`, \`triggers\`, \`approves\`, \`evolves_to\`
- "produces" / "produced" / "creates" / "depends_on" 등은 잘못된 이름. 가장 가까운 위 10개 중 하나로 치환할 것 (예: produces → produced_by 반대 방향).
- relation type 잘못 쓰면 서버에서 reject 됨.

타입별 추출 가이드 (자주 누락/혼동 패턴):
- Requirement: 과거형 "X를 했습니다" 뿐 아니라 미래/계획형도 포함. "다음 주차에 X 할 예정", "Y 까지 Z 준비하겠습니다", "A 를 진행할 계획" 같은 표현 = 명시적 작업이면 Requirement.
- Entity: 사람만 아님. 팀 (예: "3팀") 도 Entity, 조직/회사/사업단 (예: "창교", "LINC 사업단") 도 Entity, 동아리 (예: "FLIP") 도 Entity. 문서 본문에 한 번이라도 주체로 언급되면 추출.
- Deadline: 단순 날짜 언급 + "까지" 조사 = Deadline. due_at 은 YYYY-MM-DD 표준화.
- Constraint: 형식/수량/자격 제한 (예: "PDF 10페이지 이내", "NRF 표준양식", "재적생 3분의 2 이상") 은 Constraint. 관련 Requirement 와 references 관계 연결.
- Question: 불확실하거나 외부 의존 요청 (예: "○○에서 ... 가능할지 문의") = Question.
- Definition: 용어/자격을 명시적으로 규정 (예: "정회원은 X 인 자로 한다") = Definition. Constraint 와 구분 — Definition 은 "정의", Constraint 는 "제한".
- Reference: 외부 문서/조항 인용 (예: "회칙 제6조", "NRF 표준양식 v3") = Reference. 본문 내 다른 atom 참조와 혼동 X.

**표/명단 등 정형 데이터 가이드** (회원명단/예산표/출석부):
- 각 행 (사람 1명, 항목 1개) = 별도 Entity 또는 Metric. 표 전체를 1개 atom 으로 묶지 말 것.
- 열 이름 (예: "단과대학", "학과") 자체는 atom 아님 — 행의 값을 atom 의 attribute 또는 content 로.
- 표 헤더 다음 행부터 추출. 빈 행/구분선 무시.
- 표 위/아래에 메타 문장 (예: "총 26명", "2026학년도 1학기") 있으면 별도 Metric/Event 로 추출.
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

// 의도: 입력 통일 (input normalization) — LLM 호출 전 거친 text 의 위험 패턴 진단.
//       토큰 폭주 / 정형 데이터 variance 의 근본 원인이 "거친 입력" 이라 사전 가드.

// 입력 사이즈 가드 임계값.
// Haiku 4.5 context 200K 안에 들어가지만, 큰 입력 → 큰 출력 (atom 수 비례) → max_tokens 8192 도달.
// 50K chars (≈ 12K input tokens) 이상이면 atom 수 ~50 초과 위험 → 잘림.
const MAX_INPUT_CHARS = 50_000

// 반복 패턴 감지 — 표/명단 자동 인식.
// 라인의 50% 이상이 같은 column 수 (',' split) 의 CSV row 면 표/명단으로 간주.
// 검출 시 prompt prefix 로 LLM 에 힌트 (모든 행 atom 화 X, 메타 위주).
const TABLE_DETECT_MIN_ROWS = 10
const TABLE_DETECT_RATIO = 0.5

function detectTablePattern(text: string): { isTable: boolean; rowCount: number; cols: number } {
  const lines = text.split('\n').filter(l => l.trim() !== '')
  if (lines.length < TABLE_DETECT_MIN_ROWS) return { isTable: false, rowCount: 0, cols: 0 }
  // 각 라인의 ',' 갯수 분포 → 최빈값
  const commaCounts = lines.map(l => (l.match(/,/g) ?? []).length)
  const freq = new Map<number, number>()
  for (const c of commaCounts) freq.set(c, (freq.get(c) ?? 0) + 1)
  let topCols = 0, topN = 0
  for (const [c, n] of freq) {
    if (c >= 2 && n > topN) { topCols = c; topN = n }
  }
  return {
    isTable: topN / lines.length >= TABLE_DETECT_RATIO,
    rowCount: topN,
    cols: topCols + 1,
  }
}

export async function extractFromText(
  text: string,
  fileId: string,
  opts: ExtractOptions = {},
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey: opts.apiKey ?? process.env.ANTHROPIC_API_KEY! })
  const model = opts.model ?? DEFAULT_MODEL

  const systemPrompt = GLOSSARY_SYSTEM + '\n\n---\n\n' + EXTRACTION_INSTRUCTIONS

  // N6: 입력 사이즈 가드 — 50K char 초과 시 자르고 issues 에 경고.
  //     완전 reject 대신 truncate — 매니저가 결과 아무것도 못 받는 것보단 부분이라도 받게.
  const preflightIssues: string[] = []
  let inputText = text
  if (text.length > MAX_INPUT_CHARS) {
    preflightIssues.push(`input truncated: ${text.length} chars → ${MAX_INPUT_CHARS} (뒷부분 처리 안 됨, 큰 파일은 분할 권장)`)
    inputText = text.slice(0, MAX_INPUT_CHARS)
  }

  // N5: 반복 패턴 감지 — 표/명단이면 LLM 에 힌트 prefix.
  //     binary-parser 의 XLSX 단계에서 이미 안내 추가했지만, PDF/DOCX 안의 표나
  //     CSV 직접 업로드는 여기서 catch.
  const tableInfo = detectTablePattern(inputText)
  const tableHint = tableInfo.isTable
    ? `\n[자동 감지: 이 텍스트는 표/명단 패턴 (${tableInfo.rowCount}행, ${tableInfo.cols}열 추정). 모든 행을 atom 화 X — 메타데이터 (총 행수, 컬럼 종류) + 대표 sample 위주 추출. 정형 데이터의 행은 1개 Metric 이나 대표 Entity 로 압축.]\n`
    : ''

  const userMessage = `다음 텍스트에서 Atom 과 Relation 을 추출하세요. file_id = "${fileId}".
${tableHint}
---

${inputText}`

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
      // 의도: 추출 작업은 창의성 X, 일관성 O. temperature 0.2 로 낮춰서 run-to-run
      //       variance 감소 (이전 정형 데이터에서 atoms 12~21 ±43% 변동 관찰).
      //       완전 0 은 deterministic 에 가까운데, 가끔 같은 실수 반복 위험 → 0.2.
      temperature: 0.2,
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
  // preflightIssues (입력 가드 / 표 감지 메타) 를 issues 시작에 포함 → 운영 로그에서 추적 가능.
  const issues: string[] = [...preflightIssues]
  if (tableInfo.isTable) {
    issues.push(`table pattern detected (${tableInfo.rowCount} rows × ${tableInfo.cols} cols) — LLM hint injected`)
  }
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
  // 의도: 출력 토큰 컷 후 LLM 이 raw_text 를 짧게 자르라 했더니 의역하는 경향 생김
  //       (예: "서울 거주자 대비" 같은 중간 구문 누락). exact substring 매칭은
  //       의역도 hallucination 으로 오판 → fuzzy 매칭으로 완화.
  //       방식: 5-gram (5글자 substring) overlap 비율 ≥ 0.6 이면 grounded.
  //         · 의역: 토큰 60%+ 유지 = 통과
  //         · 진짜 hallucination: 5-gram overlap 거의 0 = 차단
  //       전체 grounded 판정: atom 의 90% 이상 통과 시 true (1개 의역도 false 인 all-or-nothing 회피).
  const normalize = (s: string) =>
    s
      .replace(/[*_`#~]/g, '')      // markdown 부호 제거
      .replace(/\s+/g, ' ')         // 공백 정규화
      .trim()
  const GROUNDING_NGRAM = 5
  const GROUNDING_TOKEN_THRESHOLD = 0.6
  const GROUNDING_OVERALL_THRESHOLD = 0.9
  const ngramSet = (s: string, n: number): Set<string> => {
    const set = new Set<string>()
    for (let i = 0; i <= s.length - n; i++) set.add(s.slice(i, i + n))
    return set
  }
  const normText = normalize(text)
  const sourceNgrams = ngramSet(normText, GROUNDING_NGRAM)
  let groundedCount = 0
  for (const atom of atoms) {
    const normRaw = normalize(atom.provenance.source.raw_text)
    // Fast path: exact substring 매칭
    if (normText.includes(normRaw)) {
      groundedCount++
      continue
    }
    // 너무 짧으면 fuzzy 불가 — exact 실패 시 fail
    if (normRaw.length < GROUNDING_NGRAM) {
      issues.push(`atom ${atom.id}: raw_text "${atom.provenance.source.raw_text.slice(0, 40)}" not in source (length < ${GROUNDING_NGRAM})`)
      continue
    }
    // Fuzzy: n-gram overlap 비율
    const rawNgrams = ngramSet(normRaw, GROUNDING_NGRAM)
    let hit = 0
    for (const g of rawNgrams) if (sourceNgrams.has(g)) hit++
    const ratio = rawNgrams.size > 0 ? hit / rawNgrams.size : 0
    if (ratio >= GROUNDING_TOKEN_THRESHOLD) {
      groundedCount++
    } else {
      issues.push(`atom ${atom.id}: raw_text "${atom.provenance.source.raw_text.slice(0, 40)}" fuzzy ${ratio.toFixed(2)} < ${GROUNDING_TOKEN_THRESHOLD}`)
    }
  }
  const groundedRatio = atoms.length > 0 ? groundedCount / atoms.length : 1
  const grounded = groundedRatio >= GROUNDING_OVERALL_THRESHOLD

  // schema_compliant: grounding/메타 관련 issue 는 schema 위반 아님 — 별도 필터.
  // - grounding: "not in source", "fuzzy X.XX < ..."
  // - 입력 메타 (N5/N6): "input truncated", "table pattern detected"
  const NON_SCHEMA_PATTERNS = ['not in source', 'fuzzy', 'input truncated', 'table pattern detected']
  const schemaIssues = issues.filter(i => !NON_SCHEMA_PATTERNS.some(p => i.includes(p)))

  return {
    atoms,
    relations,
    validation: {
      schema_compliant: schemaIssues.length === 0,
      grounded,
      issues,
    },
    raw_response: rawText,
  }
}
