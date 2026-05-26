# Draft v3 — AI 최소화 SaaS Spike (로컬)

창업센터 운영 워크스페이스. v2 와 별개. **AI 0, Supabase 0, 인증 0** — 로컬 SQLite + Next 15 single-user 데모.

## 실행

```bash
cd v3
pnpm install
pnpm dev
```

브라우저: http://localhost:3100 (포트 3100 — v2 가 3000 사용 중이라 분리)

## 데이터

`data/v3.sqlite` 파일 1개. 첫 실행 시 자동 생성 (schema 는 `src/lib/db.ts` 의 `ensureSchema`).

리셋: `rm data/v3.sqlite` → 다음 요청 시 빈 DB 재생성.

## 5 모듈

| 라우트 | 모듈 | 상태 |
|---|---|---|
| `/programs` | M1 프로그램 설계 | stub (Phase B) |
| `/teams` | M2 팀 관리 | stub (Phase B) |
| `/collection` | M3 주간 수집 | stub (Phase C) |
| `/dashboard` | M4 대시보드 | stub (Phase D) |
| `/reports` | M5 보고서 생성 | stub (Phase E) |
| `/m/[token]` | 멤버 폼 입력 (인증 X) | stub (Phase C) |

## v2 와 차이

| | v2 | v3 |
|---|---|---|
| AI | 최대 (atom/RAG/chat) | 0 |
| DB | Supabase (cloud) | SQLite (local file) |
| Auth | Google OAuth + RLS | 없음 (single-user) |
| 포트 | 3000 | 3100 |

## Plan

`~/.claude/plans/b-swirling-hamming.md`
