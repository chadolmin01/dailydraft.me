# Draft

한국 창업기관 운영자 전용 AI 에이전트 워크스페이스.

## Core Principle

고객(매니저)에게 새로운 일 부담을 안 일으킨다. 매니저가 관리하는 멤버들(팀, 입주기업)은 Draft 사용 안 함.

## Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth)
- Vercel
- Anthropic Claude API
- Google APIs: Drive, Sheets, Gmail

## Files

- `spec.md` — what to build
- `design.md` — design tokens
- `tasks.md` — execution checklist
- `CONVENTIONS.md` — naming, domain terms
- `DECISIONS.md` — pivot log

## Hard Rules

- 모든 UI 한국어, 존댓말
- AI 시스템 용어 UI 노출 금지 ("AI", "에이전트", "MCP", "커넥터")
- 이모지 사용 최소화 (행정 문서 톤)
- 색상/폰트는 design.md 토큰만 사용
- 시크릿 키 클라이언트 노출 금지
- Google OAuth scope 최소 (drive.readonly, spreadsheets, gmail.compose)

## Branch Strategy

- `main` — V1 PoC
- `archive/m6-model` — M6 백업 (건드리지 말 것)
