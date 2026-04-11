-- ================================================================
-- Migration: 20260411160000_add_club_category_and_display_role
-- Author: Claude Opus 4.6 (Co-authored)
-- Date: 2026-04-11
-- ================================================================
--
-- 목적
-- ----
-- wireframe(0904-prototype)에서 정의한 UI를 실제 앱에 반영하기 위한
-- 스키마 확장. 두 가지 데이터 갭을 해소한다:
--
--   1) clubs.category — 클럽 카드에 표시되는 카테고리 뱃지
--      wireframe 예시: "사이드프로젝트", "창업", "데이터 분석", "스터디" 등
--      현재: clubs 테이블에 카테고리 컬럼 없음 → Explore 클럽 탭에서
--      필터링/뱃지 표시 불가
--
--   2) club_members.display_role — 클럽 내 표시용 역할
--      wireframe 예시: "개발 리드", "회장", "백엔드", "디자인 팀장" 등
--      현재: club_members.role은 권한 제어용 ENUM(owner/admin/member/alumni)
--      → UI에 "개발 리드" 같은 자유 텍스트 역할을 보여줄 수 없음
--
-- 설계 결정
-- ---------
-- - category는 CHECK 제약이 아닌 자유 텍스트(text)로 정의
--   → 클럽마다 카테고리가 다양하고, 운영자가 직접 입력하는 구조.
--     향후 categories 참조 테이블로 정규화 가능하지만 MVP에선 과잉.
--
-- - display_role도 자유 텍스트(text, nullable)
--   → role(owner/admin/member)은 권한 로직용, display_role은 순수 표시용.
--     "회장"이라고 써도 권한은 admin일 수 있고, 그 반대도 가능.
--     NULL이면 UI에서 role 기본값("멤버", "운영진" 등)으로 fallback.
--
-- 영향 범위
-- ---------
-- - Explore 클럽 탭: category 뱃지 표시 + 카테고리 필터
-- - 사람 카드: 소속 클럽 chip 옆에 display_role 표시
-- - 클럽 프로필: 멤버 목록에서 display_role 표시
-- - 클럽 관리 페이지: category 설정 UI, 멤버별 display_role 편집
--
-- 롤백
-- ----
-- ALTER TABLE clubs DROP COLUMN IF EXISTS category;
-- ALTER TABLE club_members DROP COLUMN IF EXISTS display_role;
-- DROP INDEX IF EXISTS idx_clubs_category;
-- ================================================================


-- ============================================================
-- 1. clubs.category — 클럽 카테고리 (뱃지 표시 + 필터용)
-- ============================================================
-- wireframe에서 사용하는 카테고리 목록:
--   사이드프로젝트, 창업, 데이터 분석, 코딩, 디자인, 스타트업, 스터디
-- 자유 텍스트이므로 이 외의 값도 허용됨.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS category text;

COMMENT ON COLUMN clubs.category IS
  '클럽 카테고리. Explore 탭의 뱃지/필터에 사용. 예: 사이드프로젝트, 창업, 스터디';

-- 카테고리별 필터 쿼리 성능을 위한 인덱스
-- WHERE category = '사이드프로젝트' 같은 등호 검색에 최적화
CREATE INDEX IF NOT EXISTS idx_clubs_category
  ON clubs(category)
  WHERE category IS NOT NULL;


-- ============================================================
-- 2. club_members.display_role — 클럽 내 표시용 역할
-- ============================================================
-- 기존 role 컬럼과의 차이:
--   role          = 시스템 권한 (owner/admin/member/alumni)
--   display_role  = UI 표시명  (회장, 개발 리드, 백엔드, 디자인 팀장 등)
--
-- NULL이면 프론트에서 role 기반 기본 라벨로 fallback:
--   owner → "대표", admin → "운영진", member → "멤버", alumni → "졸업"

ALTER TABLE club_members
  ADD COLUMN IF NOT EXISTS display_role text;

COMMENT ON COLUMN club_members.display_role IS
  '클럽 내 표시용 역할. 자유 텍스트. NULL이면 role 기반 기본 라벨 사용';
