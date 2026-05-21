# Conventions

## Domain Terms (한국 창업기관)

| 용어 | 의미 |
|---|---|
| 창업교육센터 (창교) | 대학 산하 창업 교육 담당 |
| 창업보육센터 (BI) | 중기부 산하, 입주기업 보육 |
| LINC 사업단 | 대학-산업 협력 사업 |
| 산학협력단 (산단) | 대학 산하 산학협력 행정 |
| 액셀러레이터 (AC) | 초기 스타트업 투자/멘토링 |
| 인큐베이터 | 입주공간 + 보육 |
| 데모데이 | 코호트 종료 발표회 |
| 코호트 | 기수, 동기 그룹 |
| 매니저 | 운영자, 행정 담당 |
| 입주기업 | BI에 입주한 스타트업 |
| 정부지원사업 | K-Startup, 예창패, 청창사 등 |
| K-Startup | 창업진흥원 통합 포털 |
| hwp | 한글 문서 (정부 표준) |

## Naming (Code)

### TypeScript

- 변수/함수: `camelCase`
- 타입/인터페이스: `PascalCase`
- 상수: `UPPER_SNAKE_CASE`
- 컴포넌트: `PascalCase`
- 파일명: `kebab-case.ts`, 컴포넌트는 `PascalCase.tsx`

### Domain Models

| Code | UI 표시 |
|---|---|
| `Workspace` | 워크스페이스 |
| `Folder` | 폴더 |
| `Manager` (user) | 매니저 |
| `Member` (non-user) | 멤버 |
| `Cohort` | 기수 |
| `Team` | 팀 |
| `Submission` | 제출물 |
| `ProgressCell` | (UI only) |

### Tables (Supabase)

- 복수형: `workspaces`, `folders`, `chats`, `google_tokens`
- 외래키: `workspace_id`, `folder_id`, `user_id`
- 타임스탬프: `created_at`, `updated_at`

### Routes

- `/workspace` — 메인
- `/workspace/folder/[id]` — 폴더 상세
- `/api/auth/google` — OAuth 시작
- `/api/auth/google/callback` — OAuth 콜백
- `/api/chat` — 챗봇 스트리밍
- `/api/google/drive/*` — Drive 프록시
- `/api/google/sheets/*` — Sheets 프록시
- `/api/google/gmail/*` — Gmail 프록시

## Filename Pattern

```
[{program}_{N}주차]_{팀명}_{과제명}.{ext}

예시:
[FLIP1기_3주차]_3팀_MVP기획서.pdf
[KVP_2주차]_5팀_시장조사.docx
```

Regex:
```
/^\[(?<program>[^_]+)_(?<week>\d+주차)\]_(?<team>\d+팀)_(?<task>.+)\.(?<ext>[^.]+)$/
```

## UI Copy Rules

- 존댓말 ("~합니다", "~해주세요")
- 시스템 명사 회피 ("AI", "에이전트", "MCP", "커넥터" 금지)
- 이모지 최소 (행정 문서 톤)
- 진행도 기호: ● ◐ ✕ ○ (이모지 X)

### Examples

| O | X |
|---|---|
| 보고서를 정리했습니다. | AI가 자동 생성했어요! ✨ |
| 3팀, 5팀이 미제출입니다. | 미제출 팀 발견! ⚠️ |
| 메일 초안입니다. | 메일을 자동 발송할까요? |

## Git Commit

- `feat:` 기능 추가
- `fix:` 버그 수정
- `refactor:` 리팩토링
- `style:` 스타일/포맷
- `docs:` 문서
- `chore:` 빌드/설정

영문, 소문자, 마침표 없음.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
ANTHROPIC_API_KEY=
```
