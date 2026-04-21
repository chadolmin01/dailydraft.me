# Meta App Review — Use Case Description

Meta for Developers 앱 리뷰 제출 시 "How will your app use this permission?" 응답란에 붙여넣는 문서입니다. 영문 버전이 공식 제출본이며, 한국어 버전은 내부 검토용 참고본입니다.

- 제품: Draft (https://dailydraft.me)
- 요청 권한: `threads_basic`, `threads_content_publish`
- 구현 경로(코드 검증 완료):
  - OAuth 시작: `app/api/oauth/threads/start/route.ts`
  - OAuth 콜백: `app/api/oauth/threads/callback/route.ts`
  - 발행 로직: `src/lib/personas/publishers/threads.ts`
  - 콘텐츠 초안 생성: `src/lib/personas/channel-adapters/threads-post.ts`
  - 운영자용 UI: `app/(dashboard)/clubs/[slug]/settings/persona/page.tsx`

---

## 1. 개요 (Overview)

### English

Draft is a SaaS operations platform for Korean university clubs and student organizations. Operators (club presidents, officers, content leads) use Draft to run recurring workflows: project management, member rostering, weekly updates, and multi-channel content publishing.

The feature requiring Threads permissions is the **Persona Engine**. It learns each club's voice and style from the club's own Discord conversations and past posts, then drafts content for approval. Once an operator reviews and approves a draft inside Draft, the approved text is published to the operator's connected Threads account on their behalf.

Target users: Korean university club operators (approximately 20 to 40 member clubs; primary users are 20 to 24 year old undergraduates acting as club officers).

Draft does not publish to Threads accounts that belong to individuals unrelated to the club, and does not read third-party content feeds. The only Threads account involved is the one the operator themselves authorizes.

### 한국어 참고본

Draft는 한국 대학생 동아리·학생 단체를 위한 운영 SaaS입니다. 운영진(회장·운영진·콘텐츠 담당)이 프로젝트 관리·멤버 운영·주간 업데이트·멀티채널 콘텐츠 발행을 Draft 한 곳에서 처리합니다.

Threads 권한이 필요한 기능은 **페르소나 엔진**입니다. 동아리의 Discord 대화와 과거 게시물에서 톤/문체를 학습한 뒤, 동아리별 초안을 자동 생성합니다. 운영진이 Draft 안에서 초안을 검토·승인한 뒤에만, 운영진 본인의 Threads 계정으로 발행됩니다.

---

## 2. 주 사용자와 시나리오 (Who and When)

### English

Primary users: **Club operators** authenticated in Draft with a Google or email login. Within Draft, they hold an "operator" role on at least one club and have access to `/clubs/[slug]/settings/persona`.

Typical scenarios where `threads_content_publish` is exercised:

1. **Weekly update.** Every Sunday evening, an operator opens the persona dashboard, reviews the AI-generated Threads draft summarizing the week's activity (based on Discord posts and project updates), edits if needed, and publishes.
2. **Recruitment period (semester start).** Operators run a 2 to 4 week recruitment push. Draft generates a series of short Threads posts (one per day) introducing the club. Each post still requires manual approval before publication.
3. **Event announcement.** When a new event is scheduled in Draft, the operator can optionally approve a Threads announcement post.

Not in scope: individual students' personal Threads accounts, general Threads feed browsing, or messaging other Threads users.

### 한국어

주 사용자: Draft에 Google/이메일로 로그인한 **동아리 운영진**. 해당 동아리에 operator 권한이 있고 `/clubs/[slug]/settings/persona` 에 접근 가능한 사용자입니다.

대표 시나리오:

1. **주간 업데이트** — 매주 일요일 저녁, 운영진이 한 주간 활동을 요약한 Threads 초안을 검토·수정 후 발행
2. **모집 시즌** — 학기 초 2~4주 동안 동아리 소개 포스트를 일 단위로 승인·발행
3. **행사 공지** — 새 이벤트 등록 시 Threads 공지 초안을 선택적으로 승인·발행

개인 학생의 개인 Threads 계정이나 타 사용자 피드 조회, DM 등은 사용 범위가 아닙니다.

---

## 3. 사용자 플로우 (User Flow)

### English

1. **Sign in.** Operator signs into Draft at https://dailydraft.me and navigates to their club's persona settings at `/clubs/[slug]/settings/persona`.
2. **Connect Threads.** Operator clicks the "Threads 연결" button. Draft redirects to `https://threads.net/oauth/authorize` with `scope=threads_basic,threads_content_publish`, `response_type=code`, and a CSRF-protected `state` nonce.
3. **Consent.** The Meta consent screen shows both requested scopes. Operator clicks Allow.
4. **Token exchange.** Threads redirects back to `/api/oauth/threads/callback`. Draft exchanges the authorization code for a short-lived token, then exchanges that for a long-lived 60-day token. Draft calls `GET /me?fields=id,username` to obtain the account reference for display.
5. **Storage.** The long-lived token is encrypted with AES-256-GCM (server-side key) and upserted into `persona_channel_credentials` keyed by `(persona_id, channel_type='threads', account_ref)`. Plaintext tokens are never returned to the browser or written to logs.
6. **Draft generation.** When an event or update occurs, Draft's persona engine generates a Threads-formatted text draft (respecting the 500-character limit via the channel adapter in `threads-post.ts`). The draft is saved with `is_copy_only: true` until the operator reviews it.
7. **Review and approval.** Operator opens the draft in Draft's content hub, edits freely, and clicks the approve-and-publish control. This is a deliberate two-step process: drafts are never auto-published without this explicit click.
8. **Publish.** The publisher in `threads.ts` executes the Meta-required two-step flow: `POST /{ig-user-id}/threads` (media_type=TEXT) to create a container, then `POST /{ig-user-id}/threads_publish` to publish. Draft stores the returned `thread_id` and optional permalink.
9. **Disconnection.** Operator can disconnect at any time from the persona settings page. The corresponding row in `persona_channel_credentials` is hard-deleted and the in-memory token reference is cleared.

### 한국어

1. Draft(https://dailydraft.me) 로그인 → `/clubs/[slug]/settings/persona` 진입
2. "Threads 연결" 클릭 → `https://threads.net/oauth/authorize` 로 리다이렉트 (scope: `threads_basic,threads_content_publish`, CSRF state 포함)
3. Meta 동의 화면에서 두 scope 명시적 표시 → 운영진이 Allow 클릭
4. `/api/oauth/threads/callback` 으로 복귀 → authorization code → short-lived → long-lived (60일) 2단계 교환. `/me?fields=id,username` 으로 계정 ID·username 조회
5. long-lived 토큰 AES-256-GCM 암호화 후 `persona_channel_credentials` 에 upsert. 평문은 브라우저/로그 어디에도 남지 않음
6. 이벤트/업데이트 발생 시 Threads 어댑터가 500자 이하 초안 생성 → `is_copy_only: true` 상태로 저장
7. 운영진이 초안 검토·수정 후 "승인하고 발행" 명시적 클릭 (이 클릭 없이는 절대 발행되지 않음)
8. `POST /{user-id}/threads` 로 컨테이너 생성 → `POST /{user-id}/threads_publish` 로 발행. `thread_id` 및 permalink 저장
9. 연결 해제: `persona_channel_credentials` 행 하드 삭제

---

## 4. 권한별 용도 (Permission by Permission)

### `threads_content_publish`

**English**

Used exclusively to post text content that the operator has explicitly reviewed and approved inside Draft. Each publish call maps one-to-one with a human approval event recorded in our database (`persona_outputs` table, `approved_at` field).

Implementation details visible to the reviewer:
- Publish endpoint: `src/lib/personas/publishers/threads.ts`, function `publishToThreads()`
- Hard 500-character cap enforced client-side before the API call
- Two-step Meta flow (create container, then publish)
- No scheduling automation publishes without a prior human approval event

**한국어**

운영진이 Draft 안에서 명시적으로 검토·승인한 텍스트를 본인의 Threads 계정에 게시하는 용도로만 사용합니다. 발행 1회는 DB의 승인 이벤트 1건과 1:1 매칭됩니다 (`persona_outputs.approved_at`). 사전 승인 없는 스케줄 발행은 존재하지 않습니다.

### `threads_basic`

**English**

Used only to call `GET /me?fields=id,username` at connection time. Purposes:
1. Store `id` as `account_ref` so the publisher knows which Threads account to post to.
2. Display `@username` in Draft's UI so operators can confirm they connected the correct account.

No other profile fields, media, or feed data is read.

**한국어**

연결 시점에 `GET /me?fields=id,username` 한 번만 호출합니다. 용도:
1. `id` 를 `account_ref` 로 저장하여 어느 계정에 게시할지 식별
2. `@username` 을 UI에 표시하여 운영진이 올바른 계정을 연결했는지 확인

그 외 프로필·미디어·피드 데이터는 일체 읽지 않습니다.

---

## 5. 데이터 처리 원칙 (Data Handling Principles)

### English

- **Encryption at rest.** All access tokens are encrypted with AES-256-GCM before being stored. The encryption key is held only in a server-side environment variable (`PERSONA_TOKEN_ENCRYPTION_KEY`) and is never exposed to clients.
- **No plaintext logging.** Token values are never written to application logs, Sentry events, or analytics payloads. The codebase enforces this by routing decryption through a single helper (`decryptToken()`) called only inside server-side publisher functions.
- **Minimal data collection.** The only fields stored from Threads are: user `id`, `username`, the encrypted access token, its `expires_at`, and the OAuth `scope` array. No posts, followers, or feed data are retrieved.
- **No third-party sharing.** Draft does not sell, share, or transfer any Threads-origin data to third parties. Meta Platform Data is not combined with data from other integrations (LinkedIn, Discord) except to the extent that the same operator's content draft references multiple channels.
- **Deletion on disconnect.** When an operator disconnects Threads, the credential row is hard-deleted from `persona_channel_credentials`. A full Draft account deletion also removes the row by cascade.
- **Deletion on request.** Users may request full data deletion via `privacy@dailydraft.me` or by following the instructions at https://dailydraft.me/legal/data-deletion.
- **Token expiry.** Long-lived tokens expire in 60 days. Draft does not auto-refresh without user interaction; expired credentials surface a "재연결 필요" state in the UI.

### 한국어

- **저장 시 암호화**: 모든 액세스 토큰은 저장 전 AES-256-GCM으로 암호화. 키는 서버 환경변수(`PERSONA_TOKEN_ENCRYPTION_KEY`)에만 존재, 클라이언트 노출 없음
- **평문 로그 금지**: 토큰 값은 앱 로그, Sentry 이벤트, 애널리틱스 페이로드 어디에도 기록되지 않음. 복호화는 단일 헬퍼(`decryptToken()`)를 통해 서버 발행 함수 내부에서만 호출
- **최소 수집**: Threads 에서 저장하는 필드는 `id`, `username`, 암호화된 토큰, `expires_at`, `scope` 배열뿐. 게시물, 팔로워, 피드 데이터 미수집
- **제3자 비공유**: Threads 데이터를 판매·공유·양도하지 않으며, 다른 연동(LinkedIn, Discord) 데이터와 결합하지 않음
- **연결 해제 시 삭제**: 운영진이 연결 해제하면 `persona_channel_credentials` 행을 하드 삭제. Draft 계정 완전 삭제 시에도 cascade로 삭제됨
- **삭제 요청**: `privacy@dailydraft.me` 이메일 또는 https://dailydraft.me/legal/data-deletion 안내 경로를 통해 수동 삭제 가능
- **토큰 만료**: long-lived 60일. 자동 갱신 없음. 만료 시 UI에 "재연결 필요" 상태 노출
