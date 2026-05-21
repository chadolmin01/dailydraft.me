# Decisions

## D1. 운영자 전용 모델로 피벗

- Date: 2026-05
- From: M6 모델 (관리자 + 멤버 양쪽 가입)
- To: 매니저만 사용, 멤버는 Drive/Gmail로만 응답
- Why: 양쪽 온보딩 = 부담 = 채택 실패. 제 1원칙 "고객에게 새로운 일 부담 안 일으키기" 적용
- Impact: 멤버 UI 영구 제거, 멀티 매니저는 V2로

## D2. 카테고리: 운영자 전용 AI 에이전트

- Date: 2026-05
- Not: 인큐베이터 운영 SaaS (AcceleratorApp 카테고리)
- Why: 인큐베이터 SaaS는 멤버 온보딩 필수 = D1과 충돌
- Compared to: Claude Projects + 한국 도메인 + 실행 능력
- Pricing: 기관당 월 16~40만원 (시트 + 베이스)

## D3. MCP는 내부 구현 효율용, 사용자 노출 X

- Date: 2026-05
- Why: 비개발자 매니저에게 MCP/커넥터 노출은 부담
- How: Draft 내부에서만 MCP 사용, UI는 "Google 연결" 한 번
- Impact: UI 카피에서 시스템 용어 금지

## D4. Drive 파일명 컨벤션으로 자동 분류

- Date: 2026-05
- Why: LLM 파싱은 신뢰성 위험. 결정론적 규칙이 안전
- How: `[{program}_{N}주차]_{팀명}_{과제명}.{ext}` 패턴
- Impact: LLM API 비용 절감, 진행도 매트릭스 신뢰성 확보

## D5. Gmail 자동 발송 X (V1)

- Date: 2026-05
- Why: Gmail 발송 권한은 Google Restricted Scope, 검증 비용 수천만원
- How: 챗봇이 본문 생성 → `mailto:` 링크 → 매니저가 Gmail에서 발송
- Impact: V1 출시 가능, 검증 비용은 정부지원사업 자금 받은 후

## D6. 기존 dailydraft.me 인프라 재활용

- Date: 2026-05
- Why: 도메인/Vercel/Supabase 이미 있음, 사용자 0명이라 손실 없음
- How: `archive/m6-model` 브랜치 백업, Supabase 테이블 drop
- Impact: 셋업 시간 단축

## D7. spec-driven docs 구조

- Date: 2026-05
- Files: CLAUDE.md, spec.md, design.md, tasks.md, CONVENTIONS.md, DECISIONS.md
- Why: AI 에이전트가 일관되게 작업, 사람도 빠르게 온보딩
- Not in V1: ARCHITECTURE.md, SKILL.md, CHANGELOG.md

## D8. 인식 — 폴더 경로 + 파일명 hybrid + M6 Atom 매핑

- Date: 2026-05-22
- Why: 실 사용 시 매니저의 Drive 는 중첩 폴더 + 파일명 들쭉날쭉. D4 의 파일명 컨벤션만으로는 매트릭스 못 그림.
- D4 유지: LLM 안 씀. 정규식 + 폴더 위계 기반 deterministic 추출.
- Hybrid 우선순위:
  1. 파일명 매칭 → confidence 1.0
  2. 폴더 경로 매칭 → confidence 0.85
  3. 양쪽 일치 → confidence 1.0
  4. 둘 다 못 찾으면 unmatched (사용자에게 "주차/팀 모름" 표시)
- 표기 변형 대응: 주차/Week/Wk/W, 팀/Team/T/조
- M6 Glossary v1.1 적용:
  - 추출된 주차 = `Atom { type: 'Event' }` (UI 라벨: 일정)
  - 추출된 팀 = `Atom { type: 'Entity' }` (UI 라벨: 주체)
  - 인식 출처는 `Provenance.source.location = 'filename' | 'path:N'`
  - `Confidence` 점수 보존 → 매니저가 신뢰도 판단 가능
  - V1 deterministic extractor 메타: `extracted_by.model = 'rules-v1'`
- 매트릭스 셀의 `provenance_summary` (filename / path / mixed) UI 노출
- 매니저 자율 정렬 (B 안 — Drive 직접 rename/move) 은 D8 의 인식 결과를 기반으로 V2/V3 검토.

이유 (D8 의 의미):
- glossary 가 V2/V3 연구 추상화로만 남아있으면 검증 안 됨 → V1 에 실제 적용해서 어휘가 작동하는지 확인.
- 어휘 충돌 / 누락 발견되면 glossary v1.2 로 업데이트 가능.
