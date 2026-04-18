# Access Policy — Draft 라우트 분류 정책

**원칙**: "로그아웃 상태에서 노출되는 건 사실상 상수. 캐시/데이터 상관없이 매번 동일하게 보여야 하며, 수정 불가."

이 문서는 Draft 앱의 모든 라우트를 **7개 tier** 중 하나로 분류하고, 각 tier 의 규칙을 정의합니다.

단일 진실 소스: [`main/src/lib/access/manifest.ts`](../main/src/lib/access/manifest.ts)

---

## Tier 정의

| Tier | 접근 | 데이터 | UI | 대표 페이지 |
|------|------|--------|----|-------------|
| `public` | 누구나 | 정적/denormalized 만 | 상수 렌더, 수정 UI 없음 | `/`, `/explore`, `/p/[id]` |
| `auth` | 로그인 필수 | RLS 적용, 본인 데이터 | 기능별 상태 | `/dashboard`, `/profile` |
| `club-admin` | 특정 클럽 admin/owner | admin 전용 | role 체크 선행 | `/clubs/[slug]/settings` |
| `platform-admin` | app_metadata.is_admin | 전체 | API + UI 이중 체크 | `/admin/*` |
| `institution-admin` | 기관 관리자 | 기관 소속 | 별도 권한 플로우 | `/institution/*` |
| `hidden` | 차단 | - | middleware 에서 `/explore` 리다이렉트 | `/calendar`, `/workflow` |
| `dev` | 로컬 전용 | - | production 에서 404 | `/dev/onboarding` |

---

## 규칙

### `public` — 로그아웃 가능 페이지

**✅ MUST**:
- 데이터는 **anon key 로 조회 가능한 것만** 사용
- 수치·목록이 있다면 **denormalized 공개 컬럼** 기반 (예: `clubs.public_member_count`)
- 로그인 상태 변화와 무관하게 동일 렌더
- 공유 링크 / SEO 크롤러 / OG 이미지 생성에 안정적 반응

**❌ MUST NOT**:
- 로그인 사용자 전용 API 호출 (401 재시도 금지)
- RLS 뒤에 숨은 데이터를 "0" 또는 "empty" 로 표시 ("거짓말 empty")
- 로그인한 사용자에게만 표시되는 버튼을 회색 처리로 혼재 → 로그인 CTA 로 치환

**체크리스트** (새 public 페이지 리뷰 시):
- [ ] 시크릿창에서 열어도 동일하게 보이나?
- [ ] Console 에 401/403 에러 없나?
- [ ] 표시되는 수치가 실제 DB 값과 일치하나? (또는 명백히 마케팅 데모임을 표시)
- [ ] 로그인하면 더 보이는 것에 명확한 CTA 가 있나?

**현재 갭** (해결 TODO):
- `/clubs/[slug]` — 멤버카운트/프로젝트카운트가 RLS 뒤에 있어 anon 에겐 "0" 으로 보임. `clubs.public_member_count` 등 denormalize 필요.

---

### `auth` — 로그인 필수

**✅ MUST**:
- `middleware.ts` 가 anon → `/login` 리다이렉트
- 유저별 개인화 OK
- RLS 자동 적용 (Supabase 세션 기반)

**체크리스트**:
- [ ] 시크릿창에서 열면 `/login` 으로 리다이렉트되나?
- [ ] 로그인 후 의도한 랜딩으로 복귀하나? (`next=<원래경로>` 처리)

---

### `club-admin` — 클럽 owner/admin

**✅ MUST**:
- middleware 는 로그인 체크만 (slug 모르므로)
- 페이지 내에서 `club_members.role IN ('owner', 'admin')` 확인
- API 에도 동일 체크 (frontend 만 체크하면 우회 가능)

**체크리스트**:
- [ ] 멤버(admin 아님) 로그인 상태로 진입 시 redirect 또는 forbidden 페이지?
- [ ] API endpoints 도 role 체크하나? (GET/POST/DELETE 각각)
- [ ] club-admin 이 취소되면 즉시 접근 차단? (세션 캐시 무효화)

---

### `platform-admin` — 앱 관리자

**✅ MUST**:
- `auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'` 체크
- RLS + API + UI 3중 체크 (depth defense)
- 감사 로그 (누가 언제 뭘 봤는지)

**체크리스트**:
- [ ] 일반 유저 토큰으로 API 직접 호출 시 403?
- [ ] admin 접근 로그가 남나?
- [ ] admin 세션 타임아웃이 일반보다 짧나? (권장)

---

### `institution-admin` — 기관 관리자

- `/institution/*` 라우트
- 기관 소속 검증 + role 체크
- platform-admin 과 독립

---

### `hidden` — MVP 모드 숨김

- middleware 가 `/explore` 로 강제 리다이렉트
- 코드 유지 (제거 대신 숨김)
- `main/middleware.ts` 의 `hiddenRoutes` 배열과 동기화

**활성화 방법**:
1. `manifest.ts` 에서 tier 를 `auth` 등으로 변경
2. `middleware.ts` 의 `hiddenRoutes` 에서 제거 (매니페스트가 자동 처리하도록 리팩터 예정)

---

### `dev` — 개발 전용

- 로컬 개발 / Staging 만 허용
- Production 에서는 404 반환 (middleware)

---

## 새 페이지 추가 체크리스트

1. **manifest.ts 에 등록**
   - `app/**/page.tsx` 새로 만들면 반드시 `ACCESS_MANIFEST` 배열에 pattern + tier 추가
   - 누락 시 middleware 가 기본값 `auth` 로 취급하지만, 명시 권장

2. **해당 tier 의 규칙 준수**
   - 위 "규칙" 섹션의 MUST/MUST NOT 항목 확인
   - public 이면 "정직성" 체크 (empty 가 거짓말 아닌지)

3. **PR 설명에 tier 명시**
   - 예: `adds /foo page (tier: public)`

4. **리뷰어 확인 항목**
   - 시크릿창 / 일반 창 둘 다 테스트
   - 401/403 콘솔 에러 없음
   - 데이터 fetch 가 tier 에 맞는 것만 (public 이면 denorm 컬럼만)

---

## 현재 상태 갭 (2026-04-19)

| 갭 | 영향 | 해결 방안 |
|----|-----|----------|
| `/clubs/[slug]` 가 public tier 인데 멤버카운트/프로젝트카운트가 RLS 뒤 | anon 에게 "0" 으로 잘못 표시 | `clubs.public_member_count` 등 denormalize 마이그레이션 + trigger |
| middleware 가 아직 manifest 를 import 안 함 | 정책과 middleware 가 2곳에 분산 | middleware.ts 리팩터 — `resolveAccessTier()` 사용으로 통합 |
| `/explore` 의 추천 섹션이 로그아웃 시 빈 상태 | "프로젝트에 필요한 사람" 혼란 | 로그아웃 모드 전용 섹션명 ("최신 프로필") 또는 로그인 CTA |
| CI 에서 manifest 누락 자동 감지 없음 | 새 페이지 등록 누락 가능 | `app/**/page.tsx` 전수 스캔 후 매니페스트 대조 스크립트 추가 |

---

## 향후 리팩터 계획

**Phase 2 (1~2일)** — 위 "갭" 해소
- middleware.ts 가 manifest 를 import, 하드코딩 제거
- CI 체크 스크립트 추가

**Phase 3 (런칭 전)** — 구조 강제
- `app/(public)/` / `app/(auth)/` 라우트 그룹 재편성
- denormalized 공개 컬럼 도입
- ESLint 규칙: public 페이지에서 `useAuth()` 또는 RLS 테이블 직접 쿼리 금지
