# M6 Golden Fixture — Sample Report Extraction

이 폴더는 M6 Extractor 빌드/검증의 진실의 원천(source of truth)입니다.
**Claude Code는 빌드 시작 전 이 README와 3개 파일을 먼저 읽어주세요.**

---

## 파일 구성

```
/tests/fixtures/sample_flip3_w2/
├── README_for_cli.md          ← (이 파일)
├── sample_report_input.md     ← LLM에 넣을 입력
└── expected_atoms.json        ← 기대 출력 (정답지)
```

---

## 무엇을 검증하는가

`sample_report_input.md`를 M6 Extractor에 통과시켰을 때,
`expected_atoms.json`과 얼마나 일치하는지가 PoC 검증의 핵심 지표.

### 기대 결과 요약

- **총 Atom 24개**
  - Requirement 4, Deadline 3, Constraint 2, Deliverable 1
  - Metric 7, Narrative 1
  - Question 1, Entity 5
  - (Event, Decision, Reference, Definition은 이 문서에 없음 — 0개)
- **총 Relation 21개**
  - assigned_to, requires, fulfills, references, responds_to, triggers, produced_by

### 정확도 목표

| 지표 | 최소값 | 비고 |
|---|---|---|
| Precision | 0.85 | 추출된 Atom 중 진짜 Atom 비율 |
| Recall | 0.75 | 진짜 Atom 중 추출된 비율 |
| Schema Compliance | 1.00 | JSON Schema 위반 0% (필수) |
| Hallucination Rate | < 0.05 | raw_text에 없는 내용 비율 |
| Type Classification Accuracy | 0.90 | AtomType 분류 정확도 |

이 목표를 못 맞추면 Extractor 프롬프트/로직을 재조정해야 함.

---

## 빌드 시 활용 방법

### 1. 단위 테스트로 활용

```typescript
import expected from './expected_atoms.json';
import { extractFromTxt } from '../../../lib/m6/pipeline/task_extractor';

test('sample_flip3_w2 extraction meets targets', async () => {
  const result = await extractFromTxt(
    './sample_report_input.md',
    'file_sample_flip3_w2'
  );

  // 1. AtomType별 개수 확인
  for (const [type, count] of Object.entries(expected.expected_counts)) {
    if (type.startsWith('_')) continue;
    const actual = result.atoms.filter(a => a.type === type).length;
    expect(actual).toBeGreaterThanOrEqual(count - 1); // ±1 tolerance
    expect(actual).toBeLessThanOrEqual(count + 1);
  }

  // 2. Schema Compliance — 모든 Atom이 12개 AtomType 중 하나
  for (const atom of result.atoms) {
    expect(ATOM_TYPES).toContain(atom.type);
  }

  // 3. Provenance — 모든 Atom이 raw_text를 가짐
  for (const atom of result.atoms) {
    expect(atom.provenance.source.raw_text.length).toBeGreaterThan(0);
  }

  // 4. Hallucination check — content가 raw_text에 grounded
  for (const atom of result.atoms) {
    const grounded = atomContentGroundedInRawText(atom);
    expect(grounded).toBe(true);
  }
});
```

### 2. 프롬프트 튜닝 사이클

추출 정확도가 목표 미달일 때:

1. `expected_atoms.json`의 `notes_for_extractor` 참조 — 자주 실패하는 패턴 명시됨
2. 실패한 Atom들의 raw_text를 분석
3. `task_extractor.ts`의 `ATOM_TYPE_GUIDES`에 해당 패턴의 negative example 추가
4. 재실행

### 3. Few-shot 학습 데이터로 활용

Extractor 프롬프트에 이 fixture를 few-shot 예시로 직접 주입 가능.
단, 이 경우 같은 fixture를 검증에 다시 쓸 수 없음 (학습-검증 분리).
PoC에서는 검증용으로만 쓰는 것을 권장.

---

## 주의사항 (놓치기 쉬운 부분)

`expected_atoms.json`의 `notes_for_extractor` 5가지를 반드시 읽어주세요.
요약:

1. **같은 문장 안의 여러 Metric** — "부산 2건, 광주 2건, 대전 1건"을 1개 Metric으로 합치면 Recall 감점. 각각 독립 Atom으로 분해해야 함.

2. **Self-referential Deliverable** — 보고서가 자기 자신을 Deliverable로 가진다는 점. 누락하기 쉬움.

3. **추론 금지** — 명시되지 않은 attribute(예: R3의 issued_by)는 비워둘 것. LLM이 그럴듯하게 채우면 hallucination.

4. **Metric ↔ Narrative 관계** — 수치(M6)가 서술(N1)의 근거인 패턴은 `references` 관계. `produced_by`나 `triggers`로 쓰지 말 것.

5. **Blocking 의미의 Question** — Q1은 R2를 막고 있지만 `blocks` 관계가 없으므로 `responds_to`로 표현.

---

## Glossary 준수

이 fixture의 모든 용어는 **M6 Glossary v1.1**을 따릅니다.

- 12개 AtomType 외 새 type 만들지 말 것
- 10개 RelationType 외 새 relation 만들지 말 것
- Forbidden Terms ("AKU", "Molecule", "Document(v1)", "Chunk" 등) 사용 금지

Glossary 위반 시 빌드 자체가 실패해야 함 (4중 방어선 작동).

---

## 다음 fixture 추가 시 가이드

PoC 진행 중 fixture는 늘어날 것. 새 fixture 추가 시:

1. 폴더명은 `sample_{도메인}_{버전}` 패턴
2. README + input + expected 3개 파일 필수
3. expected_counts에 0개인 AtomType도 명시
4. notes_for_extractor에 도메인 특수 패턴 기록

PoC 종료 시까지 fixture 3-5개가 적당. 너무 많으면 검증 비용 폭증.

---

## 빌드 우선순위 (이 fixture에서 얻을 수 있는 것)

이 fixture가 검증하는 것들 (Day 1~3):

- ✅ Requirement / Metric / Entity 추출 — 가장 중요한 3개
- ✅ Provenance 필수 강제
- ✅ Relation 추론 (assigned_to, requires, fulfills)
- ✅ Hallucination 차단
- ❌ Event / Decision / Reference / Definition (이 문서엔 없음)
- ❌ HWP 파싱 (markdown 입력이므로)
- ❌ FileSeries 자동 감지 (단일 파일)

→ Day 4~5에 회의록 fixture, 공문 fixture 추가로 나머지 검증.

---

**버전:** v1.0 (2026-05-22)
**호환 Glossary:** v1.1
