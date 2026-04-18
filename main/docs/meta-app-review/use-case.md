# Meta App Review — Use Case Description

Meta 리뷰 제출란 "How will your app use this permission?"에 붙여넣을 설명입니다.
영문/한글 병기. **영문 섹션을 그대로 복사해서 제출**하시면 됩니다.

---

## English (submit this)

### App Overview

Draft is a SaaS platform for Korean university clubs and student organizations.
Clubs use Draft to manage projects, team operations, and content publication.
A core feature is the **Persona Engine**, which learns each club's tone from
its Discord conversations and drafts social media content for the operators.
After a human approval step, the approved content is published to the club's
connected social accounts automatically.

Website: https://draft.co.kr
Target users: University club operators (president, officers) in South Korea.

### Permission: `threads_content_publish`

**Why we need it:**
Clubs generate weekly updates, event announcements, and recruitment posts
via our AI ghostwriter. The operator reviews and approves each draft in
Draft's dashboard. Upon approval (or at a scheduled time), Draft posts the
finalized text to the operator's own Threads account on their behalf.

**User flow:**
1. The club operator signs into Draft and navigates to Persona Settings.
2. They click "Connect Threads" — this initiates OAuth with `threads_basic`
   and `threads_content_publish` scopes.
3. Once authorized, Draft stores the long-lived token (AES-256 encrypted) in
   our database, scoped to the club's persona.
4. When a draft is approved (manually or via scheduled publish), Draft calls
   `POST /{ig-user-id}/threads` then `POST /{ig-user-id}/threads_publish` to
   post the text content to the operator's Threads account.
5. The operator can disconnect at any time; this revokes our stored token.

**We do NOT:**
- Post without explicit human approval of the draft.
- Share or sell any user data or tokens to third parties.
- Access any Threads content other than the operator's own profile.

**Data handling:**
- Access tokens are encrypted at rest using AES-256-GCM (server-held key).
- Tokens are never exposed to the browser or logged in plaintext.
- On disconnection, the token row is hard-deleted from our database.

### Permission: `threads_basic`

Used only to fetch the authenticated user's `id` and `username` for display
in the Draft UI ("Connected as @username"). No other profile data is read or
stored.

---

## 한국어 참고본

### 앱 소개

Draft는 한국 대학교 동아리 및 학생 단체를 위한 SaaS입니다. 동아리는 Draft로
프로젝트 관리, 팀 운영, 콘텐츠 발행을 하며, 핵심 기능인 **페르소나 엔진**이
Discord 대화에서 동아리의 톤을 학습해 SNS 초안을 자동 생성합니다. 운영진이
승인한 초안만 연결된 SNS 계정에 자동 게시됩니다.

### 권한: `threads_content_publish`

**필요 이유:** 동아리가 AI 고스트라이터로 만든 주간 업데이트·이벤트 공지·모집글을
운영진이 Draft 대시보드에서 검토·승인하면, 승인된 글이 운영진 본인 Threads
계정으로 자동 게시됩니다.

**사용자 플로우:**
1. 운영진이 Draft 로그인 → 페르소나 설정
2. "Threads 연결" 클릭 → OAuth (scope: `threads_basic`, `threads_content_publish`)
3. 승인 시 long-lived 토큰을 AES-256 암호화하여 DB 저장
4. 초안 승인(또는 예약 시각 도달) 시 Threads Graph API로 게시
5. 사용자는 언제든 연결 해제 가능 (토큰 즉시 삭제)

**하지 않는 것:**
- 명시적 승인 없이 자동 게시하지 않음
- 데이터/토큰을 제3자에게 공유/판매하지 않음
- 본인 프로필 외 Threads 콘텐츠에 접근하지 않음

**데이터 처리:**
- 토큰은 AES-256-GCM으로 암호화 저장
- 브라우저나 로그에 평문 노출 없음
- 연결 해제 시 토큰 행 완전 삭제
