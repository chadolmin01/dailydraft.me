# Meta App Review 폼 입력 Cheat Sheet

**목적**: Meta for Developers Dashboard → App Review → Permissions and Features → `threads_content_publish` 신청 폼에 **그대로 복사 붙여넣기** 할 수 있는 텍스트를 필드별로 정리.

**사용 방법**: 영문 섹션을 그대로 복사. 필드 하단에 "제출 직전 체크" 항목 확인.

---

## 필드 1: How will your app use this permission?
*문자 제한: 통상 1,000자. 영문.*

```
Draft is an operations platform for Korean university clubs. Club administrators use Draft to manage weekly operations, member records, and content workflows. Our Threads integration lets an admin publish announcements that they have drafted and explicitly approved inside Draft to the club's own Threads account, so a single source of truth stays consistent across operations and public presence.

We request threads_content_publish to post text-only announcements (under 500 characters) on behalf of the admin who connected their Threads account. Every post passes through an approval state machine (is_copy_only default, explicit "Approve and publish" click, per-persona rate limit) so there is no autonomous posting. AI-generated drafts are writing assists; the human reviewer remains the publisher of record.

We request threads_basic only to fetch the authenticated user's id and username for display inside Draft ("Connected as @username") and to target publishing at the correct account. No other profile data is read or stored.

We do not:
- Post without explicit human approval of the draft.
- Share or sell user data or tokens to third parties.
- Access any Threads content other than the connecting user's own account.
- Combine Meta Platform Data with other sources.

Data handling: OAuth access tokens are encrypted at rest with AES-256-GCM, never exposed to the browser, and hard-deleted on disconnect. See our security architecture dossier (attached).
```

---

## 필드 2: Step-by-step instructions for our reviewers

```
A test account will be provided after acknowledgement. Typical reviewer walkthrough (approx. 6 minutes):

1. Visit https://dailydraft.me/login and sign in with the provided test credentials.
2. Navigate to Clubs > reviewer-demo > Settings > Persona.
3. Find the "Threads" card under "어디로 자동 발행할까요?" (Where to auto-publish).
4. Click "Threads 연결하기" (Connect Threads) to start OAuth.
5. Complete Meta's consent screen with a registered Threads Tester account.
6. On redirect, verify the card now shows "Connected as @<username>".
7. Return to the persona dashboard, open the "Drafts" tab, click "Generate" to produce an AI draft.
8. Optionally edit the draft, then click "Approve and publish" to push it to Threads.
9. Open https://www.threads.net/@<username> in a new tab and verify the post appears.
10. Disconnect the integration by clicking "Disconnect" on the Threads card; confirm the card returns to the unconnected state.

Data deletion flow: visit https://dailydraft.me/legal/data-deletion or POST a valid signed_request to https://dailydraft.me/api/oauth/threads/data-deletion. Meta will receive { url, confirmation_code } and the status endpoint GET /api/oauth/threads/data-deletion/status?code=<code> returns processing status.
```

---

## 필드 3: Privacy policy URL
```
https://dailydraft.me/legal/privacy
```

## 필드 4: Terms of service URL
```
https://dailydraft.me/legal/terms
```

## 필드 5: Data deletion callback URL
```
https://dailydraft.me/api/oauth/threads/data-deletion
```

## 필드 6: Data deletion instructions URL
```
https://dailydraft.me/legal/data-deletion
```

## 필드 7: Deauthorize callback URL
```
https://dailydraft.me/api/oauth/threads/deauthorize
```

## 필드 8: App website URL
```
https://dailydraft.me
```

## 필드 9: Valid OAuth Redirect URIs (Meta 앱 Settings)
```
https://dailydraft.me/api/oauth/threads/callback
http://localhost:3000/api/oauth/threads/callback
```
(localhost 는 Threads Tester 계정으로만 접근 가능. 스모크 테스트용.)

---

## 필드 10: Screencast / Demo Video

**업로드 경로**: Meta 폼의 "Screencast demonstrating usage" 필드에 직접 MP4 업로드 (<100MB), 또는 YouTube unlisted 링크.

**영상 요구사항 — 체크리스트**:
- [ ] 1080p 이상, MP4, < 100MB
- [ ] 3~5분 내 러닝타임
- [ ] OAuth 동의 화면에서 권한 목록(`threads_basic`, `threads_content_publish`) 3초 이상 노출
- [ ] AI 생성 초안 화면에서 "human review required" 시그널 가시적 (Approve 버튼 클릭 전/후)
- [ ] Threads 실제 게시물을 새 탭에서 확인하는 장면 포함
- [ ] 데이터 삭제 흐름 10초 이상 (페이지 방문 또는 disconnect 동작)

**녹화 가이드**: `docs/meta-app-review/demo-video-script.md` 참조. Xbox Game Bar (Win+G) 또는 OBS 사용. OAuth 구간만 수동 녹화, 나머지는 `pnpm demo:record` 자동화 가능.

---

## 필드 11: Test User Credentials

```
Email: [reviewer-<ticket>@dailydraft.me — Meta 배정 ticket ID 받은 후 기재]
Password: [16-char rotating, 제출 직전 생성]
Club slug (pre-provisioned as admin): reviewer-demo
Persona ID: [DB 프로비저닝 후 기재]

Notes for reviewers:
- This account is pre-provisioned as an admin of one club ("reviewer-demo").
- A dummy Persona has been created so the "Connect Threads" button is visible.
- No real user data is in this club; sample content is synthetic.
- The test Threads account must already be a registered Tester in our Meta App Dashboard.
```

**프로비저닝**: `scripts/provision-reviewer-account.mjs` 실행 (프로덕션 DB 접근, 관리자만).

---

## 제출 직전 최종 체크리스트

### 1. URL 도달성
- [ ] `curl -s -o /dev/null -w '%{http_code}' https://dailydraft.me/legal/privacy` → **200**
- [ ] `curl -s -o /dev/null -w '%{http_code}' https://dailydraft.me/legal/terms` → **200**
- [ ] `curl -s -o /dev/null -w '%{http_code}' https://dailydraft.me/legal/data-deletion` → **200**
- [ ] `curl -X POST https://dailydraft.me/api/oauth/threads/data-deletion -d 'signed_request=x' -I` → **400** (not 403)
- [ ] `curl -X POST https://dailydraft.me/api/oauth/threads/deauthorize -d 'signed_request=x' -I` → **400**

### 2. 테스트 계정 동작
- [ ] 제공한 email/password 로 실제 로그인 성공
- [ ] reviewer-demo 클럽 admin 으로 접근 가능
- [ ] 페르소나 설정 페이지에서 "Threads 연결하기" 버튼 노출
- [ ] 브라우저 콘솔에 JS 에러 없음

### 3. 데모 영상
- [ ] MP4 파일 100MB 이하
- [ ] 권한 목록 장면 3초+ 노출 (스크러빙으로 확인)
- [ ] 실제 Threads 게시물 노출 장면 포함

### 4. Meta 앱 콘솔 선행 설정
- [ ] OAuth Redirect URIs 등록됨 (프로덕션 + localhost)
- [ ] Deauthorize Callback URL 등록됨
- [ ] Data Deletion Request URL 등록됨
- [ ] 본인 Threads 계정이 Threads Testers 에 추가됨
- [ ] 테스트 계정이 Threads Testers 에 추가됨

### 5. 보조 자료
- [ ] `draft-meta-review-package-v1.0.pdf` 첨부 준비 (번들 PDF)
- [ ] team@dailydraft.me 메일박스 수신 확인 (Meta 답변이 여기로 옴)

---

## 반려 시 대응 템플릿

반려 수령 시 24시간 내 `docs/meta-app-review/reviewer-expectations.md §7` 의 영문 템플릿으로 답신. 반려 사유 카테고리별 대응:

| 카테고리 | 대응 |
|---|---|
| Use case too vague | use-case.md §3 의 concrete flow 표를 발췌해서 직접 본문에 포함 |
| No human-in-the-loop shown | 데모 영상에서 Approve 버튼 클릭 전/후 2초 freeze frame 재녹화 |
| Data deletion pathway unclear | /legal/data-deletion 페이지 URL 직접 방문 증거(스크린샷) 첨부 |
| Technical errors during test | 브라우저 DevTools 콘솔 클린한 상태로 재녹화 |

---

**최종 개정**: 2026-04-21
**변경 이력**: v1.0 (초안)
