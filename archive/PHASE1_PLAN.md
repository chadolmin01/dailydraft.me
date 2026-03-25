# Phase 1 실행 계획: MVP 리포커싱

> 참조: `C:\project\Draft\SERVICE_PLAN.md`
> 핵심 루프: 프로젝트 올리기 → 사람 찾기 → 커피챗으로 만나기

---

## Context

Draft는 현재 30+개 테이블, 7~8개 기능으로 과부하 상태. 사용자 입장에서 "이 서비스가 뭐하는 건지" 한 마디로 설명이 안 됨. 핵심 루프(프로젝트+사람+커피챗)만 남기고 나머지 UI를 숨겨서, 서비스 정체성을 명확하게 만드는 작업.

**원칙:**
- 코드 삭제 X → UI에서 제거만 (파일 자체는 유지)
- DB 변경 X
- 롤백 가능하게

---

## 커밋 순서 (8개)

```
1. TopNavbar 정리
2. Explore 스타트업 아이디어 제거 (제거만)
3. Explore 탭 구조 신설 (프로젝트+사람)
4. Profile AI 사이드바 제거
5. CTA 통합 + 커피챗 템플릿
6. 비로그인 플로우
7. OG 메타 + 동적 이미지 + 공유 버튼 + 카드 배지
--- 여기까지 배포 ---
8. 커피챗 이메일 알림 (Resend)
```

---

## Chunk 1: TopNavbar 정리

**파일:** `components/TopNavbar.tsx`

| 변경 | 내용 |
|------|------|
| "프로젝트" 링크 제거 | 데스크탑 (L72) + 모바일 (L177) NavLink 제거. Explore에 통합 |
| Premium UI 숨김 | Crown 뱃지 (L106-108), PRO 라벨 (L120-124) 제거 |
| 초대코드 UI 숨김 | 초대코드 버튼 (L136-141), InviteCodeModal (L191-195) 제거 |
| import 정리 | `usePremium`, `InviteCodeModal`, `Crown`, `Gift` 제거. `isPremium`/`refetchPremium`/`isInviteModalOpen` 상태 제거 |

**결과:** 탐색 / 마이페이지 / [+ 새 프로젝트] / [알림] / [프로필] 만 남음

**커밋:** `feat: strip TopNavbar to core nav (hide premium, projects link)`

---

## Chunk 2: Explore 스타트업 아이디어 제거 (제거만)

**파일:** `components/Explore.tsx`

> Part A만. 탭 구조는 다음 커밋에서.

| 라인 | 제거 대상 |
|------|-----------|
| L7-8 | `StartupIdeaCard`, `StartupIdeaModal` import |
| L10-11 | `StartupIdeaWithAnalysis` 타입, `useStartupIdeas` import |
| L18 | `MARQUEE_COLORS` 상수 |
| L31 | `selectedStartup` state |
| L33 | `carouselIndex` state |
| L45-54 | `useStartupIdeas` 훅 호출 |
| L62-73 | 캐러셀 로직 + useEffect |
| L76-93 | `handleOpenModal`, `handleStartBuilding` 핸들러 |
| L247-310 | 캐러셀 JSX |
| L368-423 | "해외 검증 아이디어" 섹션 JSX |
| L431-455 | 우측 사이드바 "이번 주 인기" |
| L497-505 | 우측 사이드바 "저장한 아이디어" |
| L513-535 | `StartupIdeaModal` 렌더 |

**결과:** 프로젝트 섹션 + 인재 섹션만 남은 Explore (아직 탭 없음)

**커밋:** `feat: remove startup ideas from Explore page`

---

## Chunk 3: Explore 탭 구조 신설

**파일:** `components/Explore.tsx`

- `activeTab` state 추가: `'projects' | 'people'` (기본 `'projects'`)
- 정렬 탭 위치에 2-탭 UI 삽입
- 프로젝트 탭: 기존 프로젝트 섹션 확장, `limit: 4` → `limit: 12`
- 사람 탭: `usePublicProfiles` 결과를 메인 콘텐츠에 그리드 표시, `limit: 4` → `limit: 12`
- 좌측 사이드바 필터: "한국 적합도 70+" / "1000+ Upvotes" → "모집 중만 보기" 로 교체
- 우측 사이드바: "추천 인재" + "CTA 배너"만 유지

**결과:** Explore = 프로젝트 탭 + 사람 탭

**커밋:** `feat: redesign Explore with project and people tabs`

---

## Chunk 4: Profile AI 매칭 사이드바 제거

**파일:** `components/Profile.tsx`

| 변경 | 내용 |
|------|------|
| 우측 사이드바 제거 | L421-538 "AI 매칭 분석" 전체 aside 블록 제거 |
| import 정리 | `useProfileAnalysis`, `BarChart3`, `Sparkles` 등 미사용 import 제거 |
| 미사용 변수 정리 | `runAnalysis`, `isAnalyzing`, `profileAnalysis`, `hasAIAnalysis` 제거 |

**결과:** 2컬럼 레이아웃 (좌측 사이드바 + 메인), 커피챗/프로젝트 섹션 유지

**커밋:** `feat: remove AI matching sidebar from Profile`

---

## Chunk 5: CTA 통합 + 커피챗 템플릿

**파일:** `components/ProjectDetailModal.tsx`, `components/ProjectDetail.tsx`

### CTA 라벨 통합 ("지원하기" → "커피챗 신청")

**ProjectDetailModal.tsx:**
- L527-533 "관심 표현하기" + L534-540 "커피챗" 2개 버튼 → **"커피챗 신청" 단일 버튼** (Coffee 아이콘, 풀 너비)
- L457 "지원 →" → "커피챗 신청 →"
- L507-518 CTA 카드 "시작하기" → "커피챗 신청하기"

**ProjectDetail.tsx:**
- L359-372 데스크탑 2개 버튼 → "커피챗 신청" 단일 버튼
- L583 "지원 →" → "커피챗 신청 →"
- L683-696 모바일 CTA → "커피챗 신청" 단일 버튼
- L663-676 사이드바 CTA → "커피챗 신청하기"

### 커피챗 메시지 템플릿 (같은 커밋에 포함)

**신규:** `src/lib/constants/coffee-chat-templates.ts`
```
관심 표현 / 팀 합류 희망 / 피드백 제안 / 직접 작성
```

**수정:** `ProjectDetailModal.tsx` + `ProjectDetail.tsx`
- 인증된 사용자가 "커피챗 신청" 클릭 시 → 템플릿 선택 드롭다운 + 메시지 편집 textarea → `useCoffeeChats.requestChat()` 호출

**커밋:** `feat: unify CTAs to coffee chat with message templates`

---

## Chunk 6: 비로그인 사용자 플로우

**파일:** `components/ProjectDetailModal.tsx`, `components/ProjectDetail.tsx`

- 현재 `handleAction`은 항상 signup CTA를 표시 → 인증 여부 분기 추가
- `useAuth`의 `user` 확인 → **로그인 O: 커피챗 폼 (템플릿)** / **로그인 X: signup CTA**
- Explore에서 비로그인 유저 프로젝트 탐색 + 모달 열기는 이미 동작함 (확인 완료)

**커밋:** `feat: non-login browsing with signup CTA on actions`

---

## Chunk 7: OG 메타 + 동적 이미지 + 공유 버튼 + 카드 배지

### 7A: `/p/[id]` OG 메타 태그
- `app/p/[id]/page.tsx`를 서버 컴포넌트로 전환
- `generateMetadata()` 추가: Supabase 서버 클라이언트로 프로젝트 조회 → title, description, OG image

### 7B: 동적 OG 이미지
- **신규:** `app/api/og/project/[id]/route.tsx`
- `next/og`의 `ImageResponse` (1200x630)
- Draft 브랜딩: 블랙 배경, 프로젝트 제목, 역할 태그, "Draft" 로고

### 7C: 공유 버튼
- `ProjectDetail.tsx`: 기존 URL 복사 버튼 유지 (이미 있음). SNS 공유 드롭다운은 보류 — **"링크 복사"만으로 충분**
- `ProjectDetailModal.tsx`: 윈도우 바에 Share 아이콘 추가, 클릭 시 `/p/{id}` URL 복사 + toast

### 7D: 프로젝트 카드 "최근 업데이트" 배지
- `Explore.tsx` 프로젝트 카드: `opportunity.updated_at` 기준 7일 이내면 "N일 전 업데이트" 배지 표시
- `text-[10px] text-green-600 font-mono` 스타일

**커밋:** `feat: add OG meta, dynamic OG image, share button, update badge`

---

## Chunk 8: 커피챗 이메일 알림 (Resend)

> UI 정리(Chunk 1~7) 배포 후 바로 이어서 진행. UI 정리가 이메일 디버깅에 밀리지 않게.

> Resend 이미 설치됨 (`resend: ^6.9.1`), 이메일 클라이언트 존재 (`src/lib/email/client.ts`)

**신규 파일:**
- `src/lib/email/templates/coffee-chat-request.tsx` — 오너에게 "새 커피챗 요청" 알림
- `src/lib/email/templates/coffee-chat-response.tsx` — 요청자에게 "수락/거절" 알림
- `src/lib/email/templates/coffee-chat-reminder.tsx` — 48시간 미응답 리마인더
- `app/api/coffee-chat/notify/route.ts` — 이메일 발송 API
- `app/api/cron/coffee-chat-reminders/route.ts` — 48시간 리마인더 크론

**수정 파일:**
- `src/hooks/useCoffeeChats.ts` — requestChat/acceptChat/declineChat 성공 후 `/api/coffee-chat/notify` fire-and-forget 호출

**패턴:** 기존 `src/lib/email/templates/deadline-notification.tsx` + `send-deadline-notifications.ts` 따름

**커밋:** `feat: coffee chat email notifications via Resend`

---

## 실행 순서 (의존성)

```
병렬 가능:
  Chunk 1 (TopNavbar)
  Chunk 2 (Explore 아이디어 제거)
  Chunk 4 (Profile AI 제거)

순서 필요:
  Chunk 2 → Chunk 3 (탭 구조는 아이디어 제거 후)
  Chunk 3, 4 → Chunk 5 (CTA+템플릿은 UI 정리 후)
  Chunk 5 → Chunk 6 (비로그인은 CTA 후)
  Chunk 6 → Chunk 7 (OG/공유는 비로그인 후)
  --- 배포 ---
  Chunk 7 → Chunk 8 (이메일은 UI 배포 후)
```

---

## 검증

각 Chunk 완료 후:
1. `npx tsc --noEmit` — 타입 에러 없음 확인
2. 브라우저에서 해당 페이지 확인 (dev server)
3. 콘솔 에러 없음

전체 완료 후 E2E 확인:
- 비로그인: 랜딩 → Explore → 프로젝트 클릭 → 모달 → 커피챗 → 가입 CTA
- 로그인: Explore → 프로젝트 → 커피챗 신청 (템플릿) → 이메일 수신 확인
- `/p/[id]` 공유: OG 프리뷰 확인 (https://www.opengraph.xyz/), 공유 버튼 동작
- 프로필: AI 사이드바 없음, 커피챗 관리 동작
