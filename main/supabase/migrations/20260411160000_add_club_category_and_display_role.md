# Migration Report: 20260411160000_add_club_category_and_display_role

**일시**: 2026-04-11
**작성**: Claude Opus 4.6 (Co-authored)
**상태**: 작성 완료, 적용 대기

---

## 배경

wireframe(`/wireframe/0904-prototype/`)을 기준으로 실제 앱 UI를 리디자인하는 작업의 **사전 준비 마이그레이션**이다.

wireframe 분석 결과, 현재 DB 스키마에 2가지 데이터 갭이 확인되었다:

### 갭 1: 클럽 카테고리 없음

| wireframe | 현재 DB |
|-----------|---------|
| 클럽 카드에 `사이드프로젝트`, `창업` 등 카테고리 뱃지 표시 | `clubs` 테이블에 `category` 컬럼 없음 |
| Explore 클럽 탭에서 카테고리별 필터 | 필터 불가 |

**wireframe 참조**: `explore.html` line 1295 — `<span class="badge badge-brand">사이드프로젝트</span>`

### 갭 2: 멤버 표시 역할 없음

| wireframe | 현재 DB |
|-----------|---------|
| 멤버 카드에 `개발 리드`, `회장`, `백엔드` 등 표시 | `club_members.role`은 권한용 ENUM (owner/admin/member/alumni) |
| 자유 텍스트 역할 | 고정 4개 값만 허용 |

**wireframe 참조**: `club-profile.html` line 211 — `<div class="member-role">개발 리드</div>`

---

## 변경 내용

### 1. `clubs.category` (text, nullable)

```sql
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category text;
CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category) WHERE category IS NOT NULL;
```

- **타입**: 자유 텍스트 (CHECK 제약 없음)
- **이유**: 클럽마다 카테고리가 다양. MVP에서 ENUM 강제는 과잉
- **예시 값**: `사이드프로젝트`, `창업`, `데이터 분석`, `코딩`, `디자인`, `스타트업`, `스터디`
- **인덱스**: partial index (NULL 제외) — 카테고리 필터 쿼리 최적화

### 2. `club_members.display_role` (text, nullable)

```sql
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS display_role text;
```

- **기존 `role`과의 관계**:
  - `role` = 시스템 권한 → RLS, API 권한 체크에 사용
  - `display_role` = 순수 UI 표시 → 프론트엔드에서만 소비
- **NULL 처리**: 프론트에서 `role` 기반 기본 라벨로 fallback
  - `owner` → "대표"
  - `admin` → "운영진"
  - `member` → "멤버"
  - `alumni` → "졸업"
- **예시 값**: `회장`, `부회장`, `개발 리드`, `백엔드`, `디자인 팀장`, `기획`

---

## 롤백 방법

```sql
ALTER TABLE clubs DROP COLUMN IF EXISTS category;
ALTER TABLE club_members DROP COLUMN IF EXISTS display_role;
DROP INDEX IF EXISTS idx_clubs_category;
```

---

## 영향 받는 코드 (향후 수정 필요)

| 영역 | 파일 | 작업 |
|------|------|------|
| Explore 클럽 탭 | `explore/page.tsx`, `ExplorePageClient.tsx` | clubs 쿼리에 `category` 추가, 뱃지 렌더링 |
| Explore 사람 카드 | `ExplorePageClient.tsx` | 소속 클럽 chip + display_role 표시 |
| 클럽 프로필 페이지 | (신규) | 멤버 목록에 display_role 표시 |
| 클럽 관리 페이지 | `clubs/[slug]/route.ts` | PATCH에 category 허용 |
| 멤버 관리 | `clubs/[slug]/members/route.ts` | display_role 업데이트 API |
| TypeScript 타입 | `src/types/database.ts` | 타입 재생성 필요 (`supabase gen types`) |

---

## wireframe ↔ DB 전체 매핑 현황

이 마이그레이션 적용 후의 상태:

| wireframe 요소 | DB 컬럼 | 상태 |
|----------------|---------|------|
| 클럽 카테고리 뱃지 | `clubs.category` | **이번에 추가** |
| 멤버 표시 역할 | `club_members.display_role` | **이번에 추가** |
| 학교명 | `profiles.university` | 이미 존재 |
| 학과/전공 | `profiles.major` | 이미 존재 |
| 기수 | `club_members.cohort` | 이미 존재 |
| 역할 뱃지 (개발/기획 등) | `profiles.desired_position` | 이미 존재 |
| 상태 뱃지 (팀 찾는 중) | `profiles.current_situation` | 이미 존재 |
| 클럽 로고 | `clubs.logo_url` | 이미 존재 |
| 멤버수/프로젝트수 | 집계 쿼리 | 쿼리로 해결 |
