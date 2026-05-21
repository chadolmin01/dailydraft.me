# Draft — V1

한국 창업기관 매니저 전용 운영 워크스페이스. Google Drive / Sheets / Gmail 자료를 한 화면에서 보고, Claude 챗봇이 진척과 미제출 팀을 짚어준다.

V1 의 첫 사용자는 FLIP 1기 운영자 본인. 2026-06-26 데모데이까지 도그푸딩.

> 핵심 원칙: **고객(매니저)에게 새로운 일 부담을 안 일으킨다.** 매니저만 Draft 를 쓰고, 팀 멤버는 Drive/Gmail 만 쓴다.

## 문서 (단일 진실 소스)

순서대로 읽으면 충분하다.

| 파일 | 무엇 |
|------|------|
| `CLAUDE.md` | Hard Rules + Stack + Branch 전략 |
| `spec.md` | F1~F6 기능 + Out of Scope + Success Criteria |
| `design.md` | 색상 / 타이포 / 간격 / 모션 / 컴포넌트 토큰 |
| `tasks.md` | Day 0~5 체크리스트 |
| `CONVENTIONS.md` | 도메인 용어 + 네이밍 + UI 카피 규칙 |
| `DECISIONS.md` | D1~D7 의사결정 로그 |
| `NOTES.md` | 운영 중 발견 이슈 기록 (V1.5 우선순위) |

## 스택

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (design.md 토큰 매핑)
- Supabase (Postgres + Auth)
- Vercel
- Anthropic Claude API
- Google APIs: Drive, Sheets, Gmail

## 셋업

```bash
# 1. 의존성
cd v2
pnpm install

# 2. 환경 변수 — .env.local 에 채움
# 필수 키:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   GOOGLE_CLIENT_ID
#   GOOGLE_CLIENT_SECRET
#   GOOGLE_REDIRECT_URI   (예: http://localhost:3000/api/auth/callback/google)
#   ANTHROPIC_API_KEY
#   NEXT_PUBLIC_GOOGLE_API_KEY   (Picker 용, 선택)

# 3. Supabase 마이그레이션 적용 (한 번만)
SUPABASE_ACCESS_TOKEN="sbp_..." supabase db push --linked

# 4. 개발 서버
pnpm dev   # http://localhost:3000
```

## 디렉토리

```
v2/
├── app/                      # Next.js App Router
│   ├── api/                  # API 라우트 (auth · folders · chat · google/*)
│   ├── workspace/            # 메인 워크스페이스 (Client component)
│   ├── privacy/, terms/      # 약관
│   ├── error.tsx, loading.tsx
│   └── page.tsx              # 랜딩 (Google 로그인)
├── src/
│   ├── context/              # AuthContext + Providers (React Query)
│   ├── lib/
│   │   ├── anthropic/        # Claude client + tool 정의
│   │   ├── google/           # oauth, tokens, drive, sheets, gmail, picker
│   │   ├── parsers/          # 파일명 컨벤션 + URL ID 추출
│   │   ├── supabase/         # client / server / admin
│   │   ├── api-utils.ts      # ApiResponse 유틸
│   │   ├── matrix.ts         # 진행도 매트릭스 계산
│   │   └── workspace.ts      # getOrCreateWorkspace
│   └── types/database.ts     # Supabase 생성 타입 (gen types)
├── supabase/migrations/      # SQL 마이그레이션 (14자리 타임스탬프)
├── middleware.ts             # 세션 갱신 + 라우트 게이팅 + 보안 헤더
└── glossary/                 # M6 (V2+) 연구 — V1 코드와 무관, 타입체크 exclude
```

## 데이터 모델 (Supabase, public 스키마)

| 테이블 | 역할 |
|--------|------|
| `workspaces` | 매니저 1명 = 1행 (UNIQUE owner_id) |
| `folders` | Drive 폴더 + Sheets 명단 연결 |
| `chats` | 챗봇 대화 (Claude API 메시지 형식 그대로 저장) |
| `google_tokens` | OAuth refresh_token 보관 (service_role 만 접근, RLS 잠금) |

RLS 는 `owner_id = auth.uid()` 기반 — 본인 워크스페이스만 보인다.

## 배포 (Vercel)

1. Vercel Dashboard → Project Settings → Git → Production Branch 를 원하는 브랜치로
2. Settings → General → Root Directory 를 `v2/` 로 변경
3. Settings → Environment Variables 에 모든 키 추가 (Production / Preview / Development 별로)
4. Google Cloud Console → OAuth → redirect URI 에 `https://<도메인>/api/auth/callback/google` 추가

## 검증 시나리오

1. `/` → "Google 계정으로 시작하기" → Google 동의 → `/workspace`
2. "폴더 연결" → Picker 또는 검색으로 폴더 선택 → 카드 등장
3. 폴더 클릭 → [폴더] 탭에서 Drive 트리 탐색 / [진행도] 탭에서 매트릭스
4. 좌측 챗봇: "3주차 미제출 팀 알려주세요" → 매트릭스 도구 호출
5. "미제출 팀에 보낼 메일 만들어주세요" → Gmail 초안함에 저장 (mailto 폴백 가능)

## 의사결정 요약

- **매니저 전용** (D1) — 멤버 UI 영구 X
- **파일명 컨벤션 기반 진척** (D4) — LLM 분류 X, 결정론적 정규식
- **메일 자동 발송 X** (D5) — Gmail Drafts API 까지만, 매니저가 직접 발송
- **MCP 사용자 노출 X** (D3) — 내부 도구일 뿐

자세한 배경은 `DECISIONS.md`.
