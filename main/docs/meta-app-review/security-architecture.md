# Security Architecture Dossier — Draft / Threads Integration

**Audience:** Meta App Review Security Team
**Maintainer:** Draft Engineering (team@dailydraft.me — see §11)
**Last revised:** 2026-04-21
**Scope:** Server-side controls protecting user data exchanged with Meta Graph (Threads) endpoints, plus the wider Draft platform surface that processes Threads-issued access tokens.

> **Reading note.** Every "Implemented" claim in this document is backed by a file reference in §14. Claims marked **Planned** are roadmap items with no production code today; they are listed so reviewers have a full picture of residual risk without ambiguity.

> **Status reconciliation (2026-04-21, post-authoring).** Items labeled "Planned" in §4, §13, §14 that name `meta-signed-request.ts`, `deauthorize/route.ts`, `data-deletion/route.ts`, or the `meta_data_deletion_requests` migration are in fact **Implemented and pushed** on branch `feat/threads-compliance-callbacks` at commit `7fc51b7`. They carry "Planned" here because this dossier was authored against `main` before the branch merged. The authoritative present-tense status table is `SUBMISSION.md §4 Pre-flight Readiness`. Merge is awaiting Vercel daily-deployment quota reset (≤24 hours from the package date).

---

## 1. Architecture Overview

Draft is a Next.js 15 (App Router) application hosted on Vercel, backed by Supabase Postgres with Row-Level Security (RLS) enabled on every tenant table. Outbound integrations are limited to Meta Graph (Threads), Anthropic Claude, Google Gemini, Discord, and email providers.

```
                         ┌──────────── TRUST BOUNDARY: Internet ─────────────┐
                         │                                                   │
   End user browser ─────┼──► Vercel Edge (TLS 1.3 termination, HTTP/2)      │
   (Chrome / Safari)     │       │                                           │
                         │       ▼                                           │
                         │   Next.js middleware.ts  ──► CSP / XFO / Referrer │
                         │       │                                           │
                         │       ▼                                           │
                         │   Next.js API Routes (Node.js runtime, Vercel     │
                         │     Fluid Compute; no persistent FS, no shell)    │
                         │       │                                           │
                         └───────┼───────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
 ┌──────────────┐      ┌────────────────────┐     ┌─────────────────┐
 │  Supabase    │      │  Meta Graph API    │     │  AI providers   │
 │  Postgres    │      │  (graph.threads.   │     │  Anthropic /    │
 │  + Auth      │      │   net, HTTPS)      │     │  Google Gemini  │
 │  (RLS on)    │      │                    │     │                 │
 └──────────────┘      └────────────────────┘     └─────────────────┘
  ▲ service_role                ▲                        ▲
  │ (server-side                │ Bearer <decrypted      │ API key
  │  only)                      │  long-lived token)     │ (server only)
  └─── encrypted token columns ─┘                        │

  ---- TRUST BOUNDARY: data at rest (Supabase, AES-256 + RLS) ----
```

**Data classification.**

| Class | Examples | Controls |
|---|---|---|
| Public | Club names, public project cards, `/explore` listings | RLS `USING (true)` where intended; no auth required |
| Internal | Club member lists, draft weekly updates | RLS scoped by `is_club_member()` SECURITY DEFINER helper |
| Confidential | `profiles.contact_email`, `profiles.contact_kakao`, `profiles.student_id`, direct messages | RLS scoped to owner / participants; export via `/api/me/export` gated on `auth.uid()` |
| **Restricted** | **Meta access tokens** (`persona_channel_credentials.encrypted_token`), Supabase service role key, `COOKIE_SECRET`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET` | Server-only access; tokens are AES-256-GCM encrypted at column level; secrets live in Vercel env vars, never in client bundle |

Trust boundaries: (a) Internet → Vercel Edge (TLS); (b) Edge → Next.js Node runtime (same Vercel tenant, internal HTTP); (c) API routes → Supabase (HTTPS + service-role JWT); (d) API routes → Meta Graph (HTTPS + user-scoped long-lived token).

---

## 2. OAuth Flow — Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User (browser)
    participant W as Next.js API (Vercel)
    participant M as threads.net OAuth
    participant G as graph.threads.net
    participant DB as Supabase Postgres

    U->>W: GET /api/oauth/threads/start?persona_id=<uuid>
    W->>W: Verify Supabase session (auth.getUser)
    W->>W: Generate 16-byte CSRF nonce (randomBytes)
    W->>U: 302 threads.net/oauth/authorize<br/>Set-Cookie: threads_oauth_state<br/>(HttpOnly, Secure, SameSite=Lax, 10 min)
    U->>M: Authorize (Meta consent screen)
    M-->>U: 302 /api/oauth/threads/callback?code=...&state=<nonce>
    U->>W: GET /api/oauth/threads/callback
    W->>W: Parse state cookie → compare nonce (CSRF check)
    W->>W: Re-check auth.getUser() == state.user_id
    W->>G: POST /oauth/access_token (client_id + secret + code)
    G-->>W: short-lived token (1 h)
    W->>G: GET /access_token?grant_type=th_exchange_token
    G-->>W: long-lived token (~60 days) + expires_in
    W->>G: GET /me?fields=id,username
    G-->>W: { id, username }
    W->>DB: RPC can_edit_persona_owner(...)
    DB-->>W: boolean
    W->>W: encryptToken(access_token) — AES-256-GCM
    W->>DB: UPSERT persona_channel_credentials (encrypted_token, expires_at, scope)
    W->>U: 302 return_to?threads=ok<br/>Set-Cookie: threads_oauth_state=; Max-Age=0
```

**Step-by-step controls.**

1. **`/start` entry** — requires an authenticated Supabase session (`supabase.auth.getUser()`); anonymous calls return 401.
2. **State cookie** — contains `{ nonce, persona_id, return_to, user_id }`, base64url-encoded, stored as an `HttpOnly`, `Secure` (in production), `SameSite=Lax` cookie with `Max-Age = 600` (10 min). `secure` flag is gated on `NODE_ENV === 'production'` (dev allows HTTP for localhost).
3. **Redirect to Meta** — `redirect_uri` is derived from `NEXT_PUBLIC_APP_URL`; must exactly match the URL registered in the Meta app dashboard (Meta enforces this).
4. **Callback nonce check** — `stateData.nonce !== stateNonce` short-circuits to an error redirect. This mitigates the classic OAuth CSRF (CWE-352).
5. **Session continuity check** — the callback re-reads `auth.getUser()` and aborts if `user.id !== stateData.user_id`, preventing token binding to a different account if the user session changed mid-flow.
6. **Short-lived → long-lived exchange** — if long-lived exchange fails, the short-lived token is still stored with a 1-hour TTL (and the UI shows a "reconnect soon" hint). No silent fallback to a longer TTL than Meta granted.
7. **Permission re-check** — before storing the credential, a Postgres RPC (`can_edit_persona_owner`) confirms that the authenticated user has rights over the persona row. This prevents a user from attaching a Threads account to a persona they do not own.
8. **Cleanup** — the state cookie is cleared (`Max-Age=0`) on successful redirect.

**Attack-vector analysis.**

| Vector | CWE | Mitigation |
|---|---|---|
| CSRF on authorize / callback | CWE-352 | 16-byte random nonce stored server-side in HttpOnly cookie + echoed as `state` query; mismatch → error |
| Replay of stale `code` | CWE-294 | 10-minute cookie TTL; Meta `code` is single-use and short-lived by spec |
| Session fixation / token binding | CWE-384 | Callback re-verifies that the authenticated user matches `state.user_id` |
| MITM on redirect | CWE-319 | TLS 1.3 mandatory in production; `Secure` cookie flag; HSTS **Planned** (see §6) |
| Redirect URI tampering | CWE-601 | `redirect_uri` is server-computed from env, not user input; Meta enforces exact match |
| Credential theft via open redirect | CWE-601 | `return_to` is only parsed as a path (`startsWith('/')`); external URLs are accepted only if they pass `new URL()` against the app origin — we rely on Meta's redirect-URI whitelist as the primary control here. A strict internal-path allowlist is **Planned**. |

---

## 3. Token Storage & Cryptography

**Algorithm.** `aes-256-gcm` via Node.js `crypto.createCipheriv`.
**Key length.** 32 bytes (256 bits), enforced at startup — decoded from base64 and length-checked; the process throws if not exactly 32 bytes.
**Nonce/IV.** 12 bytes (96 bits), the GCM-recommended length, generated per encryption via `crypto.randomBytes(12)`. Uniqueness is probabilistic (birthday bound at ~2^48 encryptions per key) which is acceptable for this workload (low six-figure tokens over key lifetime).
**Auth tag.** 16 bytes, appended to ciphertext and verified on decrypt via `decipher.setAuthTag()`. Tampering throws.
**Ciphertext format (stored in `persona_channel_credentials.encrypted_token`, `text` column).**

```
<iv-b64> ":" <ciphertext-b64> ":" <authtag-b64>
```

A split on `:` into exactly 3 parts is validated; malformed inputs throw `암호화 토큰 형식 오류`.

**Key management.**
- Variable name in code: **`TOKEN_ENCRYPTION_KEY`** (base64). The task brief referenced `PERSONA_TOKEN_ENC_KEY`; the actual name used at runtime is `TOKEN_ENCRYPTION_KEY` — reviewers should refer to the variable name in code.
- Lifecycle: set once per environment in Vercel env vars. **Rotation schedule: Planned.** Rotating the key today would invalidate all stored tokens and force every user to reconnect; a dual-key read / single-key write rolling scheme is tracked on the P2 roadmap (Q3 2026).
- Not accessible to the client: `token-crypto.ts` uses `node:crypto`, imports only from server-only API routes (`app/api/oauth/threads/callback/route.ts` and `src/lib/personas/publishers/threads.ts`). Grep for `decryptToken|encryptToken` returns 4 server-only files (token-crypto, two publishers, two OAuth callback routes) and zero files with `'use client'` in `src/lib/personas/**`.
- Decryption only happens inside the request lifecycle of a publisher API route; the plaintext never crosses a trust boundary other than the outbound HTTPS call to `graph.threads.net`.

**At-rest protection.** On top of AES-256-GCM application-layer encryption, Supabase Postgres encrypts the underlying disk (AES-256) and all backups. RLS on `persona_channel_credentials` restricts reads to club admins of the owning persona (see §5).

---

## 4. Signed Request Verification

**Status: Planned (Q2 2026).** Draft does not currently process Meta `signed_request` payloads because the two webhook endpoints (Deauthorize Callback, Data Deletion Request Callback) are **not yet deployed**. The three Threads OAuth endpoints that exist today (`/start`, `/callback`, and the front-end trigger for disconnect) work without `signed_request`.

The design for the two missing endpoints is documented here so reviewers can evaluate intent; live code + commit references will replace this section when the endpoints ship.

**Planned implementation (`src/lib/personas/meta-signed-request.ts`).**
1. Split the `signed_request` body on `.` into `(encodedSig, encodedPayload)`.
2. Base64url-decode `encodedPayload` → JSON (verify `algorithm === 'HMAC-SHA256'`).
3. Compute `crypto.createHmac('sha256', THREADS_CLIENT_SECRET).update(encodedPayload).digest()`.
4. Constant-time compare against the decoded signature via `crypto.timingSafeEqual`. Length mismatch → reject before comparison to avoid throw-based timing leak.
5. On success, return the payload (contains `user_id` and `issued_at`). On any failure, return 400 without revealing which check failed.

**Planned endpoints.**

| Route | Method | Behavior |
|---|---|---|
| `/api/oauth/threads/deauthorize` | POST | Verify signed_request → flip `persona_channel_credentials.active = false` where `account_ref = user_id` → write `audit_logs` with `action='threads.deauthorize'` → return `{ url, confirmation_code }` |
| `/api/oauth/threads/data-deletion` | POST | Verify signed_request → enqueue deletion job → return `{ url, confirmation_code }` → cron purges `persona_channel_credentials`, related `persona_outputs.external_permalink`, and logs in 30 days |

**Failure modes handled in the planned code:**
- Missing body → 400 `{ error: 'Missing signed_request' }`
- Invalid format (wrong number of parts) → 400
- HMAC mismatch → 400, no hint about which half failed
- Payload `issued_at` older than 5 minutes → 400 (replay guard)
- Unknown `user_id` → 200 with a confirmation code (Meta requires idempotent success)

**Target ship date: 2026-05-15** (before the planned Meta App Review resubmission).

---

## 5. Database Security

**RLS coverage.** 63 migrations define RLS policies across all user-scoped tables. An RLS audit was conducted on 2026-04-18 and findings tracked in an internal memo (`rls_audit_2026-04-18.md`).

| Severity | Count at audit | Remediated by 2026-04-21 |
|---|---|---|
| CRITICAL | 7 | **7 (all fixed)** — `profiles`, `error_logs`, `direct_messages`, `pending_discord_setups`, `member_activity_stats`, `personas INSERT`, `team_tasks/resources/decisions` WITH CHECK |
| HIGH | 7 | 3 (H1 WITH-CHECK hardening on 23 policies, H2 accepted_connections creator validation, H3 club_members scoping) |
| MEDIUM | 4 | 0 — all tracked, none block Meta review |

Empirical verification via `scripts/rls-audit.mjs` confirms anon queries against `error_logs`, `direct_messages`, `personas`, `team_*` return 0 rows. The only anon-readable tables are `profiles`, `clubs`, `opportunities` — intentional for public Explore listings.

**Service role key.** `createAdminClient()` (`src/lib/supabase/admin.ts`) instantiates a non-persistent client with `SUPABASE_SERVICE_ROLE_KEY`. Usage is restricted to API routes that require RLS bypass (OAuth callback, admin endpoints, cron). Grep returns 58 server-side callers; zero client-side callers (`'use client'` modules never import this file).

**PII columns.**

| Table | Column | Classification | Access pattern |
|---|---|---|---|
| `profiles` | `contact_email`, `contact_kakao` | Confidential | Self-read; admins via JWT claim |
| `profiles` | `student_id`, `department`, `graduation_year` | Confidential (quasi-sensitive) | Institution-scoped reads only |
| `direct_messages` | `content` | Confidential | Sender + receiver only |
| `persona_channel_credentials` | `encrypted_token` | **Restricted** | Club admins of owning persona; encrypted at rest |
| `audit_logs` | `context.ip` | Internal | Self or `is_admin` JWT claim |

**Audit logging.** Migration `20260420220000_audit_logs.sql` defines an append-only `audit_logs` table with:
- No UPDATE/DELETE policies (RLS denies by default) → append-only at the database layer.
- GIN index on `context` (jsonb) for institution-scoped reports.
- 3-year retention (PIPA Article 21, statutory minimum).
- Helper: `src/lib/audit/index.ts` (`writeAuditLog`) with `^[a-z_]+\.[a-z_]+$` action-format validation.
- Current call sites: `app/api/clubs/[slug]/route.ts`, `members/[memberId]/route.ts`, `me/account/route.ts`, `me/export/route.ts`, `cron/purge-deleted-accounts/route.ts`, and admin audit viewer `app/(dashboard)/admin/audit/page.tsx`.

**Soft delete.** User account deletion uses soft-delete with a 30-day grace period (`profiles.deleted_at`), hard-deleted by `api/cron/purge-deleted-accounts`. This satisfies PIPA Article 36 (right to deletion) while preserving referential integrity for audit purposes.

---

## 6. Network Security

**TLS.** TLS 1.3 via Vercel's managed edge (automatic cert rotation through Let's Encrypt; no custom cert material in our control).

**Security headers.** Set in both `next.config.ts` (static app-wide) and `middleware.ts` (per-route overrides). Observed directives in production:

| Header | Value | Source |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: <supabase/unsplash/oauth avatars>; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://*.aiplatform.googleapis.com https://*.posthog.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | `middleware.ts:112-126` |
| `X-Frame-Options` | `DENY` (general) / `SAMEORIGIN` (next.config) / `ALLOWALL` (only for `/embed/*`) | `middleware.ts:100-105`, `next.config.ts:138-159` |
| `X-Content-Type-Options` | `nosniff` | both |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | both |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | both |
| `X-XSS-Protection` | `1; mode=block` | `next.config.ts:151` |
| **`Strict-Transport-Security`** | **Not set. Planned** — target `max-age=31536000; includeSubDomains; preload` once we finish auditing subdomains (Q2 2026). Vercel provides HTTPS enforcement via its edge, but HSTS preload is an explicit app-layer header we have not yet configured. |

CSP note: `script-src 'unsafe-inline'` is currently allowed; Next.js nonce-based CSP migration is tracked but not required for Meta review.

**CORS.** API routes do not set permissive CORS. Cross-origin state-changing requests (`POST/PUT/PATCH/DELETE`) are rejected at `middleware.ts:141-175` unless the `Origin` (or fallback `Referer`) host matches the request `Host`. Webhook paths (`/api/webhooks/*`, `/api/discord/interactions`) are exempted and rely on their own signature verification. Cron routes require `Authorization: Bearer $CRON_SECRET`.

**Rate limiting.**
- **In-memory limiter** (`src/lib/rate-limit/api-rate-limiter.ts`): per-identifier minute/hour/day windows with plan-based limits (Anonymous 20 rpm / 100 rph / 500 rpd; Free 60/500/5000; Pro 300/3000/30000; Team 1000/10000/100000). Returns RFC-compliant `X-RateLimit-*` headers and `Retry-After`.
- **HOF wrapper** (`src/lib/rate-limit/with-rate-limit.ts`): `withRateLimit(handler, options)` for per-route application.
- **Current Threads OAuth routes are NOT rate-limited.** `api/oauth/threads/start/route.ts` and `callback/route.ts` do not wrap with `withRateLimit`. This is a known gap (see §13). `api/me/account/route.ts` does apply IP-based limiting.
- **Distributed limiter (Upstash Redis)**: `src/lib/rate-limit/redis-rate-limiter.ts` exists for serverless-safe limiting. Not yet adopted by default — the in-memory limiter loses state across Vercel cold starts and instances. Tracked as P2.

---

## 7. Secrets Management

**Development.** `.env.local` at repo root (not committed; enforced by `main/.gitignore` line 19, pattern `.env*.local`). An audit backup `.env.local.audit` exists for one-time secret rotation tracking; gitignored via pattern `.env*.audit` (`.gitignore` line 20). Verified: `git check-ignore -v` confirms both are ignored.

**Production.** Vercel Environment Variables, per-environment (Development, Preview, Production).

**Inventory of secrets referenced in code.**

| Name | Purpose | Runtime | Rotation |
|---|---|---|---|
| `THREADS_CLIENT_ID` | Meta app public ID | Server | On Meta app reset |
| `THREADS_CLIENT_SECRET` | Meta app secret (used for OAuth token exchange & future signed_request HMAC) | Server | **Planned 90 days** |
| `TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for stored OAuth tokens | Server | **Planned** (requires dual-key rolling scheme — see §3) |
| `SUPABASE_SERVICE_ROLE_KEY` | RLS bypass, server-side admin ops | Server | **Planned 90 days** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side anon queries (RLS-scoped) | Client | On project reset |
| `NEXT_PUBLIC_SUPABASE_URL` | Public endpoint | Client | — |
| `NEXT_PUBLIC_APP_URL` | Computes OAuth `redirect_uri` | Server (primary) / Client (PWA) | — |
| `COOKIE_SECRET` | HMAC-SHA256 signing for `onboarding_completed` cookie and any future signed cookies | Server | **Planned 90 days** |
| `CRON_SECRET` | Bearer token for internal cron endpoints | Server | **Planned 90 days** |
| `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` | LLM providers | Server | On provider-side reset |
| `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID` | Discord automation | Server | On provider-side reset |
| `UPSTASH_REDIS_REST_TOKEN/URL` | Rate-limit backend (not yet primary) | Server | Per Upstash |

Secret rotation SOP is **Planned** (§9 of enterprise roadmap) and must ship before Pro-tier institutional contracts.

**Git-history scan.** Manual verification executed during this audit: `git check-ignore` confirms `.env*.local` and `.env*.audit` patterns are enforced. A full `git log -S` scan for secret prefixes (`sk-ant-`, `eyJ`, `re_`) has **not yet been run** and is **Planned** as a pre-launch check. A hosted scanner (GitGuardian or `trufflehog`) will be added to CI; see §10.

---

## 8. Identity & Access Management

**Primary auth provider.** Supabase Auth.

**Active sign-in methods** (confirmed from `src/context/AuthContext.tsx:12-18`):
- Email + password
- Google OAuth (`provider: 'google'`)
- GitHub OAuth (`provider: 'github'`)
- Discord OAuth (`provider: 'discord'`)

Kakao / Naver are configured at the image CDN / avatar layer (`next.config.ts`) but **not as active sign-in providers** at the time of writing.

**Session cookies.** Managed by `@supabase/ssr` via `src/lib/supabase/middleware.ts`. Defaults: `HttpOnly`, `Secure` (production), `SameSite=Lax`. Our own signed cookies (e.g., `onboarding_completed` in `middleware.ts:257-263`) enforce the same flags and add an HMAC-SHA256 signature (`src/lib/cookie-signature.ts`).

**Role model.**

| Layer | Column / claim | Checked in |
|---|---|---|
| Platform admin | `auth.jwt() -> 'app_metadata' ->> 'is_admin'` | RLS policies, admin API routes |
| Club role | `club_members.role` (`owner` / `admin` / `manager` / `member`) | `is_club_admin()` / `is_club_member()` SECURITY DEFINER helpers, widely used in RLS |
| Institution role | `institution_members.role` | Institution-scoped RLS |
| Persona ownership | `personas.owner_id` + type | `can_edit_persona_owner()` RPC, called from `/api/oauth/threads/callback/route.ts:177-181` |

**Least privilege in API routes.** Every OAuth callback re-verifies ownership through RPC — the user's JWT alone is never trusted to imply persona-edit rights. Admin endpoints check the `is_admin` JWT claim before invoking `createAdminClient()`. This layered check is deliberate: it prevents a compromised anon key or manipulated JWT from producing silent privilege escalation, because the database still applies RLS unless the service-role client is deliberately used.

---

## 9. Logging & Monitoring

**Structured server logs.** `console.error` with prefix tags, used in observability pipelines:
- `[threads_oauth]` — `api/oauth/threads/callback/route.ts` at lines 113, 142, 153, 208, 218
- `[threads-publisher]` — `src/lib/personas/publishers/threads.ts` at lines 122, 146, 174
- `[audit]` — `src/lib/audit/index.ts`
- `[SECURITY]` — `src/lib/cookie-signature.ts` (missing `COOKIE_SECRET` in prod)

**Instrumentation.** `instrumentation.ts` implements Next.js `onRequestError` hook. It routes all server-side errors (API routes, RSC render, Server Actions, Middleware where reachable) through `captureAndLog()`, which:
1. Posts a `$exception` event to PostHog (`src/lib/posthog/server.ts`).
2. Writes to Supabase `error_logs` table.
3. Fires a Discord webhook alert for 5xx errors (throttled to 1-per-fingerprint-per-minute).
4. Tags each event with the deploy's git SHA (`$release` property).

Edge runtime errors are explicitly skipped in `instrumentation.ts:38` because the Discord alert path imports `node:crypto` which fails in the Edge bundle; middleware errors are captured via a separate `safeEdgeCapture` helper (`middleware.ts:13-28`).

**Vercel log drains.** **Planned.** Vercel built-in 3-day retention is the current ceiling; a drain into Supabase `error_logs` exists for application errors, but raw HTTP access logs are not aggregated. Roadmap item: ship a Better Stack or Axiom drain before Pro-tier launch.

**Sentry.** **Not adopted.** Conscious decision (enterprise roadmap P1-4): we operate a "Sentry-lite" stack using the PostHog + Discord + `error_logs` triple. Full Sentry SDK is deferred to P2 when replay / source-map debugging becomes necessary.

**Alert thresholds.** Single threshold today: 5xx in `captureAndLog` triggers Discord. Multi-level paging (PagerDuty/OpsGenie) is **Planned**.

**Log retention.**

| Store | Retention |
|---|---|
| PostHog | 1 year (default plan) |
| Supabase `error_logs` | Indefinite; purge cron Planned |
| Supabase `audit_logs` | 3 years (PIPA statutory) |
| Discord alert channel | Per Discord's own retention (message history not a primary audit trail) |
| Vercel platform logs | 3 days (standard Vercel plan) |

---

## 10. Dependency Management

**Lockfile.** `pnpm-lock.yaml` committed at repo root. Reproducible installs via `pnpm install --frozen-lockfile` in CI.

**Automated updates.** **Dependabot: Not configured** — `.github/dependabot.yml` does not exist. **Planned for Q2 2026**, scoped to weekly security updates with auto-merge for patch bumps.

**Vulnerability scanning.** `pnpm audit` is run manually during release prep; not yet gated in CI. Adding an automated `pnpm audit --audit-level=high` step to `.github/workflows/build-check.yml` is tracked (P1).

**Direct dependency policy.** New production dependencies require a code-review justification (captured in the PR description). No strict DCO, but the small team keeps the dependency list reviewable; `package.json` is checked manually on every PR.

**Supply-chain hardening roadmap.**
- SLSA level 2 (signed provenance) — Planned.
- `pnpm install --strict-peer-dependencies` — Planned (current behavior relies on pnpm default resolution).
- Secret scanner in CI (GitGuardian or trufflehog) — Planned.

---

## 11. Vulnerability Disclosure

**Contact.** `team@dailydraft.me` — **mailbox to be provisioned as an alias before Meta review resubmission.** Until then, disclosures are routed via the founder address documented in `main/docs/meta-app-review/README.md`. We recommend that Meta's review team use the alias once announced.

**Response SLA.**
- **Acknowledgment: ≤ 72 hours** from receipt.
- **Triage & initial assessment: ≤ 5 business days.**
- **Remediation target: ≤ 30 days** for high-severity (CVSS ≥ 7.0); ≤ 90 days for medium. Critical issues (active exploitation or data exposure) target same-day containment.

**Safe harbor.** We commit to the following for researchers acting in good faith:
- No legal action or takedown requests for testing within the scope below.
- Reasonable delay of public disclosure to allow remediation (default 90 days).
- Attribution on the public changelog on request.

**In scope.** `*.draft.co.kr`, Threads / LinkedIn / Instagram integration endpoints, Supabase project `prxqjiuibfrmuwwmkhqb.supabase.co` (only data belonging to the researcher's own test accounts).

**Out of scope.** Social engineering of team members, physical attacks, DoS testing, automated scanners generating noise without analysis.

---

## 12. Incident Response

**Detection paths.**
1. **Meta webhook abuse** — unsigned / replayed `signed_request` hits the deauthorize or data-deletion endpoint (once deployed, §4). HMAC mismatch returns 400 and logs with `[threads_oauth]` prefix.
2. **Log anomaly** — Discord alert channel fires on 5xx spike (threshold: rolling `captureAndLog` count).
3. **User report** — `team@dailydraft.me` (alias to be provisioned).
4. **Admin UI** — `/admin/audit` surfaces unusual role-change or persona-publish frequency.

**Containment playbook (Threads-specific).**

| Scenario | Response |
|---|---|
| Suspected token leak (one user) | Admin SQL: `UPDATE persona_channel_credentials SET active=false WHERE persona_id=?` → user receives "reconnect required" on next publish → `writeAuditLog({action:'threads.force_revoke'})`. |
| Suspected mass token leak | Admin SQL: `UPDATE persona_channel_credentials SET active=false WHERE channel_type='threads'` (mass deauthorize). User receives "reconnect required." A runbook button in `/admin` is **Planned**. |
| Meta-originated revocation (deauthorize webhook) | Same as single-user containment but triggered by signed webhook — once §4 endpoints ship. |
| Suspected `TOKEN_ENCRYPTION_KEY` compromise | Rotate key → re-encrypt all tokens in a single transaction (dual-key rolling scheme required; **Planned**). Today we would instead mass-invalidate tokens (`active=false`) and force re-OAuth. |
| Supabase service-role key compromise | Rotate via Supabase dashboard → redeploy → invalidate all `app_metadata.is_admin` claims → audit `audit_logs` for 90 prior days. |

**Evidence preservation.** `audit_logs` is append-only at the RLS layer (no UPDATE/DELETE policies). PostHog events include `$release` (git SHA) enabling forensic correlation. Supabase point-in-time recovery retains 7 days on the current plan.

**External notification thresholds.**
- **Meta**: any compromise of tokens we hold will be reported via the standard security channel within 72 hours of confirmation.
- **KISA (Korea)**: PIPA Article 34 requires notification within 24 hours for a breach of ≥ 1,000 records. Runbook: `docs/runbooks/db-restore.md` (adjacent process) includes the escalation path.
- **Affected users**: notified via registered email within 72 hours, per PIPA.

---

## 13. Known Gaps & Mitigations

Listed in rough order of reviewer-visibility. Fix targets are sincere estimates; none of these block publish-only behavior of the current Threads integration, but reviewers should know about them.

| # | Gap | CWE / risk | Compensating control today | Target fix |
|---|---|---|---|---|
| G1 | **Deauthorize & Data Deletion webhooks not yet implemented** (§4) | N/A — required by Meta Platform Policy 5.a | Users can revoke via Meta's own app settings; Draft will observe revocation on next publish attempt (token 190 error) and mark credential `active=false`. | **2026-05-15** (before resubmission) |
| G2 | **No HSTS header** (§6) | CWE-319 | TLS enforced at Vercel edge; `Secure` cookie flag | 2026-05-31 |
| G3 | **Threads OAuth routes not rate-limited** | CWE-799 | Session required for `/start`; callback state nonce limits replay | 2026-05-10 (wrap with `withRateLimit`) |
| G4 | **`TOKEN_ENCRYPTION_KEY` rotation not implemented** (§3, §7) | CWE-320 | Key stored in Vercel env (encrypted at provider), no git exposure | 2026-Q3 (dual-key rolling scheme) |
| G5 | **Dependabot not configured** (§10) | CWE-1104 | Manual `pnpm audit` during releases | 2026-05-15 |
| G6 | **Secret-scanning CI step missing** (§10) | CWE-798 | `.gitignore` enforced; backup file `.env.local.audit` gitignored (verified) | 2026-05-15 |
| G7 | **4 MEDIUM RLS findings open** (§5) | CWE-284 | None of the MEDIUM items affect Meta token data; tracked in internal memo | 2026-Q2 |
| G8 | **Rate limiter is in-memory, not distributed** (§6) | CWE-770 | Per-instance limits still apply; Vercel's own Edge throttles catastrophic abuse | 2026-Q2 (Upstash Redis) |
| G9 | **No third-party penetration test on record** | — | Internal security reviews 2026-03-25, 2026-04-18, 2026-04-21 (this doc) | 2026-Q4 after institutional contract revenue |
| G10 | **`script-src 'unsafe-inline'` in CSP** (§6) | CWE-79 | X-Frame-Options DENY; HttpOnly cookies; React output escaping | 2026-Q3 (nonce-based CSP) |

Top 5 by reviewer relevance: **G1, G2, G3, G4, G5.**

---

## 14. Appendix: Code References Table

All line numbers are against commit `d0acc9e` (branch `main`, HEAD on 2026-04-21). Verified present at scan time unless marked "Planned".

| # | Control | File | Lines | Evidence |
|---|---|---|---|---|
| 1 | OAuth entry: auth check + CSRF nonce + state cookie | `main/app/api/oauth/threads/start/route.ts` | 24–78 | `randomBytes(16)`; cookie `HttpOnly/Secure/Lax/Max-Age=600` |
| 2 | OAuth callback: state verification + session re-check | `main/app/api/oauth/threads/callback/route.ts` | 46–82 | `stateData.nonce !== stateNonce` → error; `user.id !== stateData.user_id` → error |
| 3 | OAuth callback: short-lived → long-lived exchange + fallback | `main/app/api/oauth/threads/callback/route.ts` | 94–145 | Falls back to 1 h TTL if `th_exchange_token` fails |
| 4 | OAuth callback: persona ownership RPC guard | `main/app/api/oauth/threads/callback/route.ts` | 164–186 | `can_edit_persona_owner` RPC |
| 5 | Token encryption (AES-256-GCM) | `main/src/lib/personas/token-crypto.ts` | 13–60 | `aes-256-gcm`, IV 12 B, authTag 16 B, key length check 32 B |
| 6 | Publisher: decrypt only inside server route | `main/src/lib/personas/publishers/threads.ts` | 93–101 | Catches decryption errors |
| 7 | Publisher: expiry check before call | `main/src/lib/personas/publishers/threads.ts` | 85–90 | `cred.expires_at < Date.now()` |
| 8 | Signed request verification | `main/src/lib/personas/meta-signed-request.ts` | — | **Planned** (§4) |
| 9 | Deauthorize webhook | `main/app/api/oauth/threads/deauthorize/route.ts` | — | **Planned** (§4) |
| 10 | Data-deletion webhook | `main/app/api/oauth/threads/data-deletion/route.ts` | — | **Planned** (§4) |
| 11 | Security headers (CSP, XFO, Referrer, Permissions) | `main/middleware.ts` | 99–128 | Implemented |
| 12 | Static security headers (app-wide) | `main/next.config.ts` | 134–162 | Implemented |
| 13 | CSRF origin check on state-changing API | `main/middleware.ts` | 141–176 | Origin + Referer fallback; cron Bearer check |
| 14 | Signed session cookie (HMAC-SHA256) | `main/src/lib/cookie-signature.ts` | 38–83 | Web Crypto API; constant-time `crypto.subtle.verify` |
| 15 | Service-role client (server-only) | `main/src/lib/supabase/admin.ts` | 1–15 | `autoRefreshToken:false`, `persistSession:false` |
| 16 | Rate limiter (plan-tiered) | `main/src/lib/rate-limit/api-rate-limiter.ts` | 12–34, 86–137 | Minute/hour/day windows |
| 17 | Rate-limit HOF | `main/src/lib/rate-limit/with-rate-limit.ts` | 47–90 | Per-route application |
| 18 | Audit log schema (append-only) | `main/supabase/migrations/20260420220000_audit_logs.sql` | 1–96 | RLS: no UPDATE/DELETE policies |
| 19 | Audit helper with action-format regex | `main/src/lib/audit/index.ts` | 33, 40–50 | `^[a-z_]+\.[a-z_]+$` |
| 20 | Data export (PIPA Art. 35) | `main/app/api/me/export/route.ts` | 22–40 | Parallel query, user-scoped |
| 21 | Account deletion soft-delete (PIPA Art. 36) | `main/app/api/me/account/route.ts` | 22–40 | 30-day grace, rate-limited |
| 22 | Server-side error instrumentation | `main/instrumentation.ts` | 31–67 | `onRequestError` → `captureAndLog` |
| 23 | Edge error capture (middleware) | `main/middleware.ts` | 13–28, 277–286 | `safeEdgeCapture`, fail-open |
| 24 | CSP override for embed routes | `main/middleware.ts` | 103–105, 209–210 | `allowEmbed` flag → skip `X-Frame-Options` |

---

*Prepared by Draft Engineering. For questions or security reports, contact team@dailydraft.me (pending provisioning — see §11) or the founder address in the App Review cover letter.*
