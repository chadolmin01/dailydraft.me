# Meta App Review — Demo Video Script

Meta 앱 리뷰어가 `threads_basic` 과 `threads_content_publish` 권한이 실제 플로우에서 어떻게 사용되는지 끝까지 확인할 수 있는 3~5분 영상 스크립트입니다. 영문 내레이션을 기본으로 녹음하거나, 한국어 내레이션 + 영문 자막을 삽입하십시오. Meta 리뷰어는 한국어를 읽지 못합니다.

- 총 길이: 3분 30초 (권장) / 최대 5분
- 해상도: 1920x1080, 30fps, H.264 MP4, <100MB
- 도메인: https://dailydraft.me
- 테스트 계정: Meta for Developers 앱에 "Threads Tester" 로 사전 추가한 본인 Threads 계정만 사용

---

## 0:00 – 0:15 | 씬 1: 앱 소개 (Intro)

**화면**
- Draft 랜딩 페이지 (https://dailydraft.me) — hero 섹션 전체
- 우상단에 작은 워터마크 "Draft — Persona Engine Demo"

**내레이션**

- 영문: "Draft is an operations platform for Korean university clubs. Operators use Draft to manage members, run weekly updates, and publish content to the club's own social channels. This demo shows how Draft uses the Threads Content Publishing permission."
- 한글: "Draft는 한국 대학생 동아리 운영 플랫폼입니다. 운영진이 Draft에서 멤버 관리, 주간 업데이트, 동아리 채널 콘텐츠 발행을 처리합니다. 이 데모는 Threads 콘텐츠 발행 권한이 사용되는 방식을 보여드립니다."

**화면 표시 요소**
- 하단 자막 바 (영문 고정)
- 페이지 스크롤은 1회만 천천히

---

## 0:15 – 0:35 | 씬 2: 로그인 및 페르소나 설정 진입

**화면**
- 로그인 페이지 → Google OAuth 로그인 (2초 안에 완료되도록 사전 세션 워밍업)
- 동아리 대시보드 `/clubs/demo-club`
- 좌측 사이드바 "설정(Settings)" → "페르소나(Persona)" 클릭
- 경로: `/clubs/demo-club/settings/persona`

**내레이션**

- 영문: "The operator signs in and opens the persona settings page for their club. This is where external channels are connected."
- 한글: "운영진이 로그인 후 동아리 페르소나 설정 페이지로 이동합니다. 외부 채널 연결은 여기서 이루어집니다."

**화면 표시 요소**
- 주소창의 `/clubs/demo-club/settings/persona` URL 이 2초 이상 보이게
- 사이드바 navigation 경로를 마우스 hover로 강조

---

## 0:35 – 1:05 | 씬 3: Threads 연결 (OAuth 플로우) **[가장 중요]**

**화면**
- 페르소나 설정 페이지의 채널 카드 리스트
- "Threads" 카드 — 상태: "연결되지 않음 (Not connected)"
- "Threads 연결" 버튼 클릭
- 브라우저가 `https://threads.net/oauth/authorize?client_id=...&scope=threads_basic,threads_content_publish&response_type=code&state=...` 로 이동
- **Meta 동의 화면이 노출되면 3초 정지** — scope 목록이 화면에 또렷이 보여야 함
  - "Access your profile information"
  - "Create and publish content"
- Allow 버튼 클릭
- `/api/oauth/threads/callback` 을 경유해 페르소나 설정 페이지로 복귀
- Threads 카드 상태: "연결됨 @your_test_username — 만료 D-60"

**내레이션**

- 영문: "The operator clicks Connect Threads. Draft redirects to Meta's OAuth consent screen, which clearly lists the two requested scopes: threads basic, for reading the account username, and threads content publish, for posting approved drafts. The operator clicks Allow, returns to Draft, and sees the connected account. The access token is stored encrypted on the server."
- 한글: "운영진이 Threads 연결 버튼을 누르면, Meta의 OAuth 동의 화면으로 이동합니다. 두 권한이 명확히 표시됩니다. 계정명 읽기용 threads basic, 승인된 초안 게시용 threads content publish. Allow를 누르고 Draft로 돌아오면 연결된 계정이 표시되고, 액세스 토큰은 서버에 암호화되어 저장됩니다."

**화면 표시 요소**
- OAuth 동의 화면은 반드시 3초 이상 정지
- URL의 `scope=threads_basic,threads_content_publish` 부분이 보이도록 주소창 확대 (OBS zoom 또는 브라우저 줌 125%)

---

## 1:05 – 2:05 | 씬 4: 콘텐츠 초안 생성 및 검토

**화면**
- 사이드바 "콘텐츠 허브" 또는 `/clubs/demo-club/bundles` 로 이동
- "새 번들 만들기" 클릭 → 이벤트 타입 선택 (예: "주간 업데이트")
- AI 고스트라이터가 Threads 초안 생성 (로딩 2초 → 완성)
- 초안 카드에 표시: "Threads · 423 / 500자"
- 초안 본문이 화면에 노출됨 (예시 한국어 + 영문 자막)
- 운영진이 텍스트 영역에서 한두 문장 편집 — "수정 가능"이라는 점을 시각적으로 보여줌
- 편집 후 "변경사항 저장" 클릭

**내레이션**

- 영문: "Draft's AI generates a Threads draft based on the week's Discord activity, respecting the 500-character limit. The operator can edit the draft freely — notice I'm changing one sentence here. Nothing is posted yet."
- 한글: "Draft AI가 이번 주 Discord 활동을 바탕으로 500자 이하의 Threads 초안을 생성합니다. 운영진은 초안을 자유롭게 수정할 수 있습니다. 아직 아무것도 게시되지 않습니다."

**화면 표시 요소**
- 글자수 카운터 "423 / 500" 가 보이게
- 편집 커서의 움직임이 명확하게 (타이핑이 2~3초 이상 지속)

---

## 2:05 – 2:35 | 씬 5: 승인 및 발행

**화면**
- 초안 카드 하단의 "승인하고 발행 (Approve & Publish)" 버튼 클릭
- 확인 모달 노출: "Threads에 게시합니다. 되돌릴 수 없습니다."
- 영문 번역 오버레이: "Publish to Threads. This cannot be undone."
- "게시하기" 확정 클릭
- 발행 진행 스피너 (1~2초)
- 성공 토스트: "Threads에 게시되었습니다" + "게시물 보기 →" 링크

**내레이션**

- 영문: "To publish, the operator explicitly clicks Approve and Publish, confirms in the modal, and only then does Draft call the Threads Graph API. This is a deliberate two-step process — drafts never auto-publish without this click."
- 한글: "발행하려면 운영진이 명시적으로 '승인하고 발행'을 눌러야 하고, 확인 모달에서 한 번 더 확정합니다. 이 클릭 없이는 초안이 자동 발행되지 않습니다."

**화면 표시 요소**
- 확인 모달은 최소 2초 노출
- 클릭 순간 커서에 시각적 ripple 효과가 있으면 더 좋음

---

## 2:35 – 3:05 | 씬 6: Threads 앱에서 실제 게시물 확인

**화면**
- 토스트의 "게시물 보기 →" 링크 클릭 → 새 탭에서 Threads 웹 (https://www.threads.net/@your_test_username) 열림
- 방금 발행된 포스트가 피드 최상단에 노출됨
- 게시물 본문이 Draft에서 승인한 텍스트와 **동일**한지 화면 분할 또는 빠른 탭 전환으로 대조

**내레이션**

- 영문: "The post appears on the operator's Threads account, matching the approved content exactly."
- 한글: "운영진의 Threads 계정에 승인한 내용 그대로 게시됩니다."

**화면 표시 요소**
- 게시물 시간: "방금" 또는 "just now" 가 보이도록
- Threads 피드 배경은 블러 처리하여 타 유저 콘텐츠 노출 방지 (테스트 계정이라도 안전하게)

---

## 3:05 – 3:20 | 씬 7: 데이터 삭제 / 연결 해제

**화면**
- 페르소나 설정 페이지로 복귀 `/clubs/demo-club/settings/persona`
- Threads 카드의 "연결 해제 (Disconnect)" 버튼 클릭
- 확인 모달: "저장된 토큰과 계정 참조가 즉시 삭제됩니다."
- 영문 오버레이: "Stored token and account reference will be deleted immediately."
- 확정 클릭
- 카드 상태가 "연결되지 않음" 으로 복귀

**내레이션**

- 영문: "The operator can disconnect at any time. The stored access token is hard-deleted from the database. For full account data deletion, users can email privacy at dailydraft dot me or visit our data deletion page."
- 한글: "운영진은 언제든 연결을 해제할 수 있으며, 저장된 액세스 토큰은 DB에서 즉시 완전 삭제됩니다. 전체 계정 데이터 삭제는 privacy@dailydraft.me 이메일 또는 데이터 삭제 페이지를 통해 요청 가능합니다."

**화면 표시 요소**
- `https://dailydraft.me/legal/data-deletion` URL 을 하단 자막에 노출

---

## 3:20 – 3:30 | 씬 8: 마무리

**화면**
- Draft 로고 + 정적 텍스트: "Thank you for reviewing Draft." / "Contact: support@dailydraft.me"

**내레이션**

- 영문: "Thank you for reviewing Draft."
- 한글: "검토해 주셔서 감사합니다."

---

## 녹화 체크리스트

- [ ] Meta for Developers 앱에 본인 Threads 계정이 **Tester** 로 사전 등록되어 있음
- [ ] `NEXT_PUBLIC_APP_URL=https://dailydraft.me` 환경변수 확인 (OAuth redirect 가 정확히 이 도메인으로 구성됨)
- [ ] `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET` 프로덕션 환경변수 설정 완료
- [ ] OAuth redirect URI `https://dailydraft.me/api/oauth/threads/callback` 가 Meta 앱 설정에 등록됨
- [ ] 테스트 동아리(`demo-club`) 가 생성되어 있고 운영진 계정이 이 동아리의 operator 권한을 보유
- [ ] 페르소나가 1개 이상 생성되어 있음 (아예 비어 있으면 초안 생성이 안 됨)
- [ ] 녹화 직전에 Threads 카드 상태가 "연결되지 않음" 으로 초기화되어 있음 (재녹화 시 필수)
- [ ] 다른 사용자의 식별 가능 정보(이메일, 실명, 개인 메시지)가 화면에 노출되지 않는지 확인

## OBS 녹화 설정 권장값

| 항목 | 값 |
|------|----|
| 해상도 (Base Canvas) | 1920 × 1080 |
| 출력 해상도 (Output) | 1920 × 1080 (다운스케일 없음) |
| FPS | 30 |
| 비트레이트 | 6000 Kbps (CBR) |
| 인코더 | x264 (CPU) 또는 NVENC H.264 (GPU) |
| 키프레임 간격 | 2초 |
| CPU 사용 프리셋 | veryfast |
| 오디오 샘플링 | 48 kHz |
| 오디오 비트레이트 | 160 Kbps AAC |
| 녹화 형식 | MP4 (mkv로 녹화 후 remux하면 크래시 내성 더 좋음) |

## 내레이션 품질

- 마이크: USB 콘덴서 또는 최소 USB 헤드셋 (노트북 내장 마이크 사용 금지)
- 노이즈 게이트: -40dB 이하 컷
- 포맷: 영문 우선 녹음, 한국어는 자막으로만 보완 가능
- 혹은 무내레이션 + 전체 영문 자막 (Meta 리뷰어에게는 이쪽이 더 안전한 경우도 있음)

## 자막(SRT) 팁

- 모든 한국어 UI가 보이는 씬에서는 해당 버튼/카피의 영문 번역을 하단 자막에 반드시 넣기
  - "Threads 연결" → "Connect Threads"
  - "승인하고 발행" → "Approve & Publish"
  - "연결 해제" → "Disconnect"
- 자막은 화면 하단 1/5 영역, 검정 배경 반투명 + 흰색 텍스트
- 글자 크기는 1080p 기준 36~40px
