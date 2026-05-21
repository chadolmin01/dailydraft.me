# Draft Community Redesign - Development Plan

## 프로젝트 개요

### 방향 전환

| 구분 | AS-IS (Startup OS) | TO-BE (Community) |
|------|-------------------|-------------------|
| 핵심 컨셉 | AI 팀 빌딩 플랫폼 + 스타트업 OS | 프로젝트 공유 · 피드백 · 커뮤니티 |
| 타겟 유저 | 초기 창업자 (Seed~Pre-A) | 대학생 · 예비창업자 |
| 핵심 경험 | 대시보드 · 문서자동화 · CRM | 프로젝트 피드 · 훈수 · 커피챗 |
| 차별점 | 30가지 지표 AI 매칭 | CEREAL 크로스캠퍼스 네트워크 |
| 수익 모델 | SaaS 구독 | 없음 (커뮤니티 가치 우선) |

### 기술 스택 (기존 유지)

- **프레임워크**: Next.js (기존 완성도 높은 버전 사용)
- **DB/Auth**: Supabase (Auth + profiles + projects 테이블 연결 완료)
- **스타일**: Tailwind CSS
- **상태관리**: TanStack Query
- **애니메이션**: Framer Motion
- **언어**: TypeScript

### 기존 백엔드 현황

- Supabase Auth: Google/GitHub OAuth 동작 중
- profiles 테이블: 유저 프로필 데이터 저장 중
- projects/opportunities 테이블: 프로젝트 · 공고 CRUD 동작 중
- 대시보드: 데이터 조회까지 동작 중

---

## 핵심 원칙 (모든 Phase에서 반드시 준수)

1. **기존 백엔드를 깨뜨리지 않는다.** 새 테이블 추가 방식으로 진행하고, 기존 컬럼/테이블은 수정하지 않는다.
2. **삭제보다 숨김.** 안 쓰는 컴포넌트는 코드 삭제 대신 라우팅에서 빼서 나중에 다시 살릴 수 있게 한다.
3. **Phase 1~2가 최소 배포 단위.** 랜딩페이지 + 프로젝트 피드만 있어도 아이디어톤에서 쓸 수 있다.
4. **매 Phase 머지 전 기존 기능(Auth, 프로필, 프로젝트 CRUD) 정상 동작 확인.**
5. **4월 아이디어톤이 데드라인.** 일정이 밀리면 Phase 3~4는 이후로 미루되, Phase 1~2 완성도를 우선한다.

---

## Phase 1: 랜딩페이지 리뉴얼 (1주차)

- **브랜치**: `feature/landing-redesign`
- **수정 범위**: 프론트엔드만 (백엔드 미접촉)
- **위험도**: ★☆☆☆☆ 낮음

### 섹션별 변경 사항

#### Hero 섹션 — 수정

**현재:**
```
완벽한 팀은 첫 번째 Draft에서 시작됩니다
초기 창업자와 대학생을 위한 AI 팀 빌딩 플랫폼.
아이디어 검증부터 IR 자료 생성까지, Draft OS 하나로 끝내세요.
```

**변경:**
```
모든 프로젝트는 Draft에서 시작됩니다
프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.
```

- "AI 팀 빌딩 플랫폼", "IR 자료 생성" 등 도구형 언어 제거
- CTA "AI로 30초 만에 공고 만들기"는 유지
- 우측 MockDashboardUI → 프로젝트 카드 피드 형태로 변경
- MockAICard 제거

#### PainPoints 섹션 (SYSTEM CRITICAL WARNING) — 삭제

- 에러 코드 3개 전체 삭제
- 문제의식은 히어로 서브카피로 대체 완료

#### Features 섹션 (AI Matching Engine + Startup OS) — 삭제

- 전체 제거 (도구형 서비스 언어, 실제 없는 기능)

#### HowItWorks 섹션 — 수정

**현재 3단계:**
1. 프로필 작성 - "3분 안에 완성..."
2. AI 매칭 - "비전 기반 분석..."
3. 팀 빌딩 - "바로 시작..."

**변경 3단계:**
1. 프로젝트 올리기 - "아이디어 단계든 진행 중이든, 고민 포인트와 함께 공유하세요"
2. 피드백 받고 탐색하기 - "다른 사람들의 훈수를 받고, 관심 가는 프로젝트에 관심 표현하세요"
3. 커피챗으로 만나기 - "마음 맞으면 가볍게 만나서 이야기 나눠보세요"

#### CommunityFeedback 섹션 — 신규 추가

HowItWorks와 LIVE PROJECTS 사이에 추가.

목업 내용:
- 프로젝트 카드 1개 (예: "대학생 중고거래 플랫폼")
- 훈수 코멘트 2-3개 예시 (학교 태그 포함):
  - "연대 경영 · 김OO: 타겟을 대학생으로 좁히는 게 낫지 않을까요?"
  - "고대 컴공 · 박OO: 당근마켓이랑 차별점이 뭔가요? 학교 인증?"
  - "경희대 산공 · 이OO: MVP는 에브리타임 연동부터 해보는 건 어때요?"
- 스택오버플로우/레딧 느낌의 커뮤니티 피드백 시각화
- 섹션 하단에 "나도 프로젝트 올리기" CTA 버튼

#### OpportunitySection (LIVE PROJECTS) — 유지

- 핵심 섹션, 그대로 유지
- 카드에 "훈수 N개", "관심 N명" 표시 추가 고려

#### LiveFeed 섹션 (LIVE SYSTEM ACTIVITY) — 삭제

- 가짜 활동 로그, 신뢰 저해

#### FAQ 섹션 — 수정

제거할 FAQ:
- "정부지원사업 정보는 어떻게 제공되나요?"
- "AI 매칭은 어떤 기준으로 이루어지나요?"

수정/추가할 FAQ:
- "Draft는 무료인가요?" — 유지
- "어떤 프로젝트를 올릴 수 있나요?" — 추가
- "피드백은 어떻게 받나요?" — 추가
- "커피챗은 어떻게 진행되나요?" — 추가
- "개인정보는 어떻게 보호되나요?" — 유지

#### FinalCTA — 수정

- "Join 2,000+ Founders Waiting" → 제거 (과장)
- 카피 간결하게 유지

#### Footer — 수정

- Product 링크들 (AI 매칭, 문서 자동화, 일정 관리) → "프로젝트", "커뮤니티"로 변경

### 최종 섹션 순서

```
1. Header (유지)
2. Hero (카피 수정, 목업 변경)
3. HowItWorks (3단계 수정)
4. CommunityFeedback (새로 추가)
5. OpportunitySection (유지)
6. FAQ (내용 수정)
7. FinalCTA (간소화)
8. Footer (링크 수정)
```

### 삭제되는 컴포넌트 (코드 삭제 X, 라우팅에서 숨김)

- MockDashboardUI
- MockAICard
- PainPoints 섹션
- Features 섹션 (AI Matching Engine + Startup OS)
- LiveFeed 섹션

### 일정

| 일정 | 작업 내용 |
|------|----------|
| Day 1-2 | Hero 카피 변경 + 우측 목업 프로젝트 피드로 교체 |
| Day 2-3 | PainPoints · Features · LiveFeed 섹션 라우팅에서 숨김 |
| Day 3-4 | HowItWorks 3단계 카피 수정 + CommunityFeedback 섹션 신규 추가 |
| Day 5-6 | FAQ 내용 교체 + FinalCTA · Footer 수정 |
| Day 7 | 테스트 + dev 브랜치 머지 |

### 머지 전 체크리스트

- [ ] 기존 Auth(로그인/회원가입) 정상 동작
- [ ] 기존 프로필 페이지 정상 동작
- [ ] 랜딩페이지 모바일 반응형 확인
- [ ] OG 태그 (og:title, og:description, og:image) 적용 확인

---

## Phase 2: 프로젝트 피드 전환 (2주차)

- **브랜치**: `feature/project-feed` (최신 dev에서 분기)
- **수정 범위**: 프론트 + DB 컬럼 추가
- **위험도**: ★★★☆☆ 중간

### 사전 작업 (필수)

```
⚠️ Supabase 테이블 구조 백업
- SQL 에디터에서 스키마 덤프 또는 테이블 구조 스크린샷
- 기존 컬럼은 절대 삭제하지 않고 새 컬럼만 추가
```

### DB 변경

projects 테이블에 컬럼 추가:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pain_point TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interest_count INTEGER DEFAULT 0;
```

### 프론트엔드 변경

1. **메인 뷰 교체**: 대시보드 → 프로젝트 피드 (Trending Projects 카드 레이아웃)
2. **사이드바 네비 정리**: 불필요 메뉴 숨김 (캘린더 · 문서 · CRM) → 피드 · 내 프로필 · 프로젝트 등록 3개만 유지
3. **프로젝트 카드**: 이름, 한 줄 소개, NEED 역할, 기술 태그, 훈수 수, 관심 수 표시
4. **프로젝트 상세 뷰**: 카드 클릭 시 상세 페이지 기본 구조 (코멘트 영역 자리 마련)

### 일정

| 일정 | 작업 내용 |
|------|----------|
| Day 1 | Supabase 테이블 구조 백업 (스키마 덤프/스크린샷) |
| Day 1-2 | projects 테이블에 pain_point, interest_count 컬럼 추가 |
| Day 2-4 | 대시보드 → 프로젝트 피드 메인 뷰 교체 (Trending Projects 카드 레이아웃) |
| Day 5-6 | 사이드바 네비 정리: 불필요 메뉴 숨김 → 피드 · 내 프로필 · 프로젝트 등록 |
| Day 7 | 프로젝트 카드 클릭 → 상세 뷰 기본 구조 (코멘트 영역 자리만 마련) |

### 머지 전 체크리스트

- [ ] 기존 Auth 정상 동작
- [ ] 기존 프로필 CRUD 정상 동작
- [ ] 기존 프로젝트 CRUD 정상 동작 (기존 컬럼에 영향 없는지)
- [ ] 프로젝트 피드에서 데이터 조회 정상
- [ ] 숨긴 메뉴(캘린더, 문서, CRM) 라우팅 비활성화 확인

---

## Phase 3: 커뮤니티 핵심 기능 (3주차)

- **브랜치**: `feature/community-feedback` (최신 dev에서 분기)
- **수정 범위**: 프론트 + 새 DB 테이블 생성
- **위험도**: ★★☆☆☆ 중간 이하 (기존 테이블과 독립적)

### 새 DB 테이블

#### comments 테이블

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  school TEXT,
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책 (필요 시)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (true);
```

#### interests 테이블

```sql
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_email)
);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read interests" ON interests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert interests" ON interests FOR INSERT WITH CHECK (true);
```

### 프론트엔드 변경

1. **프로젝트 상세 뷰에 코멘트(훈수) 영역 추가**
   - 닉네임 + 학교 선택 드롭다운 + 코멘트 입력
   - 코멘트 리스트 (helpful_count 순 정렬)
   - "도움이 됐어요" 버튼
2. **프로젝트 카드에 "관심 있어요" 버튼 추가**
   - 클릭 시 interests 테이블에 저장
   - 카드에 관심 수 카운트 표시
3. **인증 범위**
   - 구경 + 훈수: 비로그인 (닉네임 + 학교만)
   - 관심 표현 + 커피챗 신청: 이메일 입력 필요

### 일정

| 일정 | 작업 내용 |
|------|----------|
| Day 1-2 | comments, interests 테이블 생성 + RLS 정책 설정 |
| Day 2-3 | 프로젝트 상세 뷰에 코멘트(훈수) 입력/표시 기능 구현 |
| Day 3-4 | "도움이 됐어요" 버튼 + helpful_count 정렬 구현 |
| Day 4-5 | interests 테이블 + "관심 있어요" 버튼 + 카운트 표시 |
| Day 6-7 | 테스트 + dev 머지 + 버그 픽스 |

### 머지 전 체크리스트

- [ ] 기존 Auth/프로필/프로젝트 CRUD 정상 동작
- [ ] 코멘트 생성/조회 정상 동작
- [ ] 관심 표현 생성/카운트 정상 동작
- [ ] "도움이 됐어요" 카운트 증가 정상 동작
- [ ] 비로그인 상태에서 코멘트 작성 가능 확인

---

## Phase 4: 커피챗 + AI 공고 생성 (4주차)

- **브랜치**: `feature/coffee-chat` (최신 dev에서 분기)
- **수정 범위**: 프론트 + 새 DB 테이블 + API 연동
- **위험도**: ★★★☆☆ 중간

### 새 DB 테이블

#### coffee_chats 테이블

```sql
CREATE TABLE coffee_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coffee_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read own chats" ON coffee_chats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chats" ON coffee_chats FOR INSERT WITH CHECK (true);
```

### 프론트엔드 변경

1. **커피챗 신청/수락/거절 플로우**
   - "관심 있어요" 누른 사람에게 "커피챗 신청하기" 버튼 노출
   - 신청 시 이메일 입력
   - 프로젝트 올린 사람에게 신청 알림 (이메일)
   - 수락 시 서로 연락 수단(카카오톡 오픈채팅 링크 등) 공개
2. **Interview Mode → 프로젝트 등록용으로 카피 수정**
   - 기존 온보딩 플로우 재활용
   - 질문 변경:
     - Step 1: "나는 ___입니다" (창업자/예비창업자/합류희망자) — 카드 선택
     - Step 2: "함께할 사람을 찾고 있어요" (개발자/디자이너/기획자/마케터) — 복수 선택
     - Step 3: "관심 분야" (AI·테크/커머스/헬스케어/에듀테크/소셜임팩트) — 카드 선택
     - Step 4: "프로젝트를 한 줄로 설명해주세요" — 텍스트 입력
     - Step 5: "지금 고민되는 포인트가 있나요?" — 텍스트 입력
     - Step 6: AI가 공고 카드 생성 → 수정 가능
3. **AI 공고 생성 API 연동**
   - 1차: Gemini API (무료 티어, VITE_GEMINI_API_KEY 클라이언트 직접 호출)
   - 2차: 품질 부족 시 Claude Haiku API ($1/$5 per MTok)로 전환
   - 프롬프트: 사용자 입력(역할, 분야, 설명, 고민포인트) → 팀빌딩 공고 텍스트 생성
4. **Waitlist 연동**
   - AI 공고 생성 후 "공고를 게시하려면 이메일을 등록하세요"
   - 이메일 + 공고 데이터 함께 저장
   - "🎉 N번째로 등록되었어요!" 확인 화면

### 일정

| 일정 | 작업 내용 |
|------|----------|
| Day 1-2 | coffee_chats 테이블 생성 + 커피챗 신청/수락/거절 플로우 구현 |
| Day 2-3 | 수락 시 연락 수단 교환 (카카오톡 오픈채팅 링크 등) |
| Day 3-5 | Interview Mode 카피 수정 → 프로젝트 등록용 + AI 공고 생성 API 연동 |
| Day 5-6 | 이메일 알림 설정 (Supabase Edge Function 또는 클라이언트 직접) |
| Day 7 | 전체 통합 테스트 + CEREAL 멤버 베타 테스트 시작 |

### 머지 전 체크리스트

- [ ] 기존 Auth/프로필/프로젝트 CRUD 정상 동작
- [ ] 커피챗 신청 → 수락 → 연락수단 교환 플로우 정상
- [ ] AI 공고 생성 API 호출 정상 (에러 핸들링 포함)
- [ ] Waitlist 이메일 저장 정상
- [ ] Interview Mode 전체 플로우 정상 동작

---

## 브랜치 전략

```
main (production)
 └── dev (개발 통합)
      ├── feature/landing-redesign     (Phase 1 → dev 머지)
      ├── feature/project-feed         (Phase 2 → dev 머지)
      ├── feature/community-feedback   (Phase 3 → dev 머지)
      └── feature/coffee-chat          (Phase 4 → dev 머지)
```

### 머지 규칙

1. 각 브랜치 작업 완료 후 dev에 머지
2. 다음 브랜치는 반드시 최신 dev에서 분기
3. 기존 Auth · 프로필 · 프로젝트 CRUD가 깨지지 않는지 머지 전 반드시 확인
4. Phase 2 진입 전 Supabase 스키마 백업 필수
5. 삭제할 컴포넌트는 코드 삭제 대신 라우팅에서 숨김 처리

---

## 리스크 관리

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 기존 Auth/프로필 기능 깨짐 | ★★★★★ 치명적 | 백엔드 수정 최소화. 새 테이블 추가 방식. 머지 전 기존 기능 테스트 필수. |
| 4주 내 완료 못 함 | ★★★☆☆ 중간 | Phase 1~2만으로도 아이디어톤 전 테스트 가능. Phase 3~4는 행사 후 추가. |
| AI API 비용 초과 | ★★☆☆☆ 낮음 | Gemini 무료 티어로 시작. 품질 부족 시 Claude Haiku ($1/$5 per MTok) 전환. |
| 초기 유저 부족 | ★★★☆☆ 중간 | CEREAL 네트워크 (160~240명) 활용. 아이디어톤 전후로 유저 획득. |
| 스팸/어뷰징 | ★★☆☆☆ 낮음 | 초기엔 닉네임 + 학교 선택만. 심해지면 이메일 인증 추가. |

---

## 성공 지표 (4월 아이디어톤 전까지)

| 지표 | 목표값 | 측정 방법 |
|------|--------|----------|
| 등록된 프로젝트 수 | 15개 이상 | Supabase projects 테이블 카운트 |
| 코멘트(훈수) 수 | 50개 이상 | comments 테이블 카운트 |
| 커피챗 성사율 | 5건 이상 | coffee_chats status=accepted |
| Waitlist 등록 | 30명 이상 | waitlist 테이블 / 이메일 수집 |
| 크로스캠퍼스 연결 | 3개 학교 이상 | 서로 다른 학교 간 커피챗 성사 |

---

## 기존 UI 자산 활용 가이드

### 그대로 쓸 것
- **Trending Projects 카드 레이아웃** → 메인 피드로 승격
- **상단 배너 카드** (Deep Health, Project Alpha 등) → "주목할 프로젝트"
- **탭 필터** (ALL, PROJECTS 등) → "ALL, 프로젝트, 팀원 찾기"로 변경
- **Interview Mode** → 프로젝트 등록 플로우 (카피만 수정)
- **로그인 화면** → 톤 유지, 카피만 수정
- **디자인 시스템** → 모노톤 컬러, 모노스페이스 타이포, 태그 스타일, 카드 컴포넌트

### 라우팅에서 숨길 것 (코드 삭제 X)
- 대시보드 페이지 (WORKSPACE/MAIN)
- 캘린더 (WORKSPACE/SCHEDULE)
- 문서 관리 (WORKSPACE/DOCS)
- CRM/네트워크 (CRM/CONTACTS)
- 상세 프로필의 AI Matching Report

### 새로 만들 것
- CommunityFeedback 섹션 (프로젝트 + 훈수 코멘트 목업)
- 프로젝트 상세 뷰 코멘트 영역
- "관심 있어요" 버튼 컴포넌트
- 커피챗 신청/수락 UI
