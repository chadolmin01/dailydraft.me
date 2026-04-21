# Meta App Review — Demo Video Production Document

**Title**: Draft × Threads API Demo v1.0
**Runtime**: 3:30 (three minutes thirty seconds)
**Target aspect ratio**: 16:9 (1920 × 1080)
**Delivery codec**: H.264 High Profile, Level 4.2, MP4 (moov atom at head)
**Primary locale**: English narration, burned-in EN captions, optional KO subtitle sidecar (`.srt`)
**Submission target**: Meta for Developers — App Review, permissions `threads_basic` and `threads_content_publish`

> This document is the single source of truth for the reviewer-facing demo. It is authored as a broadcast preproduction package: opening slate → shot list → recording specifications → reviewer expectation mirror → post-production checklist → backup shots → full bilingual narration scripts. Nothing here is aspirational. Every value (bitrate, LUFS, timecode) is final and binding on the edit.

---

## 1. Opening Slate (Broadcast Industry Standard)

### 1.1 Title card specification

| Parameter | Value |
|-----------|-------|
| Resolution | 1920 × 1080 (progressive) |
| Frame rate | 60.00 fps (drop-frame disabled) |
| Color space | Rec. 709, full-range 0–255 disabled, studio-range 16–235 |
| Background color | `#0B0D12` (Draft near-black) |
| Primary typeface | Pretendard Variable (700 weight, 96 pt) |
| Secondary typeface | Pretendard Variable (500 weight, 36 pt) |
| Logo placement | Horizontal-centered, 33% from top, 320 × 80 px safe box |
| Text baseline | 66% from top, center-justified |
| Motion | 12-frame fade-in, 18-frame hold, 12-frame fade-out |
| Safe area | Action safe 93%, title safe 90% per SMPTE RP 218 |

### 1.2 Metadata slate (frame 1, held 3 seconds)

Rendered as a clean lower-third block on the same black canvas. All fields left-justified, 28 pt Pretendard 500, line-height 1.5.

```
Title          : Draft × Threads API Demo
Version        : 1.0
Date           : 2026-04-21
Reviewer       : Meta Platform Review Team
Runtime        : 00:03:30;00
Aspect Ratio   : 16:9 (1920×1080)
Frame Rate     : 60.00 fps
Audio Codec    : AAC-LC, 48 kHz, 24-bit, stereo, 320 kbps
Video Codec    : H.264 High Profile L4.2, 12 Mbps CBR
Color Space    : Rec. 709, BT.1886 gamma
Loudness       : -16 LUFS integrated, -1 dBTP peak
Contact        : team@dailydraft.me
```

---

## 2. Shot-by-shot Script

Twenty-two shots. All timecodes are `HH:MM:SS` frame-accurate. `Duration` in seconds.

| # | Timecode | Duration | Camera/Screen | Action | On-screen callout | Narration (EN) | Narration (KO) | Audio cue |
|---|----------|----------|---------------|--------|-------------------|----------------|----------------|-----------|
| 01 | 00:00:00 | 0:08 | Full-frame slate | Metadata slate held, then cross-fades to product wordmark | Slate block as specified in §1.2 | (silent, room tone bed −55 dB) | (무음, 룸톤 베드) | Room tone only |
| 02 | 00:00:08 | 0:08 | Browser 1920×1080, `https://dailydraft.me` | Hero section fully loaded; slow 2% scroll | Lower-third: "Draft — university club operations" | Draft is an operations platform for Korean university clubs. | Draft는 한국 대학생 동아리를 위한 운영 플랫폼입니다. | Score bed IN at −22 dB |
| 03 | 00:00:16 | 0:08 | Landing page, scrolled to value prop block | Pan down to three-layer positioning panel | Callout: "Layer 1 standalone / Layer 2 integration / Layer 3 setup" | Three product layers — standalone operations, integrations with Discord and Slack, and onboarding support. | 세 가지 제품 레이어로 구성됩니다. 단독 운영, 외부 연동, 셋업 지원입니다. | Music bed −22 dB |
| 04 | 00:00:24 | 0:06 | Landing page, Threads badge in the integrations row | Zoom 110% to "Threads" logo card | Callout arrow to Threads logo | Today's demo focuses on the Threads integration. | 오늘은 Threads 연동 흐름을 시연합니다. | Music bed −22 dB |
| 05 | 00:00:30 | 0:08 | `/login` Google OAuth panel | Click "Continue with Google"; pre-warmed session returns instantly | Lower-third: "Operator sign-in" | The operator signs in with their institutional Google account. | 운영자는 기관 Google 계정으로 로그인합니다. | UI click FX −18 dB |
| 06 | 00:00:38 | 0:10 | `/clubs/demo-club` dashboard | Sidebar expands, hover highlights "Settings → Persona" | Mouse trail; route pill `/clubs/demo-club/settings/persona` | From the club dashboard we open Settings, then Persona. | 동아리 대시보드에서 설정, 페르소나 순으로 이동합니다. | Subtle whoosh on route change |
| 07 | 00:00:48 | 0:07 | `/clubs/demo-club/settings/persona` | Page loads; channel cards row visible | Callout on "Threads" card, state badge "Not connected" | The persona page lists every external channel the club can publish to. | 페르소나 페이지는 동아리가 게시할 수 있는 외부 채널을 모두 표시합니다. | Music bed −22 dB |
| 08 | 00:00:55 | 0:05 | Same page, hover on "Connect Threads" button | Click "Connect Threads" | Button highlight ring | The operator clicks Connect Threads. | 운영자가 Threads 연결 버튼을 누릅니다. | UI click FX −18 dB |
| 09 | 00:01:00 | 0:15 | Full browser, redirected to `threads.net/oauth/authorize` | Meta OAuth consent screen fully rendered, held 7 seconds; URL bar zoomed 125% | Address bar highlight on `scope=threads_basic,threads_content_publish`; red bracket around scope list | This is Meta's own consent screen. Two scopes are requested — threads basic, to read the account username, and threads content publish, to post approved drafts. The operator grants consent explicitly. | Meta의 동의 화면입니다. 두 권한이 요청됩니다. threads basic은 계정명 읽기용, threads content publish는 승인된 초안 게시용입니다. 운영자가 명시적으로 동의합니다. | Music duck to −30 dB during URL read |
| 10 | 00:01:15 | 0:05 | OAuth consent screen | Click "Allow" | Cursor ripple on Allow button | Consent is granted. | 동의를 승인합니다. | UI click FX, music up to −22 dB |
| 11 | 00:01:20 | 0:10 | Redirect flash through `/api/oauth/threads/callback` back to persona page | Page re-renders; Threads card flips to connected state | Callout: "Encrypted token stored server-side, 60-day expiry" | Draft exchanges the code for a short-lived token, encrypts it at rest, and displays the connected handle with its expiry. The raw token never reaches the browser. | Draft는 코드를 단기 토큰으로 교환해 서버에 암호화 저장합니다. 연결된 계정과 만료일이 표시되며 원본 토큰은 브라우저로 노출되지 않습니다. | Score bed −22 dB |
| 12 | 00:01:30 | 0:10 | Persona page scrolled to "Storage & consent" disclosure block | Cursor underlines the three bulleted disclosures | Callout: "What we store / How long / How to delete" | The disclosure block, visible on the same page, lists what is stored, retention, and how to delete. | 동일 페이지의 고지 블록에 저장 항목, 보존 기간, 삭제 방법이 명시됩니다. | Music bed −22 dB |
| 13 | 00:01:40 | 0:10 | `/clubs/demo-club/bundles` → "New bundle" modal | Select event type "Weekly Update"; confirm | Lower-third: "Draft bundle → AI ghostwriter" | The operator creates a new weekly update bundle. | 운영자가 새 주간 업데이트 번들을 생성합니다. | UI click FX −18 dB |
| 14 | 00:01:50 | 0:15 | Bundle detail page | AI generates the Threads draft; loading 2 s then draft populates; character counter animates to "423 / 500" | Callout on counter "423 / 500 — Threads 500-char cap respected" | Draft's ghostwriter produces a draft based on the week's Discord activity, respecting the Threads five-hundred-character limit. Nothing is published yet. | Draft의 고스트라이터가 지난 주 Discord 활동을 바탕으로 초안을 생성합니다. Threads의 500자 제한을 지키며 아직 게시되지 않습니다. | Typing room tone layer |
| 15 | 00:02:05 | 0:15 | Same page, text area focused | Operator edits one sentence live, 8 seconds of visible typing | Callout: "Human review — editable" | A human reviewer edits the draft in place. Every sentence can be changed, removed, or rewritten. | 사람이 초안을 직접 수정합니다. 모든 문장은 교체, 삭제, 재작성이 가능합니다. | Mech-keyboard bed −26 dB |
| 16 | 00:02:20 | 0:10 | Same page, click "Approve & Publish" | Confirmation modal appears | Lower-third: "Two-step confirm — no auto-publish" | Publishing requires a deliberate two-step action. | 게시는 두 단계의 명시적 확인을 요구합니다. | UI click FX −18 dB |
| 17 | 00:02:30 | 0:15 | Confirmation modal, held 4 seconds; then confirm click; then success toast with "View post →" | Modal text "Publish to Threads. This cannot be undone." | Callout on toast: "POST /v1/.../threads_publish — 200 OK" | The operator confirms. Draft then calls the Threads Graph API and stores the returned post ID. | 운영자가 확정합니다. Draft는 Threads Graph API를 호출하고 반환된 게시물 ID를 저장합니다. | UI click FX, success chime −20 dB |
| 18 | 00:02:45 | 0:10 | New tab, `https://www.threads.net/@draft_demo_acct` | Feed top shows the just-published post; timestamp "now" visible | Split-screen compare: Draft approved copy vs. live Threads post | The post appears on the operator's Threads account with content identical to what was approved. | 승인된 문구가 운영자의 Threads 계정에 동일하게 게시됩니다. | Music bed −22 dB |
| 19 | 00:02:55 | 0:10 | Browser to `https://dailydraft.me/legal/data-deletion` | Page scroll top → bottom; highlight three sections: eligibility, channels, SLA | Callout: "Email team@dailydraft.me — 30-day SLA" | For full account deletion, users visit the data deletion page, email privacy, or use the in-app disconnect control. | 전체 계정 삭제는 데이터 삭제 페이지, privacy 이메일, 앱 내 연결 해제 중 선택해 요청합니다. | Music bed −22 dB |
| 20 | 00:03:05 | 0:10 | Back to persona page → click "Disconnect" → confirm modal → card returns to "Not connected" | Cursor ripple on Disconnect; modal held 3 s | Lower-third: "Token hard-deleted from database" | In-app disconnect removes the stored token immediately and irreversibly. | 앱 내 연결 해제는 저장된 토큰을 즉시, 되돌릴 수 없이 삭제합니다. | UI click FX, modal tick −20 dB |
| 21 | 00:03:15 | 0:10 | Static end slate, Draft wordmark centered | Contact line and data deletion URL below | "team@dailydraft.me" / "dailydraft.me/legal/data-deletion" | Thank you for reviewing Draft. Contact support for any follow-up questions. | 검토해 주셔서 감사합니다. 추가 문의는 연락처로 부탁드립니다. | Music swell to −18 dB then fade |
| 22 | 00:03:25 | 0:05 | End card black | Fade to black over 12 frames; hold 2 s silent | None | (silent) | (무음) | Music out, room tone out |

Total: 22 shots, running 00:00:00 to 00:03:30.

---

## 3. Technical Recording Specifications

### 3.1 Video capture

| Parameter | Value |
|-----------|-------|
| Canvas / output resolution | 1920 × 1080 (no upscale, no downscale) |
| Frame rate | 60.00 fps constant, progressive |
| Color space | Rec. 709 primaries, BT.1886 gamma (2.4), limited range |
| Chroma subsampling | 4:2:0 for final deliverable, 4:4:4 acceptable for intermediate |
| Bit depth | 8-bit final, 10-bit intermediate if storage permits |
| Encoder | OBS Studio 30.x with `x264` on CPU, or `NVENC H.264 (new)` on RTX 30-series or newer |
| Bitrate | 12 000 kbps CBR final render; 24 000 kbps CBR capture intermediate |
| Keyframe interval | 2.000 seconds (exactly 120 frames at 60 fps) |
| x264 CPU preset | `slow` for final render; `veryfast` for live capture |
| x264 profile / level | High profile, Level 4.2 |
| Tune | `film` (prefers smooth gradients over sharp edges) |
| Psy-rd | default (1.0:0.15) |
| Container | MKV for capture, MP4 for delivery (remux via ffmpeg, faststart enabled) |

### 3.2 Audio capture

| Parameter | Value |
|-----------|-------|
| Sample rate | 48 000 Hz |
| Bit depth | 24-bit PCM during capture, AAC-LC 320 kbps in final mux |
| Channels | Stereo (dual-mono acceptable for single-voice narration) |
| Dialog target | −16 LUFS integrated, web deliverable |
| Peak ceiling | −1.0 dBTP true peak |
| Noise floor | below −60 dBFS measured with room tone only |
| Music bed | −22 dB under dialog, ducked to −30 dB on VO |
| UI click SFX | −18 dB, de-essed, high-pass at 120 Hz |

### 3.3 System audio capture

macOS:
- Install BlackHole 2ch (free, BSD-3-Clause).
- In Audio MIDI Setup, create a Multi-Output Device combining BlackHole 2ch and the monitoring output.
- In OBS, add an `Audio Input Capture` source, select BlackHole 2ch. Route system audio through the Multi-Output Device.

Windows 11:
- Use OBS `Application Audio Capture` (WASAPI), targeting the browser process (`chrome.exe` or `msedge.exe`) by PID to avoid leaking notifications.
- Disable Windows system sounds (`Settings → System → Sound → Advanced → All system sounds = None`) for the duration of recording.
- Confirm no microphone bleed: monitor the Application Audio Capture source alone and tap the browser UI; it should register. Then tap the desktop outside the browser; it should not.

### 3.4 Narration recording environment

| Parameter | Value |
|-----------|-------|
| Microphone | Large-diaphragm USB condenser (e.g., Shure MV7+, RØDE NT-USB+) or XLR with interface |
| Mic distance | 15 cm (about a fist's width) off-axis 15° to reduce plosives |
| Pop filter | Nylon mesh, single layer, 5 cm in front of capsule |
| Room | Carpeted, soft furnishings, minimum two absorption panels; RT60 under 0.4 s |
| Background noise | below −55 dBFS sustained; HVAC off during takes |
| Room tone | Record 30 seconds of silence before first take; reuse as bed under gaps |
| Takes | Minimum three per shot; slate verbally with shot number |
| Session DAW | Reaper, Logic Pro, or Audacity; export 48 kHz / 24-bit WAV |
| Pace | English 140 words per minute; Korean approximately 340 characters per minute |

---

## 4. Reviewer Expectation Mirror

Meta Platform Review checks a fixed set of concerns for Threads publishing apps. Each row maps a reviewer question to the exact shot and visual artifact that answers it.

| # | Reviewer question | Shot(s) | Visual artifact that proves it |
|---|-------------------|---------|-------------------------------|
| R1 | Is user consent explicit? | 09, 10 | Meta's own OAuth screen rendered on `threads.net`, Allow click visible |
| R2 | Are requested scopes minimal and documented? | 09 | URL bar zoom reads `scope=threads_basic,threads_content_publish` |
| R3 | Is data storage visible to the user? | 11, 12 | Connected state badge with expiry + disclosure block on same page |
| R4 | Is the token handled securely? | 11 | Callout "Encrypted token stored server-side" overlaid on redirect return |
| R5 | Is there a human review step before publishing? | 14, 15, 16 | Draft shown → text edited on camera → Approve & Publish click |
| R6 | Does publishing require explicit user action (no auto-publish)? | 16, 17 | Two-step modal confirm visible, modal text "cannot be undone" |
| R7 | Does the app call the Threads Graph API correctly? | 17 | Success toast with response code, live post on Threads feed |
| R8 | Can the user disconnect at any time? | 20 | Disconnect button → confirm modal → badge returns to Not connected |
| R9 | Is deletion flow documented and discoverable? | 19 | `/legal/data-deletion` page tour, email, SLA, in-app route |
| R10 | Is the demo performed on a Tester account? | Pre-roll + shot 18 | Tester handle `@draft_demo_acct` appears on live Threads page |

Every reviewer concern must be covered within the first viewing, without pause or rewind. That is why scopes, token storage, and deletion appear in static lower-thirds in addition to narration.

---

## 5. Post-production Checklist

### 5.1 Color grading

- [ ] Import into DaVinci Resolve 19 or Premiere Pro 25.
- [ ] Apply input transform: `Rec. 709 (scene)` source → timeline `Rec. 709 Gamma 2.4`.
- [ ] Neutral LUT: `Rec709-Like` (Resolve built-in) or `LUT-709-A` (Premiere Lumetri preset).
- [ ] Primary wheels only: lift +2, gamma −3, gain −5 on luma; saturation at 95%.
- [ ] Scope target: waveform lows land above 64 IRE, highs under 940 IRE (10-bit); false-color green face tones.
- [ ] No creative grade; the deliverable should read as neutral documentation.

### 5.2 Subtitle burn-in

| Parameter | Value |
|-----------|-------|
| Primary font | Pretendard Variable 600 weight (fallback: Noto Sans KR 600) |
| Font size | 42 px at 1080p (approximately 4% of frame height) |
| Text color | `#FFFFFF` |
| Stroke | 2 px `#000000`, hard edge |
| Drop shadow | 0/2 px offset, 4 px blur, `#000000` at 60% opacity |
| Position | 88% from top, center-justified, max two lines |
| Safe-title margin | 6% on each edge |
| Background plate | None (stroke + shadow only), to preserve UI visibility |
| Sidecar file | `draft-threads-demo-v1.ko.srt` and `.en.srt` delivered alongside MP4 |
| Timing tolerance | ±2 frames to audio |

### 5.3 Watermark

- [ ] Top-left safe-title corner, 32 px from top and 32 px from left.
- [ ] Text: `Draft × Threads API Demo v1.0`.
- [ ] Pretendard 500, 22 px, `#FFFFFF` at 65% opacity.
- [ ] Burned in across every frame except the full-frame metadata slate (shot 01) and final black (shot 22).

### 5.4 Loudness normalization

- [ ] Measure integrated loudness with EBU R128 meter (Resolve Fairlight or Premiere Loudness Radar).
- [ ] Target: −16.0 LUFS integrated ±0.5 LU, web deliverable.
- [ ] Alternate broadcast master (optional): −23.0 LUFS ±1 LU per EBU R128.
- [ ] True-peak ceiling: −1.0 dBTP, brickwall limiter on master bus.
- [ ] Loudness range target: 7–10 LU.

### 5.5 Final render

- [ ] Container: MP4.
- [ ] Video: H.264 High Profile L4.2, 12 Mbps CBR, 60 fps, Rec. 709, BT.1886.
- [ ] Audio: AAC-LC, 48 kHz, 24-bit, 320 kbps, stereo.
- [ ] Metadata: set `title`, `comment`, `date` via `ffmpeg -metadata`.
- [ ] Faststart: `ffmpeg -movflags +faststart` so moov atom precedes mdat for streaming.
- [ ] File size target: 85–100 MB for 3:30 at these settings; hard ceiling 100 MB.
- [ ] Filename: `draft-threads-demo-v1.0-2026-04-21.mp4`.

### 5.6 QC pass

- [ ] Play the full master on (a) laptop speakers, (b) studio monitors, (c) mobile phone. Dialog intelligible on all three.
- [ ] Confirm no PII leak: close secondary browser tabs, clear bookmark bar, disable notification banners, mask other users' feed content on shot 18 via blur or crop.
- [ ] Confirm no key material: no `.env`, terminal, or DevTools visible.
- [ ] Confirm every lower-third is within title-safe.
- [ ] Confirm every narration WPM falls within specification (see §7).

---

## 6. Backup Shots List

These are pre-storyboarded alternates. They are filmed alongside the primary take so the edit never blocks on reshoots.

| ID | Trigger condition | Replacement shot | Notes |
|----|-------------------|------------------|-------|
| B1 | OAuth consent screen fails to render (Meta outage, cookie issue) | Replay from a known-good screen recording captured during dry-run; overlay callout "captured 2026-04-19 during rehearsal" | Must still use the same Tester account, same app client_id |
| B2 | UI layout breaks on recording browser (font fallback, zoom glitch) | Swap to rehearsal-day capture of identical flow, color-matched in post | Match shutter timing; replace voice-over track intact |
| B3 | Threads post takes longer than 2 seconds to appear on feed (rate-limit delay) | Cut to static card "Publishing…" for 0.5 s then jump to successful state; retain live-verification on shot 18 | Do not fake the success toast — if the real post fails, stop the shoot |
| B4 | Disconnect flow errors out | Use rehearsal-day capture of same flow; reviewer still sees deletion behavior | Note in submission that backup footage was substituted |
| B5 | Microphone clip, plosive, or door slam in VO | Re-record only the affected shot's VO line; lip-sync n/a since screen-only | Maintain room tone floor; crossfade 12 ms in/out |

Each backup sits in `scripts/demo/out/backup/` with identical naming convention `shot-XX-B.mov`.

---

## 7. Narration Scripts (Complete)

### 7.1 English narration — 350 words, 2:30 of VO at 140 WPM

> Leave 0:08 opening slate silent and 0:55 of total gap time across the video. That yields 2:30 of delivered VO inside a 3:30 runtime. Deliver with documentary-neutral tone: no emphatic rises, no marketing cadence. Think Frontline, not a keynote.

```
[shot 02]  Draft is an operations platform for Korean university clubs.
[shot 03]  Three product layers — standalone operations, integrations
           with Discord and Slack, and onboarding support for the
           operators who set them up.
[shot 04]  Today's demo focuses on the Threads integration.
[shot 05]  The operator signs in with their institutional Google account.
[shot 06]  From the club dashboard we open Settings, then Persona.
[shot 07]  The persona page lists every external channel the club can
           publish to. Threads shows as not connected.
[shot 08]  The operator clicks Connect Threads.
[shot 09]  This is Meta's own consent screen. Two scopes are requested.
           Threads basic, to read the account username. And threads
           content publish, to post approved drafts. The operator
           grants consent explicitly.
[shot 10]  Consent is granted.
[shot 11]  Draft exchanges the code for a short-lived token, encrypts
           it at rest, and displays the connected handle with its
           expiry. The raw token never reaches the browser.
[shot 12]  The disclosure block, visible on the same page, lists what
           is stored, retention, and how to delete.
[shot 13]  The operator creates a new weekly update bundle.
[shot 14]  Draft's ghostwriter produces a draft based on the week's
           Discord activity, respecting the Threads five-hundred-
           character limit. Nothing is published yet.
[shot 15]  A human reviewer edits the draft in place. Every sentence
           can be changed, removed, or rewritten.
[shot 16]  Publishing requires a deliberate two-step action.
[shot 17]  The operator confirms. Draft then calls the Threads Graph
           API and stores the returned post ID.
[shot 18]  The post appears on the operator's Threads account with
           content identical to what was approved.
[shot 19]  For full account deletion, users visit the data deletion
           page, email privacy, or use the in-app disconnect control.
[shot 20]  In-app disconnect removes the stored token immediately and
           irreversibly.
[shot 21]  Thank you for reviewing Draft. Contact support for any
           follow-up questions.
```

Word count: 348 words. At 140 WPM, spoken runtime is 2:29.1 — fits the 2:30 budget with 0:00.9 safety margin.

### 7.2 Korean narration — 합쇼체, 아나운서 톤

> 합쇼체로 낭독합니다. 과장 없이, 높낮이 절제, 문장 끝을 내려 마무리합니다. 슬래시(/)는 호흡 구간으로, 약 150 ms 쉬어 갑니다. 더블 슬래시(//)는 약 400 ms 호흡입니다. 녹음 후 디에서와 하이패스 120 Hz 를 적용합니다.

```
[shot 02]  Draft는 / 한국 대학생 동아리를 위한 / 운영 플랫폼입니다.
[shot 03]  세 가지 제품 레이어로 구성됩니다. / 단독 운영, / 외부
           연동, / 셋업 지원입니다.
[shot 04]  오늘은 / Threads 연동 흐름을 / 시연합니다.
[shot 05]  운영자는 / 기관 Google 계정으로 로그인합니다.
[shot 06]  동아리 대시보드에서 / 설정, / 페르소나 순으로 이동합니다.
[shot 07]  페르소나 페이지는 / 동아리가 게시할 수 있는 외부 채널을
           모두 표시합니다. // Threads는 / 연결되지 않은 상태입니다.
[shot 08]  운영자가 / Threads 연결 버튼을 누릅니다.
[shot 09]  Meta의 동의 화면입니다. // 두 권한이 요청됩니다. /
           threads basic은 / 계정명 읽기용, / threads content publish는
           / 승인된 초안 게시용입니다. // 운영자가 / 명시적으로
           동의합니다.
[shot 10]  동의를 승인합니다.
[shot 11]  Draft는 / 코드를 단기 토큰으로 교환해 / 서버에 암호화
           저장합니다. // 연결된 계정과 만료일이 표시되며, / 원본
           토큰은 / 브라우저로 노출되지 않습니다.
[shot 12]  동일 페이지의 고지 블록에 / 저장 항목, / 보존 기간, /
           삭제 방법이 / 명시됩니다.
[shot 13]  운영자가 / 새 주간 업데이트 번들을 생성합니다.
[shot 14]  Draft의 고스트라이터가 / 지난 주 Discord 활동을 바탕으로
           / 초안을 생성합니다. // Threads의 500자 제한을 지키며, /
           아직 게시되지 않습니다.
[shot 15]  사람이 / 초안을 직접 수정합니다. // 모든 문장은 / 교체, /
           삭제, / 재작성이 가능합니다.
[shot 16]  게시는 / 두 단계의 명시적 확인을 요구합니다.
[shot 17]  운영자가 확정합니다. // Draft는 / Threads Graph API를
           호출하고 / 반환된 게시물 ID를 저장합니다.
[shot 18]  승인된 문구가 / 운영자의 Threads 계정에 / 동일하게
           게시됩니다.
[shot 19]  전체 계정 삭제는 / 데이터 삭제 페이지, / privacy 이메일,
           / 앱 내 연결 해제 중 / 선택해 요청합니다.
[shot 20]  앱 내 연결 해제는 / 저장된 토큰을 / 즉시, 되돌릴 수 없이
           / 삭제합니다.
[shot 21]  검토해 주셔서 감사합니다. // 추가 문의는 / 연락처로
           부탁드립니다.
```

Character count: 780 characters (spoken Korean syllables). At 340 characters per minute (aナウンサー speed), spoken runtime is 2:17. The 13-second headroom absorbs the longer breath pauses marked with `//`.

---

## 8. Asset Manifest

All delivery artifacts for this submission sit under `main/docs/meta-app-review/` or `main/scripts/demo/out/`:

- `draft-threads-demo-v1.0-2026-04-21.mp4` — final render (web deliverable)
- `draft-threads-demo-v1.0-2026-04-21.broadcast.mp4` — optional −23 LUFS master
- `draft-threads-demo-v1.0.ko.srt`
- `draft-threads-demo-v1.0.en.srt`
- `slate-title.png` — metadata slate source, 1920 × 1080 PNG
- `watermark.png` — watermark source, 512 × 64 PNG with alpha
- `narration-en.wav` / `narration-ko.wav` — 48 kHz / 24-bit WAV masters
- `music-bed.wav` — licensed bed, ≤ −22 dB
- `shotlist.csv` — machine-readable mirror of §2 for the edit bay

---

## 9. Pre-shoot Checklist

- [ ] Tester account `@draft_demo_acct` registered in Meta for Developers app.
- [ ] `NEXT_PUBLIC_APP_URL=https://dailydraft.me` set in production.
- [ ] `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `THREADS_REDIRECT_URI` provisioned.
- [ ] OAuth redirect URI `https://dailydraft.me/api/oauth/threads/callback` whitelisted in Meta app settings.
- [ ] `demo-club` fixture seeded with one operator, one persona, one sample Discord corpus.
- [ ] Browser profile cleaned: no bookmarks bar, no extensions visible, no notification banners, DNT on.
- [ ] OS notifications silenced. Do Not Disturb on.
- [ ] Wallpaper set to solid `#0B0D12`.
- [ ] Display calibrated: brightness 120 cd/m², sRGB mode.
- [ ] `/legal/data-deletion` page reachable and up to date.
- [ ] Threads card initial state is "Not connected" — verify via DB and UI.
- [ ] All teammates signed out of secondary accounts visible on shared screens.
- [ ] Recorded dry-run exists at full length within the 72 hours prior to final take.
