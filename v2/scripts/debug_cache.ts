#!/usr/bin/env node
/**
 * Prompt Caching 버그 진단.
 *
 * 1) 시스템 프롬프트 실제 토큰수 측정 (count_tokens API)
 * 2) cache_control 직접 호출 → cache_creation_input_tokens 확인
 * 3) 동일 호출 반복 → cache_read_input_tokens 확인
 *
 * 가설: Haiku 4.5 의 최소 캐시 크기 (2048 토큰) 미만이라 캐시 거부됨.
 *       Sonnet/Opus 는 1024 토큰부터 가능.
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}
loadEnvLocal()

// extractor 와 동일한 system prompt 합성 (in-line 복붙 — 변경 시 동기화)
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
- raw_text 는 원문 그대로 — 마크다운 (**, *, # 등) 까지 그대로 복사하지 말고 ASCII 텍스트 일부만 발췌.
- 같은 문장의 여러 Metric (예: "부산 2건, 광주 2건, 대전 1건") 은 각각 분리.
- 명시 안 된 attribute 은 비울 것. 추론으로 채우지 말 것.
- Atom id 는 prefix 사용: R(Requirement), D(Deadline), E(Entity), M(Metric), C(Constraint), Q(Question), DL(Deliverable), N(Narrative), Ev(Event), Dc(Decision), Rf(Reference), Df(Definition).
- 응답은 ONLY valid JSON. 마크다운 코드블록 사용 금지.

타입별 추출 가이드 (자주 누락되는 패턴):
- Requirement: 과거형 "X를 했습니다" 뿐 아니라 미래/계획형도 포함. "다음 주차에 X 할 예정", "Y 까지 Z 준비하겠습니다", "A 를 진행할 계획" 같은 표현 = 명시적 작업이면 Requirement.
- Entity: 사람만 아님. 팀 (예: "3팀") 도 entity_kind="team", 조직/회사/사업단 (예: "창교", "LINC 사업단") 도 entity_kind="organization". 문서 본문에 한 번이라도 주체로 언급되면 추출.
- Deadline: 단순 날짜 언급 + "까지" 조사 = Deadline. due_at 은 YYYY-MM-DD 표준화.
- Constraint: 형식/수량 제한 (예: "PDF 10페이지 이내", "NRF 표준양식") 은 별도 Constraint, 관련 Requirement 와 references 관계 연결.
- Question: 불확실하거나 외부 의존 요청 (예: "○○에서 ... 가능할지 문의") = Question. asker_ref / addressee_ref attributes 함께.
`

const systemPrompt = GLOSSARY_SYSTEM + '\n\n---\n\n' + EXTRACTION_INSTRUCTIONS

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY 없음')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log('=== STEP 1: 시스템 프롬프트 토큰 측정 ===')
  console.log(`  char length: ${systemPrompt.length}`)

  const countResp = await client.messages.countTokens({
    model: 'claude-haiku-4-5-20251001',
    system: [{ type: 'text', text: systemPrompt }],
    messages: [{ role: 'user', content: 'x' }],
  })
  console.log(`  measured tokens (system + 'x'): ${countResp.input_tokens}`)
  console.log(`  → 시스템 프롬프트 단독 ≈ ${countResp.input_tokens - 4} 토큰`)

  const HAIKU_MIN = 2048
  const SONNET_MIN = 1024
  const sysTokens = countResp.input_tokens - 4
  console.log(`\n  Haiku 4.5 최소 캐시: ${HAIKU_MIN} → ${sysTokens >= HAIKU_MIN ? '✅ 가능' : '❌ 부족 (캐시 거부 원인 유력)'}`)
  console.log(`  Sonnet/Opus 최소:    ${SONNET_MIN} → ${sysTokens >= SONNET_MIN ? '✅ 가능' : '❌ 부족'}`)

  console.log('\n=== STEP 2: 직접 캐시 호출 (Haiku) ===')
  const t1 = Date.now()
  const r1 = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: 'OK 한 단어만 응답.' }],
  })
  const u1 = r1.usage
  console.log(`  elapsed: ${Date.now() - t1}ms`)
  console.log(`  input: ${u1.input_tokens}`)
  console.log(`  cache_creation: ${(u1 as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0}`)
  console.log(`  cache_read:     ${(u1 as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0}`)
  console.log(`  output: ${u1.output_tokens}`)

  console.log('\n=== STEP 3: 즉시 재호출 (cache_read 기대) ===')
  const t2 = Date.now()
  const r2 = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: 'OK 한 단어만 응답.' }],
  })
  const u2 = r2.usage
  console.log(`  elapsed: ${Date.now() - t2}ms`)
  console.log(`  input: ${u2.input_tokens}`)
  console.log(`  cache_creation: ${(u2 as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0}`)
  console.log(`  cache_read:     ${(u2 as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0}`)

  console.log('\n=== STEP 4: Sonnet 4.6 으로 동일 테스트 (Haiku 임계값 미만일 때 비교) ===')
  const t3 = Date.now()
  const r3 = await client.messages.create({
    model: 'claude-sonnet-4-6-20251001' as 'claude-sonnet-4-5',
    max_tokens: 50,
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: 'OK 한 단어만 응답.' }],
  }).catch(e => ({ error: e.message }))
  if ('error' in r3) {
    console.log(`  Sonnet 호출 실패: ${r3.error}`)
  } else {
    const u3 = r3.usage
    console.log(`  elapsed: ${Date.now() - t3}ms`)
    console.log(`  cache_creation: ${(u3 as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0}`)
    console.log(`  cache_read:     ${(u3 as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0}`)
  }

  console.log('\n=== 진단 ===')
  if (sysTokens < HAIKU_MIN) {
    console.log(`  H1 ✅ 확정: 시스템 프롬프트가 ${sysTokens} 토큰 — Haiku 최소(${HAIKU_MIN}) 미만 → 캐시 거부`)
    console.log(`  해결책 옵션:`)
    console.log(`    A. 시스템 프롬프트 padding 으로 2048+ 까지 늘리기 (역효과 가능)`)
    console.log(`    B. Sonnet 4.6 으로 모델 변경 (1024 부터 캐시, 출력 속도 더 빠를 수 있음)`)
    console.log(`    C. 캐시 포기, 출력 verbosity 컷에 집중`)
  } else {
    console.log(`  H1 ❌ 기각: ${sysTokens} 토큰 ≥ ${HAIKU_MIN} → 다른 원인`)
  }
}

main().catch(e => {
  console.error('❌', e.message)
  if (e.stack) console.error(e.stack)
  process.exit(1)
})
