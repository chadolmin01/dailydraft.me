# Meta App Review — 데모 영상 스크립트

목표: 리뷰어가 "`threads_content_publish` 권한이 실제로 어떻게 쓰이는지"를
명확히 확인할 수 있어야 합니다. 3~5분, 화면 녹화 + 음성/자막.

## 녹화 준비물

- [ ] 본인 Threads 계정 (테스트 유저로 Meta 앱에 사전 등록된 계정)
- [ ] Draft 프로덕션 환경 (https://draft.co.kr) — 테스트 동아리 1개
- [ ] 스크린 녹화 도구 (OBS, QuickTime 등, 1080p 이상)
- [ ] 영어 자막 또는 영어 내레이션 (Meta 리뷰어는 한국어를 읽지 못함)

## 씬 구성

### 씬 1 — 앱 소개 (15초)
- Draft 랜딩페이지 노출
- 내레이션: "Draft is a SaaS platform for Korean university clubs. Operators
  use it to manage team content, including social media publishing."

### 씬 2 — 로그인 & 페르소나 접속 (20초)
- 이메일 로그인 → 동아리 대시보드
- 좌측 메뉴 → Persona Settings 진입
- 내레이션: "The club operator opens the Persona Settings page, where they
  can connect social accounts."

### 씬 3 — Threads 연결 (OAuth 흐름) (45초) **가장 중요**
- "Threads 연결하기" 버튼 클릭
- Meta OAuth 동의 화면 노출 — **권한 scope가 화면에 명확히 보여야 함**
  (`threads_basic`, `threads_content_publish`)
- "Allow" 클릭 → Draft로 리다이렉트 → "연결됨" 상태 확인
- 내레이션: "The operator authorizes Draft to publish on their behalf. Note
  the scope shown: basic profile and content publishing."

### 씬 4 — 초안 생성 & 승인 (60초)
- Contents Hub → "새 번들 만들기" → 이벤트 선택
- AI 고스트라이터가 Threads용 초안 생성 (500자 이하)
- 초안을 편집해서 보여주기 (사용자가 수정 가능하다는 점 강조)
- "승인하고 발행하기" 클릭 → 확인 모달 → "Threads에 게시하기" 확정
- 내레이션: "The operator reviews the AI-drafted post, edits it if needed,
  and explicitly approves publishing. Nothing is posted without this
  approval step."

### 씬 5 — Threads에 실제 게시된 것 확인 (30초)
- Draft 내 발행 상태 "게시 완료" 표시 + 퍼마링크
- 새 탭에서 Threads 앱/웹 열기 → 방금 올라간 글 확인
- 내레이션: "The post appears on the operator's Threads account exactly as
  approved."

### 씬 6 — 연결 해제 (20초)
- Persona Settings로 돌아가기 → Threads 카드 "해제" 버튼
- 확인 모달 → 해제 완료
- 내레이션: "The operator can disconnect at any time. This revokes Draft's
  stored token."

### 씬 7 — 마무리 (10초)
- 화면에 텍스트: "Thank you for reviewing Draft."

## 주의사항

- **모든 화면은 영어 UI 또는 영문 자막**이어야 합니다. Draft가 한국어 UI라면
  자막으로 보완하거나, 녹화 중 중요한 UI 요소(버튼 라벨 등) 위에 영문 번역
  오버레이를 추가하세요.
- 사전 녹화 없이 실시간으로 녹화 — Meta는 "실제로 동작하는지"를 확인합니다.
- OAuth scope가 보이는 화면은 반드시 2~3초 이상 노출 (리뷰어가 확인 가능하게).
- 개인정보(다른 유저의 글, 이메일 주소 등)는 블러 처리하거나 테스트 계정만 사용.

## 업로드

- MP4, H.264, 1080p
- 파일 크기 <100MB (Meta 제한)
- App Review 제출란 "Screen Recording" 필드에 업로드
