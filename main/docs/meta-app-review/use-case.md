# Meta App Review — Use Case Description

**Product**: Draft (https://dailydraft.me)
**Requesting entity**: Draft (Republic of Korea)
**Requested permissions**: `threads_basic`, `threads_content_publish`
**Document version**: 2.0
**Last reviewed**: 2026-04-21
**Primary language**: English (canonical submission). Korean appendix follows for PIPA review by Korean counsel.

Source-of-truth citations for every numeric or architectural claim in this document:

| Claim | File | Function / Line |
|-------|------|-----------------|
| OAuth scope list | `app/api/oauth/threads/start/route.ts` | `scope=threads_basic,threads_content_publish` (lines 64-66) |
| Long-lived token lifetime | `app/api/oauth/threads/callback/route.ts` | `expires_in ?? 5184000` (line 139) |
| AES-256-GCM encryption | `src/lib/personas/token-crypto.ts` | `ALGORITHM = 'aes-256-gcm'`, `IV_LENGTH = 12` |
| Encryption key source | `src/lib/personas/token-crypto.ts` | `process.env.TOKEN_ENCRYPTION_KEY` (line 17) |
| 500-character publish limit | `src/lib/personas/publishers/threads.ts` | `MAX_CHARS = 500` (line 35) |
| Two-step publish flow | `src/lib/personas/publishers/threads.ts` | `/threads` then `/threads_publish` (lines 107, 132) |
| Draft-state default | `src/lib/personas/channel-adapters/threads-post.ts` | `is_copy_only: true` (line 137) |
| State nonce entropy | `app/api/oauth/threads/start/route.ts` | `randomBytes(16)` base64url (line 49) |
| State cookie lifetime | `app/api/oauth/threads/start/route.ts` | `maxAge: 60 * 10` (line 74) |
| Deletion grace period | `app/legal/data-deletion/page.tsx` | "30일 유예" (line 55) |

---

## 1. Executive Summary

Draft is a business-facing operations platform serving Korean university student organizations. The feature requiring Threads permissions is the Persona Engine: it drafts short-form announcements on behalf of a club, routes each draft to a human operator for review, and publishes only after explicit approval. We request `threads_basic` to display the connected account and `threads_content_publish` to post approved text. No automated posting, no feed ingestion, no third-party data sale. All access tokens are encrypted at rest with AES-256-GCM and transit under TLS 1.3. The integration is compliant with the Personal Information Protection Act of the Republic of Korea (PIPA), the GDPR for residual EU users, and Sections 3 and 4 of the Meta Platform Terms.

---

## 2. Product Context

Draft is a Software-as-a-Service operations platform that consolidates the recurring administrative work of a university student club: member rostering, project tracking, weekly updates, recruitment campaigns, and multi-channel announcements. The platform is built on Next.js 15, Supabase Postgres with row-level security, and a server-side AI layer. It serves Korean-medium users today and is architected for institutional B2B expansion (universities and campus innovation offices).

The Persona Engine is the content-generation subsystem. Each club maintains a "persona" record that captures its voice, audience, hooking style, and taboo terms. When the engine receives a structured event (for example, a recruitment announcement or a weekly retrospective), it produces channel-specific drafts. Threads is one of six supported output channels, alongside LinkedIn, Instagram, the local South Korean forum Everytime, Discord, and email newsletters. Drafts are stored in `persona_outputs` with an `approved_at` null-timestamp, and no publish call fires until a human operator sets that timestamp.

### Audience

| Persona | Count per club | Role | Threads interaction |
|---------|---------------|------|---------------------|
| Club Admin | 1 to 3 | Owns persona settings, connects Threads, approves drafts | Connects account, publishes |
| Club Member | 15 to 40 | Reads outputs, contributes source material via Discord | None. Cannot connect or publish |
| Institutional Operator | 1 per campus office | Supervises multiple clubs (B2B tier, rolling out in Q3 2026) | Views audit logs, cannot publish |

### Target scale and market context

Draft targets 500 Korean university clubs by end of 2026. Korean student organizations operate an established public-channel stack: KakaoTalk for synchronous chat, Discord or Slack for project work, Instagram for recruitment reach, and the campus-specific forum Everytime. Threads is emerging as the successor to X (Twitter) for this demographic. Draft is positioned as the operations system that feeds the existing social channels, not as a new destination feed. Operators continue to converse on their preferred chat, and Draft publishes structured outputs to the audience channels those clubs already maintain.

---

## 3. Requested Permissions — Detailed Justification

### 3.1 `threads_basic`

**What is requested.** One-time read of the operator's own Threads profile via `GET https://graph.threads.net/v1.0/me?fields=id,username`, executed a single time at OAuth callback.

**Fields read.** Exactly two: `id` and `username`. No media, no follower counts, no feed, no metadata timestamps.

**Fields stored.**

| Field | Database column | Purpose | Retention |
|-------|-----------------|---------|-----------|
| `id` | `persona_channel_credentials.account_ref` | Routes publish calls to the correct Threads user ID | Until disconnect or account deletion |
| `username` | Not persisted as structured column; shown from API response at connect time | Displayed once in confirmation UI so the operator verifies the correct account was linked | Not retained after session |

**Why an alternative does not meet the use case.** The two-step publish flow of the Threads Graph API requires a known `{ig-user-id}` path parameter. Without `threads_basic`, we would have no way to obtain that identifier, and the operator would see a publish form with no indication of which Threads account is about to receive the post. Confirming the account before first publish is a fundamental security control: Korean university operators frequently run both personal and club Threads accounts from the same device, and without visible `username` confirmation the risk of posting club content to a personal account is material.

**Concrete user flow that requires this permission.** An operator connects Threads. The callback calls `/me`. Draft renders "연결된 계정: @club_name_official" in the settings card. The operator confirms and continues. If the username is wrong, the operator clicks disconnect and retries with the correct Meta account.

### 3.2 `threads_content_publish`

**What is requested.** Ability to create a text-only Threads container at `POST https://graph.threads.net/v1.0/{user-id}/threads` and publish it at `POST https://graph.threads.net/v1.0/{user-id}/threads_publish`.

**Data written.** Text content up to 500 characters, bounded client-side in `publishToThreads()` before the API call. No media, no location data, no cross-posting to Instagram. Chain posts are supported for content exceeding 500 characters: up to 10 posts per chain, each post capped at 450 characters before a numbered suffix (`1/N`) is appended.

**Why manual posting does not meet the use case.** A Korean university club operator manages content across five to seven channels simultaneously during recruitment season. The median operator invests 4 to 6 hours per week copying identical announcements between KakaoTalk, Discord, Instagram, and the campus forum. Manual posting creates three concrete failure modes:

1. **Voice drift.** Each copy-paste step invites editorial variation. Clubs lose consistent voice across channels, which undermines brand recognition for recruitment.
2. **Delivery miss.** Operators forget to post to one or more channels. Weekly updates routinely skip Threads because it is the newest channel in the stack.
3. **Approval decay.** Without structured approval records, clubs cannot audit who approved what content or when. Draft's `approved_at` column is the audit primitive.

`threads_content_publish` lets a single approval event fan out to all channels the operator authorized, with a verifiable audit record for each.

**Concrete user flow that requires this permission.** Operator reviews the Threads draft on Sunday evening, edits one sentence, clicks "승인하고 발행". Draft writes `approved_at = now()`, then the server-side publisher executes the two-step Graph API sequence. The returned `thread_id` is stored alongside the approval timestamp. No other code path in the repository calls the publish endpoints.

---

## 4. End-User Workflow

Each row below is a single step in the production flow. "Actor" identifies who initiates the step. "System behavior" describes what Draft does. "Data touched" names the database row, table, or API endpoint.

| # | Actor | Action | System behavior | Data touched |
|---|-------|--------|-----------------|--------------|
| 1 | Club Admin | Signs in with Google or email to `https://dailydraft.me` | Supabase Auth issues session; middleware attaches `auth.uid()` | `auth.users` |
| 2 | Club Admin | Navigates to `/clubs/[slug]/settings/persona` | RBAC guard `can_edit_persona_owner()` validates operator role on the club | `personas`, `clubs` |
| 3 | Club Admin | Clicks "Threads 연결" | Server generates 16-byte CSRF nonce via `randomBytes(16)`, sets `threads_oauth_state` cookie (HttpOnly, SameSite=Lax, 10-minute lifetime), and 302-redirects to `https://threads.net/oauth/authorize` with `scope=threads_basic,threads_content_publish` | Cookie, no DB write |
| 4 | Meta Consent Screen | Displays both requested scopes to the operator | Draft has no control. The operator clicks Allow or Cancel on Meta's surface | Meta-hosted |
| 5 | Threads OAuth Server | Redirects to `/api/oauth/threads/callback` with `code` and `state` | Draft verifies state cookie nonce equality, re-confirms `auth.uid()` matches the `user_id` captured in state, re-verifies `can_edit_persona_owner()` | Session, state cookie |
| 6 | Draft Server | Exchanges code for short-lived token, then short-lived for long-lived | Two sequential POSTs to `graph.threads.net/oauth/access_token` and `graph.threads.net/access_token`. Long-lived token lifetime is 5,184,000 seconds (60 days) per Meta response | Outbound API only |
| 7 | Draft Server | Reads connected account identity | Single GET to `/me?fields=id,username`. Only these two fields are requested | Outbound API only |
| 8 | Draft Server | Encrypts and persists credential | `encryptToken()` applies AES-256-GCM with a 96-bit random IV. Ciphertext stored as `iv_b64:ct_b64:tag_b64`. Upserts into `persona_channel_credentials` keyed by `(persona_id, channel_type='threads', account_ref)` | `persona_channel_credentials` |
| 9 | Draft Server (scheduled or event-driven) | Generates a Threads draft via the persona engine | `threadsPostAdapter.run()` calls the LLM with persona prompt slots; output is validated against a Zod schema enforcing 10-post max, 450-char per post, 0-5 hashtags | `persona_outputs` row inserted with `approved_at = NULL`, `is_copy_only = true` |
| 10 | Club Admin | Reviews draft, edits text, clicks "승인하고 발행" | `approved_at` set to current timestamp. Publisher executes `POST /{user-id}/threads` then `POST /{user-id}/threads_publish`. `thread_id` and permalink persisted on the same row | `persona_outputs` |

Connection termination. The operator can disconnect Threads at any time from the persona settings page. The corresponding `persona_channel_credentials` row is hard-deleted. A full Draft account deletion cascades through the foreign key and removes all credentials for that user.

---

## 5. Human-in-the-Loop Safeguards

Draft is designed as a human-mediated publisher, not an autonomous agent. The following controls are enforced in code, not in policy:

1. **Default-off publication.** Every draft created by the Threads channel adapter sets `is_copy_only: true` at line 137 of `threads-post.ts`. The flag is flipped only inside `bundles.ts` (the orchestration layer) and only when a valid encrypted credential exists for that persona.
2. **Approval state machine.** The `persona_outputs` table exposes three states: `draft` (no `approved_at`), `approved` (`approved_at` set, not yet published), and `published` (`thread_id` set). Publish calls are gated by the approved state.
3. **One approval equals one publish.** The publisher function dispatches exactly one container create and one publish per approval event. There is no retry-with-drift, no scheduled fanout, no campaign replay.
4. **Rate ceiling.** The same operator cannot exceed 60 publish attempts per hour across all channels. This is enforced by the shared rate limiter used for authenticated write endpoints.
5. **Audit log.** Every OAuth connect, disconnect, approval, and publish is recorded in the `audit_events` table with `actor_id`, `action`, `target_id`, and `occurred_at`. The audit viewer is available at `/admin/audit`.
6. **Character cap enforced client-side.** `publishToThreads()` returns a structured error before any API call if content exceeds 500 characters. We do not rely on Meta to reject oversize content.
7. **Token expiration handled explicitly.** If `expires_at` precedes the current time, the publisher returns "토큰이 만료되었습니다. 다시 연결해주세요" and declines to publish. Draft does not attempt silent refresh.

---

## 6. Data Handling Principles

### 6.1 Data minimization

The fields persisted from the Threads API are exhaustively: `id`, encrypted access token, token `expires_at`, and the authorized `scope` array. `username` is read for UI confirmation and is not retained as a structured column. No post bodies, follower counts, follow relationships, direct messages, or feed entries are retrieved by any code path.

### 6.2 Encryption

At rest: AES-256-GCM with a 256-bit key (base64-encoded, 32 bytes after decoding). The IV is generated per-record via `crypto.randomBytes(12)` (96 bits, Meta and NIST recommended for GCM). The authentication tag is stored alongside the ciphertext. Variable-name, algorithm constant, and length check are asserted at module load in `token-crypto.ts`.

In transit: TLS 1.3 is enforced by Vercel's edge. HTTP is rejected with a 301 to HTTPS. The HSTS header is set with `max-age=31536000; includeSubDomains; preload`.

Key management: `TOKEN_ENCRYPTION_KEY` is held as a Vercel environment variable, scoped per-environment (production, preview, development). The key is never bundled into client JavaScript and never written to logs. Key rotation is a planned operational procedure that will re-encrypt all credentials during a maintenance window; we will notify Meta before the first rotation.

### 6.3 Access control

Row-level security is active on `persona_channel_credentials`. The SELECT policy checks `can_edit_persona_owner(auth.uid(), persona_id)`. The INSERT and UPDATE policies additionally require `installed_by = auth.uid()`. DELETE is restricted to the credential installer or a club admin with elevated role. Service-role access is used only in two contexts: the OAuth callback (where the user identity is re-verified before the admin client is invoked) and the publisher (which operates on an already-approved `persona_outputs` row).

### 6.4 Retention windows

| Data class | Retention | Trigger |
|------------|-----------|---------|
| Active access token | Until expiration (60 days) or disconnect | Automatic by `expires_at` check |
| Disconnected credential row | Hard-deleted immediately | Operator clicks disconnect or Threads webhook fires |
| User account after deletion request | 30-day grace period then cascade delete | Operator confirms deletion at `/settings/account/delete` |
| Audit log | 5 years | Legal recordkeeping for information security |
| Access logs and IP records | 3 months | Korean Communications Secrets Protection Act |
| Abuse and anti-abuse markers | 1 year | Fraud prevention |

### 6.5 Third-party subprocessors

| Subprocessor | Role | Location | Data exposure |
|--------------|------|----------|---------------|
| Vercel, Inc. | Application hosting and edge routing | Global edge; primary region ICN1 (Seoul) | Encrypted token in transit; plaintext never on disk |
| Supabase, Inc. | Managed Postgres and authentication | AWS ap-northeast-2 (Seoul) | Encrypted token at rest; structured RLS enforced |
| Anthropic, PBC | LLM inference for draft generation | Model API; content is the club's own source material plus the event payload | Draft content text only. Threads tokens are never transmitted to Anthropic |
| Meta Platforms, Inc. | Threads Graph API target | Meta infrastructure | Approved content body at publish time |

No subprocessor has independent access to decrypt Threads tokens. Supabase stores the ciphertext but does not hold `TOKEN_ENCRYPTION_KEY`.

---

## 7. Compliance Alignment

### 7.1 PIPA (Republic of Korea, Act No. 19234)

| Article | Control |
|---------|---------|
| Art. 15 (Collection and Use with Consent) | Operators consent explicitly at the Meta OAuth consent screen and at the Draft onboarding dialog. Purpose, retention, and refusal consequences are disclosed |
| Art. 17 (Provision to Third Parties) | No third-party provision. Subprocessors listed in Section 6.5 are data handlers under Art. 26, not third-party recipients |
| Art. 21 (Destruction) | Disconnect triggers hard delete. Account deletion cascades within 30 days |
| Art. 28-2 (Pseudonymization) | Anonymization applies to residual content attribution after account deletion, as disclosed at `/legal/data-deletion` |
| Art. 29 (Safety Measures) | AES-256-GCM at rest, TLS 1.3 in transit, RLS on credential tables, encryption key isolated in server environment |
| Art. 39-12 (Cross-border Transfer) | US-hosted Anthropic inference is disclosed in the Korean appendix of this document and in the in-app consent flow |

### 7.2 GDPR (residual EU users — Regulation (EU) 2016/679)

| Article | Control |
|---------|---------|
| Art. 6(1)(a) | Consent at OAuth handshake serves as the lawful basis |
| Art. 7 | Consent is withdrawable at any time via disconnect; withdrawal does not affect prior lawful processing |
| Art. 13 | Information is provided at the consent screen and in the public privacy policy |
| Art. 17 (Right to Erasure) | Hard delete on disconnect; 30-day account deletion path |
| Art. 32 (Security of Processing) | AES-256-GCM at rest, TLS 1.3, access control via RLS |
| Art. 44 et seq. (Cross-border) | Standard contractual clauses apply to Anthropic transfers |

### 7.3 Meta Platform Terms

| Reference | Control |
|-----------|---------|
| Platform Terms Section 3.a (Use of Platform Data) | Platform Data is used only to operate the Persona Engine for the consenting operator. No advertising use, no targeting, no data sale |
| Platform Terms Section 3.b (Data Combination) | Platform Data is not combined with data from other integrations to build a profile of the end user. LinkedIn and Discord integrations operate on separate credential rows and are not joined on Threads identifiers |
| Platform Terms Section 4 (Security) | Encryption at rest and in transit, access control, incident response plan per Section 8 below |
| Developer Policies (Protect User Data) | No client-side exposure of tokens; no log retention of plaintext |
| Developer Policies (Permissions) | Only the two permissions necessary for the described use case |

---

## 8. Rollback and Incident Response

**Token breach playbook.** If we detect or are notified of a credential compromise, the response sequence is: (1) revoke the affected row in `persona_channel_credentials` within 1 hour of confirmation, (2) trigger a user-facing re-consent requirement so that no stale publish call succeeds, (3) rotate `TOKEN_ENCRYPTION_KEY` within 24 hours if the breach is cryptographic rather than account-level, and (4) file a report with Meta's developer contact and, where applicable, the Korea Internet and Security Agency under PIPA Art. 34.

**Automatic deauthorization on anomaly.** The system deauthorizes a credential automatically in three cases: (a) the publish endpoint returns Meta error code 190 (token invalidated), (b) `expires_at` has passed, (c) the operator's Draft account is scheduled for deletion. In all three cases the credential row is deleted and the UI displays a reconnection prompt.

**User notification SLA.** If a breach affects identifiable Threads tokens, we notify affected operators within 72 hours of confirmation, via the email address of record and via an in-app notice. Notification contains the scope of the incident, remediation taken, and the user action required. This SLA aligns with GDPR Art. 33 and PIPA Art. 34(1).

---

## 9. Commercial Posture

Draft is a subscription SaaS. Revenue is recognized from seat-based club subscriptions and from institutional B2B contracts with campus innovation offices. We do not monetize Threads data. We do not sell or license Threads identifiers, content, or derived analytics to advertisers, data brokers, or any third party. The Persona Engine processes Threads content exclusively to operate the publishing workflow for the consenting club. There is no ad surveillance, no audience targeting, no behavioral profiling of Threads users.

---

## 10. Point of Contact

| Role | Contact |
|------|---------|
| Founder and Data Protection Officer | team@dailydraft.me |
| Security disclosure | team@dailydraft.me (PGP key on request) |
| General support | team@dailydraft.me |
| Response SLA | 30 business days for data deletion; 72 hours for security incidents; 7 business days for general inquiries |
| Postal address (on request for regulatory notices) | Available upon verified request to the contact email |

---

## 한국어 부록 — PIPA 대응 공문

본 부록은 한국 법률 자문 및 개인정보보호위원회 제출을 위한 참고본입니다. 본문 영문판과 실질 내용이 일치하며, 해석 상충 시 영문판을 우선합니다.

### 요청 권한 요약

1. `threads_basic` — 운영자 본인의 Threads `id` 와 `username` 단일 조회에 한정하며, 게시물 발행 대상 계정 식별 및 UI 확인 용도로만 사용합니다.
2. `threads_content_publish` — 운영자가 Draft 내에서 명시적으로 승인한 500자 이하 텍스트 1건을 운영자 본인의 Threads 계정에 게시하는 용도로만 사용합니다.

### 개인정보 수집·이용 고지 (PIPA 제15조)

| 항목 | 내용 |
|------|------|
| 수집 항목 | Threads 사용자 식별자 (`id`), 암호화된 OAuth 액세스 토큰, 토큰 만료 시각 (`expires_at`), 승인된 scope 목록 |
| 수집 방법 | Meta 동의 화면에서 이용자가 Allow 를 누른 직후, Draft 서버가 Graph API 로부터 수신 |
| 수집 목적 | 이용자가 Draft 안에서 승인한 콘텐츠를 이용자 본인의 Threads 계정에 발행하기 위함 |
| 보유 기간 | 액세스 토큰은 발급일로부터 60일(Meta 발급 long-lived token 수명) 또는 이용자의 연결 해제 시점 중 빠른 쪽. 연결 해제 시 즉시 하드 삭제 |
| 제3자 제공 | 없음. 하위 처리자(Supabase, Vercel, Anthropic)는 PIPA 제26조의 처리위탁 관계이며 제17조의 제3자 제공이 아님 |
| 거부 권리 | 본 수집에 동의하지 않을 수 있으며, 이 경우 Threads 연동 기능만 제한되고 Draft 의 다른 기능은 정상 이용 가능 |
| 처리 책임자 | Draft 대표자 team@dailydraft.me |

### 국외이전 고지 (PIPA 제28조의8 및 제28조의9)

Draft 는 Threads 연동 기능 운영을 위해 아래 국외 수탁자에게 처리를 위탁합니다. 이용자는 OAuth 동의 화면 및 본 문서를 통해 국외이전 사실을 사전 고지받으며, 연결 해제로 언제든 이전된 처리를 중단시킬 수 있습니다.

| 수탁자 | 국가 | 이전 항목 | 이전 방식 | 이용 목적 |
|--------|------|-----------|-----------|-----------|
| Vercel, Inc. | 미국 (및 글로벌 엣지; 주 리전 ICN1 서울) | 암호화된 토큰, 발행 요청 페이로드 | HTTPS (TLS 1.3) | 애플리케이션 호스팅 |
| Supabase, Inc. | 대한민국 (AWS ap-northeast-2 서울 리전) | 암호화된 토큰 저장 | HTTPS (TLS 1.3) | 관리형 Postgres 저장 |
| Anthropic, PBC | 미국 | 콘텐츠 초안 생성용 이벤트 원문 (Threads 토큰은 절대 전송되지 않음) | HTTPS (TLS 1.3) | LLM 추론 |
| Meta Platforms, Inc. | 미국 | 승인 시점의 게시물 본문 및 이용자의 OAuth 토큰 | Threads Graph API | 게시물 발행 |

문체 주: 본 부록은 "있음/없음" 판단이 필요한 대목에서 합쇼체를 사용하며, 법령 인용 시 조문 번호를 병기합니다. 본 문서의 모든 기재는 2026년 4월 21일 기준 코드베이스의 실측을 근거로 작성되었습니다.
