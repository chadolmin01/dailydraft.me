# Draft 제품 플로우 맵

> 자동 생성: 2026-04-13 | 소스: 코드베이스 전체 라우트/링크 분석

## 전체 네비게이션 플로우

```mermaid
flowchart TD
  %% ════════════════════════════════════
  %% 스타일 정의
  %% ════════════════════════════════════
  classDef auth fill:#FEF3C7,stroke:#D97706,color:#92400E
  classDef public fill:#DBEAFE,stroke:#2563EB,color:#1E40AF
  classDef dashboard fill:#D1FAE5,stroke:#059669,color:#065F46
  classDef admin fill:#EDE9FE,stroke:#7C3AED,color:#5B21B6
  classDef hidden fill:#F3F4F6,stroke:#9CA3AF,color:#6B7280,stroke-dasharray: 5 5
  classDef api fill:#FEE2E2,stroke:#DC2626,color:#991B1B
  classDef middleware fill:#FCE7F3,stroke:#DB2777,color:#9D174D

  %% ════════════════════════════════════
  %% 인증 플로우
  %% ════════════════════════════════════
  subgraph AUTH["인증 플로우"]
    ROOT["/\n랜딩 페이지"]:::public
    LOGIN["/login\n로그인"]:::auth
    CALLBACK["/auth/callback\nOAuth 콜백"]:::auth
    ONBOARD["/onboarding\n온보딩 1단계"]:::auth
    INTERVIEW["/onboarding/interview\n온보딩 2단계"]:::auth
  end

  ROOT -- "인증됨 (middleware)" --> EXPLORE
  ROOT -- "미인증" --> LOGIN
  LOGIN -- "이메일/OAuth 성공" --> EXPLORE
  LOGIN -- "?redirect= 파라미터" --> |redirect 경로|EXPLORE
  LOGIN -- "Google/GitHub/Discord" --> CALLBACK
  CALLBACK -- "신규유저" --> ONBOARD
  CALLBACK -- "기존유저 (온보딩 완료)" --> EXPLORE
  CALLBACK -- "기존유저 (온보딩 미완)" --> ONBOARD
  CALLBACK -- "에러" --> LOGIN
  ONBOARD -- "3.2초 후 자동" --> INTERVIEW
  INTERVIEW -- "완료" --> EXPLORE
  INTERVIEW -- "인증 에러" --> ONBOARD

  %% ════════════════════════════════════
  %% 메인 네비게이션 (탭바/사이드바)
  %% ════════════════════════════════════
  subgraph NAV["글로벌 네비게이션 (BottomTabBar + Sidebar)"]
    EXPLORE["/explore\n피드/탐색"]:::public
    PROJECTS["/projects\n내 프로젝트"]:::dashboard
    PROFILE["/profile\n프로필"]:::dashboard
    NOTIF["/notifications\n알림"]:::dashboard
    MORE["/more\n더보기/설정"]:::dashboard
    MESSAGES["/messages\n메시지"]:::dashboard
  end

  %% 탭바 양방향 연결 (모든 페이지에서 접근 가능)
  EXPLORE <--> PROJECTS
  EXPLORE <--> PROFILE
  EXPLORE <--> NOTIF
  EXPLORE <--> MORE
  MORE --> MESSAGES

  %% ════════════════════════════════════
  %% Explore 페이지 연결
  %% ════════════════════════════════════
  subgraph EXPLORE_DETAIL["Explore 상세"]
    EXPLORE_PROJECT["/explore?project={id}\n프로젝트 모달"]:::public
    EXPLORE_SEARCH["/explore?q=...\n검색 결과"]:::public
    EXPLORE_COFFEE["/explore?coffeeChat=...\n커피챗 요청"]:::public
    PROJECT_PUBLIC["/p/{id}\n프로젝트 공개뷰"]:::public
  end

  EXPLORE --> EXPLORE_PROJECT
  EXPLORE --> EXPLORE_SEARCH
  EXPLORE --> EXPLORE_COFFEE
  EXPLORE --> PROJECT_PUBLIC
  EXPLORE_PROJECT -- "미인증 시 지원 클릭" --> LOGIN
  EXPLORE_PROJECT -- "본인 프로젝트 수정" --> PROJECT_EDIT

  %% ════════════════════════════════════
  %% Projects 플로우
  %% ════════════════════════════════════
  subgraph PROJ["프로젝트 관리"]
    PROJECT_NEW["/projects/new\n프로젝트 생성"]:::dashboard
    PROJECT_DETAIL["/projects/{id}\n프로젝트 상세"]:::dashboard
    PROJECT_EDIT["/projects/{id}/edit\n프로젝트 수정"]:::dashboard
  end

  PROJECTS --> PROJECT_NEW
  PROJECT_NEW -- "생성 완료" --> PROJECT_PUBLIC
  PROJECT_DETAIL -- "미소유자" --> PROFILE
  PROJECT_DETAIL -- "리디렉트" --> PROJECT_PUBLIC
  PROJECT_EDIT -- "저장 완료" --> PROJECT_PUBLIC
  PROJECT_EDIT -- "나가기" --> PROFILE
  PROFILE --> PROJECT_NEW

  %% ════════════════════════════════════
  %% Profile 플로우
  %% ════════════════════════════════════
  PROFILE -- "미인증 (서버)" --> LOGIN
  PROFILE -- "프로필 수정" --> INTERVIEW
  PROFILE -- "기회 보기" --> EXPLORE

  %% /profile/edit는 /profile로 서버 리디렉트
  PROFILE_EDIT["/profile/edit\n(→ /profile 리디렉트)"]:::hidden
  PROFILE_EDIT -- "즉시 리디렉트" --> PROFILE

  %% ════════════════════════════════════
  %% Clubs 플로우
  %% ════════════════════════════════════
  subgraph CLUBS["클럽 관리"]
    CLUBS_LIST["/clubs\n클럽 목록"]:::dashboard
    CLUB_DETAIL["/clubs/{slug}\n클럽 상세"]:::dashboard
    CLUB_SETTINGS["/clubs/{slug}/settings\n클럽 설정"]:::dashboard
    CLUB_DISCORD["/clubs/{slug}/settings/discord\n디스코드 연동"]:::dashboard
  end

  CLUBS_LIST --> CLUB_DETAIL
  CLUB_DETAIL -- "관리자" --> CLUB_SETTINGS
  CLUB_DETAIL -- "관리자" --> CLUB_DISCORD
  CLUB_SETTINGS --> CLUB_DETAIL
  CLUB_DISCORD -- "완료" --> CLUB_SETTINGS
  EXPLORE -- "캠퍼스맵 클럽 클릭" --> CLUB_DETAIL

  %% ════════════════════════════════════
  %% Discord 연동 플로우
  %% ════════════════════════════════════
  subgraph DISCORD["Discord 연동"]
    CONNECT_DISCORD["/connect/discord\nDiscord 연결"]:::dashboard
    API_DISCORD_OAUTH["/api/discord/oauth\nOAuth 시작"]:::api
    API_DISCORD_CALLBACK["/api/discord/oauth/callback\nOAuth 콜백"]:::api
    API_DISCORD_INSTALL["/api/discord/install\n봇 설치"]:::api
  end

  CONNECT_DISCORD -- "미인증" --> LOGIN
  CONNECT_DISCORD -- "연결 시작" --> API_DISCORD_OAUTH
  API_DISCORD_OAUTH -- "Discord 외부" --> API_DISCORD_CALLBACK
  API_DISCORD_CALLBACK -- "성공" --> CONNECT_DISCORD
  API_DISCORD_CALLBACK -- "인증 에러" --> MORE
  API_DISCORD_CALLBACK -- "토큰 에러" --> LOGIN
  CONNECT_DISCORD -- "연결 완료" --> CLUBS_LIST
  EXPLORE -- "Discord 로그인" --> API_DISCORD_OAUTH

  %% ════════════════════════════════════
  %% More 페이지 연결
  %% ════════════════════════════════════
  MORE --> PROFILE
  MORE --> MESSAGES
  MORE --> PROJECT_NEW
  MORE -- "기관 관리자" --> INSTITUTION
  MORE -- "앱 관리자" --> ADMIN
  MORE -- "로그아웃" --> ROOT

  %% ════════════════════════════════════
  %% Notifications 연결
  %% ════════════════════════════════════
  NOTIF -- "알림 클릭" --> |동적 경로|EXPLORE

  %% ════════════════════════════════════
  %% Dashboard (from 내부 링크)
  %% ════════════════════════════════════
  subgraph DASH_HIDDEN["Dashboard (HIDDEN)"]
    DASHBOARD["/dashboard\n대시보드"]:::hidden
  end
  DASHBOARD --> PROJECT_NEW
  DASHBOARD --> PROJECTS
  DASHBOARD --> EXPLORE_PROJECT
  DASHBOARD --> MESSAGES
  DASHBOARD --> NOTIF
  DASHBOARD --> EXPLORE
  DASHBOARD --> PROFILE
  DASHBOARD --> CLUB_DETAIL

  %% ════════════════════════════════════
  %% Institution 관리
  %% ════════════════════════════════════
  subgraph INST["기관 관리 (Institution Admin)"]
    INSTITUTION["/institution\n기관 대시보드"]:::admin
    INST_ANNOUNCE["/institution/announce\n공지 작성"]:::admin
    INST_MEMBERS["/institution/members\n멤버 관리"]:::admin
    INST_REPORTS["/institution/reports\n리포트"]:::admin
    INST_TEAMS["/institution/teams\n팀 관리"]:::admin
    INST_BP["/institution/business-plans\n사업계획서"]:::admin
  end

  INSTITUTION --> INST_ANNOUNCE
  INSTITUTION --> INST_MEMBERS
  INSTITUTION --> INST_REPORTS
  INSTITUTION --> INST_TEAMS
  INSTITUTION --> INST_BP
  INST_ANNOUNCE --> INSTITUTION
  INST_MEMBERS --> INSTITUTION
  INST_REPORTS --> INSTITUTION
  INST_TEAMS --> INSTITUTION
  INST_BP --> INSTITUTION
  INSTITUTION -- "미인증" --> LOGIN
  INSTITUTION -- "권한 없음" --> EXPLORE

  %% ════════════════════════════════════
  %% Admin 관리
  %% ════════════════════════════════════
  subgraph ADM["앱 관리 (Admin)"]
    ADMIN["/admin\n관리자"]:::admin
    ADMIN_ACTIVITY["/admin/activity\n활동 로그"]:::admin
    ADMIN_ERRORS["/admin/error-logs\n에러 로그"]:::admin
    ADMIN_INST["/admin/institutions\n기관 관리"]:::admin
    ADMIN_INVITE["/admin/invite-codes\n초대코드"]:::admin
    ADMIN_OPP["/admin/opportunities\n기회 관리"]:::admin
    ADMIN_USERS["/admin/users\n유저 관리"]:::admin
  end

  ADMIN --> ADMIN_ACTIVITY
  ADMIN --> ADMIN_ERRORS
  ADMIN --> ADMIN_INST
  ADMIN --> ADMIN_INVITE
  ADMIN --> ADMIN_OPP
  ADMIN --> ADMIN_USERS
  ADMIN -- "권한 없음" --> EXPLORE
  ADMIN --> ONBOARD

  %% ════════════════════════════════════
  %% HIDDEN 라우트 (middleware 차단)
  %% ════════════════════════════════════
  subgraph BLOCKED["HIDDEN 라우트 (middleware → /explore)"]
    H_CALENDAR["/calendar"]:::hidden
    H_DOCUMENTS["/documents"]:::hidden
    H_NETWORK["/network"]:::hidden
    H_USAGE["/usage"]:::hidden
    H_WORKFLOW["/workflow"]:::hidden
    H_BP["/business-plan"]:::hidden
    H_IDEAS["/validated-ideas"]:::hidden
    H_VALIDATOR["/idea-validator"]:::hidden
    H_DESIGN["/design"]:::hidden
  end

  H_CALENDAR --> EXPLORE
  H_DOCUMENTS --> EXPLORE
  H_NETWORK --> EXPLORE
  H_USAGE --> EXPLORE
  H_WORKFLOW --> EXPLORE
  H_BP --> EXPLORE
  H_IDEAS --> EXPLORE
  H_VALIDATOR --> EXPLORE
  H_DESIGN --> EXPLORE

  %% ════════════════════════════════════
  %% 레거시 라우트 (middleware 차단)
  %% ════════════════════════════════════
  subgraph LEGACY["레거시 라우트 (middleware → /explore)"]
    L_PROJECT["/project/*\nideate/create/build/plan"]:::hidden
    L_RECRUIT["/recruit"]:::hidden
    L_SETTINGS["/settings\n(→ /profile)"]:::hidden
  end

  L_PROJECT --> EXPLORE
  L_RECRUIT --> EXPLORE
  L_SETTINGS --> PROFILE

  %% ════════════════════════════════════
  %% 기타 공개 라우트
  %% ════════════════════════════════════
  GUIDE["/guide\n가이드"]:::public
  OFFLINE["/offline\n오프라인"]:::public
  DEV_ONBOARD["/dev/onboarding\n(개발용)"]:::hidden
  LANDING["/landing\n랜딩"]:::public

  %% ════════════════════════════════════
  %% Middleware 보호 규칙
  %% ════════════════════════════════════
  subgraph MW["Middleware 보호 규칙"]
    MW_AUTH["미인증 → /login"]:::middleware
    MW_ONBOARD["온보딩 미완 → /onboarding"]:::middleware
    MW_HIDDEN["HIDDEN 라우트 → /explore"]:::middleware
  end
```

## 고아 라우트 (진입 경로 부재/제한적)

| 라우트 | 상태 | 비고 |
|--------|------|------|
| `/guide` | 공개 | 네비게이션에서 링크 없음 — 직접 URL 입력으로만 접근 |
| `/offline` | 공개 | PWA 오프라인 폴백 전용 |
| `/landing` | 공개 | 네비게이션에서 링크 없음 — `/`과 별도 존재 |
| `/dev/onboarding` | 개발용 | 개발 환경 전용 |
| `/dashboard` | HIDDEN | middleware 차단, 내부 링크는 존재하나 접근 불가 |
| `/profile/edit` | 리디렉트 | 즉시 `/profile`로 리디렉트 |

## API 라우트 (리디렉트 포함)

| API | 동작 | 목적지 |
|-----|------|--------|
| `/api/discord/oauth` | 302 Redirect | Discord OAuth 엔드포인트 |
| `/api/discord/oauth/callback` | 302 Redirect | `/explore`, `/settings?error=`, `/login?returnTo=` |
| `/api/discord/install` | 302 Redirect | Discord 봇 초대 URL |
| `/api/health` | 200 JSON | 헬스체크 |

## 주요 플로우 요약

### 신규 유저
```
/ → /login → OAuth → /auth/callback → /onboarding → /onboarding/interview → /explore
```

### 기존 유저
```
/ → (middleware) → /explore
```

### 프로젝트 생성
```
/projects → /projects/new → /p/{id} (공개뷰)
```

### 클럽 관리
```
/explore (캠퍼스맵) → /clubs/{slug} → /clubs/{slug}/settings/discord
```

### Discord 연동
```
/connect/discord → /api/discord/oauth → Discord → /api/discord/oauth/callback → /clubs
```
