# Draft — Legal Compliance Attestation

**Document type:** Legal-firm grade compliance attestation and Record of Processing Activities (RoPA)
**Product:** Draft (https://dailydraft.me)
**Purpose:** Submission package for Meta App Review (Threads Graph API) and enterprise due-diligence responses
**Document version:** v1.0
**Effective date:** 2026-04-21
**Next scheduled review:** 2026-10-21
**Owner:** Data Protection Officer (DPO)

> **Status reconciliation (2026-04-21, post-authoring).** Items in §2, §4, §9 that name `meta-signed-request.ts`, `/api/meta/data-deletion`, `/api/oauth/threads/{deauthorize,data-deletion}`, or the `meta_data_deletion_requests` migration as **"Planned Q2 2026"** are actually **Implemented and pushed** on branch `feat/threads-compliance-callbacks` (commit `7fc51b7`). This attestation was drafted against `main` before the branch merged. The authoritative status table is `SUBMISSION.md §4 Pre-flight Readiness`. Merge is blocked only by Vercel daily-deployment quota reset (≤24 hours from the package date).

---

## Section 1. Attestation Statement

We, **Lee Sungmin (sole proprietor — Korean business registration pending)** (hereinafter "the Controller"), operator of the service known as **Draft**, accessible at https://dailydraft.me, hereby attest as of **2026-04-21** the following with respect to the personal information we collect, process, store, and transfer in connection with the Draft service and its integration with Meta Platforms, Inc.'s Threads Graph API.

The Controller affirms:

1. **Data minimisation.** The Controller collects only the personal information that is strictly necessary for the lawful and explicit purposes described in Section 2 of this document and in the Privacy Policy published at https://dailydraft.me/legal/privacy. No Meta Platform Data is collected, derived, or inferred beyond the fields explicitly listed in Section 3.
2. **User consent validity.** Consent obtained from data subjects is freely given, specific, informed, and unambiguous. A separate granular consent is captured for (i) account creation, (ii) OAuth linkage of each third-party platform (Threads, Discord, GitHub), and (iii) outbound publishing to the user's Threads account.
3. **Subprocessor due diligence.** Every subprocessor listed in Section 4 has been reviewed against PIPA Art. 26, GDPR Art. 28, and CCPA §1798.140(ag); a Data Processing Addendum (DPA) or equivalent contractual commitment is on file or scheduled as noted in that section.
4. **Incident response readiness.** A documented Incident Response Runbook (Section 7) is maintained, exercised at least semi-annually, and capable of meeting the "without delay" standard of PIPA Art. 34 and the 72-hour notification deadline of GDPR Art. 33(1).
5. **Deletion SLA commitment.** The Controller commits to acknowledge any verified Data Subject Request within **7 calendar days** and to complete fulfilment within **30 calendar days**, in line with GDPR Art. 12(3) and PIPA Art. 35–37. For Meta-initiated data deletion webhook requests, fulfilment is completed within **30 days** of receipt of a validated `signed_request` payload.
6. **Annual review schedule.** This attestation, the Privacy Policy, the RoPA (Section 3), and the Subprocessor Register (Section 4) are reviewed and re-signed at least every **12 months**, or sooner upon (i) a change in applicable law, (ii) the addition or removal of a subprocessor, or (iii) any material change in processing purposes.

Signed on behalf of the Controller:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Data Protection Officer (DPO) | Lee Sungmin (acting — founder double-hat until scale threshold) | _______________________ | 2026-04-21 |
| Chief Technology Officer (CTO) | Lee Sungmin (acting) | _______________________ | 2026-04-21 |
| Legal Counsel / External Advisor | Not engaged (external counsel onboarding planned Q2 2026) | _______________________ | 2026-04-21 |

---

## Section 2. Regulatory Mapping Table

The following matrix maps each control implemented by the Controller to the corresponding obligations under the Personal Information Protection Act of the Republic of Korea ("PIPA"), the EU General Data Protection Regulation ("GDPR"), and the California Consumer Privacy Act as amended by the CPRA ("CCPA").

| # | Control | PIPA | GDPR | CCPA | Implementation evidence |
|---|---------|------|------|------|-------------------------|
| 01 | Lawful basis — consent | Art. 15 | Art. 6(1)(a); Art. 7 | §1798.120 opt-in | Consent UI on signup; granular OAuth consent prompts on each platform link; consent log retained in `auth.users` and `audit_logs` |
| 02 | Lawful basis — contract performance | Art. 15-2 | Art. 6(1)(b) | n/a | Terms of Service acceptance at signup; execution records in `audit_logs` |
| 03 | Right of access | Art. 35 | Art. 15 | §1798.110; §1798.130 | In-app export at `/settings/account`; email fallback to `team@dailydraft.me`; response SLA 30 days |
| 04 | Right to rectification | Art. 36(2) | Art. 16 | §1798.106 | `/settings/profile`, `/u/[id]/edit` self-service; manual fallback via DSR channel |
| 05 | Right to erasure / deletion | Art. 36 | Art. 17 | §1798.105 | Soft-delete flag `profiles.deleted_at` (migration `20260420230000_profiles_soft_delete.sql`) + 30-day hard-delete cron (Planned Q2 2026) |
| 06 | Right to data portability | n/a | Art. 20 | §1798.130(a)(2) | JSON export endpoint `/api/account/export` (Planned Q3 2026); interim: manual export on request |
| 07 | Right to restrict processing | Art. 37 | Art. 18 | §1798.120 opt-out | Account suspension via `/settings/account`; OAuth disconnect revokes third-party token scope |
| 08 | Right to object / opt-out of sale-share | Art. 37 | Art. 21 | §1798.120, §1798.135 | No sale or sharing of personal information for cross-context behavioural advertising. Opt-out link published on the Privacy Policy |
| 09 | Automated decision-making transparency | Art. 37-2 | Art. 22 | §1798.185(a)(16) | AI-assisted persona and match features disclosed in Privacy Policy §"AI features". No solely automated decisions producing legal effects |
| 10 | Purpose limitation | Art. 3(1); Art. 18 | Art. 5(1)(b) | §1798.100(b) | Each field's purpose listed in the RoPA (Section 3); enforced at application-layer authorisation |
| 11 | Data minimisation | Art. 3(6); Art. 16 | Art. 5(1)(c) | §1798.100(c) | Threads scope limited to `threads_basic`, `threads_content_publish`; no read of followers, feed, or DMs |
| 12 | Storage limitation | Art. 21 | Art. 5(1)(e) | §1798.100(a)(3) | Retention Matrix (Section 5); automated TTL on OAuth tokens (60 days) |
| 13 | Integrity and confidentiality | Art. 29 | Art. 5(1)(f); Art. 32 | §1798.100(e); §1798.150 | AES-256-GCM at rest (`src/lib/personas/token-crypto.ts`); TLS 1.3 in transit; RLS row isolation (Supabase) |
| 14 | Breach notification to authority | Art. 34(1) | Art. 33 | §1798.82 (notification to individuals) | Incident Response Runbook §7; notification templates English + Korean |
| 15 | Breach notification to data subject | Art. 34(3) | Art. 34 | §1798.82 | Same runbook; in-app banner + email within statutory deadline |
| 16 | DPO / Chief Privacy Officer designation | Art. 31 | Art. 37 | n/a | DPO: Lee Sungmin (acting, founder). Contact: `team@dailydraft.me` |
| 17 | Records of Processing Activities | Art. 30 (impliedly via Art. 30-2 report) | Art. 30 | n/a | Section 3 of this document |
| 18 | Privacy by Design / default | Art. 3(7) | Art. 25 | §1798.100(c) | Opt-in defaults; encryption-on-write; least-privilege RLS |
| 19 | International transfer — PIPA | Art. 28 | n/a | n/a | Consent banner on third-country transfer (Vercel US, Supabase US/EU, Anthropic US) |
| 20 | International transfer — GDPR | n/a | Art. 44–49 (SCCs) | n/a | Standard Contractual Clauses (SCCs) executed with US subprocessors where DPA available; see Section 4 |
| 21 | Audit logging | Art. 29 (safeguards) | Art. 5(2) accountability | §1798.100(a)(3) | `audit_logs` table (migration `20260420220000_audit_logs.sql`); append-only via RLS |
| 22 | Children's data | Art. 22 (parental consent under 14) | Art. 8 (parental consent under 16) | §1798.120(c) (opt-in under 16) | Minimum age 14. Service is university-student-oriented; ToS §"Eligibility" enforces age ≥ 14 |
| 23 | Data Protection Impact Assessment (DPIA) | Art. 33 (large-scale impact assessment) | Art. 35 | n/a | DPIA scheduled for Q2 2026 prior to institution-tier roll-out (Planned) |

---

## Section 3. Record of Processing Activities (RoPA)

The following RoPA is maintained pursuant to GDPR Article 30 and is, to the Controller's direct knowledge as of the effective date, complete and accurate.

| # | Category | Examples / fields | Source | Legal basis | Purpose | Recipients | Retention | Security |
|---|----------|-------------------|--------|-------------|---------|------------|-----------|----------|
| 1 | Account identifiers | email address; hashed password; `auth.users.id` (UUID); OAuth provider subject ID | Data subject at signup | PIPA Art. 15 (consent); GDPR Art. 6(1)(a)(b) | Authentication, account recovery, communication | Supabase (storage); Resend (email delivery) | Account lifetime + 30 days soft-delete grace | TLS 1.3 in transit; bcrypt/Argon2id via Supabase Auth; RLS |
| 2 | Profile data | nickname; display name; avatar URL; bio; interests array; `student_identity` (university, cohort year, major) | Data subject | PIPA Art. 15; GDPR Art. 6(1)(a) | Matching, profile display, community features | Supabase | Account lifetime + 30-day grace | RLS row-level isolation; public profile fields gated by `profiles.deleted_at IS NULL` |
| 3 | Affiliation data | `institution_members`, `club_members` role and approval state | Data subject + club operator approval | PIPA Art. 15; GDPR Art. 6(1)(a)(b) | Club-scoped access control; institution-tier analytics | Supabase; club operators (scoped view) | Account lifetime | RLS; role-based authorisation in service layer |
| 4 | Meta Platform Data — Threads | Threads `user_id`; Threads `username`; OAuth `access_token`; token `expires_at`; granted scopes (`threads_basic`, `threads_content_publish`) | Meta OAuth flow on explicit user action | PIPA Art. 15; GDPR Art. 6(1)(a); Meta Platform Terms | Publishing user-approved content to the user's own Threads account; account-name display in UI | Supabase (encrypted storage); Meta Platforms, Inc. (originating API) | Token: up to 60 days (Meta long-lived token TTL) or until disconnect; whichever is sooner. Container records retained with the club until club deletion | AES-256-GCM envelope encryption of access tokens at rest (`src/lib/personas/token-crypto.ts`); key managed via `TOKEN_ENCRYPTION_KEY` env var |
| 5 | Other integrations | Discord user ID and username; GitHub installation ID; OAuth tokens (encrypted) | Data subject via OAuth | PIPA Art. 15; GDPR Art. 6(1)(a) | Activity ingestion (`github_events`, Discord webhooks) for persona/ghostwriter features | Supabase; Discord; GitHub | Until disconnect or account deletion | AES-256-GCM at rest; same primitive as #4 |
| 6 | User-generated content | Project posts; weekly updates; comments; files metadata (`file_logs`); AI-generated drafts | Data subject | PIPA Art. 15; GDPR Art. 6(1)(b) (contract) | Core product functionality | Supabase | Account lifetime; orphaned content anonymised on deletion | RLS; service-layer ACL |
| 7 | Technical operational data | IP address; user-agent; request paths; device timezone | Automatic collection on request | PIPA Art. 15(1)(4) (legitimate operational need); GDPR Art. 6(1)(f) | Abuse prevention, rate limiting, debugging | Vercel (edge runtime logs); PostHog (product analytics); internal `error_logs` table | 90 days (logs); PostHog per its default (7–12 months) | TLS 1.3; access restricted to platform admins |
| 8 | Audit logs | `audit_logs` rows (actor, action, target, diff, context JSON) | Server-side emission on privileged actions | PIPA Art. 29 (safeguards); GDPR Art. 5(2) accountability | Accountability; enterprise due diligence; DSR verification | Supabase (isolated schema); platform admins | 3 years (PIPA-aligned) | Append-only RLS (no UPDATE/DELETE policy); sensitive fields masked at write time |
| 9 | Support correspondence | Email threads with `privacy@`, `support@` | Data subject-initiated | PIPA Art. 15; GDPR Art. 6(1)(b)(f) | Handling inquiries and DSRs | Resend (transport); Resend (transactional) + inbound relay to founder mailbox | 3 years or until resolution + statute of limitations, whichever is longer | TLS in transit; mailbox access restricted |

---

## Section 4. Subprocessor Register

Each subprocessor below has been evaluated under a standard three-point test: (a) necessity for the declared processing purpose, (b) equivalent technical and organisational measures, (c) lawful transfer basis when personal data crosses jurisdictions. The Controller maintains copies of the indicated DPAs or equivalent contractual documents.

| # | Subprocessor (legal name) | Service | Data categories | Processing region | Legal transfer basis | DPA status | Last review |
|---|--------------------------|---------|-----------------|-------------------|----------------------|------------|-------------|
| 1 | **Vercel Inc.** (440 N Barranca Ave #4133, Covina, CA 91723, USA) | Application hosting, edge runtime, CDN, deployment logs | Technical operational data; all inbound request payloads in transit | United States (primary) | SCCs included in Vercel DPA; standard consent at signup for PIPA third-country transfer | Vercel DPA — public terms accepted on account creation | 2026-04-21 |
| 2 | **Supabase, Inc.** (970 Toa Payoh North, #07-04, Singapore 318992 — Delaware-incorporated) | Managed Postgres, Auth, Storage, Realtime | All primary personal data (RoPA rows 1–8) | AWS `ap-northeast-2` (Seoul) — primary; US/EU replicas as configured | Intra-APAC transfer within scope of PIPA consent; SCCs in Supabase DPA for any US/EU egress | Supabase DPA — signed electronically | 2026-04-21 |
| 3 | **Anthropic, PBC** (548 Market St PMB 90375, San Francisco, CA 94104, USA) | Claude API for AI drafting (ghostwriter, persona features) | Prompt content (user-generated text excerpts); no account identifiers transmitted beyond opaque request IDs | United States | SCCs via Anthropic Commercial Terms / DPA; zero-retention mode requested where available | Anthropic DPA — Planned Q2 2026 (commercial tier onboarding) | 2026-04-21 |
| 4 | **Google LLC** (1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA) — Gemini API | Gemini Flash-Lite for cost-efficient AI tasks | Prompt content only | United States / Google global | SCCs via Google Cloud DPA | Google Cloud DPA — accepted electronically | 2026-04-21 |
| 5 | **Meta Platforms, Inc.** (1 Hacker Way, Menlo Park, CA 94025, USA) | Threads Graph API | Threads `user_id`, `username`, OAuth tokens (outbound only); publish payloads | United States / Meta global | Meta Platform Terms; user consent during OAuth flow | Meta Platform Terms — accepted on Meta for Developers account creation | 2026-04-21 |
| 6 | **Discord, Inc.** (444 De Haro St #200, San Francisco, CA 94107, USA) | Discord API for guild integration, webhooks, bot features | Discord user ID, username, guild membership signals; bot OAuth tokens | United States | Discord Developer Terms; user OAuth consent | Discord Developer Terms — accepted on application registration | 2026-04-21 |
| 7 | **Resend, Inc.** (2261 Market St #5039, San Francisco, CA 94114, USA) | Transactional email delivery | Recipient email address; email body (support, digests, notifications) | United States | SCCs in Resend DPA | Resend DPA — accepted electronically | 2026-04-21 |
| 8 | **PostHog, Inc.** (2261 Market St #4008, San Francisco, CA 94114, USA) | Product analytics; error capture | Pseudonymous distinct_id; event metadata; captured server errors | United States / EU (depending on instance) | SCCs in PostHog DPA | PostHog DPA — accepted electronically | 2026-04-21 |
| 9 | GitHub, Inc. (88 Colin P Kelly Jr St, San Francisco, CA 94107, USA) | GitHub App installation webhooks | GitHub installation ID; repo event metadata | United States | GitHub Developer Terms; user OAuth consent | GitHub Developer Terms — accepted on App registration | 2026-04-21 |

**Sentry (error monitoring):** **Not currently used.** The Controller captures server errors via PostHog and an internal `error_logs` table; Sentry onboarding is on the roadmap (Planned Q3 2026) and will be added to this register before any production data is routed to it.

---

## Section 5. Retention Matrix

Retention durations are expressed as the maximum period the Controller will continue to store a given data category; where a shorter period applies (e.g., user-initiated disconnect), the shorter period governs.

| # | Data category | While account active | After account closure | After Meta deauthorize webhook | Legal override |
|---|---------------|----------------------|-------------------------------|-------------------------------|----------------|
| 1 | `auth.users` identifiers (email, hashed password) | Indefinite (lifetime) | 30-day soft-delete grace; hard-delete thereafter (Planned Q2 2026 automation) | No change (Meta webhook scope does not affect core account) | Korean Commercial Act §33 — 5 years for commerce records if applicable |
| 2 | `profiles` (nickname, bio, avatar, interests) | Indefinite | 30-day soft-delete grace; hard-delete thereafter | No change | None |
| 3 | `student_identity` fields | Indefinite | Hard-deleted with profile | No change | None |
| 4 | Threads OAuth access token (encrypted) | Up to 60 days (Meta long-lived token TTL); renewed on activity | Hard-deleted with account | **Hard-deleted within 30 days** of validated `signed_request` | None |
| 5 | Threads account reference (user_id, username) | Until user disconnect or account deletion | Hard-deleted | **Hard-deleted within 30 days** of validated `signed_request` | None |
| 6 | Other OAuth credentials (Discord, GitHub) | Until user disconnect or token expiry | Hard-deleted with account | Not affected (scoped to Meta only) | None |
| 7 | User-generated content (projects, updates, comments) | Indefinite | Anonymised (author reference replaced with system tombstone) after 30-day grace | No change | Korean Electronic Commerce Act — 3 years for service-usage records |
| 8 | `audit_logs` | 3 years from event | Retained 3 years from event (accountability override) | Retained 3 years from event (accountability override) | PIPA Art. 29 safeguards; GDPR Art. 5(2) accountability |
| 9 | Technical operational logs (request logs, `error_logs`) | Rolling 90 days | Rolling 90 days | No change | None |
| 10 | Support and DSR correspondence | Until resolution | 3 years from resolution | 3 years from resolution | Statute of limitations for civil claims |
| 11 | Backups (database point-in-time recovery) | Rolling 30 days via Supabase PITR | Within rolling 30 days, user rows aged out via retention of deletions | Within rolling 30 days | None |
| 12 | Consent records (in `audit_logs` + `auth.users`) | Indefinite while account active | Retained with audit log (3 years) for accountability | Retained | GDPR Art. 7(1) burden of proof |

---

## Section 6. Data Subject Request (DSR) Playbook

### 6.1 Intake channels

| Channel | Verification method | Intended use |
|---------|---------------------|--------------|
| Email to `team@dailydraft.me` | Confirmation email round-trip + match of requester email against `auth.users.email` | General DSRs (access, rectification, erasure, portability, objection) |
| In-app request at `/settings/account` | Active session assumed authenticated; re-enter password for destructive actions | Self-service account deletion, data export |
| Meta Data Deletion Webhook endpoint at `/api/meta/data-deletion` | HMAC-SHA256 verification of Meta `signed_request` payload against App Secret — Planned Q2 2026 | Meta-initiated deletion of a specific user's Meta Platform Data |

### 6.2 Identity verification protocol

The Controller applies the following risk-tiered verification steps:

1. **Low-risk requests** (access, rectification of non-sensitive fields): confirm sender email matches account email; require response to a one-time confirmation link valid for 24 hours.
2. **High-risk requests** (erasure, portability of full account, access for third-party-unknown claimant): additionally require a two-factor challenge or signed declaration asserting identity under penalty of statutory sanction.
3. **Webhook-sourced requests** (Meta deauthorize / data deletion): require HMAC-SHA256 signature verification over the `signed_request` payload using the Meta App Secret; reject any payload failing signature check without further processing.

### 6.3 Service-level commitments

| Stage | Target |
|-------|--------|
| Acknowledgement to requester | ≤ 7 calendar days from receipt |
| Fulfilment for standard requests | ≤ 30 calendar days |
| Extension with notice (GDPR Art. 12(3)) | +60 days with written justification |
| Meta `signed_request` deletion SLA | ≤ 30 calendar days from validated receipt |

### 6.4 Escalation path

1. First-line: designated support handler monitoring the `privacy@` mailbox.
2. Second-line: Data Protection Officer (DPO — Lee Sungmin, acting).
3. Third-line: CTO (Lee Sungmin, acting) for technical feasibility review; external legal counsel to be engaged on dispute (onboarding planned Q2 2026).

### 6.5 Response template — English

> Subject: Your data request — Draft
>
> Dear {requester name},
>
> Thank you for your request received on {date}. We acknowledge your request under {PIPA Art. 35 / GDPR Art. 15–22 / CCPA §1798.100–1798.150} and confirm the following:
>
> - Request type: {access / rectification / erasure / portability / objection}
> - Scope: {all personal data / specified category}
> - Verification status: {verified / pending verification — please click the link sent separately}
>
> We will complete your request by {deadline, max 30 days}. If we require an extension, we will notify you before that date with written justification.
>
> Should you have any concerns, please reply to this email or contact our Data Protection Officer at team@dailydraft.me.
>
> Regards,
> Draft — Data Protection Office

### 6.6 Response template — Korean

> 제목: 개인정보 처리 요청 접수 확인 — Draft
>
> {요청자 성함}님께,
>
> {접수일자}에 접수된 요청을 확인드립니다. 개인정보 보호법 제35조 내지 제37조에 따른 정보주체의 권리 행사로 처리되며, 다음과 같이 안내드립니다.
>
> - 요청 유형: {열람 / 정정 / 삭제 / 처리정지 / 이동}
> - 요청 범위: {전체 / 특정 항목}
> - 본인 확인 상태: {확인 완료 / 확인 진행 중 — 별도 발송된 확인 링크를 눌러주시기 바랍니다}
>
> {처리 완료 예정일, 최대 30일} 이내에 처리 결과를 회신드립니다. 부득이 기한 연장이 필요한 경우, 사전에 서면으로 사유와 함께 안내드리겠습니다.
>
> 문의 사항은 본 메일로 회신하시거나 team@dailydraft.me 로 연락 주시기 바랍니다.
>
> 감사합니다.
> Draft 개인정보보호책임자 드림

---

## Section 7. Incident Response Runbook (abridged)

### 7.1 Severity matrix

| Severity | Trigger examples | Activation |
|----------|------------------|------------|
| SEV-0 (critical breach) | Confirmed exfiltration of plaintext credentials; unauthorised export of ≥ 1,000 personal records; public disclosure of Meta Platform Data | Immediate — all-hands bridge within 1 hour |
| SEV-1 (major) | Confirmed RLS bypass affecting multiple tenants; key material compromise; prolonged outage preventing DSR fulfilment | Within 2 hours — DPO, CTO, on-call engineer |
| SEV-2 (contained) | Single-account compromise; local misconfiguration corrected before data egress; vulnerability with exploit path but no evidence of exploitation | Same business day — on-call engineer; DPO informed |
| SEV-3 (observed risk) | Security researcher report; near-miss; suspicious patterns in audit logs | Within 3 business days — triage during standard work hours |

### 7.2 Communication tree

1. **Internal.** On-call engineer → CTO → DPO (always) → Legal Counsel (SEV-0/1) → Affected team leads.
2. **Subprocessors.** Notify any subprocessor whose systems are implicated (e.g., Supabase, Vercel) within 24 hours of SEV-0/1.
3. **Meta.** For any incident involving Meta Platform Data, submit notice through the Meta Data Incident Reporting channel "without delay".
4. **Regulators.**
   - PIPA (PIPC — Personal Information Protection Commission): notification "without delay" per Art. 34(1) when the threshold of ≥ 1,000 affected data subjects, sensitive information, or improper access via unlawful means is met.
   - GDPR supervisory authority (lead authority to be determined upon EU presence): within **72 hours** of becoming aware per Art. 33(1), unless the breach is unlikely to result in a risk.
   - California AG / affected individuals: per §1798.82 timing.
5. **Data subjects.** In-app banner + individual email for any breach likely to result in a high risk (GDPR Art. 34; PIPA Art. 34(3)).

### 7.3 External notification thresholds

| Jurisdiction | Deadline | Condition |
|--------------|----------|-----------|
| Republic of Korea (PIPA) | "Without delay" | ≥ 1,000 data subjects or sensitive personal information or illegal access |
| EU (GDPR) | 72 hours to supervisory authority | Any breach likely to result in risk to rights and freedoms |
| California (CCPA/CPRA) | Without unreasonable delay | Any breach of notification-triggering categories |
| Meta | Without delay | Any incident touching Meta Platform Data |

### 7.4 Post-incident review

- A blameless post-mortem is produced within **7 calendar days** of SEV-0/1 resolution.
- Findings feed into a Corrective and Preventive Action (CAPA) log; remediation deadlines tracked in the Annual Compliance Calendar (Section 8).
- Incident drills are conducted semi-annually (Section 8).

---

## Section 8. Annual Compliance Calendar

| Activity | Frequency | Next scheduled | Owner |
|----------|-----------|-----------------|-------|
| DPO review of this attestation and Privacy Policy | Annual | 2026-10-21 | DPO |
| External penetration test | Annual | 2026-Q4 (Planned) | CTO + external vendor |
| Subprocessor re-assessment and DPA refresh | Semi-annual | 2026-10-21 | DPO |
| RoPA update (Section 3) | Quarterly | 2026-07-21 | DPO |
| Incident response drill | Semi-annual | 2026-07-21 | CTO |
| Access review of platform admin accounts | Quarterly | 2026-07-21 | CTO |
| Secret rotation review | Quarterly | 2026-07-21 | CTO |
| Training — staff privacy and security awareness | Annual | 2026-10-21 | DPO |
| Data Protection Impact Assessment (institution tier) | Prior to launch | Planned Q2 2026 | DPO |

---

## Section 9. Technical Controls Evidence

| # | Control | Implementation | Source of truth | Last tested |
|---|---------|----------------|-----------------|-------------|
| 01 | AES-256-GCM at-rest encryption of OAuth tokens | `encryptToken()` / `decryptToken()` using 256-bit key, 96-bit IV, authenticated GCM tag | `src/lib/personas/token-crypto.ts` | 2026-04-21 (unit test suite) |
| 02 | HMAC-SHA256 verification of Meta `signed_request` | **Planned Q2 2026.** Endpoint `/api/meta/data-deletion` and helper module `src/lib/personas/meta-signed-request.ts` not yet implemented as of this attestation. | (file to be added) | Not yet implemented |
| 03 | TLS 1.3 in transit | Vercel edge default; HTTPS enforced via platform configuration; HSTS header emitted | Vercel platform defaults; no explicit override | 2026-04-21 (TLS scanner spot-check) |
| 04 | Row-Level Security (RLS) row isolation | Supabase RLS enabled on all user-visible tables; policies enforce owner/tenant scoping | `supabase/migrations/*rls*` hardening migrations (`20260419000000`, `20260420190000`, `20260420200000`) | 2026-04-20 (RLS audit — ref `memory/rls_audit_2026-04-18.md`) |
| 05 | Append-only audit logging | `audit_logs` table; SELECT policy restricted to self or admin; no UPDATE/DELETE policy (implicit deny) | `supabase/migrations/20260420220000_audit_logs.sql` | 2026-04-20 |
| 06 | Global server-side error observability | `instrumentation.ts` `onRequestError` hook — forwards to PostHog + internal `error_logs` + Discord alert | `instrumentation.ts`; commit `1beac5e` | 2026-04-21 |
| 07 | Rate limiting — per-plan and anonymous | In-process limiter with tiered quotas (FREE 60 req/min; PRO 300; TEAM 1000; anonymous 20) | `src/lib/rate-limit/api-rate-limiter.ts`; `src/lib/rate-limit/with-rate-limit.ts`; Redis-backed variant `src/lib/rate-limit/redis-rate-limiter.ts` (distributed deployment path — Planned Q2 2026) | 2026-04-21 |
| 08 | Secret management | Environment variables on Vercel (production) and Supabase (runtime). `TOKEN_ENCRYPTION_KEY` documented as immutable once set (rotation = full re-encryption). | Vercel project settings; documented in `token-crypto.ts` header comment | Rotation schedule: quarterly review (Planned — first formal rotation Q2 2026) |
| 09 | Soft-delete grace period for account erasure | `profiles.deleted_at` timestamp; public queries filter out deleted rows; hard-delete cron (Planned Q2 2026) | `supabase/migrations/20260420230000_profiles_soft_delete.sql` | 2026-04-20 |
| 10 | Input validation and output encoding | Zod schema validation on API routes; React default output escaping | `src/lib/api-utils.ts`; per-route handlers | Continuous — every deploy |
| 11 | CI pipeline — security review on PRs | GitHub Actions workflows including Lighthouse audit, type-check, lint | `.github/workflows/` (ref commit `4f79ca2`) | 2026-04-18 |
| 12 | Dependency vulnerability scanning | `npm audit` on CI (Planned Q2 2026 — automated Dependabot + SCA tool) | **Roadmap** | Not yet continuously scanned |
| 13 | External penetration test | **Planned Q4 2026** prior to full public launch | **Roadmap** | Not yet performed |

---

## Section 10. Disclaimer and Version Control

### 10.1 Scope and limitations

This attestation describes the state of controls implemented by the Controller as of the effective date. Items marked "Planned" or "Roadmap" are commitments with target windows; they are not representations of present implementation. The Controller will update this document upon material changes and re-sign at minimum annually.

### 10.2 Version history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| v1.0 | 2026-04-21 | DPO | Initial release supporting Meta App Review submission |

### 10.3 Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Data Protection Officer (DPO) | Lee Sungmin (acting — founder double-hat) | _______________________ | 2026-04-21 |
| Chief Technology Officer (CTO) | Lee Sungmin (acting) | _______________________ | 2026-04-21 |
| Legal Counsel | Not yet engaged (external counsel onboarding planned Q2 2026) | _______________________ | 2026-04-21 |

### 10.4 Contact

- Data Protection Officer: `team@dailydraft.me`
- Registered legal entity: **Lee Sungmin (sole proprietor — Korean business registration pending)**
- Business registration number: **Pending (registration in progress)**
- Business address: **Kyung Hee University Global Campus, Republic of Korea**
- Representative director / sole proprietor: **Lee Sungmin**

---

## Appendix A — 개인정보처리방침 필수 고지 (PIPA 제30조 준수 요약, Korean)

본 부록은 개인정보 보호법 제30조에서 요구하는 개인정보처리방침 필수 기재사항을 1페이지로 요약한 것이며, 전체 방침은 https://dailydraft.me/legal/privacy 에 공개되어 있습니다.

1. **처리 목적**
   - 회원 가입 및 관리, 인증, 본인 확인
   - 매칭·팀빌딩·프로젝트 운영 등 서비스 제공
   - 이용자가 명시적으로 승인한 외부 플랫폼(Threads 등) 연동 발행
   - 부정이용 방지, 문의 응대, 법적 의무 이행

2. **처리 항목**
   - 필수: 이메일, 비밀번호(해시), 닉네임, 소속 대학·학과·학번(선택)
   - 선택: 프로필 사진, 관심 분야, 포트폴리오
   - 연동 시: 외부 플랫폼 식별자, OAuth 액세스 토큰(AES-256-GCM 암호화 저장)
   - 자동 수집: IP 주소, 접속 기록, 브라우저 종류

3. **보유 기간**
   - 원칙: 회원 탈퇴 시까지, 탈퇴 요청 후 30일 유예 후 파기
   - 예외: 관련 법령(전자상거래법 등)이 요구하는 기간 별도 보존
   - OAuth 토큰: 최대 60일 또는 이용자가 연결 해제 시 즉시 파기

4. **제3자 제공**
   - Meta Platform Data의 제3자 판매·양도·공유 없음
   - 법령에 의한 제공 요청 시에 한해, 해당 사실을 이용자에게 공지

5. **처리 위탁 (수탁자 목록)**
   - Vercel Inc. — 애플리케이션 호스팅
   - Supabase, Inc. — 데이터베이스 및 인증 플랫폼
   - Anthropic, PBC / Google LLC — AI 추론 API (프롬프트 전송)
   - Resend, Inc. — 트랜잭셔널 이메일 발송
   - PostHog, Inc. — 제품 분석 및 에러 관측
   - 전체 상세 목록은 https://dailydraft.me/legal/privacy 참조

6. **정보주체의 권리**
   - 열람·정정·삭제·처리정지 요구 가능
   - `/settings/account` 또는 `team@dailydraft.me` 로 요청 가능
   - 접수 후 7일 이내 확인, 30일 이내 처리 완료를 원칙으로 함

7. **개인정보보호책임자 (DPO)**
   - 성명: 이성민 (대표자 겸임)
   - 연락처: team@dailydraft.me
   - 소속: Draft (사업자 등록 예정)

8. **개인정보 파기 절차 및 방법**
   - 전자 파일: 복구 불가능한 방법으로 영구 삭제(hard delete)
   - 서면 기록: 해당 없음 (Draft는 서면 수집 경로 없음)

9. **안전성 확보 조치**
   - AES-256-GCM 기반 토큰 암호화 (저장 시)
   - TLS 1.3 전송 구간 암호화
   - Row Level Security(RLS) 기반 테넌트 격리
   - 감사 로그(append-only) 3년 보존
   - 접근 통제 및 최소 권한 원칙

10. **권익 침해 구제**
    - 개인정보분쟁조정위원회 (www.kopico.go.kr, 1833-6972)
    - 개인정보침해신고센터 (privacy.kisa.or.kr, 국번없이 118)
    - 대검찰청 사이버수사과 (www.spo.go.kr, 02-3480-3573)
    - 경찰청 사이버안전지킴이 (ecrm.cyber.go.kr, 국번없이 182)

본 부록 작성일: 2026-04-21 · 다음 검토 예정일: 2026-10-21

---

*End of document.*
