# Meta App Review Submission Package — Draft × Threads API

| Field | Value |
|---|---|
| Application | Draft (https://dailydraft.me) |
| Platform | Threads API (Meta Platforms, Inc.) |
| Permissions requested | `threads_basic`, `threads_content_publish` |
| Submission package version | v1.0 |
| Package date (UTC) | 2026-04-21 |
| Primary contact | team@dailydraft.me |
| Support channel | team@dailydraft.me (acknowledge within 24 hours) |
| Legal entity | Lee Sungmin (sole proprietor — Korean business registration pending) |
| Representative | Lee Sungmin |
| Registered address | Kyung Hee University Global Campus, Republic of Korea |
| Test user flow documented | See §5 below |

---

## 1. Cover Letter (for the Meta App Review team)

Draft is an operations platform purpose-built for Korean university clubs and the student projects they incubate. Our Threads integration is a single feature inside a broader product whose primary value is organizational memory and workflow — not content amplification. We are submitting for `threads_basic` and `threads_content_publish` because club administrators have asked for a sanctioned way to mirror the announcements they already draft inside Draft onto the club's public Threads presence, without a second copy-paste step that invites typos and broken links.

Every publish action in our system passes through an explicit human-in-the-loop approval state machine (`is_copy_only` default, explicit admin approval, rate limits per persona). No content drafted by our generation pipeline can reach Threads without an admin clicking "Approve and publish." The AI that produces drafts is a writing assistant, not an autonomous poster. This distinction is demonstrated in §5 of the Demo Video Script (`demo-video-script.md`, shots 12–15, timecode 02:05–02:35).

We have engineered the integration against Meta's Platform Terms and built the compliance, deletion, and security controls that your review teams check for. Several of those controls are already in production; a small number are on a short, dated roadmap and are declared honestly below rather than overstated. We would rather arrive at review with accurate inventory than with claims we cannot substantiate under follow-up questions.

We appreciate the team's time and welcome specific follow-up requests — our reviewer-expectation mapping (`reviewer-expectations.md`) lists the questions we expect to receive with pre-drafted responses, and we commit to a 24-hour initial-response SLA on any reviewer message.

Respectfully submitted,<br>
Draft Team

---

## 2. Reviewer Routing — Pick the Document That Matches Your Role

| If you are a … | Start here | Then read |
|---|---|---|
| **Product / Policy reviewer** | `use-case.md` (§1 Executive Summary → §3 Permissions → §4 End-User Workflow) | `demo-video-script.md` Reviewer Mirror (§5) |
| **Legal / Privacy reviewer** | `compliance-attestation.md` (§1 Attestation → §2 Regulatory Mapping → §4 Subprocessor Register) | `use-case.md` §7 Compliance Alignment, then `privacy-policy-checklist.md` audit |
| **Security reviewer** | `security-architecture.md` (§1 Overview → §3 Token Cryptography → §13 Known Gaps) | `compliance-attestation.md` §9 Technical Controls Evidence |
| **Integration reviewer (Threads team)** | `use-case.md` §3 Permissions Justification | `demo-video-script.md` Shot List + linked video file |
| **Ops / Support reviewer** | `reviewer-expectations.md` §5 Likely Follow-up Questions | `compliance-attestation.md` §6 DSR Playbook |

The demonstration video itself is referenced in §5 of this package.

---

## 3. Document Manifest

All documents are in `docs/meta-app-review/`. They are intended to be read in the order your role dictates (see §2). No document cross-references a missing file.

| # | File | Purpose | Word count | Audience |
|---|---|---|---|---|
| 1 | `SUBMISSION.md` (this file) | Cover letter, routing, status, test credentials | — | All reviewers |
| 2 | `use-case.md` | Primary submission document — product, permissions, workflow, compliance posture | ~3,500 | Product + Policy + Integration |
| 3 | `demo-video-script.md` | Broadcast-grade production spec for the review video | ~4,300 | Integration + Policy |
| 4 | `compliance-attestation.md` | Legal attestation, regulatory mapping, RoPA, DSR playbook, incident runbook | ~4,900 | Legal + Privacy |
| 5 | `security-architecture.md` | Security dossier — OAuth flow, cryptography, RLS, network, secrets, IR | ~7,000 | Security |
| 6 | `reviewer-expectations.md` | Research-backed pre-emptive defense against common rejection patterns | ~4,000 | All reviewers (self-audit) |
| 7 | `privacy-policy-checklist.md` | Internal audit of our privacy policy vs Meta's requirements | ~2,000 | Internal |
| 8 | `README.md` | Internal submission guide (Korean) | — | Internal |

---

## 4. Pre-flight Readiness — Honest Status Table

Every row references the document of record and the actual implementation state in the codebase. **Status = "Implemented (pending merge)"** means the code is written and pushed to a named branch but not yet merged into `main`; merge is blocked only by our daily deployment quota resetting and will complete within 24 hours of this package date.

| Control | Status | Branch / File of record | Notes |
|---|---|---|---|
| OAuth 2.0 authorize flow (Threads) | **Implemented (main)** | `app/api/oauth/threads/start/route.ts` | — |
| Short-lived → long-lived token exchange (60 days) | **Implemented (main)** | `app/api/oauth/threads/callback/route.ts` | `expires_in ?? 5184000` |
| AES-256-GCM token encryption at rest | **Implemented (main)** | `src/lib/personas/token-crypto.ts` | Env var: `TOKEN_ENCRYPTION_KEY` |
| 2-step Threads publish (container → publish) | **Implemented (main)** | `src/lib/personas/publishers/threads.ts` | Matches Meta Threads API v1.0 pattern |
| Deauthorize Callback webhook | **Implemented (pending merge)** | `feat/threads-compliance-callbacks` → `app/api/oauth/threads/deauthorize/route.ts` | Waiting on deployment quota reset (≤24h) |
| Data Deletion Request webhook | **Implemented (pending merge)** | `feat/threads-compliance-callbacks` → `app/api/oauth/threads/data-deletion/route.ts` | Returns `{ url, confirmation_code }` per Meta spec |
| Data Deletion status URL | **Implemented (pending merge)** | `feat/threads-compliance-callbacks` → `app/api/oauth/threads/data-deletion/status/route.ts` | Public GET endpoint |
| `signed_request` HMAC-SHA256 verification | **Implemented (pending merge)** | `feat/threads-compliance-callbacks` → `src/lib/personas/meta-signed-request.ts` | Timing-safe compare |
| `meta_data_deletion_requests` table | **Implemented (pending merge)** | `feat/threads-compliance-callbacks` → `supabase/migrations/20260421000000_meta_data_deletion_requests.sql` | RLS enabled |
| `/legal/privacy` page | **Implemented (pending merge)** | `feat/meta-app-review-bundle` → `app/legal/privacy/page.tsx` | 14 sections, Meta-specific clause in §11 |
| `/legal/terms` page | **Implemented (pending merge)** | `feat/meta-app-review-bundle` → `app/legal/terms/page.tsx` | 13 articles, automated-publish special clause (Art. 7) |
| `/legal/data-deletion` page | **Implemented (pending merge)** | `feat/meta-app-review-bundle` → `app/legal/data-deletion/page.tsx` | 3 deletion paths + FAQ |
| Row-Level Security on persona/channel tables | **Implemented (main)** | Multiple Supabase migrations | 7/7 CRITICAL findings from 2026-04-18 audit remediated |
| Audit logging | **Implemented (main)** | `audit_logs` table + `writeAuditLog` | 8 call sites verified |
| Rate limiting (API) | **Implemented (main, in-process)** | `src/lib/rate-limit/api-rate-limiter.ts` | Distributed (Redis) variant on roadmap |
| PostHog analytics + `error_logs` + `instrumentation.ts` | **Implemented (main)** | `instrumentation.ts`, `src/lib/posthog/server.ts` | Sentry itself not yet installed |
| HSTS header | **Planned (2026-05)** | Vercel/Next.js config | Not currently set |
| Dependabot / SCA | **Planned (2026-05)** | `.github/dependabot.yml` | Not yet created |
| OAuth callback rate limit wrap | **Planned (2026-05)** | `withRateLimit` wrapper extension | Current OAuth routes bypass rate limit |
| Secret rotation schedule | **Planned (Q2 2026)** | Internal runbook | First formal rotation Q2 2026 |
| Penetration test | **Planned (Q3 2026)** | External engagement | Pre-scale-up target |

**Summary**: of the 21 controls tracked for this submission, **16 are implemented** (9 on `main`, 7 on a branch pending merge within 24 hours), and **5 are on a dated roadmap**. The 5 roadmap items are defense-in-depth rather than Threads-specific blockers.

---

## 5. Test User / Reviewer Access

### 5.1 Test credentials

A dedicated test account will be provided via Meta's reviewer channel upon package acknowledgment. We do not embed credentials in this package to avoid static exposure.

**Format we will supply**:

```
Email: reviewer-<ticket-id>@dailydraft.me
Password: <rotating, 16-char>
Club slug (pre-provisioned as Admin): reviewer-demo
Persona ID: <uuid, pre-created>
```

### 5.2 Recommended reviewer walkthrough (≈6 minutes)

1. Visit https://dailydraft.me/login — sign in with supplied credentials.
2. Navigate to `Clubs → reviewer-demo → Settings → Persona`.
3. Locate the "Threads" card under "어디로 자동 발행할까요?" (Where to auto-publish).
4. Click **"Threads 연결하기"** (Connect Threads) — this initiates the OAuth flow documented in `security-architecture.md` §2.
5. Complete consent on Meta's screen with the Threads tester account you have registered on our App Dashboard.
6. On redirect, the card flips to "Connected." Verify the `persona_channel_credentials` row in your observer console if requested.
7. Return to the persona dashboard, open the "Drafts" tab, click **"Generate"** to produce an AI draft, edit it, and click **"Approve"**.
8. Approved drafts publish at the next scheduled cron tick (≤15 min) or immediately via the admin **"Publish now"** control. Verify on https://www.threads.net/ the post appears.
9. Disconnect: click **"Disconnect"** on the Threads card. Confirm `active=false` on the credential row.
10. Visit https://dailydraft.me/legal/data-deletion to see the public-facing deletion instructions referenced by our Data Deletion Callback.

### 5.3 Deletion verification

To verify the deletion flow end-to-end, reviewers may POST a valid `signed_request` to `https://dailydraft.me/api/oauth/threads/data-deletion` using our `THREADS_CLIENT_SECRET`. The endpoint returns `{ url, confirmation_code }`; visiting the returned URL yields a JSON status payload.

---

## 6. Known Gaps — Declared Without Euphemism

We name the gaps here so the reviewer does not have to find them.

| Gap | Impact on reviewer | Mitigation in place | Dated fix |
|---|---|---|---|
| HSTS header not yet sent | Cosmetic browser hardening; TLS 1.3 already enforced by Vercel | N/A (no downgrade risk within Vercel edge) | 2026-05 |
| Dependabot not enabled | No automated dependency alerts | Manual `pnpm audit` pre-release; lockfile enforced | 2026-05 |
| OAuth callback not rate-limited | Theoretical replay amplification | Replay blocked by state nonce + 10-minute cookie expiry | 2026-05 |
| Token encryption key rotation manual | Compromised key requires manual replacement of all tokens | Key held in Vercel env only; git-history scanned | Quarterly review, first formal rotation Q2 2026 |
| No third-party penetration test yet | Reviewer cannot reference external attestation | Internal RLS audit 2026-04-18, all CRITICAL remediated | Q3 2026 (external engagement) |
| Legal entity registration in progress | Attestation carries sole proprietor placeholder | Personal liability of founder until registered | On registration completion (1–3 weeks) |

None of the above gaps permit unauthorized access to Threads user data. They are defense-in-depth improvements scheduled against a visible roadmap.

---

## 7. Attestation

We, the Draft Team, attest that every claim in this package is supported by code, configuration, or documented roadmap; that we have not overstated implementation state; that we will respond to reviewer messages within 24 hours; and that we will produce additional evidence on request.

Signed (electronic):<br>
Draft Founder<br>
`team@dailydraft.me`<br>
2026-04-21

---

## 8. Changelog

| Version | Date | Author | Change |
|---|---|---|---|
| v1.0 | 2026-04-21 | Draft Team | Initial submission package. |

---

## 9. 한국어 요약 (Korean Summary for Internal Reference)

본 문서는 Meta App Review 제출 패키지의 커버레터·인덱스입니다. 영문이 primary 이며 심사자 배정은 §2(리뷰어 라우팅) 표를 기준으로 합니다.

- **제출 대상 권한**: `threads_basic`, `threads_content_publish`
- **제출 패키지 버전**: v1.0 (2026-04-21)
- **문서 7개**: use-case, demo-video-script, compliance-attestation, security-architecture, reviewer-expectations, privacy-policy-checklist, SUBMISSION (본 문서)
- **통제 현황 요약**: 21개 중 16개 구현(9개 main, 7개 브랜치 머지 대기), 5개 로드맵
- **브랜치 머지 대기 중인 구현체**: `feat/threads-compliance-callbacks` (웹훅 2개 + HMAC 검증 + 마이그레이션), `feat/meta-app-review-bundle` (법적 페이지 3개 + 데모 파이프라인 + 문서). Vercel 배포 쿼터 리셋(24h 이내)과 함께 머지 예정.
- **남은 수동 작업**: 법인/개인사업자 등록 확정, `.env.demo` 테스트 계정, OAuth 동의 화면 수동 녹화.

제출 자료 전체는 `docs/meta-app-review/` 폴더 내에 있으며, 코드 근거는 각 문서의 인용 섹션을 참조해주십시오.
