# Tasks

## Day 0: Setup (오프라인)

- [ ] Git: `archive/m6-model` 브랜치 백업 + push
- [ ] Supabase: 기존 테이블 drop
- [ ] Google Cloud Console: 프로젝트 생성
- [ ] Google Cloud: Drive/Sheets/Gmail API 활성화
- [ ] Google Cloud: OAuth consent screen (External, Testing)
- [ ] Google Cloud: OAuth Client ID 발급 + redirect URI 등록
- [ ] dailydraft.me/privacy 페이지
- [ ] dailydraft.me/terms 페이지
- [ ] FLIP 1기 Drive 폴더 구조 정리
- [ ] FLIP 8팀 명단 Google Sheets 작성
- [ ] 파일명 컨벤션 8팀 카톡 공지

## Day 1: Project + OAuth + Drive

- [ ] Next.js 14 (App Router) 초기화
- [ ] TypeScript, Tailwind, ESLint 셋업
- [ ] 패키지 설치: googleapis, google-auth-library, @supabase/supabase-js, @anthropic-ai/sdk
- [ ] design.md 토큰 → `app/globals.css`
- [ ] Pretendard 폰트 import
- [ ] Tailwind config 토큰 매핑
- [ ] Supabase 마이그레이션 작성 + 적용
- [ ] `.env.local` 설정
- [ ] `/api/auth/google` route
- [ ] `/api/auth/google/callback` route
- [ ] `google_tokens` 테이블에 토큰 저장
- [ ] `lib/google/drive.ts` 클라이언트
- [ ] `lib/parsers/filename.ts` 패턴 파싱
- [ ] `/workspace` 페이지 (UI 셸)
- [ ] Drive 폴더 ID 입력 → 파일 목록 표시
- [ ] **검증**: localhost:3000 전체 흐름 작동

## Day 2: Sheets

- [ ] `lib/google/sheets.ts` 클라이언트
- [ ] Sheets에서 8팀 명단 읽기
- [ ] 명단 × Drive 파일 대조 로직
- [ ] 미제출 팀 추출 함수
- [ ] 진행도 매트릭스 데이터 생성
- [ ] **검증**: 콘솔에 매트릭스 출력

## Day 3: Chatbot + UI

- [ ] `lib/anthropic/client.ts`
- [ ] Tool definitions (list_files, read_sheet, write_sheet, compose_email)
- [ ] `/api/chat` route (streaming)
- [ ] 좌측 챗봇 UI (메시지, 입력창)
- [ ] 우측 진행도 매트릭스 컴포넌트
- [ ] `chats` 테이블 저장
- [ ] **검증**: "FLIP 3주차 미제출 팀 알려줘" 작동

## Day 4: Email Draft

- [ ] `lib/google/gmail.ts` 클라이언트 (compose만)
- [ ] 메일 본문 생성 프롬프트
- [ ] `mailto:` 링크 생성
- [ ] 챗봇에서 메일 초안 카드 렌더링
- [ ] **검증**: "미제출 팀 리마인드 메일 만들어줘" → mailto 링크

## Day 5: Polish + 투입

- [ ] 에러 처리
- [ ] 로딩 상태
- [ ] 한국어 카피 점검
- [ ] Vercel 배포
- [ ] **FLIP 1기 운영에 실투입**
- [ ] NOTES.md에 발견된 이슈 기록

## V1.5 (도그푸딩 1~2주 후)

- [ ] 발견된 이슈 우선순위 정리
- [ ] 자주 쓰는 명령 단축
- [ ] 진행도 매트릭스 시각 개선
- [ ] 폴더 자동 생성 흐름
