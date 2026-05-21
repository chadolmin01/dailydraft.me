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
